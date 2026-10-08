import asyncio
import os
from main import extract_form, transcribe_audio

# test.wav is a spoken report: hydraulic oil leak, 15 Sep 2026, 2:30 PM, Building B, Maintenance
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test.wav"), "rb") as f:
    audio_bytes = f.read()

print("Testing Azure Speech transcription...")
transcript = asyncio.run(transcribe_audio(audio_bytes, "test.wav", "audio/wav"))
print("Transcript:", transcript)
assert transcript, "Azure Speech returned an empty transcript"

print("\nTesting Azure OpenAI extraction...")
form = asyncio.run(extract_form(transcript))
print("Response:", form.model_dump_json(indent=2))

assert form.date_of_occurrence == "2026-09-15", form.date_of_occurrence
assert form.time_of_occurrence == "14:30", form.time_of_occurrence
assert form.department == "Maintenance", form.department
assert "building b" in form.place_of_occurrence.lower(), form.place_of_occurrence
print("PASS")
