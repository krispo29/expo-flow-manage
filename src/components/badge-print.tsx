'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Participant, ParticipantDetail } from '@/app/actions/participant'
import { getAttendeeTypeLabel } from '@/lib/attendee-types'
import { QRCodeSVG } from 'qrcode.react'

interface BadgePrintProps {
  participant: Participant | ParticipantDetail
}

const NAME_FIT_MAX_FONT_SIZE_PT = 20
const NAME_FIT_MIN_FONT_SIZE_PT = 10
const POINTS_PER_PIXEL = 72 / 96

function calculateFitFontSizePt(element: HTMLElement) {
  const availableWidth = element.clientWidth
  const requiredWidth = element.scrollWidth
  const currentFontSizePx = Number.parseFloat(window.getComputedStyle(element).fontSize)
  const currentFontSizePt = currentFontSizePx * POINTS_PER_PIXEL

  if (availableWidth <= 0 || requiredWidth <= 0 || currentFontSizePt <= 0) {
    return NAME_FIT_MAX_FONT_SIZE_PT
  }

  const nextFontSize =
    requiredWidth === availableWidth
      ? currentFontSizePt
      : currentFontSizePt * (availableWidth / requiredWidth)

  return Math.max(NAME_FIT_MIN_FONT_SIZE_PT, Math.min(NAME_FIT_MAX_FONT_SIZE_PT, nextFontSize))
}

export function BadgePrint({ participant }: Readonly<BadgePrintProps>) {
  const p = participant as ParticipantDetail & { attendee_type_name?: string; badge_name?: string }
  const nameRef = useRef<HTMLDivElement>(null)
  const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
  const badgeType = p.badge_name || p.attendee_type_name || getAttendeeTypeLabel(p.attendee_type_code) || 'VISITOR'
  const position = p.job_position || ''
  const country = p.residence_country || 'THAILAND'
  const registrationCode = p.registration_code || p.registration_uuid
  const [nameFontSizePt, setNameFontSizePt] = useState(NAME_FIT_MAX_FONT_SIZE_PT)

  useLayoutEffect(() => {
    const nameElement = nameRef.current
    if (!nameElement) {
      return
    }

    let frameId = 0

    const fitName = () => {
      const nextFontSizePt = calculateFitFontSizePt(nameElement)

      setNameFontSizePt((currentFontSizePt) =>
        Math.abs(currentFontSizePt - nextFontSizePt) < 0.05
          ? currentFontSizePt
          : nextFontSizePt
      )
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
    window.addEventListener('resize', scheduleFit)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleFit)
    }
  }, [fullName])

  return (
    <div className="badge-print-preview">
      <section className="badge-print-page">
        <div className="badge-print-container">
          <div className="badge-print-header-spacer" />

          <div className="badge-print-content">
            <div className="badge-print-top-group">
              <div className="badge-print-name-section">
                <div
                  className="badge-print-name"
                  ref={nameRef}
                  style={{ fontSize: `${nameFontSizePt}pt` }}
                >
                  {fullName}
                </div>
                <div className="badge-print-position">{position}</div>
              </div>

              <div className="badge-print-info-section">
                <div className="badge-print-company">{p.company_name}</div>
                <div className="badge-print-country">{country}</div>
              </div>
            </div>

            <div className="badge-print-qr-section">
              <div className="badge-print-qr-frame">
                <QRCodeSVG
                  value={registrationCode}
                  level="M"
                  marginSize={0}
                  size={100}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="badge-print-footer">
            <div className="badge-print-type">{badgeType}</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .badge-print-preview {
          width: 10.5cm;
          height: 13cm;
          background: white;
          color: black;
          overflow: hidden;
          text-align: center;
        }

        .badge-print-page {
          width: 10.5cm;
          height: 13cm;
          overflow: hidden;
          background: #fff;
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
          font-size: 20pt;
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

        .badge-print-type {
          width: 100%;
          color: #000;
          font-size: 30pt;
          font-weight: 900;
          letter-spacing: 2px;
          line-height: 1;
          text-align: center;
          transform: translateY(0.45cm);
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
      `}</style>
    </div>
  )
}
