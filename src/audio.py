"""
Groundstate local audio recording utilities.
Handles microphone stream capture and saving to local WAV format.
"""
import queue
import logging
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wavfile

logger = logging.getLogger(__name__)

class AudioRecorder:
    """
    Stateful audio recorder using sounddevice to capture mono microphone input.
    """
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.queue = queue.Queue()
        self.stream = None
        self.is_recording = False

    def callback(self, indata, frames, time, status):
        """Callback queue accumulator for the sounddevice InputStream."""
        if status:
            logger.warning("Sounddevice status warning: %s", status)
        self.queue.put(indata.copy())

    def start_recording(self):
        """Starts background microphone stream."""
        if self.is_recording:
            logger.warning("Recording already in progress.")
            return

        self.queue = queue.Queue()
        self.is_recording = True
        
        try:
            self.stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype='float32',
                callback=self.callback
            )
            self.stream.start()
            logger.info("Local microphone capture started at %dHz", self.sample_rate)
        except Exception as e:
            self.is_recording = False
            logger.error("Failed to start sounddevice stream: %s", e)
            raise e

    def stop_recording(self, file_path: str) -> bool:
        """Stops microphone capture and writes accumulated audio to local PCM WAV."""
        if not self.is_recording:
            logger.warning("No active recording session to stop.")
            return False

        self.is_recording = False
        
        if self.stream:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception as e:
                logger.error("Error closing stream: %s", e)

        # Retrieve all chunks from queue
        chunks = []
        while not self.queue.empty():
            chunks.append(self.queue.get())

        if not chunks:
            logger.warning("No audio chunks recorded.")
            return False

        try:
            # Concatenate chunks into a single numpy float32 array
            audio_data = np.concatenate(chunks, axis=0)
            
            # Normalize to 16-bit PCM integer format
            # Ensure float data is bounded to prevent clipping before scale
            audio_data = np.clip(audio_data, -1.0, 1.0)
            int16_data = (audio_data * 32767).astype(np.int16)
            
            wavfile.write(file_path, self.sample_rate, int16_data)
            logger.info("Successfully saved local audio to %s", file_path)
            return True
        except Exception as e:
            logger.error("Failed to write WAV file: %s", e)
            return False
