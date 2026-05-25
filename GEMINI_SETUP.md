# Gemini API Troubleshooting Guide

## ✅ Quick Test

### Option 1: Test via HTTP Request
```bash
curl http://localhost:3000/api/gemini-test
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Gemini API is working!",
  "response": "Gemini API is working!",
  "source": "primary"
}
```

### Option 2: Test with Node.js Script
```bash
node gemini-test.js
```

Then type a message (or `exit` to quit):
```
🚀 Gemini API Test
Model: gemini-2.0-flash
API Key: AIzaSyA0...
Type "exit" to quit

You: What is 2+2?
⏳ Generating response...
Gemini: 2+2 equals 4.
```

### Option 3: Test with curl (Custom Prompt)
```bash
curl -X POST http://localhost:3000/api/gemini-test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, Gemini!"}'
```

---

## 🔍 Debugging

### 1. Verify API Keys Are Set

Check `.env.local`:
```bash
cat .env.local | grep GEMINI
```

Should show:
```
GEMINI_API_KEY_PRIMARY=AIzaSyA...
GEMINI_API_KEY_SECONDARY=AIzaSyC...
```

### 2. Test API Key Directly with curl

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello!"}]
    }]
  }'
```

If working, you'll see:
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Hello! ..."}]
    }
  }]
}
```

If **API key is invalid**, you'll see:
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "UNAUTHENTICATED"
  }
}
```

### 3. Check Logs

Start the dev server and watch for Gemini logs:
```bash
npm run dev
```

Look for lines like:
```
[Gemini API] Trying PRIMARY with model: gemini-2.0-flash
[Gemini API] ✅ Primary API call succeeded
```

---

## ❌ Common Issues & Fixes

### Issue 1: "API key not valid"
**Solution:**
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create a new key in Google Cloud Console
4. Copy the key and update `.env.local`:
   ```
   GEMINI_API_KEY_PRIMARY=AIzaSy...
   ```
5. Restart dev server: `npm run dev`

### Issue 2: "Quota exceeded"
**Solution:**
- Free tier has limits (15 requests/minute)
- Wait a minute or upgrade to paid plan
- Add secondary API key as backup

### Issue 3: "Model not found: gemini-2.0-flash"
**Solution:**
- Check available models: https://ai.google.dev/models
- Model name is case-sensitive
- Currently using: `gemini-2.0-flash` (not `gemini-2.5-flash`)

### Issue 4: "Timeout after 10000ms"
**Solution:**
- API is slow or network issue
- Increase timeout in code:
  ```typescript
  await callGeminiAPI(prompt, { timeout: 20000 })
  ```
- Or check internet connection

### Issue 5: Response is empty or fallback message
**Solution:**
- Both primary and secondary API keys failed
- Check console logs for exact error
- Verify keys are correct at https://ai.google.dev/

---

## 🔧 Testing Different Models

Edit `gemini-service.ts` and change model name:

```typescript
export async function callGeminiAPI(
  prompt: string,
  options?: {
    model?: string;  // ← Change this
    // ...
  }
)
```

Available models:
- `gemini-2.0-flash` (fast, low cost)
- `gemini-1.5-flash` (older)
- `gemini-1.5-pro` (more powerful, slower)

---

## 📊 Architecture

```
User Input
    ↓
[callGeminiAPI] lib/gemini-service.ts
    ↓
[Try Primary Key] → Success ✅
    ↓ (if fails)
[Try Secondary Key] → Success ✅
    ↓ (if fails)
[Fallback Template] → Returns generic response
```

---

## 🎯 Implementation in the App

**Where Gemini is used:**
1. `/app/api/audit-summary` — Generates personalized audit summary
2. `/app/api/gemini-test` — Test endpoint

**When a user completes an audit:**
```
User fills form → Click "Run Audit" → Optimization engine calculates
    ↓
POST /api/audit-summary
    ↓
[callGeminiAPI] generates personalized summary
    ↓
Display results with AI summary
```

---

## 💡 Tips

- **Batch requests:** Don't call API for every keystroke
- **Cache responses:** Store generated summaries to avoid re-API calls
- **Monitor costs:** Check Google Cloud Console usage dashboard
- **Set rate limits:** Currently limited to 10 req/min per IP (see rate-limiter.ts)

---

## Need Help?

1. Check console logs: `npm run dev` (look for `[Gemini API]` messages)
2. Run test: `curl http://localhost:3000/api/gemini-test`
3. Verify key works directly: Use curl command above
4. Check documentation: https://ai.google.dev/docs
