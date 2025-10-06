# Question Images

This folder contains images (including GIFs) that can be used with questions in the games.

## Usage

To add an image to a question, include the `image` field in your question JSON:

```json
{
  "type": "single",
  "text": "What animal is this?",
  "answer": "Cat",
  "image": "question-images/cat.jpg"
}
```

or for multiple choice:

```json
{
  "type": "multi",
  "text": "What color is this?",
  "options": ["Red", "Blue", "Green", "Yellow"],
  "correct": [2],
  "image": "question-images/green-object.gif"
}
```

## Supported Formats

- **Static images**: JPG, PNG, WebP, SVG
- **Animated images**: GIF, APNG

## Path Format

Always use relative paths from the game root:
- `question-images/your-image.jpg`
- `question-images/subfolder/your-image.gif`

## Image Guidelines

- **Recommended max size**: 500KB per image
- **Recommended dimensions**: 800x600px or smaller
- **Aspect ratio**: Any (images will scale to fit)
- Images display at max 300px height on desktop, 200px on mobile