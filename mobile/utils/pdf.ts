import * as Print from 'expo-print';
import { CompanyDetails, TimeEntry } from './storage';
import * as FileSystem from 'expo-file-system';

export const generateInvoicePDF = async (
  companyDetails: CompanyDetails,
  timeEntries: TimeEntry[],
  month: string,
  year: number
): Promise<string> => {
  try {
    const html = generateInvoiceHTML(companyDetails, timeEntries, month, year);
    
    // Generate PDF in cache directory
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const generateInvoiceHTML = (
  companyDetails: CompanyDetails,
  timeEntries: TimeEntry[],
  month: string,
  year: number
) => {
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const hourlyRate = parseFloat(companyDetails.hourlyRate || '0');
  const totalAmount = totalHours * hourlyRate;
  const invoiceNumber = `INV-${year}${month.substring(0, 3).toUpperCase()}`;

  const entriesHTML = timeEntries
    .map(
      (entry) => `
      <tr>
        <td>${new Date(entry.date).toLocaleDateString()}</td>
        <td>${entry.hours}</td>
        <td>${entry.notes || ''}</td>
        <td style="text-align: right">$${(entry.hours * hourlyRate).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          margin-bottom: 40px;
        }
        .invoice-title {
          font-size: 28px;
          color: #007AFF;
          margin-bottom: 10px;
        }
        .invoice-number {
          color: #666;
          margin-bottom: 20px;
        }
        .company-details {
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .period {
          margin-bottom: 30px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f5f5f5;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        .total-section {
          margin-top: 30px;
          text-align: right;
        }
        .total-row {
          font-size: 18px;
          font-weight: bold;
          margin-top: 10px;
        }
        .payment-details {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .payment-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="invoice-title">Invoice</div>
        <div class="invoice-number">${invoiceNumber}</div>
        <div class="company-details">
          <strong>${companyDetails.name}</strong><br/>
          ${companyDetails.address}<br/>
          ABN: ${companyDetails.abn}<br/>
          Phone: ${companyDetails.phone}<br/>
          Email: ${companyDetails.email}
        </div>
        <div class="period">
          <strong>Billing Period:</strong> ${month} ${year}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Hours</th>
            <th>Description</th>
            <th style="text-align: right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${entriesHTML}
        </tbody>
      </table>

      <div class="total-section">
        <div>Total Hours: ${totalHours}</div>
        <div>Rate: $${hourlyRate}/hour</div>
        <div class="total-row">Total Amount: $${totalAmount.toFixed(2)}</div>
      </div>

      <div class="payment-details">
        <div class="payment-title">Payment Details</div>
        <div>Bank: ${companyDetails.bankName}</div>
        <div>BSB: ${companyDetails.bankBSB}</div>
        <div>Account: ${companyDetails.bankAccount}</div>
      </div>
    </body>
    </html>
  `;
}; 