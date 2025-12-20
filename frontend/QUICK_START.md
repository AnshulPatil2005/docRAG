# Quick Start Guide

## Step 1: Start the Backend API

Make sure the RAG Pipeline API is running. From the project root directory:

```bash
# Start all services with Docker Compose
docker-compose up --build

# Or if already built
docker-compose up
```

The API will be available at `http://localhost:8000`

## Step 2: Open the Frontend

Simply open the `index.html` file in your web browser:

```bash
# On Windows
start frontend/index.html

# On macOS
open frontend/index.html

# On Linux
xdg-open frontend/index.html
```

Or drag and drop the `index.html` file into your browser.

## Step 3: Test the API

### 1. Verify Connection
The top right should show "API Online" with a green indicator.

### 2. Upload a PDF
- Click "Choose File" and select a PDF
- Click "Upload PDF"
- Note the `task_id` and `doc_id` in the response

### 3. Check Processing Status
- The task ID will be auto-filled from the upload
- Click "Check Status"
- Status will show: PENDING → PROCESSING → SUCCESS

### 4. Query Your Documents
- Enter a question like "What is this document about?"
- Optionally paste the `doc_id` to search only that document
- Click "Send Query"
- View the answer and citations

## API Endpoints

All endpoints are prefixed with `/api/v1`:

- `GET /api/v1/health` - Health check
- `POST /api/v1/upload` - Upload PDF
- `GET /api/v1/status/{task_id}` - Check task status
- `POST /api/v1/chat` - Query documents

## Troubleshooting

### API shows "Offline"
- Check that Docker containers are running: `docker-compose ps`
- Check the API URL in the settings (should be `http://localhost:8000`)
- Check logs: `docker-compose logs api`

### CORS errors in browser console
- CORS is configured to allow all origins in development
- If you see CORS errors, the API might not be running properly

### Upload fails
- Check file is a valid PDF
- Check file size is under the limit (default: 100MB)
- Check API logs for errors

### Status stays "PENDING"
- Check that the worker container is running: `docker-compose ps`
- Check worker logs: `docker-compose logs worker`
- Check Redis and Qdrant are running

### No results when querying
- Make sure the document has been fully processed (status: SUCCESS)
- Try a more specific question
- Check if embeddings were generated successfully in the logs

## Features

- **Auto-save**: Recent uploads are saved in browser localStorage
- **Quick access**: Click "Use in Chat" on recent tasks to query that document
- **Visual feedback**: Color-coded status indicators and results
- **Citations**: See which parts of the document were used to generate answers
