"""
Google Calendar API integration for Groundstate.
Manages listing appointments, scheduling consultations, rescheduling conflicts,
and setting up/resetting the demo starting state dynamically.
"""
import os
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
    Supports a custom shared calendar ID from the environment.
    """
    env_id = os.getenv("CLIENT_CALENDAR_ID")
    if env_id:
        logger.info("Using shared client calendar ID from environment: %s", env_id)
        return env_id

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
        if cal_id == "primary" or cal_id != "primary":
            try:
                events_result = service.events().list(
                    calendarId=cal_id,
                    timeMin=now_iso,
                    timeMax=future_iso,
                    singleEvents=True
                ).execute()
                for event in events_result.get("items", []):
                    summary = event.get("summary", "")
                    if any(label in summary for label in ["Hearing", "Deposition", "Mediation", "Partner Sync", "Arbitrations", "Tartine", "Hairdresser", "Grocery", "Consultation"]):
                        service.events().delete(calendarId=cal_id, eventId=event["id"]).execute()
            except Exception as e:
                logger.warning("Could not clear events for calendar %s: %s", cal_id, e)

    # 2. Populate Lawyer's Calendar (primary)
    lawyer_events = [
        {
            "summary": "Intensive Arbitrations",
            "start": {"dateTime": f"{next_monday}T09:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_monday}T17:00:00", "timeZone": "America/Los_Angeles"},
            "colorId": "10"  # Basil Green
        },
        {
            "summary": "Supreme Court Oral Argument",
            "start": {"dateTime": f"{next_tuesday}T09:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_tuesday}T12:00:00", "timeZone": "America/Los_Angeles"},
            "colorId": "10"  # Basil Green
        },
        {
            "summary": "Multi-Party Deposition Hearings",
            "start": {"dateTime": f"{next_tuesday}T13:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_tuesday}T17:00:00", "timeZone": "America/Los_Angeles"},
            "colorId": "10"  # Basil Green
        },
        {
            "summary": "Board Mediation Session",
            "start": {"dateTime": f"{next_wednesday}T09:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T13:00:00", "timeZone": "America/Los_Angeles"},
            "colorId": "10"  # Basil Green
        },
        {
            "summary": "Partner Alignment Sync",
            "start": {"dateTime": f"{next_wednesday}T15:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T17:00:00", "timeZone": "America/Los_Angeles"},
            "colorId": "10"  # Basil Green
        }
    ]

    for ev in lawyer_events:
        try:
            service.events().insert(calendarId="primary", body=ev).execute()
        except Exception as e:
            logger.error("Failed to insert lawyer event: %s", e)

    # 3. Populate Client's Calendar (Matthieu)
    client_events = [
        {
            "summary": "🕵️ Hanging near Tartine Bakery",
            "start": {"dateTime": f"{next_monday}T10:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_monday}T12:00:00", "timeZone": "America/Los_Angeles"},
            "colorId": "9"  # Blueberry Blue
        },
        {
            "summary": "🛒 Grocery Shopping & Tartine Bakery Run",
            "start": {"dateTime": f"{next_wednesday}T12:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T13:30:00", "timeZone": "America/Los_Angeles"},
            "colorId": "9"  # Blueberry Blue
        },
        {
            "summary": "💇 Hairdresser Appointment (Conflicting)",
            "start": {"dateTime": f"{next_wednesday}T14:00:00", "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": f"{next_wednesday}T15:30:00", "timeZone": "America/Los_Angeles"},
            "colorId": "9"  # Blueberry Blue
        }
    ]

    inserted_client_events = []
    if client_cal_id != "primary":
        for ev in client_events:
            try:
                res = service.events().insert(calendarId=client_cal_id, body=ev).execute()
                inserted_client_events.append(res)
            except Exception as e:
                logger.warning("Could not write to client calendar %s: %s. Please ensure sharing is set up or add manually.", client_cal_id, e)

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
    Books the final Case Consultation event in the Lawyer's primary calendar
    and adds the client's email as an external attendee, automatically transmitting
    a Google Calendar invitation to their independent account in the wild.
    """
    service = get_calendar_service()
    client_email = os.getenv("CLIENT_EMAIL", "matthieu@example.com")

    start_dt = datetime.datetime.fromisoformat(start_iso)
    end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)

    event_body = {
        "summary": f"⚖️ {title}",
        "description": description or "Groundstate Automated Case Intake Consultation (Confidential).",
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "America/Los_Angeles"},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": "America/Los_Angeles"},
        "attendees": [
            {"email": client_email}
        ],
        "colorId": "10"  # Basil Green
    }

    # Insert into Lawyer's primary calendar with auto-send updates to attendees
    lawyer_event = service.events().insert(
        calendarId="primary",
        body=event_body,
        sendUpdates="all"
    ).execute()

    return {
        "lawyer_event_id": lawyer_event["id"],
        "client_email": client_email,
        "scheduled_time": start_iso,
        "status": "booked_with_attendee"
    }

def move_appointment(event_id: str, new_start_iso: str) -> Dict[str, Any]:
    """
    Moves/reschedules an existing event in the lawyer's calendar if needed.
    """
    service = get_calendar_service()
    try:
        event = service.events().get(calendarId="primary", eventId=event_id).execute()
    except Exception as e:
        raise ValueError(f"Event ID {event_id} not found in lawyer calendar: {e}")

    start_str = event["start"].get("dateTime", event["start"].get("date"))
    end_str = event["end"].get("dateTime", event["end"].get("date"))
    
    start_orig = datetime.datetime.fromisoformat(start_str.replace("Z", "+00:00"))
    end_orig = datetime.datetime.fromisoformat(end_str.replace("Z", "+00:00"))
    duration = end_orig - start_orig

    new_start_dt = datetime.datetime.fromisoformat(new_start_iso)
    new_end_dt = new_start_dt + duration

    event["start"] = {"dateTime": new_start_dt.isoformat(), "timeZone": "America/Los_Angeles"}
    event["end"] = {"dateTime": new_end_dt.isoformat(), "timeZone": "America/Los_Angeles"}
    event["summary"] = event.get("summary", "") + " (Rescheduled)"

    updated_event = service.events().update(
        calendarId="primary",
        eventId=event_id,
        body=event,
        sendUpdates="all"
    ).execute()

    return {
        "event_id": updated_event["id"],
        "new_time": new_start_iso,
        "summary": updated_event["summary"],
        "status": "rescheduled"
    }
