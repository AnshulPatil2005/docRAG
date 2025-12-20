# RAG Pipeline Frontend Tester

A simple, standalone HTML/CSS/JavaScript frontend for testing the RAG Pipeline API endpoints.

## Features

- **Health Check**: Automatically monitors API status
- **PDF Upload**: Upload PDF files for processing with optional force re-processing
- **Task Status**: Check the status of processing tasks
- **Chat/Query**: Query documents using RAG with optional document filtering
- **Recent Tasks**: Track and manage recently uploaded documents
- **Responsive UI**: Clean, modern interface with visual feedback

## Usage

### Prerequisites

Make sure the RAG Pipeline API is running (see main project README).

### Running the Frontend

1. **Option 1: Open directly in browser**
   - Simply open `index.html` in your web browser
   - No server required - it's a static HTML page

2. **Option 2: Use a local server (recommended for development)**
   ```bash
   # Using Python
   python -m http.server 8080

   # Or using Node.js
   npx http-server -p 8080
   ```

   Then navigate to `http://localhost:8080` in your browser

### Configuration

- **API URL**: Set the base URL of your RAG API (default: `http://localhost:8000`)
- The URL is saved in browser localStorage and persists across sessions

## Workflow

1. **Upload a PDF**
   - Select a PDF file
   - Optionally check "Force re-process" to reprocess existing files
   - Click "Upload PDF"
   - Note the Task ID and Doc ID returned

2. **Monitor Processing**
   - Use the Task ID to check processing status
   - Status will show: PENDING, PROCESSING, SUCCESS, or FAILURE
   - Recent tasks are automatically saved and displayed

3. **Query Documents**
   - Enter your question in the query box
   - Optionally specify a Doc ID to search only that document
   - Click "Send Query"
   - View the answer and citations

## API Endpoints Tested

- `GET /health` - Health check
- `POST /upload` - Upload PDF with optional force parameter
- `GET /status/{task_id}` - Check task processing status
- `POST /chat` - Query documents with RAG

## Browser Compatibility

Works with all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Notes

- This frontend is completely separate from the Docker container
- All data (recent tasks, API URL) is stored in browser localStorage
- No backend or build process required
- CORS must be enabled on the API for cross-origin requests
