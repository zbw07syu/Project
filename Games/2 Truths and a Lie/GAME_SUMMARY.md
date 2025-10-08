# 2 Truths and a Lie - Game Implementation Summary

## Overview
A classroom game where players write 3 sentences (2 true, 1 false) and others guess which is the lie.

## Features Implemented

### Game Setup
- **Team Selection Modal**: Choose 2-4 teams at game start
- **Turn Selection Modal**: Choose number of turns (5, 10, 15, 20, 25, or 30) - represents total number of students in class
- Turns exclude the teacher example round

### Layout
- **Left Panel**: 
  - Mute/Unmute Music button
  - Restart button
  - Rules button

- **Center Panel**:
  - Three horizontal text boxes labeled A, B, C for writing sentences
  - Guess input boxes below each sentence for team guesses
  - Three message divs:
    - **instructionDiv**: Shows current game instructions
    - **answerDiv**: Shows results and point awards
    - **controlsDiv**: Contains action buttons (Submit, Submit Guesses, Next Round)

- **Right Panel**:
  - **Scoreboard**: Lists Teacher and all teams with scores
  - Current team's turn is highlighted
  - **Turn Counter**: Shows remaining turns (excluding teacher example)

### Game Flow

#### 1. Teacher Example Round
- Teacher writes 3 sentences (2 true, 1 false)
- Teacher clicks "Submit"
- Teams discuss and ask questions
- Teacher enters team numbers in guess boxes below sentences they think are false
- Teacher clicks "Submit Guesses"
- Modal appears asking "Which sentence is false?" with A, B, C buttons
- Teacher selects the false sentence
- Teams that guessed correctly get 1 point
- Display shows which sentence was false and who got points
- "Next Round" button advances to team rounds

#### 2. Team Rounds
- Rounds alternate between teams (Team 1, Team 2, etc.)
- A student from current team tells teacher 3 sentences
- Teacher writes sentences in boxes A, B, C
- Teacher clicks "Submit"
- Other teams AND teacher make guesses
  - Teacher's guess marked with "t" or "T"
  - Team guesses marked with team numbers (1, 2, 3, 4)
  - Multiple guesses per sentence separated by commas (e.g., "1,2,t")
- Teacher clicks "Submit Guesses"
- Modal appears for teacher to select false sentence
- Correct guessers (including teacher) get 1 point
- "Next Round" button advances to next team

#### 3. Game End
- After all turns are complete, game ends
- Winner(s) determined by highest score
- Victory celebration with effects and music
- Scoreboard highlights winner(s)

### Technical Features
- **Background Music**: "timeaftertime.mp3" plays throughout game
- **Victory System**: Integrated with shared victoryManager.js
  - Random combination of 3 visual effects
  - Random victory music track
  - Animated winner text overlay
- **Responsive Design**: Uses Bangers font and purple/pink color scheme
- **Input Validation**: Ensures sentences are filled before submission
- **Guess Parsing**: Handles comma-separated team numbers and teacher indicator

### Color Scheme
- Background: Purple gradient (#2a1a3a to #4a2a5a)
- Accent: Pink (#ff6b9d)
- Highlight: Yellow (#ffd54a)
- Panels: Semi-transparent black with white content boxes

### Team Colors (for victory)
- Teacher: Light blue (#5cd0ff)
- Team 1: Red (#ff6b6b)
- Team 2: Teal (#4ecdc4)
- Team 3: Yellow (#ffe66d)
- Team 4: Green (#a8e6cf)

## Files Created
1. `index.html` - Game structure and layout
2. `style.css` - Styling and visual design
3. `game.js` - Game logic and state management
4. `timeaftertime.mp3` - Background music (already existed)

## Dependencies
- `../victoryManager.js` - Shared victory celebration system
- Google Fonts: Bangers font family