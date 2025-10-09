#!/bin/bash

# Vocabulary Generator Server Startup Script

echo "==================================="
echo "Vocabulary Generator Server"
echo "==================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "❌ Please edit .env and add your OPENAI_API_KEY"
    echo "   Then run this script again."
    echo ""
    exit 1
fi

# Check if dependencies are installed
if ! python -c "import flask" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if API key is set
if grep -q "your_api_key_here" .env; then
    echo "❌ Error: OPENAI_API_KEY not configured in .env"
    echo "   Please edit .env and add your actual API key"
    echo ""
    exit 1
fi

# Create vocab_images directory if it doesn't exist
mkdir -p vocab_images
echo "✓ vocab_images directory ready"
echo ""

# Start the server
echo "Starting server..."
echo "Server will be available at: http://localhost:3001"
echo "Press Ctrl+C to stop the server"
echo ""
python server.py