#!/usr/bin/env python3
"""
Test script for free image search functionality
Tests Wikimedia Commons image search
"""

import json
import urllib.parse
import urllib.request

def test_wikimedia_search(word):
    """Test searching for an image on Wikimedia Commons"""
    print(f"\n{'='*70}")
    print(f"Testing Wikimedia search for: '{word}'")
    print('='*70)
    
    try:
        # Construct search URL
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles={urllib.parse.quote(word)}&pithumbsize=1024"
        print(f"URL: {search_url}")
        
        # Make request with User-Agent header
        req = urllib.request.Request(search_url)
        req.add_header('User-Agent', 'VocabularyServer/1.0 (Educational Purpose)')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        print(f"\n✅ API Response received")
        
        # Parse response
        pages = data.get('query', {}).get('pages', {})
        
        for page_id, page_data in pages.items():
            print(f"\nPage ID: {page_id}")
            print(f"Title: {page_data.get('title', 'N/A')}")
            
            if 'thumbnail' in page_data:
                image_url = page_data['thumbnail']['source']
                print(f"✅ Image found!")
                print(f"URL: {image_url}")
                print(f"Size: {page_data['thumbnail'].get('width')}x{page_data['thumbnail'].get('height')}")
                return True
            else:
                print(f"❌ No image found for this page")
                return False
        
        print(f"❌ No pages found")
        return False
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def main():
    """Run tests for various words"""
    print("\n" + "="*70)
    print("FREE IMAGE SEARCH TEST")
    print("Testing Wikimedia Commons API")
    print("="*70)
    
    # Test words - mix of common and specific terms
    test_words = [
        "Ocean",
        "Elephant",
        "Python",
        "Computer",
        "Mountain",
        "Photosynthesis",
        "Democracy",
        "Blue Whale"
    ]
    
    results = []
    for word in test_words:
        success = test_wikimedia_search(word)
        results.append((word, success))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    successful = sum(1 for _, success in results if success)
    total = len(results)
    
    for word, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {word}")
    
    print(f"\n{successful}/{total} words found images ({successful/total*100:.1f}%)")
    
    if successful > 0:
        print("\n✅ Wikimedia Commons integration is working!")
    else:
        print("\n⚠️  No images found - check internet connection")


if __name__ == "__main__":
    main()