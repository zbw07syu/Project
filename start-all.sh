#!/bin/bash

# Start both backend and frontend servers

echo "🚀 Starting Question Editor Application..."
echo ""

# Start backend server (AI generation)
echo "1️⃣  Starting backend server (port 3001)..."
cd /Users/apple/Desktop/Project/server_backup
/Users/apple/Desktop/Project/node/bin/node server.js > /tmp/backend-server.log 2>&1 &
BACKEND_PID=$!
echo "   Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "2️⃣  Starting frontend server (port 8080)..."
cd /Users/apple/Desktop/Project
python3 -m http.server 8080 > /tmp/frontend-server.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ Both servers are running!"
echo ""
echo "📝 Backend logs: /tmp/backend-server.log"
echo "📝 Frontend logs: /tmp/frontend-server.log"
echo ""
echo "🌐 Open your browser and go to:"
echo "   http://localhost:8080"
echo ""
echo "⚠️  DO NOT open index.html directly - use the URL above!"
echo ""
echo "To stop the servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"