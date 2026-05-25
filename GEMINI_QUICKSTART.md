# 🚀 Gemini API - Quick Start Checklist

## Step 1: Verify API Key is Set ✅

Check your `.env.local` file:
```bash
cat .env.local | head -10
```

Should show:
```
GEMINI_API_KEY_PRIMARY=AIzaSyA0kQ2W7jASYqrFPLjfcwe1o4fB4r_4f84
GEMINI_API_KEY_SECONDARY=AIzaSyCsfsVQfvMpYsChn7cV_Z2HMeU78sbMiiQ
```

✅ If you see valid keys → Go to Step 2  
❌ If empty or missing → Get free key at https://ai.google.dev/

---

## Step 2: Start Development Server

```bash
npm run dev
```

Output should show:
```
▲ Next.js 15.1.0
- Local:        http://localhost:3000
```

---

## Step 3: Test Gemini API Connection

Open new terminal and run:

```bash
# Simple test
curl http://localhost:3000/api/gemini-test

# Custom prompt test
curl -X POST http://localhost:3000/api/gemini-test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say hello!"}'
```

**Expected Response:** ✅
```json
{
  "status": "success",
  "message": "Gemini API is working!",
  "source": "primary"
}
```

**Error Response:** ❌
```json
{
  "status": "error",
  "error": "API key not valid. Please pass a valid API key."
}
```

---

## Step 4: Test in App

1. Go to http://localhost:3000
2. Fill out the form:
   - Select tools (e.g., Claude, Cursor)
   - Set monthly spend
   - Click **"Run Custom Stack Audit"**
3. Wait for results
4. See **AI-generated summary** at the top of results

---

## 🔍 Check Logs

Watch the dev server console for:
```
[Gemini API] Trying PRIMARY with model: gemini-2.0-flash
[Gemini API] ✅ Primary API call succeeded
```

---

## Equivalent Code (Python → TypeScript)

**Python (Your Code):**
```python
import google.generativeai as genai

genai.configure(api_key="API_KEY")
model = genai.GenerativeModel('gemini-2.5-flash')
response = model.generate_content(prompt)
print(response.text)
```

**TypeScript (Implemented):**
```typescript
import { callGeminiAPI } from '@/lib/gemini-service';

const response = await callGeminiAPI(prompt, {
  model: 'gemini-2.0-flash',
  maxTokens: 300,
});
console.log(response.text);
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not valid" | Get new key at https://ai.google.dev/ |
| "Quota exceeded" | Wait 1 min or upgrade to paid |
| Empty response | Check both API keys are correct |
| Timeout | Network might be slow, try again |
| 404 on test endpoint | Restart dev server after changes |

---

## Files Modified/Created

- ✅ `lib/gemini-service.ts` — Core Gemini API service
- ✅ `app/api/gemini-test/route.ts` — Test endpoint
- ✅ `app/api/audit-summary/route.ts` — Updated to use new service
- ✅ `gemini-test.js` — Node.js test script
- ✅ `.env.local` — API keys configured
- ✅ `GEMINI_SETUP.md` — Detailed troubleshooting
- ✅ `ENV_SETUP.md` — Environment variables guide

---

## Next Steps

✅ Verified API keys in `.env.local`  
✅ Started dev server: `npm run dev`  
✅ Tested with: `curl http://localhost:3000/api/gemini-test`  
✅ Tried audit in browser  

**Working?** 🎉 Celebrate!

**Not working?** 📖 Read `GEMINI_SETUP.md` for detailed troubleshooting
