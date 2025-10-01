---
description: Repository Information Overview
alwaysApply: true
---

# Run, Run, Rabbit! Game Information

## Summary
Run, Run, Rabbit! is a turn-based web browser classroom game where one player is a wolf and the others are rabbits. The game includes educational elements through a paper-scissors-stone mechanic. Players answer questions when they lose at paper-scissors-stone, and the game involves dice rolling for movement on a grid.

## Structure
The game is structured as a simple web application with HTML, CSS, and JavaScript files:
- HTML file defines the game interface and scoreboard
- JavaScript handles game logic, turn management, and player interactions
- CSS provides styling for the game elements

## Language & Runtime
**Language**: JavaScript (Frontend)
**Runtime**: Web Browser
**Build System**: None (direct browser execution)

## Dependencies
**Main Dependencies**:
- Canvas Confetti (cdn.jsdelivr.net/npm/canvas-confetti) - For visual effects
- Google Fonts (Bangers) - For typography

## Main Files
- **index.html**: Main game interface with scoreboard, game board, and controls
- **game.js**: Core game logic including turn management, dice rolling, and scoring
- **style.css**: Styling for the game interface
- **images/**: Directory containing game assets (rabbit, wolf, rock-paper-scissors icons)
- **peter-and-the-wolf-chiptune.mp3**: Background music

## Game Components

### User Interface
- Game board implemented as a grid/canvas
- Scoreboard showing player scores
- Dice rolling mechanism
- Paper-scissors-stone game interface
- Question area for educational content

### Game Mechanics
- Turn-based gameplay with dice rolling for movement
- Wolf tries to catch rabbits, rabbits try to escape to safety zone
- Paper-scissors-stone mini-game determines who answers questions
- Multiple team options (2-4 players)
- Configurable victory points (5, 10, or 15)

### Scoreboard System
- Displays scores for all players (Wolf and Rabbits)
- Wolf always moves first
- Rabbits move in a specific order determined by the game logic
- Scoreboard can dynamically reorder to reflect current turn order

### Educational Elements
- Question and answer system integrated with gameplay
- Players answer questions when losing at paper-scissors-stone
- Educational content delivery through gameplay

## Game Controls
- Dice rolling button
- Rock-paper-scissors selection
- Rules button to display game instructions
- Restart button to reset the game
- Mute/unmute button for audio control