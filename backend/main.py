from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from datetime import date
import httpx2
import os
import json

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure Speech (speech-to-text) and Azure OpenAI (form extraction) settings
SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
SPEECH_ENDPOINT = os.getenv("AZURE_ENDPOINT_KEY", "").rstrip("/")
OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
# The OpenAI SDK appends /responses itself, so strip it from the configured endpoint
OPENAI_BASE_URL = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/").removesuffix("/responses")
OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

missing = [name for name in ("AZURE_SPEECH_KEY", "AZURE_ENDPOINT_KEY", "AZURE_OPENAI_KEY",
                             "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT_NAME") if not os.getenv(name)]
if missing:
    # Just print a warning, let it fail on request if not set.
    print(f"WARNING: environment variables not set: {', '.join(missing)}")

class ExtractedForm(BaseModel):
    incident_title: str = Field(default="")
    incident_description: str = Field(default="")
    date_of_occurrence: str = Field(default="")
    time_of_occurrence: str = Field(default="")
    department: str = Field(default="")
    place_of_occurrence: str = Field(default="")

PROMPT = """
Read this transcript of a spoken report and extract the speaker's information to fill out a Technical Safety Reporting (TSR) form.
Map the extracted details strictly to the provided JSON schema.
If a piece of information is not mentioned, leave it as an empty string.
Today's date is {today}; use it to resolve relative dates such as "yesterday" or dates spoken without a year.
IMPORTANT FORMATTING RULES:
- date_of_occurrence MUST be in 'YYYY-MM-DD' format.
- time_of_occurrence MUST be in 'HH:MM' (24-hour) format.
- department MUST be capitalized (e.g., 'Safety', 'Engineering', 'Operations', 'Maintenance').
"""

async def transcribe_audio(audio_bytes: bytes, filename: str, content_type: str) -> str:
    """Transcribe audio with the Azure Speech fast transcription REST API."""
    async with httpx2.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{SPEECH_ENDPOINT}/speechtotext/transcriptions:transcribe",
            params={"api-version": "2024-11-15"},
            headers={"Ocp-Apim-Subscription-Key": SPEECH_KEY},
            files={
                "audio": (filename, audio_bytes, content_type),
                "definition": (None, json.dumps({"locales": ["en-US"]}), "application/json"),
            },
        )
    response.raise_for_status()
    return " ".join(phrase["text"] for phrase in response.json().get("combinedPhrases", [])).strip()

async def extract_form(transcript: str) -> ExtractedForm:
    """Map a transcript onto the TSR form fields using Azure OpenAI structured outputs."""
    async with AsyncOpenAI(api_key=OPENAI_KEY, base_url=OPENAI_BASE_URL, timeout=60) as client:
        response = await client.responses.parse(
            model=OPENAI_DEPLOYMENT,
            instructions=PROMPT.format(today=date.today().isoformat()),
            input=transcript,
            text_format=ExtractedForm,
            # gpt-5.6-luna rejects temperature; low reasoning effort keeps latency down
            reasoning={"effort": "low"},
        )
    return response.output_parsed

@app.post("/api/extract-from-audio", response_model=ExtractedForm)
async def extract_from_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file.")

    try:
        import time
        start_time = time.time()
        print("Reading audio file...")
        audio_bytes = await file.read()
        print(f"Audio read in {time.time() - start_time:.2f} seconds.")

        print("Sending audio to Azure Speech...")
        stt_start = time.time()
        transcript = await transcribe_audio(audio_bytes, file.filename, file.content_type.split(";")[0])
        print(f"Azure Speech responded in {time.time() - stt_start:.2f} seconds: {transcript!r}")

        if not transcript:
            raise HTTPException(status_code=422, detail="No speech was detected in the audio.")

        print("Sending transcript to Azure OpenAI...")
        api_start = time.time()
        form = await extract_form(transcript)
        print(f"Azure OpenAI responded in {time.time() - api_start:.2f} seconds.")

        return form

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
