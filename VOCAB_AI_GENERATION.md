# Vocab List AI Generation Feature

## Overview
AI-powered generation for vocabulary lists has been implemented, allowing automatic creation of vocabulary words with definitions and matching images.

## Features

### 1. Automatic Vocab Generation
- Click the "✨ Generate with AI" button when editing a vocab list
- AI generates vocabulary words based on the list name/theme
- Each vocab item includes:
  - **Word**: Relevant vocabulary word for the theme
  - **Definition**: Clear, concise definition (1-2 sentences)
  - **Image**: Automatically sourced from Unsplash with relevant keywords

### 2. Image Auto-Discovery
- AI automatically finds appropriate images for each word
- Uses Unsplash Source API for high-quality, royalty-free images
- Images are matched to the vocabulary word using relevant keywords
- Format: `https://source.unsplash.com/800x600/?[keyword]`

### 3. Theme-Based Generation
- Uses the list name as the theme for vocabulary selection
- Example themes:
  - "Ocean Animals" → generates words like "dolphin", "whale", "octopus"
  - "Space Exploration" → generates words like "asteroid", "galaxy", "orbit"
  - "Ancient Rome" → generates words like "colosseum", "gladiator", "senate"

## How to Use

### Step 1: Create a Vocab List
1. Click "Create" button on the homepage
2. Enter a descriptive list name (this becomes the theme)
3. Select "Vocab List" from the dropdown
4. Enter the number of words you want
5. Click "Next"

### Step 2: Generate with AI
1. In the editor, click "✨ Generate with AI" button
2. Wait for the AI to generate vocabulary items
3. Review the generated words, definitions, and images
4. Edit any items as needed
5. Click "Save" to save your vocab list

### Example Output

For a list named "Ocean Life", the AI might generate:

```json
[
  {
    "word": "Coral",
    "definition": "A hard, colorful substance formed by tiny sea animals that live in warm, shallow water.",
    "imageUrl": "https://source.unsplash.com/800x600/?coral,reef"
  },
  {
    "word": "Kelp",
    "definition": "A large brown seaweed that grows in underwater forests in cold ocean waters.",
    "imageUrl": "https://source.unsplash.com/800x600/?kelp,seaweed"
  },
  {
    "word": "Plankton",
    "definition": "Tiny organisms that drift in the ocean and serve as food for many marine animals.",
    "imageUrl": "https://source.unsplash.com/800x600/?plankton,microscopic"
  }
]
```

## Technical Implementation

### Backend Changes (server_backup/server.js)

1. **Added vocab type support**:
   - Updated type validation to accept 'vocab'
   - Added vocab-specific system and user prompts
   - Configured AI to generate words with definitions and image URLs

2. **Unsplash Integration**:
   - AI generates Unsplash Source API URLs
   - Format: `https://source.unsplash.com/800x600/?[keyword]`
   - Keywords are automatically selected based on the word

3. **Response Transformation**:
   - Transforms AI response to match vocab item structure
   - Maps `imageUrl` from AI to `image` field in editor

### Frontend Changes (app.js)

1. **AI Generation Handler**:
   - Added vocab list type handling in generation logic
   - Maps generated data to vocab item fields:
     - `word` → word field
     - `definition` → definition field
     - `imageUrl` → image field

2. **User Feedback**:
   - Updated success message to show "vocab items" instead of "questions"
   - Maintains consistent UI/UX with other list types

## Image Sources

### Unsplash Source API
- **URL Format**: `https://source.unsplash.com/800x600/?[keywords]`
- **Benefits**:
  - Free to use
  - High-quality images
  - No attribution required for this use case
  - Automatic random selection from matching images
  - No API key needed

### Image Customization
Users can:
- Keep the AI-generated image URL
- Replace with their own image URL
- Upload a custom image file
- Leave image blank and provide only a definition

## Validation

The existing validation rules still apply:
- Each vocab item must have **either an image OR a definition** (or both)
- Words are required
- Clear error messages if validation fails

## Server Requirements

To use AI generation:
1. Start the server: `./start-server.sh`
2. Ensure OpenAI API key is configured in `server_backup/.env`
3. Server must be running on port 3001 (or deployed to Fly.io)

## Benefits

1. **Time-Saving**: Generate complete vocab lists in seconds
2. **Educational Quality**: AI creates appropriate, educational definitions
3. **Visual Learning**: Automatic image matching enhances learning
4. **Customizable**: Edit any generated content as needed
5. **Consistent Format**: All items follow the same structure

## Future Enhancements

Potential improvements:
- Multiple image options per word
- Difficulty level selection (beginner, intermediate, advanced)
- Language translation support
- Audio pronunciation URLs
- Example sentences for each word
- Synonyms and antonyms
- Part of speech tagging

## Troubleshooting

### No Images Appearing
- Check if the Unsplash URL is correct
- Verify internet connection
- Try refreshing the page
- Unsplash Source API may occasionally be slow

### AI Generation Fails
- Ensure server is running (`./start-server.sh`)
- Check OpenAI API key in `.env` file
- Verify API quota hasn't been exceeded
- Check console for error messages

### Images Don't Match Words
- Edit the image URL manually
- Use more specific keywords in the URL
- Upload a custom image instead
- Provide only a definition (images are optional)

## Notes

- The AI uses GPT-4o-mini for cost-effective generation
- Image URLs use Unsplash's random selection, so results may vary
- Generated content can always be edited before saving
- The feature works seamlessly with existing vocab list functionality