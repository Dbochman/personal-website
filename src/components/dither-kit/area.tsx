"use client"

import { type ReactNode, useEffect } from "react"
import {
  type AreaVariant,
  type SeriesKind,
  type StrokeVariant,
  useChartPart,
} from "./chart-context"
import { SeriesContext } from "./series-context"

export type SeriesProps = {
  dataKey: string
  variant?: AreaVariant
  strokeVariant?: StrokeVariant
  isClickable?: boolean
  children?: ReactNode
}

function CartesianSeries({
  part,
  kind,
  dataKey,
  variant = "gradient",
  strokeVariant = "solid",
  isClickable = false,
  children,
}: SeriesProps & { part: string; kind: SeriesKind }) {
  const ctx = useChartPart(part, kind === "line" ? "line" : "area")
  const { registerSeries, unregisterSeries } = ctx

  useEffect(() => {
    registerSeries({ dataKey, kind, variant, strokeVariant })
    return () => unregisterSeries(dataKey)
  }, [dataKey, kind, variant, strokeVariant, registerSeries, unregisterSeries])

  const band = ctx.bands[dataKey]
  if (!ctx.ready || !band) return null

  const seed = ctx.seedOf(dataKey)
  const emphasis = ctx.selectedDataKey ?? ctx.focusDataKey
  const dimmed = emphasis !== null && emphasis !== dataKey
  const onClick = isClickable
    ? () => ctx.selectDataKey(ctx.selectedDataKey === dataKey ? null : dataKey)
    : undefined

  let hitPath: string | null = null
  if (isClickable) {
    const parts: string[] = []
    band.forEach((point, index) => {
      parts.push(
        `${index === 0 ? "M" : "L"}${ctx.xCenter(index)},${ctx.y(point[1])}`
      )
    })
    for (let index = band.length - 1; index >= 0; index -= 1) {
      parts.push(`L${ctx.xCenter(index)},${ctx.y(band[index][0])}`)
    }
    hitPath = `${parts.join(" ")} Z`
  }

  return (
    <>
      {hitPath && (
        <path
          d={hitPath}
          fill="transparent"
          style={{ cursor: "pointer" }}
          onClick={onClick}
        />
      )}
      <SeriesContext.Provider value={{ dataKey, seed, dimmed }}>
        {children}
      </SeriesContext.Provider>
    </>
  )
}

export type AreaProps = SeriesProps

/** One area series — dithered fill from the value line down to its floor. */
export function Area(props: AreaProps) {
  return <CartesianSeries part="Area" kind="area" {...props} />
}

/** One line series — bright line with a thin dither glow hugging it. */
export function Line(props: AreaProps) {
  return <CartesianSeries part="Line" kind="line" {...props} />
}
