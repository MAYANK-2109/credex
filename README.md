# AI Spend Audit

![CI](https://github.com/MAYANK-2109/credex/actions/workflows/ci.yml/badge.svg)

A Next.js app for auditing AI tool spend, discovering redundant plans, and recommending savings.

## What this repo includes

- `app/landing/page.tsx`: marketing landing page with clear value prop and CTA
- `app/page.tsx`: main audit experience with tool selection, optimization logic, and share/lead capture flows
- `lib/optimization-engine.ts`: deterministic AI spend optimization rules
- `app/api/leads/route.ts`: lead capture endpoint
- `app/api/shares/route.ts`: share link generation endpoint
- `app/api/feedback/route.ts`: audit feedback collection endpoint
- `tests/`: Jest unit tests for optimization rules and API routes
- `.github/workflows/ci.yml`: GitHub Actions CI pipeline
- `.eslintrc.js` and `prettier.config.js`: linting and formatting configuration

## Scripts

- `npm run dev` — start development server
- `npm run build` — build production app
- `npm run lint` — run ESLint
- `npm run type-check` — run TypeScript type checking
- `npm test` — run Jest tests
- `npm run format` — run Prettier formatting

## Architecture & Design

See [Architecture Diagram](docs/architecture.md) for system overview and data flow.

## Design Decisions

### Why File-Based Storage Instead of a Database?

**Decision**: Use JSON files (`leads.json`, `shares.json`) instead of PostgreSQL, MongoDB, or similar.

**Rationale**:
- **Speed**: No database setup, migrations, or ORM overhead—ship immediately
- **Simplicity**: Single Next.js app with no separate backend service
- **Cost**: $0 operational cost; free file storage on Vercel
- **Iteration**: Easy to backtest and manually inspect user data during early growth
- **Scale**: Sufficient for MVP phase; outgrown only after 10K+ audit requests

**Trade-offs**:
- No built-in ACID transactions or multi-user concurrency
- File size grows linearly; export/archive needed at scale
- No complex queries or analytics features
- Re-export data manually for integration with external tools

### Why These Specific Optimization Rules?

**Rules Implemented**:
1. **Claude Team Floor**: Downgrade to Pro if <5 seats (strict minimum billing floor)
2. **Cursor Business Floor**: Downgrade to Pro if <10 seats (plan economics inverted for small teams)
3. **Pricing Mismatch Detection**: Alert if actual spend >10% above expected plan cost

**Rationale**:
- **Data-driven**: Built from real customer support tickets and billing anomalies
- **High confidence**: Floor rules are vendor-enforced; mismatch detection catches configuration errors
- **Deterministic**: Rules don't require ML/LLM; run offline with zero API dependency
- **Generalizable**: Apply to any team size; user inputs control applicability

**Not Included**:
- ❌ Feature overlap analysis (e.g., "Claude Pro > ChatGPT Plus for coding") — requires domain judgment
- ❌ Usage-based optimization (e.g., "GPU quota underutilized") — no API access to spend data
- ❌ Seat consolidation (e.g., "Fire Gemini, use Claude") — too risky without feature benchmarks
- ❌ Volume discount negotiation — requires N-quarter forecast accuracy

See [Financial Model](docs/finance-model.md) for savings calculation details and model limitations.

### What's NOT Included: Trade-offs for MVP

**No User Authentication**
- Trade-off: All audit data is semi-public; links are guessable UUIDs
- Rationale: Auth adds complexity; users can share audit results intentionally via unique links
- Future: Add auth+dashboard when customers demand private audits

**No Discount Tier Modeling**
- Trade-off: Enterprise customers with custom contracts see inaccurate recommendations
- Rationale: Custom discounts are unknown without customer input; model published pricing only
- Future: Add "discount %"  input field when targeting enterprise SMEs

**No Real-Time Spend Data Integration**
- Trade-off: Customers must input spend manually; no automated reconciliation
- Rationale: Requires OAuth to each vendor's billing API; not mature enough at <1K MAU
- Future: Offer Zapier/API integration once demand justifies engineering

**No Seat-Level Segmentation**
- Trade-off: Recommendations apply uniformly to all seats; no per-team/per-role optimization
- Rationale: Scope explosion; most SMBs have 2–20 people with similar needs
- Future: Add team/department filters when customer feedback demands this

## Notes

The CI workflow runs `npm ci`, `npm run lint`, `npm run type-check`, and `npm test` on pushes and pull requests.
