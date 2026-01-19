// LocalStorage key for recent tasks
const STORAGE_KEY = 'rag_recent_tasks';

// Default API URL (Render server)
const DEFAULT_API_URL = 'https://docrag-2gvg.onrender.com';

// Keep-alive interval (14 minutes - Render sleeps after 15 min of inactivity)
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadRecentTasks();

    // Load saved API URL or use default
    const savedUrl = localStorage.getItem('apiUrl');
    if (savedUrl) {
        document.getElementById('apiUrl').value = savedUrl;
    }

    // Save API URL on change
    document.getElementById('apiUrl').addEventListener('change', (e) => {
        localStorage.setItem('apiUrl', e.target.value);
        checkHealth();
    });

    // Check health every 30 seconds
    setInterval(checkHealth, 30000);

    // Keep-alive ping every 14 minutes to prevent Render from sleeping
    startKeepAlive();
});

// Keep-alive function to prevent Render server from sleeping
function startKeepAlive() {
    async function ping() {
        const apiUrl = getApiUrl();
        try {
            await fetch(`${apiUrl}/api/v1/health`, { method: 'GET' });
            console.log(`[Keep-alive] Pinged server at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.log(`[Keep-alive] Ping failed: ${error.message}`);
        }
    }

    // Ping immediately on load
    ping();

    // Then ping every 14 minutes
    setInterval(ping, KEEP_ALIVE_INTERVAL);
}

function getApiUrl() {
    return document.getElementById('apiUrl').value.replace(/\/$/, '');
}

function showResult(elementId, message, type = 'info', extraContent = '') {
    const resultDiv = document.getElementById(elementId);
    resultDiv.className = `result show ${type}`;
    resultDiv.innerHTML = `
        <div>${message}</div>
        ${extraContent}
    `;
}

function hideResult(elementId) {
    const resultDiv = document.getElementById(elementId);
    resultDiv.className = 'result';
    resultDiv.innerHTML = '';
}

async function checkHealth() {
    const apiUrl = getApiUrl();
    const statusIndicator = document.getElementById('apiStatus');
    const statusText = document.getElementById('apiStatusText');

    try {
        const response = await fetch(`${apiUrl}/api/v1/health`);
        if (response.ok) {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'API Online';
        } else {
            throw new Error('API returned error');
        }
    } catch (error) {
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'API Offline';
    }
}

async function uploadPDF() {
    const fileInput = document.getElementById('pdfFile');
    const force = document.getElementById('forceUpload').checked;

    if (!fileInput.files || fileInput.files.length === 0) {
        showResult('uploadResult', 'Please select a PDF file', 'error');
        return;
    }

    const file = fileInput.files[0];

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showResult('uploadResult', 'Please select a valid PDF file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = getApiUrl();
    const url = `${apiUrl}/api/v1/upload${force ? '?force=true' : ''}`;

    showResult('uploadResult', 'Uploading...', 'info');

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Upload failed');
        }

        // Save to recent tasks
        if (data.task_id) {
            saveTask({
                task_id: data.task_id,
                doc_id: data.doc_id,
                filename: file.name,
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            // Auto-populate task ID field
            document.getElementById('taskId').value = data.task_id;
            document.getElementById('docId').value = data.doc_id;
        }

        const extraContent = `
            <pre>${JSON.stringify(data, null, 2)}</pre>
            ${data.task_id ? `<div style="margin-top: 10px;"><button class="btn btn-secondary" onclick="document.getElementById('taskId').value='${data.task_id}'; checkStatus();">Check Status</button></div>` : ''}
        `;

        showResult('uploadResult', data.message, 'success', extraContent);
        loadRecentTasks();

    } catch (error) {
        showResult('uploadResult', `Error: ${error.message}`, 'error');
    }
}

async function checkStatus() {
    const taskId = document.getElementById('taskId').value.trim();

    if (!taskId) {
        showResult('statusResult', 'Please enter a task ID', 'error');
        return;
    }

    const apiUrl = getApiUrl();
    showResult('statusResult', 'Checking status...', 'info');

    try {
        const response = await fetch(`${apiUrl}/api/v1/status/${taskId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Status check failed');
        }

        let statusType = 'info';
        if (data.status === 'SUCCESS') {
            statusType = 'success';
        } else if (data.status === 'FAILURE') {
            statusType = 'error';
        }

        const extraContent = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        showResult('statusResult', `Task Status: ${data.status}`, statusType, extraContent);

        // Update task in storage
        updateTaskStatus(taskId, data.status.toLowerCase());
        loadRecentTasks();

    } catch (error) {
        showResult('statusResult', `Error: ${error.message}`, 'error');
    }
}

async function sendChat() {
    const query = document.getElementById('chatQuery').value.trim();
    const docId = document.getElementById('docId').value.trim();

    if (!query) {
        showResult('chatResult', 'Please enter a query', 'error');
        return;
    }

    const apiUrl = getApiUrl();
    const requestBody = {
        query: query
    };

    if (docId) {
        requestBody.doc_id = docId;
    }

    showResult('chatResult', 'Processing query...', 'info');

    try {
        const response = await fetch(`${apiUrl}/api/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Chat request failed');
        }

        // Build citations HTML
        let citationsHtml = '';
        if (data.citations && data.citations.length > 0) {
            citationsHtml = '<div class="citations"><strong>Citations:</strong>';
            data.citations.forEach((citation, index) => {
                citationsHtml += `
                    <div class="citation">
                        <div class="citation-meta">
                            Source ${index + 1}: ${citation.filename || 'Unknown'}
                            ${citation.page ? `(Page ${citation.page})` : ''}
                            ${citation.doc_id ? `<div class="doc-id">Doc ID: ${citation.doc_id}</div>` : ''}
                        </div>
                        <div class="citation-text">"${citation.text_snippet}"</div>
                    </div>
                `;
            });
            citationsHtml += '</div>';
        }

        const answerHtml = `
            <div class="answer-box">
                <div class="answer-label">Answer:</div>
                <div class="answer-text">${escapeHtml(data.answer)}</div>
            </div>
            ${citationsHtml}
        `;

        showResult('chatResult', 'Query completed successfully', 'success', answerHtml);

    } catch (error) {
        showResult('chatResult', `Error: ${error.message}`, 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

function saveTask(task) {
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    // Check if task already exists
    const existingIndex = tasks.findIndex(t => t.task_id === task.task_id);
    if (existingIndex >= 0) {
        tasks[existingIndex] = task;
    } else {
        tasks.unshift(task);
    }

    // Keep only last 10 tasks
    tasks = tasks.slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function updateTaskStatus(taskId, status) {
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const task = tasks.find(t => t.task_id === taskId);

    if (task) {
        task.status = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
}

function loadRecentTasks() {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const container = document.getElementById('recentTasks');

    if (tasks.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No recent tasks</p>';
        return;
    }

    container.innerHTML = tasks.map(task => {
        const timestamp = new Date(task.timestamp).toLocaleString();
        return `
            <div class="task-item">
                <div class="task-item-header">
                    <div>
                        <div style="font-weight: 600; color: #374151;">${task.filename || 'Unknown file'}</div>
                        <div class="task-id">Task: ${task.task_id}</div>
                        ${task.doc_id ? `<div class="doc-id">Doc: ${task.doc_id}</div>` : ''}
                    </div>
                    <span class="task-status ${task.status}">${task.status.toUpperCase()}</span>
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">${timestamp}</div>
                <div style="margin-top: 10px;">
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 14px;"
                            onclick="document.getElementById('taskId').value='${task.task_id}'; checkStatus();">
                        Check Status
                    </button>
                    <button class="btn btn-success" style="padding: 6px 12px; font-size: 14px;"
                            onclick="document.getElementById('docId').value='${task.doc_id}';">
                        Use in Chat
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Clear recent tasks (optional utility function)
function clearRecentTasks() {
    if (confirm('Clear all recent tasks?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadRecentTasks();
    }
}
