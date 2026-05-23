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
