const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const https = require('https');


// Load environment variables from .env file if
// not in production. In production, environment
// variables are loaded from fly.io:
//  - for secrets, these are stored using the `fly secrets`:
//      https://fly.io/docs/apps/secrets/
//  - for normal config, these are in the `fly.toml` file
//
// When running locally, these are loaded from the .env file.
if (!process.env.DEPLOYMENT || process.env.DEPLOYMENT !== 'production') {
    dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to fetch image from Pixabay (free, no API key needed)
async function fetchImageFromPixabay(keyword) {
  return new Promise((resolve, reject) => {
    // Use Pixabay's free API (no key required for basic usage)
    const searchTerm = encodeURIComponent(keyword);
    const url = `https://pixabay.com/api/?key=9656065-a4094594c34f9ac14c7fc4c39&q=${searchTerm}&image_type=photo&per_page=3`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.hits && result.hits.length > 0) {
            // Return the medium-sized image URL
            resolve(result.hits[0].webformatURL);
          } else {
            // Fallback to a placeholder if no image found
            resolve(`https://via.placeholder.com/800x600/4A90E2/ffffff?text=${encodeURIComponent(keyword)}`);
          }
        } catch (error) {
          console.error('Error parsing Pixabay response:', error);
          resolve(`https://via.placeholder.com/800x600/4A90E2/ffffff?text=${encodeURIComponent(keyword)}`);
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching from Pixabay:', error);
      resolve(`https://via.placeholder.com/800x600/4A90E2/ffffff?text=${encodeURIComponent(keyword)}`);
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Question Generator Server is running' });
});

// Generate questions endpoint
app.post('/generate', async (req, res) => {
  console.log('=== Generate endpoint called ===');
  console.log('Request body:', req.body);
  try {
    const { theme, type, numQuestions, singleCount, multiCount } = req.body;
    console.log('Parsed params:', { theme, type, numQuestions, singleCount, multiCount });

    // Validate input
    if (!theme || !type || !numQuestions) {
      return res.status(400).json({ 
        error: 'Missing required fields: theme, type, and numQuestions are required' 
      });
    }

    if (!['regular', 'icebreak', 'vocab'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be either "regular", "icebreak", or "vocab"' 
      });
    }

    if (numQuestions < 1 || numQuestions > 50) {
      return res.status(400).json({ 
        error: 'numQuestions must be between 1 and 50' 
      });
    }

    let systemPrompt, userPrompt;
    console.log('Building prompts for type:', type);

    if (type === 'regular') {
      systemPrompt = `You are an expert question generator for educational content. Generate engaging questions for classroom use. 

Return ONLY a valid JSON array of question objects. Each question should have:
- type: "single" or "multiple" 
- question: the question text
- answer: the correct answer (for single-answer questions)
- options: array of 2-4 options (for multiple-choice questions, with the first option being correct)

Make questions educational, age-appropriate, and engaging.`;

      // Build the prompt based on the question type breakdown
      let questionTypeInstruction = '';
      if (singleCount !== undefined && multiCount !== undefined) {
        if (singleCount > 0 && multiCount > 0) {
          questionTypeInstruction = `Generate exactly ${singleCount} single-answer questions followed by ${multiCount} multiple-choice questions.`;
        } else if (singleCount > 0 && multiCount === 0) {
          questionTypeInstruction = `Generate ONLY single-answer questions (type: "single"). Do NOT generate any multiple-choice questions.`;
        } else if (singleCount === 0 && multiCount > 0) {
          questionTypeInstruction = `Generate ONLY multiple-choice questions (type: "multiple"). Do NOT generate any single-answer questions.`;
        }
      } else {
        questionTypeInstruction = `Mix single-answer and multiple-choice questions.`;
      }

      userPrompt = `Generate ${numQuestions} questions about "${theme}". ${questionTypeInstruction} Return only the JSON array, no other text.

Example format:
[
  {
    "type": "single",
    "question": "What is the capital of France?",
    "answer": "Paris"
  },
  {
    "type": "multiple", 
    "question": "Which of these is a primary color?",
    "options": ["Red", "Green", "Orange", "Purple"]
  }
]`;
    } else if (type === 'icebreak') {
      // Icebreak type
      systemPrompt = `You are an expert at creating icebreaker questions for classroom activities. Generate fun, engaging prompts that help students get to know each other.

Return ONLY a valid JSON array of icebreaker objects. Each object should have:
- prompt: a short answer or fact (1-3 words typically) that responds to the accepted questions
- acceptedQuestions: array of 8 simple, straightforward questions that would elicit the prompt as an answer

IMPORTANT: Make the questions as SIMPLE and EASY TO GUESS as possible. Use basic, common vocabulary and direct phrasing. The questions should be obvious and straightforward, not clever or complex.

The prompt should be the ANSWER, and acceptedQuestions should be QUESTIONS that lead to that answer.`;

      userPrompt = `Generate ${numQuestions} icebreaker prompts about "${theme}". Return only the JSON array, no other text.

Example format:
[
  {
    "prompt": "Portuguese",
    "acceptedQuestions": [
      "What nationality is he?",
      "Where is he from?",
      "What country is he from?",
      "What is his nationality?",
      "What passport does he have?",
      "What language does he speak?",
      "Where was he born?",
      "What country does he come from?"
    ]
  }
]`;
    } else {
      // Vocab type
      systemPrompt = `You are an expert vocabulary educator. Generate vocabulary words with definitions.

Return ONLY a valid JSON array of vocabulary objects. Each object should have:
- word: the vocabulary word
- definition: a clear, concise definition (1-2 sentences)
- imageKeyword: a simple keyword for finding an image (e.g., "ocean", "mountain", "book")

IMPORTANT: 
- Choose words appropriate for the theme
- Definitions should be educational and easy to understand
- Image keywords should be simple, relevant search terms that visually represent the word`;

      userPrompt = `Generate ${numQuestions} vocabulary words about "${theme}". Return only the JSON array, no other text.

Example format:
[
  {
    "word": "Ocean",
    "definition": "A very large expanse of sea, in particular each of the main areas into which the sea is divided geographically.",
    "imageKeyword": "ocean"
  },
  {
    "word": "Mountain",
    "definition": "A large natural elevation of the earth's surface rising abruptly from the surrounding level.",
    "imageKeyword": "mountain"
  }
]`;
    }

    console.log('Calling OpenAI API...');
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the JSON response
    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from AI');
    }

    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }

    // Transform the response to match the editor's expected format
    const transformedQuestions = await Promise.all(questions.map(async (q, index) => {
      const id = Math.random().toString(36).slice(2, 9);
      
      if (type === 'regular') {
        if (q.type === 'multiple' && Array.isArray(q.options) && q.options.length >= 2) {
          return {
            id,
            type: 'multiple',
            question: q.question || `Question ${index + 1}`,
            options: q.options.slice(0, 4) // Limit to 4 options, first is correct
          };
        } else {
          return {
            id,
            type: 'single',
            question: q.question || `Question ${index + 1}`,
            answer: q.answer || 'Answer not provided'
          };
        }
      } else if (type === 'icebreak') {
        // Icebreak type
        return {
          id,
          type: 'icebreak',
          prompt: q.prompt || `Icebreaker ${index + 1}`,
          accepted: Array.isArray(q.acceptedQuestions) ? q.acceptedQuestions : []
        };
      } else {
        // Vocab type - fetch image from Pixabay
        const imageKeyword = q.imageKeyword || q.word || `Word ${index + 1}`;
        const imageUrl = await fetchImageFromPixabay(imageKeyword);
        
        return {
          id,
          type: 'vocab',
          word: q.word || `Word ${index + 1}`,
          definition: q.definition || '',
          imageUrl: imageUrl
        };
      }
    }));

    res.json({
      success: true,
      questions: transformedQuestions,
      count: transformedQuestions.length
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'OpenAI API quota exceeded. Please try again later.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key configuration.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate questions. Please try again.' 
    });
  }
});

// Error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`Question Generator Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('Server loaded. API Key is hidden:', process.env.OPENAI_API_KEY ? true : false);
});


module.exports = app;
