"""
Vocabulary Generator Server with Local Image Storage
Generates vocabulary lists with FREE images from Wikimedia Commons/Unsplash
All images are downloaded and saved locally to eliminate broken links
"""

import os
import json
import hashlib
import urllib.parse
import urllib.request
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize OpenAI client (for vocabulary generation only)
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Configuration
VOCAB_IMAGES_DIR = Path(__file__).parent / 'vocab_images'
PORT = int(os.getenv('PORT', 3001))
MAX_WORDS = 50

# Optional Unsplash API key for fallback (if not set, only Wikimedia will be used)
UNSPLASH_ACCESS_KEY = os.getenv('UNSPLASH_ACCESS_KEY', '')

# Create vocab_images directory if it doesn't exist
VOCAB_IMAGES_DIR.mkdir(exist_ok=True)
logger.info(f"Vocab images directory: {VOCAB_IMAGES_DIR}")


def sanitize_filename(word: str) -> str:
    """
    Sanitize a word to create a safe filename.
    
    Args:
        word: The vocabulary word
        
    Returns:
        A safe filename string
    """
    # Remove special characters and replace spaces with underscores
    safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '' for c in word)
    safe_name = safe_name.strip().replace(' ', '_').lower()
    return safe_name


def get_image_path(word: str) -> Path:
    """
    Get the file path for a vocabulary word's image.
    
    Args:
        word: The vocabulary word
        
    Returns:
        Path object for the image file
    """
    filename = f"{sanitize_filename(word)}.png"
    return VOCAB_IMAGES_DIR / filename


def image_exists(word: str) -> bool:
    """
    Check if an image already exists for a word.
    
    Args:
        word: The vocabulary word
        
    Returns:
        True if image exists, False otherwise
    """
    return get_image_path(word).exists()


def search_wikimedia_image(word: str) -> Optional[str]:
    """
    Search for a free image on Wikimedia Commons.
    
    Args:
        word: The vocabulary word to search for
        
    Returns:
        URL of the image, or None if not found
    """
    try:
        # Search Wikipedia for the word
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles={urllib.parse.quote(word)}&pithumbsize=1024"
        
        req = urllib.request.Request(search_url)
        req.add_header('User-Agent', 'VocabularyServer/1.0 (Educational Purpose)')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            
        pages = data.get('query', {}).get('pages', {})
        
        for page_id, page_data in pages.items():
            if 'thumbnail' in page_data:
                image_url = page_data['thumbnail']['source']
                logger.info(f"Found Wikimedia image for '{word}': {image_url}")
                return image_url
        
        logger.info(f"No Wikimedia image found for '{word}'")
        return None
        
    except Exception as e:
        logger.error(f"Error searching Wikimedia for '{word}': {str(e)}")
        return None


def search_unsplash_image(word: str, random_page: bool = False) -> Optional[str]:
    """
    Search for a free image on Unsplash (requires API key).
    
    Args:
        word: The vocabulary word to search for
        random_page: If True, fetch a random page of results (for variety)
        
    Returns:
        URL of the image, or None if not found
    """
    if not UNSPLASH_ACCESS_KEY:
        logger.info("Unsplash API key not configured, skipping Unsplash search")
        return None
    
    try:
        # If random_page is True, fetch multiple results and pick a random one
        per_page = 10 if random_page else 1
        page = 1
        
        search_url = f"https://api.unsplash.com/search/photos?query={urllib.parse.quote(word)}&per_page={per_page}&page={page}&orientation=landscape"
        
        req = urllib.request.Request(search_url)
        req.add_header('Authorization', f'Client-ID {UNSPLASH_ACCESS_KEY}')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            
        results = data.get('results', [])
        
        if results and len(results) > 0:
            # Pick a random result if random_page is True, otherwise take the first
            import random
            index = random.randint(0, len(results) - 1) if random_page and len(results) > 1 else 0
            image_url = results[index]['urls']['regular']
            logger.info(f"Found Unsplash image for '{word}' (index {index}/{len(results)}): {image_url}")
            return image_url
        
        logger.info(f"No Unsplash image found for '{word}'")
        return None
        
    except Exception as e:
        logger.error(f"Error searching Unsplash for '{word}': {str(e)}")
        return None


def download_image(url: str, save_path: Path) -> bool:
    """
    Download an image from a URL and save it locally.
    
    Args:
        url: The URL of the image to download
        save_path: Path where to save the image
        
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info(f"Downloading image from: {url}")
        
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Vocabulary Server)')
        
        with urllib.request.urlopen(req, timeout=30) as response:
            image_data = response.read()
            
        with open(save_path, 'wb') as f:
            f.write(image_data)
            
        logger.info(f"Successfully downloaded and saved image to {save_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {str(e)}")
        return False


def search_and_save_image(word: str, force_regenerate: bool = False) -> Optional[str]:
    """
    Search for a free image online and save it locally.
    Tries Wikimedia Commons first, then Unsplash as fallback.
    
    Args:
        word: The vocabulary word to find an image for
        force_regenerate: If True, re-download even if image exists
        
    Returns:
        Relative path to the saved image, or None if failed
    """
    image_path = get_image_path(word)
    
    # Check if image already exists and we're not forcing regeneration
    if image_path.exists() and not force_regenerate:
        logger.info(f"Image already exists for '{word}', skipping download")
        return f"vocab_images/{image_path.name}"
    
    try:
        logger.info(f"Searching for free image for word: '{word}' (force_regenerate={force_regenerate})")
        
        # When regenerating, prefer Unsplash with randomization for variety
        # Otherwise, try Wikimedia first (free, no API key needed)
        if force_regenerate:
            logger.info(f"Force regenerate: trying Unsplash with random selection for '{word}'")
            image_url = search_unsplash_image(word, random_page=True)
            
            # If Unsplash fails, fall back to Wikimedia
            if not image_url:
                logger.info(f"Unsplash failed, trying Wikimedia for '{word}'")
                image_url = search_wikimedia_image(word)
        else:
            # Normal flow: Wikimedia first, then Unsplash
            image_url = search_wikimedia_image(word)
            
            if not image_url:
                logger.info(f"Trying Unsplash fallback for '{word}'")
                image_url = search_unsplash_image(word, random_page=False)
        
        # If we found an image URL, download it
        if image_url:
            if download_image(image_url, image_path):
                return f"vocab_images/{image_path.name}"
            else:
                logger.error(f"Failed to download image for '{word}'")
                return None
        else:
            logger.warning(f"No free image found for '{word}'")
            return None
        
    except Exception as e:
        logger.error(f"Error searching/downloading image for '{word}': {str(e)}")
        return None


def generate_vocabulary_list(theme: str, num_words: int) -> List[Dict]:
    """
    Generate a vocabulary list using OpenAI.
    
    Args:
        theme: The theme for vocabulary words
        num_words: Number of words to generate
        
    Returns:
        List of vocabulary dictionaries
    """
    system_prompt = """You are an expert vocabulary educator. Generate vocabulary words with clear, concise definitions.

Return ONLY a valid JSON array of vocabulary objects. Each object should have:
- word: the vocabulary word (single word or short phrase)
- definition: a clear, educational definition (1-2 sentences)

Choose words appropriate for the theme and suitable for educational purposes."""

    user_prompt = f"""Generate {num_words} vocabulary words about "{theme}". Return only the JSON array, no other text.

Example format:
[
  {{
    "word": "Ocean",
    "definition": "A very large expanse of sea, in particular each of the main areas into which the sea is divided geographically."
  }},
  {{
    "word": "Mountain",
    "definition": "A large natural elevation of the earth's surface rising abruptly from the surrounding level."
  }}
]"""

    try:
        logger.info(f"Generating {num_words} vocabulary words for theme: '{theme}'")
        
        completion = openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        
        response_text = completion.choices[0].message.content.strip()
        
        if not response_text:
            raise ValueError('Empty response from OpenAI')
        
        # Parse JSON response
        vocab_list = json.loads(response_text)
        
        if not isinstance(vocab_list, list):
            raise ValueError('Response is not an array')
        
        logger.info(f"Successfully generated {len(vocab_list)} vocabulary words")
        return vocab_list
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI response: {e}")
        raise ValueError('Invalid JSON response from AI')
    except Exception as e:
        logger.error(f"Error generating vocabulary: {str(e)}")
        raise


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'OK',
        'message': 'Vocabulary Generator Server is running',
        'images_directory': str(VOCAB_IMAGES_DIR),
        'images_count': len(list(VOCAB_IMAGES_DIR.glob('*.png')))
    })


@app.route('/vocab_images/<path:filename>', methods=['GET'])
def serve_image(filename):
    """Serve vocabulary images."""
    return send_from_directory(VOCAB_IMAGES_DIR, filename)


@app.route('/generate_vocab', methods=['POST'])
def generate_vocab():
    """
    Generate vocabulary list with images.
    
    Request body:
    {
        "theme": "Nature",
        "numWords": 10,
        "forceRegenerate": false  // Optional: regenerate existing images
    }
    
    Response:
    {
        "success": true,
        "vocabulary": [
            {
                "id": "abc123",
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
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        theme = data.get('theme')
        num_words = data.get('numWords')
        force_regenerate = data.get('forceRegenerate', False)
        
        if not theme:
            return jsonify({'error': 'Missing required field: theme'}), 400
        
        if not num_words:
            return jsonify({'error': 'Missing required field: numWords'}), 400
        
        if not isinstance(num_words, int) or num_words < 1 or num_words > MAX_WORDS:
            return jsonify({'error': f'numWords must be between 1 and {MAX_WORDS}'}), 400
        
        logger.info(f"Generating vocabulary list: theme='{theme}', numWords={num_words}, forceRegenerate={force_regenerate}")
        
        # Generate vocabulary list
        vocab_list = generate_vocabulary_list(theme, num_words)
        
        # Generate images for each word
        results = []
        images_generated = 0
        images_failed = 0
        
        for vocab in vocab_list:
            word = vocab.get('word', '')
            definition = vocab.get('definition', '')
            
            if not word:
                logger.warning("Skipping vocabulary item with no word")
                continue
            
            # Generate unique ID
            vocab_id = hashlib.md5(f"{word}{datetime.now().isoformat()}".encode()).hexdigest()[:8]
            
            # Search and download free image
            image_path = search_and_save_image(word, force_regenerate)
            
            if image_path:
                images_generated += 1
                image_generated = True
                # Convert relative path to full URL
                image_url = f"http://localhost:{PORT}/{image_path}"
            else:
                images_failed += 1
                image_generated = False
                # Use placeholder or empty string
                image_url = ""
            
            results.append({
                'id': vocab_id,
                'type': 'vocab',
                'word': word,
                'definition': definition,
                'image': image_url,
                'imageUrl': image_url,  # Also include imageUrl for frontend compatibility
                'imageGenerated': image_generated
            })
        
        logger.info(f"Vocabulary generation complete: {len(results)} words, {images_generated} images generated, {images_failed} images failed")
        
        return jsonify({
            'success': True,
            'vocabulary': results,
            'count': len(results),
            'imagesGenerated': images_generated,
            'imagesFailed': images_failed
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in generate_vocab endpoint: {str(e)}")
        return jsonify({'error': 'Failed to generate vocabulary. Please try again.'}), 500


@app.route('/generate', methods=['POST'])
def generate_questions():
    """
    Legacy endpoint for backward compatibility with existing frontend.
    Handles regular questions, icebreak, and vocab types.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        question_type = data.get('type')
        
        # If it's a vocab request, redirect to new endpoint
        if question_type == 'vocab':
            theme = data.get('theme')
            num_questions = data.get('numQuestions')
            
            if not theme or not num_questions:
                return jsonify({'error': 'Missing required fields: theme and numQuestions'}), 400
            
            # Call generate_vocab internally
            vocab_list = generate_vocabulary_list(theme, num_questions)
            
            results = []
            for vocab in vocab_list:
                word = vocab.get('word', '')
                definition = vocab.get('definition', '')
                
                if not word:
                    continue
                
                vocab_id = hashlib.md5(f"{word}{datetime.now().isoformat()}".encode()).hexdigest()[:8]
                
                # Search and download free image
                image_path = search_and_save_image(word, False)
                
                # Convert relative path to full URL
                image_url = f"http://localhost:{PORT}/{image_path}" if image_path else ''
                
                results.append({
                    'id': vocab_id,
                    'type': 'vocab',
                    'word': word,
                    'definition': definition,
                    'image': image_url,
                    'imageUrl': image_url  # Also include imageUrl for frontend compatibility
                })
            
            return jsonify({
                'success': True,
                'questions': results,
                'count': len(results)
            })
        
        # For non-vocab types, return error (or implement other types)
        return jsonify({'error': 'Only vocab type is supported in Python server. Use Node.js server for other types.'}), 400
        
    except Exception as e:
        logger.error(f"Error in generate endpoint: {str(e)}")
        return jsonify({'error': 'Failed to generate questions. Please try again.'}), 500


@app.route('/regenerate_image', methods=['POST'])
def regenerate_image():
    """
    Regenerate/find a different image for a specific vocabulary word.
    
    Request body:
    {
        "word": "Ocean"
    }
    
    Response:
    {
        "success": true,
        "word": "Ocean",
        "image": "vocab_images/ocean.png",
        "imageGenerated": true
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        word = data.get('word')
        
        if not word:
            return jsonify({'error': 'Missing required field: word'}), 400
        
        logger.info(f"Regenerating image for word: '{word}'")
        
        # Force regenerate the image (will download a new one)
        image_path = search_and_save_image(word, force_regenerate=True)
        
        if image_path:
            # Convert relative path to full URL
            image_url = f"http://localhost:{PORT}/{image_path}"
            logger.info(f"Successfully regenerated image for '{word}': {image_url}")
            
            return jsonify({
                'success': True,
                'word': word,
                'image': image_url,
                'imageUrl': image_url,
                'imageGenerated': True
            })
        else:
            logger.warning(f"Failed to find/download new image for '{word}'")
            return jsonify({
                'success': False,
                'word': word,
                'image': '',
                'imageUrl': '',
                'imageGenerated': False,
                'error': 'No image found for this word'
            }), 404
        
    except Exception as e:
        logger.error(f"Error in regenerate_image endpoint: {str(e)}")
        return jsonify({'error': 'Failed to regenerate image. Please try again.'}), 500


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Check for API key
    if not os.getenv('OPENAI_API_KEY'):
        logger.error("OPENAI_API_KEY not found in environment variables!")
        logger.error("Please create a .env file with your OpenAI API key")
        exit(1)
    
    logger.info(f"Starting Vocabulary Generator Server on port {PORT}")
    logger.info(f"Images will be saved to: {VOCAB_IMAGES_DIR}")
    logger.info(f"API Key configured: {bool(os.getenv('OPENAI_API_KEY'))}")
    
    app.run(host='0.0.0.0', port=PORT, debug=True)