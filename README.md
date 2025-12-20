# docRAG

A document question-answering system that extracts text from PDFs using OCR and enables semantic search through a REST API.

## Architecture

- **FastAPI** backend with async processing via Celery
- **Redis** for task queue management
- **doctr** for OCR text extraction
- **Qdrant** vector database for semantic search
- **Ollama** (local) or **OpenRouter** (cloud) for LLM inference

## Requirements

- Docker & Docker Compose
- (Optional) Make for build shortcuts

## Setup

Create a `.env` file with the following variables:

```env
LLM_PROVIDER=ollama           # or "openrouter"
LLM_MODEL=llama3             # model name for your provider
OPENROUTER_API_KEY=          # required only if using OpenRouter
```

## Running

Start all services:

```bash
docker-compose up -d --build
```

This launches:
- Redis (task queue)
- Qdrant (vector database on port 6333)
- API server (port 8000)
- Celery worker (background processing)
- Ollama (if configured for local inference)

## Usage

### Web Interface

Open [frontend/index.html](frontend/index.html) in your browser for a simple UI to upload PDFs and ask questions.

See [frontend/QUICK_START.md](frontend/QUICK_START.md) for more details.

### Command Line

Upload a PDF:
```bash
./scripts/load_small_pdf.sh "/path/to/document.pdf"
```

Query your documents:
```bash
./scripts/query_rag.sh "What is the main topic of the document?"
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/upload` | POST | Upload a PDF for processing |
| `/api/v1/status/{task_id}` | GET | Check processing status of uploaded document |
| `/api/v1/chat` | POST | Query documents with natural language |

## Development

Run tests:
```bash
docker-compose run api pytest
```

## Troubleshooting

**OCR processing fails**
Check worker logs: `docker-compose logs -f worker`

**Connection errors**
Verify Qdrant is running: `curl http://localhost:6333/collections`
