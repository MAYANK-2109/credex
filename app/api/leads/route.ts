import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase-client';
import { isAllowed, getClientIp } from '@/lib/rate-limiter';
import { Resend } from 'resend';

const leadsFilePath = path.join(process.cwd(), 'data', 'leads.json');

/**
 * POST /api/leads – Store a lead submission with advanced abuse protection,
 * database storage (Supabase), and transactional notifications (Resend).
 */
export async function POST(req: Request) {
  // Apply sliding-window rate limiting (max 5 requests per minute per IP for lead submissions)
  const ip = getClientIp(req);
  if (!isAllowed(ip, 5, 60000)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    const payload = await req.json();
    const { email, companyName, role, teamSize, primaryUseCase, toolCount, honeypot, savings } = payload;

    // Honeypot Protection:
    // If the hidden field is filled, silently discard the request by returning success
    // to fool the spam bot without wasting system resources.
    if (honeypot) {
      console.warn(`Honeypot triggered by client IP ${ip}. Silently discarding bot lead.`);
      return NextResponse.json({ message: 'Lead saved' }, { status: 200 });
    }

    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const leadEntry = {
      email,
      companyName: companyName || '',
      role: role || '',
      teamSize: Number(teamSize) || 1,
      primaryUseCase: primaryUseCase || 'coding',
      toolCount: Number(toolCount) || 0,
      savings: Number(savings) || 0,
      timestamp: new Date().toISOString(),
    };

    // 1. Database Storage (Supabase Backend Client)
    let savedToCloud = false;
    if (supabase) {
      try {
        console.log('Attempting to store lead in Supabase database...');
        const { error } = await supabase.from('leads').insert([
          {
            email: leadEntry.email,
            company_name: leadEntry.companyName,
            role: leadEntry.role,
            team_size: leadEntry.teamSize,
            primary_use_case: leadEntry.primaryUseCase,
            tool_count: leadEntry.toolCount,
            savings: leadEntry.savings,
            created_at: leadEntry.timestamp,
          },
        ]);

        if (error) {
          throw error;
        }

        console.log('Lead stored successfully in Supabase database.');
        savedToCloud = true;
      } catch (dbErr: any) {
        console.warn('Supabase DB storage failed, falling back to local file storage:', dbErr.message || dbErr);
      }
    } else {
      console.log('Supabase client is not configured (missing URL or anon key). Using local file fallback...');
    }

    // Fallback Local Storage: always save locally if cloud insertion was not completed
    if (!savedToCloud) {
      if (process.env.VERCEL) {
        console.warn('CRITICAL: Running in Vercel serverless environment without Supabase. Skipping local file write to prevent ephemeral data loss.');
      } else {
        try {
          await fs.mkdir(path.dirname(leadsFilePath), { recursive: true });
          let leads: any[] = [];
          try {
            const data = await fs.readFile(leadsFilePath, 'utf8');
            leads = JSON.parse(data);
          } catch {
            leads = [];
          }
          leads.push(leadEntry);
          await fs.writeFile(leadsFilePath, JSON.stringify(leads, null, 2), 'utf8');
          console.log('Lead stored successfully in local data/leads.json file.');
        } catch (fileErr: any) {
          console.error('Local file storage failed:', fileErr);
        }
      }
    }

    // 2. Transactional Email Notification (Resend Integration)
    const resendKey = process.env.RESEND_API_KEY;
    const isHighSavings = leadEntry.savings > 500;

    const emailSubject = isHighSavings
      ? '🚀 Action Required: Coordinate Your $500+/mo AI Spend Savings'
      : '📊 AI Spend Audit Report: Your Custom Stack Breakdown';

    const emailBody = isHighSavings
      ? `Dear ${leadEntry.companyName || 'Founder'},\n\n` +
        `Thank you for running an AI Spend Audit on Credex. Our analysis shows that your organization could save up to $${leadEntry.savings}/month ($${(leadEntry.savings * 12).toLocaleString()}/year) by optimizing your AI tooling stack.\n\n` +
        `**Because your potential savings exceed $500/month, a Credex Growth Specialist will reach out to you within 24 hours** to coordinate custom credit matching and help you capture these savings with direct discount consolidation.\n\n` +
        `Audit Details:\n` +
        `- Team Size: ${leadEntry.teamSize} seats\n` +
        `- Tools Analyzed: ${leadEntry.toolCount}\n` +
        `- Savings Potential: $${leadEntry.savings}/mo\n\n` +
        `We look forward to speaking with you shortly.\n\n` +
        `Best regards,\nThe Credex Team`
      : `Hi there,\n\n` +
        `Thank you for running an AI Spend Audit on Credex. Our analysis indicates an estimated monthly savings potential of $${leadEntry.savings}/month ($${(leadEntry.savings * 12).toLocaleString()}/year).\n\n` +
        `Audit Details:\n` +
        `- Team Size: ${leadEntry.teamSize} seats\n` +
        `- Tools Analyzed: ${leadEntry.toolCount}\n` +
        `- Current Optimization Level: ${leadEntry.savings > 0 ? 'Improvement Opportunities Identified' : 'Excellent (Already Optimized)'}\n\n` +
        `If you need help matching these pricing tiers or exploring credits, feel free to reply directly to this email.\n\n` +
        `Best regards,\nThe Credex Team`;

    if (resendKey) {
      try {
        console.log('Sending transaction email via Resend...');
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'Credex Audits <onboarding@resend.dev>',
          to: leadEntry.email,
          subject: emailSubject,
          text: emailBody,
        });
        console.log('Confirmation email sent successfully.');
      } catch (emailErr: any) {
        console.error('Resend transaction email failed:', emailErr.message || emailErr);
      }
    } else {
      console.log('========================================================================');
      console.log('RESEND_API_KEY not configured. Transaction email output below:');
      console.log(`To: ${leadEntry.email}`);
      console.log(`Subject: ${emailSubject}`);
      console.log('--- Body ---');
      console.log(emailBody);
      console.log('========================================================================');
    }

    return NextResponse.json({ message: 'Lead saved' }, { status: 200 });
  } catch (err: any) {
    console.error('Lead API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
