# 📦 Transfer Your Question Lists to GitHub Pages

## The Problem
Your question lists are saved in **localStorage**, which is domain-specific:
- **Local file** (`file:///...`): Has its own localStorage
- **GitHub Pages** (`https://username.github.io/...`): Has separate localStorage

They cannot share data automatically - you need to manually transfer it.

---

## ✅ Solution: Export & Import

### **Step 1: Export Your Local Data**

1. Open the debug tool **locally**:
   ```
   file:///Users/apple/Desktop/Project/debug-storage.html
   ```
   Or just double-click `debug-storage.html` in Finder

2. Click **"💾 Export to File"**
   - This downloads a JSON file like `questionlists-backup-1234567890.json`
   - Keep this file safe!

### **Step 2: Import to GitHub Pages**

1. Wait 2-3 minutes for GitHub Pages to rebuild (after your latest push)

2. Open the debug tool **on GitHub Pages**:
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/debug-storage.html
   ```

3. Open the downloaded JSON file in a text editor and **copy all the content**

4. **Paste** the JSON into the "Import Data" text area on the GitHub Pages debug tool

5. Click **"📥 Import Data"**

6. Go back to your main app:
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
   ```

7. Your question lists should now appear! 🎉

---

## 🐛 If Create Button Still Doesn't Work on GitHub Pages

### **Check 1: Clear Browser Cache**
GitHub Pages might be serving old files:

1. Open your GitHub Pages site
2. Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows) to hard refresh
3. Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### **Check 2: Verify Files Are Updated**

1. Go to your GitHub Pages URL
2. Open DevTools (F12) → Console tab
3. Type this and press Enter:
   ```javascript
   document.querySelector('script[src*="app.js"]').src
   ```
4. It should show `./app.js` NOT `./Editor/app.js`

### **Check 3: Check for JavaScript Errors**

1. Open DevTools (F12) → Console tab
2. Look for any red error messages
3. If you see errors about "Cannot read property of null", the script might be loading before the DOM is ready

### **Check 4: Verify GitHub Pages is Using Root**

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Make sure "Source" is set to deploy from `main` branch, `/ (root)` folder
4. If it says `/docs`, change it to `/ (root)` and save

---

## 🔄 Alternative: Use a Local Server

Instead of opening `index.html` directly, run a local server so the domain matches:

```bash
# Option 1: Python (if installed)
cd /Users/apple/Desktop/Project
python3 -m http.server 8000

# Option 2: Node.js (if installed)
cd /Users/apple/Desktop/Project
npx http-server -p 8000

# Then open: http://localhost:8000
```

This way, both local and GitHub use `http://` protocol, making debugging easier.

---

## 📝 Quick Reference

| Location | URL | localStorage |
|----------|-----|--------------|
| Local File | `file:///Users/apple/...` | Separate |
| Local Server | `http://localhost:8000` | Separate |
| GitHub Pages | `https://username.github.io/...` | Separate |

**Each domain has its own localStorage!** Use the debug tool to transfer data between them.

---

## 🆘 Still Having Issues?

1. Check the browser console for errors (F12 → Console)
2. Verify `app.js` is loading: View page source and check the script tag
3. Try a different browser (Chrome, Firefox, Safari)
4. Make sure GitHub Pages has finished deploying (check Actions tab in GitHub)

---

## 💡 Pro Tip: Backup Regularly

Use the debug tool to export your question lists regularly as a backup!