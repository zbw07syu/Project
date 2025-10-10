# Memory Madness - Grid Layout Update

## Overview
Transformed the Memory Madness game from a vertical two-column layout to a grid-based layout with coordinate labels.

## Changes Made

### 1. Layout Structure
**Before:** Cards arranged in two vertical columns (L1, L2, L3... and R1, R2, R3...)
**After:** Cards arranged in two square-like grids side-by-side with unified coordinate system (A1, A2, A3... B1, B2, B3...)

### 2. Grid Calculation
- Automatically calculates optimal grid dimensions to create the most square-like layout
- Each side (words and images/definitions) has its own grid
- Grid dimensions are calculated based on: `cols = ceil(sqrt(numCards))`, `rows = ceil(numCards / cols)`

**Examples:**
- 6 cards per side: 3×2 grid (3 columns, 2 rows)
- 12 cards per side: 4×3 grid
- 16 cards per side: 4×4 grid
- 24 cards per side: 5×5 grid (with 1 empty space)

### 3. Coordinate System
- **Single unified coordinate system** across both grids
- Format: Row letter (A, B, C...) + Column number (1, 2, 3...)
- Coordinates flow left-to-right, top-to-bottom across BOTH grids
- Example with 12 cards (4×3 grid on each side):
  ```
  Left Grid:        Right Grid:
  A1  A2  A3  A4    A5  A6  A7  A8
  B1  B2  B3  B4    B5  B6  B7  B8
  C1  C2  C3  C4    C5  C6  C7  C8
  ```

### 4. Dynamic Sizing
- Cards automatically resize to fit all cards on screen without scrolling
- Minimum card size: 60px
- Maximum card size: 180px
- Responsive breakpoints for fonts, padding, borders, and gaps

### 5. Visual Improvements
- Coordinate labels positioned above each card
- Labels have dark background for better visibility
- Center divider maintained between left and right grids
- All cards remain visible without scrolling

## Files Modified

### game.js
- `renderCards()`: Complete rewrite to support grid layout
- `getCoordinate()`: New function to convert row/col to coordinate label (A1, B2, etc.)
- `createCardElement()`: Updated to accept single coordinate parameter

### style.css
- `#cardsGrid`: Changed from grid to flexbox to hold two grids side-by-side
- `.card-grid`: New class for individual grids with CSS Grid layout
- `.coordinate-label`: Updated positioning and styling for grid layout
- Removed `.coord-x` and `.coord-y` classes (no longer needed)

## Benefits
1. **Better Space Utilization**: Cards spread out in 2D grid instead of long vertical columns
2. **Easier Card Selection**: Coordinate system makes it easy to identify and select cards
3. **Scalable**: Works with any number of vocabulary items (6-24 pairs)
4. **No Scrolling**: All cards always visible on screen
5. **Maintains Separation**: Words and images/definitions still separated into distinct grids

## Testing Recommendations
Test with different vocabulary counts:
- 6 pairs (12 cards total) - 3×2 grid per side
- 8 pairs (16 cards total) - 3×3 grid per side
- 10 pairs (20 cards total) - 4×3 grid per side
- 12 pairs (24 cards total) - 4×3 grid per side
- 16 pairs (32 cards total) - 4×4 grid per side
- 20 pairs (40 cards total) - 5×4 grid per side
- 24 pairs (48 cards total) - 5×5 grid per side

Verify:
- All cards visible without scrolling
- Coordinate labels are readable
- Cards are properly sized
- Grid layout is square-like
- Center divider is visible
- Card selection works correctly