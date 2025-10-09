# Quick Reference - Vocabulary Generator Server

## Common Commands

### Start Server
```bash
cd /Users/apple/Desktop/Project/python_server
./start_server.sh
```

### Stop Server
Press `Ctrl+C` in the terminal running the server

### Run Tests
```bash
cd /Users/apple/Desktop/Project/python_server
source venv/bin/activate
python test_server.py
```

### Check Server Status
```bash
curl http://localhost:3001/health
```

## API Endpoints

### Generate Vocabulary
```bash
curl -X POST http://localhost:3001/generate_vocab \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "Your Theme Here",
    "numWords": 10,
    "forceRegenerate": false
  }'
```

### Access Image
```
http://localhost:3001/vocab_images/word.png
```

## File Locations

| Item | Location |
|------|----------|
| Server code | `python_server/server.py` |
| Configuration | `python_server/.env` |
| Generated images | `python_server/vocab_images/` |
| Logs | Terminal output |
| Virtual environment | `python_server/venv/` |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Server won't start | Check `.env` has valid API key |
| Port in use | Change `PORT` in `.env` |
| Images not generating | Check OpenAI credits/billing |
| Module not found | Run `pip install -r requirements.txt` |
| Connection refused | Make sure server is running |

## Configuration

### Environment Variables (.env)
```bash
OPENAI_API_KEY=sk-your-key-here
PORT=3001
```

### Server Settings (in server.py)
```python
VOCAB_IMAGES_DIR = Path(__file__).parent / 'vocab_images'
MAX_WORDS = 50
```

### DALL-E Settings (in server.py)
```python
model="dall-e-3"
size="1024x1024"
quality="standard"
response_format="b64_json"
```

## Cost Reference

| Action | Cost |
|--------|------|
| Generate 1 image | ~$0.04 |
| Generate 10 words | ~$0.40 |
| Generate 50 words | ~$2.00 |
| Reuse cached image | $0.00 |

## Frontend Integration

### JavaScript Example
```javascript
// Generate vocabulary
const response = await fetch('http://localhost:3001/generate_vocab', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    theme: 'Animals',
    numWords: 10
  })
});

const data = await response.json();

// Use images
data.vocabulary.forEach(vocab => {
  const imageUrl = `http://localhost:3001/${vocab.image}`;
  console.log(`${vocab.word}: ${imageUrl}`);
});
```

## Maintenance

### View Generated Images
```bash
ls -lh python_server/vocab_images/
```

### Count Images
```bash
ls python_server/vocab_images/*.png | wc -l
```

### Delete All Images
```bash
rm python_server/vocab_images/*.png
```

### Check Disk Usage
```bash
du -sh python_server/vocab_images/
```

### Update Dependencies
```bash
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

## Logs

### View Real-Time Logs
Logs appear in the terminal where server is running

### Important Log Messages
- `Starting Vocabulary Generator Server` - Server started
- `Generating image for word: 'X'` - Creating new image
- `Image already exists for 'X'` - Using cached image
- `Successfully saved image` - Image created successfully
- `Error generating image` - Image generation failed

## Security

### Protect API Key
- ✅ Keep `.env` file private
- ✅ Never commit `.env` to git
- ✅ Don't share API key
- ✅ Monitor usage in OpenAI dashboard

### If API Key Compromised
1. Revoke key in OpenAI dashboard
2. Generate new key
3. Update `.env` file
4. Restart server

## Performance

### Expected Times
- Start server: 1-2 seconds
- Generate 10 words: 2-3 minutes (first time)
- Generate 10 words: instant (cached)
- Single image: 10-20 seconds

### Optimization Tips
- Generate in batches of 5-10 words
- Don't use `forceRegenerate` unless needed
- Keep commonly used words cached
- Delete unused images periodically

## Support

### Documentation Files
- `README.md` - Complete technical docs
- `SETUP_GUIDE.md` - Step-by-step setup
- `IMPLEMENTATION_SUMMARY.md` - Overview
- `QUICK_REFERENCE.md` - This file

### Getting Help
1. Check logs for error messages
2. Review troubleshooting section
3. Verify API key and configuration
4. Check OpenAI API status
5. Run test suite

## Version Info

- **Python:** 3.8+
- **Flask:** 3.0.0
- **OpenAI:** 1.12.0
- **DALL-E:** 3
- **GPT Model:** gpt-4o-mini

---

**Quick Start:** `./start_server.sh`  
**Test:** `python test_server.py`  
**Health Check:** `http://localhost:3001/health`