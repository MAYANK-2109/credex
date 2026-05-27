# Automated Tests Overview

Below is a summary of the automated test suite for the **AI Spend Audit** project. All tests can be run with the standard Jest command:

```bash
npm test
```

| Test File | Description | How to Run |
|---|---|---|
| `tests/api.test.ts` | Tests the API endpoints **/api/leads** and **/api/shares** – verifies validation errors, successful lead creation, and share ID generation. | `npm test -- tests/api.test.ts` |
| `tests/audit-summary.test.ts` | Covers the **/api/audit-summary** route – checks handling of missing results, fallback behavior when Gemini API keys are absent, and full response generation without truncation. | `npm test -- tests/audit-summary.test.ts` |
| `tests/optimization.test.ts` | Validates the **optimization engine** logic – floor rule downgrades, pricing mismatch detection, cross‑tool redundancy, API token optimization, and overall waste score calculation. | `npm test -- tests/optimization.test.ts` |
| `tests/lead-validation.test.ts` | Additional unit tests for lead payload validation rules – ensures required fields, email format, and team size constraints are enforced. | `npm test -- tests/lead-validation.test.ts` |
| `tests/summary-fallback.test.ts` | Tests the fallback text generation path when Gemini API keys are missing, confirming the response contains multiple sentences and proper formatting. | `npm test -- tests/summary-fallback.test.ts` |

**Note:** The last two test files are placeholders for future implementation. Existing tests (first three) already provide comprehensive coverage of the audit engine's core functionality.
