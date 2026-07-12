"use client"

import { useChartPart } from "./chart-context"

export function XAxis({
  dataKey,
  tickFormatter,
  tickMargin = 8,
  maxTicks = 6,
  minTickSpacing = 64,
}: {
  dataKey?: string
  tickFormatter?: (value: unknown, index: number) => string
  tickMargin?: number
  maxTicks?: number
  minTickSpacing?: number
}) {
  const ctx = useChartPart("XAxis")
  if (!ctx.ready) return null

  const tickCount = Math.max(
    1,
    Math.min(
      ctx.dataLength,
      maxTicks,
      Math.floor(ctx.plot.width / minTickSpacing) + 1
    )
  )
  const tickIndexes = new Set(
    Array.from({ length: tickCount }, (_, index) =>
      tickCount === 1
        ? 0
        : Math.round((index * (ctx.dataLength - 1)) / (tickCount - 1))
    )
  )
  const y = ctx.plot.height + tickMargin

  return (
    <g className="fill-current font-mono text-[10px] text-muted-foreground">
      {ctx.data.map((row, i) => {
        if (!tickIndexes.has(i)) return null
        const raw = dataKey ? row[dataKey] : i
        const label = tickFormatter ? tickFormatter(raw, i) : String(raw ?? "")
        return (
          <text
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the stable x position
            key={i}
            x={ctx.xCenter(i) ?? 0}
            y={y}
            textAnchor="middle"
            dominantBaseline="hanging"
            fill="currentColor"
          >
            {label}
          </text>
        )
      })}
    </g>
  )
}
