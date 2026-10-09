/**
 * Authority Surplus Food Category Summary PDF Report Generator
 * Community Food Rescue App
 *
 * Professional A4 PDF layout using expo-print and expo-sharing.
 * Zero beneficiary/donor/volunteer PII.
 */

import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { AuthorityFoodSummaryReport } from '../types/food-summary';

/**
 * Sanitizes a date string or filter label for a safe filesystem name.
 */
export function sanitizeFilename(periodLabel: string): string {
  const clean = periodLabel
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return clean || 'Report';
}

/**
 * Formats an ISO date string to a readable format (e.g. "08 Oct 2026, 14:30").
 */
function formatReadableDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Generates the clean professional A4 HTML report string.
 */
export function generateReportHtml(report: AuthorityFoodSummaryReport): string {
  const formattedGeneratedAt = formatReadableDateTime(report.generatedAt);
  const organizationDisplay = report.authorityOrganization
    ? `${report.authorityName} (${report.authorityOrganization})`
    : report.authorityName;

  // Build rows for category table (a category may have multiple rows if multiple units exist)
  let categoryTableRowsHtml = '';
  if (report.categorySummaries.length === 0) {
    categoryTableRowsHtml = `
      <tr>
        <td colspan="5" class="empty-cell">No completed food rescues found for the selected criteria.</td>
      </tr>
    `;
  } else {
    report.categorySummaries.forEach((catSummary) => {
      catSummary.units.forEach((unitSummary, unitIdx) => {
        const isFirstUnit = unitIdx === 0;
        const rowSpan = catSummary.units.length;

        categoryTableRowsHtml += `
          <tr>
            ${isFirstUnit ? `<td ${rowSpan > 1 ? `rowspan="${rowSpan}"` : ''} class="category-name-cell"><strong>${escapeHtml(catSummary.category)}</strong></td>` : ''}
            <td class="qty-cell"><strong>${unitSummary.totalQuantity.toLocaleString()}</strong></td>
            <td class="unit-cell">${escapeHtml(unitSummary.unit)}</td>
            <td class="center-text-cell">${unitSummary.rescueCount}</td>
            ${isFirstUnit ? `<td ${rowSpan > 1 ? `rowspan="${rowSpan}"` : ''} class="center-text-cell">${catSummary.centerCount}</td>` : ''}
          </tr>
        `;
      });
    });
  }

  // Build rows for total by unit table
  let unitTotalsRowsHtml = '';
  if (report.totalsByUnit.length === 0) {
    unitTotalsRowsHtml = `
      <tr>
        <td colspan="2" class="empty-cell">No quantities recorded.</td>
      </tr>
    `;
  } else {
    report.totalsByUnit.forEach((u) => {
      unitTotalsRowsHtml += `
        <tr>
          <td><span class="unit-badge">${escapeHtml(u.unit)}</span></td>
          <td class="qty-cell"><strong>${u.totalQuantity.toLocaleString()}</strong></td>
        </tr>
      `;
    });
  }

  // Build collection centers breakdown section
  let centerBreakdownsHtml = '';
  if (report.centerBreakdowns.length > 0) {
    let centerCardsHtml = '';
    report.centerBreakdowns.forEach((cb) => {
      const unitsSummaryStr = cb.unitTotals.map((u) => `<strong>${u.totalQuantity.toLocaleString()}</strong> ${escapeHtml(u.unit)}`).join(', ');

      let categoryRows = '';
      cb.categories.forEach((cat) => {
        const uStr = cat.units.map((u) => `${u.totalQuantity} ${escapeHtml(u.unit)}`).join(', ');
        categoryRows += `
          <div class="center-category-item">
            <span class="cat-label">${escapeHtml(cat.category)}:</span>
            <span class="cat-qty">${uStr}</span>
          </div>
        `;
      });

      centerCardsHtml += `
        <div class="center-card">
          <div class="center-card-header">
            <h4>${escapeHtml(cb.centerName)}</h4>
            <span class="badge-pill">${cb.completedRescueCount} rescues</span>
          </div>
          <div class="center-card-totals">
            <div class="totals-label">Total received:</div>
            <div class="totals-value">${unitsSummaryStr || 'None'}</div>
          </div>
          <div class="center-category-list">
            ${categoryRows}
          </div>
        </div>
      `;
    });

    centerBreakdownsHtml = `
      <div class="section">
        <h3 class="section-title">Collection Center Breakdown</h3>
        <div class="centers-grid">
          ${centerCardsHtml}
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Community Food Rescue — Surplus Food Summary</title>
      <style>
        @page {
          size: A4;
          margin: 16mm 16mm 20mm 16mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1F2937;
          background: #FFFFFF;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
        }
        .header {
          border-bottom: 3px solid #10B981;
          padding-bottom: 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #065F46;
          margin: 0 0 4px 0;
          text-transform: uppercase;
        }
        .brand-subtitle {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px 0;
        }
        .meta-text {
          font-size: 12px;
          color: #6B7280;
          margin: 0;
        }
        .report-tag {
          background-color: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          text-align: right;
        }
        .summary-box {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .kpi-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }
        .kpi-value {
          font-size: 22px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 2px;
        }
        .kpi-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #4B5563;
          font-weight: 600;
        }
        .meta-summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #E5E7EB;
          font-size: 12px;
        }
        .meta-summary-item strong {
          color: #111827;
        }
        .section {
          margin-bottom: 24px;
          page-break-inside: auto;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background-color: #F3F4F6;
          color: #374151;
          font-weight: 700;
          text-align: left;
          padding: 8px 12px;
          border-top: 1px solid #D1D5DB;
          border-bottom: 2px solid #D1D5DB;
        }
        td {
          padding: 8px 12px;
          border-bottom: 1px solid #E5E7EB;
          vertical-align: middle;
        }
        tr {
          page-break-inside: avoid;
        }
        .category-name-cell {
          background-color: #FAFAFA;
          color: #111827;
        }
        .qty-cell {
          text-align: right;
          color: #059669;
          font-variant-numeric: tabular-nums;
        }
        .unit-cell {
          color: #4B5563;
        }
        .center-text-cell {
          text-align: center;
          color: #4B5563;
        }
        .empty-cell {
          text-align: center;
          padding: 24px;
          color: #9CA3AF;
          font-style: italic;
        }
        .unit-badge {
          display: inline-block;
          background: #EEF2F6;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #374151;
        }
        .unit-totals-table {
          max-width: 380px;
        }
        .centers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .center-card {
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          padding: 12px;
          page-break-inside: avoid;
        }
        .center-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .center-card-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #1F2937;
        }
        .badge-pill {
          background: #E0E7FF;
          color: #3730A3;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .center-card-totals {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          padding: 6px 8px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 11px;
        }
        .totals-label {
          color: #6B7280;
          font-size: 10px;
          text-transform: uppercase;
        }
        .totals-value {
          color: #065F46;
          font-weight: 600;
        }
        .center-category-list {
          font-size: 11px;
          color: #4B5563;
        }
        .center-category-item {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          border-bottom: 1px dotted #E5E7EB;
        }
        .footer {
          margin-top: 32px;
          padding-top: 12px;
          border-top: 1px solid #E5E7EB;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9CA3AF;
        }
        .privacy-notice {
          background: #F3F4F6;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 11px;
          color: #6B7280;
          margin-top: 16px;
          border-left: 3px solid #10B981;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="brand-title">Community Food Rescue</h1>
          <h2 class="brand-subtitle">Surplus Food Category Summary</h2>
          <p class="meta-text">Authority: <strong>${escapeHtml(organizationDisplay)}</strong></p>
        </div>
        <div class="report-tag">
          <div>Community Authority Report</div>
          <div style="font-size: 11px; font-weight: normal; margin-top: 2px;">Generated: ${formattedGeneratedAt}</div>
        </div>
      </div>

      <div class="summary-box">
        <h3 class="section-title" style="margin-top: 0; margin-bottom: 10px;">Report Summary</h3>
        <div class="meta-summary-row">
          <div class="meta-summary-item">Report Period: <strong>${escapeHtml(report.periodLabel)}</strong></div>
          <div class="meta-summary-item">Collection Centers: <strong>${escapeHtml(report.centerFilterLabel)}</strong></div>
        </div>
        <div class="summary-grid">
          <div class="kpi-card">
            <div class="kpi-value">${report.kpis.completedRescues}</div>
            <div class="kpi-label">Completed Rescues</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${report.kpis.foodCategoriesCount}</div>
            <div class="kpi-label">Food Categories</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${report.kpis.centersCount}</div>
            <div class="kpi-label">Centers Received Food</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Total Food Received by Unit</h3>
        <table class="unit-totals-table">
          <thead>
            <tr>
              <th style="width: 50%;">Unit</th>
              <th style="width: 50%; text-align: right;">Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${unitTotalsRowsHtml}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3 class="section-title">Food Received by Category</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 32%;">Category</th>
              <th style="width: 18%; text-align: right;">Quantity</th>
              <th style="width: 18%;">Unit</th>
              <th style="width: 18%; text-align: center;">Completed Rescues</th>
              <th style="width: 14%; text-align: center;">Centers</th>
            </tr>
          </thead>
          <tbody>
            ${categoryTableRowsHtml}
          </tbody>
        </table>
      </div>

      ${centerBreakdownsHtml}

      <div class="privacy-notice">
        <strong>Privacy by Design:</strong> This operational report aggregates completed community food rescue deliveries.
        It contains zero beneficiary identities, personal contact numbers, residential locations, or volunteer private data.
      </div>

      <div class="footer">
        <div>Community Food Rescue &bull; Community Authority Operational Reporting</div>
        <div>Page 1 of 1</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escapes HTML characters for safe template interpolation.
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates the PDF file and opens native share/save dialogue.
 */
export async function exportAndSharePdfReport(
  report: AuthorityFoodSummaryReport
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    if (!report || report.kpis.completedRescues === 0) {
      const emptyMsg = 'Report export is available when completed rescues exist for the selected filters.';
      Alert.alert('Report Export', emptyMsg);
      return { success: false, error: emptyMsg };
    }

    const html = generateReportHtml(report);
    const sanitizedPeriod = sanitizeFilename(report.periodLabel);
    const fileName = `Community_Food_Rescue_Summary_${sanitizedPeriod}.pdf`;

    if (Platform.OS === 'web') {
      // On Web platform, print directly to browser's PDF print dialogue
      await Print.printAsync({ html });
      return { success: true };
    }

    // Native iOS/Android flow
    const fileResult = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (!fileResult?.uri) {
      throw new Error('PDF file generation produced an empty file reference.');
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileResult.uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Export ${fileName}`,
      });
      return { success: true, filePath: fileResult.uri };
    } else {
      Alert.alert(
        'Report Generated',
        `Your PDF report was successfully created at: ${fileResult.uri}`
      );
      return { success: true, filePath: fileResult.uri };
    }
  } catch (err: any) {
    console.error('[PDFGenerator] Error generating or sharing PDF report:', err);
    const friendlyMessage = 'Unable to generate the report. Please try again.';
    Alert.alert('Report Export Failed', friendlyMessage);
    return { success: false, error: friendlyMessage };
  }
}
