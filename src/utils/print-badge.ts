// utils/print-badge.ts

import { getAttendeeTypeLabel } from "@/lib/attendee-types"
import { findCountryByCodeOrName, getCountryDisplayName, getCountryNameFromValue } from "@/lib/countries"
import { isThailabBadgeProject, THAILAB_BADGE_PROJECT_CODE } from "@/components/print/thailab-badge-card"

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
  return (getAttendeeTypeLabel(data.badgeType || data.category) || "VISITOR").toUpperCase()
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
    flex-direction: column;
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

  .badge-print-registration-code {
    margin-top: 0.10cm;
    font-size: 8pt;
    font-weight: 400;
    line-height: 1;
    white-space: nowrap;
    color: #000;
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

const getThailabBadgeStyles = () => `
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

  .thailab-badge-container {
    display: flex;
    width: 10.5cm;
    height: 13cm;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
    text-align: center;
  }

  .thailab-badge-header-spacer {
    flex: 0 0 4.9cm;
    height: 4.9cm;
  }

  .thailab-badge-content {
    display: flex;
    height: 6.75cm;
    flex: 0 0 6.75cm;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    padding: 0.1cm 0.5cm;
  }

  .thailab-badge-info {
    display: grid;
    width: 100%;
    height: 2.7cm;
    max-width: 9.5cm;
    grid-template-rows: 0.65cm 0.42cm 1.05cm 0.50cm;
    row-gap: 0.0267cm;
  }

  .thailab-badge-name,
  .thailab-badge-position,
  .thailab-badge-company,
  .thailab-badge-country,
  .thailab-badge-registration-code,
  .thailab-badge-type {
    overflow: hidden;
    color: #000;
    text-overflow: clip;
  }

  .thailab-badge-name {
    white-space: nowrap;
    font-size: 20pt;
    font-weight: 700;
    line-height: 1;
    text-transform: uppercase;
  }

  .thailab-badge-position {
    height: 0.42cm;
    font-size: 13pt;
    font-weight: 400;
    line-height: 0.42cm;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .thailab-badge-company {
    display: -webkit-box;
    height: 1.05cm;
    font-size: 13pt;
    font-weight: 400;
    line-height: 1.15;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow-wrap: anywhere;
  }

  .thailab-badge-country {
    height: 0.50cm;
    font-size: 13pt;
    font-weight: 400;
    line-height: 0.50cm;
    white-space: nowrap;
    text-transform: uppercase;
  }

  .thailab-badge-qr-group {
    display: flex;
    margin-top: 0.15cm;
    flex-direction: column;
    align-items: center;
  }

  .thailab-badge-qr {
    display: flex;
    width: 2.2cm;
    height: 2.2cm;
    align-items: center;
    justify-content: center;
    background: #fff;
  }

  .thailab-badge-qr img {
    display: block;
    width: 2cm;
    height: 2cm;
  }

  .thailab-badge-registration-code {
    margin-top: 0.10cm;
    font-size: 8pt;
    font-weight: 400;
    line-height: 1;
    white-space: nowrap;
  }

  .thailab-badge-type {
    width: 100%;
    margin-top: auto;
    font-size: 26pt;
    font-weight: 900;
    letter-spacing: 2px;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .thailab-badge-footer-spacer {
    flex: 0 0 1.35cm;
    height: 1.35cm;
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

const getThailabFitScript = () => `
  function fitThailabBadges() {
    var pointsPerPixel = 72 / 96;

    document.querySelectorAll('.thailab-badge-name').forEach(function (el) {
      el.style.fontSize = '20pt';
      var availableWidth = el.clientWidth;
      var requiredWidth = el.scrollWidth;
      var currentFontSizePx = parseFloat(window.getComputedStyle(el).fontSize);
      var currentFontSizePt = currentFontSizePx * pointsPerPixel;
      if (availableWidth > 0 && requiredWidth > 0 && currentFontSizePt > 0) {
        var nextPt = requiredWidth <= availableWidth ? currentFontSizePt : currentFontSizePt * (availableWidth / requiredWidth);
        nextPt = Math.max(8, Math.min(20, nextPt));
        el.style.fontSize = nextPt.toFixed(2) + 'pt';
      }
    });

    document.querySelectorAll('.thailab-badge-position').forEach(function (el) {
      el.style.fontSize = '13pt';
      var availableWidth = el.clientWidth;
      var requiredWidth = el.scrollWidth;
      var currentFontSizePx = parseFloat(window.getComputedStyle(el).fontSize);
      var currentFontSizePt = currentFontSizePx * pointsPerPixel;
      if (availableWidth > 0 && requiredWidth > 0 && currentFontSizePt > 0) {
        var nextPt = requiredWidth <= availableWidth ? currentFontSizePt : currentFontSizePt * (availableWidth / requiredWidth);
        nextPt = Math.max(8, Math.min(13, nextPt));
        el.style.fontSize = nextPt.toFixed(2) + 'pt';
      }
    });

    document.querySelectorAll('.thailab-badge-company').forEach(function (el) {
      el.style.fontSize = '13pt';
      var clientHeight = el.clientHeight;
      var scrollHeight = el.scrollHeight;
      var clientWidth = el.clientWidth;
      var scrollWidth = el.scrollWidth;
      var currentFontSizePx = parseFloat(window.getComputedStyle(el).fontSize);
      var currentFontSizePt = currentFontSizePx * pointsPerPixel;
      if (clientHeight > 0 && scrollHeight > 0 && clientWidth > 0 && scrollWidth > 0 && currentFontSizePt > 0) {
        var heightRatio = clientHeight / scrollHeight;
        var widthRatio = clientWidth / scrollWidth;
        var fitRatio = Math.min(heightRatio, widthRatio);
        var nextPt = Math.max(8, Math.min(13, currentFontSizePt * fitRatio));
        el.style.fontSize = nextPt.toFixed(2) + 'pt';
      }
    });
  }

  window.addEventListener('resize', fitThailabBadges);
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
            <div class="badge-print-registration-code">${escapeHtml(registrationCode)}</div>
          </div>
        </div>

        <div class="badge-print-footer">
          <div class="badge-print-type">${badgeType}</div>
        </div>
      </div>
    </section>
  `
}

const generateThailabBadgeHtml = (data: PrintBadgeData) => {
  const firstName = escapeHtml(data.firstName || "")
  const lastName = escapeHtml(data.lastName || "")
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const position = escapeHtml(data.position || "")
  const companyName = escapeHtml(data.companyName || "")
  
  const countryObj = findCountryByCodeOrName(data.country)
  const displayCountryText = countryObj
    ? getCountryDisplayName(countryObj, THAILAB_BADGE_PROJECT_CODE)
    : (data.country || getCountryNameFromValue(data.country, ""))
  const country = escapeHtml(displayCountryText)

  const registrationCode = data.registrationCode || ""
  const badgeType = escapeHtml(getBadgeType(data))
  const qrCodeUrl = escapeHtml(getQrCodeUrl(registrationCode))

  return `
    <section class="badge-print-page thailab-badge-page">
      <div class="thailab-badge-container">
        <div class="thailab-badge-header-spacer"></div>

        <div class="thailab-badge-content">
          <div class="thailab-badge-info">
            <div class="thailab-badge-name">${fullName}</div>
            <div class="thailab-badge-position">${position}</div>
            <div class="thailab-badge-company">${companyName}</div>
            <div class="thailab-badge-country">${country}</div>
          </div>

          <div class="thailab-badge-qr-group">
            <div class="thailab-badge-qr">
              <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
            <div class="thailab-badge-registration-code">${escapeHtml(registrationCode)}</div>
          </div>

          <div class="thailab-badge-type">${badgeType}</div>
        </div>

        <div class="thailab-badge-footer-spacer"></div>
      </div>
    </section>
  `
}

function writePrintDocument(
  printWindow: Window,
  title: string,
  badgesHtml: string,
  styles: string,
  fitScript: string,
  fitFunctionName: string,
  delayMs: number
) {
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>${styles}</style>
      </head>
      <body>
        <main class="badge-print-root">
          ${badgesHtml}
        </main>
        <script>
          ${fitScript}

          window.onload = function () {
            window.setTimeout(function () {
              ${fitFunctionName}();
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

export function printBadge(data: PrintBadgeData, projectCode?: string): void {
  const printWindow = window.open("", "_blank", PRINT_WINDOW_FEATURES)
  if (!printWindow) {
    alert("Please allow pop-ups to print the badge.")
    return
  }

  const isThailab = isThailabBadgeProject(projectCode)
  const html = isThailab ? generateThailabBadgeHtml(data) : generateBadgeHtml(data)
  const styles = isThailab ? getThailabBadgeStyles() : getBadgeStyles()
  const fitScript = isThailab ? getThailabFitScript() : getNameFitScript()
  const fitFunctionName = isThailab ? "fitThailabBadges" : "fitBadgeNames"

  writePrintDocument(
    printWindow,
    `Print Badge - ${data.firstName} ${data.lastName}`,
    html,
    styles,
    fitScript,
    fitFunctionName,
    500
  )
}

export function printBadges(dataArray: PrintBadgeData[], projectCode?: string): void {
  if (!dataArray || dataArray.length === 0) return

  const printWindow = window.open("", "_blank", PRINT_WINDOW_FEATURES)
  if (!printWindow) {
    alert("Please allow pop-ups to print the badge.")
    return
  }

  const isThailab = isThailabBadgeProject(projectCode)
  const html = isThailab
    ? dataArray.map(generateThailabBadgeHtml).join("")
    : dataArray.map(generateBadgeHtml).join("")
  const styles = isThailab ? getThailabBadgeStyles() : getBadgeStyles()
  const fitScript = isThailab ? getThailabFitScript() : getNameFitScript()
  const fitFunctionName = isThailab ? "fitThailabBadges" : "fitBadgeNames"

  writePrintDocument(
    printWindow,
    "Print Badges Bulk",
    html,
    styles,
    fitScript,
    fitFunctionName,
    Math.max(500, dataArray.length * 100)
  )
}

