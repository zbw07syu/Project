# 🚀 Quick Transfer Guide

## Transfer Your Question Lists from Local to GitHub Pages

### ✅ Step 1: Export from Local

1. **Open your app locally** (the file you just opened in your browser)
2. Look at the **top-right corner** of the page
3. Click the **"💾 Export"** button
4. A JSON file will download (e.g., `question-lists-2025-01-15.json`)

### ✅ Step 2: Import to GitHub Pages

1. **Open your GitHub Pages site** in your browser:
   - Go to: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`
   
2. Click the **"📥 Import"** button in the top-right corner

3. **Select the JSON file** you just downloaded

4. You'll see a success message showing how many lists were imported

5. **Refresh the page** - your question lists should now appear! 🎉

---

## 🔄 Keeping Data in Sync

### Important Notes:
- **LocalStorage is domain-specific**: Data saved locally stays local, data on GitHub Pages stays there
- **Use Export/Import** whenever you want to transfer or backup your lists
- **Regular backups**: Click "💾 Export" regularly to save your work

### Tips:
- Export creates a timestamped file so you can keep multiple backups
- Import will merge with existing lists (won't delete anything)
- If a list with the same ID exists, it will be updated with the imported version

---

## 🆘 Troubleshooting

### "No question lists to export"
- You haven't created any lists yet in this environment
- Create a test list first, then try exporting

### Import button doesn't respond
- Make sure you're selecting a valid JSON file
- Check browser console (F12) for error messages
- Try a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Lists still don't appear after import
- Hard refresh the page (Cmd+Shift+R)
- Check if the import success message appeared
- Open browser console and type: `localStorage.getItem('questionLists')`
  - If you see data, the import worked
  - If you see `null`, try importing again

---

## 📝 What Gets Exported?

The export includes:
- ✅ All question list names
- ✅ All questions and answers
- ✅ Question types (single-answer, multiple-choice, icebreak)
- ✅ All alternate answers
- ✅ List IDs (for proper merging on import)

---

**Need more help?** Check the browser console (F12) for detailed error messages.