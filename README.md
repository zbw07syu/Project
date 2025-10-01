# Classroom Question Lists with AI Generation

A web application for creating and managing classroom question lists with AI-powered question generation using OpenAI.

## Features

- **Question List Management**: Create, edit, delete, and play question lists
- **Two Question Types**: 
  - Regular lists (single-answer and multiple-choice questions)
  - Icebreak lists (prompts with accepted follow-up questions)
- **AI Question Generation**: Generate questions automatically using OpenAI GPT-4o-mini
- **Game Integration**: Play question lists with RunRunRabbit, Tornado, or Icebreak games
- **Local Storage**: All data persists in browser localStorage

## Setup Instructions

### 1. Configure OpenAI API Key

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. The API key is already configured in `server/.env`:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### 2. Start the Backend Server

Run the startup script:
```bash
./start-server.sh
```

Or manually:
```bash
export PATH="/Users/apple/Desktop/Project/node/bin:$PATH"
cd server
node server.js
```

The server will start on `http://localhost:3001`

### 3. Open the Editor

Open `Editor/index.html` in your web browser.

## Using AI Question Generation

1. **Create a New Question List**:
   - Click "Create" on the homepage
   - Enter a descriptive name (this becomes the theme for AI generation)
   - Choose "Regular" or "Icebreak" type
   - Set the number of questions

2. **Generate Questions with AI**:
   - In the editor, make sure you have a descriptive list name
   - Click "✨ Generate Questions"
   - The AI will generate questions based on your list name as the theme
   - Questions will populate automatically in the editor
   - You can still manually edit any generated questions

3. **Save and Play**:
   - Click "Save" to store your question list
   - Use "Play" to launch the appropriate game

## Question Formats

### Regular Questions
- **Single-answer**: Simple question with one correct answer
- **Multiple-choice**: Question with 2-4 options (first option is correct)

### Icebreak Questions
- **Prompt**: An engaging icebreaker statement or question
- **Accepted Questions**: 3-5 follow-up questions students can ask

## API Endpoints

### POST /generate
Generate questions using OpenAI.

**Request Body:**
```json
{
  "theme": "Space Exploration",
  "type": "regular",
  "numQuestions": 5
}
```

**Response:**
```json
{
  "success": true,
  "questions": [...],
  "count": 5
}
```

### GET /health
Health check endpoint.

## Error Handling

- Server connection errors show user-friendly messages
- OpenAI API errors (quota, invalid key) are handled gracefully
- Input validation prevents invalid requests

## Project Structure

```
Project/
├── Editor/           # Frontend question list editor
├── Games/           # Game implementations
├── server/          # Backend API server
├── node/           # Local Node.js installation
└── start-server.sh # Server startup script
```

## Troubleshooting

1. **"Make sure the server is running on port 3001"**
   - Run `./start-server.sh` to start the backend server

2. **OpenAI API errors**
   - Check your API key in `server/.env`
   - Ensure you have sufficient OpenAI credits

3. **Questions not generating**
   - Make sure you have a descriptive list name
   - Check browser console for detailed error messages

## Development

The AI generation integrates seamlessly with the existing question list editor:
- Uses the existing "Generate Questions" button
- Maintains all current functionality
- Questions can be manually edited after generation
- Supports both Regular and Icebreak question types