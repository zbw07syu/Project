# Testing Instructions for Updated index.html

## ✅ All Paths Have Been Updated Successfully

The following paths in `/Users/apple/Desktop/Project/index.html` have been updated:

1. **CSS:** `./styles.css` → `./Editor/styles.css`
2. **JavaScript:** `./app.js` → `./Editor/app.js`
3. **Audio:** `./billiejeanchiptune.mp3` → `./Editor/billiejeanchiptune.mp3`

## How to Test

### Option 1: Using Python HTTP Server (Recommended)

1. Open Terminal and navigate to the project:
   ```bash
   cd /Users/apple/Desktop/Project
   ```

2. Start a local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser and go to:
   ```
   http://localhost:8000/index.html
   ```

### Option 2: Using the Existing Node Server

If you have the Node.js server configured, you can use that instead.

## What to Test

### 1. Visual Appearance ✨
- [ ] Page loads with colorful, styled interface
- [ ] "Bangers" font is applied to headings
- [ ] Buttons have proper styling (primary, secondary, ghost, danger)
- [ ] Modals appear correctly styled

### 2. Background Music 🎵
- [ ] Audio controls appear in the header (🔈 button and volume slider)
- [ ] Click the audio toggle button to unmute
- [ ] Music should play (Billie Jean chiptune)
- [ ] Volume slider adjusts the music volume
- [ ] Mute button toggles between 🔈 and 🔇

### 3. Question Editor Functionality 📝
- [ ] Click "Create" button
- [ ] Modal appears asking for list details
- [ ] Enter a list name (e.g., "Test Quiz")
- [ ] Select list type (Regular or Icebreak)
- [ ] Enter number of questions
- [ ] Click "Next"
- [ ] Second modal appears for question type breakdown
- [ ] Enter single-answer and multiple-choice counts
- [ ] Click "Create"
- [ ] Editor view opens with question forms
- [ ] Fill in some questions
- [ ] Click "Save"
- [ ] List appears on the home screen

### 4. Game Links 🎮
- [ ] Create or select a question list
- [ ] Click the "Play" button on a list
- [ ] Game selection modal appears with three options:
  - RunRunRabbit
  - Tornado
  - Icebreak
- [ ] Select a game and click "Play"
- [ ] Game opens in a new tab/window
- [ ] Questions are loaded into the game

### 5. Preview Functionality 👁️
- [ ] Open a question list in the editor
- [ ] Click "Preview" button
- [ ] Preview view shows questions
- [ ] Navigate through questions using Prev/Next buttons

### 6. Search and Filter 🔍
- [ ] Create multiple question lists
- [ ] Use the search box to filter lists
- [ ] Lists filter in real-time as you type

### 7. Edit and Delete 🗑️
- [ ] Click "Edit" on an existing list
- [ ] Make changes and save
- [ ] Click "Delete" on a list
- [ ] List is removed

## Expected Results

### ✅ Success Indicators
- All styles load correctly (colorful UI, proper fonts)
- Background music plays when unmuted
- All buttons and interactions work smoothly
- Game links open correctly in new tabs
- No console errors related to missing resources
- LocalStorage persists data between page reloads

### ❌ Failure Indicators
- Plain unstyled HTML (CSS not loading)
- Console errors about missing files
- Audio doesn't play
- Game links don't open or show 404 errors
- JavaScript functionality doesn't work

## Troubleshooting

### If CSS doesn't load:
1. Check browser console for errors (F12 → Console tab)
2. Verify the file exists: `/Users/apple/Desktop/Project/Editor/styles.css`
3. Check the path in index.html line 23

### If JavaScript doesn't work:
1. Check browser console for errors
2. Verify the file exists: `/Users/apple/Desktop/Project/Editor/app.js`
3. Check the path in index.html line 196

### If audio doesn't play:
1. Make sure you've clicked the unmute button (browsers block autoplay)
2. Check browser console for audio loading errors
3. Verify the file exists: `/Users/apple/Desktop/Project/Editor/billiejeanchiptune.mp3`
4. Check the path in index.html line 27

### If games don't open:
1. Check that game files exist in `/Users/apple/Desktop/Project/Games/`
2. Verify the paths in `Editor/app.js` (lines 655, 862, 864, 866)
3. The paths should be relative: `../Games/[GameName]/index.html`

## Browser Console Check

Open the browser console (F12) and paste this command to verify all resources:

```javascript
console.log('CSS:', document.querySelector('link[href*="styles.css"]')?.href);
console.log('JS:', document.querySelector('script[src*="app.js"]')?.src);
console.log('Audio:', document.querySelector('#bgAudio')?.src);
```

All three should show valid URLs pointing to the Editor directory.

## Files Verified

All required files exist at their expected locations:
- ✅ `/Users/apple/Desktop/Project/Editor/styles.css`
- ✅ `/Users/apple/Desktop/Project/Editor/app.js`
- ✅ `/Users/apple/Desktop/Project/Editor/billiejeanchiptune.mp3`
- ✅ `/Users/apple/Desktop/Project/Games/RunRunRabbit/index.html`
- ✅ `/Users/apple/Desktop/Project/Games/Tornado/index.html`
- ✅ `/Users/apple/Desktop/Project/Games/Icebreak/index.html`

## Summary

✅ **All paths have been successfully updated**
✅ **No files were moved or renamed**
✅ **Only the index.html file was modified**
✅ **Game links in app.js remain unchanged (they are correct as-is)**

The application should now work correctly when accessed from the root directory!