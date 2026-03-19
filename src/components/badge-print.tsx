'use client'

import React from 'react'
import { Participant, ParticipantDetail } from '@/app/actions/participant'
import { QRCodeSVG } from 'qrcode.react'

interface BadgePrintProps {
  participant: Participant | ParticipantDetail
}

export function BadgePrint({ participant }: Readonly<BadgePrintProps>) {
  const p = participant as ParticipantDetail;
  const badgeType = p.attendee_type_code || 'VISITOR';
  const position = p.job_position || '';
  const country = p.residence_country || 'THAILAND';

  return (
    <div className="badge-print-preview">
      <div className="badge-container">
        <div className="header-spacer"></div>

        <div className="content-area">
          <div className="top-group">
            <div className="name-section">
              <div className="name">{p.first_name} {p.last_name}</div>
              <div className="position">{position}</div>
            </div>

            <div className="info-section">
              <div className="company">{p.company_name}</div>
              <div className="country">{country.toUpperCase()}</div>
            </div>
          </div>

          <div className="qr-section">
            <div className="qr-code-wrapper">
              <QRCodeSVG 
                value={p.registration_code || p.registration_uuid} 
                size={150} 
                level="H"
              />
            </div>
          </div>
        </div>

        <div className="footer-content">
          <div className="badge-type">{badgeType}</div>
        </div>
      </div>

      <style jsx>{`
        .badge-print-preview {
          width: 10.5cm;
          height: 13cm;
          background: white;
          color: black;
          overflow: hidden;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .badge-container {
          width: 10.5cm;
          height: 13cm;
          display: flex;
          flex-direction: column;
          background: white;
          overflow: hidden;
        }

        .header-spacer {
          height: 3cm;
          width: 100%;
        }

        .content-area {
          height: 7cm;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          box-sizing: border-box;
          padding: 0.3cm 0.5cm;
        }

        .footer-content {
          height: 3cm;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 0.5cm;
        }

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

        .qr-section {
          margin-top: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 3cm;
        }

        .qr-code-wrapper {
          width: 2.8cm;
          height: 2.8cm;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .qr-code-wrapper :global(svg) {
          width: 100% !important;
          height: 100% !important;
        }

        .badge-type {
          font-size: 18pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #000;
          width: 80%;
        }
      `}</style>
    </div>
  )
}

