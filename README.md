# PDF RAG System

A production-ready project that accepts only PDF files, processes them asynchronously with Redis and Celery for fast OCR, creates vector embeddings, stores them in Qdrant, and exposes a RAG question answering API.

## Features

- **Async Processing**: Uses Celery and Redis to handle PDF OCR and embedding generation in the background.
- **OCR**: Uses `doctr` for accurate OCR, extracting text from images within PDFs.
- **RAG**: Retrieves relevant chunks from Qdrant and uses Ollama (local) or OpenRouter (cloud) for answering.
- **Vector Store**: Qdrant for storing embeddings and metadata.
- **API**: FastAPI for upload and chat endpoints.

## Prerequisites

- Docker and Docker Compose
- Make (optional)

## Configuration

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

Key variables:
- `LLM_PROVIDER`: `ollama` or `openrouter`
- `LLM_MODEL`: e.g. `llama3` for Ollama
- `OPENROUTER_API_KEY`: If using OpenRouter

## Running the Application

Start the stack:

```bash
docker-compose up -d --build
```

This starts:
- Redis
- Qdrant
- Ollama (optional, if you have it locally or in docker)
- API (port 8000)
- Worker

## Usage

### Option 1: Web Frontend (Recommended)

A simple web interface is available in the `frontend/` directory:

```bash
# Open the frontend in your browser
open frontend/index.html  # macOS
start frontend/index.html # Windows
xdg-open frontend/index.html # Linux
```

See [frontend/QUICK_START.md](frontend/QUICK_START.md) for details.

### Option 2: Command Line Scripts

#### 1. Upload a PDF

```bash
./scripts/load_small_pdf.sh "C:\Users\dpati\Downloads\resumecp (1).pdf"
```

#### 2. Query the Document

```bash
./scripts/query_rag.sh "What is the summary of the document?"
```

## API Endpoints

- `POST /api/v1/upload`: Upload a PDF file.
- `GET /api/v1/status/{task_id}`: Check processing status.
- `POST /api/v1/chat`: Ask a question about uploaded documents.

## Development

Run tests:

```bash
docker-compose run api pytest
```

## Troubleshooting

- **OCR Failures**: Check worker logs. `docker-compose logs -f worker`
- **Qdrant Connection**: Ensure Qdrant is running on port 6333.
