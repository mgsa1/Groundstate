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
