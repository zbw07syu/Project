# Snake Rendering System Update

## Overview
Updated the snake rendering system to use custom PNG sprites and ensure 100% grid coverage with a continuous snake path.

## Key Changes

### 1. Snake Generation Algorithm (`game.js`)

**Previous Behavior:**
- Snake covered only ~60% of grid tiles
- Used simple random walk algorithm
- Could leave empty tiles

**New Behavior:**
- Snake covers 100% of all grid tiles (Hamiltonian path)
- Uses greedy algorithm with backtracking
- Prioritizes moves that keep more options open
- Automatically restarts if it gets stuck

**Algorithm Details:**
```javascript
// Scores each potential move by counting future available neighbors
// Prefers moves that don't create dead ends
// Falls back to restart if path cannot be completed
```

### 2. Sprite Assignment System

**New Function: `assignSnakeSprites()`**
- Analyzes each segment's position in the snake path
- Determines correct sprite based on:
  - Position (head, tail, or body)
  - Direction of travel
  - Connection to adjacent segments

**Sprite Types:**
- **Head sprites** (4 directions): `head-up`, `head-down`, `head-left`, `head-right`
- **Tail sprites** (4 directions): `tail-up`, `tail-down`, `tail-left`, `tail-right`
- **Body sprites** (2 types): `body-horizontal`, `body-vertical`
- **Corner sprites** (4 types): `corner-1`, `corner-2`, `corner-3`, `corner-4`

### 3. Corner Sprite Mapping

**Function: `getCornerSprite(dirFrom, dirTo)`**

Maps 8 possible turn combinations to 4 corner sprites:

| Direction Change | Sprite | Description |
|-----------------|--------|-------------|
| down→right, left→up | corner-1 | Bottom-to-right or left-to-top turn |
| down→left, right→up | corner-2 | Bottom-to-left or right-to-top turn |
| up→right, left→down | corner-3 | Top-to-right or left-to-bottom turn |
| up→left, right→down | corner-4 | Top-to-left or right-to-bottom turn |

### 4. CSS Sprite Mapping (`style.css`)

**Added sprite classes for all snake parts:**

```css
/* Head sprites with directional variants */
.grid-tile.head-up { background-image: url('...Snake head facing up.png.png'); }
.grid-tile.head-down { background-image: url('...Snake head facing down.png'); }
.grid-tile.head-left { background-image: url('...Snake head facing right.png'); transform: scaleX(-1); }
.grid-tile.head-right { background-image: url('...Snake head facing right.png.png'); }

/* Tail sprites */
.grid-tile.tail-up { background-image: url('...Snake tail pointing up.png'); }
.grid-tile.tail-down { background-image: url('...Snake tail pointing down.png'); }
.grid-tile.tail-left { background-image: url('...Snake tail pointing left.png'); }
.grid-tile.tail-right { background-image: url('...Snake tail pointing right.png'); }

/* Body sprites */
.grid-tile.body-horizontal { background-image: url('...Body section hoizontal.png'); }
.grid-tile.body-vertical { background-image: url('...Body section vertical.png'); }

/* Corner sprites */
.grid-tile.corner-1 { background-image: url('...Right angle 1.png'); }
.grid-tile.corner-2 { background-image: url('...Right angle 2.png'); }
.grid-tile.corner-3 { background-image: url('...Right angle 3.png'); }
.grid-tile.corner-4 { background-image: url('...Right angle 4.png'); }
```

### 5. Tile Reveal System Update

**Updated `handleTileClick()` function:**
```javascript
// Now applies sprite class instead of generic type class
const sprite = grid[row][col].sprite;
if (sprite) {
  tile.classList.add('revealed', sprite);
  tile.dataset.sprite = sprite;
}
```

## Sprite Assets Used

Located in `/assets/images/snake/`:

**Head Sprites:**
- `Snake head facing up.png.png`
- `Snake head facing down.png`
- `Snake head facing right.png.png`
- `Snake head facing right.png` (flipped for left)

**Tail Sprites:**
- `Snake tail pointing up.png`
- `Snake tail pointing down.png`
- `Snake tail pointing left.png`
- `Snake tail pointing right.png`

**Body Sprites:**
- `Body section hoizontal.png` (note: typo in filename)
- `Body section vertical.png`

**Corner Sprites:**
- `Right angle 1.png`
- `Right angle 2.png`
- `Right angle 3.png`
- `Right angle 4.png`

**Cover Sprite:**
- `covered.png` (used for unrevealed tiles)

## Testing

### Console Debugging
The game now logs:
- Snake length vs target (should be 100%)
- Sprite distribution (counts of each sprite type used)
- Warnings if snake doesn't fill entire grid

### Test File
Created `test_snake.html` for visual testing of path generation algorithm:
- Tests different grid sizes (5x5, 6x6, 7x7)
- Shows coverage percentage
- Displays path sequence
- Helps verify algorithm reliability

## Known Considerations

1. **Head-Left Sprite**: Uses CSS `transform: scaleX(-1)` to flip the right-facing head sprite
2. **Filename Typo**: "hoizontal" instead of "horizontal" in body sprite filename (preserved as-is)
3. **Double Extension**: Some files have `.png.png` extension (preserved as-is)
4. **Corner Mapping**: May need adjustment based on actual sprite orientations - test in-game to verify corners connect properly

## Gameplay Impact

- **Every tile now contains snake**: No more empty tiles
- **Visual continuity**: Snake appears as one continuous creature
- **Same scoring**: Head and tail still worth 1 point each
- **Same win condition**: Game ends when both head and tail are found

## Future Improvements

If corner sprites don't align correctly:
1. Open the game in browser
2. Check console for sprite distribution
3. Reveal tiles to see which corners look wrong
4. Adjust the `cornerMap` in `getCornerSprite()` function accordingly
5. May need to rotate sprites using CSS transforms if needed

## Files Modified

1. **game.js**
   - Rewrote `generateSnake()` function
   - Added `assignSnakeSprites()` function
   - Added `getCornerSprite()` function
   - Updated `handleTileClick()` to use sprite classes
   - Added debug logging

2. **style.css**
   - Replaced old sprite classes with new directional sprite classes
   - Added CSS for all 14 sprite variants
   - Added transform for head-left sprite

3. **test_snake.html** (new)
   - Testing utility for path generation algorithm