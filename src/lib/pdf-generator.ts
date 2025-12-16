// PDF Generation Service using server-side HTML to PDF conversion
// This module generates PDF reports for ice depth readings and incidents

interface IceDepthReportData {
  facilityName: string;
  rinkName: string;
  reportDate: string;
  generatedBy: string;
  readings: Array<{
    recordedAt: string;
    recordedBy: string;
    averageDepth: number | null;
    minDepth: number | null;
    maxDepth: number | null;
    variance: number | null;
    ambientTemp: number | null;
    iceTemp: number | null;
    humidity: number | null;
  }>;
  analysis?: {
    summary: string;
    patterns: string[];
    risks: string[];
    recommendations: string[];
    weekOverWeekChange: number | null;
    trendDirection: string;
  };
  weeklyComparison?: Array<{
    weekStart: string;
    averageDepth: number;
    change: number | null;
  }>;
}

interface IncidentReportData {
  facilityName: string;
  rinkName: string;
  reportDate: string;
  incident: {
    id: string;
    type: string;
    severity: string;
    occurredAt: string;
    reportedBy: string;
    location: string;
    description: string;
    injuryDetails?: {
      personName: string;
      personType: string;
      injuryType: string;
      bodyParts: string[];
      treatmentProvided: string;
      medicalAttention: boolean;
      ambulanceCalled: boolean;
    };
    witnesses: string[];
    immediateActions: string;
    followUpRequired: boolean;
    status: string;
  };
}

// Generate HTML content for Ice Depth Report
export function generateIceDepthReportHTML(data: IceDepthReportData): string {
  const readingsRows = data.readings
    .map(
      (r) => `
      <tr>
        <td>${new Date(r.recordedAt).toLocaleString()}</td>
        <td>${r.recordedBy}</td>
        <td>${r.averageDepth?.toFixed(2) || 'N/A'}"</td>
        <td>${r.minDepth?.toFixed(2) || 'N/A'}" - ${r.maxDepth?.toFixed(2) || 'N/A'}"</td>
        <td>${r.variance?.toFixed(3) || 'N/A'}</td>
        <td>${r.ambientTemp || 'N/A'}°F</td>
        <td>${r.iceTemp || 'N/A'}°F</td>
      </tr>
    `
    )
    .join('');

  const weeklyRows = data.weeklyComparison
    ? data.weeklyComparison
        .map(
          (w) => `
        <tr>
          <td>${new Date(w.weekStart).toLocaleDateString()}</td>
          <td>${w.averageDepth.toFixed(2)}"</td>
          <td style="color: ${w.change && w.change > 0 ? '#22c55e' : w.change && w.change < 0 ? '#ef4444' : '#64748b'}">
            ${w.change !== null ? (w.change > 0 ? '+' : '') + w.change.toFixed(2) + '"' : '—'}
          </td>
        </tr>
      `
        )
        .join('')
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ice Depth Report - ${data.rinkName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.5; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; color: #0ea5e9; margin-bottom: 5px; }
        .header .subtitle { color: #64748b; font-size: 14px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
        .meta-item { text-align: center; }
        .meta-item label { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; }
        .meta-item value { font-size: 14px; font-weight: 600; }
        .section { margin-bottom: 30px; }
        .section h2 { font-size: 16px; color: #0f172a; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #475569; }
        td { font-size: 12px; }
        .analysis-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .analysis-box h3 { color: #0369a1; font-size: 14px; margin-bottom: 10px; }
        .analysis-box p { color: #0c4a6e; }
        .list-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .list-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .list-box h4 { font-size: 12px; margin-bottom: 8px; }
        .list-box.patterns h4 { color: #0ea5e9; }
        .list-box.risks h4 { color: #f59e0b; }
        .list-box.recommendations h4 { color: #22c55e; }
        .list-box ul { list-style: none; font-size: 11px; }
        .list-box li { padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
        .list-box li:last-child { border-bottom: none; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
        .trend-indicator { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 11px; }
        .trend-increasing { background: #dcfce7; color: #166534; }
        .trend-decreasing { background: #fee2e2; color: #991b1b; }
        .trend-stable { background: #f1f5f9; color: #475569; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ice Depth Report</h1>
          <div class="subtitle">${data.facilityName} - ${data.rinkName}</div>
        </div>

        <div class="meta">
          <div class="meta-item">
            <label>Report Date</label>
            <value>${data.reportDate}</value>
          </div>
          <div class="meta-item">
            <label>Generated By</label>
            <value>${data.generatedBy}</value>
          </div>
          <div class="meta-item">
            <label>Total Readings</label>
            <value>${data.readings.length}</value>
          </div>
          <div class="meta-item">
            <label>Current Avg Depth</label>
            <value>${data.readings[0]?.averageDepth?.toFixed(2) || 'N/A'}"</value>
          </div>
        </div>

        ${
          data.analysis
            ? `
        <div class="section">
          <h2>AI Analysis Summary</h2>
          <div class="analysis-box">
            <h3>
              Overall Assessment
              <span class="trend-indicator trend-${data.analysis.trendDirection}">${data.analysis.trendDirection}</span>
              ${data.analysis.weekOverWeekChange !== null ? `<span style="margin-left: 10px; color: ${data.analysis.weekOverWeekChange > 0 ? '#22c55e' : '#ef4444'}">${data.analysis.weekOverWeekChange > 0 ? '+' : ''}${data.analysis.weekOverWeekChange.toFixed(2)}" week-over-week</span>` : ''}
            </h3>
            <p>${data.analysis.summary}</p>
          </div>
          <div class="list-section">
            <div class="list-box patterns">
              <h4>Patterns Detected</h4>
              <ul>
                ${data.analysis.patterns.map((p) => `<li>• ${p}</li>`).join('')}
              </ul>
            </div>
            <div class="list-box risks">
              <h4>Identified Risks</h4>
              <ul>
                ${data.analysis.risks.length > 0 ? data.analysis.risks.map((r) => `<li>• ${r}</li>`).join('') : '<li>No significant risks</li>'}
              </ul>
            </div>
            <div class="list-box recommendations">
              <h4>Recommendations</h4>
              <ul>
                ${data.analysis.recommendations.map((r) => `<li>• ${r}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
        `
            : ''
        }

        ${
          data.weeklyComparison && data.weeklyComparison.length > 0
            ? `
        <div class="section">
          <h2>Week-over-Week Comparison</h2>
          <table>
            <thead>
              <tr>
                <th>Week Starting</th>
                <th>Average Depth</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyRows}
            </tbody>
          </table>
        </div>
        `
            : ''
        }

        <div class="section">
          <h2>Detailed Readings</h2>
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Recorded By</th>
                <th>Avg Depth</th>
                <th>Range</th>
                <th>Variance</th>
                <th>Ambient</th>
                <th>Ice Temp</th>
              </tr>
            </thead>
            <tbody>
              ${readingsRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Generated by Max Facility Operations (MFO) • ${new Date().toISOString()}</p>
          <p>This report is confidential and intended for facility management use only.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate HTML content for Incident Report
export function generateIncidentReportHTML(data: IncidentReportData): string {
  const severityColors: Record<string, string> = {
    MINOR: '#22c55e',
    MODERATE: '#f59e0b',
    SERIOUS: '#f97316',
    CRITICAL: '#ef4444',
  };

  const incident = data.incident;
  const severityColor = severityColors[incident.severity] || '#64748b';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Incident Report #${incident.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.5; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { border-bottom: 3px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; color: #dc2626; margin-bottom: 5px; }
        .header .subtitle { color: #64748b; font-size: 14px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 11px; margin-left: 10px; }
        .severity-badge { background: ${severityColor}20; color: ${severityColor}; }
        .status-badge { background: #e0f2fe; color: #0369a1; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .meta-item { background: #f8fafc; padding: 12px; border-radius: 8px; }
        .meta-item label { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .meta-item value { font-size: 14px; font-weight: 600; }
        .section { margin-bottom: 25px; }
        .section h2 { font-size: 16px; color: #0f172a; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
        .content-box { background: #f8fafc; border-radius: 8px; padding: 15px; }
        .content-box p { color: #334155; }
        .injury-details { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; }
        .injury-details h3 { color: #991b1b; font-size: 14px; margin-bottom: 10px; }
        .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .detail-item { padding: 8px; background: white; border-radius: 4px; }
        .detail-item label { font-size: 10px; color: #64748b; display: block; }
        .detail-item value { font-weight: 600; }
        .witnesses { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 15px; margin-top: 15px; }
        .witnesses h3 { color: #854d0e; font-size: 14px; margin-bottom: 10px; }
        .actions-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; }
        .actions-box h3 { color: #166534; font-size: 14px; margin-bottom: 10px; }
        .signature-section { margin-top: 40px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
        .signature-box { border-top: 1px solid #1e293b; padding-top: 10px; }
        .signature-box label { font-size: 11px; color: #64748b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
        .warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-top: 20px; }
        .warning-box p { color: #92400e; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>
            Incident Report
            <span class="badge severity-badge">${incident.severity}</span>
            <span class="badge status-badge">${incident.status}</span>
          </h1>
          <div class="subtitle">${data.facilityName} - ${data.rinkName} • Report #${incident.id}</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <label>Incident Type</label>
            <value>${incident.type.replace(/_/g, ' ')}</value>
          </div>
          <div class="meta-item">
            <label>Occurred At</label>
            <value>${new Date(incident.occurredAt).toLocaleString()}</value>
          </div>
          <div class="meta-item">
            <label>Reported By</label>
            <value>${incident.reportedBy}</value>
          </div>
          <div class="meta-item">
            <label>Location</label>
            <value>${incident.location}</value>
          </div>
        </div>

        <div class="section">
          <h2>Incident Description</h2>
          <div class="content-box">
            <p>${incident.description}</p>
          </div>
        </div>

        ${
          incident.injuryDetails
            ? `
        <div class="section">
          <h2>Injury Details</h2>
          <div class="injury-details">
            <h3>Injured Person Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Name</label>
                <value>${incident.injuryDetails.personName}</value>
              </div>
              <div class="detail-item">
                <label>Person Type</label>
                <value>${incident.injuryDetails.personType}</value>
              </div>
              <div class="detail-item">
                <label>Injury Type</label>
                <value>${incident.injuryDetails.injuryType}</value>
              </div>
              <div class="detail-item">
                <label>Body Parts Affected</label>
                <value>${incident.injuryDetails.bodyParts.join(', ')}</value>
              </div>
              <div class="detail-item">
                <label>Treatment Provided</label>
                <value>${incident.injuryDetails.treatmentProvided || 'None recorded'}</value>
              </div>
              <div class="detail-item">
                <label>Medical Attention</label>
                <value>${incident.injuryDetails.medicalAttention ? 'Yes' : 'No'}</value>
              </div>
              <div class="detail-item">
                <label>Ambulance Called</label>
                <value>${incident.injuryDetails.ambulanceCalled ? 'Yes' : 'No'}</value>
              </div>
            </div>
          </div>
        </div>
        `
            : ''
        }

        ${
          incident.witnesses.length > 0
            ? `
        <div class="witnesses">
          <h3>Witnesses</h3>
          <ul>
            ${incident.witnesses.map((w) => `<li>• ${w}</li>`).join('')}
          </ul>
        </div>
        `
            : ''
        }

        <div class="section">
          <h2>Immediate Actions Taken</h2>
          <div class="actions-box">
            <p>${incident.immediateActions || 'No immediate actions recorded'}</p>
          </div>
        </div>

        ${
          incident.followUpRequired
            ? `
        <div class="warning-box">
          <p><strong>⚠️ Follow-up Required:</strong> This incident requires additional follow-up actions. Please ensure proper documentation and remediation steps are completed.</p>
        </div>
        `
            : ''
        }

        <div class="signature-section">
          <div class="signature-box">
            <label>Reporting Staff Signature</label>
          </div>
          <div class="signature-box">
            <label>Manager/Supervisor Signature</label>
          </div>
        </div>

        <div class="footer">
          <p>Generated by Max Facility Operations (MFO) • ${new Date().toISOString()}</p>
          <p>This document is confidential. Retain for insurance and compliance purposes.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export type { IceDepthReportData, IncidentReportData };
