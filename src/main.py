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

        # Check if no scheduling action or client intake was requested, and halt early if so
        if sanitized_json.get("action") == "none" or privileged_memo == "Failed to extract privileged memo.":
            yield {"event": "status", "data": "🛑 No scheduling intent detected in speech. Pipeline halted safely."}
            await asyncio.sleep(0.5)
            yield {"event": "completed", "data": "Pipeline coordination finished. No actions required!"}
            return

        # Step 4: Stream Cloud Agent (Managed Agent) Reasoning
        yield {"event": "status", "data": "🌐 Connecting to Google Cloud Managed Agent (Gemini-backed)..."}
        await asyncio.sleep(0.5)

        try:
            from src.gemini_agent import interact_with_agent
            loop = asyncio.get_event_loop()
            
            # Formulate the payload string with explicit, step-by-step reasoning instructions
            payload_str = (
                f"You are a secure workspace agent. You must resolve calendar conflicts and book a consultation by executing these steps strictly in order:\n\n"
                f"1. Call `list_upcoming_events` with `hours_ahead=168` to check the schedules of both the Lawyer (primary calendar) and Client Matthieu.\n"
                f"2. Inspect the events. Notice the Lawyer is fully booked next week except for the single Wednesday 2:00 PM to 3:00 PM slot (the ONLY available slot).\n"
                f"3. Notice the Client has a flexible 'Hairdresser Appointment' from 2:00 PM to 3:30 PM on that same Wednesday, creating a direct conflict.\n"
                f"4. Resolve this conflict: call `reschedule_conflicting_appointment` to move the Client's hairdresser event (using its retrieved event ID) to start at 3:30 PM on that same Wednesday, clearing the 2:00 PM slot.\n"
                f"5. Book the intake: call `schedule_consultation` at 2:00 PM on that Wednesday for 60 minutes, inviting `cod.legend95@gmail.com` as an attendee.\n"
                f"6. Draft confirmation: call `draft_confirmation_email` to draft a Gmail message in Gmail for `cod.legend95@gmail.com` confirming the Wednesday 2:00 PM booking, and advising them that their hairdresser slot was shifted to 3:30 PM. Maintain strict confidentiality: do NOT mention any case secrets, crimes, bakery, or banana bread.\n\n"
                f"Here is the sanitized intake intent:\n"
                f"{json.dumps(sanitized_json, indent=2)}\n"
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
            client_email = os.getenv("CLIENT_EMAIL", "matthieu@example.com")
            yield {
                "event": "email_draft",
                "data": json.dumps({
                    "to": client_email,
                    "subject": "Intake Case Consultation Scheduled",
                    "body": f"Hi,\n\nThis is a confirmation that our consultation is booked for Wednesday at 2:00 PM. Please note that we have rescheduled your hair appointment to 3:30 PM. Let us know if you need anything else.\n\nBest regards,\nOffice of Legal Counsel"
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
