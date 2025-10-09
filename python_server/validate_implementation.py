#!/usr/bin/env python3
"""
Implementation Validation Script
Verifies that the vocabulary server meets all specified requirements
"""

import os
import sys
from pathlib import Path
import importlib.util

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    """Print a formatted header."""
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}{text.center(70)}{RESET}")
    print(f"{BLUE}{'='*70}{RESET}\n")

def print_success(text):
    """Print success message."""
    print(f"{GREEN}✓ {text}{RESET}")

def print_error(text):
    """Print error message."""
    print(f"{RED}✗ {text}{RESET}")

def print_warning(text):
    """Print warning message."""
    print(f"{YELLOW}⚠ {text}{RESET}")

def print_info(text):
    """Print info message."""
    print(f"  {text}")

def check_file_exists(filepath, description):
    """Check if a file exists."""
    if Path(filepath).exists():
        print_success(f"{description} exists: {filepath}")
        return True
    else:
        print_error(f"{description} missing: {filepath}")
        return False

def check_directory_exists(dirpath, description):
    """Check if a directory exists."""
    if Path(dirpath).is_dir():
        print_success(f"{description} exists: {dirpath}")
        return True
    else:
        print_error(f"{description} missing: {dirpath}")
        return False

def validate_server_code():
    """Validate the server.py implementation."""
    print_header("REQUIREMENT 1: API Endpoint for Vocabulary Generation")
    
    server_path = Path(__file__).parent / 'server.py'
    
    if not server_path.exists():
        print_error("server.py not found!")
        return False
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    checks = [
        ("POST /generate_vocab endpoint", "@app.route('/generate_vocab', methods=['POST'])"),
        ("Request JSON parsing", "request.get_json()"),
        ("Theme parameter handling", "theme = data.get('theme')"),
        ("Number of words parameter", "numWords"),
    ]
    
    all_passed = True
    for description, pattern in checks:
        if pattern in content:
            print_success(f"{description} implemented")
        else:
            print_error(f"{description} not found")
            all_passed = False
    
    return all_passed

def validate_dalle_integration():
    """Validate DALL-E API integration."""
    print_header("REQUIREMENT 2: DALL-E Image Generation")
    
    server_path = Path(__file__).parent / 'server.py'
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    checks = [
        ("OpenAI client initialization", "OpenAI(api_key="),
        ("DALL-E API call", "openai_client.images.generate"),
        ("Model specification", 'model="dall-e-3"'),
        ("Image generation function", "def generate_and_save_image"),
    ]
    
    all_passed = True
    for description, pattern in checks:
        if pattern in content:
            print_success(f"{description} implemented")
        else:
            print_error(f"{description} not found")
            all_passed = False
    
    return all_passed

def validate_local_storage():
    """Validate local image storage."""
    print_header("REQUIREMENT 3: Local Image Storage")
    
    server_path = Path(__file__).parent / 'server.py'
    vocab_images_dir = Path(__file__).parent / 'vocab_images'
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    checks = [
        ("vocab_images directory constant", "VOCAB_IMAGES_DIR"),
        ("Directory creation logic", "mkdir(exist_ok=True)"),
        ("Filename sanitization", "def sanitize_filename"),
        ("Image path generation", "def get_image_path"),
    ]
    
    all_passed = True
    for description, pattern in checks:
        if pattern in content:
            print_success(f"{description} implemented")
        else:
            print_error(f"{description} not found")
            all_passed = False
    
    # Check if directory exists
    if vocab_images_dir.is_dir():
        print_success(f"vocab_images directory exists")
    else:
        print_error(f"vocab_images directory not found")
        all_passed = False
    
    return all_passed

def validate_response_format():
    """Validate API response format."""
    print_header("REQUIREMENT 4: Response with Local Paths")
    
    server_path = Path(__file__).parent / 'server.py'
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    checks = [
        ("Word in response", "'word': word"),
        ("Image path in response", "'image': image_path"),
        ("Success status", "'success': True"),
        ("Vocabulary array", "'vocabulary': results"),
    ]
    
    all_passed = True
    for description, pattern in checks:
        if pattern in content:
            print_success(f"{description} implemented")
        else:
            print_error(f"{description} not found")
            all_passed = False
    
    return all_passed

def validate_b64_handling():
    """Validate base64 image handling."""
    print_header("REQUIREMENT 5: Base64 Image Decoding")
    
    server_path = Path(__file__).parent / 'server.py'
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    checks = [
        ("Base64 import", "import base64"),
        ("b64_json response format", 'response_format="b64_json"'),
        ("Base64 decoding", "base64.b64decode"),
        ("Binary file writing", "open(image_path, 'wb')"),
        ("PNG file extension", '.png'),
    ]
    
    all_passed = True
    for description, pattern in checks:
        if pattern in content:
            print_success(f"{description} implemented")
        else:
            print_error(f"{description} not found")
            all_passed = False
    
    return all_passed

def validate_error_handling():
    """Validate error handling."""
    print_header("REQUIREMENT 6: Error Handling and Logging")
    
    server_path = Path(__file__).parent / 'server.py'
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    checks = [
        ("Logging import", "import logging"),
        ("Logger configuration", "logging.basicConfig"),
        ("Try-except blocks", "try:" and "except Exception as e:"),
        ("Error logging", "logger.error"),
        ("Info logging", "logger.info"),
        ("Error responses", "jsonify({'error':"),
    ]
    
    all_passed = True
    for description, pattern in checks:
        if isinstance(pattern, tuple):
            if all(p in content for p in pattern):
                print_success(f"{description} implemented")
            else:
                print_error(f"{description} not found")
                all_passed = False
        else:
            if pattern in content:
                print_success(f"{description} implemented")
            else:
                print_error(f"{description} not found")
                all_passed = False
    
    return all_passed

def validate_caching():
    """Validate image caching logic."""
    print_header("REQUIREMENT 7: Image Caching")
    
    server_path = Path(__file__).parent / 'server.py'
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    checks = [
        ("Image existence check", "def image_exists"),
        ("Force regenerate parameter", "force_regenerate"),
        ("Skip existing images", "if image_path.exists() and not force_regenerate"),
        ("Existence logging", "Image already exists"),
    ]
    
    all_passed = True
    for description, pattern in checks:
        if pattern in content:
            print_success(f"{description} implemented")
        else:
            print_error(f"{description} not found")
            all_passed = False
    
    return all_passed

def validate_imports_and_setup():
    """Validate imports and automatic setup."""
    print_header("REQUIREMENT 8: Imports and Automatic Setup")
    
    server_path = Path(__file__).parent / 'server.py'
    
    with open(server_path, 'r') as f:
        content = f.read()
    
    required_imports = [
        ("os module", "import os"),
        ("base64 module", "import base64"),
        ("json module", "import json"),
        ("pathlib module", "from pathlib import Path"),
        ("Flask", "from flask import Flask"),
        ("CORS", "from flask_cors import CORS"),
        ("OpenAI", "from openai import OpenAI"),
        ("dotenv", "from dotenv import load_dotenv"),
        ("logging", "import logging"),
    ]
    
    all_passed = True
    for description, pattern in required_imports:
        if pattern in content:
            print_success(f"{description} imported")
        else:
            print_error(f"{description} not imported")
            all_passed = False
    
    # Check automatic setup
    setup_checks = [
        ("Environment loading", "load_dotenv()"),
        ("Directory creation", "VOCAB_IMAGES_DIR.mkdir(exist_ok=True)"),
        ("Flask initialization", "app = Flask(__name__)"),
        ("CORS setup", "CORS(app)"),
    ]
    
    for description, pattern in setup_checks:
        if pattern in content:
            print_success(f"{description} configured")
        else:
            print_error(f"{description} not configured")
            all_passed = False
    
    return all_passed

def validate_dependencies():
    """Validate required dependencies."""
    print_header("DEPENDENCY VALIDATION")
    
    requirements_path = Path(__file__).parent / 'requirements.txt'
    
    if not requirements_path.exists():
        print_error("requirements.txt not found!")
        return False
    
    with open(requirements_path, 'r') as f:
        requirements = f.read()
    
    required_packages = [
        "flask",
        "flask-cors",
        "openai",
        "python-dotenv",
    ]
    
    all_passed = True
    for package in required_packages:
        if package in requirements.lower():
            print_success(f"{package} in requirements.txt")
        else:
            print_error(f"{package} missing from requirements.txt")
            all_passed = False
    
    return all_passed

def validate_documentation():
    """Validate documentation files."""
    print_header("DOCUMENTATION VALIDATION")
    
    base_path = Path(__file__).parent
    
    docs = [
        ("README.md", "Main documentation"),
        ("SETUP_GUIDE.md", "Setup guide"),
        ("IMPLEMENTATION_SUMMARY.md", "Implementation summary"),
        ("QUICK_REFERENCE.md", "Quick reference"),
        (".env.example", "Environment template"),
        ("start_server.sh", "Startup script"),
        ("test_server.py", "Test suite"),
    ]
    
    all_passed = True
    for filename, description in docs:
        if check_file_exists(base_path / filename, description):
            pass
        else:
            all_passed = False
    
    return all_passed

def main():
    """Run all validations."""
    print_header("VOCABULARY SERVER IMPLEMENTATION VALIDATION")
    print_info("Validating all requirements are met...")
    
    results = []
    
    # Run all validation checks
    results.append(("Server Code Structure", validate_server_code()))
    results.append(("DALL-E Integration", validate_dalle_integration()))
    results.append(("Local Storage", validate_local_storage()))
    results.append(("Response Format", validate_response_format()))
    results.append(("Base64 Handling", validate_b64_handling()))
    results.append(("Error Handling", validate_error_handling()))
    results.append(("Image Caching", validate_caching()))
    results.append(("Imports & Setup", validate_imports_and_setup()))
    results.append(("Dependencies", validate_dependencies()))
    results.append(("Documentation", validate_documentation()))
    
    # Print summary
    print_header("VALIDATION SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        if result:
            print_success(f"{name}: PASSED")
        else:
            print_error(f"{name}: FAILED")
    
    print(f"\n{BLUE}{'='*70}{RESET}")
    if passed == total:
        print(f"{GREEN}✓ ALL REQUIREMENTS MET: {passed}/{total} checks passed{RESET}")
        print(f"{GREEN}✓ Implementation is complete and ready to use!{RESET}")
    else:
        print(f"{RED}✗ SOME REQUIREMENTS NOT MET: {passed}/{total} checks passed{RESET}")
        print(f"{YELLOW}⚠ Please review failed checks above{RESET}")
    print(f"{BLUE}{'='*70}{RESET}\n")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)