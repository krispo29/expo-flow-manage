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

const PRINT_WINDOW_FEATURES = "popup=yes,width=1100,height=900"
const NAME_FIT_MAX_FONT_SIZE_PT = 20
const NAME_FIT_MIN_FONT_SIZE_PT = 10

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function getBadgeType(data: PrintBadgeData) {
  return data.badgeType || data.category || "VISITOR"
}

function getQrCodeUrl(registrationCode: string) {
  const params = new URLSearchParams({
    data: registrationCode,
    ecc: "M",
    margin: "0",
    size: "100x100",
  })

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`
}

const getBadgeStyles = () => `
  @page {
    size: 10.5cm 13cm;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    width: auto;
    height: auto;
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .badge-print-root {
    display: block;
    width: auto;
    max-width: none;
    margin: 0;
    padding: 0;
    gap: 0;
  }

  .badge-print-page {
    display: block;
    width: 10.5cm;
    height: 13cm;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #fff;
    page-break-after: always;
    page-break-inside: avoid;
    break-after: page;
    break-inside: avoid;
  }

  .badge-print-page:last-of-type {
    page-break-after: auto;
    break-after: auto;
  }

  .badge-print-container {
    position: relative;
    display: flex;
    width: 10.5cm;
    height: 13cm;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
  }

  .badge-print-header-spacer {
    width: 100%;
    height: 1.95cm;
  }

  .badge-print-content {
    display: flex;
    width: 100%;
    height: 6.55cm;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 0.25cm 0.5cm 0.15cm;
    text-align: center;
  }

  .badge-print-top-group {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
  }

  .badge-print-name-section {
    margin-bottom: 5px;
  }

  .badge-print-name {
    width: 100%;
    max-width: 9.5cm;
    overflow: hidden;
    color: #000;
    font-size: ${NAME_FIT_MAX_FONT_SIZE_PT}pt;
    font-weight: 700;
    line-height: 1;
    text-overflow: clip;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .badge-print-position {
    margin-top: 2px;
    color: #000;
    font-size: 13pt;
    font-weight: 400;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .badge-print-info-section {
    max-width: 9.5cm;
    margin: 5px 0;
  }

  .badge-print-company {
    color: #333;
    font-size: 13pt;
    font-weight: 400;
    line-height: 1.2;
  }

  .badge-print-country {
    margin-top: 2px;
    color: #333;
    font-size: 13pt;
    font-weight: 400;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .badge-print-qr-section {
    display: flex;
    min-height: 2.15cm;
    margin-top: auto;
    align-items: center;
    justify-content: center;
  }

  .badge-print-qr-frame {
    display: flex;
    width: 2cm;
    height: 2cm;
    align-items: center;
    justify-content: center;
    background: #fff;
  }

  .badge-print-qr-frame img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .badge-print-footer {
    display: flex;
    width: 100%;
    height: 3cm;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0.5cm;
  }

  .badge-print-type {
    width: 100%;
    color: #000;
    font-size: 30pt;
    font-weight: 900;
    letter-spacing: 2px;
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
    transform: translateY(0.45cm);
  }

  @media print {
    html,
    body {
      width: auto;
      height: auto;
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .badge-print-root {
      display: block !important;
      width: auto !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
    }

    .badge-print-page {
      display: block !important;
      width: 10.5cm !important;
      height: 13cm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      page-break-after: always;
      page-break-inside: avoid;
      break-after: page;
      break-inside: avoid;
    }

    .badge-print-page:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }
  }
`

const getNameFitScript = () => `
  function fitBadgeNames() {
    var maxFontSizePt = ${NAME_FIT_MAX_FONT_SIZE_PT};
    var minFontSizePt = ${NAME_FIT_MIN_FONT_SIZE_PT};
    var pointsPerPixel = 72 / 96;
    var names = document.querySelectorAll('.badge-print-name');

    names.forEach(function (nameElement) {
      nameElement.style.fontSize = maxFontSizePt + 'pt';

      var availableWidth = nameElement.clientWidth;
      var requiredWidth = nameElement.scrollWidth;
      var currentFontSizePx = parseFloat(window.getComputedStyle(nameElement).fontSize);
      var currentFontSizePt = currentFontSizePx * pointsPerPixel;

      if (availableWidth <= 0 || requiredWidth <= 0 || currentFontSizePt <= 0) {
        return;
      }

      var nextFontSizePt = requiredWidth <= availableWidth
        ? currentFontSizePt
        : currentFontSizePt * (availableWidth / requiredWidth);

      nextFontSizePt = Math.max(minFontSizePt, Math.min(maxFontSizePt, nextFontSizePt));
      nameElement.style.fontSize = nextFontSizePt.toFixed(2) + 'pt';
    });
  }

  window.addEventListener('resize', fitBadgeNames);
`

const generateBadgeHtml = (data: PrintBadgeData) => {
  const firstName = escapeHtml(data.firstName || "")
  const lastName = escapeHtml(data.lastName || "")
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const position = escapeHtml(data.position || "")
  const companyName = escapeHtml(data.companyName || "")
  const country = escapeHtml(data.country || "")
  const registrationCode = data.registrationCode || ""
  const badgeType = escapeHtml(getBadgeType(data))
  const qrCodeUrl = escapeHtml(getQrCodeUrl(registrationCode))

  return `
    <section class="badge-print-page">
      <div class="badge-print-container">
        <div class="badge-print-header-spacer"></div>

        <div class="badge-print-content">
          <div class="badge-print-top-group">
            <div class="badge-print-name-section">
              <div class="badge-print-name">${fullName}</div>
              <div class="badge-print-position">${position}</div>
            </div>

            <div class="badge-print-info-section">
              <div class="badge-print-company">${companyName}</div>
              <div class="badge-print-country">${country}</div>
            </div>
          </div>

          <div class="badge-print-qr-section">
            <div class="badge-print-qr-frame">
              <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
          </div>
        </div>

        <div class="badge-print-footer">
          <div class="badge-print-type">${badgeType}</div>
        </div>
      </div>
    </section>
  `
}

function writePrintDocument(
  printWindow: Window,
  title: string,
  badgesHtml: string,
  delayMs: number
) {
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>${getBadgeStyles()}</style>
      </head>
      <body>
        <main class="badge-print-root">
          ${badgesHtml}
        </main>
        <script>
          ${getNameFitScript()}

          window.onload = function () {
            window.setTimeout(function () {
              fitBadgeNames();
              window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                  window.print();
                  window.onafterprint = function () {
                    window.close();
                  };
                });
              });
            }, ${delayMs});
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

export function printBadge(data: PrintBadgeData): void {
  const printWindow = window.open("", "_blank", PRINT_WINDOW_FEATURES)
  if (!printWindow) {
    alert("Please allow pop-ups to print the badge.")
    return
  }

  writePrintDocument(
    printWindow,
    `Print Badge - ${data.firstName} ${data.lastName}`,
    generateBadgeHtml(data),
    500
  )
}

export function printBadges(dataArray: PrintBadgeData[]): void {
  if (!dataArray || dataArray.length === 0) return

  const printWindow = window.open("", "_blank", PRINT_WINDOW_FEATURES)
  if (!printWindow) {
    alert("Please allow pop-ups to print the badge.")
    return
  }

  writePrintDocument(
    printWindow,
    "Print Badges Bulk",
    dataArray.map(generateBadgeHtml).join(""),
    Math.max(500, dataArray.length * 100)
  )
}
