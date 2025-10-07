# Snake in a Box

A team-based tile-uncovering game where players search for a hidden snake's head and tail on a grid.

## Game Overview

Teams take turns uncovering tiles on a grid to find a hidden snake. The snake consists of a head, tail, and body segments. Teams score points by finding the head or tail. The game ends when both the head and tail are revealed.

## Features

### Grid & Gameplay
- Variable grid size based on team count:
  - 2 teams: 5×5 grid
  - 3 teams: 6×6 grid
  - 4 teams: 7×7 grid
- Coordinate labels (letters A-G on top, numbers 1-7 on left)
- All tiles initially covered
- Snake path randomly generated each game (~60% of grid)
- Snake consists of head, tail, and body segments (straight and bends)

### Turn Mechanics
1. **Dice Roll Phase**: All teams roll dice to determine turn order
   - Highest roll goes first
   - Lowest roll must answer a question
2. **Question Phase**: Team with lowest roll answers a question from the question list
3. **Tile Uncovering Phase**: Teams take turns (in dice roll order) uncovering one tile each
4. **Scoring**: 
   - Finding the snake head: +1 point
   - Finding the snake tail: +1 point
   - Finding body segments: no points
5. **Game End**: When both head and tail are revealed, team(s) with most points win

### UI Layout
- **Left Panel**: Control buttons (Mute/Unmute, Restart, Rules)
- **Center Panel**: 
  - Grid with coordinate labels
  - Three message boxes for game status
- **Right Panel**: Scoreboard showing teams and turn order
  - Current team's turn is highlighted

### Audio
- Background music: `alwaysloveyou.mp3` (loops)
- Dice roll sound: `dice.wav`

### Visual Style
- Bangers font throughout
- Color-coded teams (red, blue, green, yellow)
- Smooth tile reveal animations with 3D flip effect
- Victory celebrations using shared victoryManager system

## Files

### Core Game Files
- `index.html` - Main game structure
- `style.css` - Complete styling with animations
- `game.js` - Game logic (~500 lines)

### Assets
Located in `assets/images/snake/`:
- `head.png` - Snake head tile (64×64px)
- `tail.png` - Snake tail tile (64×64px)
- `straight.png` - Straight body segment (64×64px)
- `bend_right.png` - Right-turning body segment (64×64px)
- `bend_left.png` - Left-turning body segment (64×64px)
- `covered.png` - Covered tile (64×64px)

All tiles are cartoon pixel-art style with transparent backgrounds and consistent green color palette.

### Audio Files
- `alwaysloveyou.mp3` - Background music
- `dice.wav` - Dice roll sound effect

### Utility Scripts
- `generate_snake_tiles.py` - Python script to generate tile images using PIL/Pillow

## Integration with Wingit! System

The game integrates with the existing Wingit! games collection:

### Shared Systems
- **shared-modal.js**: Question modal system
  - Displays questions with multiple choice options
  - Shows turn indicator
  - Handles answer validation
- **victoryManager.js**: Victory celebration system
  - 12 different visual effects
  - 12 different victory music tracks
  - Confetti and strobe effects

### Question Format
Questions are passed via URL hash parameter in JSON format:
```javascript
#questions={"id":"123","name":"Quiz Name","listType":"regular","questions":[...]}
```

Each question object should have:
- `text`: Question text
- `options`: Array of answer options
- `answer`: Correct answer
- `image`: (optional) Image path

## Technical Details

### Snake Generation Algorithm
- Uses random walk algorithm starting from a random position
- Snake length is ~60% of total grid tiles
- Ensures valid path through the grid
- Assigns proper segment types (head, tail, straight, bends) based on direction changes

### Turn Order System
- Recalculated each round with new dice rolls
- Keeps gameplay dynamic and fair
- Scoreboard updates to show current turn order
- Current team highlighted with visual indicator

### Victory Conditions
- Game ends when BOTH head and tail are found
- Winner determined by highest score
- Supports ties (multiple teams with same score)
- Triggers victory celebration for winner(s)

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design with media queries
- Fallback for audio autoplay restrictions

## Future Enhancements
1. AI player support (similar to other games)
2. Enhanced snake path generation for better visual flow
3. Additional tile types or obstacles
4. Difficulty levels (snake length variations)
5. Multiplayer online support