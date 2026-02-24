// utils/print-badge.ts

interface PrintBadgeData {
  firstName: string
  lastName: string
  companyName: string
  country: string // ชื่อประเทศ เช่น "THAILAND"
  registrationCode: string
  category?: string // default: "VISITOR"
  eventDate?: string // default: "20-22 May 2026"
  venue?: string
  logoUrl?: string // URL ของ logo (absolute)
  organizerName?: string // default: "VNU Asia Pacific"
}

export function printBadge(data: PrintBadgeData): void {
  const {
    firstName,
    lastName,
    companyName,
    country,
    registrationCode,
    category = 'VISITOR',
    eventDate = '20-22 May 2026',
    venue = 'SAIGON EXHIBITION AND CONVENTION CENTER (SECC), HO CHI MINH CITY',
    logoUrl = 'https://static.thedeft.co/expoflow/ILDEX_VN_LOGO.jpg',
    organizerName = 'VNU Asia Pacific',
  } = data

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow pop-ups to print the badge.')
    return
  }

  printWindow.document.write(`
    <html>
    <head>
      <title>Print Badge - ${registrationCode}</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0; padding: 0; box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body {
          font-family: 'Montserrat', sans-serif;
          padding: 20px;
          background: #f5f5f5;
        }
        .badge-container {
          max-width: 500px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .top-bar {
          height: 8px;
          background: linear-gradient(90deg, #1a5c4c, #2d8b6f) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .header {
          padding: 20px 24px;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
        }
        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .header-right img {
          height: 50px;
          width: auto;
          object-fit: contain;
        }
        .event-info {
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #eee;
        }
        .event-date {
          font-size: 13px;
          font-weight: 600;
          color: #1a5c4c;
          letter-spacing: 1px;
        }
        .event-dot {
          width: 8px; height: 8px;
          background: #1a5c4c !important;
          border-radius: 50%;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .event-venue {
          font-size: 11px;
          color: #1a5c4c;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 500;
        }
        .attendee-section {
          padding: 30px 24px;
          text-align: center;
        }
        .attendee-name {
          font-size: 26px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .attendee-company {
          font-size: 14px;
          color: #1a5c4c;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .attendee-country {
          font-size: 12px;
          color: #d4a853;
          font-weight: 500;
          letter-spacing: 1px;
        }
        .qr-section {
          padding: 20px;
          text-align: center;
        }
        .qr-code {
          width: 140px; height: 140px;
          margin: 0 auto 16px;
          background: white;
          padding: 8px;
          border: 1px solid #ddd;
        }
        .qr-code img { width: 100%; height: 100%; }
        .reg-label {
          font-size: 10px;
          color: #888;
          letter-spacing: 2px;
          margin-bottom: 4px;
          font-weight: 500;
        }
        .reg-code {
          font-size: 22px;
          font-weight: 700;
          color: #1a5c4c;
          letter-spacing: 2px;
        }
        .footer {
          background: #1a5c4c !important;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .footer-category {
          font-size: 18px;
          font-weight: 700;
          color: white;
          letter-spacing: 3px;
        }
        .footer-org { text-align: right; }
        .footer-org-label {
          font-size: 8px;
          color: rgba(255,255,255,0.7);
          letter-spacing: 1px;
          font-weight: 500;
        }
        .footer-org-name {
          font-size: 11px;
          color: white;
          font-weight: 600;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="badge-container">
        <div class="top-bar"></div>
        <div class="header">
          <div class="header-right">
            <img src="${logoUrl}" alt="Event Logo" />
          </div>
        </div>
        <div class="event-info">
          <span class="event-date">${eventDate}</span>
          <span class="event-dot"></span>
          <span class="event-venue">${venue}</span>
        </div>
        <div class="attendee-section">
          <div class="attendee-name">${firstName} ${lastName}</div>
          <div class="attendee-company">${companyName}</div>
          <div class="attendee-country">${country.toUpperCase()}</div>
        </div>
        <div class="qr-section">
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(registrationCode)}" alt="QR Code" />
          </div>
          <div class="reg-label">REGISTRATION CODE</div>
          <div class="reg-code">${registrationCode}</div>
        </div>
        <div class="footer">
          <div class="footer-category">${category}</div>
          <div class="footer-org">
            <div class="footer-org-label">ORGANIZED BY</div>
            <div class="footer-org-name">${organizerName}</div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          var closePrint = function() { window.close(); };
          window.onafterprint = closePrint;
          if (window.matchMedia) {
            var mediaQueryList = window.matchMedia('print');
            mediaQueryList.addListener(function(mql) {
              if (!mql.matches) { closePrint(); }
            });
          }
          setTimeout(function() { window.print(); }, 500);
        }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
