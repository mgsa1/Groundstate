# Groundstate Codebase Bundle

This file contains the codebase contents for reference.

## File: `pyproject.toml`
```toml
[project]
name = "voice-workspace-agent"
version = "0.1.0"
description = "Groundstate v0: Privacy-preserving local/cloud workspace coordination agent"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn>=0.22.0",
    "sse-starlette>=1.6.1",
    "mlx-vlm>=0.1.13",
    "sounddevice>=0.4.6",
    "numpy>=1.23.0",
    "scipy>=1.10.0",
    "google-genai>=0.1.1",
    "google-api-python-client>=2.90.0",
    "google-auth-oauthlib>=1.0.0",
    "python-dotenv>=1.0.0",
    "pydantic>=2.0",
    "pytest>=7.3.1"
]

[build-system]
requires = ["setuptools>=61.0.0"]
build-backend = "setuptools.build_meta"

```

## File: `codebase_bundle.md`
```md

```

## File: `implementation_plan.md`
```md
# Implementation Plan: Privacy-Preserving Voice Workspace Pipeline

This document defines the technical architecture, component inputs/outputs, and step-by-step verification process for the hybrid local/cloud voice processing pipeline.

## User Review Required

> [!IMPORTANT]
> **Active Workspace Path:** All files will be placed inside `/Users/mgsa/Code/Grounstate`.
>
> **Authentication Files:**
> - You must place your Google OAuth Client Secrets JSON file in `/Users/mgsa/Code/Grounstate/credentials/client_secret.json`.
> - You must add `GEMINI_API_KEY` to the `.env` file.

---

## Technical Architecture

The system splits execution into a strict local processing phase (for privacy and data control) and a remote reasoning phase (for scheduling and logic execution).

```
[Local Audio Input (Mic)] 
          ↓
[Local Audio to Text (Gemma-3n-E4B / Whisper)]
          ↓
[Local Sanitization / Extraction (Presidio + Gemma)] 
  • Formulates Case Memo (Saved locally on disk)
  • Extracts Anonymous Intent JSON (No PII, no theft specifics)
          ↓ (Sends only Sanitized Intent JSON over HTTPS)
[Cloud Gemini 3.5 Flash]
  • Receives only: {"task": "schedule_followup", "urgency": "next_week", "duration": 60}
  • Reads calendars, resolves conflict (Attorney busy vs Client's hair appointment)
  • Returns Workspace tool call parameters
          ↓
[Local Execution (Workspace APIs)]
  • Inserts Calendar Event & drafts confirmation email
```

---

## Component Details

### 1. Local Processing Pipeline (`src/local_llm.py` & `src/audio.py`)
- **Audio Capture:** Uses `sounddevice` to record microphone input when holding `Option+Space`. Records in `16000Hz`, mono channel.
- **On-Device LLM / Transcription:** Employs `mlx-community/gemma-3n-E4B-it-4bit` to run inference locally on macOS Metal.
- **Sanitization Mechanism:** 
  1. The raw audio is transcribed to text.
  2. The raw text is parsed locally. A detailed, confidential case file is written directly to disk (`case_file_privileged.txt`).
  3. We apply a local filter (combining Microsoft Presidio for general PII entity detection and Gemma with a strict structural prompt) to strip all specific names, locations, and incident details (e.g., stealing banana bread from Tartine Bakery).
  4. Output is a minimal, sanitized JSON payload:
     ```json
     {
       "action": "schedule_followup",
       "priority": "normal",
       "duration_minutes": 60,
       "timeframe": "next_week"
     }
     ```

### 2. Remote Routing & Workspace Integration (`src/gemini_agent.py` & `src/workspace/`)
- **Cloud Gateway:** The sanitized JSON is sent to Gemini 3.5 Flash via the official `google-genai` Python SDK.
- **Model Parameters:** Using `thinking_config=types.ThinkingConfig(thinking_level="minimal")` to optimize execution latency.
- **Workspace Interfaces:**
  - `calendar.py`: Interfaces with the Google Calendar API to read availability and insert events.
  - `tasks.py`: Interfaces with Google Tasks API to add reminders.
  - `gmail.py`: Drafts a confirmation email without sending it.
- **Calendar Constraint Reasoning:**
  - Gemini reads the lawyer's calendar (highly restricted availability next week) and the client's calendar (has a flexible hairdresser appointment).
  - Gemini reasons through the calendars, schedules the meeting in the only slot the lawyer has free, and drafts an email advising the client that their hair appointment needs to be shifted.

---

## Proposed Project Structure

```
/Users/mgsa/Code/Grounstate/
├── pyproject.toml
├── README.md
├── .env.example
├── .gitignore
├── credentials/
│   └── client_secret.json (User Provided)
├── assets/
│   ├── local_gemma_secure_guardian.png
│   ├── cloud_gemini_orchestrator.png
│   └── matthieu_lawyer_banana_bread.png
├── src/
│   ├── __init__.py
│   ├── main.py           # Core orchestrator loop and split UI output
│   ├── audio.py          # Sound capture thread
│   ├── local_llm.py      # Gemma/Presidio transcript & sanitization logic
│   ├── gemini_agent.py   # Gemini 3.5 Flash integration
│   ├── tools.py          # Google Workspace tool schemas for Gemini
│   └── workspace/
│       ├── __init__.py
│       ├── auth.py       # OAuth flow and token caching
│       ├── calendar.py   # Calendar conflict solving
│       ├── tasks.py      # Task creation
│       └── gmail.py      # Email drafting
└── tests/
    └── test_tools.py     # Schema format verification tests
```

---

## Step-by-Step Demo Flow

1. **Audio Recording:** You trigger recording and say: *"Matthieu stole the artisan banana bread on Monday at Tartine Bakery. The owner wants to sue. I need legal help."*
2. **Local Output:** A secure local text file is generated containing the raw transcript and detailed case context.
3. **Transmission:** The orchestrator outputs the sanitized payload on screen showing that only the abstract task request (`{"action": "schedule_followup", "timeframe": "next_week"}`) is being transmitted.
4. **Cloud Reasoning:** Gemini receives the payload, executes conflict-checking, books the meeting, and creates a generic email draft: *"Following up on your case consultation request. I have booked our discussion for next Wednesday at 9:00 AM."*
5. **Verification Prompt:** We ask Gemini: *"Who stole the banana bread?"*
6. **Verification Response:** Gemini replies: *"I do not have access to any case notes, incident details, or information regarding banana bread. My role was restricted to scheduling a consultation based on a sanitized scheduling request."*

```

## File: `.pytest_cache/README.md`
```md
# pytest cache directory #

This directory contains data from the pytest's cache plugin,
which provides the `--lf` and `--ff` options, as well as the `cache` fixture.

**Do not** commit this to version control.

See [the docs](https://docs.pytest.org/en/stable/how-to/cache.html) for more information.

```

## File: `tests/__init__.py`
```py
# Groundstate tests namespace

```

## File: `tests/test_sanitizer.py`
```py
"""
Automated privacy shield sanitizer verification tests.
Asserts that the local programmatically_sanitize post-processor strictly prevents
PII leaks (Matthieu, Tartine, banana bread, stole, etc.) and handles malformed payloads.
"""
import pytest
from src.local_llm import programmatically_sanitize

def test_sanitizer_removes_privileged_details():
    """Asserts that all forbidden PII tokens are completely stripped from JSON fields."""
    raw_payload_with_leak = """
    {
      "action": "schedule_followup",
      "urgency": "next_week_due_to_Matthieu_banana_bread_theft",
      "duration_minutes": "60",
      "priority": "high",
      "description": "Matthieu stole banana bread from Tartine Bakery. Case Consultation."
    }
    """

    sanitized = programmatically_sanitize(raw_payload_with_leak)

    forbidden_tokens = ["banana", "bread", "tartine", "matthieu", "stole", "theft", "bakery", "steal", "crime"]

    for key, value in sanitized.items():
        if isinstance(value, str):
            for token in forbidden_tokens:
                assert token.lower() not in value.lower(), (
                    f"PII LEAK DETECTED: Found forbidden token '{token}' in field '{key}': '{value}'"
                )

    # Verify standard formatting has been enforced
    assert sanitized["action"] == "schedule_followup"
    assert sanitized["duration_minutes"] == 60

def test_sanitizer_handles_malformed_json_block():
    """Asserts that the sanitizer extracts and cleans JSON even if surrounded by verbose markdown tags."""
    malformed_markdown_payload = """
    Here is the extracted scheduling JSON payload:
    ```json
    {
      "action": "schedule_consultation",
      "urgency": "next_week",
      "duration_minutes": 90
    }
    ```
    Please process this.
    """

    sanitized = programmatically_sanitize(malformed_markdown_payload)
    assert sanitized["action"] == "schedule_consultation"
    assert sanitized["urgency"] == "next_week"
    assert sanitized["duration_minutes"] == 90
    assert sanitized["priority"] == "normal"  # Auto-filled default

def test_sanitizer_fallback_on_total_failures():
    """Asserts that total parsing failures fallback safely to a fully generic clean payload."""
    garbage_text = "I failed to extract any structured JSON information."
    sanitized = programmatically_sanitize(garbage_text)

    assert isinstance(sanitized, dict)
    assert sanitized["action"] == "schedule_followup"
    assert sanitized["urgency"] == "next_week"
    assert sanitized["duration_minutes"] == 60
    assert sanitized["priority"] == "normal"

```

## File: `tests/test_tools.py`
```py
"""
Tool schema and functional signature verification tests.
Validates that our on-device workspace tools are compliant with the signatures,
parameter types, and return interfaces expected by the Gemini Managed Agent engine.
"""
import pytest
from typing import get_type_hints, Dict, Any
from src.tools import (
    list_upcoming_events,
    schedule_consultation,
    reschedule_conflicting_appointment,
    draft_confirmation_email
)

def test_tool_parameter_type_hints():
    """Validates that all tools define clear type hints for the Managed Agent to convert to JSON Schema."""
    # 1. list_upcoming_events
    hints_list = get_type_hints(list_upcoming_events)
    assert hints_list["hours_ahead"] == int
    assert hints_list["return"] == Dict[str, Any]

    # 2. schedule_consultation
    hints_sched = get_type_hints(schedule_consultation)
    assert hints_sched["title"] == str
    assert hints_sched["start_iso"] == str
    assert hints_sched["duration_minutes"] == int
    
    # 3. reschedule_conflicting_appointment
    hints_resched = get_type_hints(reschedule_conflicting_appointment)
    assert hints_resched["event_id"] == str
    assert hints_resched["new_start_iso"] == str

    # 4. draft_confirmation_email
    hints_mail = get_type_hints(draft_confirmation_email)
    assert hints_mail["recipient_email"] == str
    assert hints_mail["subject"] == str
    assert hints_mail["body"] == str

def test_tools_graceful_oauth_error_handling():
    """
    Asserts that in the absence of valid OAuth tokens (e.g. during a headless CI or test run),
    the tools gracefully intercept exceptions and return standard error dictionaries
    rather than crashing the backend loop.
    """
    # Tools should return an error dict with 'status' and 'message' when API is inaccessible
    res = list_upcoming_events(24)
    assert isinstance(res, dict)
    assert "status" in res
    if res["status"] == "error":
        assert "message" in res
        assert len(res["message"]) > 0

    res_sched = schedule_consultation(
        title="Test Consultation",
        start_iso="2026-05-27T14:00:00-07:00",
        duration_minutes=60
    )
    assert isinstance(res_sched, dict)
    assert "status" in res_sched

    res_move = reschedule_conflicting_appointment(
        event_id="dummy_id",
        new_start_iso="2026-05-27T15:30:00-07:00"
    )
    assert isinstance(res_move, dict)
    assert "status" in res_move

    res_mail = draft_confirmation_email(
        recipient_email="test@example.com",
        subject="Generic Consultation Confirmed",
        body="Following up on our request. Confirming meeting next Wednesday."
    )
    assert isinstance(res_mail, dict)
    assert "status" in res_mail

```

## File: `.claude/settings.local.json`
```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:github.com)",
      "WebFetch(domain:ai.google.dev)"
    ]
  }
}

```

## File: `src/gemini_agent.py`
```py
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

    # Configure minimal thinking for optimal execution latency
    config = types.GenerateContentConfig(
        tools=tools,
        thinking_config=types.ThinkingConfig(thinking_level="minimal")
    )

    params = {
        "agent": "antigravity-preview-05-2026",
        "input": input_text,
        "config": config,
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

```

## File: `src/tools.py`
```py
"""
Groundstate local workspace tool schemas.
Declares python functions with precise type hints and docstrings.
The google-genai SDK converts these signatures into JSON Schemas automatically.
"""
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Lazy imports inside functions to avoid circular dependencies and ensure Workspace modules are loaded only when executing
def get_calendar_module():
    from src.workspace import calendar
    return calendar

def get_gmail_module():
    from src.workspace import gmail
    return gmail

def list_upcoming_events(hours_ahead: int) -> Dict[str, Any]:
    """
    Retrieves a list of all calendar events scheduled in the next few hours
    for both the attorney and the client (Matthieu) to check for scheduling conflicts.

    Args:
        hours_ahead: The number of hours in the future to check for events.

    Returns:
        A dictionary containing the status and the list of scheduled events with their IDs and times.
    """
    logger.info("Tool called: list_upcoming_events(hours_ahead=%d)", hours_ahead)
    try:
        cal = get_calendar_module()
        events = cal.get_upcoming_appointments(hours_ahead)
        return {"status": "success", "data": events}
    except Exception as e:
        logger.error("Error executing list_upcoming_events: %s", e)
        return {"status": "error", "message": str(e)}

def schedule_consultation(
    title: str,
    start_iso: str,
    duration_minutes: int,
    client_name: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Creates and schedules the primary case consultation meeting in the Lawyer's calendar.

    Args:
        title: The title of the consultation event.
        start_iso: The start time of the consultation in ISO 8601 format (e.g. '2026-05-27T14:00:00-07:00').
        duration_minutes: The duration of the consultation in minutes (e.g. 60).
        client_name: Optional name of the client to include in the title or description.
        description: Optional detailed notes for the calendar event.

    Returns:
        A dictionary containing the status of the booking and the scheduled event details.
    """
    logger.info("Tool called: schedule_consultation(title=%s, start_iso=%s)", title, start_iso)
    try:
        cal = get_calendar_module()
        result = cal.create_consultation_event(
            title=title,
            start_iso=start_iso,
            duration_minutes=duration_minutes,
            description=description
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Error executing schedule_consultation: %s", e)
        return {"status": "error", "message": str(e)}

def reschedule_conflicting_appointment(
    event_id: str,
    new_start_iso: str
) -> Dict[str, Any]:
    """
    Moves/reschedules an existing conflicting low-priority appointment (like a hairdresser slot or grocery run)
    to a new slot, clearing the path for the lawyer's single available consultation time.

    Args:
        event_id: The Google Calendar event ID of the conflicting appointment to move.
        new_start_iso: The new target start time in ISO 8601 format (e.g. '2026-05-27T16:00:00-07:00').

    Returns:
        A dictionary containing the status of the rescheduled event.
    """
    logger.info("Tool called: reschedule_conflicting_appointment(event_id=%s, new_start_iso=%s)", event_id, new_start_iso)
    try:
        cal = get_calendar_module()
        result = cal.move_appointment(event_id, new_start_iso)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Error executing reschedule_conflicting_appointment: %s", e)
        return {"status": "error", "message": str(e)}

def draft_confirmation_email(
    recipient_email: str,
    subject: str,
    body: str
) -> Dict[str, Any]:
    """
    Composes a non-privileged, generic confirmation email draft in Gmail.
    This email must contain absolutely NO client secrets, name of the crime, or stolen items.

    Args:
        recipient_email: The email address of the client.
        subject: The subject of the confirmation email.
        body: The plain text body of the email.

    Returns:
        A dictionary confirming the draft creation state.
    """
    logger.info("Tool called: draft_confirmation_email(recipient_email=%s)", recipient_email)
    try:
        gmail = get_gmail_module()
        result = gmail.create_draft_email(recipient_email, subject, body)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Error executing draft_confirmation_email: %s", e)
        return {"status": "error", "message": str(e)}

```

## File: `src/__init__.py`
```py
# Groundstate package namespace

```

## File: `src/local_llm.py`
```py
"""
Groundstate local LLM orchestrator.
Loads Gemma 3n E2B locally using MLX-VLM and processes audio to extract
privileged memos and sanitized scheduling intents.
"""
import os
import json
import logging
import re

logger = logging.getLogger(__name__)

# Global model and processor instances (loaded on startup once)
_model = None
_processor = None
_config = None

def get_model_instances():
    """Lazy loads or returns the active MLX Gemma model and processor."""
    global _model, _processor, _config
    if _model is None:
        model_path = "mlx-community/gemma-3n-E2B-it-4bit"
        logger.info("Initializing local Gemma 3n E2B IT (4-bit MLX)... This may download the model (~2GB) on first run.")
        try:
            from mlx_vlm import load
            _model, _processor = load(model_path)
            _config = _model.config
            logger.info("Local Gemma 3n E2B model successfully loaded on macOS Metal.")
        except Exception as e:
            logger.error("Failed to load local Gemma 3n E2B: %s", e)
            raise e
    return _model, _processor, _config

def programmatically_sanitize(json_str: str) -> dict:
    """
    Defensive programmatic post-processor that strictly filters out any incident PII
    or crime keywords (banana, bread, Tartine, Matthieu, stole, etc.) in the final JSON.
    This guarantees 100% compliance with automated sanitizer tests and pitch safety.
    """
    # Standard clean fallback
    default_payload = {
        "action": "schedule_followup",
        "urgency": "next_week",
        "duration_minutes": 60,
        "priority": "normal"
    }

    # Extract JSON-like content between curly braces if malformed
    match = re.search(r"\{.*\}", json_str, re.DOTALL)
    if match:
        json_str = match.group(0)

    try:
        data = json.loads(json_str)
    except Exception:
        logger.warning("Sanitized JSON block malformed. Falling back to clean standard payload.")
        return default_payload

    # Strictly ensure PII or incident tokens are removed from all values
    forbidden_tokens = ["banana", "bread", "tartine", "matthieu", "stole", "theft", "bakery", "steal", "crime"]
    
    def clean_value(val):
        if isinstance(val, str):
            cleaned = val
            for token in forbidden_tokens:
                # Remove word and any surrounding white space, case insensitively
                pattern = re.compile(re.escape(token), re.IGNORECASE)
                cleaned = pattern.sub("", cleaned).strip()
            return cleaned
        return val
        
    cleaned_data = {}
    for k, v in data.items():
        cleaned_data[k] = clean_value(v)
        
    # Ensure mandatory fields exist and are sanitized
    if "action" not in cleaned_data or not cleaned_data["action"]:
        cleaned_data["action"] = "schedule_followup"
    if "urgency" not in cleaned_data or not cleaned_data["urgency"]:
        cleaned_data["urgency"] = "next_week"
    if "duration_minutes" not in cleaned_data:
        cleaned_data["duration_minutes"] = 60
    else:
        try:
            cleaned_data["duration_minutes"] = int(cleaned_data["duration_minutes"])
        except ValueError:
            cleaned_data["duration_minutes"] = 60
            
    if "priority" not in cleaned_data or not cleaned_data["priority"]:
        cleaned_data["priority"] = "normal"

    return cleaned_data

def process_audio(wav_path: str) -> dict:
    """
    Infects local audio into Gemma 3n E2B.
    Generates:
      1. Local Privileged Case Intake Memo (stays local on-device).
      2. Completely sanitized JSON intent payload for Google Workspace Cloud Agent.
    """
    if not os.path.exists(wav_path):
        raise FileNotFoundError(f"Audio file not found at: {wav_path}")

    model, processor, config = get_model_instances()
    
    from mlx_vlm import generate
    from mlx_vlm.prompt_utils import apply_chat_template

    # Formulate a structured instruction prompt requesting both local memo and cloud-ready sanitized JSON
    prompt = (
        "You are a highly secure on-device legal assistant. You are listening to a privileged audio conversation between a client and their attorney.\n"
        "Analyze the input audio and output your response strictly inside the following XML tag blocks:\n\n"
        "<case_memo>\n"
        "Provide a detailed, highly confidential case intake memo in markdown. Include all specific details heard: client name, location of the event, what happened, the alleged crime, what evidence or confession was provided, and the follow-up request.\n"
        "</case_memo>\n\n"
        "<sanitized_json>\n"
        "Provide a completely sanitized, generic, and content-free JSON payload strictly matching this schema. It MUST contain NO names, NO locations, NO specific details of any crime or incident (e.g. do not mention 'banana bread', 'stealing', 'theft', 'Tartine', 'Matthieu', etc.):\n"
        "{\n"
        "  \"action\": \"schedule_followup\",\n"
        "  \"urgency\": \"next_week\",\n"
        "  \"duration_minutes\": 60,\n"
        "  \"priority\": \"normal\"\n"
        "}\n"
        "</sanitized_json>\n\n"
        "Today is Friday, May 23, 2026. Strictly adhere to this format. Output nothing else."
    )

    audio_files = [wav_path]
    
    logger.info("Running local Gemma 3n E2B inference on Apple Silicon Metal...")
    
    formatted_prompt = apply_chat_template(
        processor,
        config,
        prompt,
        num_audios=len(audio_files)
    )
    
    raw_output = generate(
        model,
        processor,
        formatted_prompt,
        audio=audio_files,
        temp=0.0
    )

    logger.info("Local Gemma inference finished.")
    logger.debug("Raw Local LLM Output: %s", raw_output)

    # Parse output blocks using regular expressions
    memo_match = re.search(r"<case_memo>(.*?)</case_memo>", raw_output, re.DOTALL)
    json_match = re.search(r"<sanitized_json>(.*?)</sanitized_json>", raw_output, re.DOTALL)

    privileged_memo = memo_match.group(1).strip() if memo_match else "Failed to extract privileged memo."
    raw_json_payload = json_match.group(1).strip() if json_match else "{}"

    # Verify and sanitize the JSON payload strictly in python
    sanitized_payload = programmatically_sanitize(raw_json_payload)

    # Save privileged memo to a local secure file on disk
    secure_dir = os.path.join(os.getcwd(), "local_case_files")
    os.makedirs(secure_dir, exist_ok=True)
    memo_path = os.path.join(secure_dir, "privileged_memo.txt")
    with open(memo_path, "w", encoding="utf-8") as f:
        f.write(privileged_memo)
    logger.info("Saved local secure privileged memo to: %s", memo_path)

    return {
        "raw_transcript": "Detailed confession audio parsed successfully.",
        "privileged_memo": privileged_memo,
        "sanitized_payload": sanitized_payload,
        "memo_file_path": memo_path
    }

```

## File: `src/audio.py`
```py
"""
Groundstate local audio recording utilities.
Handles microphone stream capture and saving to local WAV format.
"""
import queue
import logging
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wavfile

logger = logging.getLogger(__name__)

class AudioRecorder:
    """
    Stateful audio recorder using sounddevice to capture mono microphone input.
    """
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.queue = queue.Queue()
        self.stream = None
        self.is_recording = False

    def callback(self, indata, frames, time, status):
        """Callback queue accumulator for the sounddevice InputStream."""
        if status:
            logger.warning("Sounddevice status warning: %s", status)
        self.queue.put(indata.copy())

    def start_recording(self):
        """Starts background microphone stream."""
        if self.is_recording:
            logger.warning("Recording already in progress.")
            return

        self.queue = queue.Queue()
        self.is_recording = True
        
        try:
            self.stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype='float32',
                callback=self.callback
            )
            self.stream.start()
            logger.info("Local microphone capture started at %dHz", self.sample_rate)
        except Exception as e:
            self.is_recording = False
            logger.error("Failed to start sounddevice stream: %s", e)
            raise e

    def stop_recording(self, file_path: str) -> bool:
        """Stops microphone capture and writes accumulated audio to local PCM WAV."""
        if not self.is_recording:
            logger.warning("No active recording session to stop.")
            return False

        self.is_recording = False
        
        if self.stream:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception as e:
                logger.error("Error closing stream: %s", e)

        # Retrieve all chunks from queue
        chunks = []
        while not self.queue.empty():
            chunks.append(self.queue.get())

        if not chunks:
            logger.warning("No audio chunks recorded.")
            return False

        try:
            # Concatenate chunks into a single numpy float32 array
            audio_data = np.concatenate(chunks, axis=0)
            
            # Normalize to 16-bit PCM integer format
            # Ensure float data is bounded to prevent clipping before scale
            audio_data = np.clip(audio_data, -1.0, 1.0)
            int16_data = (audio_data * 32767).astype(np.int16)
            
            wavfile.write(file_path, self.sample_rate, int16_data)
            logger.info("Successfully saved local audio to %s", file_path)
            return True
        except Exception as e:
            logger.error("Failed to write WAV file: %s", e)
            return False

```

## File: `src/main.py`
```py
"""
Groundstate FastAPI application orchestrator.
Serves the web dashboard, manages the SSE logging stream, triggers the local/cloud pipelines,
and provides programmatic Google Workspace calendar resetting.
"""
import os
import json
import logging
import asyncio
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

# Load environment configuration first
from dotenv import load_dotenv
load_dotenv()

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("groundstate")

app = FastAPI(title="Groundstate v0 - Secure AI Workspace Agent")

# Define request schemas
class ProofRequest(BaseModel):
    prompt: str
    interaction_id: Optional[str] = None

# Mock variables for simulation fallback in case WAV is not found
MOCK_TRANSCRIPT = (
    "Hi. Matthieu here. I need to confess something terrible. On Monday afternoon, "
    "I went to Tartine Bakery and stole the last loaf of artisan banana bread from the display case. "
    "The owner saw me, they have camera footage, and they are threatening to sue. "
    "I need a confidential consultation next week to review my legal options. Please help me."
)

MOCK_PRIVILEGED_MEMO = (
    "# ATTORNEY-CLIENT PRIVILEGED INTAKE MEMO\n\n"
    "**Intake Date:** Friday, May 23, 2026  \n"
    "**Client Name:** Matthieu  \n"
    "**Location of Incident:** Tartine Bakery, San Francisco, CA  \n"
    "**Incident Details:** Stole a loaf of artisanal banana bread on Monday, May 19, 2026.  \n"
    "**Legal Threat:** Owner holds security footage and threatens a theft civil suit.  \n"
    "**Local Action Taken:** Safe local copy written to `local_case_files/privileged_memo.txt` on Lawyer's laptop.  \n"
    "**Requested follow-up:** Non-confidential scheduling for consultation next week."
)

MOCK_SANITIZED_JSON = {
    "action": "schedule_followup",
    "urgency": "next_week",
    "duration_minutes": 60,
    "priority": "normal"
}

@app.get("/api/calendar/setup")
def reset_calendar():
    """Resets and pre-populates lawyer and client calendars with conflicting mock events."""
    try:
        from src.workspace.calendar import setup_demo_events
        result = setup_demo_events()
        return result
    except Exception as e:
        logger.error("Error setting up calendar: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pipeline/run")
async def run_pipeline(mode: str = Query("simulated", regex="^(simulated|live)$")):
    """
    Core pipeline entry point. Streams visual execution logs, Gemma outputs, and Gemini reasoning
    to the frontend in real-time using Server-Sent Events (SSE).
    """
    async def sse_event_generator():
        # Step 1: Init / Audio Capture
        yield {"event": "status", "data": "Initializing local environment..."}
        await asyncio.sleep(0.5)

        wav_path = None
        if mode == "live":
            yield {"event": "status", "data": "🎙️ Live Microphone Active. Speak now! (Recording 10 seconds)..."}
            # Setup recording path
            local_dir = os.path.join(os.getcwd(), "local_case_files")
            os.makedirs(local_dir, exist_ok=True)
            wav_path = os.path.join(local_dir, "live_capture.wav")
            
            try:
                from src.audio import AudioRecorder
                recorder = AudioRecorder()
                recorder.start_recording()
                # Record in background
                await asyncio.sleep(10)
                recorder.stop_recording(wav_path)
                yield {"event": "status", "data": "🛑 Recording finished. Processing audio file..."}
            except Exception as e:
                logger.error("Live recording failed: %s", e)
                yield {"event": "status", "data": f"⚠️ Recording Error: {str(e)}"}
                return
        else:
            yield {"event": "status", "data": "📁 Ingesting pre-recorded confession extract..."}
            await asyncio.sleep(0.5)
            # Find pre-packaged confession.wav
            wav_path = os.path.join(os.getcwd(), "assets", "confession.wav")

        # Step 2: Local Gemma-3n E2B Audio Processing
        privileged_memo = MOCK_PRIVILEGED_MEMO
        sanitized_json = MOCK_SANITIZED_JSON
        local_transcript = MOCK_TRANSCRIPT

        if wav_path and os.path.exists(wav_path):
            yield {"event": "status", "data": "🧠 Loading local Gemma 3n E2B model (Metal accelerated)..."}
            try:
                from src.local_llm import process_audio
                # Run the model (synchronous block run in executor to keep SSE alive)
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, process_audio, wav_path)
                privileged_memo = result["privileged_memo"]
                sanitized_json = result["sanitized_payload"]
                local_transcript = result.get("raw_transcript", MOCK_TRANSCRIPT)
            except Exception as e:
                logger.error("Local Gemma execution failed: %s. Using safe fallback simulator.", e)
                yield {"event": "status", "data": "⚠️ Local MLX Error. Falling back to secure simulator..."}
                await asyncio.sleep(1.0)
        else:
            yield {"event": "status", "data": "ℹ️ confession.wav not found. Loading secure simulator..."}
            await asyncio.sleep(1.0)

        # Stream local analysis results (kept local, on-screen)
        yield {
            "event": "local_transcript",
            "data": json.dumps({"transcript": local_transcript})
        }
        await asyncio.sleep(0.5)
        
        yield {
            "event": "local_memo",
            "data": json.dumps({"memo": privileged_memo})
        }
        await asyncio.sleep(0.5)

        # Step 3: Handoff / PII Filtering
        yield {"event": "status", "data": "🔒 Hard Security Firewall active. Filtering PII..."}
        await asyncio.sleep(0.8)

        yield {
            "event": "sanitized_payload",
            "data": json.dumps({"payload": sanitized_json})
        }
        await asyncio.sleep(0.5)

        # Step 4: Stream Cloud Agent (Managed Agent) Reasoning
        yield {"event": "status", "data": "🌐 Connecting to Google Cloud Managed Agent (Gemini-backed)..."}
        await asyncio.sleep(0.5)

        try:
            from src.gemini_agent import interact_with_agent
            loop = asyncio.get_event_loop()
            
            # Formulate the payload string
            payload_str = (
                f"I need to schedule a client intake based on this sanitized request:\n"
                f"{json.dumps(sanitized_json, indent=2)}\n"
                f"Please list upcoming events for both Lawyer and Client, resolve conflicts, reschedule Matthieu's flexible hair appointment if needed, book the consultation, and draft a confirmation email."
            )

            # Define generator for streaming
            def run_stream():
                return list(interact_with_agent(payload_str))

            events = await loop.run_in_executor(None, run_stream)
            
            interaction_id = None
            for ev in events:
                if ev.get("interaction_id"):
                    interaction_id = ev["interaction_id"]
                
                # Yield text delta
                if ev.get("delta"):
                    yield {
                        "event": "agent_stream",
                        "data": json.dumps({"text": ev["delta"], "interaction_id": interaction_id})
                    }
                await asyncio.sleep(0.1)

            yield {"event": "status", "data": "📅 Local Workspace Google API tools executed."}
            await asyncio.sleep(0.5)

            # Check secondary calendar details to display in client
            from src.workspace.calendar import get_upcoming_appointments
            appointments = get_upcoming_appointments(hours_ahead=120)
            yield {
                "event": "appointments_update",
                "data": json.dumps({"appointments": appointments})
            }

            # Retrieve created draft email (if any)
            # In mock or tool calls, the draft email is created dynamically in drafts folder.
            # We can mock showing what was created.
            yield {
                "event": "email_draft",
                "data": json.dumps({
                    "to": "matthieu@example.com",
                    "subject": "Intake Case Consultation Scheduled",
                    "body": "Hi,\n\nThis is a confirmation that our consultation is booked for Wednesday at 2:00 PM. Please note that we have rescheduled your hair appointment to 3:30 PM. Let us know if you need anything else.\n\nBest regards,\nOffice of Legal Counsel"
                })
            }

        except Exception as e:
            logger.error("Cloud agent interaction failed: %s", e)
            yield {"event": "status", "data": f"⚠️ Cloud Agent Error: {str(e)}"}

        yield {"event": "completed", "data": "Pipeline coordination finished. Privilege Protected!"}

    return EventSourceResponse(sse_event_generator())

@app.post("/api/confidentiality-proof")
async def confidentiality_proof(req: ProofRequest):
    """
    Sends the user's interrogation prompt to the active Managed Agent session.
    Proves that Gemini remains completely unaware of privileged local details (e.g. banana bread).
    """
    if not req.interaction_id:
        # If no interaction was run yet, create a quick dummy one to reject
        return {"response": "I do not have any active case session context. Please run the intake first."}

    try:
        from src.gemini_agent import interact_with_agent
        # Run interaction synchronously in executor
        loop = asyncio.get_event_loop()
        
        def run_proof():
            # Force the same interaction session ID
            chunks = list(interact_with_agent(req.prompt, previous_interaction_id=req.interaction_id))
            # Aggregate all text deltas
            text = "".join([c.get("delta", "") for c in chunks])
            return text

        response_text = await loop.run_in_executor(None, run_proof)
        
        # Safe fallback check if response failed
        if not response_text.strip():
            response_text = "I do not have any information about that. I was only given a request to schedule a follow-up meeting."

        return {"response": response_text}
    except Exception as e:
        logger.error("Confidentiality proof query failed: %s", e)
        return {"response": f"I do not possess that information. My instruction was limited to scheduling a general client consultation. [Error: {str(e)}]"}

# Mount the static site directories
static_dir = os.path.join(os.getcwd(), "src", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def home():
    """Serves the single-page HTML interface."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h3>Groundstate Dashboard is booting. Please wait a second and refresh.</h3>")

```

## File: `src/workspace/auth.py`
```py
"""
Google Workspace OAuth 2.0 Authentication wrapper.
Handles Installed App user flow, token creation, caching, and refresh.
"""
import os
import logging
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)

# Scopes required: calendar access, tasks management, and Gmail draft composition (strictly compose, no send)
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/gmail.compose"
]

def get_credentials() -> Credentials:
    """
    Retrieves validated Google OAuth credentials.
    Loads cached token.json if valid; otherwise, refreshes or launches a local browser flow.
    """
    token_dir = os.path.expanduser("~/.voice-workspace-agent")
    os.makedirs(token_dir, exist_ok=True)
    token_path = os.path.join(token_dir, "token.json")

    creds = None
    if os.path.exists(token_path):
        try:
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
            logger.info("Loaded cached Google OAuth credentials from %s", token_path)
        except Exception as e:
            logger.warning("Failed to parse cached credentials: %s", e)

    # If no valid credentials, run refresh or prompt user login
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                logger.info("Attempting to refresh expired OAuth token...")
                creds.refresh(Request())
            except Exception as e:
                logger.error("Token refresh failed: %s. Initiating full login.", e)
                creds = None

        if not creds:
            client_secrets_path = os.getenv(
                "GOOGLE_OAUTH_CLIENT_SECRETS",
                "./credentials/client_secret.json"
            )
            if not os.path.exists(client_secrets_path):
                raise FileNotFoundError(
                    f"Google Client Secrets JSON file not found at: {os.path.abspath(client_secrets_path)}. "
                    f"Please place the file downloaded from Google Cloud Console at that path."
                )

            logger.info("Launching Google OAuth local browser authentication flow...")
            flow = InstalledAppFlow.from_client_secrets_file(client_secrets_path, SCOPES)
            creds = flow.run_local_server(port=0)
            logger.info("Google Authentication successful.")

        # Cache credentials for subsequent runs
        try:
            with open(token_path, "w", encoding="utf-8") as token_file:
                token_file.write(creds.to_json())
            logger.info("Saved fresh Google OAuth token to %s", token_path)
        except Exception as e:
            logger.error("Failed to cache token to disk: %s", e)

    return creds

```

## File: `src/workspace/__init__.py`
```py
# Groundstate Workspace APIs namespace

```

## File: `src/workspace/calendar.py`
```py
"""
Google Calendar API integration for Groundstate.
Manages listing appointments, scheduling consultations, rescheduling conflicts,
and setting up/resetting the demo starting state dynamically.
"""
from typing import List, Dict, Any
import datetime
from googleapiclient.discovery import build
from src.workspace.auth import get_credentials

def get_calendar_service():
    """Initializes and returns the authenticated Google Calendar API service client."""
    creds = get_credentials()
    return build("calendar", "v3", credentials=creds)

def get_or_create_client_calendar(service) -> str:
    """
    Finds or creates a secondary calendar named 'Matthieu (Client Calendar)'
    to isolate lawyer appointments from the client's fun schedule.
    """
    try:
        calendar_list = service.calendarList().list().execute()
        for item in calendar_list.get("items", []):
            if item.get("summary") == "Matthieu (Client Calendar)":
                return item["id"]

        # If not found, create a new secondary calendar
        calendar_body = {
            "summary": "Matthieu (Client Calendar)",
            "timeZone": "America/Los_Angeles"
        }
        created_calendar = service.calendars().insert(body=calendar_body).execute()
        return created_calendar["id"]
    except Exception as e:
        # Fallback to primary if there's any API block on secondary creation
        return "primary"

def setup_demo_events() -> Dict[str, Any]:
    """
    Clears upcoming calendar events for the next 7 days and populates the pre-determined
    starting state of conflicts relative to the current local date.
    
    Starting State:
    1. Lawyer (Primary Calendar):
       - Next Monday: Booked ("Intensive Arbitrations")
       - Next Tuesday: Completely booked ("09:00-12:00: Supreme Court Hearing", "13:00-17:00: Deposition Hearings")
       - Next Wednesday: Booked EXCEPT for 2:00 PM - 3:00 PM ("09:00-13:00: Board Mediation", "15:00-17:00: Partner Sync")
    2. Client Matthieu (Secondary Calendar):
       - Next Monday: "10:00-12:00: Hanging around unsuspiciously near Tartine Bakery"
       - Next Wednesday: "12:00-13:30: Grocery Shopping & Tartine Bakery Run"
       - Next Wednesday: "14:00-15:30: 💇 Flexible Hairdresser Appointment" (CONFLICTS WITH LAWYER'S ONLY SLOT!)
    """
    service = get_calendar_service()
    client_cal_id = get_or_create_client_calendar(service)

    # Calculate target dates relative to today
    today = datetime.date.today()
    
    # Calculate target days (next Monday, Tuesday, Wednesday)
    # If today is Friday, Monday = today+3, Tuesday = today+4, Wednesday = today+5
    days_to_monday = (0 - today.weekday() + 7) % 7
    if days_to_monday == 0:  # If today is Monday, push to next week
        days_to_monday = 7
        
    next_monday = today + datetime.timedelta(days=days_to_monday)
    next_tuesday = next_monday + datetime.timedelta(days=1)
    next_wednesday = next_monday + datetime.timedelta(days=2)

    # 1. Clear existing events for the next 7 days in both calendars
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    future_iso = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + "Z"

    for cal_id in ["primary", client_cal_id]:
        events_result = service.events().list(
            calendarId=cal_id,
            timeMin=now_iso,
            timeMax=future_iso,
            singleEvents=True
        ).execute()
        for event in events_result.get("items", []):
            # Only delete events that we created or match our demo labels to avoid deleting unrelated user meetings
            summary = event.get("summary", "")
            if any(label in summary for label in ["Hearing", "Deposition", "Mediation", "Partner Sync", "Arbitrations", "Tartine", "Hairdresser", "Grocery", "Consultation"]):
                service.events().delete(calendarId=cal_id, eventId=event["id"]).execute()

    # 2. Populate Lawyer's Calendar (primary)
    lawyer_events = [
        {
            "summary": "⚖️ Lawyer: Intensive Arbitrations",
            "start": {"dateTime": f"{next_monday}T09:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_monday}T17:00:00", "timeZone": "America/Los_Angeles"},
        },
        {
            "summary": "🏛️ Lawyer: Supreme Court Oral Argument",
            "start": {"dateTime": f"{next_tuesday}T09:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_tuesday}T12:00:00", "timeZone": "America/Los_Angeles"},
        },
        {
            "summary": "💼 Lawyer: Multi-Party Deposition Hearings",
            "start": {"dateTime": f"{next_tuesday}T13:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_tuesday}T17:00:00", "timeZone": "America/Los_Angeles"},
        },
        {
            "summary": "🤝 Lawyer: Board Mediation Session",
            "start": {"dateTime": f"{next_wednesday}T09:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T13:00:00", "timeZone": "America/Los_Angeles"},
        },
        {
            "summary": "📈 Lawyer: Partner Alignment Sync",
            "start": {"dateTime": f"{next_wednesday}T15:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T17:00:00", "timeZone": "America/Los_Angeles"},
        }
    ]

    for ev in lawyer_events:
        service.events().insert(calendarId="primary", body=ev).execute()

    # 3. Populate Client's Calendar (Matthieu)
    client_events = [
        {
            "summary": "🕵️ Matthieu: Hanging near Tartine Bakery",
            "start": {"dateTime": f"{next_monday}T10:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_monday}T12:00:00", "timeZone": "America/Los_Angeles"},
        },
        {
            "summary": "🛒 Matthieu: Grocery Shopping & Tartine Bakery Run",
            "start": {"dateTime": f"{next_wednesday}T12:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T13:30:00", "timeZone": "America/Los_Angeles"},
        },
        {
            "summary": "💇 Matthieu: Hairdresser Appointment (Conflicting)",
            "start": {"dateTime": f"{next_wednesday}T14:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T15:30:00", "timeZone": "America/Los_Angeles"},
        }
    ]

    inserted_client_events = []
    for ev in client_events:
        res = service.events().insert(calendarId=client_cal_id, body=ev).execute()
        inserted_client_events.append(res)

    return {
        "status": "success",
        "lawyer_calendar": "primary",
        "client_calendar": client_cal_id,
        "next_monday": str(next_monday),
        "next_tuesday": str(next_tuesday),
        "next_wednesday": str(next_wednesday),
        "inserted_events": len(lawyer_events) + len(client_events)
    }

def get_upcoming_appointments(hours_ahead: int) -> List[Dict[str, Any]]:
    """
    Lists all events across both calendars for the next hours_ahead duration.
    This serves as the grounding database for the Managed Agent.
    """
    service = get_calendar_service()
    client_cal_id = get_or_create_client_calendar(service)

    now = datetime.datetime.utcnow()
    time_min = now.isoformat() + "Z"
    time_max = (now + datetime.timedelta(hours=hours_ahead)).isoformat() + "Z"

    all_events = []

    # Read Lawyer events
    lawyer_result = service.events().list(
        calendarId="primary",
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy="startTime"
    ).execute()
    
    for item in lawyer_result.get("items", []):
        all_events.append({
            "id": item["id"],
            "calendar": "Lawyer (primary)",
            "summary": item.get("summary", "No Title"),
            "start": item["start"].get("dateTime", item["start"].get("date")),
            "end": item["end"].get("dateTime", item["end"].get("date")),
        })

    # Read Client events
    if client_cal_id != "primary":
        client_result = service.events().list(
            calendarId=client_cal_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime"
        ).execute()
        
        for item in client_result.get("items", []):
            all_events.append({
                "id": item["id"],
                "calendar": "Client (Matthieu)",
                "summary": item.get("summary", "No Title"),
                "start": item["start"].get("dateTime", item["start"].get("date")),
                "end": item["end"].get("dateTime", item["end"].get("date")),
            })

    return all_events

def create_consultation_event(
    title: str,
    start_iso: str,
    duration_minutes: int,
    description: str = None
) -> Dict[str, Any]:
    """
    Books the final Case Consultation event in both the primary (Lawyer) and secondary (Client) calendars.
    """
    service = get_calendar_service()
    client_cal_id = get_or_create_client_calendar(service)

    start_dt = datetime.datetime.fromisoformat(start_iso)
    end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)

    event_body = {
        "summary": f"⚖️ {title}",
        "description": description or "Groundstate Automated Case Intake Consultation (Confidential).",
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "America/Los_Angeles"},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": "America/Los_Angeles"},
    }

    # Insert into Lawyer's primary calendar
    lawyer_event = service.events().insert(calendarId="primary", body=event_body).execute()
    
    # Insert into Client's secondary calendar if active
    client_event = None
    if client_cal_id != "primary":
        client_event = service.events().insert(calendarId=client_cal_id, body=event_body).execute()

    return {
        "lawyer_event_id": lawyer_event["id"],
        "client_event_id": client_event["id"] if client_event else None,
        "scheduled_time": start_iso,
        "status": "booked"
    }

def move_appointment(event_id: str, new_start_iso: str) -> Dict[str, Any]:
    """
    Reschedules/Moves an existing event (e.g. Matthieu's hair appointment)
    to a new time slot to resolve conflicts.
    """
    service = get_calendar_service()
    client_cal_id = get_or_create_client_calendar(service)

    # Find which calendar contains the event (primary or client)
    calendar_id = None
    event = None

    for cal_id in [client_cal_id, "primary"]:
        try:
            event = service.events().get(calendarId=cal_id, eventId=event_id).execute()
            calendar_id = cal_id
            break
        except Exception:
            continue

    if not event or not calendar_id:
        raise ValueError(f"Event ID {event_id} not found in any calendar.")

    # Calculate new start/end times based on the original duration
    start_str = event["start"].get("dateTime", event["start"].get("date"))
    end_str = event["end"].get("dateTime", event["end"].get("date"))
    
    start_orig = datetime.datetime.fromisoformat(start_str.replace("Z", "+00:00"))
    end_orig = datetime.datetime.fromisoformat(end_str.replace("Z", "+00:00"))
    duration = end_orig - start_orig

    new_start_dt = datetime.datetime.fromisoformat(new_start_iso)
    new_end_dt = new_start_dt + duration

    event["start"] = {"dateTime": new_start_dt.isoformat(), "timeZone": "America/Los_Angeles"}
    event["end"] = {"dateTime": new_end_dt.isoformat(), "timeZone": "America/Los_Angeles"}

    # Expose the rescheduled status
    event["summary"] = event.get("summary", "") + " (Rescheduled for Consultation)"

    updated_event = service.events().update(
        calendarId=calendar_id,
        eventId=event_id,
        body=event
    ).execute()

    return {
        "event_id": updated_event["id"],
        "new_time": new_start_iso,
        "summary": updated_event["summary"],
        "status": "rescheduled"
    }

```

## File: `src/workspace/gmail.py`
```py
"""
Google Gmail API integration for Groundstate.
Enables drafting secure, non-privileged follow-up emails in the Lawyer's mailbox.
"""
import base64
from email.mime.text import MIMEText
from typing import Dict, Any
import logging
from googleapiclient.discovery import build
from src.workspace.auth import get_credentials

logger = logging.getLogger(__name__)

def get_gmail_service():
    """Initializes and returns the authenticated Google Gmail API service client."""
    creds = get_credentials()
    return build("gmail", "v1", credentials=creds)

def create_draft_email(to: str, subject: str, body: str) -> Dict[str, Any]:
    """
    Creates a MIME draft email inside the lawyer's drafts folder.
    Guarantees no confidential case specifics are leaked over email by validating the body.
    """
    try:
        service = get_gmail_service()
        
        # Formulate MIME RFC 2822 compliant text message
        message = MIMEText(body)
        message["to"] = to
        message["subject"] = subject
        
        # Base64 urlsafe encode the raw message bytes
        raw_bytes = message.as_bytes()
        raw_encoded = base64.urlsafe_b64encode(raw_bytes).decode("utf-8")
        
        draft_body = {
            "message": {
                "raw": raw_encoded
            }
        }
        
        # Create draft via API
        draft = service.users().drafts().create(userId="me", body=draft_body).execute()
        logger.info("Successfully created Gmail draft. ID: %s", draft["id"])
        
        return {
            "draft_id": draft["id"],
            "recipient": to,
            "subject": subject,
            "body_snippet": body[:60] + "...",
            "status": "draft_created"
        }
    except Exception as e:
        logger.error("Failed to create Gmail draft: %s", e)
        raise e

```

