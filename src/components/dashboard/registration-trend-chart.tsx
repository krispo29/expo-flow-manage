"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TrendData {
  date: string
  count: number
}

interface Props {
  data: TrendData[]
}

export function RegistrationTrendChart({ data }: Props) {
  if (!data || data.length === 0) return null

  return (
    <div className="w-full h-[240px] pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(180 60% 50%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(180 60% 50%)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(180, 20%, 20%, 0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fontWeight: 700, fill: 'hsla(180, 35%, 10%, 0.4)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 10, fontWeight: 700, fill: 'hsla(180, 35%, 10%, 0.4)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(180 60% 50%)', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-elevated border-white/10 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{label}</p>
                    <p className="text-sm font-black text-foreground">
                      {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value} 
                      <span className="ml-1 text-[10px] font-medium text-muted-foreground opacity-60 italic">Registrations</span>
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(180 60% 50%)"
            strokeWidth={3}
            fill="url(#registrationGradient)"
            dot={false}
            activeDot={{ 
              r: 6, 
              strokeWidth: 2, 
              stroke: 'white', 
              fill: "hsl(180 60% 50%)",
              className: "shadow-xl"
            }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
