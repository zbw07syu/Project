# Memory Madness

A vocabulary-focused memory matching game for 2-4 teams.

## Overview

Memory Madness is an educational memory card game where teams compete to find matching pairs of vocabulary words with their corresponding images or definitions. The game combines classic memory gameplay with vocabulary learning.

## Game Features

- **2-4 Teams**: Supports 2, 3, or 4 teams
- **Human & AI Players**: Mix of human-controlled and AI-controlled teams
- **Flexible Vocab Count**: Choose 6-24 vocabulary items (max 24)
- **Two Game Modes**:
  - **Word/Image**: Match words with their images
  - **Word/Definition**: Match words with their definitions
- **Coordinate System**: Cards have X/Y coordinates (L1-L12, R1-R12) for easy reference
- **Turn-Based Gameplay**: Teams take turns finding pairs
- **Bonus Turns**: Find a match and get another turn immediately
- **Victory Celebration**: Random visual effects and music when the game ends

## How to Play

1. **Setup Phase**:
   - Select number of teams (2-4)
   - Select number of human teams (0 to total teams)
   - Choose number of vocab items (6-24)
   - Select game mode (Word/Image or Word/Definition)

2. **Turn Order**:
   - All teams roll dice to determine turn order
   - Highest roll goes first

3. **Gameplay**:
   - On your turn, select one card from the left side (words)
   - Then select one card from the right side (images/definitions)
   - Both cards remain visible for 3 seconds
   - If they match: You score 1 point and get another turn
   - If they don't match: Your turn ends and play passes to the next team

4. **Winning**:
   - Game ends when all pairs are found
   - Team with the most points wins
   - Ties are possible!

## Game Layout

```
┌─────────────┬──────────────────────────┬─────────────┐
│             │                          │             │
│  Left Panel │     Center Panel         │ Scoreboard  │
│             │                          │             │
│  - Mute     │  ┌────────────────────┐  │  Team 1: 3  │
│  - Restart  │  │   Card Grid        │  │  Team 2: 2  │
│  - Rules    │  │                    │  │  Team 3: 1  │
│  - End Game │  │  L1  L2  │  R1  R2 │  │  Team 4: 0  │
│             │  │  L3  L4  │  R3  R4 │  │             │
│             │  │  ...     │  ...    │  │ (Current    │
│             │  └────────────────────┘  │  team is    │
│             │                          │  highlighted)│
│             │  ┌────────────────────┐  │             │
│             │  │ Instruction Div    │  │             │
│             │  ├────────────────────┤  │             │
│             │  │ Answer Div         │  │             │
│             │  ├────────────────────┤  │             │
│             │  │ Controls Div       │  │             │
│             │  └────────────────────┘  │             │
└─────────────┴──────────────────────────┴─────────────┘
```

## Card Coordinates

Cards are labeled with coordinates for easy reference:
- **Left side (Words)**: L1, L2, L3, ... (up to L24)
- **Right side (Images/Definitions)**: R1, R2, R3, ... (up to R24)

This makes it easy for players to call out which cards they want to flip:
- "I'll take L3 and R7"
- "Let's try L1 and R4"

## AI Behavior

AI-controlled teams:
- Automatically select cards after a short delay
- Choose randomly from available unmatched cards
- Select one from each side (left and right)
- Follow the same rules as human players

## Audio

- **Background Music**: "handbagsgladrags.mp3" (loops during gameplay)
- **Pair Found**: "pairfound.wav" (plays when a match is found)
- **Pair Not Found**: "pairnotfound.wav" (plays when cards don't match)
- **Victory Music**: Random track from the victory manager

## Controls

### Left Panel Buttons
- **Mute/Unmute Music**: Toggle background music on/off
- **Restart**: Restart the game (requires confirmation)
- **Rules**: View game rules
- **End Game**: Return to the editor (requires confirmation)

### Gameplay
- **Click cards**: Select cards to flip
- **Roll Dice button**: Appears at start to determine turn order

## Technical Details

### Required List Type
- **Vocab List**: This game only works with vocab lists
- Each vocab item must have:
  - A word
  - Either an image OR a definition (or both)

### Data Format
The game expects vocab list data in the following format:
```json
{
  "id": "list-id",
  "name": "List Name",
  "listType": "vocab",
  "questions": [
    {
      "type": "vocab",
      "word": "Ocean",
      "image": "https://example.com/ocean.jpg",
      "definition": "A large body of salt water"
    }
  ]
}
```

### Victory System
Uses the shared `victoryManager.js` for victory celebrations:
- 3 random visual effects
- 1 random victory music track
- Winner name and color displayed

## Files

- `index.html` - Game structure and modals
- `style.css` - Game styling and animations
- `game.js` - Game logic and state management
- `neural.jpg` - Background image
- `handbagsgladrags.mp3` - Background music
- `pairfound.wav` - Match found sound effect
- `pairnotfound.wav` - No match sound effect

## Tips for Players

1. **Pay Attention**: Watch which cards other teams flip
2. **Use Coordinates**: Call out coordinates to communicate with teammates
3. **Memory is Key**: Remember card positions to find matches faster
4. **Strategic Thinking**: If you find a match, you get another turn - use it wisely!
5. **Start Simple**: Begin with fewer vocab items (6-8) to learn the game

## Tips for Teachers

1. **Vocabulary Selection**: Use the AI generation feature to create themed vocab lists
2. **Difficulty Levels**:
   - Easy: 6-8 items, Word/Image mode
   - Medium: 10-12 items, Word/Image mode
   - Hard: 16-24 items, Word/Definition mode
3. **Team Composition**: Mix human and AI teams for smaller classes
4. **Learning Focus**: Use Word/Definition mode for deeper vocabulary understanding
5. **Review Tool**: Great for reviewing vocabulary before tests

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Audio autoplay may require user interaction first

## Credits

Part of the Wingit! educational games suite.