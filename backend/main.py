from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from typing import List
from datetime import date
from dotenv import load_dotenv
import httpx2
import os
import json

# Automatically load environment variables from local or parent directory
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="QMSmart ASR Voice Autofill API")

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
OPENAI_BASE_URL = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/").removesuffix("/responses")
OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

missing = [name for name in ("AZURE_SPEECH_KEY", "AZURE_ENDPOINT_KEY", "AZURE_OPENAI_KEY",
                             "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT_NAME") if not os.getenv(name)]
if missing:
    print(f"WARNING: environment variables not set: {', '.join(missing)}")


class ExtractedForm(BaseModel):
    # REPORT HEADER
    mor_vsr: str = Field(default="MOR")
    reporter: str = Field(default="")
    asr_type: List[str] = Field(default_factory=list)

    # FLIGHT DETAILS
    title: str = Field(default="")
    incident_title: str = Field(default="")  # backward compatibility
    date_of_occurrence: str = Field(default="")
    time_of_occurrence_ist: str = Field(default="")
    time_of_occurrence_utc: str = Field(default="")
    time_of_occurrence: str = Field(default="")  # backward compatibility
    flight_no: str = Field(default="")
    registration: str = Field(default="")
    callsign: str = Field(default="")
    flight_duration: str = Field(default="")
    location_position: str = Field(default="")

    # ASR - GENERAL (Flight Schedule)
    flight_schedule: str = Field(default="")
    aircraft_type: str = Field(default="")
    flight_status: str = Field(default="")
    cargo_weight: str = Field(default="")

    # DETAILS (Position / Airport)
    lat_long: str = Field(default="")
    location_airport: str = Field(default="")
    place_of_occurrence: str = Field(default="")  # backward compatibility
    departure: str = Field(default="")
    destination: str = Field(default="")
    diverted_to: str = Field(default="")
    flight_phase: str = Field(default="")
    nature_of_flight: str = Field(default="")
    number_of_crew: str = Field(default="")
    number_of_pax: str = Field(default="")
    speed_knots: str = Field(default="")
    speed_mach: str = Field(default="")
    altitude_ft: str = Field(default="")
    height_agl_ft: str = Field(default="")
    flight_level: str = Field(default="")
    runway_used: str = Field(default="")
    runway_condition: str = Field(default="")
    rvr: str = Field(default="")
    takeoff_weight: str = Field(default="")
    landing_weight: str = Field(default="")

    # Operations & ATC
    cvr_download_requested: str = Field(default="")
    techlog_entry: str = Field(default="")
    atc_informed: str = Field(default="")
    atc_unit: str = Field(default="")
    atc_time: str = Field(default="")
    delay: str = Field(default="")

    # AIRCRAFT CONFIGURATION
    autopilot: str = Field(default="")
    autothrottle: str = Field(default="")
    spoilers: str = Field(default="")
    flap_setting: str = Field(default="")
    slats: str = Field(default="")
    landing_gear: str = Field(default="")

    # DESCRIPTION
    description: str = Field(default="")
    incident_description: str = Field(default="")  # backward compatibility
    department: str = Field(default="")

    # CREW
    captain: str = Field(default="")
    first_officer: str = Field(default="")
    sccm: str = Field(default="")
    ccm1: str = Field(default="")
    ccm2: str = Field(default="")
    ccm3: str = Field(default="")
    ccm4: str = Field(default="")
    ccm5: str = Field(default="")
    observer: str = Field(default="")
    observer_2: str = Field(default="")

    # FLIGHT METEOROLOGICAL
    wind_bearing: str = Field(default="")
    wind_velocity: str = Field(default="")
    temperature_c: str = Field(default="")
    qnh: str = Field(default="")
    visibility_m: str = Field(default="")
    meteorological_condition: str = Field(default="")
    light_condition: str = Field(default="")
    cloud_ceiling_ft: str = Field(default="")
    precipitation: str = Field(default="")
    icing: str = Field(default="")
    turbulence: str = Field(default="")
    flying_sun: str = Field(default="")
    additional_info: str = Field(default="")


PROMPT = """
You are an expert Aviation Safety and Flight Operations AI Assistant.
Read this transcript of a spoken flight occurrence / safety report and extract the details to fill out the QMSmart ASR - SMS (Air Safety Report) form.
Map all extracted details strictly to the provided JSON schema.
If a piece of information is not mentioned in the audio, leave it as an empty string (or empty list for asr_type).

Today's date is {today}; use it to resolve relative dates such as "today", "yesterday", or dates spoken without a year.

GUIDELINES FOR EXTRACTION:
1. REPORT HEADER:
   - mor_vsr: "MOR" or "VSR" if mentioned (default "MOR").
   - reporter: Name or rank of the reporting crew member.
   - asr_type: List of applicable categories matching: ["Wildlife", "Call Sign Confusion", "ATC Incident", "Collision Avoidance (TCAS/RA)", "EGPWS", "GNSS Spoofing", "Injury", "Laser Interference", "Other"].

2. FLIGHT DETAILS:
   - title & incident_title: Concise, descriptive title of the occurrence (e.g. "Severe Turbulence during Cruise FL360", "Bird Strike on Final Approach RWY 27R").
   - date_of_occurrence: Standard date format 'YYYY-MM-DD'.
   - time_of_occurrence_utc & time_of_occurrence: 'HH:MM' 24-hour UTC format if specified.
   - time_of_occurrence_ist: 'HH:MM' 24-hour IST format if specified.
   - flight_no: Flight number (e.g., 'QP-142', 'AI-802', '6E-204').
   - registration: Aircraft registration (e.g., 'VT-YAA').
   - callsign: ATC callsign (e.g., 'QP-142').
   - flight_duration: Duration format 'HH:MM'.

3. ROUTE & DETAILS:
   - departure: Departure airport name or IATA/ICAO code (e.g., 'BOM', 'DEL', 'Mumbai').
   - destination: Destination airport name or IATA/ICAO code.
   - diverted_to: Diversion airport if applicable.
   - flight_phase: e.g., 'Taxi', 'Take-off', 'Climb', 'Cruise', 'Descent', 'Approach', 'Landing', 'Go-Around'.
   - altitude_ft & flight_level: e.g., '36000' and 'FL360'.
   - speed_knots & speed_mach: Speed values mentioned.
   - runway_used: e.g., '27R', '09L'.
   - runway_condition: e.g., 'Dry', 'Wet', 'Damp'.
   - cvr_download_requested, techlog_entry, atc_informed: Set to 'Yes' or 'No'.
   - atc_unit & atc_time: ATC frequency/unit and time contacted.

4. AIRCRAFT CONFIGURATION:
   - autopilot: 'Engaged', 'Disengaged', or 'Off'.
   - autothrottle: 'Engaged', 'Disengaged', or 'Off'.
   - spoilers: 'Armed', 'Retracted', or 'Deployed'.
   - flap_setting: e.g., 'Flaps 5', 'Flaps 15', 'Flaps 30'.
   - landing_gear: 'Up' or 'Down'.

5. CREW:
   - captain, first_officer, sccm, ccm1-5, observer.

6. METEOROLOGICAL:
   - wind_bearing: Degrees (e.g., '270').
   - wind_velocity: Knots (e.g., '15').
   - temperature_c: Temperature in Celsius (e.g., '28').
   - qnh: Pressure in mbar (e.g., '1013').
   - visibility_m: Visibility in meters (e.g., '5000').
   - turbulence: 'None', 'Light', 'Moderate', or 'Severe'.
   - icing: 'None', 'Light', 'Moderate', or 'Severe'.
   - light_condition: 'Day', 'Night', 'Dawn', or 'Dusk'.

7. DESCRIPTION:
   - description & incident_description: Clear, comprehensive summary of the entire event as reported.
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
    """Map a transcript onto the QMSmart ASR form fields using Azure OpenAI structured outputs."""
    async with AsyncOpenAI(api_key=OPENAI_KEY, base_url=OPENAI_BASE_URL, timeout=60) as client:
        response = await client.responses.parse(
            model=OPENAI_DEPLOYMENT,
            instructions=PROMPT.format(today=date.today().isoformat()),
            input=transcript,
            text_format=ExtractedForm,
            reasoning={"effort": "low"},
        )
    
    parsed = response.output_parsed
    # Ensure fallbacks and mirror fields are populated
    if not parsed.incident_title and parsed.title:
        parsed.incident_title = parsed.title
    if not parsed.title and parsed.incident_title:
        parsed.title = parsed.incident_title

    if not parsed.incident_description and parsed.description:
        parsed.incident_description = parsed.description
    if not parsed.description and parsed.incident_description:
        parsed.description = parsed.incident_description

    if not parsed.time_of_occurrence and parsed.time_of_occurrence_utc:
        parsed.time_of_occurrence = parsed.time_of_occurrence_utc
    elif not parsed.time_of_occurrence and parsed.time_of_occurrence_ist:
        parsed.time_of_occurrence = parsed.time_of_occurrence_ist

    if not parsed.place_of_occurrence and parsed.location_airport:
        parsed.place_of_occurrence = parsed.location_airport
    elif not parsed.place_of_occurrence and parsed.location_position:
        parsed.place_of_occurrence = parsed.location_position

    return parsed


@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "QMSmart ASR Voice Autofill API",
        "version": "1.14.c"
    }


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
