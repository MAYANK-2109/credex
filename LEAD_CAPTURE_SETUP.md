# Lead Capture Setup Guide

Your application has a complete lead capture system already built. Here's how to activate it:

## Current Architecture

- **Form Location:** Results page collects: email, company name, role, rating, honeypot
- **API Endpoint:** `POST /api/leads` with rate limiting (5 req/min) and bot protection
- **Storage Options:** Supabase (primary) + local JSON fallback
- **Notifications:** Resend email integration with high-savings routing ($500+ = priority contact)

Current flow: Form → `/api/leads` → Supabase database → Resend email

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Account
1. Go to https://supabase.com/
2. Sign up for free account
3. Create a new project (choose region closest to your users)
4. Wait for project to initialize (~2 minutes)

### 1.2 Create `leads` Table

In Supabase dashboard, open **SQL Editor** and run:

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_name TEXT,
  role TEXT,
  team_size INTEGER,
  primary_use_case TEXT,
  tool_count INTEGER,
  savings DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_from TEXT
);

-- Create index for fast email lookups
CREATE INDEX idx_leads_email ON leads(email);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

### 1.3 Get Supabase Credentials

In Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy `Project URL` 
3. Copy `anon public` key (labeled `ANON_KEY`)

---

## Step 2: Add Credentials to `.env`

Update `.env` file:

```
# ============================================================================
# SUPABASE (Database for leads storage)
# ============================================================================
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# RESEND (Transactional email - optional but recommended)
# ============================================================================
RESEND_API_KEY=re_1234567890abcdefghijklmnop
```

**Note:** Never commit `.env` to Git. It's in `.gitignore` for security.

---

## Step 3: Set Up Resend (Optional but Recommended)

Resend sends automated emails to leads with their audit results.

### 3.1 Create Resend Account
1. Go to https://resend.com/
2. Sign up for free
3. Create an API key in dashboard

### 3.2 Configure Email Domain
1. Add your domain (or use default `resend.dev` for testing)
2. Verify DNS records if using custom domain
3. Copy API key to `.env` as `RESEND_API_KEY`

### 3.3 Email Behavior
- **High savings (≥$500/month):** Sends email mentioning specialist contact within 24 hours
- **Low savings (<$500/month):** Sends standard audit report with self-serve guidance

---

## Step 4: Test Lead Capture

### 4.1 Local Testing
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000/audit
3. Run an audit
4. Fill out lead capture form at bottom
5. Submit

### 4.2 Verify Data Stored
**Option A: Supabase Dashboard**
- Go to Supabase → your project → **Table Editor**
- Click `leads` table
- You should see your test submission

**Option B: Local Fallback**
- Check `data/leads.json` file
- Shows if Supabase failed (useful for debugging)

---

## Data Schema

Lead records include:

```typescript
{
  id: string;                          // Auto-generated UUID
  email: string;                       // User email (required)
  company_name: string;                // Company name (optional)
  role: string;                        // User role (optional)
  team_size: number;                   // Team size from audit
  primary_use_case: string;            // 'coding' | 'writing' | 'data' | 'research' | 'mixed'
  tool_count: number;                  // Number of tools audited
  savings: number;                     // Estimated monthly savings
  created_at: timestamp;               // When lead was captured
  submitted_from: string;              // Source page/utm params (optional)
}
```

---

## Security Features

✅ **Rate Limiting:** 5 submissions per minute per IP  
✅ **Honeypot:** Hidden spam field catches bots  
✅ **Email Validation:** Rejects invalid email addresses  
✅ **Fallback System:** If Supabase fails, stores locally then syncs later  

---

## Troubleshooting

### Issue: Form won't submit

**Check:**
1. API key is pasted correctly in `.env` (no extra spaces)
2. Restarted dev server after updating `.env`
3. Network tab shows request to `/api/leads`

### Issue: Data in `data/leads.json` but not in Supabase

**Reason:** Supabase credentials missing or invalid

**Fix:**
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
2. Check Supabase project is still running
3. Test table exists: `SELECT * FROM leads;` in SQL editor
4. Check browser console for error messages

### Issue: Emails not being sent

**Check:**
1. `RESEND_API_KEY` is in `.env`
2. Email recipient is valid
3. Check Resend dashboard **Activity** tab for bounce/rejection logs

---

## Production Deployment

When deploying to production:

1. **Add environment variables** to hosting platform:
   - Vercel: Settings → Environment Variables
   - Netlify: Site settings → Build & deploy → Environment
   - Railway/Render: Project settings → Environment

2. **Set correct `NEXT_PUBLIC_SITE_URL`:**
   ```
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

3. **Enable Supabase security:**
   - In Supabase → SQL Editor, enable Row Level Security (RLS)
   - Add policy: Allow anonymous inserts to leads

4. **Monitor database growth:**
   - Supabase free tier: 500MB database
   - After reaching ~300MB, consider upgrading or exporting leads

---

## Monitoring Leads

### View All Leads
In Supabase Table Editor:
```sql
SELECT email, company_name, savings, created_at 
FROM leads 
ORDER BY created_at DESC;
```

### High-Value Leads (≥$500/month)
```sql
SELECT email, company_name, savings, created_at 
FROM leads 
WHERE savings >= 500
ORDER BY savings DESC;
```

### Export as CSV
- Supabase UI → Table Editor → Export button
- Or use: Data → Export to CSV

---

## Next Steps

1. ✅ Create Supabase account
2. ✅ Create `leads` table with SQL script
3. ✅ Copy credentials to `.env`
4. ✅ (Optional) Set up Resend for emails
5. ✅ Test form submission
6. ✅ Monitor leads in Supabase dashboard

**Your lead capture system will then automatically:**
- Store every submission
- Rate-limit spam bots
- Send follow-up emails
- Fall back to local file if needed
