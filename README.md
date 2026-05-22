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

## Notes

The CI workflow runs `npm ci`, `npm run lint`, `npm run type-check`, and `npm test` on pushes and pull requests.
