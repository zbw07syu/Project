#!/bin/bash

# Start the Question Generator Server
echo "Starting Question Generator Server..."

# Set up Node.js path (use local node if available, otherwise system node)
PROJECT_DIR="/Users/apple/Desktop/Project"
if [ -f "$PROJECT_DIR/node/bin/node" ]; then
    NODE_BIN="$PROJECT_DIR/node/bin/node"
    echo "Using local Node.js: $NODE_BIN"
elif command -v node &> /dev/null; then
    NODE_BIN="node"
    echo "Using system Node.js"
else
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Change to server directory
cd /Users/apple/Desktop/Project/server_backup

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found in server_backup directory"
    echo "Please make sure OPENAI_API_KEY is set in server_backup/.env"
    exit 1
fi

# Start the server
echo "Server starting on http://localhost:3001"
echo "Health check: http://localhost:3001/health"
echo "Press Ctrl+C to stop the server"
$NODE_BIN server.js