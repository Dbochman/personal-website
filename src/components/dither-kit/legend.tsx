import { useCommonChart } from "./common-context"
import { ditherPatternStyle } from "./dither-pattern"
import { cn } from "./lib"

/** Series/slice legend. With `isClickable`, each entry toggles its selection.
 * Works in every chart family via the shared common context. */
export function Legend({
  isClickable = false,
  align = "right",
  labelFormatter,
  ariaLabelFormatter,
}: {
  isClickable?: boolean
  align?: "left" | "center" | "right"
  labelFormatter?: (name: string, label: string) => string
  ariaLabelFormatter?: (name: string, label: string) => string
}) {
  const chart = useCommonChart()

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-3 px-1",
        align === "right" && "justify-end",
        align === "center" && "justify-center",
        align === "left" && "justify-start"
      )}
    >
      {chart.names.map((name) => {
        const label = chart.labelOf(name)
        const emphasis = chart.selectedDataKey ?? chart.focusDataKey
        const dimmed = emphasis !== null && emphasis !== name
        return (
          <button
            key={name}
            type="button"
            disabled={!isClickable}
            aria-pressed={isClickable ? chart.selectedDataKey === name : undefined}
            aria-label={ariaLabelFormatter?.(name, label)}
            title={label}
            onClick={() =>
              chart.selectDataKey(chart.selectedDataKey === name ? null : name)
            }
            // Hovering an entry spotlights its series so overlapping layers
            // (e.g. two meshed radar polygons) can be told apart at a glance.
            onPointerEnter={() => chart.setFocusDataKey(name)}
            onPointerLeave={() => chart.setFocusDataKey(null)}
            onFocus={() => chart.setFocusDataKey(name)}
            onBlur={() => chart.setFocusDataKey(null)}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-opacity",
              isClickable &&
                "pointer-events-auto cursor-pointer hover:text-foreground",
              dimmed && "opacity-40"
            )}
          >
            <span
              className="size-2 rounded-[1px]"
              style={ditherPatternStyle(
                chart.colorOf(name),
                chart.variantOf(name)
              )}
            />
            {labelFormatter ? labelFormatter(name, label) : label}
          </button>
        )
      })}
    </div>
  )
}

Legend.chartLayer = "dom" as const
