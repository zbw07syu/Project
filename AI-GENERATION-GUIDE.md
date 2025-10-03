# 🤖 AI Question Generation Guide

## Overview

The **"✨ Generate Questions"** button uses OpenAI's API to automatically create questions based on your list name/theme. This feature requires a local server running on your computer.

---

## ⚠️ Important: GitHub Pages vs Local

### **GitHub Pages (Online)**
- ❌ **AI Generation does NOT work** on GitHub Pages
- Why? GitHub Pages only hosts static files (HTML, CSS, JS)
- The AI server needs to run on your local computer

### **Local (Your Computer)**
- ✅ **AI Generation WORKS** when you open `index.html` locally
- ✅ Server runs on your computer at `http://localhost:3001`
- ✅ Uses your OpenAI API key to generate questions

---

## 🚀 How to Use AI Generation

### **Step 1: Start the Server**

Open Terminal and run:
```bash
cd /Users/apple/Desktop/Project
./start-server.sh
```

You should see:
```
Starting Question Generator Server...
Using local Node.js: /Users/apple/Desktop/Project/node/bin/node
Server starting on http://localhost:3001
Health check: http://localhost:3001/health
Press Ctrl+C to stop the server
Question Generator Server running on port 3001
```

**Keep this Terminal window open!** The server needs to stay running.

---

### **Step 2: Open the App Locally**

1. Open **Finder**
2. Navigate to `/Users/apple/Desktop/Project`
3. **Double-click** `index.html` to open it in your browser
   - Or right-click → Open With → Your preferred browser

**Important:** Open the LOCAL file, not the GitHub Pages URL!

---

### **Step 3: Create a Question List with AI**

1. Click **"Create"** button
2. Enter a **descriptive list name** (e.g., "Space Trivia", "World History", "Math Basics")
3. Choose list type: **Regular** or **Icebreak**
4. Enter the number of questions
5. Click **"Next"**
6. In the editor, click **"✨ Generate Questions"** button
7. Wait 5-15 seconds (depending on number of questions)
8. Questions will automatically fill in! 🎉

---

## 🎯 Tips for Better AI Generation

### **Good List Names:**
- ✅ "Ancient Egypt History"
- ✅ "Basic Algebra"
- ✅ "Solar System Facts"
- ✅ "World Capitals"
- ✅ "Fun Animal Facts"

### **Poor List Names:**
- ❌ "Test 1"
- ❌ "Questions"
- ❌ "Untitled"

**The more specific your list name, the better the AI-generated questions!**

---

## 🛠️ Troubleshooting

### **Error: "Failed to generate questions. Make sure the server is running..."**

**Solution:**
1. Check if the server is running in Terminal
2. If not, run: `./start-server.sh`
3. Make sure you're opening the **local** `index.html`, not GitHub Pages

---

### **Server won't start**

**Check 1: Is Node.js available?**
```bash
ls /Users/apple/Desktop/Project/node/bin/node
```
Should show the file exists.

**Check 2: Is the .env file present?**
```bash
cat /Users/apple/Desktop/Project/server_backup/.env
```
Should show your OpenAI API key.

**Check 3: Are dependencies installed?**
```bash
ls /Users/apple/Desktop/Project/server_backup/node_modules
```
Should show many folders.

If missing, install:
```bash
cd /Users/apple/Desktop/Project/server_backup
npm install
```

---

### **Generation takes too long or fails**

**Possible causes:**
1. **OpenAI API rate limit** - Wait a minute and try again
2. **Invalid API key** - Check your `.env` file
3. **Network issues** - Check your internet connection
4. **Too many questions** - Try generating fewer questions at once (max 50)

---

### **Questions are low quality**

**Solutions:**
1. Use a more **specific list name**
2. Try generating again (AI results vary)
3. Manually edit the generated questions
4. For icebreak lists, make sure you selected "Icebreak" type

---

## 🔐 API Key Security

Your OpenAI API key is stored in:
```
/Users/apple/Desktop/Project/server_backup/.env
```

**Important:**
- ✅ This file is in `.gitignore` (won't be pushed to GitHub)
- ✅ Your key stays on your computer
- ✅ Never share this file publicly
- ⚠️ The key is used only when the server runs locally

---

## 💰 API Costs

- OpenAI charges per API call
- Typical cost: **$0.01 - $0.05** per question list (depending on size)
- Check your usage: https://platform.openai.com/usage
- Set spending limits in your OpenAI account

---

## 🔄 Workflow Recommendation

### **For Creating Question Lists:**

1. **Work locally** with AI generation:
   - Start server: `./start-server.sh`
   - Open local `index.html`
   - Create lists with AI assistance
   - Export your lists: Click **"💾 Export"**

2. **Deploy to GitHub Pages:**
   - Open your GitHub Pages URL
   - Import your lists: Click **"📥 Import"**
   - Now you can play them online!

### **Why this workflow?**
- ✅ Use AI generation locally (where server can run)
- ✅ Play games online (GitHub Pages is always accessible)
- ✅ Keep your API key secure (never exposed online)

---

## 🆘 Still Having Issues?

1. **Check server logs** in the Terminal window
2. **Check browser console** (F12 → Console tab)
3. **Test server health:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"OK","message":"Question Generator Server is running"}`

4. **Restart everything:**
   - Stop server: Press `Ctrl+C` in Terminal
   - Start server: `./start-server.sh`
   - Refresh browser: `Cmd+R`

---

## 📝 Summary

| Feature | Local | GitHub Pages |
|---------|-------|--------------|
| AI Generation | ✅ Works | ❌ Doesn't work |
| Manual Creation | ✅ Works | ✅ Works |
| Play Games | ✅ Works | ✅ Works |
| Export/Import | ✅ Works | ✅ Works |

**Best practice:** Create locally with AI, then export/import to GitHub Pages for online access!