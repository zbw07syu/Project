# Homepage User Guide

## Welcome to Your New Homepage! 🎮

Your `index.html` has been transformed into a retro arcade-style homepage that welcomes users before they access the Question Editor.

## What You'll See

### 1. **Homepage (Landing Screen)**
When you first open `index.html`, you'll see:
- **Wingit Logo** at the top (with a gentle floating animation)
- **Two Large Buttons** in the center:
  - 🎯 **Open Question Editor** - Takes you to the question list manager
  - ℹ️ **About** - Shows a dedication message
- **Game Screenshots** at the bottom - A grid showing your three game screenshots

### 2. **Question Editor**
Click "Open Question Editor" to access:
- All your existing question list management features
- Search, create, edit, delete, and play question lists
- Export/Import functionality
- Audio controls (volume and mute)
- **🏠 Home button** in the header to return to the homepage

### 3. **About Modal**
Click "About" to see:
- A modal window with the message: "Dedicated to friends and ex-colleagues on the frontlines."
- Click "Close" or click outside the modal to dismiss it

## Features

### 🎵 Background Music
- **Billie Jean Chiptune** plays in the background
- Music starts **after your first click** (either button)
- Music **continues playing** when you switch between homepage and editor
- Control volume and mute from the editor's header

### 🎨 Visual Style
- **Bangers font** throughout for that retro arcade feel
- **Vibrant orange buttons** with 3D shadow effects
- **Hover animations** on all buttons (they lift up when you hover)
- **Screenshot zoom effect** when you hover over game images
- **Responsive design** - works great on mobile devices too

### 🎯 Navigation Flow
```
Homepage
  ├─→ Click "Open Question Editor" → Editor View
  │                                      └─→ Click "🏠 Home" → Back to Homepage
  │
  └─→ Click "About" → About Modal
                       └─→ Click "Close" or outside → Back to Homepage
```

## Keyboard & Mouse Interactions

- **Click buttons** - Smooth hover and press animations
- **Click outside modal** - Closes the About modal
- **Hover over screenshots** - Zoom effect with glowing border
- **All existing editor shortcuts** still work when in editor view

## Technical Details

### Files Modified
- `index.html` - Added homepage structure and reorganized editor
- `styles.css` - Added homepage styles and animations
- `app.js` - Added navigation logic and audio control

### Assets Used
- `Wingit! Logo.png` - Your project logo
- `screenshot1.png`, `screenshot2.png`, `screenshot3.png` - Game screenshots
- `Editor/billiejeanchiptune.mp3` - Background music

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Audio starts on user interaction (complies with browser autoplay policies)
- Responsive design adapts to mobile screens

## Customization Tips

### Want to change button colors?
Edit `styles.css` and modify these variables:
```css
--homepage-btn: #ff6b35;        /* Button color */
--homepage-btn-hover: #ff8555;  /* Hover color */
```

### Want to add more screenshots?
1. Add your image to the project root
2. Edit `index.html` and add another `<img>` tag in the `.homepage-screenshots` div:
```html
<img src="./screenshot4.png" alt="Game Screenshot 4" class="screenshot" />
```

### Want to change the dedication message?
Edit `index.html` and find the `.about-message` paragraph:
```html
<p class="about-message">Your new message here</p>
```

### Want to change the logo?
Replace `Wingit! Logo.png` with your own image, or update the `src` attribute in `index.html`:
```html
<img src="./your-logo.png" alt="Your Logo" class="homepage-logo" />
```

## Troubleshooting

### Music not playing?
- Make sure you click a button first (browsers require user interaction)
- Check that `Editor/billiejeanchiptune.mp3` exists
- Check browser console for errors

### Images not showing?
- Verify all image files are in the project root
- Check file names match exactly (case-sensitive)
- Open browser console to see any 404 errors

### Buttons not working?
- Check browser console for JavaScript errors
- Make sure `app.js` is loading correctly
- Try refreshing the page

## Enjoy Your New Homepage! 🎉

Your Question Editor is now wrapped in a beautiful, retro arcade-style homepage that makes a great first impression. The music, animations, and vibrant colors create an engaging experience while keeping all your existing functionality intact.