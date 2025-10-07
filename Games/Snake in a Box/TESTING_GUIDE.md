# Snake Rendering Testing Guide

## How to Test the New Snake System

### 1. Open the Game
- Open `index.html` in a web browser
- Open browser console (F12 or Right-click → Inspect → Console)

### 2. Check Console Output

When the game starts, you should see:
```
Snake generated with 25 segments (target: 25)
Sprite distribution: { head-right: 1, body-horizontal: 8, corner-2: 4, ... }
```

**What to look for:**
- ✅ Snake length should equal target (100% coverage)
- ✅ Should have exactly 1 head sprite (head-up, head-down, head-left, or head-right)
- ✅ Should have exactly 1 tail sprite (tail-up, tail-down, tail-left, or tail-right)
- ✅ Rest should be body and corner sprites

**Warning signs:**
- ⚠️ If snake length < target, the algorithm failed to fill the grid
- ⚠️ If you see multiple head or tail sprites, there's a bug in sprite assignment

### 3. Visual Testing

**Start a game:**
1. Select number of teams (2, 3, or 4)
2. Roll dice for turn order
3. Start revealing tiles

**What to check:**
- ✅ All tiles should show snake parts when revealed
- ✅ Snake segments should visually connect to adjacent segments
- ✅ Head should have eyes/face pointing in one direction
- ✅ Tail should taper to a point
- ✅ Body sections should be straight (horizontal or vertical)
- ✅ Corners should show 90-degree bends

### 4. Corner Alignment Test

**If corners don't look right:**

The corner sprites might need remapping. Here's how to fix:

1. **Identify the problem corner:**
   - Note which direction the snake is coming FROM
   - Note which direction the snake is going TO
   - Example: "Snake comes from left, goes down, but corner looks wrong"

2. **Check the sprite file:**
   - Open `assets/images/snake/Right angle 1.png` (and 2, 3, 4)
   - Note which way each corner bends

3. **Update the mapping:**
   - Edit `game.js`
   - Find the `getCornerSprite()` function
   - Adjust the `cornerMap` object to match your sprite orientations

**Example fix:**
```javascript
// If corner-1 should be used for up→right instead of down→right:
const cornerMap = {
  'up-right': 'corner-1',  // Changed from 'down-right'
  // ... rest of mappings
};
```

### 5. Grid Size Testing

Test all three grid sizes:
- **2 teams**: 5x5 grid (25 tiles)
- **3 teams**: 6x6 grid (36 tiles)
- **4 teams**: 7x7 grid (49 tiles)

For each size, verify:
- Snake fills entire grid
- Path is continuous (no gaps)
- Head and tail are at opposite ends of the path

### 6. Path Generation Testing

Use the test file for algorithm verification:

1. Open `test_snake.html` in browser
2. Click buttons to test different grid sizes
3. Check coverage percentage (should be 100%)
4. Verify path is continuous (numbers should increment by 1)

**If coverage is less than 100%:**
- The algorithm is having trouble finding a Hamiltonian path
- Try increasing `maxAttempts` in `generateSnake()` function
- Or implement a more sophisticated backtracking algorithm

### 7. Gameplay Testing

**Complete game flow:**
1. Start game with 2 teams
2. Play through entire game
3. Verify head and tail can both be found
4. Verify game ends when both are revealed
5. Check that victory celebration plays (if that's working)

**Score verification:**
- Finding head = +1 point
- Finding tail = +1 point
- Finding body = 0 points
- Team with most points wins

### 8. Performance Testing

**Check for lag:**
- Snake generation should be instant (< 100ms)
- If game freezes on start, algorithm is taking too long
- Check console for "Warning: Snake only covers X%" message
- May need to optimize path generation algorithm

### 9. Sprite Loading Check

**If tiles appear blank when revealed:**

1. Check browser console for 404 errors
2. Verify sprite files exist in `assets/images/snake/`
3. Check filename spelling in CSS matches actual files
4. Note: Some files have `.png.png` extension - this is intentional

**Common issues:**
- `Snake head facing up.png.png` (double .png)
- `Snake head facing right.png.png` (double .png)
- `Body section hoizontal.png` (typo: "hoizontal")

### 10. Cross-Browser Testing

Test in multiple browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari

**Known compatibility:**
- CSS `transform: scaleX(-1)` for head-left sprite
- Should work in all modern browsers

## Troubleshooting

### Problem: Snake doesn't fill entire grid

**Solution:**
```javascript
// In generateSnake(), increase maxAttempts:
const maxAttempts = 50000; // Increased from 10000
```

### Problem: Corners don't connect properly

**Solution:**
1. Identify which corner sprite is wrong
2. Look at the actual PNG file
3. Remap in `getCornerSprite()` function
4. May need to add CSS rotation:
```css
.grid-tile.corner-1 {
  background-image: url('assets/images/snake/Right angle 1.png');
  transform: rotate(90deg); /* If needed */
}
```

### Problem: Head or tail pointing wrong direction

**Solution:**
Check the logic in `assignSnakeSprites()`:
- Head direction is based on where the NEXT segment is
- Tail direction is based on where the PREVIOUS segment is
- May need to swap the logic if sprites are oriented differently

### Problem: Game freezes on startup

**Solution:**
The path generation is stuck. Options:
1. Increase `maxAttempts`
2. Improve the scoring heuristic
3. Implement proper backtracking instead of restart
4. Use a deterministic Hamiltonian path algorithm

## Success Criteria

✅ **All tests pass when:**
- Console shows 100% coverage
- All tiles reveal snake parts
- Snake looks continuous and connected
- Head has exactly one sprite
- Tail has exactly one sprite
- Corners bend correctly
- Game plays through to completion
- Victory celebration triggers (if implemented)

## Reporting Issues

If you find bugs, note:
1. Grid size when bug occurred
2. Console output
3. Screenshot of the revealed snake
4. Which sprite(s) look wrong
5. Browser and version

This will help debug and fix any remaining issues with the sprite system.