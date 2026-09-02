"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

import {
  findCountryByCodeOrName,
  getCountryDisplayName,
  getCountryNameFromValue,
} from "@/lib/countries"
import type { PrintBadgeData } from "@/utils/print-badge"

export const THAILAB_BADGE_PROJECT_CODE = "THAILAB2026"
export const THAILAB_PROJECT_UUID = "07626a19-001d-4675-addd-3a92e3f46d47"

const NAME_FIT_MAX_FONT_SIZE_PT = 20
const NAME_FIT_MIN_FONT_SIZE_PT = 8
const POSITION_FIT_MAX_FONT_SIZE_PT = 13
const POSITION_FIT_MIN_FONT_SIZE_PT = 8
const COMPANY_FIT_MAX_FONT_SIZE_PT = 13
const COMPANY_FIT_MIN_FONT_SIZE_PT = 8
const POINTS_PER_PIXEL = 72 / 96

export function sanitizeProjectCode(projectCode?: string | null) {
  return projectCode?.trim().replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase() || ""
}

export function isThailabBadgeProject(projectCode?: string | null) {
  if (!projectCode) return false
  const sanitized = sanitizeProjectCode(projectCode)
  return (
    sanitized === THAILAB_BADGE_PROJECT_CODE ||
    sanitized === sanitizeProjectCode(THAILAB_PROJECT_UUID)
  )
}

export function calculateFitFontSizePt(
  element: HTMLElement,
  maxFontSizePt: number,
  minFontSizePt: number
) {
  const availableWidth = element.clientWidth
  const requiredWidth = element.scrollWidth
  const currentFontSizePx = Number.parseFloat(window.getComputedStyle(element).fontSize)
  const currentFontSizePt = currentFontSizePx * POINTS_PER_PIXEL

  if (availableWidth <= 0 || requiredWidth <= 0 || currentFontSizePt <= 0) {
    return maxFontSizePt
  }

  const nextFontSize =
    requiredWidth === availableWidth
      ? currentFontSizePt
      : currentFontSizePt * (availableWidth / requiredWidth)

  return Math.max(minFontSizePt, Math.min(maxFontSizePt, nextFontSize))
}

export function ThailabBadgeCard({ badge }: { badge: PrintBadgeData }) {
  const nameRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef<HTMLDivElement>(null)
  const companyRef = useRef<HTMLDivElement>(null)
  const [nameFontSizePt, setNameFontSizePt] = useState(NAME_FIT_MAX_FONT_SIZE_PT)
  const [positionFontSizePt, setPositionFontSizePt] = useState(POSITION_FIT_MAX_FONT_SIZE_PT)
  const [companyFontSizePt, setCompanyFontSizePt] = useState(COMPANY_FIT_MAX_FONT_SIZE_PT)
  const fullName = [badge.firstName, badge.lastName].filter(Boolean).join(" ").trim()
  
  const countryObj = findCountryByCodeOrName(badge.country)
  const displayCountry = countryObj
    ? getCountryDisplayName(countryObj, THAILAB_BADGE_PROJECT_CODE)
    : (badge.country || getCountryNameFromValue(badge.country, ""))

  useLayoutEffect(() => {
    const nameElement = nameRef.current
    if (!nameElement) {
      return
    }

    let frameId = 0
    const fitName = () => {
      const currentFontSizePt =
        Number.parseFloat(window.getComputedStyle(nameElement).fontSize) * POINTS_PER_PIXEL
      const nextFontSizePt =
        nameElement.clientWidth > 0 && nameElement.scrollWidth > 0 && currentFontSizePt > 0
          ? Math.max(
              NAME_FIT_MIN_FONT_SIZE_PT,
              Math.min(
                NAME_FIT_MAX_FONT_SIZE_PT,
                currentFontSizePt * (nameElement.clientWidth / nameElement.scrollWidth)
              )
            )
          : NAME_FIT_MAX_FONT_SIZE_PT

      setNameFontSizePt((current) => (Math.abs(current - nextFontSizePt) < 0.05 ? current : nextFontSizePt))
    }
    const scheduleFit = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(fitName)
    }
    const resizeObserver = new ResizeObserver(scheduleFit)

    resizeObserver.observe(nameElement)
    if (nameElement.parentElement) {
      resizeObserver.observe(nameElement.parentElement)
    }
    scheduleFit()
    window.addEventListener("resize", scheduleFit)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", scheduleFit)
    }
  }, [fullName])

  useLayoutEffect(() => {
    const positionElement = positionRef.current
    if (!positionElement) {
      return
    }

    let frameId = 0
    const fitPosition = () => {
      const nextFontSizePt = calculateFitFontSizePt(
        positionElement,
        POSITION_FIT_MAX_FONT_SIZE_PT,
        POSITION_FIT_MIN_FONT_SIZE_PT
      )
      setPositionFontSizePt((current) =>
        Math.abs(current - nextFontSizePt) < 0.05 ? current : nextFontSizePt
      )
    }
    const scheduleFit = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(fitPosition)
    }
    const resizeObserver = new ResizeObserver(scheduleFit)

    resizeObserver.observe(positionElement)
    if (positionElement.parentElement) {
      resizeObserver.observe(positionElement.parentElement)
    }
    scheduleFit()
    window.addEventListener("resize", scheduleFit)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", scheduleFit)
    }
  }, [badge.position])

  useLayoutEffect(() => {
    const companyElement = companyRef.current
    if (!companyElement) {
      return
    }

    let frameId = 0
    const fitCompany = () => {
      const currentFontSizePt =
        Number.parseFloat(window.getComputedStyle(companyElement).fontSize) * POINTS_PER_PIXEL
      const clientHeight = companyElement.clientHeight
      const scrollHeight = companyElement.scrollHeight
      const clientWidth = companyElement.clientWidth
      const scrollWidth = companyElement.scrollWidth

      let nextFontSizePt = COMPANY_FIT_MAX_FONT_SIZE_PT
      if (clientHeight > 0 && scrollHeight > 0 && clientWidth > 0 && scrollWidth > 0 && currentFontSizePt > 0) {
        const heightRatio = clientHeight / scrollHeight
        const widthRatio = clientWidth / scrollWidth
        const fitRatio = Math.min(heightRatio, widthRatio)
        nextFontSizePt = Math.max(
          COMPANY_FIT_MIN_FONT_SIZE_PT,
          Math.min(COMPANY_FIT_MAX_FONT_SIZE_PT, currentFontSizePt * fitRatio)
        )
      }

      setCompanyFontSizePt((current) =>
        Math.abs(current - nextFontSizePt) < 0.05 ? current : nextFontSizePt
      )
    }
    const scheduleFit = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(fitCompany)
    }
    const resizeObserver = new ResizeObserver(scheduleFit)

    resizeObserver.observe(companyElement)
    if (companyElement.parentElement) {
      resizeObserver.observe(companyElement.parentElement)
    }
    scheduleFit()
    window.addEventListener("resize", scheduleFit)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", scheduleFit)
    }
  }, [badge.companyName])

  return (
    <section className="badge-print-page thailab-badge-page">
      <div className="thailab-badge-container">
        <div className="thailab-badge-header-spacer" />
        <div className="thailab-badge-content">
          <div className="thailab-badge-info">
            <div
              className="thailab-badge-name"
              data-debug-field="name"
              ref={nameRef}
              style={{ fontSize: `${nameFontSizePt}pt` }}
            >
              {fullName}
            </div>
            <div
              className="thailab-badge-position"
              data-debug-field="position"
              ref={positionRef}
              style={{ fontSize: `${positionFontSizePt}pt` }}
            >
              {badge.position}
            </div>
            <div
              className="thailab-badge-company"
              data-debug-field="company"
              ref={companyRef}
              style={{ fontSize: `${companyFontSizePt}pt` }}
            >
              {badge.companyName}
            </div>
            <div className="thailab-badge-country" data-debug-field="country">
              {displayCountry}
            </div>
          </div>
          <div className="thailab-badge-qr-group">
            <div className="thailab-badge-qr" data-debug-field="qr">
              <QRCodeSVG
                value={badge.registrationCode}
                level="M"
                size={100}
                style={{ height: "2cm", width: "2cm" }}
              />
            </div>
            <div className="thailab-badge-registration-code">{badge.registrationCode}</div>
          </div>
          <div className="thailab-badge-type" data-debug-field="type">
            {badge.badgeType}
          </div>
        </div>
        <div className="thailab-badge-footer-spacer" />
      </div>
      <ThailabBadgePrintStyles />
    </section>
  )
}

export function ThailabBadgePrintStyles() {
  return (
    <style jsx global>{`
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
      .badge-print-root-debug .thailab-badge-container {
        outline: 0.3mm solid rgba(220, 38, 38, 0.9);
      }
      .badge-print-root-debug .thailab-badge-content {
        outline: 0.25mm dashed rgba(22, 163, 74, 0.85);
        outline-offset: -0.25mm;
      }
      .badge-print-root-debug .thailab-badge-name,
      .badge-print-root-debug .thailab-badge-position,
      .badge-print-root-debug .thailab-badge-company,
      .badge-print-root-debug .thailab-badge-country,
      .badge-print-root-debug .thailab-badge-qr,
      .badge-print-root-debug .thailab-badge-registration-code,
      .badge-print-root-debug .thailab-badge-type {
        outline: 0.2mm dashed rgba(37, 99, 235, 0.85);
        outline-offset: 0.4mm;
      }
    `}</style>
  )
}
