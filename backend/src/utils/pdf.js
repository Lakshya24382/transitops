import PDFDocument from 'pdfkit';

export function createPDF(res, filename) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

export function drawHeader(doc, title) {
  doc.fillColor('#1a1f2e').fontSize(18).font('Helvetica-Bold').text('TransitOps', 40, 40);
  doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text('Smart Transport Operations Platform', 40, 62);
  doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(title, 40, 90);
  doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, 40, 108);
  doc.moveTo(40, 128).lineTo(555, 128).strokeColor('#e5e7eb').stroke();
  return 145; // y-position to start content
}

export function drawTable(doc, startY, headers, rows, colWidths) {
  let y = startY;
  const startX = 40;
  const rowHeight = 22;

  const drawRow = (cells, isHeader = false) => {
    let x = startX;
    if (isHeader) {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#f9fafb');
    }
    doc.fillColor(isHeader ? '#374151' : '#1f2937')
       .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(8);
    cells.forEach((cell, i) => {
      doc.text(String(cell ?? ''), x + 5, y + 6, { width: colWidths[i] - 10, ellipsis: true });
      x += colWidths[i];
    });
    y += rowHeight;
  };

  drawRow(headers, true);
  rows.forEach((row, idx) => {
    if (y > 780) {
      doc.addPage();
      y = 40;
      drawRow(headers, true);
    }
    drawRow(row);
  });

  return y;
}
