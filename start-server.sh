#!/bin/bash

# Start the Question Generator Server
echo "Starting Question Generator Server..."

# Set up Node.js path
export PATH="/Users/apple/Desktop/Project/node/bin:$PATH"

# Change to server directory
cd /Users/apple/Desktop/Project/server

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found in server directory"
    echo "Please make sure OPENAI_API_KEY is set in server/.env"
    exit 1
fi

# Start the server
echo "Server starting on http://localhost:3001"
echo "Health check: http://localhost:3001/health"
echo "Press Ctrl+C to stop the server"
node server.js