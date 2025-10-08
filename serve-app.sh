#!/bin/bash

# Simple HTTP server to serve the frontend
# This avoids CORS issues when opening index.html directly

echo "Starting frontend server on http://localhost:8000"
echo "Open http://localhost:8000 in your browser"
echo "Press Ctrl+C to stop"

cd /Users/apple/Desktop/Project
python3 -m http.server 8000