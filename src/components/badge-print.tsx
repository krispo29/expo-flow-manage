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
    <div className="print-badge-container font-sans glass-elevated overflow-hidden w-[500px] text-left mx-auto my-8 border-none relative group transition-all duration-500 hover:scale-[1.01]">
      {/* Visual Accent for Web Preview */}
      <div className="h-2 bg-aurora-gradient print:bg-primary print:h-2"></div>
      
      <div className="p-8 flex justify-between items-start bg-white/5 print:bg-white">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 print:text-primary">Official Badge</div>
          <div className="text-sm font-black tracking-tighter text-foreground print:text-black">ExpoFlow v2.0</div>
        </div>
        <Image src={logoUrl} alt="Event Logo" width={140} height={40} className="h-10 w-auto object-contain grayscale-0 transition-all group-hover:scale-105" unoptimized />
      </div>

      <div className="px-8 py-4 flex items-center gap-4 border-y border-white/5 bg-white/5 print:bg-white print:border-black/10">
        <div className="flex flex-col">
          <span className="text-[12px] font-black text-primary tracking-widest uppercase">{eventDate}</span>
          <span className="text-[9px] text-muted-foreground font-bold tracking-[0.1em] uppercase leading-tight mt-1">{venue}</span>
        </div>
      </div>

      <div className="p-10 text-center bg-white/10 print:bg-white">
        <div className="text-4xl font-black text-foreground mb-3 uppercase tracking-tight font-display print:text-black leading-none">
          {participant.first_name} {participant.last_name}
        </div>
        <div className="text-lg text-primary font-bold mb-1 uppercase tracking-wider print:text-primary/80">
          {participant.company_name || 'N/A'}
        </div>
        <div className="text-xs text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60 print:text-black/40">
          {(participant as ParticipantDetail).residence_country?.toUpperCase() || 'THAILAND'}
        </div>
      </div>

      <div className="p-8 text-center relative bg-white/5 print:bg-white">
        <div className="relative inline-block p-4 bg-white rounded-2xl shadow-2xl shadow-primary/10 border border-white/10 group-hover:scale-105 transition-transform print:shadow-none print:border-black/10 print:p-0">
          <QRCodeSVG value={participant.registration_code || participant.registration_uuid} size={140} h-full w-full />
        </div>
        <div className="mt-6">
           <div className="text-[9px] text-muted-foreground tracking-[0.3em] font-black uppercase mb-1 print:text-black/30">Registration Protocol</div>
           <div className="text-3xl font-black text-primary tracking-[0.1em] font-display print:text-black">
             {participant.registration_code}
           </div>
        </div>
      </div>

      <div className="bg-aurora-gradient p-8 flex justify-between items-center text-white print:bg-primary print:text-white">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/60 print:text-white/80">Access Level</div>
          <div className="text-2xl font-black tracking-[0.05em] uppercase leading-none font-display">
            {participant.attendee_type_code || 'VISITOR'}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-[9px] text-white/60 tracking-[0.2em] font-black uppercase mb-1 print:text-white/80">Host Organization</div>
          <div className="text-sm font-black tracking-tight">{organizerName}</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
            border-radius: 0 !important;
            background: white !important;
          }
          .print-badge-container * {
            background-color: transparent !important;
            color: black !important;
            border-color: black !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }
          .print-badge-container .bg-aurora-gradient {
            background-color: black !important;
            color: white !important;
          }
          .print-badge-container .text-primary {
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
