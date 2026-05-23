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
