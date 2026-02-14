'use client'

import React from 'react'
import { Participant } from '@/lib/mock-service'
import { QRCodeSVG } from 'qrcode.react'

interface BadgePrintProps {
  participant: Participant
}

export function BadgePrint({ participant }: BadgePrintProps) {
  return (
    <div className="print-badge w-[4in] h-[6in] border border-gray-200 bg-white p-4 flex flex-col items-center justify-between text-center mx-auto mb-8 break-after-page relative overflow-hidden">
      {/* Header / Logo Area */}
      <div className="w-full pt-8">
        <div className="text-3xl font-bold uppercase tracking-wider text-primary">
          EXPO FLOW
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          MANAGEMENT 2024
        </div>
      </div>

      {/* Participant Info */}
      <div className="w-full flex-1 flex flex-col justify-center gap-2">
        <h1 className="text-4xl font-extrabold text-slate-900 break-words leading-tight">
          {participant.firstName} {participant.lastName}
        </h1>
        <h2 className="text-xl text-slate-600 font-medium mt-2">
          {participant.position || 'Visitor'}
        </h2>
        <h3 className="text-lg text-slate-500 font-medium">
          {participant.company || 'N/A'}
        </h3>
      </div>

      {/* Footer / QR / Type */}
      <div className="w-full flex flex-col items-center gap-4 pb-8">
        <div className="border-4 border-slate-900 p-2 rounded-lg">
           <QRCodeSVG value={participant.code || participant.id} size={120} />
        </div>
        
        <div className="w-full border-t-2 border-slate-200 pt-4 mt-2">
             <span className="inline-block bg-slate-900 text-white text-xl font-bold px-6 py-2 rounded-full uppercase tracking-widest">
                {participant.type}
            </span>
             <div className="text-xs text-slate-400 mt-2 font-mono">
                {participant.code}
            </div>
        </div>
      </div>

       <style jsx global>{`
        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print-badge {
            border: none;
            width: 100vw;
            height: 100vh;
            margin: 0;
            break-after: page;
          }
           /* Hide everything else */
          body > *:not(.print-area) {
            display: none;
          }
          .print-area {
            display: block;
            width: 100%;
            height: 100%;
          }
        }
      `}</style>
    </div>
  )
}
