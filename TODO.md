# TODO - AI Spend Audit

- [ ] Inspect existing optimization result types + UI rendering entrypoints for main and share pages.
- [ ] Extend `optimizeToolStack()` to compute explicit answers to:
  - [ ] Right plan for usage (overkill)
  - [ ] Cheaper plan from same vendor
  - [ ] Substantially cheaper alternative tool
  - [ ] Paying retail vs credits (handle as “unknown from inputs” when not provided)
- [ ] Return this as structured data from the optimization engine.
- [ ] Update `components/animated-results-sequence.tsx` to display the new answers section.
- [ ] Update `app/share/[id]/page.tsx` to display the new answers section.
- [x] Add/adjust Jest tests for the new heuristics.
- [x] Run `npm test`, `npm run type-check`, and a quick `npm run lint`.


