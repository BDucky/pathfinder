# 🔍 API Error Diagnosis

## Current Situation

**Error Message:** `AI model not available. Please try again later.`
**Status Code:** 500 Internal Server Error

## Root Cause Analysis

The error message you're seeing does **NOT** match any error message in your current codebase. This means either:

1. **Vercel is running an old deployment** (hasn't picked up the latest code yet)
2. **There's an error from the Gemini SDK itself** (not our code)
3. **Build cache issue on Vercel**

## ✅ Step-by-Step Fix

### Step 1: Check if Vercel Deployed Your Latest Code

1. Go to https://vercel.com/dashboard
2. Click on your **pathfinder** project
3. Click **Deployments** tab
4. Check if the latest deployment shows:
   - **Commit**: "Fix 500 error by adding request body parsing" or newer
   - **Status**: ✅ Ready
   - **Time**: Recent (within last 5-10 minutes)

If NOT:
- Click **Redeploy** on the latest deployment
- Wait 1-2 minutes for deployment to complete

---

### Step 2: Verify API Keys are Configured on Vercel

Your API keys must be set in **Vercel Environment Variables**, not just locally.

#### Check API Keys:
1. Go to https://vercel.com/dashboard
2. Select **pathfinder** project
3. Click **Settings** → **Environment Variables**

#### Required Variables:
- `GEMINI_API_KEY` → Get from https://makersuite.google.com/app/apikey
- `YOUTUBE_API_KEY` → Get from https://console.cloud.google.com/apis/credentials
- *(Optional)* `GROQ_API_KEY` → Get from https://console.groq.com/keys

#### Important:
- ✅ Check boxes for: **Production**, **Preview**, **Development**
- After adding variables, you **MUST redeploy** for them to take effect

---

### Step 3: Test Using Browser Console

Since PowerShell has issues, use your browser:

1. Open your app in browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Paste and run this:

```javascript
// Test 1: Check if API keys are configured
fetch('https://pathfinder-eight-rosy.vercel.app/api/providers')
  .then(r => r.json())
  .then(data => {
    console.log('✅ API Keys Status:', data);
    if (!data.data.providers.gemini) {
      console.error('⚠️ GEMINI API KEY IS MISSING!');
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "providers": {
      "gemini": true,  // ← This MUST be true!
      "groq": false,
      "youtube": true
    }
  }
}
```

If `gemini: false`, your API key is NOT configured on Vercel!

---

### Step 4: Test Generate Path Endpoint

In browser console:

```javascript
// Test 2: Try to generate a path
fetch('https://pathfinder-eight-rosy.vercel.app/api/generate-path', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: "Python",
    level: "beginner",
    duration: 2,
    hoursPerWeek: 10
  })
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  if (!data.success) {
    console.error('❌ Error Message:', data.error);
  } else {
    console.log('✅ SUCCESS! Path generated:', data.data.title);
  }
})
.catch(err => console.error('❌ Network Error:', err));
```

**Look at the error message** - it will tell you the actual problem:
- `"Server configuration error: Missing API key"` → Add API key to Vercel
- `"Your Gemini API key is not valid"` → API key is wrong
- `"Permission Denied by Google AI"` → Enable APIs in Google Cloud
- `"AI service quota exceeded"` → Free tier limit reached

---

### Step 5: Check Vercel Function Logs

This shows the **actual error** happening on the server:

1. Go to https://vercel.com/dashboard
2. Click **pathfinder** project
3. Click **Deployments** → Select latest deployment
4. Scroll down to **Function Logs** section
5. Try making a request from your app
6. Watch the logs appear in real-time

**Look for:**
- `"Environment variable validation failed"` → Missing API key
- `"Gemini API error"` → Problem with Google's service
- `"Model [name] failed"` → Model not available

---

## Common Error Messages & Solutions

### Error: "Server configuration error: Missing API key"
**Cause:** `GEMINI_API_KEY` not set on Vercel  
**Fix:** Add environment variable, then redeploy

### Error: "Your Gemini API key is not valid"
**Cause:** Invalid or expired API key  
**Fix:** Generate new key at https://makersuite.google.com/app/apikey

### Error: "Permission Denied by Google AI"
**Cause:** Vertex AI API not enabled  
**Fix:** 
1. Go to https://console.cloud.google.com/
2. Enable "Generative Language API" or "Vertex AI API"
3. Make sure API key has correct permissions

### Error: "AI service quota exceeded"
**Cause:** Hit free tier limit (15 requests/minute or daily limit)  
**Fix:** 
- Wait for quota to reset
- Upgrade to paid tier
- Use a different API key

### Error: "No compatible AI model available"
**Cause:** None of the Gemini models are accessible  
**Fix:** Check Google Cloud Console for model availability in your region

---

## How to Get API Keys

### Gemini API Key (Required):
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)
5. Paste it in Vercel Environment Variables as `GEMINI_API_KEY`

### YouTube API Key (Optional):
1. Visit https://console.cloud.google.com/
2. Create new project or select existing
3. Enable **"YouTube Data API v3"**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy and add to Vercel as `YOUTUBE_API_KEY`

---

## Quick Checklist

- [ ] Latest code is deployed on Vercel (check Deployments tab)
- [ ] `GEMINI_API_KEY` is added to Vercel Environment Variables
- [ ] All environments checked: Production, Preview, Development
- [ ] Redeployed after adding environment variables
- [ ] Tested `/api/providers` endpoint - shows `gemini: true`
- [ ] Checked Vercel Function Logs for actual error message

---

## Still Not Working?

If you've done all the above and it's still failing:

1. **Share the Vercel Function Logs** - They contain the real error
2. **Check the error message from browser console** (Step 4 above)
3. **Try generating a new Gemini API key** - Old one might be invalid

The key is to see the **actual error message** from the backend, not just "500 Internal Server Error".
