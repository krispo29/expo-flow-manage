"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface AttendeeTypeData {
  name: string
  count: number
}

const COLORS = [
  "hsl(180 25% 25%)", // Primary Teal
  "hsl(38 25% 50%)",  // Muted Gold
  "hsl(180 15% 45%)", // Muted Teal
  "hsl(38 20% 70%)",  // Soft Sand
  "hsl(180 10% 30%)", // Dark Slate
  "hsl(180 25% 35%)", // Lighter Teal
  "hsl(180 30% 12%)", // Deep Teal
  "hsl(38 30% 90%)"   // Champagne
]

interface Props {
  data: AttendeeTypeData[]
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold" style={{ fontSize: '11px', fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function AttendeeTypeChart({ data }: Props) {
  if (!data || data.length === 0) return null

  const chartData = data.map(d => ({ name: d.name, value: d.count }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={90}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [typeof value === 'number' ? value.toLocaleString() : value, name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
