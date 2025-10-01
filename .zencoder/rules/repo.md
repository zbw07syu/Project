# Repository Overview

- **Project Root**: /Users/apple/Desktop/Project
- **Primary Areas**:
  - **Homepage**: Landing experience that highlights games and manages entry into the Editor
  - **Editor**: Lightweight SPA to create and manage question lists
  - **Games**: Individual HTML/JS implementations (e.g., Icebreak, RunRunRabbit, Tornado) consuming exported question data

## Editor App
- **Path**: /Users/apple/Desktop/Project/Editor
- **Entry HTML**: index.html
- **Styles**: styles.css
- **Logic**: app.js (vanilla JS)
- **Storage**: localStorage key `questionLists`

### Data Model
Saved under `questionLists` in localStorage as an array of lists:
- **List**: `{ id, name, questions }`
- **Question (single)**: `{ id, type: 'single', text, answer }`
- **Question (multi)**: `{ id, type: 'multi', text, options: string[], correct: number[] }`

### Views
- **Home**: Lists, search, edit/play/delete actions
- **Editor**: Build and edit questions in a list
- **Play**: Preview/play through questions

### Notable Behavior
- **Editor**:
  - Single-answer: question text + answer input; delete button present
  - Multiple-choice: 2–4 options; add/remove options; mark correct indices
- **Play**:
  - Single: has a "Reveal Answer" button that toggles visibility
  - Multi: shows options; correctness check is visual/implicit

### Recent Change Log (Manual)
- 2025-09-25: Removed "Reveal Answer" button from Editor single-answer cards in `app.js` (kept in Play view)

## Conventions
- **Code Style**: Vanilla JS; prefer clear names and comments; keep DOM operations localized in render functions
- **IDs**: Generated via `uid()` utility
- **Persistence**: Save via `saveToStorage(state.lists)`; load via `loadFromStorage()`

## Development
- Open `Editor/index.html` in a browser or serve via a simple file server
- No build tooling required

## Testing Tips
- Create a new list, add single and multi questions
- Save, refresh page to confirm persistence
- Use Play view to verify behaviors

## Future Ideas
- Export/import lists (JSON)
- Validation for empty texts/answers
- Keyboard accessibility improvements
