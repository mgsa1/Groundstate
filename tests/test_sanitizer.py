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
      "tool": "schedule_event",
      "title": "Intake Consultation for Matthieu banana bread theft",
      "timeframe": "next_week",
      "duration_minutes": "60",
      "priority": "high",
      "description": "Matthieu stole banana bread from Tartine Bakery. Case Consultation."
    }
    """

    sanitized = programmatically_sanitize(raw_payload_with_leak)
    assert isinstance(sanitized, list)
    assert len(sanitized) > 0

    forbidden_tokens = ["banana", "bread", "tartine", "matthieu", "stole", "theft", "bakery", "steal", "crime"]

    for item in sanitized:
        assert isinstance(item, dict)
        for key, value in item.items():
            if isinstance(value, str):
                for token in forbidden_tokens:
                    assert token.lower() not in value.lower(), (
                        f"PII LEAK DETECTED: Found forbidden token '{token}' in field '{key}': '{value}'"
                    )

    # Verify standard formatting has been enforced
    assert sanitized[0]["tool"] == "schedule_event"
    assert sanitized[0]["duration_minutes"] == 60

def test_sanitizer_handles_malformed_json_block():
    """Asserts that the sanitizer extracts and cleans JSON even if surrounded by verbose markdown tags."""
    malformed_markdown_payload = """
    Here is the extracted scheduling JSON payload:
    ```json
    [
      {
        "tool": "schedule_event",
        "title": "Confidential meeting",
        "timeframe": "next_week",
        "duration_minutes": 90
      }
    ]
    ```
    Please process this.
    """

    sanitized = programmatically_sanitize(malformed_markdown_payload)
    assert isinstance(sanitized, list)
    assert len(sanitized) == 1
    assert sanitized[0]["tool"] == "schedule_event"
    assert sanitized[0]["title"] == "Confidential meeting"
    assert sanitized[0]["timeframe"] == "next_week"
    assert sanitized[0]["duration_minutes"] == 90
    assert sanitized[0]["priority"] == "normal"  # Auto-filled default

def test_sanitizer_fallback_on_total_failures():
    """Asserts that total parsing failures fallback safely to a fully generic clean payload."""
    garbage_text = "I failed to extract any structured JSON information."
    sanitized = programmatically_sanitize(garbage_text)

    assert isinstance(sanitized, list)
    assert len(sanitized) == 1
    assert sanitized[0]["tool"] == "schedule_event"
    assert sanitized[0]["title"] == "Intake Consultation"
    assert sanitized[0]["timeframe"] == "next_week"
    assert sanitized[0]["duration_minutes"] == 60
    assert sanitized[0]["priority"] == "normal"

def test_sanitizer_timeframe_extraction():
    """Asserts that programmatically_sanitize extracts correct timeframe from raw transcripts."""
    raw_payload = """
    [
      {
        "tool": "schedule_event",
        "title": "Intake Consultation",
        "timeframe": "next_week",
        "duration_minutes": 60,
        "priority": "normal"
      }
    ]
    """
    
    # 1. next Wednesday at 3 PM
    sanitized = programmatically_sanitize(raw_payload, "I want to book an appointment next Wednesday at 3 PM.")
    assert sanitized[0]["timeframe"] == "next Wednesday at 3 PM"
    
    # 2. Wednesday 4pm
    sanitized = programmatically_sanitize(raw_payload, "can we book an appointment for Wednesday 4pm?")
    assert sanitized[0]["timeframe"] == "Wednesday at 4PM"

def test_sanitizer_title_extraction():
    """Asserts that programmatically_sanitize extracts correct dynamic title from raw transcripts."""
    raw_payload = """
    [
      {
        "tool": "schedule_event",
        "title": "Intake Consultation",
        "timeframe": "next_week",
        "duration_minutes": 60,
        "priority": "normal"
      }
    ]
    """
    
    # 1. groceries
    sanitized = programmatically_sanitize(raw_payload, "Book an appointment in my calendar next week to go do groceries.")
    assert sanitized[0]["title"] == "Grocery Shopping"
    
    # 2. dentist
    sanitized = programmatically_sanitize(raw_payload, "can we schedule a meeting to go to the dentist tomorrow?")
    assert sanitized[0]["title"] == "Dentist Appointment"

    # 3. hairdresser
    sanitized = programmatically_sanitize(raw_payload, "I want to schedule a hairdresser appointment.")
    assert sanitized[0]["title"] == "Hairdresser Appointment"
