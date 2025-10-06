# Turn Indicator Update - RunRunRabbit

## Overview
The turn indicator (e.g., "blackrabbit must answer!") has been moved from the answerDiv to display prominently at the top of the question modal, above the question text.

---

## Changes Made

### 1. Shared Modal System (`shared-modal.js`)

#### Added Turn Indicator Element
- Added `<div class="mc-modal-turn-indicator"></div>` to the modal HTML structure
- Positioned at the top of the modal body, before the image and question

#### Added CSS Styling
```css
.mc-modal-turn-indicator {
  display: none;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-align: center;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  animation: pulse 2s ease-in-out infinite;
}
```

Features:
- **Gradient background** - Purple gradient for visual prominence
- **Pulse animation** - Subtle pulsing effect to draw attention
- **Show/hide** - Only displays when `turnIndicator` parameter is provided
- **Responsive** - Adapts to modal width

#### Updated Modal Functions
All three modal functions now accept an optional `turnIndicator` parameter:

1. **`showOptionsModal(question, options, callback, imagePath, turnIndicator)`**
   - Added `turnIndicator` parameter (5th parameter)
   - Displays turn indicator above the question

2. **`showOpenAnswerModal(question, answer, alternates, callbacks, imagePath, turnIndicator)`**
   - Added `turnIndicator` parameter (6th parameter)
   - Displays turn indicator above the question

3. **`showContinuePassModal(message, callbacks, imagePath, turnIndicator)`**
   - Added `turnIndicator` parameter (4th parameter)
   - Displays turn indicator above the message

---

### 2. RunRunRabbit Game (`game.js`)

#### Multiple-Choice Questions
Updated the modal call to pass the turn indicator:

```javascript
// Get turn indicator text
const currentLoser = losers[currentLoserIndex];
const turnIndicatorText = `${namesMap[currentLoser] || currentLoser} must answer!`;

// Show modal with turn indicator
window.MultipleChoiceModal.showModal(
  currentQuestion.text,
  currentQuestion.options,
  handleOptionSelect,
  currentQuestion.image,
  turnIndicatorText  // ← New parameter
);
```

#### Open-Answer Questions
Updated the custom modal implementation to display the turn indicator:

```javascript
// Handle turn indicator display
const turnIndicatorEl = modalContainer.querySelector('.mc-modal-turn-indicator');
if (turnIndicatorEl) {
  const turnIndicatorText = `${namesMap[currentLoser] || currentLoser} must answer!`;
  turnIndicatorEl.textContent = turnIndicatorText;
  turnIndicatorEl.classList.add('show');
}
```

#### Cleared answerDiv
Removed the turn indicator text from answerDiv in two places:

1. **Initial losers display** (line 2465):
   ```javascript
   answerDiv.textContent = ""; // Clear answerDiv - turn indicator will show in modal
   ```

2. **Individual question display** (line 2515):
   ```javascript
   answerDiv.textContent = ""; // Clear answerDiv - turn indicator now in modal
   ```

---

## Visual Layout

### Before
```
┌─────────────────────────────────┐
│ Question Modal                  │
├─────────────────────────────────┤
│                                 │
│ [Question Image]                │
│                                 │
│ What is the capital of France?  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Paris                       │ │
│ ├─────────────────────────────┤ │
│ │ London                      │ │
│ ├─────────────────────────────┤ │
│ │ Berlin                      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Answer Div (below modal):
"blackrabbit must answer!"
```

### After
```
┌─────────────────────────────────┐
│ Question Modal                  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ blackrabbit must answer! 🔔 │ │ ← NEW: Turn indicator
│ └─────────────────────────────┘ │
│                                 │
│ [Question Image]                │
│                                 │
│ What is the capital of France?  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Paris                       │ │
│ ├─────────────────────────────┤ │
│ │ London                      │ │
│ ├─────────────────────────────┤ │
│ │ Berlin                      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Answer Div (below modal):
[Empty - no longer shows turn info]
```

---

## Benefits

### 1. **Better User Experience**
- Turn indicator is now visible while the modal is open
- No need to look outside the modal to see whose turn it is
- More intuitive and focused interface

### 2. **Visual Prominence**
- Purple gradient background makes it stand out
- Pulse animation draws attention
- Positioned at the top for immediate visibility

### 3. **Consistent Design**
- All modal types (multiple-choice, open-answer, continue/pass) support turn indicators
- Unified approach across the game

### 4. **Backward Compatible**
- Turn indicator parameter is optional
- If not provided, the element is hidden
- No breaking changes to existing code

---

## Technical Details

### Display Order in Modal
1. **Turn Indicator** (if provided) - "blackrabbit must answer!"
2. **Question Image** (if provided)
3. **Question Text**
4. **Options/Buttons**
5. **Answer Section** (after selection)

### CSS Animation
The turn indicator includes a subtle pulse animation:
- Scales from 1.0 to 1.02 and back
- Shadow intensity increases during pulse
- 2-second cycle, infinite loop
- Smooth easing for natural feel

### Parameter Order
All modal functions follow this pattern:
1. Content parameters (question, options, etc.)
2. Callback functions
3. Optional image path
4. Optional turn indicator

---

## Testing

To test the changes:

1. **Start a game** of RunRunRabbit
2. **Play through PSS** until someone loses
3. **Click "Show Question"** to display a question
4. **Observe the modal** - the turn indicator should appear at the top with a purple gradient background
5. **Verify answerDiv** - it should be empty (no turn indicator text)

### Test Cases
- ✅ Multiple-choice questions show turn indicator
- ✅ Open-answer questions show turn indicator
- ✅ Turn indicator displays correct player name
- ✅ Turn indicator uses custom names from namesMap
- ✅ Pulse animation works smoothly
- ✅ answerDiv is empty during questions
- ✅ Modal closes properly after answer

---

## Files Modified

1. **`/Games/shared-modal.js`**
   - Added turn indicator HTML element
   - Added turn indicator CSS styling
   - Updated `showOptionsModal()` function
   - Updated `showOpenAnswerModal()` function
   - Updated `showContinuePassModal()` function

2. **`/Games/RunRunRabbit/game.js`**
   - Updated multiple-choice modal call (line ~2658)
   - Updated open-answer modal implementation (line ~2755)
   - Cleared answerDiv text in two locations (lines 2465, 2515)

---

## Future Enhancements

Possible improvements for the future:

1. **Color Coding**
   - Use different colors for different players
   - Match the player's rabbit color

2. **Player Avatar**
   - Show a small rabbit icon next to the name
   - Visual representation of the player

3. **Timer Display**
   - Show countdown timer in the turn indicator
   - Add urgency for timed questions

4. **Team Indicators**
   - Show team affiliation if playing in teams
   - Display team score alongside turn indicator

---

## Summary

✅ **Turn indicator successfully moved to modal**
- Displays prominently at the top of the question modal
- Features attractive purple gradient and pulse animation
- answerDiv is now clear during questions
- Backward compatible with optional parameter
- Works for all question types (multiple-choice and open-answer)

The change improves user experience by keeping all question-related information within the modal, making it easier for players to focus on the current question without looking elsewhere on the screen.