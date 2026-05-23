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

# Global storage to preview the latest dynamically generated cloud email on the UI
LATEST_EMAIL_DRAFT = {
    "to": "--",
    "subject": "--",
    "body": "Draft confirmation email will be previewed here once constructed..."
}

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
    global LATEST_EMAIL_DRAFT
    LATEST_EMAIL_DRAFT = {
        "to": recipient_email,
        "subject": subject,
        "body": body
    }
    try:
        gmail = get_gmail_module()
        result = gmail.create_draft_email(recipient_email, subject, body)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Error executing draft_confirmation_email: %s", e)
        return {"status": "error", "message": str(e)}



def research_web(query: str) -> Dict[str, Any]:
    """
    Performs general web research and legal search to answer general-interest topics,
    legal statutes, penal codes, or public information.

    Args:
        query: The search engine query string (e.g. 'California shoplifting penalties').

    Returns:
        A dictionary containing the search results or summary.
    """
    logger.info("Tool called: research_web(query=%s)", query)
    try:
        # Check for mock results for the shoplifting demo case
        query_lower = query.lower()
        if "theft" in query_lower or "shoplifting" in query_lower or "penal" in query_lower or "penalty" in query_lower:
            search_results = (
                "**California Penal Code 484 & 488 (Petty Theft):**\n"
                "- Petty theft is defined as the unlawful taking of property valued at $950 or less.\n"
                "- Punishment: Shoplifting is generally prosecuted as a misdemeanor.\n"
                "- Penalties: Misdemeanor petty theft carries a maximum sentence of up to 6 months in county jail, "
                "a fine of up to $1,000, or both.\n"
                "- First-time offenders are frequently eligible for diversion programs, avoiding a criminal record."
            )
        else:
            # Fallback: Query Gemini to act as a grounded web researcher
            import os
            from google import genai
            
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment.")
            
            client = genai.Client(api_key=api_key)
            logger.info("Using cloud model to perform grounding research query...")
            
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=f"Conduct a concise web search summary for the query: '{query}'. Provide a highly factual, generic summary of results.",
            )
            search_results = response.text.strip()
            
        return {"status": "success", "query": query, "results": search_results}
    except Exception as e:
        logger.error("Error executing research_web: %s", e)
        return {"status": "error", "message": str(e)}

def generate_image(prompt: str) -> Dict[str, Any]:
    """
    Generates a professional slide graphic, visual mockup, or presentation illustration
    using Google's Imagen 3 model.

    Args:
        prompt: Detailed descriptive prompt for the image (e.g. 'A professional blue vault door icon').

    Returns:
        A dictionary confirming the image generation state.
    """
    logger.info("Tool called: generate_image(prompt=%s)", prompt)
    try:
        import os
        import base64
        from google import genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment.")
            
        client = genai.Client(api_key=api_key)
        logger.info("Calling cloud Imagen 3 model...")
        
        result = client.models.generate_images(
            model="imagen-3.0-generate-002",
            prompt=prompt,
            config=dict(
                number_of_images=1,
                output_mime_type="image/png",
                aspect_ratio="16:9"
            )
        )
        
        # Save the image to the static directory so the frontend can serve it
        static_dir = os.path.join(os.getcwd(), "src", "static")
        os.makedirs(static_dir, exist_ok=True)
        image_path = os.path.join(static_dir, "generated_slide.png")
        
        generated_image = result.generated_images[0]
        image_bytes = base64.b64decode(generated_image.image.image_bytes)
        
        with open(image_path, "wb") as f:
            f.write(image_bytes)
            
        logger.info("Imagen successfully saved image to: %s", image_path)
        return {
            "status": "success",
            "image_url": "/static/generated_slide.png",
            "file_path": image_path,
            "prompt_used": prompt
        }
    except Exception as e:
        logger.error("Error in generate_image tool: %s", e)
        return {"status": "error", "message": str(e)}


# Managed Agents API requires FunctionParam JSON-schema declarations
# (it does not auto-introspect Python callables like models.generate_content does).
TOOL_DECLARATIONS = [
    {
        "type": "function",
        "name": "list_upcoming_events",
        "description": (
            "Retrieves all calendar events scheduled in the next few hours for both "
            "the attorney and the client to check for scheduling conflicts."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "hours_ahead": {
                    "type": "integer",
                    "description": "The number of hours in the future to check for events.",
                },
            },
            "required": ["hours_ahead"],
        },
    },
    {
        "type": "function",
        "name": "schedule_consultation",
        "description": "Creates and schedules the primary case consultation meeting in the Lawyer's calendar.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "The title of the consultation event."},
                "start_iso": {
                    "type": "string",
                    "description": "Start time in ISO 8601 format (e.g. '2026-05-27T14:00:00-07:00').",
                },
                "duration_minutes": {
                    "type": "integer",
                    "description": "The duration of the consultation in minutes (e.g. 60).",
                },
                "client_name": {
                    "type": "string",
                    "description": "Optional name of the client to include in the title or description.",
                },
                "description": {
                    "type": "string",
                    "description": "Optional detailed notes for the calendar event.",
                },
            },
            "required": ["title", "start_iso", "duration_minutes"],
        },
    },
    {
        "type": "function",
        "name": "reschedule_conflicting_appointment",
        "description": (
            "Moves an existing conflicting low-priority appointment (e.g. hairdresser slot) "
            "to a new time, clearing the path for the lawyer's consultation."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "event_id": {
                    "type": "string",
                    "description": "The Google Calendar event ID of the conflicting appointment.",
                },
                "new_start_iso": {
                    "type": "string",
                    "description": "The new target start time in ISO 8601 format.",
                },
            },
            "required": ["event_id", "new_start_iso"],
        },
    },
    {
        "type": "function",
        "name": "draft_confirmation_email",
        "description": (
            "Composes a non-privileged, generic confirmation email draft in Gmail. "
            "Must contain NO client secrets, crime details, or stolen items."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "recipient_email": {"type": "string", "description": "The email address of the client."},
                "subject": {"type": "string", "description": "The subject of the confirmation email."},
                "body": {"type": "string", "description": "The plain text body of the email."},
            },
            "required": ["recipient_email", "subject", "body"],
        },
    },
    {
        "type": "function",
        "name": "research_web",
        "description": "Performs general web research and legal search to answer general-interest topics, statutes, or codes.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The research query (e.g. 'California shoplifting penalties')."},
            },
            "required": ["query"],
        },
    },
    {
        "type": "function",
        "name": "generate_image",
        "description": "Generates a professional slide graphic, visual mockup, or presentation illustration using Google's Imagen 3.",
        "parameters": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "A detailed descriptive prompt (e.g. 'A blue vault door')."},
            },
            "required": ["prompt"],
        },
    },
]

TOOL_DISPATCH = {
    "list_upcoming_events": list_upcoming_events,
    "schedule_consultation": schedule_consultation,
    "reschedule_conflicting_appointment": reschedule_conflicting_appointment,
    "draft_confirmation_email": draft_confirmation_email,
    "research_web": research_web,
    "generate_image": generate_image,
}
