import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

interface EstimateData {
  estimateNumber: string;
  date: Date;
  validUntil?: Date;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  status: string;
}

interface InvoiceData extends EstimateData {
  invoiceNumber: string;
  dueDate?: Date;
  amountPaid: number;
  amountDue: number;
  paidDate?: Date;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export async function generateEstimatePDF(data: EstimateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(28).font('Helvetica-Bold').text('ESTIMATE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(data.estimateNumber, 50, 85);

    // Company Info (right side)
    doc.fontSize(12).font('Helvetica-Bold').text('Hail Solutions Group', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica')
      .text('Auto Hail Damage Repair', 400, 68, { align: 'right' })
      .text('Concierge Service', 400, 82, { align: 'right' });

    // Date and Valid Until
    doc.fontSize(10)
      .text(`Date: ${formatDate(data.date)}`, 400, 110, { align: 'right' });
    if (data.validUntil) {
      doc.text(`Valid Until: ${formatDate(data.validUntil)}`, 400, 125, { align: 'right' });
    }

    // Customer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 130);
    doc.fontSize(10).font('Helvetica')
      .text(data.customerName, 50, 148);
    if (data.customerAddress) {
      doc.text(data.customerAddress, 50, 162);
    }
    if (data.customerEmail) {
      doc.text(data.customerEmail, 50, 176);
    }
    if (data.customerPhone) {
      doc.text(data.customerPhone, 50, 190);
    }

    // Line Items Table
    const tableTop = 240;
    doc.fontSize(10).font('Helvetica-Bold');

    // Table Headers
    doc.text('Description', 50, tableTop);
    doc.text('Category', 280, tableTop);
    doc.text('Qty', 370, tableTop);
    doc.text('Unit Price', 420, tableTop);
    doc.text('Total', 510, tableTop, { align: 'right' });

    // Draw header line
    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    // Line Items
    let yPosition = tableTop + 25;
    doc.font('Helvetica');

    data.lineItems.forEach((item) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(9)
        .text(item.description, 50, yPosition, { width: 220 })
        .text(item.category, 280, yPosition)
        .text(item.quantity.toString(), 370, yPosition)
        .text(formatCurrency(item.unitPrice), 420, yPosition)
        .text(formatCurrency(item.total), 510, yPosition, { align: 'right' });

      yPosition += 25;
    });

    // Draw line before totals
    yPosition += 10;
    doc.moveTo(350, yPosition).lineTo(560, yPosition).stroke();

    // Totals
    yPosition += 15;
    doc.fontSize(10);

    doc.text('Subtotal:', 400, yPosition);
    doc.text(formatCurrency(data.subtotal), 510, yPosition, { align: 'right' });

    yPosition += 20;
    doc.text(`Tax (${(data.taxRate / 100).toFixed(2)}%):`, 400, yPosition);
    doc.text(formatCurrency(data.taxAmount), 510, yPosition, { align: 'right' });

    if (data.discountAmount > 0) {
      yPosition += 20;
      doc.text('Discount:', 400, yPosition);
      doc.text(`-${formatCurrency(data.discountAmount)}`, 510, yPosition, { align: 'right' });
    }

    yPosition += 20;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 400, yPosition);
    doc.text(formatCurrency(data.total), 510, yPosition, { align: 'right' });

    // Notes
    if (data.notes) {
      yPosition += 40;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, yPosition);
      doc.fontSize(9).font('Helvetica').text(data.notes, 50, yPosition + 15, { width: 500 });
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica')
        .text(
          'Thank you for your business!',
          50,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width - 100 }
        );
    }

    doc.end();
  });
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(data.invoiceNumber, 50, 85);

    // Status Badge
    let statusColor = '#666666';
    if (data.status === 'paid') statusColor = '#22c55e';
    else if (data.status === 'partial') statusColor = '#eab308';
    else if (data.status === 'overdue') statusColor = '#ef4444';

    doc.fontSize(12).font('Helvetica-Bold')
      .fillColor(statusColor)
      .text(data.status.toUpperCase(), 50, 105);
    doc.fillColor('#000000');

    // Company Info (right side)
    doc.fontSize(12).font('Helvetica-Bold').text('Hail Solutions Group', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica')
      .text('Auto Hail Damage Repair', 400, 68, { align: 'right' })
      .text('Concierge Service', 400, 82, { align: 'right' });

    // Date and Due Date
    doc.fontSize(10)
      .text(`Date: ${formatDate(data.date)}`, 400, 110, { align: 'right' });
    if (data.dueDate) {
      doc.text(`Due Date: ${formatDate(data.dueDate)}`, 400, 125, { align: 'right' });
    }
    if (data.paidDate) {
      doc.text(`Paid Date: ${formatDate(data.paidDate)}`, 400, 140, { align: 'right' });
    }

    // Customer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 150);
    doc.fontSize(10).font('Helvetica')
      .text(data.customerName, 50, 168);
    if (data.customerAddress) {
      doc.text(data.customerAddress, 50, 182);
    }
    if (data.customerEmail) {
      doc.text(data.customerEmail, 50, 196);
    }
    if (data.customerPhone) {
      doc.text(data.customerPhone, 50, 210);
    }

    // Line Items Table
    const tableTop = 260;
    doc.fontSize(10).font('Helvetica-Bold');

    // Table Headers
    doc.text('Description', 50, tableTop);
    doc.text('Category', 280, tableTop);
    doc.text('Qty', 370, tableTop);
    doc.text('Unit Price', 420, tableTop);
    doc.text('Total', 510, tableTop, { align: 'right' });

    // Draw header line
    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    // Line Items
    let yPosition = tableTop + 25;
    doc.font('Helvetica');

    data.lineItems.forEach((item) => {
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(9)
        .text(item.description, 50, yPosition, { width: 220 })
        .text(item.category, 280, yPosition)
        .text(item.quantity.toString(), 370, yPosition)
        .text(formatCurrency(item.unitPrice), 420, yPosition)
        .text(formatCurrency(item.total), 510, yPosition, { align: 'right' });

      yPosition += 25;
    });

    // Draw line before totals
    yPosition += 10;
    doc.moveTo(350, yPosition).lineTo(560, yPosition).stroke();

    // Totals
    yPosition += 15;
    doc.fontSize(10);

    doc.text('Subtotal:', 400, yPosition);
    doc.text(formatCurrency(data.subtotal), 510, yPosition, { align: 'right' });

    yPosition += 20;
    doc.text(`Tax (${(data.taxRate / 100).toFixed(2)}%):`, 400, yPosition);
    doc.text(formatCurrency(data.taxAmount), 510, yPosition, { align: 'right' });

    if (data.discountAmount > 0) {
      yPosition += 20;
      doc.text('Discount:', 400, yPosition);
      doc.text(`-${formatCurrency(data.discountAmount)}`, 510, yPosition, { align: 'right' });
    }

    yPosition += 20;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 400, yPosition);
    doc.text(formatCurrency(data.total), 510, yPosition, { align: 'right' });

    // Payment Info
    if (data.amountPaid > 0) {
      yPosition += 25;
      doc.fontSize(10).font('Helvetica');
      doc.text('Amount Paid:', 400, yPosition);
      doc.text(formatCurrency(data.amountPaid), 510, yPosition, { align: 'right' });

      yPosition += 20;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.fillColor(data.amountDue === 0 ? '#22c55e' : '#ef4444');
      doc.text('Amount Due:', 400, yPosition);
      doc.text(formatCurrency(data.amountDue), 510, yPosition, { align: 'right' });
      doc.fillColor('#000000');
    }

    // Notes
    if (data.notes) {
      yPosition += 40;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, yPosition);
      doc.fontSize(9).font('Helvetica').text(data.notes, 50, yPosition + 15, { width: 500 });
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica')
        .text(
          'Thank you for your business! Please remit payment by the due date.',
          50,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width - 100 }
        );
    }

    doc.end();
  });
}
