"use client"

import { useEffect, useMemo, useRef } from "react"
import { type ChartContextValue, useChart } from "./chart-context"
import {
  backingSize,
  bloomLayerStyle,
  easeInOutCubic,
  paintColumn,
  prefersReducedMotion,
  resample,
} from "./dither-paint"
import { rgb } from "./palette"

type Star = { key: string; xi: number; depth: number; phase: number }
type Surface = { top: number[]; floor: number[] }
type Cell<T> = { current: T }

type LoopArgs = {
  canvas: HTMLCanvasElement
  bloomCanvas: HTMLCanvasElement | null
  cols: number
  rows: number
  state: Cell<ChartContextValue>
  targets: Cell<Record<string, Surface>>
  stars: Cell<Star[]>
  wake: Cell<(() => void) | null>
}

/**
 * Event-driven painter for area and line charts. It schedules frames only while
 * the entrance, geometry, or hover intensity is changing; pointer and context
 * updates wake a single frame when the chart is otherwise idle.
 */
function startCartesianLoop({
  canvas,
  bloomCanvas,
  cols,
  rows,
  state,
  targets,
  stars,
  wake: wakeCell,
}: LoopArgs): (() => void) | undefined {
  const context = canvas.getContext("2d")
  if (!context || cols <= 0 || rows <= 0) return undefined
  canvas.width = cols
  canvas.height = rows

  const offscreen = document.createElement("canvas")
  offscreen.width = cols
  offscreen.height = rows
  const offscreenContext = offscreen.getContext("2d")
  if (!offscreenContext) return undefined

  const bloomContext = bloomCanvas?.getContext("2d") ?? null
  if (bloomCanvas) {
    bloomCanvas.width = cols
    bloomCanvas.height = rows
  }

  const reduceMotion = prefersReducedMotion()
  const geometryEase = reduceMotion ? 1 : 0.18
  const current: Record<string, Surface> = {}

  let frame: number | null = null
  let animationStart = 0
  let lastProgress = -1
  let lastRevision = state.current.revision
  // Reduced motion skips the animation, but still needs to report completion
  // so SVG parts gated on `entranceDone` (dots/active dots) become visible.
  let entranceReported = !state.current.animate
  let intensity = 0
  let needsFill = true
  let lastPaintSignature = ""
  let lastSelected: string | null | undefined = Symbol() as never
  let starTick = 0
  let lastStarTick = 0

  const paintFill = (hoverIntensity: number, reveal: number) => {
    offscreenContext.clearRect(0, 0, cols, rows)
    const chart = state.current
    const stacked =
      chart.stackType === "stacked" || chart.stackType === "percent"
    const revealColumns = Math.ceil(reveal * cols)

    chart.configKeys.forEach((key, seriesIndex) => {
      const surface = current[key]
      if (!surface) return
      const seed = chart.seedOf(key)
      const spec = chart.seriesSpecs[key]
      const variant = spec?.variant ?? "gradient"
      const isLine =
        (spec?.kind ?? (chart.chartType === "line" ? "line" : "area")) ===
        "line"
      const emphasis = chart.selectedDataKey ?? chart.focusDataKey
      const dim = emphasis !== null && emphasis !== key ? 0.3 : 1
      const sparse = stacked ? 0 : seriesIndex * 0.14

      for (let column = 0; column < cols; column += 1) {
        if (column > revealColumns) break
        paintColumn(
          offscreenContext,
          column,
          surface.top[column] ?? 0,
          surface.floor[column] ?? 0,
          seed,
          {
            variant,
            intensity: hoverIntensity,
            dim,
            stacked: stacked && !isLine,
            sparse,
          }
        )
      }
    })
  }

  const draw = (now: number) => {
    frame = null
    const chart = state.current
    if (!chart.ready) return

    const animate = chart.animate && !reduceMotion
    if (chart.revision !== lastRevision) {
      lastRevision = chart.revision
      animationStart = 0
      lastProgress = -1
      entranceReported = !chart.animate
      needsFill = true
    }
    if (!animationStart) animationStart = now
    const progress = animate
      ? Math.min(
          1,
          (now - animationStart) / Math.max(chart.animationDuration, 1)
        )
      : 1
    if (progress >= 1 && !entranceReported) {
      entranceReported = true
      chart.markEntranceDone()
    }

    let geometryMoving = false
    const targetSurfaces = targets.current
    for (const key of chart.configKeys) {
      const target = targetSurfaces[key]
      if (!target) continue
      const surface = current[key]
      if (!surface || surface.top.length !== cols) {
        current[key] = {
          top: target.top.slice(),
          floor: target.floor.slice(),
        }
        needsFill = true
        continue
      }

      for (let column = 0; column < cols; column += 1) {
        const topDelta = target.top[column] - surface.top[column]
        const floorDelta = target.floor[column] - surface.floor[column]
        if (Math.abs(topDelta) > 0.01 || Math.abs(floorDelta) > 0.01) {
          surface.top[column] += topDelta * geometryEase
          surface.floor[column] += floorDelta * geometryEase
          geometryMoving = true
        } else {
          surface.top[column] = target.top[column]
          surface.floor[column] = target.floor[column]
        }
      }
    }
    for (const key of Object.keys(current)) {
      if (!targetSurfaces[key]) {
        delete current[key]
        needsFill = true
      }
    }
    if (geometryMoving) needsFill = true

    const selected = chart.selectedDataKey ?? chart.focusDataKey
    if (selected !== lastSelected) {
      lastSelected = selected
      needsFill = true
    }

    const intensityTarget = chart.isMouseInChart || chart.hovered ? 1 : 0
    let intensitySettling = false
    if (Math.abs(intensity - intensityTarget) > 0.001) {
      intensity +=
        (intensityTarget - intensity) * (reduceMotion ? 1 : 0.16)
      intensitySettling = true
      needsFill = true
    } else {
      intensity = intensityTarget
    }

    const paintSignature = `${chart.stackType}|${chart.configKeys
      .map((key) => {
        const spec = chart.seriesSpecs[key]
        return `${key}:${spec?.kind ?? ""}:${spec?.variant ?? ""}:${chart
          .seedOf(key)
          .fill.join(",")}`
      })
      .join("|")}`
    if (paintSignature !== lastPaintSignature) {
      lastPaintSignature = paintSignature
      needsFill = true
    }
    if (progress !== lastProgress) {
      lastProgress = progress
      needsFill = true
    }

    if (
      !reduceMotion &&
      (chart.isMouseInChart || chart.hovered) &&
      now - lastStarTick >= 100
    ) {
      lastStarTick = now
      starTick += 1
    }

    const reveal = animate ? easeInOutCubic(progress) : 1
    const revealColumns = reveal * cols
    if (needsFill) {
      paintFill(intensity, reveal)
      needsFill = false
    }

    context.clearRect(0, 0, cols, rows)
    context.drawImage(offscreen, 0, 0)

    const marker =
      chart.hoverIndex != null ? chart.hoverIndex : chart.markerIndex
    const markerX =
      marker != null && chart.dataLength > 1
        ? Math.round((marker / (chart.dataLength - 1)) * (cols - 1))
        : -1
    if (markerX >= 0 && markerX <= revealColumns) {
      for (const key of chart.configKeys) {
        const surface = current[key]
        if (!surface) continue
        const seed = chart.seedOf(key)
        const markerY = Math.round(surface.top[markerX] ?? 0)
        context.fillStyle = rgb(seed.fill, 1, 0.55)
        for (let row = markerY; row < rows; row += 1) {
          context.fillRect(markerX, row, 1, 1)
        }
        context.fillStyle = rgb(seed.fill)
        context.fillRect(markerX - 1, markerY - 1, 3, 3)
      }
    }

    for (const star of stars.current) {
      const surface = current[star.key]
      if (!surface) continue
      const starX = Math.round(
        (star.xi / Math.max(chart.dataLength - 1, 1)) * (cols - 1)
      )
      if (starX > revealColumns) continue
      const top = surface.top[starX] ?? 0
      const floor = surface.floor[starX] ?? rows - 1
      const starY = Math.round(top + star.depth * (floor - top))
      const wink = reduceMotion
        ? 0.85
        : (Math.sin((starTick + star.phase) * 0.35) + 1) / 2
      const lift = wink * (0.7 + 0.3 * intensity)
      if (lift < 0.55 || starY < 0 || starY >= rows) continue
      const starColor = chart.seedOf(star.key).fill
      context.fillStyle = rgb(starColor, 1, lift)
      context.fillRect(starX, starY, 1, 1)
      if (wink > 0.9) {
        context.fillStyle = rgb(starColor, 1, lift * 0.6 * (wink - 0.9) * 10)
        context.fillRect(starX - 1, starY, 1, 1)
        context.fillRect(starX + 1, starY, 1, 1)
        context.fillRect(starX, starY - 1, 1, 1)
        context.fillRect(starX, starY + 1, 1, 1)
      }
    }

    if (bloomContext) {
      const bloomOn =
        chart.bloom !== "off" &&
        (!chart.bloomOnHover ||
          chart.isMouseInChart ||
          chart.hovered)
      bloomContext.clearRect(0, 0, cols, rows)
      if (bloomOn) bloomContext.drawImage(canvas, 0, 0)
    }

    if (progress < 1 || geometryMoving || intensitySettling) {
      frame = requestAnimationFrame(draw)
    }
  }

  const wake = () => {
    if (frame === null) frame = requestAnimationFrame(draw)
  }
  wakeCell.current = wake
  wake()

  return () => {
    if (frame !== null) cancelAnimationFrame(frame)
    if (wakeCell.current === wake) wakeCell.current = null
  }
}

/** Event-driven dither canvas shared by area and line charts. */
export function CartesianCanvas() {
  const chart = useChart()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bloomRef = useRef<HTMLCanvasElement>(null)
  const wakeRef = useRef<(() => void) | null>(null)

  const { width, height } = chart.plot
  const {
    bands,
    chartType,
    configKeys,
    dataLength,
    ready,
    seriesSpecs,
    y,
  } = chart
  const { cols, rows } = backingSize(width, height)

  const targets = useMemo(() => {
    const output: Record<string, Surface> = {}
    if (!ready) return output
    const plotHeight = height || 1
    const glow = Math.max(6, Math.round(rows * 0.16))
    const defaultKind = chartType === "line" ? "line" : "area"

    for (const key of configKeys) {
      const band = bands[key]
      if (!band) continue
      const isLine = (seriesSpecs[key]?.kind ?? defaultKind) === "line"
      const top = band.map(
        (point) => (y(point[1]) / plotHeight) * (rows - 1)
      )
      const floor = band.map((point, index) =>
        isLine
          ? Math.min(rows - 1, top[index] + glow)
          : (y(point[0]) / plotHeight) * (rows - 1)
      )
      output[key] = {
        top: resample(top, cols),
        floor: resample(floor, cols),
      }
    }
    return output
  }, [
    bands,
    chartType,
    cols,
    configKeys,
    height,
    ready,
    rows,
    seriesSpecs,
    y,
  ])

  const stars = useMemo(() => {
    const output: Star[] = []
    const perSeries = Math.max(4, Math.round(cols / 14))
    configKeys.forEach((key, seriesIndex) => {
      for (let index = 0; index < perSeries; index += 1) {
        const seed = index * 67 + 13 + seriesIndex * 131
        output.push({
          key,
          xi: seed % Math.max(dataLength, 1),
          depth: ((seed * 53 + 7) % 100) / 100,
          phase: (seed * 41) % 360,
        })
      }
    })
    return output
  }, [cols, configKeys, dataLength])

  const stateRef = useRef(chart)
  const targetsRef = useRef(targets)
  const starsRef = useRef(stars)
  useEffect(() => {
    stateRef.current = chart
    targetsRef.current = targets
    starsRef.current = stars
    wakeRef.current?.()
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startCartesianLoop({
      canvas,
      bloomCanvas: bloomRef.current,
      cols,
      rows,
      state: stateRef,
      targets: targetsRef,
      stars: starsRef,
      wake: wakeRef,
    })
  }, [cols, rows])

  const bloomActive = chart.bloomOnHover
    ? chart.isMouseInChart || chart.hovered
    : true
  const bloom = bloomLayerStyle(chart.bloom, bloomActive)
  const position = {
    left: chart.margins.left,
    top: chart.margins.top,
    width,
    height,
  } as const

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ ...position, imageRendering: "pixelated" }}
      />
      <canvas
        ref={bloomRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          ...position,
          transition: "opacity 220ms ease",
          ...(bloom ?? { opacity: 0 }),
        }}
      />
    </>
  )
}
