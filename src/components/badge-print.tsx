'use client'

import React from 'react'
import Image from 'next/image'
import { Participant, ParticipantDetail } from '@/app/actions/participant'
import { QRCodeSVG } from 'qrcode.react'

interface BadgePrintProps {
  participant: Participant | ParticipantDetail
}

export function BadgePrint({ participant }: Readonly<BadgePrintProps>) {
  const eventDate = '20-22 May 2026'
  const venue = 'SAIGON EXHIBITION AND CONVENTION CENTER (SECC), HO CHI MINH CITY'
  const logoUrl = 'https://static.thedeft.co/expoflow/ILDEX_VN_LOGO.jpg'
  const organizerName = 'VNU Asia Pacific'

  return (
    <div className="print-badge-container font-montserrat bg-white shadow-xl overflow-hidden w-[500px] text-left">
      <div className="h-2 bg-gradient-to-r from-[#1a5c4c] to-[#2d8b6f]"></div>
      
      <div className="p-[20px_24px] flex justify-end items-start h-[100px]">
        <Image src={logoUrl} alt="Event Logo" width={150} height={50} className="h-[50px] w-auto object-contain" unoptimized />
      </div>

      <div className="p-[12px_24px] flex items-center gap-3 border-b border-[#eee]">
        <span className="text-[13px] font-semibold text-[#1a5c4c] tracking-[1px]">{eventDate}</span>
        <span className="w-2 h-2 bg-[#1a5c4c] rounded-full"></span>
        <span className="text-[11px] text-[#1a5c4c] tracking-[1px] uppercase font-medium">{venue}</span>
      </div>

      <div className="p-[30px_24px] text-center">
        <div className="text-[26px] font-bold text-[#1a1a1a] mb-2 uppercase tracking-[1px] leading-tight">
          {participant.first_name} {participant.last_name}
        </div>
        <div className="text-[14px] text-[#1a5c4c] font-semibold mb-1 uppercase tracking-[1px]">
          {participant.company_name || 'N/A'}
        </div>
        <div className="text-[12px] text-[#d4a853] font-medium tracking-[1px] uppercase">
          {(participant as ParticipantDetail).residence_country?.toUpperCase() || 'THAILAND'}
        </div>
      </div>

      <div className="p-5 text-center">
        <div className="w-[140px] h-[140px] mx-auto mb-4 bg-white p-2 border border-[#ddd]">
          <QRCodeSVG value={participant.registration_code || participant.registration_uuid} size={124} h-full w-full />
        </div>
        <div className="text-[10px] text-[#888] tracking-[2px] mb-1 font-medium">REGISTRATION CODE</div>
        <div className="text-[22px] font-bold text-[#1a5c4c] tracking-[2px]">
          {participant.registration_code}
        </div>
      </div>

      <div className="bg-[#1a5c4c] p-[16px_24px] flex justify-between items-center text-white">
        <div className="text-[18px] font-bold tracking-[3px] uppercase">
          {participant.attendee_type_code || 'VISITOR'}
        </div>
        <div className="text-right">
          <div className="text-[8px] text-white/70 tracking-[1px] font-medium uppercase">Organized by</div>
          <div className="text-[11px] font-semibold">{organizerName}</div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          body > *:not(.print-area) {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-badge-container {
            width: 500px !important;
            box-shadow: none !important;
            margin: auto !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  )
}
