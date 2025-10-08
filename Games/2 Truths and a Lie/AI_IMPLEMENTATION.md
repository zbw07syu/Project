# AI Teams Implementation for "2 Truths and a Lie"

## Overview
This document describes the AI team functionality added to the "2 Truths and a Lie" game.

## Features

### 1. Human Team Selection Modal
- After selecting the total number of teams (2-4), a new modal appears asking "How many teams are controlled by humans?"
- Buttons are dynamically generated from 0 to the total number of teams
- Any teams beyond the human count become AI-controlled

### 2. AI Team Identification
- AI teams are marked with "(AI)" next to their name in the scoreboard
- Example: "Team 3 (AI): 2"

### 3. AI Sentence Submission
When it's an AI team's turn to submit sentences:
- The game automatically selects from a pre-defined pool of 15 fact sets
- Each fact set contains 2 truths and 1 lie
- Facts are randomly shuffled into positions A, B, and C
- Used facts are tracked to avoid repetition (resets when all facts are used)
- A 1.5-second delay is added for realism before submission

### 4. AI Guessing Behavior
When other teams need to guess:
- AI teams automatically make random guesses (A, B, or C)
- AI guesses are added to the guess input boxes after a 1-second delay
- AI teams do NOT guess on their own sentences
- During the teacher round, all AI teams participate in guessing
- During team rounds, only AI teams that aren't currently presenting guess

### 5. AI Fact Pool
The game includes 15 pre-defined fact sets covering various topics:
- Travel and places
- Skills and hobbies
- Preferences and interests
- Impossible/absurd lies for humor

Example fact set:
```javascript
{
  truth1: "I have visited Paris",
  truth2: "I can speak two languages",
  lie: "I have climbed Mount Everest"
}
```

## Technical Implementation

### New Variables
- `numHumanTeams`: Tracks how many teams are human-controlled
- `usedAIFacts`: Array tracking which facts have been used
- `teams[].isAI`: Boolean flag indicating if a team is AI-controlled

### New Functions
- `showHumanTeamModal()`: Displays and handles the human team selection
- `aiSubmitSentences()`: Selects and submits sentences for AI teams
- `aiMakeGuess()`: Returns a random guess (A, B, or C)
- `addAIGuessesForTeacherRound()`: Adds AI guesses during teacher round
- `addAIGuessesForTeamRound()`: Adds AI guesses during team rounds
- `shuffleArray()`: Randomizes sentence order

### Modified Functions
- `startTeamRound()`: Checks if current team is AI and handles accordingly
- `onSubmitSentences()`: Triggers AI guessing after sentences are submitted
- `updateScoreboard()`: Displays "(AI)" label for AI teams
- `restartGame()`: Resets AI-related state variables

## Game Flow with AI Teams

### Setup Phase
1. Select total number of teams (2-4)
2. Select number of human teams (0 to total)
3. Select number of turns
4. Game starts with teams initialized (human teams first, then AI teams)

### Teacher Round
1. Teacher submits 3 sentences
2. AI teams automatically make guesses (added to guess boxes)
3. Teacher enters human team guesses
4. Teacher reveals the false sentence
5. Points awarded to correct guessers (including AI)

### Team Rounds
**Human Team Turn:**
1. Human team tells teacher their sentences
2. Teacher writes sentences in boxes A, B, C
3. AI teams automatically make guesses
4. Teacher enters other human team guesses and their own guess
5. Teacher reveals false sentence
6. Points awarded

**AI Team Turn:**
1. AI team automatically submits sentences (1.5s delay)
2. Other AI teams automatically make guesses (1s delay)
3. Teacher enters human team guesses and their own guess
4. Teacher reveals false sentence
5. Points awarded

## Edge Cases Handled
- All teams can be AI (0 human teams)
- All teams can be human (numHumanTeams = numTeams)
- AI teams don't guess on their own sentences
- Fact pool resets when all facts are used
- AI state resets on game restart

## Future Enhancements (Potential)
- Smarter AI guessing (analyzing sentence patterns)
- Difficulty levels for AI (easy/medium/hard)
- Custom fact pools loaded from question editor
- AI personality variations (conservative vs aggressive guessing)