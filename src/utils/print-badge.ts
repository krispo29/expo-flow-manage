// utils/print-badge.ts

export interface PrintBadgeData {
  firstName: string
  lastName: string
  companyName: string
  country: string
  registrationCode: string
  position?: string
  category?: string
  badgeType?: string
}

const getBadgeStyles = () => `
  /* 1. ตั้งค่าหน้ากระดาษ */
  @page {
    size: 10.5cm 13cm;
    margin: 0;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* 2. Container ขนาดเท่าบัตรจริง */
  .badge-container {
    width: 10.5cm;
    height: 13cm;
    display: flex;
    flex-direction: column;
    background: transparent;
    overflow: hidden;
    position: relative;
  }

  @media print {
    .page-break {
      page-break-after: always;
    }
  }

  /* 3. ส่วนหัวเว้น 3cm (อาจเป็นโลโก้ของลูกค้า) */
  .header-spacer {
    height: 3cm;
    width: 100%;
  }

  /* 4. พื้นที่ 7cm ตรงกลาง (โซนที่พิมพ์ลงกระดาษจริง) */
  .content-area {
    height: 7cm;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* กระจายเนื้อหาให้อยู่บน-ล่างของ 7cm */
    align-items: center;
    text-align: center;
    box-sizing: border-box;
    padding: 0.3cm 0.5cm; /* เว้นระยะขอบในพื้นที่ 7cm */
  }

  /* 5. ส่วนท้าย 3cm สำหรับ Badge Type เท่านั้น */
  .footer-content {
    height: 3cm;
    width: 100%;
    display: flex;
    align-items: center; /* จัดกึ่งกลางแนวตั้งของ 3cm */
    justify-content: center; /* จัดกึ่งกลางแนวนอน */
    box-sizing: border-box;
    padding: 0.5cm;
  }

  /* --- จัดกลุ่ม Name และ Position เพื่อให้อยู่ด้านบนของ content-area --- */
  .top-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .name-section {
    margin-bottom: 5px;
  }

  .name {
    font-size: 30pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.1;
    color: #000;
  }

  .position {
    font-size: 15pt;
    font-weight: bold;
    color: #000;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .info-section {
    margin: 5px 0;
    max-width: 9.5cm;
  }

  .company {
    font-size: 13pt;
    color: #333;
    line-height: 1.2;
  }

  .country {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #000;
    margin-top: 2px;
  }

  /* --- QR Code Section --- */
  .qr-section {
    margin-top: auto; /* ผลัก QR code ลงด้านล่างของ content-area */
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 3cm; /* บังคับพื้นที่สำหรับ QR code */
  }

  .qr-code {
    width: 2.8cm;
    height: 2.8cm;
  }

  /* --- Badge Type Style (อยู่ภายใน footer-content) --- */
  .badge-type {
    font-size: 18pt;
    font-weight: 900; /* หนาพิเศษ */
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #000;
    width: 80%;
    text-align: center;
  }
`

const generateBadgeHtml = (data: PrintBadgeData, isLast: boolean = true) => {
  const {
    firstName,
    lastName,
    position = '',
    companyName,
    country,
    registrationCode,
    category,
    badgeType: bType
  } = data
  
  const badgeType = bType || category || 'VISITOR'

  return `
    <div class="badge-container ${isLast ? '' : 'page-break'}">
      <div class="header-spacer"></div>

      <div class="content-area">
        <div class="top-group">
          <div class="name-section">
            <div class="name">${firstName} ${lastName}</div>
            <div class="position">${position}</div>
          </div>

          <div class="info-section">
            <div class="company">${companyName}</div>
            <div class="country">${country.toUpperCase()}</div>
          </div>
        </div>

        <div class="qr-section">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registrationCode)}"
            class="qr-code"
            alt="QR Code"
          />
        </div>
      </div>

      <div class="footer-content">
        <div class="badge-type">${badgeType}</div>
      </div>
    </div>
  `
}

export function printBadge(data: PrintBadgeData): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow pop-ups to print the badge.')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Badge - ${data.firstName} ${data.lastName}</title>
      <style>${getBadgeStyles()}</style>
    </head>
    <body>
      ${generateBadgeHtml(data)}
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onafterprint = () => window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

export function printBadges(dataArray: PrintBadgeData[]): void {
  if (!dataArray || dataArray.length === 0) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow pop-ups to print the badge.')
    return
  }

  const badgesHtml = dataArray
    .map((data, index) => generateBadgeHtml(data, index === dataArray.length - 1))
    .join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Badges Bulk</title>
      <style>${getBadgeStyles()}</style>
    </head>
    <body>
      ${badgesHtml}
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onafterprint = () => window.close();
          }, ${Math.max(500, dataArray.length * 100)});
        };
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

