import type { AreaVariant } from "./chart-context"
import type { DitherColor } from "./palette"
import { DitherMeter } from "./meter"

export interface DitherBarDatum {
  key: string
  label: string
  value: number
  color: DitherColor
  variant: AreaVariant
  detail?: string
}

export function DitherBarList({
  data,
  ariaLabel,
  max,
  marker,
  valueFormatter = (value) => value.toLocaleString(),
}: {
  data: DitherBarDatum[]
  ariaLabel: string
  max?: number
  marker?: number
  valueFormatter?: (value: number, row: DitherBarDatum) => string
}) {
  const safeMax =
    Number.isFinite(max) && Number(max) > 0
      ? Number(max)
      : Math.max(1, ...data.map((row) => (Number.isFinite(row.value) ? row.value : 0)))

  return (
    <ol role="list" aria-label={ariaLabel} className="space-y-2">
      {data.map((row) => {
        const value = Number.isFinite(row.value) ? Math.max(0, row.value) : 0
        const formattedValue = valueFormatter(value, row)
        return (
          <li key={row.key} className="min-w-0 space-y-1">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 text-xs">
              <span className="min-w-0 break-words font-medium leading-tight">
                {row.label}
              </span>
              <span className="text-right tabular-nums">
                <span className="font-medium">{formattedValue}</span>
                {row.detail && (
                  <span className="ml-1 text-muted-foreground">{row.detail}</span>
                )}
              </span>
            </div>
            <DitherMeter
              value={value}
              max={safeMax}
              marker={marker}
              color={row.color}
              variant={row.variant}
              ariaLabel={row.label}
              ariaValueText={`${row.label}: ${formattedValue}${
                row.detail ? `, ${row.detail}` : ""
              }`}
            />
          </li>
        )
      })}
    </ol>
  )
}
