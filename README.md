# docRAG

A document question-answering system that extracts text from PDFs using OCR and enables semantic search through a REST API.

## Architecture

- **FastAPI** backend with async processing via Celery
- **Redis** for task queue management
- **doctr** for OCR text extraction
- **Qdrant** vector database for semantic search
- **Sentence Transformers** for generating embeddings (local)
- **Ollama** (local) or **OpenRouter** (cloud) for LLM inference
- **Nginx** serving the frontend UI

### How It Works

The system uses **two different models** for different purposes:

```
PDF → OCR → Text chunks → Embedding Model → Vectors stored in Qdrant
                                                    ↓
User Query → Embedding Model → Vector search → Top K chunks retrieved
                                                    ↓
                              Retrieved chunks + Query → LLM → Answer
```

1. **Embedding Model** (local, free) - Converts text into vectors for semantic search
2. **LLM Model** (local or cloud) - Generates natural language answers from retrieved context

## Requirements

- Docker & Docker Compose
- (Optional) Make for build shortcuts

## Setup

Create a `.env` file to configure your models.

### LLM Configuration

Choose one of the following LLM providers:

#### Option 1: Ollama (Local - Free)

```env
LLM_PROVIDER=ollama
LLM_MODEL=llama3
```

After starting Docker, pull the model:
```bash
docker-compose exec ollama ollama pull llama3
```

Available Ollama models: `llama3`, `llama3.2`, `mistral`, `codellama`, `phi3`, etc.

#### Option 2: OpenRouter (Cloud - Paid)

```env
LLM_PROVIDER=openrouter
LLM_MODEL=google/gemini-2.0-flash-001
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your API key at https://openrouter.ai/keys

Popular OpenRouter models:
- `google/gemini-2.0-flash-001` - Fast and cheap
- `anthropic/claude-3.5-sonnet` - High quality
- `meta-llama/llama-3-70b-instruct` - Open source
- `openai/gpt-4o-mini` - Good balance

See all models at https://openrouter.ai/models

### Embedding Model Configuration

The embedding model runs locally and is configured via the `EMBEDDING_MODEL` environment variable. Default is `all-MiniLM-L6-v2`.

```env
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

To change the embedding model:

1. Update your `.env` file:
   ```env
   EMBEDDING_MODEL=all-mpnet-base-v2
   ```

2. Restart the services:
   ```bash
   docker-compose restart api worker
   ```

3. **Important**: If you change the embedding model after uploading documents, you must re-upload them. Different models produce incompatible vectors.

Available embedding models (from [Sentence Transformers](https://www.sbert.net/docs/pretrained_models.html)):

| Model | Dimensions | Speed | Quality |
|-------|------------|-------|---------|
| `all-MiniLM-L6-v2` | 384 | Fast | Good (default) |
| `all-MiniLM-L12-v2` | 384 | Medium | Better |
| `all-mpnet-base-v2` | 768 | Slow | Best |
| `paraphrase-MiniLM-L6-v2` | 384 | Fast | Good for paraphrasing |

### Complete .env Example

```env
# LLM Configuration
LLM_PROVIDER=openrouter          # or "ollama"
LLM_MODEL=google/gemini-2.0-flash-001
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Embedding Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Optional: RAG tuning
RAG_TOP_K=5                      # Number of chunks to retrieve
CHUNK_TOKENS=500                 # Size of text chunks
CHUNK_OVERLAP_TOKENS=50          # Overlap between chunks
```

## Running

Start all services:

```bash
docker-compose up -d --build
```

This launches:
- **Redis** - task queue (port 6379)
- **Qdrant** - vector database (port 6333)
- **Ollama** - local LLM inference (port 11434) - only used if `LLM_PROVIDER=ollama`
- **API** - FastAPI backend (port 8000)
- **Worker** - Celery background processing
- **Frontend** - Web UI (port 8080)

## Usage

### Web Interface

Open http://localhost:8080 in your browser for the frontend UI.

**Features:**
- Health check indicator showing API status
- PDF upload with optional force re-processing
- Task status monitoring
- Chat/query interface with document filtering
- Recent tasks tracking

### Quick Start Workflow

1. **Upload a PDF**
   - Select a PDF file and click "Upload PDF"
   - Note the `task_id` and `doc_id` returned

2. **Monitor Processing**
   - The task ID auto-fills for status checking
   - Status progresses: PENDING → PROCESSING → SUCCESS

3. **Query Documents**
   - Enter your question
   - Optionally specify a `doc_id` to search only that document
   - View the answer and citations

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

All endpoints are prefixed with `/api/v1`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/upload` | POST | Upload a PDF for processing |
| `/api/v1/status/{task_id}` | GET | Check processing status |
| `/api/v1/chat` | POST | Query documents with natural language |

## Development

Run tests:
```bash
docker-compose run api pytest
```

View logs:
```bash
docker-compose logs -f api      # API logs
docker-compose logs -f worker   # Worker logs
docker-compose logs -f ollama   # LLM logs
```

## Troubleshooting

### Model not found error
```
model 'llama3' not found
```
Pull the model: `docker-compose exec ollama ollama pull llama3`

### API shows "Offline" in frontend
- Check containers are running: `docker-compose ps`
- Check API logs: `docker-compose logs api`
- Verify API URL is `http://localhost:8000` in frontend settings

### OCR processing fails
Check worker logs: `docker-compose logs -f worker`

### Status stays "PENDING"
- Check worker is running: `docker-compose ps`
- Check worker logs: `docker-compose logs worker`
- Verify Redis and Qdrant are healthy

### Connection errors
Verify Qdrant is running: `curl http://localhost:6333/collections`

### No results when querying
- Ensure document processing completed (status: SUCCESS)
- Check if embeddings were generated in the worker logs
- Try a more specific question

### Changed embedding model but search doesn't work
If you change `EMBEDDING_MODEL` after uploading documents, the old vectors are incompatible. Re-upload your documents to regenerate embeddings with the new model.
