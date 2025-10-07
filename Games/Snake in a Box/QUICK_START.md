# Snake in a Box - Quick Start Guide

## 🚀 Get Started in 30 Seconds

### 1. Open the Test Page
```bash
# Navigate to the game directory
cd "/Users/apple/Desktop/Project/Games/Snake in a Box"

# Open test.html in your browser
open test.html
```

### 2. Launch the Game
Click **"Launch Game with Sample Questions"** button

### 3. Play!
- Select number of teams (2, 3, or 4)
- Click "Roll Dice"
- Answer the question
- Click tiles to find the snake
- First to find head or tail wins!

---

## 📂 File Overview

### Essential Files (Don't Delete!)
```
index.html          ← Main game file
style.css           ← All styling
game.js             ← Game logic
alwaysloveyou.mp3   ← Background music
dice.wav            ← Sound effect
assets/images/snake/ ← All tile images (6 files)
```

### Shared Dependencies (In parent folder)
```
../shared-modal.js      ← Question modal system
../victoryManager.js    ← Victory celebrations
```

### Documentation (Optional)
```
README.md                      ← Full documentation
IMPLEMENTATION_CHECKLIST.md    ← Requirements verification
COMPLETION_SUMMARY.md          ← Project summary
VISUAL_GUIDE.md                ← Visual reference
QUICK_START.md                 ← This file
test.html                      ← Testing tool
```

---

## 🎮 How to Play

### Setup Phase
1. **Team Selection**: Choose 2, 3, or 4 teams
2. **Grid Appears**: Size varies (5×5, 6×6, or 7×7)

### Each Round
1. **Roll Dice**: All teams roll to determine order
2. **Question**: Lowest roll team answers a question
3. **Uncover Tiles**: Teams take turns clicking tiles
4. **Scoring**: Find head or tail for +1 point

### Victory
- Game ends when BOTH head and tail are found
- Team(s) with most points win
- Celebration plays automatically

---

## 🔧 Integration with Wingit!

### Adding Questions
Questions are passed via URL hash parameter:

```javascript
// Format
#questions={"id":"123","name":"Quiz","listType":"regular","questions":[...]}

// Example
const questions = {
  id: "quiz-001",
  name: "General Knowledge",
  listType: "regular",
  questions: [
    {
      type: "multiple-choice",
      text: "What is 2+2?",
      options: ["3", "4", "5", "6"],
      answer: "4"
    }
  ]
};

// Launch game with questions
const url = `index.html#questions=${encodeURIComponent(JSON.stringify(questions))}`;
window.open(url);
```

### Without Questions
Simply open `index.html` directly - the game will skip the question phase.

---

## 🎨 Customization

### Change Team Colors
Edit `game.js` line 43-44:
```javascript
const teamColors = ['red', 'blue', 'green', 'yellow'];
const teamNames = ['Red Team', 'Blue Team', 'Green Team', 'Yellow Team'];
```

### Change Grid Sizes
Edit `game.js` line 102:
```javascript
gridSize = numTeams === 2 ? 5 : numTeams === 3 ? 6 : 7;
// Change to: gridSize = numTeams === 2 ? 6 : numTeams === 3 ? 7 : 8;
```

### Change Snake Length
Edit `game.js` line 126:
```javascript
const snakeLength = Math.floor(totalTiles * 0.6); // 60% of grid
// Change to: const snakeLength = Math.floor(totalTiles * 0.5); // 50% of grid
```

### Change Background Music
Replace `alwaysloveyou.mp3` with your own file (keep same name) or edit `index.html` line 46:
```html
<audio id="bgMusic" src="your-music.mp3" loop></audio>
```

---

## 🐛 Troubleshooting

### Music Won't Play
**Problem**: Browser blocks autoplay  
**Solution**: Click anywhere on the page first, then music will start

### Questions Not Showing
**Problem**: URL hash not formatted correctly  
**Solution**: Use `test.html` to generate proper URL format

### Tiles Not Revealing
**Problem**: JavaScript error or file path issue  
**Solution**: Check browser console (F12) for errors

### Images Not Loading
**Problem**: Incorrect file paths  
**Solution**: Verify `assets/images/snake/` folder contains all 6 PNG files

### Shared Scripts Not Found
**Problem**: `shared-modal.js` or `victoryManager.js` missing  
**Solution**: Ensure these files exist in parent `Games/` folder

---

## 📝 Common Tasks

### Test with Custom Questions
1. Open `test.html`
2. Edit the `sampleQuestions` object (line 88)
3. Save and refresh
4. Click "Launch Game with Sample Questions"

### Regenerate Tile Images
```bash
# Install Pillow if needed
pip install Pillow

# Run generator
python generate_snake_tiles.py
```

### Reset Game
Click the **"Restart"** button or refresh the page

### View Rules
Click the **"Rules"** button in the left panel

---

## 🔍 Testing Checklist

### Basic Functionality
- [ ] Game loads without errors
- [ ] Team selection works
- [ ] Grid appears with correct size
- [ ] Coordinate labels show (A-G, 1-7)
- [ ] Tiles are covered initially

### Dice & Questions
- [ ] Roll dice button appears
- [ ] All teams get random rolls
- [ ] Turn order displayed correctly
- [ ] Question modal appears
- [ ] Answer validation works

### Gameplay
- [ ] Tiles reveal on click
- [ ] Snake parts show correctly
- [ ] Scores update for head/tail
- [ ] Current turn highlighted
- [ ] Turns advance properly
- [ ] New rounds start correctly

### End Game
- [ ] Game ends when both found
- [ ] Winner announced correctly
- [ ] Victory celebration plays
- [ ] Confetti appears

### Controls
- [ ] Mute/unmute works
- [ ] Restart reloads game
- [ ] Rules modal opens/closes

---

## 💡 Tips

### For Players
- **Strategy**: Spread out your guesses to cover more area
- **Memory**: Remember where body segments are to trace the snake
- **Luck**: Dice rolls add randomness - lowest roll gets question

### For Developers
- **Debugging**: Open browser console (F12) to see logs
- **Testing**: Use `test.html` for quick testing with questions
- **Customizing**: All game logic is in `game.js` - well commented
- **Styling**: All CSS is in `style.css` - organized by section

### For Integration
- **Questions**: Use the URL hash format shown above
- **Embedding**: Game works in iframe if needed
- **Responsive**: Works on mobile and desktop
- **Accessibility**: ARIA labels included for screen readers

---

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Requirements**: See `IMPLEMENTATION_CHECKLIST.md`
- **Visual Reference**: See `VISUAL_GUIDE.md`
- **Project Summary**: See `COMPLETION_SUMMARY.md`

---

## 🎯 Quick Reference

### Game Rules (Short Version)
1. Roll dice → Lowest answers question
2. Uncover tiles in turn order
3. Find head or tail for points
4. Both found = game over
5. Most points wins

### File Paths
```
Game:     index.html
Styles:   style.css
Logic:    game.js
Music:    alwaysloveyou.mp3
Sound:    dice.wav
Tiles:    assets/images/snake/*.png
Modal:    ../shared-modal.js
Victory:  ../victoryManager.js
```

### Key Functions (game.js)
```javascript
init()              // Start game
startGame()         // Begin gameplay
rollDiceForTurnOrder() // Dice roll
askQuestion()       // Show question
handleTileClick()   // Reveal tile
endGame()           // Victory
```

### CSS Classes
```css
.grid-tile          // Tile styling
.covered            // Covered state
.revealed           // Revealed state
.current-turn       // Highlighted team
.modal              // Modal styling
```

---

## ✅ Ready to Go!

The game is **complete and functional**. Just open `test.html` and start playing!

For questions or issues, refer to the comprehensive documentation files included in this directory.

**Have fun playing Snake in a Box!** 🐍📦🎮