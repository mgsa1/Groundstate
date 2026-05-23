"""
Groundstate cloud Managed Agent integration.
Drives Google's Managed Agents API (`client.interactions.create`) with our local
Workspace tools: streams reasoning deltas, executes function calls locally,
submits results back via `previous_interaction_id`, repeats until the
interaction reaches a terminal state.
"""
from typing import Generator, Optional, Dict, Any, List
import os
import json
import logging
from google import genai

logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-3.5-flash"


def _execute_function_call(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    from src.tools import TOOL_DISPATCH
    fn = TOOL_DISPATCH.get(name)
    if fn is None:
        return {"status": "error", "message": f"Unknown tool: {name}"}
    return fn(**(arguments or {}))


def interact_with_agent(
    input_text: str,
    previous_interaction_id: Optional[str] = None,
) -> Generator[Dict[str, Any], None, None]:
    """
    Drives a Managed Agent interaction to completion, yielding streaming chunks
    to the caller. Resolves any tool-call rounds by executing the local Python
    tools and resuming the interaction via `previous_interaction_id`.

    Yields dicts with keys: `event_type`, `delta`, `interaction_id`,
    and optionally `step_type`.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables or .env file.")

    from src.tools import TOOL_DECLARATIONS

    client = genai.Client(api_key=api_key)

    base_params: Dict[str, Any] = {
        "model": MODEL_NAME,
        "tools": TOOL_DECLARATIONS,
        "generation_config": {"thinking_level": "minimal"},
        "stream": True,
    }

    active_interaction_id = previous_interaction_id
    current_input: Any = input_text
    current_prev_id = previous_interaction_id

    # Safety bound — a runaway model shouldn't ping-pong forever
    MAX_ROUNDS = 6

    for _round in range(MAX_ROUNDS):
        params = {**base_params, "input": current_input}
        if current_prev_id:
            params["previous_interaction_id"] = current_prev_id
            logger.info("Resuming Managed Agent interaction: %s", current_prev_id)
        else:
            logger.info("Starting fresh Managed Agent interaction.")

        try:
            stream = client.interactions.create(**params)
        except Exception as e:
            logger.error("Managed Agent request failed: %s", e)
            yield {
                "event_type": "error",
                "delta": f"\n[Managed Agent Connection Error: {e}]",
                "interaction_id": active_interaction_id,
            }
            return

        final_status: str = ""
        # Buffers function-call steps streamed during this round, keyed by step index.
        # Each entry: {"id": str, "name": str, "args_buf": str}
        pending_calls: Dict[int, Dict[str, Any]] = {}

        try:
            for event in stream:
                event_type = getattr(event, "event_type", "")

                if event_type == "interaction.created":
                    interaction = getattr(event, "interaction", None)
                    if interaction is not None:
                        active_interaction_id = interaction.id
                    yield {
                        "event_type": event_type,
                        "delta": "",
                        "interaction_id": active_interaction_id,
                    }

                elif event_type == "step.start":
                    step = getattr(event, "step", None)
                    step_type = getattr(step, "type", "unknown") if step else "unknown"
                    if step_type == "function_call" and step is not None:
                        idx = getattr(event, "index", None)
                        if idx is not None:
                            pending_calls[idx] = {
                                "id": getattr(step, "id", ""),
                                "name": getattr(step, "name", ""),
                                "args_buf": "",
                            }
                    yield {
                        "event_type": event_type,
                        "delta": "",
                        "interaction_id": active_interaction_id,
                        "step_type": step_type,
                    }

                elif event_type == "step.delta":
                    delta = getattr(event, "delta", None)
                    delta_type = getattr(delta, "type", "") if delta else ""
                    if delta_type == "text":
                        text = getattr(delta, "text", "") or ""
                        if text:
                            yield {
                                "event_type": event_type,
                                "delta": text,
                                "interaction_id": active_interaction_id,
                                "step_type": "text",
                            }
                    elif delta_type == "thought_summary":
                        content = getattr(delta, "content", None)
                        text = getattr(content, "text", "") if content else ""
                        if text:
                            yield {
                                "event_type": event_type,
                                "delta": text,
                                "interaction_id": active_interaction_id,
                                "step_type": "thought_summary",
                            }
                    elif delta_type == "arguments_delta":
                        idx = getattr(event, "index", None)
                        frag = getattr(delta, "arguments", "") or ""
                        if idx is not None and idx in pending_calls and frag:
                            pending_calls[idx]["args_buf"] += frag

                elif event_type == "interaction.completed":
                    interaction = getattr(event, "interaction", None)
                    final_status = getattr(interaction, "status", "") if interaction else ""

                elif event_type == "error":
                    err = getattr(event, "error", None) or "unknown error"
                    yield {
                        "event_type": "error",
                        "delta": f"\n[Managed Agent Error: {err}]",
                        "interaction_id": active_interaction_id,
                    }
                    return
        except Exception as e:
            logger.error("Error reading Managed Agent stream: %s", e)
            yield {
                "event_type": "error",
                "delta": f"\n[Managed Agent Stream Error: {e}]",
                "interaction_id": active_interaction_id,
            }
            return

        if final_status != "requires_action" or not pending_calls:
            return  # completed, failed, cancelled, or no tools to run → done

        # Execute each pending function call locally and prepare result steps to submit back.
        result_inputs: List[Dict[str, Any]] = []
        for idx in sorted(pending_calls):
            call = pending_calls[idx]
            try:
                args = json.loads(call["args_buf"]) if call["args_buf"].strip() else {}
            except json.JSONDecodeError as e:
                logger.error("Could not parse tool args for %s: %s (buf=%r)", call["name"], e, call["args_buf"])
                args = {}

            yield {
                "event_type": "tool_call",
                "delta": f"\n[Calling {call['name']}({json.dumps(args)})]",
                "interaction_id": active_interaction_id,
                "step_type": "function_call",
            }
            try:
                payload = _execute_function_call(call["name"], args)
                is_error = isinstance(payload, dict) and payload.get("status") == "error"
            except Exception as e:
                logger.error("Local tool %s raised: %s", call["name"], e)
                payload = {"status": "error", "message": str(e)}
                is_error = True

            result_inputs.append({
                "type": "function_result",
                "call_id": call["id"],
                "name": call["name"],
                "result": json.dumps(payload, default=str),
                "is_error": is_error,
            })

        current_input = result_inputs
        current_prev_id = active_interaction_id

    logger.warning("Managed Agent interaction hit MAX_ROUNDS=%d; stopping.", MAX_ROUNDS)
    yield {
        "event_type": "status",
        "delta": f"\n[Stopped: exceeded {MAX_ROUNDS} tool-call rounds]",
        "interaction_id": active_interaction_id,
    }
