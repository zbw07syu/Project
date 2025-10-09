# Vocabulary Generator Server with Local Image Storage

A Python Flask server that generates vocabulary lists using OpenAI's GPT models and creates images using DALL-E 3, saving them locally to eliminate broken image links.

## Features

- ✅ Generates vocabulary words with definitions using GPT-4o-mini
- ✅ Creates images using DALL-E 3 API
- ✅ Saves images locally as PNG files
- ✅ Prevents duplicate image generation (checks if image exists)
- ✅ Graceful error handling for API failures
- ✅ Serves images via HTTP endpoint
- ✅ Backward compatible with existing frontend
- ✅ Comprehensive logging

## Requirements

- Python 3.8 or higher
- OpenAI API key with access to GPT-4o-mini and DALL-E 3

## Installation

1. **Navigate to the server directory:**
   ```bash
   cd python_server
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

## Usage

### Starting the Server

```bash
python server.py
```

The server will start on `http://localhost:3001` by default.

### API Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Vocabulary Generator Server is running",
  "images_directory": "/path/to/vocab_images",
  "images_count": 42
}
```

#### 2. Generate Vocabulary (New Endpoint)
```http
POST /generate_vocab
Content-Type: application/json

{
  "theme": "Nature",
  "numWords": 10,
  "forceRegenerate": false
}
```

**Parameters:**
- `theme` (required): The theme for vocabulary words (e.g., "Nature", "Technology", "Food")
- `numWords` (required): Number of words to generate (1-50)
- `forceRegenerate` (optional): If `true`, regenerate images even if they already exist (default: `false`)

**Response:**
```json
{
  "success": true,
  "vocabulary": [
    {
      "id": "a1b2c3d4",
      "type": "vocab",
      "word": "Ocean",
      "definition": "A very large expanse of sea...",
      "image": "vocab_images/ocean.png",
      "imageGenerated": true
    }
  ],
  "count": 10,
  "imagesGenerated": 8,
  "imagesFailed": 2
}
```

#### 3. Legacy Generate Endpoint (Backward Compatible)
```http
POST /generate
Content-Type: application/json

{
  "type": "vocab",
  "theme": "Animals",
  "numQuestions": 12
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "xyz789",
      "type": "vocab",
      "word": "Elephant",
      "definition": "A large mammal with a trunk...",
      "image": "vocab_images/elephant.png"
    }
  ],
  "count": 12
}
```

#### 4. Serve Images
```http
GET /vocab_images/<filename>
```

Example: `http://localhost:3001/vocab_images/ocean.png`

## How It Works

### Image Generation Process

1. **Check for Existing Image**: Before generating, the server checks if an image already exists for the word
2. **Generate with DALL-E 3**: If no image exists (or `forceRegenerate` is true), calls DALL-E 3 API
3. **Receive Base64 Data**: API returns image as base64-encoded JSON
4. **Decode and Save**: Decodes base64 data and saves as PNG file
5. **Return Local Path**: Returns relative path to the saved image

### File Naming

- Words are sanitized to create safe filenames
- Special characters are removed
- Spaces are replaced with underscores
- All filenames are lowercase
- Example: "Blue Whale" → `blue_whale.png`

### Directory Structure

```
python_server/
├── server.py              # Main server code
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in git)
├── .env.example          # Example environment file
├── README.md             # This file
└── vocab_images/         # Generated images (created automatically)
    ├── ocean.png
    ├── mountain.png
    └── ...
```

## Error Handling

The server handles various error scenarios:

- **Missing API Key**: Server won't start, shows error message
- **Invalid Request**: Returns 400 with error details
- **OpenAI API Errors**: Logs error, returns 500 with generic message
- **Image Generation Failure**: Logs warning, continues with other words
- **JSON Parse Errors**: Catches and logs, returns appropriate error

## Logging

The server uses Python's logging module with INFO level by default. Logs include:

- Server startup information
- API requests and responses
- Image generation status
- Errors and warnings

Example log output:
```
2024-01-15 10:30:45 - __main__ - INFO - Starting Vocabulary Generator Server on port 3001
2024-01-15 10:30:45 - __main__ - INFO - Images will be saved to: /path/to/vocab_images
2024-01-15 10:31:12 - __main__ - INFO - Generating 10 vocabulary words for theme: 'Nature'
2024-01-15 10:31:15 - __main__ - INFO - Generating image for word: 'Ocean'
2024-01-15 10:31:20 - __main__ - INFO - Successfully saved image for 'Ocean' to /path/to/ocean.png
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `PORT` (optional): Server port, defaults to 3001

### Constants in Code

You can modify these in `server.py`:

- `VOCAB_IMAGES_DIR`: Directory for storing images (default: `./vocab_images`)
- `MAX_WORDS`: Maximum words per request (default: 50)
- DALL-E settings:
  - Model: `dall-e-3`
  - Size: `1024x1024`
  - Quality: `standard`
  - Response format: `b64_json`

## Integration with Frontend

### Update Frontend to Use Local Images

The server returns image paths like `vocab_images/ocean.png`. Your frontend should:

1. **Construct Full URL**: Prepend server URL to image path
   ```javascript
   const imageUrl = `http://localhost:3001/${vocab.image}`;
   ```

2. **Update Image Source**: Use the full URL in img tags
   ```javascript
   img.src = imageUrl;
   ```

### Example Frontend Code

```javascript
async function generateVocabulary(theme, numWords) {
  const response = await fetch('http://localhost:3001/generate_vocab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, numWords })
  });
  
  const data = await response.json();
  
  if (data.success) {
    data.vocabulary.forEach(vocab => {
      // Construct full image URL
      const imageUrl = `http://localhost:3001/${vocab.image}`;
      
      // Use in your app
      console.log(`Word: ${vocab.word}`);
      console.log(`Image: ${imageUrl}`);
    });
  }
}
```

## Advantages Over URL-Based Images

### Before (Unsplash URLs)
- ❌ URLs can expire
- ❌ Images may be removed
- ❌ Requires internet connection
- ❌ No control over image content
- ❌ Rate limits on external services

### After (Local DALL-E Images)
- ✅ Images never expire
- ✅ Full control over content
- ✅ Works offline (after generation)
- ✅ Consistent quality
- ✅ Tailored to vocabulary words
- ✅ No external dependencies

## Troubleshooting

### Server won't start
- Check if `OPENAI_API_KEY` is set in `.env`
- Verify Python version (3.8+)
- Check if port 3001 is available

### Images not generating
- Check OpenAI API key validity
- Verify DALL-E 3 access on your account
- Check API quota/billing
- Review server logs for specific errors

### Images not displaying in frontend
- Verify server is running
- Check CORS settings
- Ensure frontend uses correct server URL
- Check browser console for errors

### "Image already exists" messages
- This is normal behavior (prevents duplicate generation)
- Use `forceRegenerate: true` to regenerate existing images
- Or delete images from `vocab_images/` folder

## Cost Considerations

### DALL-E 3 Pricing (as of 2024)
- Standard quality (1024x1024): ~$0.040 per image
- For 10 words: ~$0.40
- For 50 words: ~$2.00

### Cost Optimization
- Images are cached locally (generated once)
- Use `forceRegenerate: false` (default) to avoid duplicates
- Consider generating smaller batches
- Delete unused images to save disk space

## Development

### Running in Debug Mode

The server runs in debug mode by default when started with `python server.py`. This enables:
- Auto-reload on code changes
- Detailed error messages
- Interactive debugger

### Testing

Test the server with curl:

```bash
# Health check
curl http://localhost:3001/health

# Generate vocabulary
curl -X POST http://localhost:3001/generate_vocab \
  -H "Content-Type: application/json" \
  -d '{"theme": "Space", "numWords": 5}'

# View an image
curl http://localhost:3001/vocab_images/space.png --output space.png
```

## Production Deployment

For production use:

1. **Disable Debug Mode**: Set `debug=False` in `app.run()`
2. **Use Production Server**: Deploy with Gunicorn or uWSGI
3. **Set Up HTTPS**: Use reverse proxy (nginx) with SSL
4. **Environment Variables**: Use production secrets management
5. **Logging**: Configure production logging (file-based)
6. **Monitoring**: Add health checks and monitoring

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3001 server:app
```

## License

This server is part of the Wingit! educational games project.

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify API key and configuration
3. Review this README
4. Check OpenAI API status