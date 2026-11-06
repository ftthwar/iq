import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Receipt, StatsSummary } from '../types';
import { formatIQD, NANO_DEVICE_MODEL } from './rules';

export function exportReceiptsToPDF(receipts: Receipt[], stats: StatsSummary, dateRangeLabel = 'جميع الفترات') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.text('NanoPay - Internet Receipts & PowerBeam Nano Devices Report', 14, 15);
  doc.setFontSize(10);
  doc.text(`Period: ${dateRangeLabel} | Date: ${new Date().toLocaleDateString()}`, 14, 21);

  // Stats Box
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(14, 25, 268, 20, 3, 3, 'F');
  doc.setFontSize(9);
  doc.text(`Total Receipts: ${stats.totalReceiptsCount}`, 18, 32);
  doc.text(`Total Collected: ${stats.totalCollectedCash.toLocaleString()} IQD`, 70, 32);
  doc.text(`Unpaid Cash: ${stats.totalUnpaidCash.toLocaleString()} IQD`, 140, 32);
  doc.text(`Nano PowerBeam Received: ${stats.totalNanoReceivedCount}`, 18, 40);
  doc.text(`Nano PowerBeam Pending: ${stats.totalNanoPendingCount}`, 140, 40);

  const tableRows = receipts.map((r, i) => [
    (i + 1).toString(),
    r.receiptNumber,
    r.subscriberName,
    r.planType === 'three_months' ? `Offer 3M (${r.planPrice}k)` : `Monthly ${r.planPrice}k`,
    r.selectedOptionText,
    `${r.actualCashReceived.toLocaleString()} IQD`,
    r.cashStatus === 'paid' ? 'PAID' : r.cashStatus === 'partial' ? 'PARTIAL' : 'UNPAID',
    r.requiresNano ? (r.nanoReceived ? 'RECEIVED' : 'PENDING') : 'NOT REQUIRED',
    r.employeeName,
    new Date(r.createdAt).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: 48,
    head: [
      [
        '#',
        'Receipt No',
        'Subscriber Name',
        'Plan',
        'Option',
        'Collected Cash',
        'Cash Status',
        'PowerBeam Nano',
        'Registered By',
        'Date',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
    },
    columnStyles: {
      2: { halign: 'left' },
    },
  });

  doc.save(`NanoPay-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function printReceiptVoucher(receipt: Receipt) {
  const printWindow = window.open('', '_blank', 'width=650,height=750');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>سند قبض - ${receipt.receiptNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Cairo', sans-serif;
          margin: 0;
          padding: 20px;
          background: #fff;
          color: #0f172a;
          direction: rtl;
        }
        .box {
          max-width: 500px;
          margin: 0 auto;
          border: 2px solid #059669;
          border-radius: 16px;
          padding: 20px;
          background: #fafaf9;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .title {
          font-size: 18px;
          font-weight: 900;
          color: #065f46;
          margin: 0;
        }
        .badge {
          background: #ecfdf5;
          border: 1px solid #10b981;
          color: #047857;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        .label { color: #64748b; font-weight: 700; }
        .val { font-weight: 800; color: #0f172a; }
        .cash-box {
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          border-radius: 12px;
          padding: 12px;
          margin: 14px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nano-box {
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 12px;
          padding: 10px;
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 800;
        }
        .sigs {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="header">
          <h2 class="title">⚡ NanoPay • سند قبض</h2>
          <span class="badge">${receipt.receiptNumber}</span>
        </div>

        <div class="row">
          <span class="label">اسم المشترك الثلاثي:</span>
          <span class="val" style="font-size: 15px; color: #047857;">${receipt.subscriberName}</span>
        </div>

        <div class="row">
          <span class="label">نوع الاشتراك:</span>
          <span class="val">${receipt.planType === 'three_months' ? `عرض 3 أشهر (${receipt.planPrice} ألف)` : `شهري (${receipt.planPrice} ألف)`}</span>
        </div>

        <div class="row">
          <span class="label">المقبوضات المحددة:</span>
          <span class="val">${receipt.selectedOptionText}</span>
        </div>

        <div class="cash-box">
          <span style="font-weight: 800; color: #065f46;">المبلغ المقبوض:</span>
          <span style="font-weight: 900; font-size: 18px; color: #047857;">
            ${receipt.actualCashReceived.toLocaleString('ar-IQ')} د.ع
          </span>
        </div>

        ${receipt.requiresNano ? `
        <div class="nano-box">
          <span>جهاز النانو (${NANO_DEVICE_MODEL}):</span>
          <span style="color: ${receipt.nanoReceived ? '#15803d' : '#b45309'};">
            ${receipt.nanoReceived ? 'واصل (مستلم)' : 'غير واصل (مؤجل)'}
          </span>
        </div>` : ''}

        <div class="row">
          <span class="label">القائم بالعملية:</span>
          <span class="val">${receipt.employeeName}</span>
        </div>

        <div class="row">
          <span class="label">التاريخ والوقت:</span>
          <span class="val">${new Date(receipt.createdAt).toLocaleString('ar-IQ')}</span>
        </div>

        <div class="sigs">
          <div>توقيع المشترك</div>
          <div>ختم وتوقيع المحاسب</div>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
