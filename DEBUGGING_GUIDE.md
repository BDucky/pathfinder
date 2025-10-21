# 🔍 Debugging Guide: 500 Error Still Occurring

## Current Situation
- ✅ Request body is being parsed correctly (confirmed in your screenshot)
- ❌ Still getting 500 error after deployment
- 🎯 **Most likely cause**: Missing `GEMINI_API_KEY` environment variable on Vercel

---

## Step 1: Check Vercel Logs 🔎

The best way to see what's actually failing is to check the Vercel logs:

### Method 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your **pathfinder** project
3. Click on **Deployments** tab
4. Click on the most recent deployment
5. Scroll down to **Function Logs** section
6. Look for error messages (they'll show the actual error)

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# View real-time logs
vercel logs --follow
```

**What to look for:**
- "Missing required environment variables: GEMINI_API_KEY"
- API errors from Google
- JSON parsing errors

---

## Step 2: Add Environment Variables on Vercel 🔑

### Go to Vercel Settings:
1. Open https://vercel.com/dashboard
2. Select your **pathfinder** project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Add These Variables:

#### Required:
| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `GEMINI_API_KEY` | Your API key | https://makersuite.google.com/app/apikey |
| `YOUTUBE_API_KEY` | Your API key | https://console.cloud.google.com/apis/credentials |

#### Optional:
| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `GROQ_API_KEY` | Your API key | https://console.groq.com/keys |

### Important Settings:
- ✅ Check **Production**
- ✅ Check **Preview**
- ✅ Check **Development**

This ensures the variables are available in all environments.

---

## Step 3: Redeploy After Adding Variables ♻️

**Environment variables only take effect after a new deployment!**

### Option A: Trigger Redeploy from Dashboard
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Option B: Push a New Commit
```bash
git add .
git commit -m "Add better error logging"
git push origin main
```

---

## Step 4: Test Your API 🧪

### Test 1: Check Providers Endpoint
This will tell you if API keys are configured:

**In PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://pathfinder-eight-rosy.vercel.app/api/providers"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "providers": {
      "gemini": true,
      "groq": false,
      "youtube": true
    }
  }
}
```

If `gemini` is `false`, your API key is not configured!

---

### Test 2: Generate Learning Path

**In PowerShell:**
```powershell
$body = @{
    topic = "Backend Developer"
    level = "beginner"
    duration = 4
    hoursPerWeek = 10
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://pathfinder-eight-rosy.vercel.app/api/generate-path" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Display response
$response | ConvertTo-Json -Depth 10
```

**In Git Bash (or WSL):**
```bash
curl -X POST https://pathfinder-eight-rosy.vercel.app/api/generate-path \
  -H "Content-Type: application/json" \
  -d '{"topic":"Backend Developer","level":"beginner","duration":4,"hoursPerWeek":10}'
```

---

## Step 5: Understanding the Error Messages 💬

With the improved logging I just added, you'll now see clearer error messages:

### If API Key is Missing:
```json
{
  "success": false,
  "error": "Server configuration error: Missing API key. Please contact administrator."
}
```
**Fix**: Add `GEMINI_API_KEY` to Vercel environment variables

### If Gemini API Has Issues:
```json
{
  "success": false,
  "error": "AI service configuration error"
}
```
**Possible causes:**
- Invalid API key
- API key doesn't have permissions
- Gemini API not enabled on your Google Cloud project

### If Rate Limited:
```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```
**Fix**: Wait 1 minute and try again

---

## Alternative Testing Tools 🛠️

If curl/PowerShell is difficult, use these GUI tools:

### Option 1: Postman
1. Download: https://www.postman.com/downloads/
2. Create new **POST** request
3. URL: `https://pathfinder-eight-rosy.vercel.app/api/generate-path`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
   ```json
   {
     "topic": "Backend Developer",
     "level": "beginner",
     "duration": 4,
     "hoursPerWeek": 10
   }
   ```
6. Click **Send**

### Option 2: Thunder Client (VS Code Extension)
1. Install **Thunder Client** extension in VS Code
2. Click Thunder Client icon in sidebar
3. New Request → POST
4. Same settings as Postman above

### Option 3: Browser DevTools
1. Open your app in browser
2. F12 → Console tab
3. Paste this:
   ```javascript
   fetch('https://pathfinder-eight-rosy.vercel.app/api/generate-path', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       topic: "Backend Developer",
       level: "beginner",
       duration: 4,
       hoursPerWeek: 10
     })
   })
   .then(r => r.json())
   .then(data => console.log(data))
   .catch(err => console.error(err))
   ```

---

## Quick Checklist ✅

- [ ] Check Vercel logs for actual error message
- [ ] Add `GEMINI_API_KEY` to Vercel environment variables
- [ ] Add `YOUTUBE_API_KEY` to Vercel environment variables
- [ ] Select all environments (Production, Preview, Development)
- [ ] Redeploy after adding variables
- [ ] Test `/api/providers` endpoint to verify keys are loaded
- [ ] Test `/api/generate-path` endpoint
- [ ] Check Vercel logs again if still failing

---

## Common Issues and Solutions 🔧

### Issue: "API key not valid. Please pass a valid API key."
**Solution:** 
- Your Gemini API key is invalid
- Get a new one from https://makersuite.google.com/app/apikey
- Make sure to enable "Generative Language API" in Google Cloud Console

### Issue: Response takes too long / times out
**Solution:**
- Gemini API might be slow
- Check your internet connection
- Try a shorter duration (e.g., 2 weeks instead of 4)

### Issue: "quota exceeded"
**Solution:**
- You've hit Gemini's free tier limit
- Wait for quota to reset (usually daily)
- Or upgrade to paid tier

---

## Getting Your API Keys 🔑

### Gemini API Key:
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### YouTube API Key:
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "YouTube Data API v3"
4. Go to Credentials → Create Credentials → API Key
5. Copy the key

### Groq API Key (Optional):
1. Go to https://console.groq.com/
2. Sign up / Sign in
3. Go to API Keys section
4. Create new key
5. Copy the key

---

## Contact Info

If you're still having issues after following all these steps, the Vercel logs will contain the exact error message. Share that error message and we can debug further!

