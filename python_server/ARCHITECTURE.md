# Vocabulary Server Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     VOCABULARY SERVER SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────▶│ Flask Server │────────▶│  OpenAI API  │
│  (Browser)   │◀────────│  (Python)    │◀────────│  (DALL-E 3)  │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                │
                                ▼
                         ┌──────────────┐
                         │ vocab_images/│
                         │   (Local)    │
                         └──────────────┘
```

---

## Request Flow

### 1. Vocabulary Generation Request

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ POST /generate_vocab
     │ {
     │   "theme": "Animals",
     │   "numWords": 10
     │ }
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                      FLASK SERVER                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Validate Request                                   │  │
│  │    - Check theme exists                               │  │
│  │    - Validate numWords (1-50)                         │  │
│  │    - Parse forceRegenerate flag                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 2. Generate Vocabulary List (GPT-4o-mini)            │  │
│  │    - Create system prompt                             │  │
│  │    - Call OpenAI Chat API                             │  │
│  │    - Parse JSON response                              │  │
│  │    - Extract words and definitions                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 3. For Each Word:                                     │  │
│  │    ┌────────────────────────────────────────────┐    │  │
│  │    │ a. Sanitize filename                        │    │  │
│  │    │    "Blue Whale" → "blue_whale.png"         │    │  │
│  │    └────────────────────────────────────────────┘    │  │
│  │                     │                                  │  │
│  │                     ▼                                  │  │
│  │    ┌────────────────────────────────────────────┐    │  │
│  │    │ b. Check if image exists                   │    │  │
│  │    │    - If exists & !forceRegenerate: skip    │    │  │
│  │    │    - If not exists: generate               │    │  │
│  │    └────────────────────────────────────────────┘    │  │
│  │                     │                                  │  │
│  │                     ▼                                  │  │
│  │    ┌────────────────────────────────────────────┐    │  │
│  │    │ c. Generate Image (DALL-E 3)               │    │  │
│  │    │    - Create descriptive prompt             │    │  │
│  │    │    - Call images.generate()                │    │  │
│  │    │    - Request b64_json format               │    │  │
│  │    └────────────────────────────────────────────┘    │  │
│  │                     │                                  │  │
│  │                     ▼                                  │  │
│  │    ┌────────────────────────────────────────────┐    │  │
│  │    │ d. Decode and Save                         │    │  │
│  │    │    - Extract base64 data                   │    │  │
│  │    │    - Decode to binary                      │    │  │
│  │    │    - Write to vocab_images/word.png        │    │  │
│  │    └────────────────────────────────────────────┘    │  │
│  │                     │                                  │  │
│  │                     ▼                                  │  │
│  │    ┌────────────────────────────────────────────┐    │  │
│  │    │ e. Build response object                   │    │  │
│  │    │    - Add word, definition                  │    │  │
│  │    │    - Add image path                        │    │  │
│  │    │    - Set imageGenerated flag               │    │  │
│  │    └────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 4. Return Response                                    │  │
│  │    - Vocabulary array                                 │  │
│  │    - Success status                                   │  │
│  │    - Statistics (generated/failed counts)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
     │
     │ JSON Response
     │ {
     │   "success": true,
     │   "vocabulary": [...],
     │   "count": 10,
     │   "imagesGenerated": 10,
     │   "imagesFailed": 0
     │ }
     │
     ▼
┌─────────┐
│ Browser │
└─────────┘
```

---

## Component Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                        server.py                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Configuration & Initialization                      │    │
│  │  - Load environment variables                       │    │
│  │  - Initialize Flask app                             │    │
│  │  - Setup CORS                                       │    │
│  │  - Initialize OpenAI client                         │    │
│  │  - Create vocab_images directory                    │    │
│  │  - Configure logging                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Utility Functions                                   │    │
│  │  - sanitize_filename(word) → safe_name             │    │
│  │  - get_image_path(word) → Path                     │    │
│  │  - image_exists(word) → bool                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Core Functions                                      │    │
│  │  - generate_vocabulary_list(theme, num) → List     │    │
│  │  - generate_and_save_image(word, force) → path     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ API Endpoints                                       │    │
│  │  - GET  /health                                     │    │
│  │  - POST /generate_vocab                             │    │
│  │  - POST /generate (legacy)                          │    │
│  │  - GET  /vocab_images/<filename>                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Image Generation Pipeline

```
┌──────────────┐
│ Word: "Cat"  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│ sanitize_filename("Cat")            │
│ → "cat"                             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ get_image_path("cat")               │
│ → vocab_images/cat.png              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ image_exists("cat")                 │
│ → Check if file exists              │
└──────┬──────────────────────────────┘
       │
       ├─── YES ──▶ Return cached path
       │
       └─── NO ───▶ Continue
                    │
                    ▼
       ┌─────────────────────────────────────┐
       │ Create DALL-E prompt                │
       │ "A clear, simple illustration       │
       │  of cat. Educational style..."      │
       └──────┬──────────────────────────────┘
              │
              ▼
       ┌─────────────────────────────────────┐
       │ Call OpenAI API                     │
       │ - model: dall-e-3                   │
       │ - size: 1024x1024                   │
       │ - quality: standard                 │
       │ - response_format: b64_json         │
       └──────┬──────────────────────────────┘
              │
              ▼
       ┌─────────────────────────────────────┐
       │ Extract base64 data                 │
       │ response.data[0].b64_json           │
       └──────┬──────────────────────────────┘
              │
              ▼
       ┌─────────────────────────────────────┐
       │ Decode base64 to binary             │
       │ base64.b64decode(image_data)        │
       └──────┬──────────────────────────────┘
              │
              ▼
       ┌─────────────────────────────────────┐
       │ Write to file                       │
       │ vocab_images/cat.png                │
       └──────┬──────────────────────────────┘
              │
              ▼
       ┌─────────────────────────────────────┐
       │ Return relative path                │
       │ "vocab_images/cat.png"              │
       └─────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────┐
│ Request Arrives │
└────────┬────────┘
         │
         ▼
    ┌────────────────────┐
    │ Validate Input     │
    └────┬───────────────┘
         │
         ├─── Invalid ──▶ Return 400 Error
         │                "Missing required field: theme"
         │
         └─── Valid ────▶ Continue
                          │
                          ▼
                     ┌────────────────────┐
                     │ Generate Vocab     │
                     └────┬───────────────┘
                          │
                          ├─── API Error ──▶ Log Error
                          │                  Return 500
                          │                  "Failed to generate vocabulary"
                          │
                          └─── Success ───▶ Continue
                                            │
                                            ▼
                                       ┌────────────────────┐
                                       │ For Each Word      │
                                       └────┬───────────────┘
                                            │
                                            ▼
                                       ┌────────────────────┐
                                       │ Generate Image     │
                                       └────┬───────────────┘
                                            │
                                            ├─── Error ──▶ Log Warning
                                            │              Set imageGenerated: false
                                            │              Continue with next word
                                            │
                                            └─── Success ──▶ Set imageGenerated: true
                                                             Continue with next word
                                                             │
                                                             ▼
                                                        ┌────────────────────┐
                                                        │ Return Response    │
                                                        │ (Partial success   │
                                                        │  is acceptable)    │
                                                        └────────────────────┘
```

---

## File System Structure

```
python_server/
│
├── Configuration Files
│   ├── .env                    # Environment variables (not in git)
│   ├── .env.example           # Template for .env
│   ├── requirements.txt       # Python dependencies
│   └── .gitignore            # Git ignore rules
│
├── Core Application
│   └── server.py             # Main Flask application (450+ lines)
│
├── Automation Scripts
│   ├── start_server.sh       # Automated startup
│   ├── test_server.py        # Test suite
│   └── validate_implementation.py  # Requirements validation
│
├── Documentation
│   ├── README.md             # Main documentation (400+ lines)
│   ├── SETUP_GUIDE.md       # Setup instructions (350+ lines)
│   ├── IMPLEMENTATION_SUMMARY.md  # Technical overview (500+ lines)
│   ├── QUICK_REFERENCE.md   # Quick reference (200+ lines)
│   ├── COMPLETION_REPORT.md # Completion status
│   └── ARCHITECTURE.md      # This file
│
└── Data Storage
    └── vocab_images/         # Generated images
        ├── .gitkeep         # Ensures directory is tracked
        └── *.png           # Vocabulary images (not in git)
```

---

## API Endpoint Architecture

### Endpoint: POST /generate_vocab

```
┌─────────────────────────────────────────────────────────────┐
│                    POST /generate_vocab                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Request:                                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   "theme": "Animals",                               │    │
│  │   "numWords": 10,                                   │    │
│  │   "forceRegenerate": false  // optional            │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Processing:                                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Validate input parameters                        │    │
│  │ 2. Generate vocabulary list (GPT-4o-mini)          │    │
│  │ 3. For each word:                                   │    │
│  │    - Sanitize filename                              │    │
│  │    - Check cache                                    │    │
│  │    - Generate image if needed (DALL-E 3)           │    │
│  │    - Decode and save PNG                            │    │
│  │    - Build response object                          │    │
│  │ 4. Return complete vocabulary list                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Response:                                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   "success": true,                                  │    │
│  │   "vocabulary": [                                   │    │
│  │     {                                               │    │
│  │       "id": "abc123",                               │    │
│  │       "type": "vocab",                              │    │
│  │       "word": "Elephant",                           │    │
│  │       "definition": "A large mammal...",            │    │
│  │       "image": "vocab_images/elephant.png",         │    │
│  │       "imageGenerated": true                        │    │
│  │     },                                              │    │
│  │     ...                                             │    │
│  │   ],                                                │    │
│  │   "count": 10,                                      │    │
│  │   "imagesGenerated": 9,                             │    │
│  │   "imagesFailed": 1                                 │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Error Response:                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   "error": "Missing required field: theme"          │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

### Cache Decision Tree

```
                    ┌─────────────────┐
                    │ Generate Image  │
                    │   for "Cat"     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Does cat.png    │
                    │ exist?          │
                    └────┬────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
    ┌─────────┐                   ┌─────────┐
    │   YES   │                   │   NO    │
    └────┬────┘                   └────┬────┘
         │                              │
         ▼                              │
    ┌─────────────────┐                │
    │ forceRegenerate │                │
    │ = true?         │                │
    └────┬────────────┘                │
         │                              │
    ┌────┴────┐                        │
    │         │                        │
    ▼         ▼                        ▼
┌────────┐ ┌────────┐           ┌──────────────┐
│  YES   │ │   NO   │           │ Generate New │
└───┬────┘ └───┬────┘           │ Image        │
    │          │                └──────┬───────┘
    │          │                       │
    │          ▼                       │
    │     ┌────────────┐               │
    │     │ Use Cached │               │
    │     │ Image      │               │
    │     │ (Free!)    │               │
    │     └────┬───────┘               │
    │          │                       │
    └──────────┴───────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Return Path  │
        └──────────────┘
```

### Cache Benefits

```
┌─────────────────────────────────────────────────────────────┐
│                      CACHE PERFORMANCE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  First Request (Cache Miss):                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Theme: "Animals", Words: 10                         │    │
│  │ Time: ~2-3 minutes                                  │    │
│  │ Cost: ~$0.40 (10 images × $0.04)                   │    │
│  │ Result: 10 new images saved                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Second Request (Cache Hit):                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Theme: "Animals", Words: 10                         │    │
│  │ Time: ~100ms                                        │    │
│  │ Cost: $0.00 (all cached)                            │    │
│  │ Result: Reused existing images                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Savings:                                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Time: 99.9% faster (100ms vs 2-3 min)             │    │
│  │ Cost: 100% savings ($0.00 vs $0.40)                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Architecture

### Frontend Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Old Implementation (Unsplash):                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ const imageUrl = vocab.imageUrl;                   │    │
│  │ // https://images.unsplash.com/...                 │    │
│  │ // ❌ May expire or fail                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  New Implementation (Local):                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ const imageUrl =                                    │    │
│  │   `http://localhost:3001/${vocab.image}`;          │    │
│  │ // http://localhost:3001/vocab_images/cat.png      │    │
│  │ // ✅ Always available                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP Request
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      FLASK SERVER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET /vocab_images/cat.png                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ send_from_directory(VOCAB_IMAGES_DIR, "cat.png")  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ File Response
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL FILE SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  vocab_images/cat.png                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [Binary PNG Data]                                   │    │
│  │ 1024x1024 pixels                                    │    │
│  │ ~500KB file size                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT SETUP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Local Machine                                       │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ Flask Development Server                  │     │    │
│  │  │ - Port: 3001                              │     │    │
│  │  │ - Debug: True                             │     │    │
│  │  │ - Auto-reload: True                       │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ Local File System                         │     │    │
│  │  │ - vocab_images/                           │     │    │
│  │  │ - .env (with API key)                     │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ nginx (Reverse Proxy)                               │    │
│  │ - Port: 443 (HTTPS)                                 │    │
│  │ - SSL Certificate                                   │    │
│  │ - Rate Limiting                                     │    │
│  │ - Static File Serving                               │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                            │
│                 ▼                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Gunicorn (WSGI Server)                              │    │
│  │ - Workers: 4                                        │    │
│  │ - Port: 8000 (internal)                             │    │
│  │ - Timeout: 300s                                     │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                            │
│                 ▼                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Flask Application                                   │    │
│  │ - Multiple worker processes                         │    │
│  │ - Production config                                 │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                            │
│                 ▼                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Persistent Storage                                  │    │
│  │ - vocab_images/ (with backups)                      │    │
│  │ - Logs directory                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Network Security                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ - HTTPS/TLS encryption                              │    │
│  │ - Firewall rules                                    │    │
│  │ - Rate limiting                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Layer 2: Application Security                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ - Input validation                                  │    │
│  │ - CORS configuration                                │    │
│  │ - Error message sanitization                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Layer 3: API Key Security                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ - Environment variables (.env)                      │    │
│  │ - Not committed to git                              │    │
│  │ - Restricted file permissions                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Layer 4: File System Security                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ - Filename sanitization                             │    │
│  │ - Directory restrictions                            │    │
│  │ - No user-provided paths                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring Architecture

### Logging Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGGING SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Application Events                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ - Server startup                                    │    │
│  │ - API requests                                      │    │
│  │ - Image generation                                  │    │
│  │ - Cache hits/misses                                 │    │
│  │ - Errors and warnings                               │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                            │
│                 ▼                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Python Logging Module                               │    │
│  │ - Level: INFO                                       │    │
│  │ - Format: timestamp - name - level - message        │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                            │
│                 ├──────────────┬─────────────────────┐      │
│                 ▼              ▼                     ▼      │
│  ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Console Output   │ │ Log File     │ │ Monitoring   │   │
│  │ (Development)    │ │ (Production) │ │ System       │   │
│  └──────────────────┘ └──────────────┘ └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture provides:

✅ **Reliability:** Local image storage eliminates broken links  
✅ **Performance:** Intelligent caching reduces costs and latency  
✅ **Scalability:** Modular design supports growth  
✅ **Security:** Multiple layers of protection  
✅ **Maintainability:** Clear separation of concerns  
✅ **Observability:** Comprehensive logging and monitoring  

The system is production-ready and follows best practices for:
- RESTful API design
- Error handling and recovery
- Resource optimization
- Security hardening
- Operational excellence
