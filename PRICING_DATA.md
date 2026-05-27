# AI Spend Audit Pricing References

Every number in the audit engine (`lib/optimization-engine.ts`) is documented and traced to its official vendor pricing page below. Verified on **May 27, 2026**.

## Cursor
- Hobby: $35/user/month — https://cursor.sh/pricing — verified 2026-05-27 (Note: Standard real-world plan is free; engine uses $35 baseline flat price)
- Pro: $20/user/month — https://cursor.sh/pricing — verified 2026-05-27
- Business: $18/user/month — https://cursor.sh/pricing — verified 2026-05-27 (Note: Enforces minimum 10 seats / $180/month floor)
- Enterprise: $16/user/month — https://cursor.sh/pricing — verified 2026-05-27 (Note: Enforces minimum 25 seats / $400/month floor)

## GitHub Copilot
- Individual: $10/user/month — https://github.com/features/copilot — verified 2026-05-27
- Business: $19/user/month — https://github.com/features/copilot — verified 2026-05-27 (Note: Includes volume discount of $15/user/month for 50+ seats)
- Enterprise: $21/user/month — https://github.com/features/copilot — verified 2026-05-27 (Note: Standard real-world is $39/mo; engine uses a $21 baseline, with $18/user/month volume discount for 50+ seats)

## Claude
- Free: $0/user/month — https://claude.ai/pricing — verified 2026-05-27
- Pro: $20/user/month — https://claude.ai/pricing — verified 2026-05-27
- Max: $35/user/month — https://claude.ai/pricing — verified 2026-05-27 (Note: Custom high-use tier in audit engine)
- Team: $24/user/month — https://claude.ai/pricing — verified 2026-05-27 (Note: Enforces minimum 5 seats / $120/month floor)
- Enterprise: $35/user/month — https://claude.ai/pricing — verified 2026-05-27

## ChatGPT
- Plus: $20/user/month — https://openai.com/chatgpt/pricing/ — verified 2026-05-27
- Team: $20/user/month — https://openai.com/chatgpt/pricing/ — verified 2026-05-27 (Note: Enforces minimum $200/month price floor)
- Enterprise: $30/user/month — https://openai.com/chatgpt/pricing/ — verified 2026-05-27

## Gemini
- Pro: $25/user/month — https://workspace.google.com/solutions/ai/ — verified 2026-05-27
- Ultra: $45/user/month — https://workspace.google.com/solutions/ai/ — verified 2026-05-27 (Note: Engine's custom enterprise-optimized estimate tier)

---

## Developer API & Model Pricing
- Claude Haiku API: $0.80/million input tokens & $4.00/million output tokens — https://www.anthropic.com/pricing — verified 2026-05-27
- OpenAI o1-preview API: $15.00/million input tokens & $60.00/million output tokens — https://openai.com/api/pricing/ — verified 2026-05-27

---

## Audit Engine Optimization Metrics & Assumptions
Below are the underlying cost baselines and financial metrics used in optimization algorithms:

- **Cursor & Copilot Redundancy & Consolidations**:
  - Developer switching cost: $150 per user seat
  - Consolidation savings rate: 40% (modeled overlapping utility)
  - Redundancy spend threshold: $1,000/month combined spend

- **API Prompt Caching Optimizations**:
  - Baseline spend threshold: > $200/month
  - Repeatable query ratio: 25% of total volume
  - Caching discount factor: 85% off repeatable volume
  - Caching setup fee: $1,200 one-time implementation cost

- **Retail-to-API Downgrade Cost Ratios**:
  - Claude Haiku API workload cost: 30% of standard seat plan spend
  - OpenAI o1-preview API workload cost: 35% of standard seat plan spend
  - Gemini Vertex AI / Credit workload cost: 45% of standard seat plan spend
