'use client'

import type { BusinessMatchingSummary } from '@/app/actions/business-matching-report'

type Props = {
  summary?: BusinessMatchingSummary
  onSelectStampType?: (type: 'stamps-issued' | 'stamps-redeemed', title: string, expectedValue: string) => void
}

export function StampRedemptionBarChart({ summary, onSelectStampType }: Props) {
  if (!summary) {
    return <div className="p-4 text-sm font-semibold text-muted-foreground">No data available</div>
  }

  const totals = summary.totals || {}
  const issued = totals.redemption_stamps_issued || 0
  const redeemed = totals.redemption_stamps_redeemed || 0

  const maxVal = Math.max(issued, redeemed, 10)
  const getPercentHeight = (val: number) => Math.max((val / maxVal) * 80, 6)

  return (
    <div className="flex w-full flex-col items-center justify-between">
      <div className="flex h-36 w-full items-end justify-around border-b border-border/40 pb-2">
        {/* Bar 1: Issued */}
        <button
          type="button"
          onClick={() => onSelectStampType?.('stamps-issued', 'Stamps issued', issued.toLocaleString())}
          className="group flex h-full w-24 flex-col items-center justify-end rounded-md p-1 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="mb-1 text-xs font-bold text-foreground">{issued}</div>
          <div
            className="w-12 rounded-t-md bg-[#087dbc] transition-all duration-300 group-hover:scale-y-105 group-hover:brightness-110"
            style={{ height: `${getPercentHeight(issued)}%` }}
          />
          <span className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase group-hover:text-foreground">
            Issued
          </span>
        </button>

        {/* Bar 2: Redeemed */}
        <button
          type="button"
          onClick={() => onSelectStampType?.('stamps-redeemed', 'Stamps redeemed', redeemed.toLocaleString())}
          className="group flex h-full w-24 flex-col items-center justify-end rounded-md p-1 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="mb-1 text-xs font-bold text-foreground">{redeemed}</div>
          <div
            className="w-12 rounded-t-md bg-[#16a34a] transition-all duration-300 group-hover:scale-y-105 group-hover:brightness-110"
            style={{ height: `${getPercentHeight(redeemed)}%` }}
          />
          <span className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase group-hover:text-foreground">
            Redeemed
          </span>
        </button>
      </div>

      {/* Rate info card */}
      <div className="mt-4 w-full rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Redemption Conversion Rate
        </span>
        <p className="mt-1 font-display text-2xl font-bold text-[#16a34a]">
          {issued > 0 ? `${Math.round((redeemed / issued) * 100)}%` : '0%'}
        </p>
      </div>
    </div>
  )
}
