"""
Test script for Vocabulary Generator Server
Run this after starting the server to verify it's working correctly
"""

import requests
import json
import time

SERVER_URL = "http://localhost:3001"

def print_section(title):
    """Print a section header."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health_check():
    """Test the health check endpoint."""
    print_section("Testing Health Check")
    
    try:
        response = requests.get(f"{SERVER_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✓ Health check passed")
            return True
        else:
            print("✗ Health check failed")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        print("Make sure the server is running!")
        return False

def test_generate_vocab():
    """Test vocabulary generation."""
    print_section("Testing Vocabulary Generation")
    
    try:
        payload = {
            "theme": "Ocean Animals",
            "numWords": 3,
            "forceRegenerate": False
        }
        
        print(f"Request: {json.dumps(payload, indent=2)}")
        print("\nGenerating vocabulary (this may take 30-60 seconds)...")
        
        start_time = time.time()
        response = requests.post(
            f"{SERVER_URL}/generate_vocab",
            json=payload,
            timeout=120
        )
        elapsed = time.time() - start_time
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Time taken: {elapsed:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse Summary:")
            print(f"  Success: {data.get('success')}")
            print(f"  Total words: {data.get('count')}")
            print(f"  Images generated: {data.get('imagesGenerated')}")
            print(f"  Images failed: {data.get('imagesFailed')}")
            
            print(f"\nVocabulary Items:")
            for i, vocab in enumerate(data.get('vocabulary', []), 1):
                print(f"\n  {i}. {vocab.get('word')}")
                print(f"     Definition: {vocab.get('definition')[:60]}...")
                print(f"     Image: {vocab.get('image')}")
                print(f"     Generated: {vocab.get('imageGenerated')}")
            
            print("\n✓ Vocabulary generation passed")
            return True
        else:
            print(f"✗ Vocabulary generation failed")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("✗ Request timed out (this can happen with DALL-E 3)")
        print("  Try again or increase timeout")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_image_access():
    """Test accessing a generated image."""
    print_section("Testing Image Access")
    
    try:
        # First, generate a simple vocab item
        payload = {
            "theme": "Simple Objects",
            "numWords": 1,
            "forceRegenerate": False
        }
        
        print("Generating a test vocabulary item...")
        response = requests.post(
            f"{SERVER_URL}/generate_vocab",
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('vocabulary'):
                image_path = data['vocabulary'][0].get('image')
                
                if image_path:
                    print(f"Attempting to access image: {image_path}")
                    
                    image_url = f"{SERVER_URL}/{image_path}"
                    img_response = requests.get(image_url)
                    
                    print(f"Status Code: {img_response.status_code}")
                    print(f"Content-Type: {img_response.headers.get('Content-Type')}")
                    print(f"Content-Length: {len(img_response.content)} bytes")
                    
                    if img_response.status_code == 200 and 'image' in img_response.headers.get('Content-Type', ''):
                        print("✓ Image access passed")
                        return True
                    else:
                        print("✗ Image access failed")
                        return False
                else:
                    print("✗ No image path in response")
                    return False
            else:
                print("✗ No vocabulary items in response")
                return False
        else:
            print("✗ Failed to generate test vocabulary")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_legacy_endpoint():
    """Test the legacy /generate endpoint."""
    print_section("Testing Legacy Endpoint")
    
    try:
        payload = {
            "type": "vocab",
            "theme": "Space",
            "numQuestions": 2
        }
        
        print(f"Request: {json.dumps(payload, indent=2)}")
        print("\nGenerating vocabulary...")
        
        response = requests.post(
            f"{SERVER_URL}/generate",
            json=payload,
            timeout=120
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse Summary:")
            print(f"  Success: {data.get('success')}")
            print(f"  Count: {data.get('count')}")
            
            print(f"\nQuestions:")
            for i, q in enumerate(data.get('questions', []), 1):
                print(f"\n  {i}. {q.get('word')}")
                print(f"     Type: {q.get('type')}")
                print(f"     Image: {q.get('image')}")
            
            print("\n✓ Legacy endpoint passed")
            return True
        else:
            print(f"✗ Legacy endpoint failed")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("  VOCABULARY GENERATOR SERVER TEST SUITE")
    print("="*60)
    print(f"\nServer URL: {SERVER_URL}")
    print("Make sure the server is running before running these tests!")
    
    input("\nPress Enter to start tests...")
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health_check()))
    
    if results[0][1]:  # Only continue if health check passed
        results.append(("Vocabulary Generation", test_generate_vocab()))
        results.append(("Image Access", test_image_access()))
        results.append(("Legacy Endpoint", test_legacy_endpoint()))
    
    # Print summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Server is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()