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
