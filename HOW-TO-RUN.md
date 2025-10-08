# How to Run the Question Editor with AI Generation

## Important: You MUST use the web server, not open files directly!

### The Problem
If you open `index.html` by double-clicking it, your browser opens it as `file:///...` which causes CORS errors when trying to connect to the AI generation server on port 3001.

### The Solution
You need to run TWO servers:

## Step 1: Start the Backend Server (AI Generation)
```bash
cd /Users/apple/Desktop/Project
./start-server.sh
```

This starts the Node.js server on **port 3001** that handles AI question generation.

## Step 2: Start the Frontend Server
```bash
cd /Users/apple/Desktop/Project
python3 -m http.server 8080
```

This serves your HTML/CSS/JS files on **port 8080**.

## Step 3: Open in Browser
Open your browser and go to:
```
http://localhost:8080
```

**DO NOT** open `index.html` directly by double-clicking it!

## Verify Everything is Running

Check both servers are running:
```bash
# Check backend (should show node on port 3001)
lsof -i :3001

# Check frontend (should show Python on port 8080)
lsof -i :8080
```

## Current Status
✅ Backend server is running (PID: 72914)
✅ Frontend server is running (PID: 73760)

You should now be able to use the "Generate" button for vocab lists!

## Troubleshooting

### "Failed to generate questions" error
- Make sure you're accessing via http://localhost:8080 (not file://)
- Check both servers are running with the commands above
- Check browser console (F12) for detailed error messages

### Port already in use
If you get "Address already in use" errors:
```bash
# Kill process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill

# Kill process on port 8080
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill
```

Then restart the servers.