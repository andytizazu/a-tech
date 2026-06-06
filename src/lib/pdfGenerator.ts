import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Sale, Medicine } from '../types';

const COLORS = {
  primary: [37, 99, 235] as [number, number, number], // Blue 600
  secondary: [100, 116, 139] as [number, number, number], // Slate 500
  success: [22, 163, 74] as [number, number, number], // Green 600
  danger: [220, 38, 38] as [number, number, number], // Red 600
  light: [248, 250, 252] as [number, number, number], // Slate 50
  dark: [15, 23, 42] as [number, number, number], // Slate 900
};

const drawLogo = (doc: jsPDF, x: number, y: number) => {
  // Draw a simple stylized "A" logo
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.roundedRect(x, y, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('A', x + 5, y + 7, { align: 'center' });
};

const drawHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Background header
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  drawLogo(doc, 15, 12);
  
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 30, 20);
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.text(subtitle, 30, 26);
  }
  
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth - 15, 20, { align: 'right' });
  
  // Decorative line
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(15, 35, pageWidth - 15, 35);
};

const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('A-Tech Pharmacy Ecosystem - Empowering Healthcare with Technology', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }
};

export const generateReceiptPDF = (sale: Sale, pharmacyName: string) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 180], // Taller receipt
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(pharmacyName, pageWidth / 2, 10, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('A-Tech Pharmacy Ecosystem', pageWidth / 2, 14, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(5, 18, pageWidth - 5, 18);

  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.setFontSize(8);
  doc.text(`Receipt ID: ${sale.id?.slice(0, 8) || 'N/A'}`, 5, 24);
  doc.text(`Date: ${format(sale.createdAt, 'yyyy-MM-dd HH:mm')}`, 5, 28);
  
  if (sale.customerName) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer: ${sale.customerName}`, 5, 34);
    if (sale.customerPhone) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Phone: ${sale.customerPhone}`, 5, 38);
    }
  }

  // Table
  const tableData = sale.items.map(item => [
    item.name,
    item.quantity.toString(),
    item.price.toFixed(2),
    item.total.toFixed(2)
  ]);

  autoTable(doc, {
    startY: sale.customerName ? 42 : 32,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    margin: { left: 5, right: 5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 50;

  // Totals
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 35, finalY + 8);
  doc.text(`${sale.totalAmount.toFixed(2)} ETB`, pageWidth - 5, finalY + 8, { align: 'right' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('TOTAL:', pageWidth - 35, finalY + 15);
  doc.text(`${sale.totalAmount.toFixed(2)} ETB`, pageWidth - 5, finalY + 15, { align: 'right' });
  
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Method: ' + sale.paymentMethod.toUpperCase(), 5, finalY + 22);
  
  doc.setDrawColor(230, 230, 230);
  doc.line(5, finalY + 26, pageWidth - 5, finalY + 26);
  
  doc.setFontSize(7);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('Thank you for choosing ' + pharmacyName, pageWidth / 2, finalY + 32, { align: 'center' });
  doc.text('Please keep this receipt for your records.', pageWidth / 2, finalY + 36, { align: 'center' });

  return doc;
};

export const generateInventoryReport = (medicines: Medicine[], pharmacyName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, 'Inventory Status Report', pharmacyName);

  // Summary Cards
  const totalItems = medicines.length;
  const totalStock = medicines.reduce((sum, m) => sum + m.quantity, 0);
  const totalValue = medicines.reduce((sum, m) => sum + (m.quantity * m.price), 0);
  const totalCost = medicines.reduce((sum, m) => sum + (m.quantity * (m.costPrice || 0)), 0);
  const potentialProfit = totalValue - totalCost;
  const lowStock = medicines.filter(m => m.quantity <= m.lowStockThreshold).length;

  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(10, 45, 35, 20, 2, 2, 'F');
  doc.roundedRect(48, 45, 35, 20, 2, 2, 'F');
  doc.roundedRect(86, 45, 40, 20, 2, 2, 'F');
  doc.roundedRect(129, 45, 40, 20, 2, 2, 'F');
  doc.roundedRect(172, 45, 28, 20, 2, 2, 'F');

  doc.setFontSize(7);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text('Total Products', 27.5, 52, { align: 'center' });
  doc.text('Total Units', 65.5, 52, { align: 'center' });
  doc.text('Inventory Value', 106, 52, { align: 'center' });
  doc.text('Potential Profit', 149, 52, { align: 'center' });
  doc.text('Low Stock', 186, 52, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(totalItems.toString(), 27.5, 60, { align: 'center' });
  doc.text(totalStock.toString(), 65.5, 60, { align: 'center' });
  doc.text(`${totalValue.toLocaleString()} ETB`, 106, 60, { align: 'center' });
  
  doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.text(`${potentialProfit.toLocaleString()} ETB`, 149, 60, { align: 'center' });
  
  doc.setTextColor(lowStock > 0 ? COLORS.danger[0] : COLORS.success[0], lowStock > 0 ? COLORS.danger[1] : COLORS.success[1], lowStock > 0 ? COLORS.danger[2] : COLORS.success[2]);
  doc.text(lowStock.toString(), 186, 60, { align: 'center' });

  const tableData = medicines.map(m => [
    m.name,
    m.category,
    m.batchNumber,
    m.quantity.toString(),
    m.price.toLocaleString() + ' ETB',
    (m.price - (m.costPrice || 0)).toLocaleString() + ' ETB',
    m.expiryDate,
    m.quantity <= m.lowStockThreshold ? 'LOW' : 'OK'
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Name', 'Category', 'Batch', 'Stock', 'Price', 'Margin', 'Expiry', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      6: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.cell.text[0] === 'LOW') {
        data.cell.styles.textColor = COLORS.danger;
      }
    }
  });

  drawFooter(doc);
  return doc;
};

export const generateRevenueReport = (data: any[], title: string, subtitle: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, 'Financial Performance Report', title);
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.text(subtitle, 15, 45);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Summary
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.roundedRect(15, 52, 180, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TOTAL REVENUE', 45, 62, { align: 'center' });
  doc.text('TOTAL ORDERS', 105, 62, { align: 'center' });
  doc.text('AVG ORDER VALUE', 165, 62, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalRevenue.toLocaleString()} ETB`, 45, 70, { align: 'center' });
  doc.text(totalOrders.toString(), 105, 70, { align: 'center' });
  doc.text(`${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`, 165, 70, { align: 'center' });

  const tableData = data.map(d => [
    d.label,
    d.revenue.toLocaleString() + ' ETB',
    d.orders.toString(),
    ((d.revenue / totalRevenue) * 100).toFixed(1) + '%'
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Period/Category', 'Revenue', 'Orders', 'Share %']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  drawFooter(doc);
  return doc;
};

export const downloadReceipt = (sale: Sale, pharmacyName: string) => {
  const doc = generateReceiptPDF(sale, pharmacyName);
  doc.save(`receipt-${sale.id?.slice(0, 8) || Date.now()}.pdf`);
};

export const printReceipt = (sale: Sale, pharmacyName: string) => {
  const doc = generateReceiptPDF(sale, pharmacyName);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.contentWindow?.print();
};
