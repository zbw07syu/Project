# Long Options Modal System

## Overview

This system automatically handles multiple-choice questions with long options by displaying them in a modal when they exceed certain length thresholds. Short options continue to display inline as before.

## Features

- **Automatic Detection**: Automatically detects when options are too long for inline display
- **Smart Display**: Uses modal for long options, inline for short options
- **Consistent Styling**: Matches existing game design with Bangers font and game colors
- **Accessibility**: Keyboard navigation, screen reader support, and responsive design
- **Game Integration**: Works seamlessly with existing game logic and scoring

## Files

### Core Files
- `Games/shared-modal.js` - Main modal system implementation
- `test-long-options.html` - Test page demonstrating all functionality

### Updated Game Files
- `Games/RunRunRabbit/index.html` - Added modal script
- `Games/RunRunRabbit/game.js` - Updated multiple-choice handling
- `Games/Tornado/index.html` - Added modal script  
- `Games/Tornado/game.js` - Updated multiple-choice handling

## Configuration

The modal system can be configured by modifying the `CONFIG` object in `shared-modal.js`:

```javascript
const CONFIG = {
  maxCharactersInline: 50,  // Max characters before triggering modal
  maxWidthInline: 200,      // Max pixel width before triggering modal
  maxWordsInline: 3,        // Max words before triggering modal
  modalZIndex: 10000,       // Z-index for modal overlay
};
```

## Usage

### Basic Integration

1. Include the modal script in your HTML:
```html
<script src="../shared-modal.js"></script>
```

2. Use the smart display function:
```javascript
window.MultipleChoiceModal.displayOptions(
  containerElement,    // Where to put inline buttons
  questionText,        // Question text for modal header
  optionsArray,        // Array of option strings
  callbackFunction,    // Function to call when option selected
  buttonClassName      // CSS class for inline buttons
);
```

### API Reference

#### `MultipleChoiceModal.displayOptions(container, question, options, callback, buttonClass)`
Automatically chooses modal or inline display based on option length.

**Parameters:**
- `container` (HTMLElement) - Container for inline buttons
- `question` (string) - Question text shown in modal header
- `options` (Array) - Array of option strings
- `callback` (Function) - Called with `(selectedOption, index)` when option chosen
- `buttonClass` (string) - CSS class for inline buttons (default: "option-btn")

#### `MultipleChoiceModal.shouldUseModal(options)`
Returns `true` if options should be displayed in modal.

#### `MultipleChoiceModal.showModal(question, options, callback)`
Force display options in modal.

#### `MultipleChoiceModal.showInline(container, options, callback, buttonClass)`
Force display options inline.

#### `MultipleChoiceModal.createModal()`
Initialize the modal system (called automatically).

#### `MultipleChoiceModal.closeModal()`
Programmatically close the modal.

## How It Works

### Trigger Conditions
Options trigger modal display if ANY option meets these criteria:
- More than 50 characters, OR
- Estimated width exceeds 200 pixels, OR  
- More than 3 words

### Modal Features
- **Responsive Design**: Adapts to different screen sizes
- **Keyboard Support**: Arrow keys, Enter, Escape
- **Accessibility**: ARIA labels, focus management
- **Animation**: Smooth slide-in animation
- **Click Outside**: Close by clicking overlay
- **Scrolling**: Handles many options with scrollbar

### Styling
- Uses Bangers font to match games
- Blue gradient theme consistent with game design
- Hover effects and smooth transitions
- Mobile-responsive layout
- High z-index to appear above game elements

## Game Integration Examples

### RunRunRabbit Integration
```javascript
// In showNextStep() function
if (hasOptions) {
  const handleOptionSelect = (selectedOption, index) => {
    // Existing game logic for handling selection
    showAnswer();
  };

  window.MultipleChoiceModal.displayOptions(
    controlsDiv,
    currentQuestion.question,
    currentQuestion.options,
    handleOptionSelect,
    "controlsBtn"
  );
}
```

### Tornado Integration
```javascript
// In revealSquare() function for multiple choice
if (question.type === "multiple") {
  const handleOptionSelect = (selectedOption, index) => {
    checkMultipleAnswer(selectedOption, question);
  };

  window.MultipleChoiceModal.displayOptions(
    controlsDiv,
    question.q,
    question.options,
    handleOptionSelect,
    "option-btn"
  );
}
```

## Testing

Use `test-long-options.html` to test the modal system:

1. **Short Options Test**: Displays options inline (≤3 words, ≤50 chars)
2. **Long Options Test**: Displays options in modal (character length trigger)
3. **Word Count Test**: Modal triggered by 4+ word option
4. **Mixed Length Test**: Modal triggered by one long option
5. **Game Style Test**: Tests with different button classes

Open the test file in a browser and click the test buttons to see the modal system in action.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design works on all screen sizes
- Graceful fallback if modal system fails to load

## Troubleshooting

### Modal Not Appearing
- Check that `shared-modal.js` is loaded before game scripts
- Verify `window.MultipleChoiceModal` exists
- Check browser console for JavaScript errors

### Question Not Displaying in Modal
- Verify the correct question property is being passed (e.g., `question.text` for RunRunRabbit, `question.q` for Tornado)
- Check that the question parameter is not empty or undefined
- Use browser dev tools to inspect the `.mc-modal-question` element

### Game Buttons Not Working After Modal
- Modal includes timing safeguards to prevent interference with game state
- Check that game state variables are properly managed
- Verify button event listeners are correctly attached after modal closes

### Styling Issues
- Modal uses high z-index (10000) to appear above game elements
- Custom CSS may need adjustment for specific games
- Check for CSS conflicts with existing modal classes

### Options Not Triggering Modal
- Verify options array contains strings longer than 50 characters OR more than 3 words
- Check `CONFIG.maxCharactersInline` and `CONFIG.maxWordsInline` settings
- Use `shouldUseModal()` function to test detection

## Future Enhancements

Possible improvements:
- Configurable themes for different games
- Animation customization options
- Support for images in options
- Multi-column layout for many short options
- Integration with other question types

## Support

For issues or questions about the modal system:
1. Check the test file works correctly
2. Verify integration follows the examples above
3. Check browser console for errors
4. Review this documentation for configuration options