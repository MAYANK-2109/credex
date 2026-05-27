# Environment Variables Setup Guide

This project uses environment variables to store sensitive credentials and configuration. **Never commit secrets to Git.**

## Quick Start

1. Copy the template file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your API keys and configuration values in `.env.local`

3. Restart your development server for changes to take effect

## Required Variables

### LLM API Keys (Choose at least one)

**Google Gemini API (Recommended)**
- `GEMINI_API_KEY_PRIMARY` — Primary Gemini API key for generating audit summaries
  - Get free key: https://ai.google.dev/
  - Includes 15 requests per minute in free tier
  
- `GEMINI_API_KEY_SECONDARY` — Fallback Gemini key for redundancy
  - Optional but recommended for production reliability

**Anthropic Claude API (Alternative)**
- `ANTHROPIC_API_KEY` — Claude API key for generating audit summaries
  - Get key: https://console.anthropic.com/
  - Apply for free credits: https://www.anthropic.com/research/fellows

**Why two LLM providers?**
- Provides redundancy if one API is down
- Allows gradual migration between providers
- The system tries Gemini Primary → Gemini Secondary → Fallback text

### Site Configuration

- `NEXT_PUBLIC_SITE_URL` — Base URL for the application
  - **Local development:** `http://localhost:3000`
  - **Production:** Your deployed domain (e.g., `https://audit.example.com`)
  - Used for share links and Open Graph previews
  - Prefix `NEXT_PUBLIC_` means it's exposed to the browser (not secret)

## Optional Variables

### Backend Storage (Choose one for production)

**Firebase Realtime Database**
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```
- Setup: https://console.firebase.google.com/
- Free tier includes 100 write operations/day
- Currently using local JSON files; switch here for scalability

**Supabase (PostgreSQL + Auth)**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
- Setup: https://supabase.com/
- Free tier includes 500MB database + 2GB bandwidth

**Cloudflare D1 (SQLite)**
```
CLOUDFLARE_D1_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_cloudflare_token
```
- Setup: https://www.cloudflare.com/
- Pairs well with Cloudflare Pages deployment

### Email Service (For transactional confirmations)

**Resend (Recommended for Next.js)**
```
RESEND_API_KEY=your_resend_api_key
```
- Setup: https://resend.com/
- Free tier: 100 emails/day
- Best integration with Next.js

**Postmark**
```
POSTMARK_API_KEY=your_postmark_api_key
```
- Setup: https://postmarkapp.com/
- Free tier: 100 emails/month

**AWS SES**
```
AWS_SES_ACCESS_KEY_ID=your_access_key
AWS_SES_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@example.com
```
- Setup: https://aws.amazon.com/ses/
- Requires account verification

### Security & Abuse Protection

**hCaptcha (Form Protection)**
```
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key
```
- Setup: https://www.hcaptcha.com/
- Free tier: 100k captchas/month
- Better privacy than reCAPTCHA

## Development Workflow

### .env Files Priority (Next.js)

Next.js loads environment variables in this order:
1. `.env.local` (local development, not committed)
2. `.env.development` (development only)
3. `.env` (all environments, committed but should be empty/template)
4. `.env.production` (production only)

### For Local Development

Use `.env.local`:
```bash
cp .env.example .env.local
# Edit .env.local with your development keys
```

### For Production Deployment

**Vercel:**
1. Go to your Vercel project settings → Environment Variables
2. Add each key individually
3. Select which environments (Production/Preview/Development)

**Other Platforms:**
- Netlify: Site settings → Build & deploy → Environment
- Render: Environment → Environment Variables
- Railway: Variables

## Security Best Practices

✅ **Do:**
- Keep `.env.local` in `.gitignore` (already configured)
- Use unique keys for each environment
- Rotate keys regularly
- Use separate keys for development vs production
- Commit `.env.example` (template only) to document required vars

❌ **Don't:**
- Commit `.env` or `.env.local` to Git
- Hardcode secrets anywhere in source code
- Use the same key across environments
- Share API keys in chat or emails
- Use `NEXT_PUBLIC_` for sensitive data

## Debugging Environment Variables

### Check which variables are loaded:
```bash
node -e "console.log(process.env.GEMINI_API_KEY_PRIMARY ? 'Set' : 'Not set')"
```

### Print all env vars (be careful - never commit this):
```bash
node -e "console.log(JSON.stringify(process.env, null, 2))"
```

### Verify API keys work:
- Gemini: https://ai.google.dev/tutorials/setup
- Anthropic: https://docs.anthropic.com/en/docs/quickstart

## Troubleshooting

**"GEMINI_API_KEY_PRIMARY is undefined"**
- Make sure `.env.local` exists and has the key
- Restart your dev server (npm run dev)
- Check that the key is on a new line without quotes

**"Audit summary not generating"**
- Check that at least one LLM API key is set
- Verify the API key is valid by testing it directly
- Check console logs: `npm run dev` will show API errors
- If all LLM APIs fail, the system falls back to templated summary

**"Share links not working in production"**
- Verify `NEXT_PUBLIC_SITE_URL` is set to your deployed domain
- Open Graph previews use this URL
- Ensure domain is accessible from the internet

**"Leads not saving"**
- Currently using local JSON files (see `/data/leads.json`)
- For production, set up a backend (Firebase/Supabase/D1)
- Check file permissions on the `/data` directory

## Next Steps

1. **Get Gemini API Key:**
   - Go to https://ai.google.dev/
   - Click "Get API Key"
   - Copy key to `.env.local`

2. **Test it works:**
   ```bash
   npm run dev
   # Try running an audit and verify summary generates
   ```

3. **For production:**
   - Deploy to Vercel/Netlify
   - Add environment variables in platform settings
   - Test each environment separately

4. **Scale to production backend:**
   - Switch from JSON files to Firebase/Supabase
   - Add email confirmations with Resend
   - Monitor rate limiting and API costs
