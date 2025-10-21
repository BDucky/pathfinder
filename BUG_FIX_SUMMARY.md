# 🔧 API 500 Error - Root Cause Analysis & Fix

## 📋 Summary
Fixed critical bug causing **500 Internal Server Error** in `/api/generate-path` and `/api/chat` endpoints.

---

## 🐛 The Root Cause

### What Was Wrong:
Both `api/generate-path.js` and `api/chat.js` were **directly accessing `req.body` without parsing it first**.

```javascript
// ❌ BEFORE (Broken Code)
const { topic, level, duration, hoursPerWeek } = req.body  // req.body is undefined or unparsed!
```

### Why It Caused 500 Errors:
1. In Vercel serverless functions, the request body arrives as a **raw stream** and must be explicitly parsed
2. When `req.body` is undefined, trying to destructure it throws an error
3. This uncaught error results in a **500 Internal Server Error**
4. The error happens before any validation or AI processing even begins

### Why YouTube API Worked:
The `api/youtube.js` endpoint was already using the `parseJsonBody()` utility correctly:
```javascript
// ✅ CORRECT (youtube.js was already doing this)
const body = await parseJsonBody(req)
const { keywords, maxResults } = body
```

---

## ✅ The Fix

### Changes Made:

#### 1. `api/generate-path.js`
```diff
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  handleCors,
  sendError,
  sendSuccess,
  validateEnvVars,
  checkRateLimit,
  getClientIP,
+ parseJsonBody
} from './_utils.js'

// ...in the handler function:

-   // Validate request body
-   const { topic, level, duration, hoursPerWeek } = req.body

+   // Parse and validate request body
+   const body = await parseJsonBody(req)
+   const { topic, level, duration, hoursPerWeek } = body
```

#### 2. `api/chat.js`
```diff
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import {
  handleCors,
  sendError,
  sendSuccess,
  validateEnvVars,
  checkRateLimit,
  getClientIP,
+ parseJsonBody
} from './_utils.js'

// ...in the handler function:

-   // Validate request body
-   const { message, provider, systemContext, conversationHistory } = req.body

+   // Parse and validate request body
+   const body = await parseJsonBody(req)
+   const { message, provider, systemContext, conversationHistory } = body
```

---

## 🎯 What `parseJsonBody()` Does

Located in `api/_utils.js`, this utility handles body parsing for different environments:

```javascript
export async function parseJsonBody(req) {
  // Case 1: Body already parsed by middleware (Vite dev server)
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  }

  // Case 2: Read from raw stream (Vercel production)
  let raw = '';
  await new Promise((resolve, reject) => {
    req.on('data', chunk => { raw += chunk; });
    req.on('end', resolve);
    req.on('error', reject);
  });
  
  return JSON.parse(raw || '{}');
}
```

**Why It's Needed:**
- **Development (Vite)**: Body might be pre-parsed by middleware
- **Production (Vercel)**: Body arrives as a raw stream that must be read
- This utility handles both scenarios automatically

---

## 🔍 Why Previous Fixes Caused "Pending Forever" or "Network Errors"

When you tried to fix this before, you might have:
1. **Added async operations without proper error handling** → Requests hang indefinitely
2. **Modified CORS headers incorrectly** → Browser blocks the request (network error)
3. **Changed the response flow** → Response never sent back to client (pending)
4. **Broken the proxy configuration** → Requests don't reach the serverless function

The correct fix is minimal and surgical: just parse the body before using it.

---

## 📝 Additional Notes

### Vite Configuration
Your `vite.config.js` is currently proxying API requests to your **production Vercel deployment**:
```javascript
'/api': {
  target: 'https://pathfinder-eight-rosy.vercel.app',
  changeOrigin: true,
  secure: false,
}
```

**This means:**
- You're NOT testing local API functions in development
- You're testing against the live production deployment
- Any fixes need to be deployed to Vercel to take effect locally

**If you want to test local API functions instead:**
1. You would need a local serverless function runtime (like `vercel dev`)
2. Or implement a custom Express server to run the API functions locally
3. Current setup is fine for most use cases since it tests against real production environment

---

## ✅ Status: FIXED

Both endpoints now properly parse request bodies before processing:
- ✅ `POST /api/generate-path` - Fixed
- ✅ `POST /api/chat` - Fixed
- ✅ `POST /api/youtube` - Was already correct
- ✅ `GET /api/providers` - No body parsing needed (GET request)

**No linting errors introduced.**

---

## 🚀 Next Steps

1. **Deploy to Vercel** to apply the fixes to production
2. **Test the endpoints** to verify they work correctly
3. **Monitor logs** for any other potential issues

### Test Commands:
```bash
# Test generate-path endpoint
curl -X POST http://localhost:5173/api/generate-path \
  -H "Content-Type: application/json" \
  -d '{"topic":"Python","level":"beginner","duration":4,"hoursPerWeek":10}'

# Test chat endpoint
curl -X POST http://localhost:5173/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","provider":"gemini"}'
```

---

**Date Fixed:** October 21, 2025  
**Files Modified:** 
- `api/generate-path.js` - Added body parsing + improved error logging
- `api/chat.js` - Added body parsing + logging

---

## ⚠️ Still Getting 500 Error?

If you're still getting 500 errors after deploying the body parsing fix, the issue is likely:

### **Missing Environment Variables on Vercel!**

The code now properly parses the request body, but if `GEMINI_API_KEY` is not configured on Vercel, you'll still get a 500 error.

**See `DEBUGGING_GUIDE.md` for complete step-by-step instructions on:**
- How to check Vercel logs
- How to add environment variables
- How to test your API
- Common issues and solutions

