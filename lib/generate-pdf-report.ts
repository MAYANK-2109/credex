'use client';

import jsPDF from 'jspdf';
import type { OptimizationResult, Recommendation } from './optimization-engine';

/* ============================================================================
   COLOR PALETTE — matches the LaTeX \definecolor directives
   ============================================================================ */
const C = {
  primary:   [102, 126, 234] as [number, number, number],
  accent:    [240, 147, 251] as [number, number, number],
  dark:      [33, 33, 33]    as [number, number, number],
  light:     [102, 102, 102] as [number, number, number],
  success:   [31, 158, 117]  as [number, number, number],
  danger:    [226, 75, 74]   as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  black:     [0, 0, 0]       as [number, number, number],
  bgPrimary: [102, 126, 234, 0.08],
  bgAccent:  [240, 147, 251, 0.12],
  bgSuccess: [31, 158, 117,  0.12],
  bgDanger:  [226, 75, 74,   0.08],
};

/* Helper: tint a colour towards white by a ratio (0–1) */
function tint(rgb: [number, number, number], ratio: number): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * ratio),
    Math.round(rgb[1] + (255 - rgb[1]) * ratio),
    Math.round(rgb[2] + (255 - rgb[2]) * ratio),
  ];
}

/* ============================================================================
   MAIN EXPORT
   ============================================================================ */
export function generateAuditPDF(
  result: OptimizationResult,
  teamSize: number,
  selectedToolNames: string[],
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();  // 297
  const margin = 12;
  const contentW = pageW - margin * 2;
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let y = 14; // current vertical cursor

  /* -----------------------------------------------------------------------
     HEADER BAR
     ----------------------------------------------------------------------- */
  // Company name (left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...C.primary);
  doc.text('AI Spend Audit', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.light);
  doc.text('AI Analytics Division', margin, y + 5);

  // Report title (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...C.dark);
  doc.text('AI Spend Audit Report', pageW - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.light);
  doc.text(`Generated ${today}`, pageW - margin, y + 5, { align: 'right' });

  y += 10;

  // Horizontal rule
  doc.setDrawColor(...C.dark);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  /* -----------------------------------------------------------------------
     SECTION: EXECUTIVE SUMMARY
     ----------------------------------------------------------------------- */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text('EXECUTIVE SUMMARY', margin, y);
  y += 6;

  // Left box — spend & savings
  const boxW = contentW * 0.46;
  const boxH = 42;
  doc.setFillColor(...tint(C.primary, 0.92));
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, boxW, boxH, 2, 2, 'FD');

  let bx = margin + 4;
  let by = y + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.primary);
  doc.text('Current Monthly Spend', bx, by);

  by += 7;
  doc.setFontSize(18);
  doc.setTextColor(...C.danger);
  doc.text(`$${result.currentMonthlySpend.toLocaleString()}`, bx, by);

  by += 5;
  doc.setFontSize(8);
  doc.setTextColor(...C.light);
  doc.text(`Across ${selectedToolNames.length} tool${selectedToolNames.length !== 1 ? 's' : ''}`, bx, by);

  by += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.success);
  doc.text('Potential Savings', bx, by);

  by += 7;
  doc.setFontSize(18);
  const pct = result.currentMonthlySpend > 0
    ? Math.round((result.totalMonthlySavings / result.currentMonthlySpend) * 100)
    : 0;
  doc.text(`$${result.totalMonthlySavings.toLocaleString()} / ${pct}%`, bx, by);

  // Right side — summary paragraph
  const rightX = margin + boxW + 6;
  const paraW = contentW - boxW - 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);

  const summaryText =
    `We analyzed your AI tooling stack across ${selectedToolNames.length} tool${selectedToolNames.length !== 1 ? 's' : ''} ` +
    `for a team of ${teamSize} and identified significant cost optimization opportunities. ` +
    `By consolidating redundant services and switching to more efficient pricing models, ` +
    `you can reduce expenses while maintaining productivity.`;

  const splitSummary = doc.splitTextToSize(summaryText, paraW);
  doc.text(splitSummary, rightX, y + 6);

  // Key finding
  if (result.recommendations.length > 0) {
    const topRec = result.recommendations[0];
    const findingY = y + 6 + splitSummary.length * 4 + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.dark);
    doc.text('Key Finding:', rightX, findingY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.light);
    const findingText = `${topRec.toolName}: ${topRec.recommendedAction}`;
    const findingSplit = doc.splitTextToSize(findingText, paraW - 2);
    doc.text(findingSplit, rightX, findingY + 4);
  }

  y += boxH + 8;

  /* -----------------------------------------------------------------------
     METRIC CARDS ROW (Time · Actions · Impact)
     ----------------------------------------------------------------------- */
  const cardW = (contentW - 8) / 3;
  const cardH = 24;

  const metricCards: {
    label: string; value: string; sub: string;
    borderColor: [number, number, number]; bgColor: [number, number, number];
    textColor: [number, number, number];
  }[] = [
    {
      label: 'Time', value: '< 1 hour', sub: 'Implementation',
      borderColor: C.primary, bgColor: tint(C.primary, 0.88),
      textColor: C.primary,
    },
    {
      label: 'Actions', value: String(result.recommendations.length), sub: 'Recommendations',
      borderColor: C.accent, bgColor: tint(C.accent, 0.88),
      textColor: C.accent,
    },
    {
      label: 'Impact', value: `$${result.totalAnnualSavings.toLocaleString()}`, sub: 'Annual Savings',
      borderColor: C.success, bgColor: tint(C.success, 0.88),
      textColor: C.success,
    },
  ];

  metricCards.forEach((card, i) => {
    const cx = margin + i * (cardW + 4);
    doc.setFillColor(...card.bgColor);
    doc.setDrawColor(...card.borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.text(card.label, cx + 4, y + 6);

    doc.setFontSize(16);
    doc.setTextColor(...card.textColor);
    doc.text(card.value, cx + 4, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.light);
    doc.text(card.sub, cx + 4, y + 20);
  });

  y += cardH + 8;

  /* -----------------------------------------------------------------------
     SECTION: TOP RECOMMENDATIONS
     ----------------------------------------------------------------------- */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text('TOP RECOMMENDATIONS', margin, y);
  y += 6;

  result.recommendations.forEach((rec, idx) => {
    // Check if we need a new page
    if (y + 30 > pageH - 20) {
      doc.addPage();
      y = 14;
    }

    const isHigh = rec.monthlySavings > 100;
    const border: [number, number, number] = isHigh ? C.danger : C.accent;
    const bg = isHigh ? tint(C.danger, 0.92) : tint(C.accent, 0.92);
    const recH = 26;

    doc.setFillColor(...bg);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, recH, 2, 2, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...C.dark);
    doc.text(`${idx + 1}. ${rec.toolName}: ${rec.recommendedAction}`, margin + 4, y + 7);

    // Reason
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.light);
    const reasonSplit = doc.splitTextToSize(rec.reason, contentW - 8);
    doc.text(reasonSplit.slice(0, 2), margin + 4, y + 13);

    // Save badge (left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...(isHigh ? C.danger : C.accent));
    doc.text(
      `Save $${rec.monthlySavings.toLocaleString()}/mo | Effort: ${rec.paybackMonths && rec.paybackMonths > 3 ? 'Medium' : 'Easy'}`,
      margin + 4, y + 22,
    );

    // Priority badge (right)
    doc.setTextColor(...(isHigh ? C.success : C.primary));
    doc.text(
      isHigh ? 'HIGH PRIORITY' : 'MEDIUM PRIORITY',
      pageW - margin - 4, y + 22, { align: 'right' },
    );

    y += recH + 4;
  });

  y += 4;

  /* -----------------------------------------------------------------------
     SECTION: MONTHLY SAVINGS PROJECTION TABLE
     ----------------------------------------------------------------------- */
  if (y + 50 > pageH - 20) {
    doc.addPage();
    y = 14;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text('MONTHLY SAVINGS PROJECTION', margin, y);
  y += 6;

  // Table header
  const cols = [margin, margin + 55, margin + 90, margin + 120, margin + 150];
  const headers = ['Tool', 'Current', 'Optimized', 'Monthly', 'Annual'];
  const rowH = 8;

  doc.setFillColor(...tint(C.primary, 0.85));
  doc.rect(margin, y, contentW, rowH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  headers.forEach((h, i) => {
    doc.text(h, cols[i] + 2, y + 5.5);
  });

  y += rowH;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  result.recommendations.forEach((rec) => {
    if (y + rowH > pageH - 20) {
      doc.addPage();
      y = 14;
    }

    // Zebra stripe
    doc.setFillColor(248, 248, 252);
    doc.rect(margin, y, contentW, rowH, 'F');

    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, y + rowH, pageW - margin, y + rowH);

    const optimized = rec.currentSpend - rec.monthlySavings;

    doc.setTextColor(...C.danger);
    doc.text(rec.toolName, cols[0] + 2, y + 5.5);

    doc.setTextColor(...C.dark);
    doc.text(`$${rec.currentSpend.toLocaleString()}`, cols[1] + 2, y + 5.5);
    doc.text(`$${optimized.toLocaleString()}`, cols[2] + 2, y + 5.5);

    doc.setTextColor(...C.success);
    doc.text(`$${rec.monthlySavings.toLocaleString()}`, cols[3] + 2, y + 5.5);
    doc.text(`$${(rec.monthlySavings * 12).toLocaleString()}`, cols[4] + 2, y + 5.5);

    y += rowH;
  });

  // Total row
  doc.setFillColor(...tint(C.primary, 0.90));
  doc.rect(margin, y, contentW, rowH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  doc.text('TOTAL', cols[0] + 2, y + 5.5);
  doc.text(`$${result.currentMonthlySpend.toLocaleString()}`, cols[1] + 2, y + 5.5);
  doc.text(
    `$${(result.currentMonthlySpend - result.totalMonthlySavings).toLocaleString()}`,
    cols[2] + 2, y + 5.5,
  );
  doc.setTextColor(...C.success);
  doc.text(`$${result.totalMonthlySavings.toLocaleString()}`, cols[3] + 2, y + 5.5);
  doc.text(`$${result.totalAnnualSavings.toLocaleString()}`, cols[4] + 2, y + 5.5);

  y += rowH + 10;

  /* -----------------------------------------------------------------------
     SECTION: IMPLEMENTATION CHECKLIST
     ----------------------------------------------------------------------- */
  if (y + 30 > pageH - 20) {
    doc.addPage();
    y = 14;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...C.dark);
  doc.text('IMPLEMENTATION CHECKLIST', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);

  const checklist = result.recommendations.map(
    (rec) => `[ ]  ${rec.toolName}: ${rec.recommendedAction}`,
  );
  checklist.push('[ ]  Implement changes and monitor metrics for 30 days');

  checklist.forEach((item) => {
    if (y + 6 > pageH - 20) {
      doc.addPage();
      y = 14;
    }
    doc.text(item, margin + 2, y);
    // Estimated time (right-aligned)
    doc.setTextColor(...C.light);
    doc.text('15 min', pageW - margin, y, { align: 'right' });
    doc.setTextColor(...C.dark);
    y += 5;
  });

  y += 6;

  /* -----------------------------------------------------------------------
     BOTTOM ROW: KEY INSIGHT + NEXT STEPS
     ----------------------------------------------------------------------- */
  if (y + 28 > pageH - 20) {
    doc.addPage();
    y = 14;
  }

  const halfW = (contentW - 6) / 2;

  // KEY INSIGHT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text('KEY INSIGHT', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.light);

  let insightText = 'Your AI tooling stack has been fully audited. ';
  if (result.recommendations.length > 0) {
    insightText +=
      `Focus on ${result.recommendations[0].toolName} first — ` +
      `it represents the largest savings opportunity at $${result.recommendations[0].monthlySavings.toLocaleString()}/mo.`;
  } else {
    insightText += 'Your stack is already well optimized. Continue monitoring quarterly.';
  }
  const insightSplit = doc.splitTextToSize(insightText, halfW - 4);
  doc.text(insightSplit, margin, y + 5);

  // NEXT STEPS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text('NEXT STEPS', margin + halfW + 6, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.light);
  const nextText =
    'Schedule a 30-minute review with your team lead. ' +
    'Implementation can happen immediately without disrupting workflows. ' +
    `Potential annual impact: $${result.totalAnnualSavings.toLocaleString()}.`;
  const nextSplit = doc.splitTextToSize(nextText, halfW - 4);
  doc.text(nextSplit, margin + halfW + 6, y + 5);

  /* -----------------------------------------------------------------------
     FOOTER (every page)
     ----------------------------------------------------------------------- */
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.light);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.light);
    doc.text(
      `Page ${p} of ${totalPages}  |  Generated on ${today}  |  AI Spend Audit by Credex`,
      pageW / 2, pageH - 6,
      { align: 'center' },
    );
  }

  /* -----------------------------------------------------------------------
     SAVE
     ----------------------------------------------------------------------- */
  doc.save('AI-Spend-Audit-Report.pdf');
}
