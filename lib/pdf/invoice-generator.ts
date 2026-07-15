/**
 * Invoice PDF Generator
 * Server-side PDF generation for invoices
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatStableDate } from "@/lib/format";

interface InvoiceItem {
  productName: string;
  sku?: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

interface InvoicePDFData {
  invoiceNumber: string;
  status: string;
  issuedAt: Date | string;
  dueDate: Date | string;
  paidAt?: Date | string | null;

  // Amounts
  subtotal: number;
  tax?: number | null;
  shipping?: number | null;
  discount?: number | null;
  total: number;
  amountPaid: number;
  amountDue: number;

  // Client/Billing info
  clientName?: string;
  billingAddress?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;

  // Items (from order)
  items?: InvoiceItem[];

  // Notes
  notes?: string | null;

  // Company info (from settings or defaults)
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Generate Invoice PDF
 * Returns base64 encoded PDF data
 */
export function generateInvoicePDF(data: InvoicePDFData): string {
  const doc = new jsPDF();

  // Company defaults
  const companyName = data.companyName || "Stock Inventory Store";
  const companyAddress =
    data.companyAddress || "123 Main St, New York, NY 10001";
  const companyPhone = data.companyPhone || "+1 (555) 123-4567";
  const companyEmail = data.companyEmail || "billing@stockinventory.com";

  // Colors
  const primaryColor = [59, 130, 246] as [number, number, number]; // Blue
  const grayColor = [107, 114, 128] as [number, number, number];
  const darkColor = [31, 41, 55] as [number, number, number];

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text("INVOICE", 20, 25);

  // Invoice number and status
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text(`Invoice #: ${data.invoiceNumber}`, 20, 35);

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    draft: [156, 163, 175],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    overdue: [239, 68, 68],
    cancelled: [107, 114, 128],
  };
  const statusColor = statusColors[data.status] || grayColor;
  doc.setTextColor(...statusColor);
  doc.text(`Status: ${data.status.toUpperCase()}`, 20, 42);

  // Company info (right side)
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(companyName, 200, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(companyAddress, 200, 32, { align: "right" });
  doc.text(companyPhone, 200, 38, { align: "right" });
  doc.text(companyEmail, 200, 44, { align: "right" });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(20, 52, 190, 52);

  // Bill To section
  let yPos = 62;
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text("Bill To:", 20, yPos);

  yPos += 7;
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  const billToName = data.billingAddress?.name || data.clientName || "Customer";
  doc.text(billToName, 20, yPos);

  if (data.billingAddress) {
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    if (data.billingAddress.street) {
      doc.text(data.billingAddress.street, 20, yPos);
      yPos += 4;
    }
    const cityStateZip = [
      data.billingAddress.city,
      data.billingAddress.state,
      data.billingAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ");
    if (cityStateZip) {
      doc.text(cityStateZip, 20, yPos);
      yPos += 4;
    }
    if (data.billingAddress.country) {
      doc.text(data.billingAddress.country, 20, yPos);
    }
  }

  // Invoice details (right side)
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text("Issue Date:", 130, 62);
  doc.text("Due Date:", 130, 69);
  if (data.paidAt) {
    doc.text("Paid Date:", 130, 76);
  }

  doc.setTextColor(...darkColor);
  doc.text(formatStableDate(data.issuedAt), 200, 62, { align: "right" });
  doc.text(formatStableDate(data.dueDate), 200, 69, { align: "right" });
  if (data.paidAt) {
    doc.text(formatStableDate(data.paidAt), 200, 76, { align: "right" });
  }

  // Items table
  const tableStartY = Math.max(yPos + 15, 95);

  if (data.items && data.items.length > 0) {
    const tableData = data.items.map((item) => [
      item.productName,
      item.sku || "-",
      item.quantity.toString(),
      formatCurrency(item.price),
      formatCurrency(item.subtotal),
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["Item", "SKU", "Qty", "Price", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      margin: { left: 20, right: 20 },
    });
  }

  // Get final Y position after table
  const finalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      ?.finalY || tableStartY + 20;

  // Summary section
  let summaryY = finalY + 15;
  const summaryX = 130;
  const summaryValueX = 190;

  doc.setFontSize(9);
  doc.setTextColor(...grayColor);

  // Subtotal
  doc.text("Subtotal:", summaryX, summaryY);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(data.subtotal), summaryValueX, summaryY, {
    align: "right",
  });

  // Tax
  if (data.tax && data.tax > 0) {
    summaryY += 6;
    doc.setTextColor(...grayColor);
    doc.text("Tax:", summaryX, summaryY);
    doc.setTextColor(...darkColor);
    doc.text(formatCurrency(data.tax), summaryValueX, summaryY, {
      align: "right",
    });
  }

  // Shipping
  if (data.shipping && data.shipping > 0) {
    summaryY += 6;
    doc.setTextColor(...grayColor);
    doc.text("Shipping:", summaryX, summaryY);
    doc.setTextColor(...darkColor);
    doc.text(formatCurrency(data.shipping), summaryValueX, summaryY, {
      align: "right",
    });
  }

  // Discount
  if (data.discount && data.discount > 0) {
    summaryY += 6;
    doc.setTextColor(...grayColor);
    doc.text("Discount:", summaryX, summaryY);
    doc.setTextColor(34, 197, 94);
    doc.text(`-${formatCurrency(data.discount)}`, summaryValueX, summaryY, {
      align: "right",
    });
  }

  // Total
  summaryY += 8;
  doc.setDrawColor(229, 231, 235);
  doc.line(summaryX, summaryY - 2, summaryValueX, summaryY - 2);
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text("Total:", summaryX, summaryY + 4);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.total), summaryValueX, summaryY + 4, {
    align: "right",
  });

  // Amount paid
  summaryY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text("Amount Paid:", summaryX, summaryY);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(data.amountPaid), summaryValueX, summaryY, {
    align: "right",
  });

  // Amount due
  summaryY += 6;
  doc.setTextColor(...grayColor);
  doc.text("Amount Due:", summaryX, summaryY);
  if (data.amountDue > 0) {
    doc.setTextColor(239, 68, 68); // Red for unpaid
  } else {
    doc.setTextColor(34, 197, 94); // Green for paid
  }
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.amountDue), summaryValueX, summaryY, {
    align: "right",
  });

  // Notes
  if (data.notes) {
    summaryY += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text("Notes:", 20, summaryY);
    summaryY += 5;
    doc.setTextColor(...darkColor);
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, summaryY);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    "Thank you for your business!",
    doc.internal.pageSize.width / 2,
    pageHeight - 20,
    { align: "center" },
  );
  doc.text(
    `Generated on ${formatStableDate(new Date())}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 15,
    { align: "center" },
  );

  // Return as base64
  return doc.output("datauristring");
}

/**
 * Generate Invoice PDF as Buffer (for API response)
 */
export function generateInvoicePDFBuffer(data: InvoicePDFData): Buffer {
  // Use same generation logic but return buffer
  // For simplicity, we'll generate the same way and convert
  const base64 = generateInvoicePDF(data);
  const base64Data = base64.split(",")[1] || "";
  return Buffer.from(base64Data, "base64");
}
