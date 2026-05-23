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
]

TOOL_DISPATCH = {
    "list_upcoming_events": list_upcoming_events,
    "schedule_consultation": schedule_consultation,
    "reschedule_conflicting_appointment": reschedule_conflicting_appointment,
    "draft_confirmation_email": draft_confirmation_email,
}
