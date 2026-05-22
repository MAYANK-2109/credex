# Financial Model

## Savings Calculation

### Monthly Savings Formula

```
Monthly Savings = Current Monthly Spend - Recommended Monthly Spend
```

For each detected optimization opportunity:
1. **Calculate expected spend** using plan pricing table (per-seat or flat-rate)
2. **Compare to actual spend** reported by user
3. **Identify savings** if actual > expected or if downgrade is recommended

### Annual Savings

```
Annual Savings = Monthly Savings × 12
```

### Example Scenarios

#### Scenario 1: Claude Team Overage (Floor Rule)
- **Current**: Claude Team, 3 seats, $100/month
- **Issue**: Claude Team has 5-seat minimum billing floor
- **Recommended**: Downgrade to Claude Pro at $20/seat
- **Recommended Cost**: 3 × $20 = $60/month
- **Monthly Savings**: $100 - $60 = $40
- **Annual Savings**: $40 × 12 = $480

#### Scenario 2: Cursor Business Overage (Floor Rule)
- **Current**: Cursor Business, 8 seats, $180/month
- **Issue**: Cursor Business has 10-seat minimum billing floor; 8 seats better on Pro
- **Recommended**: Downgrade to Cursor Pro at $20/seat
- **Recommended Cost**: 8 × $20 = $160/month
- **Monthly Savings**: $180 - $160 = $20
- **Annual Savings**: $20 × 12 = $240

#### Scenario 3: Pricing Mismatch Detection
- **Current**: GitHub Copilot Business, 5 seats, $150/month
- **Expected**: 5 × $19/seat = $95/month
- **Issue**: Actual spend is 10% higher than expected pricing
- **Recommendation**: Verify billing configuration with GitHub account manager
- **Potential Monthly Savings**: $150 - $95 = $55
- **Potential Annual Savings**: $55 × 12 = $660

## Model Limitations

### Known Constraints

1. **No Discount Tiers**: Model uses published per-seat/flat pricing only
   - Enterprise custom discounts not captured
   - Volume-based pricing reductions not modeled
   - Non-standard contracts excluded

2. **No Authentication Coverage**: Recommendations exclude:
   - SSO/identity provider costs (Okta, Azure AD, etc.)
   - Security compliance features (SOC 2, HIPAA)
   - Support tier premiums

3. **No Multi-Year Contracts**: Assumes month-to-month or annual standard plans
   - Upfront commitments not factored in
   - Early termination penalties not considered

4. **No Usage-Based Optimization**: Rules are plan-structure focused
   - Actual API usage patterns not analyzed
   - Seat underutilization not detected
   - Cost-per-output metrics not available

5. **Simplified Team Structure**: Assumes uniform per-seat pricing
   - Doesn't model teams with mixed plan tiers
   - No per-team or per-project cost allocation
   - Department-level spending not tracked

6. **Tool Coverage**: Only optimizes for currently tracked AI tools
   - Emerging tools not in pricing table
   - Custom/internal tools excluded
   - Open-source alternatives not compared

### Future Enhancements

- **API Usage Analysis**: Integrate spend tracking APIs to detect underutilized plans
- **Custom Discount Negotiation**: Build case for enterprise discounts based on spend data
- **Multi-Tool Correlation**: Detect feature overlap (e.g., coding tools vs. general LLMs)
- **Team Segmentation**: Optimize per department with different use-case profiles
- **Competitive Pricing**: Alert when competitor tools release lower-priced plans

## Validation & Accuracy

### Data Accuracy
- Pricing data from official tool pricing pages (Q2 2024)
- Spot-checks against published rate cards
- Known to diverge from custom enterprise contracts

### Recommendation Confidence
- **High confidence**: Floor rule violations (Claude 5-seat minimum, Cursor 10-seat minimum)
- **Medium confidence**: Pricing mismatch detection (within 10% variance)
- **Low confidence**: Multi-tool optimization requiring domain knowledge

### User Responsibility
Users should:
- Verify pricing with their account managers before implementation
- Check for volume discounts or enterprise contracts
- Validate seat counts and plan tier names in audit system
- Test downgrades in staging before production cutoff
