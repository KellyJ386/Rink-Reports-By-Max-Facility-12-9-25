import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Export form submission data for PDF generation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, submissionId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get the submission with all related data
    const submission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        formTemplateId: formId,
      },
      include: {
        formTemplate: {
          include: {
            fields: {
              orderBy: { orderIndex: 'asc' },
            },
            facility: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
              },
            },
          },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        fieldResponses: {
          include: {
            formField: true,
          },
        },
        attachments: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get reviewer info if reviewed
    let reviewer = null;
    if (submission.reviewedById) {
      reviewer = await prisma.user.findUnique({
        where: { id: submission.reviewedById },
        select: { id: true, name: true },
      });
    }

    // Format field responses for easy rendering
    const formattedResponses = submission.fieldResponses.map((response) => {
      let formattedValue = response.value;

      // Parse JSON values for complex field types
      if (response.formField.fieldType === 'CHECKBOX' || response.formField.fieldType === 'MULTI_SELECT') {
        try {
          const parsed = JSON.parse(response.value || '');
          formattedValue = Array.isArray(parsed) ? parsed.join(', ') : response.value;
        } catch {
          // Keep original value if not JSON
        }
      }

      // Format boolean values
      if (response.value === 'true') formattedValue = 'Yes';
      if (response.value === 'false') formattedValue = 'No';

      return {
        fieldId: response.formFieldId,
        fieldLabel: response.formField.label,
        fieldType: response.formField.fieldType,
        value: response.value,
        formattedValue,
        isRequired: response.formField.isRequired,
        orderIndex: response.formField.orderIndex,
      };
    }).sort((a, b) => a.orderIndex - b.orderIndex);

    // Build export data
    const exportData = {
      id: submission.id,
      formName: submission.formTemplate.name,
      formDescription: submission.formTemplate.description,
      formCategory: submission.formTemplate.category,
      facility: submission.formTemplate.facility,
      submittedBy: submission.submittedBy,
      submittedAt: submission.submittedAt,
      status: submission.status,
      reviewer,
      reviewedAt: submission.reviewedAt,
      reviewNotes: submission.reviewNotes,
      weatherData: submission.weatherData,
      responses: formattedResponses,
      attachments: submission.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
      })),
    };

    if (format === 'html') {
      // Generate print-friendly HTML
      const html = generatePrintableHTML(exportData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${exportData.formName}-${submission.id}.html"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Error exporting form submission:', error);
    return NextResponse.json(
      { error: 'Failed to export form submission' },
      { status: 500 }
    );
  }
}

// Generate print-friendly HTML for PDF conversion
function generatePrintableHTML(data: {
  id: string;
  formName: string;
  formDescription?: string | null;
  formCategory: string;
  facility: { name: string; address?: string | null; phone?: string | null } | null;
  submittedBy: { name: string; email: string };
  submittedAt: Date;
  status: string;
  reviewer?: { name: string } | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  weatherData?: unknown;
  responses: Array<{
    fieldLabel: string;
    fieldType: string;
    formattedValue: string;
  }>;
  attachments: Array<{ fileName: string }>;
}): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const weather = data.weatherData as { temp?: number; humidity?: number; conditions?: string } | null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.formName} - Submission Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #333;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24pt;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 11pt;
    }
    .facility-info {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .facility-info h3 {
      font-size: 14pt;
      color: #374151;
      margin-bottom: 8px;
    }
    .meta-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    .meta-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 3px solid #2563eb;
    }
    .meta-item label {
      display: block;
      font-size: 9pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .meta-item .value {
      font-weight: 600;
      color: #111827;
    }
    .responses-section h2 {
      font-size: 16pt;
      color: #1e40af;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .response-item {
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .response-item:last-child { border-bottom: none; }
    .response-item .label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    }
    .response-item .value {
      color: #111827;
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
    }
    .response-item .value.signature {
      font-style: italic;
      color: #2563eb;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 10pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-submitted { background: #dbeafe; color: #1d4ed8; }
    .status-approved { background: #d1fae5; color: #059669; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .review-section {
      margin-top: 20px;
      padding: 15px;
      background: #f0fdf4;
      border-radius: 8px;
      border: 1px solid #86efac;
    }
    .review-section h3 {
      color: #166534;
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #9ca3af;
      text-align: center;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <h1>${escapeHtml(data.formName)}</h1>
    ${data.formDescription ? `<p class="subtitle">${escapeHtml(data.formDescription)}</p>` : ''}
    <span class="status-badge status-${data.status.toLowerCase()}">${data.status}</span>
  </div>

  ${data.facility ? `
  <div class="facility-info">
    <h3>Facility Information</h3>
    <p><strong>${escapeHtml(data.facility.name)}</strong></p>
    ${data.facility.address ? `<p>${escapeHtml(data.facility.address)}</p>` : ''}
    ${data.facility.phone ? `<p>Phone: ${escapeHtml(data.facility.phone)}</p>` : ''}
  </div>
  ` : ''}

  <div class="meta-section">
    <div class="meta-item">
      <label>Submitted By</label>
      <div class="value">${escapeHtml(data.submittedBy.name)}</div>
    </div>
    <div class="meta-item">
      <label>Submitted At</label>
      <div class="value">${formatDate(data.submittedAt)}</div>
    </div>
    <div class="meta-item">
      <label>Form Category</label>
      <div class="value">${escapeHtml(data.formCategory.replace('_', ' '))}</div>
    </div>
    <div class="meta-item">
      <label>Submission ID</label>
      <div class="value">${data.id.slice(-8).toUpperCase()}</div>
    </div>
    ${weather ? `
    <div class="meta-item">
      <label>Weather Conditions</label>
      <div class="value">${weather.conditions || 'N/A'} ${weather.temp ? `(${weather.temp}°F)` : ''}</div>
    </div>
    ` : ''}
  </div>

  <div class="responses-section">
    <h2>Form Responses</h2>
    ${data.responses.map((r) => `
    <div class="response-item">
      <div class="label">${escapeHtml(r.fieldLabel)}</div>
      <div class="value ${r.fieldType === 'SIGNATURE' ? 'signature' : ''}">${escapeHtml(r.formattedValue) || '<em>No response</em>'}</div>
    </div>
    `).join('')}
  </div>

  ${data.attachments.length > 0 ? `
  <div class="responses-section">
    <h2>Attachments</h2>
    <ul>
      ${data.attachments.map((a) => `<li>${escapeHtml(a.fileName)}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${data.reviewer ? `
  <div class="review-section">
    <h3>Review Information</h3>
    <p><strong>Reviewed By:</strong> ${escapeHtml(data.reviewer.name)}</p>
    ${data.reviewedAt ? `<p><strong>Reviewed At:</strong> ${formatDate(data.reviewedAt)}</p>` : ''}
    ${data.reviewNotes ? `<p><strong>Notes:</strong> ${escapeHtml(data.reviewNotes)}</p>` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()} | MFO - Ice Rink Management System</p>
    <p>This document was automatically generated and may be subject to verification.</p>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
