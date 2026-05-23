import sys
import os
import logging

# Configure logging to show all info logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

from src.local_llm import process_audio

wav_path = os.path.join(os.getcwd(), "src", "static", "live_capture.wav")
print(f"Testing local Gemma 3n E2B inference on: {wav_path}")

try:
    result = process_audio(wav_path)
    print("\n" + "="*40)
    print("TRANSCRIPT EXTRACTED:")
    print(result["raw_transcript"])
    print("="*40)
    print("MEMO EXTRACTED:")
    print(result["privileged_memo"])
    print("="*40)
    print("SANITIZED PAYLOAD:")
    print(result["sanitized_payload"])
    print("="*40)
except Exception as e:
    print(f"Error during inference execution: {e}")
