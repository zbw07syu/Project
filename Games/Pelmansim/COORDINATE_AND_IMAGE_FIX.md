# Coordinate Display and Image Error Handling Fix

## Issues Fixed

### 1. Card Back Showing Question Mark Instead of Coordinates
**Problem:** All cards displayed "?" on their back face instead of showing the coordinate labels (A1, A2, B1, B2, etc.)

**Root Cause:** In `createCardElement()` function, the card back was hardcoded to show "?" regardless of the coordinate parameter.

**Solution:** Changed line 344 in `game.js`:
```javascript
// Before:
cardBack.textContent = '?';

// After:
cardBack.textContent = coordinate;
```

**Result:** Cards now display their coordinates (A1, A2, A3, B1, B2, B3, etc.) on the back face, making it easy for players to identify which card they want to select.

### 2. Broken Image URLs Not Handled
**Problem:** When AI-generated image URLs fail to load, the card shows nothing, making the game unplayable.

**Root Cause:** No error handling for failed image loads. The `img.src` was set but if the URL was invalid or the image couldn't be loaded, the card would appear blank.

**Solution:** Added error handling in `createCardElement()` function (lines 357-365):
```javascript
// Handle broken image URLs
img.onerror = function() {
  console.warn('Failed to load image:', card.content);
  // Replace with placeholder text
  cardFront.innerHTML = '';
  cardFront.textContent = '[Image not available]';
  cardFront.style.fontSize = 'var(--card-font-size, 1rem)';
  cardFront.style.color = '#ff6b6b';
};
```

**Result:** 
- When an image fails to load, it's replaced with "[Image not available]" text in red
- The error is logged to console for debugging
- The game remains playable even with broken image URLs
- Players can still match words with the placeholder text

## Technical Details

### Coordinate Display
- **Location:** Card back face (when card is face down)
- **Font Size:** Dynamically calculated based on card size (controlled by `--card-back-font-size` CSS variable)
- **Visibility:** Always visible on unflipped cards
- **Format:** Row letter + Column number (e.g., A1, B2, C3)

### Image Error Handling
- **Trigger:** `img.onerror` event fires when image fails to load
- **Fallback:** Replaces image with text placeholder
- **Styling:** Red text (#ff6b6b) to indicate error state
- **Logging:** Warns to console with the failed URL for debugging

## Files Modified

### `/Games/Pelmansim/game.js`
- **Line 344:** Changed card back text from "?" to coordinate
- **Lines 357-365:** Added image error handling with fallback text

## Testing Checklist

- [x] Cards show coordinates (A1, A2, etc.) instead of "?"
- [x] Coordinates are readable on card backs
- [x] Broken image URLs show "[Image not available]" text
- [x] Game remains playable with broken images
- [x] Console logs warnings for failed image loads
- [x] Coordinate font size scales with card size

## Benefits

1. **Better User Experience:** Players can easily identify cards by their coordinates
2. **Graceful Degradation:** Game works even when image URLs are broken
3. **Debugging Support:** Failed image URLs are logged to console
4. **Visual Feedback:** Red placeholder text clearly indicates missing images
5. **Accessibility:** Text fallback makes the game more accessible

## Notes

- The coordinate label above the card (with gold background) is still present for additional visibility
- The card back now also shows the coordinate in large text
- Image URLs from AI generators may expire or be invalid - the error handling ensures the game remains functional
- If many images are broken, consider regenerating the vocabulary list with new image URLs

## Future Enhancements (Optional)

1. Add a "Regenerate Images" button to fetch new image URLs
2. Cache working image URLs to avoid repeated failures
3. Add a visual indicator (icon) for cards with broken images
4. Provide option to use definitions instead of images when images fail
5. Add image URL validation before starting the game