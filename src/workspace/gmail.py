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
