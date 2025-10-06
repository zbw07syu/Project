# Question Type Generation Fix

## Problem
When creating a question list with specific question type breakdown (e.g., 30 single-answer and 0 multiple-choice), the AI generation was ignoring these specifications and generating mixed question types.

## Root Causes

### 1. Client-Side Issue (app.js)
The AI generation logic was checking the **generated question's type** from the server response instead of respecting the **original question type** that was created based on user specifications.

**Old behavior (lines 1232-1244):**
- If AI returned a multiple-choice question, it would convert a single-answer question to multiple-choice
- This completely ignored the user's specified breakdown

### 2. Server-Side Issue (server.js)
The server was not receiving information about the question type breakdown and was instructed to "Mix single-answer and multiple-choice questions" regardless of user preferences.

**Old behavior:**
- Only received `numQuestions` parameter
- Always told AI to mix question types
- No way to enforce user's specified breakdown

## Solutions Implemented

### 1. Client-Side Fix (app.js)

**Lines 1196-1211:** Added question type breakdown to API request
```javascript
// Calculate question type breakdown
const singleCount = state.draft.questions.filter(q => q.type === 'single').length;
const multiCount = state.draft.questions.filter(q => q.type === 'multi').length;

// Send to server
body: JSON.stringify({
  theme: listName,
  type: state.draft.listType || 'regular',
  numQuestions: numQuestions,
  singleCount: singleCount,  // NEW
  multiCount: multiCount      // NEW
})
```

**Lines 1229-1246:** Updated question population logic to respect original types
```javascript
// Only use the generated question type if it matches the existing question type
if (existingQ.type === 'multi' && generatedQ.type === 'multiple' && ...) {
  // Multiple-choice question - use generated options
  existingQ.options = generatedQ.options.slice(0, 4);
  existingQ.correct = [0];
} else if (existingQ.type === 'single') {
  // Single-answer question - use generated answer or extract from options
  if (generatedQ.type === 'multiple' && ...) {
    // AI returned multiple choice but we need single answer - use first option
    existingQ.answer = generatedQ.options[0] || existingQ.answer || '';
  } else {
    existingQ.answer = generatedQ.answer || existingQ.answer || '';
  }
  existingQ.alternates = existingQ.alternates || [];
}
```

### 2. Server-Side Fix (server.js)

**Line 39:** Accept new parameters
```javascript
const { theme, type, numQuestions, singleCount, multiCount } = req.body;
```

**Lines 73-85:** Build dynamic prompt based on question type breakdown
```javascript
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
```

## How It Works Now

### User Workflow:
1. Create a new list: "Regular" type, 30 questions
2. Specify breakdown: 30 single-answer, 0 multiple-choice
3. Click "Generate Questions"

### System Behavior:
1. **Client creates 30 single-answer question placeholders** (type: 'single')
2. **Client sends to server:**
   - theme: "Your theme"
   - numQuestions: 30
   - singleCount: 30
   - multiCount: 0

3. **Server generates AI prompt:**
   - "Generate ONLY single-answer questions (type: "single"). Do NOT generate any multiple-choice questions."

4. **Client receives AI response and populates questions:**
   - Respects original question type (single)
   - If AI mistakenly returns multiple-choice, extracts first option as answer
   - Never converts single-answer to multiple-choice

## Result
✅ Question types now match user specifications exactly
✅ 30 single-answer + 0 multiple-choice = 30 single-answer questions generated
✅ Backward compatible with existing question lists
✅ Server restart required to apply changes

## Testing
To test the fix:
1. Ensure server is running: `bash start-server.sh`
2. Create a new question list with specific breakdown
3. Click "Generate Questions"
4. Verify all questions match the specified types

## Files Modified
- `/Users/apple/Desktop/Project/app.js` (lines 1196-1246)
- `/Users/apple/Desktop/Project/server_backup/server.js` (lines 39, 73-87)

## Server Status
✅ Server restarted with updated code
✅ Health check: http://localhost:3001/health
✅ Ready to generate questions with correct type enforcement