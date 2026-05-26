Integrate a seamless, high-performance looping background video in the Hero section, overlaying monochromatic typography in the top-right corner with a high-end glassmorphism centered navigation bar.



Design a modern, high-end hero section with a full-bleed, edge-to-edge background video layer.
Source: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4
Behaviour: Loop infinitely, autoplay, muted, playsinline, object-fit: cover, 0px margins/padding on all sides to eliminate gutter offsets.
Tint: Apply a subtle white overlay (opacity: 0.2) or dark mesh container to maintain typographic contrast ratio (WCAG AA compliance).

Navigation Bar (Centered Floating Deck):
Position: Fixed top, centered horizontally (`left: 50%; transform: translateX(-50%)`).
Styling: Circular rounded borders (`border-radius: 9999px`), background opacity `0.6` (black background), and dynamic backdrop filter blur (`backdrop-filter: blur(12px)`) for a premium glassmorphic effect.

Typography & Styling:
Heading Font: 'Helvetica Now Display Bold' loaded from https://db.onlinewebfonts.com/c/04e6981992c0e2e7642af2074ebe3901?family=Helvetica+Now+Display+Bold
Body Font: 'Inter' (weights 300-900) loaded from Google Fonts.
Core CSS Variables:
     :root {
       --font-heading: 'Helvetica Now Display Bold', sans-serif;
       --font-body: 'Inter', sans-serif;
       --color-text: #192837;
       --color-accent: #7342E2;
       --color-login-bg: #F2F2EE;
     }
Layout: Position content left-aligned inside the video overlay, utilizing professional monochromatic styling. Make sure the run custom stack audit button transitions smoothly to a vibrant gradient.

Enhance the results layout by converting standard listings into high-fidelity actionable cards, embedding clean data visualizations, polishing spacing, adding share/download capabilities, and supporting honest reporting limits.
Refactor the results page to deliver a professional B2B SaaS dashboard experience.
Transform recommendations into standalone interactive cards.
Left side: Priority/impact indicator badge (color-coded: high/red, medium/yellow, low/green) with corresponding Lucide icon indicators.
Body: Tool name heading, current spend, and clear recommended action description.
Right side: Dynamic savings badge reflecting percentage discount/downgrade potential.
Interactive: Hover-lift translations (`translateY(-4px)` with box-shadow transitions) and expandable detail sections showing granular payback periods and logical rationale.



Implement an interactive SVG/CSS ledger comparison table and a radial progress ring representing the team's AI Stack Waste Quotient.
table is fully sortable by Tool Name, Plan, and Cost.



Retain primary gradient call-to-action (e.g., Booking / Notify trigger).
Add a high-fidelity LaTeX-styled PDF download trigger and a shareable result URL generator.
Add secondary helper copy detailing the consultation value.



For total savings < $100/mo, display a custom "Notify Me" CTA and honest benchmark message ("Your stack is already optimized!") rather than manufacturing false overspend metrics.

---



Replicate a highly specific LaTeX report format exactly in a downloadable client-side PDF export without using external rendering servers.
```markdown
Implement a custom client-side PDF engine utilizing 'jspdf'.
Replicate the exact typography hierarchy, margins, and geometric rules specified in the LaTeX template.
Colors: Primary (`#667eea`), Accent (`#f093fb`), Success (`#1f9e75`), Danger (`#e24b4a`), Text (`#212121`), Light Text (`#666666`).





A professional double-column top header with company branding on the left and "AI Spend Audit Report" on the right.
Executive Summary block wrapped in a light background container with colored metrics.
3-Column key metrics cards showing estimated monthly savings, annual savings, and priority counts.
Top recommendations presented as shaded tabular items with clear status highlights.
Tabular Monthly Savings projections listing every tool, current plan, proposed optimized plan, and monthly savings.
Dynamic page footer rendering "Page X of Y | Generated on [Date]" using coordinates to determine total page count.




Create a bulletproof Gemini integration, secure database lead capture, rate-limiting, honeypot filters, Resend onboarding emails, and URL sharing with zero PII exposure.
```markdown
Architect a secure Next.js serverless API infrastructure with the following features:
- Target Endpoint: `/api/audit-summary`
- Prompt: Analyze the JSON payload representing the audited tool configs and generate a precise ~100-word executive summary.
- Fail-Safe Cascade:
    - Level 1: Fetch Gemini Pro using `GEMINI_API_KEY_PRIMARY`.
    - Level 2: Catch any network error or timeout and instantly retry using `GEMINI_API_KEY_SECONDARY`.
    - Level 3: If both fail, return a structured, highly personalized hardcoded fallback summary.
     - Response Signature: `{ text: string, source: 'primary' | 'secondary' | 'fallback' }`
   - UI State: Display a visible fallback warning banner in the summary box when source is 'fallback' to ensure complete transparency.



Target Endpoint: `/api/leads`
DB Storage: Store `{ email, companyName, role, teamSize, primaryUseCase, toolCount, savings }` in Supabase leads table. If keys are missing, fall back safely to local `data/leads.json` file logging.
Anti-Abuse Checks:
- Sliding-Window Rate Limiter: In-memory tracker storing IP timestamps, limiting lead submits to 5/min and summary calls to 10/min.
- Honeypot: Include a hidden field `website` in the UI. If submitted with values, discard the payload silently to trap spam bots.




Resend Transactional Email Onboarding:
   - Integrate `resend` client in the backend pipeline.
   - High-Savings Routing: If potential savings exceed $500/mo, fire an email notifying the user that a Credex growth specialist will contact them within 24 hours to schedule custom credit matching. For lower savings, send a general audit report.



- Strip all personal identifiable information (PII) from shareable results. Save only tool configuration states (`data/shares.json`) and access via random 8-character hashes.
- Render clean Open Graph (OG) and Twitter Card tags in Next.js metadata templates to power rich social previews.
```




Recommendation Cards: Implement controlled-collapse pattern with card payload `{ toolName, currentPlan, currentAnnualSpend, recommendedPlan, projectedAnnualSpend, estimatedMonthlyRecovery, implementationComplexity, businessJustification, contractTerminationConstraints }`. Priority algorithm: savings (40%) + implementation effort (35%) + contract friction (25%) = 0-100 score. Hover state: `translateY(-4px)` with box-shadow transition. Expandable sections show payback period, logical rationale, and risk assessment with `max-height` animation (300ms, ease-in-out).



Radial Progress Ring: AI Stack Waste Quotient = (sum monthly savings / total current spend) * 100. Color logic: green (0-20), yellow (21-50), red (51+). Mount animation uses cubic-bezier(0.34, 1.56, 0.64, 1). Real-time updates on card interactions.



Ledger Comparison Table: Client-side sortable columns (Tool Name, Current Plan, Cost, Recommended Plan, Projected Cost, Monthly Savings, Annual Savings). Virtualization for 50+ rows maintaining 60fps. Row hover: `rgba(115, 66, 226, 0.08)` background.




Share URL Generation: Deterministic hash using `crypto.createHash('sha256')` from canonical tool config JSON, generating 8-character identifiers. Store in `data/shares.json` with metadata: `{ shareId, createdAt, expiresAt, viewCount, referralCount }`. URL format: `https://credex.app/share/[8-char-hash]`.

Dynamic Metadata: OG image rendered as SVG with annual savings, recommendation count, waste quotient. Twitter Card type `summary_large_image` (1200x630px). Title: "Save $XXXX/year on AI tools", description highlights primary recommendation.





Gemini API Resilience: Three-tier fallback cascade with 8-second timeout. Primary: `GEMINI_API_KEY_PRIMARY`. Secondary on failure: `GEMINI_API_KEY_SECONDARY` with exponential backoff (500ms initial, 1.5x multiplier, max 2 retries). Tertiary: Hardcoded template populated with audit data `{ toolCount, categoryCount, annualTotal, highPriorityCount, annualSavings, primaryRecommendation }`. Response includes source: 'primary' | 'secondary' | 'fallback'. UI displays fallback warning banner for transparency.

Rate Limiting: Sliding-window per IP. Lead endpoint: 5 req/min. Audit-summary: 10 req/min. Implementation: timestamp buckets (minute-scoped), O(1) amortized. Reject with HTTP 429 + Retry-After header. Production: Redis-backed via Supabase.




Security: Honeypot field `website` (display: none). Non-empty value silently discards payload. Catches 85-92% of bot submissions.

Email Routing: If `estimatedMonthSavings >= $500`: high-value template with 24-hour specialist contact promise. Below $500: standard template with self-serve guidance.




Lead Storage: Primary Supabase table `leads` schema: `{ id (uuid), email, companyName, role, teamSize, primaryUseCase, toolCount, estimatedSavings, createdAt, submittedFrom }`. Connection pooling: 20 concurrent, 5min idle timeout. Fallback: `data/leads.json` append-only format. Background sync job every 15min with exponential backoff (max 3 retries per lead).

Share Persistence: `data/shares.json` append-only structure indexed by 8-char hash (O(1) lookup). Tool config snapshot: `{ toolName, currentPlan, recommendedPlan, currentSpend, projectedSpend }`. Daily archive rotation. In-memory cache (Node.js Map) populated on startup.






Logging: Winston with JSON format. Levels: error (failures), warn (fallback/retry), info (submissions), debug (calc steps). Request ID correlation for end-to-end tracing. React error boundaries capture render exceptions.
Performance: Track Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1). Gemini TTFB monitoring across tiers. Ledger virtualization maintains 60fps on 100+ tools.
