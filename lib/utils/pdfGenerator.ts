import { InvoiceData, InvoiceItem } from '../../types/invoice';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Generate PDF content based on language
export function generateInvoiceHTML(invoice: InvoiceData, language: 'en' | 'ar' = 'en') {
  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  
  const translations = {
    en: {
      invoice: 'Invoice',
      invoiceNumber: 'Invoice #',
      date: 'Date',
      dueDate: 'Due Date',
      billTo: 'Bill To',
      shipTo: 'Ship To',
      item: 'Item',
      description: 'Description',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      amount: 'Amount',
      subtotal: 'Subtotal',
      tax: 'Tax',
      total: 'Total',
      notes: 'Notes',
      thankYou: 'Thank you for your business!'
    },
    ar: {
      invoice: 'فاتورة',
      invoiceNumber: 'رقم الفاتورة',
      date: 'التاريخ',
      dueDate: 'تاريخ الاستحقاق',
      billTo: 'فاتورة إلى',
      shipTo: 'شحن إلى',
      item: 'العنصر',
      description: 'الوصف',
      quantity: 'الكمية',
      unitPrice: 'سعر الوحدة',
      amount: 'المبلغ',
      subtotal: 'المجموع الفرعي',
      tax: 'الضريبة',
      total: 'المجموع',
      notes: 'ملاحظات',
      thankYou: 'شكراً لتعاملكم معنا!'
    }
  };

  const t = translations[language];

  return `
    <!DOCTYPE html>
    <html lang="${language}" dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.invoice} - ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: ${isRTL ? 'Arial, sans-serif' : 'Arial, sans-serif'};
          margin: 0;
          padding: 20px;
          background: white;
          direction: ${dir};
        }
        .invoice-header {
          text-align: ${isRTL ? 'right' : 'left'};
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }
        .invoice-number {
          font-size: 18px;
          color: #666;
          margin: 10px 0;
        }
        .invoice-dates {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
        }
        .address-section {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
        }
        .address-box {
          flex: 1;
          margin: ${isRTL ? '0 0 0 20px' : '0 20px 0 0'};
        }
        .address-label {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        .address-content {
          color: #666;
          line-height: 1.5;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        .items-table th {
          background: #f5f5f5;
          padding: 12px;
          text-align: ${isRTL ? 'right' : 'left'};
          border-bottom: 1px solid #ddd;
          font-weight: bold;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          text-align: ${isRTL ? 'right' : 'left'};
        }
        .total-section {
          text-align: ${isRTL ? 'left' : 'right'};
          margin: 30px 0;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          font-size: 16px;
        }
        .total-row.grand-total {
          font-size: 20px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        .notes-section {
          margin: 30px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h1 class="invoice-title">${t.invoice}</h1>
        <div class="invoice-number">${t.invoiceNumber} ${invoice.invoiceNumber}</div>
      </div>
      
      <div class="invoice-dates">
        <div><strong>${t.date}:</strong> ${new Date(invoice.date).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}</div>
        <div><strong>${t.dueDate}:</strong> ${new Date(invoice.dueDate).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}</div>
      </div>
      
      <div class="address-section">
        <div class="address-box">
          <div class="address-label">${t.billTo}:</div>
          <div class="address-content">
            ${invoice.billTo.name}<br>
            ${invoice.billTo.address}<br>
            ${invoice.billTo.city}, ${invoice.billTo.state} ${invoice.billTo.zip}<br>
            ${invoice.billTo.country}
          </div>
        </div>
        <div class="address-box">
          <div class="address-label">${t.shipTo}:</div>
          <div class="address-content">
            ${invoice.shipTo.name}<br>
            ${invoice.shipTo.address}<br>
            ${invoice.shipTo.city}, ${invoice.shipTo.state} ${invoice.shipTo.zip}<br>
            ${invoice.shipTo.country}
          </div>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>${t.item}</th>
            <th>${t.description}</th>
            <th>${t.quantity}</th>
            <th>${t.unitPrice}</th>
            <th>${t.amount}</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item: InvoiceItem) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-row">
          <span>${t.subtotal}:</span>
          <span>$${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>${t.tax}:</span>
          <span>$${invoice.tax.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
          <span>${t.total}:</span>
          <span>$${invoice.total.toFixed(2)}</span>
        </div>
      </div>
      
      ${invoice.notes ? `
        <div class="notes-section">
          <strong>${t.notes}:</strong><br>
          ${invoice.notes}
        </div>
      ` : ''}
      
      <div class="footer">
        <p>${t.thankYou}</p>
      </div>
    </body>
    </html>
  `;
}

// Generate and download PDF
export async function generateAndDownloadPDF(invoice: InvoiceData, language: 'en' | 'ar' = 'en') {
  if (!isClient) {
    throw new Error('PDF generation is only available on the client side');
  }

  try {
    const html2pdf = await import('html2pdf.js');
    const html = generateInvoiceHTML(invoice, language);
    
    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);
    
    const opt = {
      margin: 1,
      filename: `invoice-${invoice.invoiceNumber}-${language}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        direction: language === 'ar' ? 'rtl' : 'ltr'
      }
    };
    
    await html2pdf.default().from(element).set(opt).save();
    document.body.removeChild(element);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Alternative PDF generation method using blob
export async function generatePDFBlob(invoice: InvoiceData, language: 'en' | 'ar' = 'en'): Promise<Blob> {
  if (!isClient) {
    throw new Error('PDF generation is only available on the client side');
  }

  try {
    const html2pdf = await import('html2pdf.js');
    const html = generateInvoiceHTML(invoice, language);
    
    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);
    
    const opt = {
      margin: 1,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        direction: language === 'ar' ? 'rtl' : 'ltr'
      }
    };
    
    const pdf = await html2pdf.default().from(element).set(opt).outputPdf('blob');
    document.body.removeChild(element);
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw error;
  }
}

// Download PDF from blob
export function downloadPDFFromBlob(blob: Blob, filename: string) {
  if (!isClient) {
    throw new Error('Download is only available on the client side');
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Fallback download method
export function downloadPDFAlternative(html: string, filename: string) {
  if (!isClient) {
    throw new Error('Download is only available on the client side');
  }

  const element = document.createElement('div');
  element.innerHTML = html;
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  document.body.appendChild(element);
  
  window.print();
  
  setTimeout(() => {
    document.body.removeChild(element);
  }, 1000);
}
