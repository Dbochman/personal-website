import { cn } from "./lib"
import type { AreaVariant } from "./chart-context"
import { ditherPatternStyle } from "./dither-pattern"
import type { DitherColor } from "./palette"

function safeValue(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function DitherMeter({
  value,
  max = 100,
  color = "blue",
  variant = "gradient",
  marker,
  ariaLabel,
  ariaValueText,
  className,
}: {
  value: number
  max?: number
  color?: DitherColor
  variant?: AreaVariant
  marker?: number
  ariaLabel: string
  ariaValueText?: string
  className?: string
}) {
  const safeMax = safeValue(max) || 1
  const safeCurrent = Math.min(safeValue(value), safeMax)
  const width = `${(safeCurrent / safeMax) * 100}%`
  const safeMarker = marker == null ? null : Math.min(safeValue(marker), safeMax)

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeCurrent}
      aria-valuetext={ariaValueText}
      className={cn(
        "relative h-2 overflow-hidden rounded-[2px] bg-muted",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width, ...ditherPatternStyle(color, variant) }}
      />
      {safeMarker != null && (
        <span
          aria-hidden="true"
          className="absolute inset-y-[-2px] w-px bg-foreground/70"
          style={{ left: `${(safeMarker / safeMax) * 100}%` }}
        />
      )}
    </div>
  )
}

export interface DitherCompositionSegment {
  key: string
  label: string
  value: number
  color: DitherColor
  variant: AreaVariant
}

export function DitherComposition({
  segments,
  total,
  ariaLabel,
  className,
}: {
  segments: DitherCompositionSegment[]
  total?: number
  ariaLabel: string
  className?: string
}) {
  const safeSegments = segments.map((segment) => ({
    ...segment,
    value: safeValue(segment.value),
  }))
  const segmentTotal = safeSegments.reduce((sum, segment) => sum + segment.value, 0)
  const safeTotal = safeValue(total ?? segmentTotal) || segmentTotal || 1

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "flex h-2 overflow-hidden rounded-[2px] bg-muted",
        className
      )}
    >
      {safeSegments.map((segment) =>
        segment.value > 0 ? (
          <span
            key={segment.key}
            aria-hidden="true"
            title={segment.label}
            style={{
              width: `${Math.min(100, (segment.value / safeTotal) * 100)}%`,
              ...ditherPatternStyle(segment.color, segment.variant),
            }}
          />
        ) : null
      )}
    </div>
  )
}
