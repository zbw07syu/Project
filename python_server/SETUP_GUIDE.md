# Vocabulary Generator Server - Setup Guide

This guide will walk you through setting up and running the Python vocabulary generator server with local image storage.

## Prerequisites

- **Python 3.8 or higher** - Check with `python3 --version`
- **pip** - Python package installer
- **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
- **OpenAI Account with Credits** - DALL-E 3 requires API credits

## Quick Start (5 minutes)

### 1. Navigate to Server Directory

```bash
cd /Users/apple/Desktop/Project/python_server
```

### 2. Run the Setup Script

```bash
./start_server.sh
```

The script will:
- Create a virtual environment
- Install dependencies
- Check for .env file
- Create vocab_images directory
- Start the server

### 3. Configure API Key

If this is your first time, the script will create a `.env` file. Edit it:

```bash
nano .env
```

Replace `your_api_key_here` with your actual OpenAI API key:

```
OPENAI_API_KEY=sk-proj-abc123...
```

Save and exit (Ctrl+X, then Y, then Enter).

### 4. Start the Server Again

```bash
./start_server.sh
```

You should see:
```
Starting Vocabulary Generator Server on port 3001
Images will be saved to: /path/to/vocab_images
API Key configured: True
```

### 5. Test the Server

Open a new terminal and run:

```bash
cd /Users/apple/Desktop/Project/python_server
source venv/bin/activate
python test_server.py
```

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit and add your API key
```

### 4. Create Images Directory

```bash
mkdir -p vocab_images
```

### 5. Start Server

```bash
python server.py
```

## Verifying Installation

### Check Server is Running

Open your browser and go to:
```
http://localhost:3001/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Vocabulary Generator Server is running",
  "images_directory": "/path/to/vocab_images",
  "images_count": 0
}
```

### Test Vocabulary Generation

Use curl or a tool like Postman:

```bash
curl -X POST http://localhost:3001/generate_vocab \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "Animals",
    "numWords": 3
  }'
```

This will:
1. Generate 3 animal-related vocabulary words
2. Create images using DALL-E 3
3. Save images to `vocab_images/`
4. Return vocabulary with local image paths

**Note:** This may take 30-60 seconds as DALL-E 3 generates each image.

## Troubleshooting

### "OPENAI_API_KEY not found"

**Problem:** API key not configured

**Solution:**
1. Make sure `.env` file exists
2. Check that it contains `OPENAI_API_KEY=sk-...`
3. Restart the server

### "Port 3001 already in use"

**Problem:** Another service is using port 3001

**Solution:**
1. Stop the other service, or
2. Change port in `.env`:
   ```
   PORT=3002
   ```

### "Module not found" errors

**Problem:** Dependencies not installed

**Solution:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Images not generating

**Problem:** DALL-E 3 API issues

**Possible causes:**
1. **Insufficient credits** - Check your OpenAI account billing
2. **API key lacks DALL-E access** - Verify permissions
3. **Rate limiting** - Wait a few minutes and try again

**Check logs:**
```bash
# Server logs will show specific errors
# Look for lines like:
# ERROR - Error generating image for 'word': ...
```

### "Connection refused" when testing

**Problem:** Server not running

**Solution:**
1. Start the server: `./start_server.sh`
2. Wait for "Server running" message
3. Try test again

## Understanding the File Structure

```
python_server/
├── server.py              # Main server application
├── requirements.txt       # Python dependencies
├── .env                   # Your API key (DO NOT COMMIT)
├── .env.example          # Template for .env
├── .gitignore            # Git ignore rules
├── README.md             # Detailed documentation
├── SETUP_GUIDE.md        # This file
├── start_server.sh       # Startup script
├── test_server.py        # Test suite
├── venv/                 # Virtual environment (created on setup)
└── vocab_images/         # Generated images (created on first use)
    ├── .gitkeep          # Keeps directory in git
    ├── ocean.png         # Example generated image
    └── mountain.png      # Example generated image
```

## Next Steps

### 1. Integrate with Frontend

Update your frontend code to use the new server:

```javascript
// Old code (Unsplash URLs)
const imageUrl = vocab.imageUrl;

// New code (Local images)
const imageUrl = `http://localhost:3001/${vocab.image}`;
```

### 2. Generate Your First Vocabulary List

Use the editor in your Wingit! app:
1. Go to the Editor
2. Create a new Vocab list
3. Click "Generate with AI"
4. Enter a theme (e.g., "Ocean Life")
5. Choose number of words
6. Wait for generation (30-60 seconds)
7. Images will be saved locally!

### 3. Test with Memory Madness Game

1. Generate a vocab list
2. Open Memory Madness game
3. Select your vocab list
4. Play the game
5. Images should load from local server (no broken links!)

## Production Deployment

For production use, consider:

1. **Use a production WSGI server:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:3001 server:app
   ```

2. **Set up a reverse proxy** (nginx) with SSL

3. **Use environment-based configuration**

4. **Set up monitoring and logging**

5. **Configure automatic backups** of vocab_images/

## Cost Management

### DALL-E 3 Pricing
- **Standard quality (1024x1024):** ~$0.040 per image
- **10 words:** ~$0.40
- **50 words:** ~$2.00

### Tips to Reduce Costs
1. **Don't regenerate unnecessarily** - Images are cached locally
2. **Use smaller batches** - Generate 5-10 words at a time
3. **Delete unused images** - Free up space and avoid confusion
4. **Monitor usage** - Check OpenAI dashboard regularly

## Getting Help

### Check Logs
Server logs show detailed information about what's happening:
- API calls
- Image generation status
- Errors and warnings

### Common Issues
1. **Slow generation** - Normal for DALL-E 3 (30-60 seconds per image)
2. **Some images fail** - Check API quota and retry
3. **Images look wrong** - Try regenerating with `forceRegenerate: true`

### Resources
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [DALL-E 3 Guide](https://platform.openai.com/docs/guides/images)
- [Flask Documentation](https://flask.palletsprojects.com/)

## Security Notes

### Important
- **Never commit `.env` file** - Contains your API key
- **Keep API key secret** - Don't share or expose it
- **Monitor API usage** - Set up billing alerts
- **Use HTTPS in production** - Protect API communications

### API Key Safety
Your `.env` file is in `.gitignore` to prevent accidental commits. If you accidentally commit it:
1. Immediately revoke the API key in OpenAI dashboard
2. Generate a new key
3. Update `.env` with new key
4. Remove key from git history

## Success Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] `.env` file configured with API key
- [ ] Server starts without errors
- [ ] Health check returns OK
- [ ] Test vocabulary generation works
- [ ] Images saved to vocab_images/
- [ ] Images accessible via HTTP
- [ ] Frontend updated to use local images

## Congratulations! 🎉

Your vocabulary generator server is now set up and ready to use. You'll never have broken image links again!

### What You've Achieved
✅ Local image storage (no more broken URLs)
✅ DALL-E 3 integration (high-quality, relevant images)
✅ Automatic caching (images generated once)
✅ Error handling (graceful failures)
✅ Production-ready server (scalable and reliable)

Enjoy creating vocabulary lists with beautiful, permanent images!