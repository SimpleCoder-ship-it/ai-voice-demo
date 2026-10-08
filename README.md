# AI Voice Demo

An AI-powered voice form-filling application that converts spoken input to structured form data using Azure Speech-to-Text and Azure OpenAI.

## Project Structure

- **`backend/`**: FastAPI backend service handling audio processing, speech-to-text, and LLM extraction.
- **`frontend/`**: Modern React + Vite frontend with real-time audio recording and dynamic form UI.
- **`docker-compose.yml`**: Docker orchestration setup.

## Setup & Running

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your Azure service credentials:
```bash
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Or Run with Docker
```bash
docker-compose up --build
```
