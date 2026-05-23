"""
Groundstate cloud Managed Agent integration.
Handles secure, streaming communications with Google's Managed Agents API
using the new google-genai SDK, passing local tools for calendar & mail coordination.
"""
from typing import Generator, Optional, Dict, Any
import os
import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

def interact_with_agent(
    input_text: str,
    previous_interaction_id: Optional[str] = None
) -> Generator[Dict[str, Any], None, None]:
    """
    Communicates with the Google Managed Agent 'antigravity-preview-05-2026' in a streaming fashion.
    Integrates our local Workspace tools and yields real-time reasoning and execution deltas.
    
    Args:
        input_text: The intent payload or the prompt (confidentiality proof) to send.
        previous_interaction_id: The session ID of the prior interaction (for history mapping).
        
    Yields:
        Dictionary chunks containing 'event_type', 'delta', 'step_type', and 'interaction_id'.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables or .env file.")

    # Initialize the official google-genai Client
    client = genai.Client(api_key=api_key)

    # Import local workspace tools
    from src.tools import (
        list_upcoming_events,
        schedule_consultation,
        reschedule_conflicting_appointment,
        draft_confirmation_email
    )

    tools = [
        list_upcoming_events,
        schedule_consultation,
        reschedule_conflicting_appointment,
        draft_confirmation_email
    ]

    params = {
        "agent": "antigravity-preview-05-2026",
        "input": input_text,
        "tools": tools,
        "generation_config": {
            "thinking_config": {
                "thinking_level": "minimal"
            }
        },
        "stream": True
    }

    if previous_interaction_id:
        params["previous_interaction_id"] = previous_interaction_id
        logger.info("Resuming Managed Agent session ID: %s", previous_interaction_id)
    else:
        logger.info("Starting fresh Managed Agent session.")

    try:
        # Start streaming the step-based agent interaction
        interaction_stream = client.interactions.create(**params)
        
        active_interaction_id = previous_interaction_id

        for event in interaction_stream:
            # Capture the interaction ID if returned by the API
            if hasattr(event, "interaction_id") and event.interaction_id:
                active_interaction_id = event.interaction_id

            chunk = {
                "event_type": getattr(event, "event_type", "unknown"),
                "interaction_id": active_interaction_id,
                "delta": ""
            }

            # Check where delta text might reside in standard google-genai stream structures
            if hasattr(event, "delta") and event.delta:
                chunk["delta"] = event.delta
            elif hasattr(event, "step") and event.step:
                chunk["step_type"] = getattr(event.step, "type", "unknown")
                if hasattr(event.step, "delta") and event.step.delta:
                    chunk["delta"] = event.step.delta

            # If there's content to emit, yield it
            if chunk["delta"] or chunk.get("step_type"):
                yield chunk

    except Exception as e:
        logger.error("Error during Managed Agent stream execution: %s", e)
        yield {
            "event_type": "error",
            "delta": f"\n[Managed Agent Connection Error: {str(e)}]",
            "interaction_id": previous_interaction_id
        }
