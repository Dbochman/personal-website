import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Area } from "./area"
import { AreaChart } from "./area-chart"
import type { ChartConfig } from "./chart-context"
import { useChart } from "./chart-context"

const DATA = [
  { date: "Jul 10", sessions: 20 },
  { date: "Jul 11", sessions: 35 },
  { date: "Jul 12", sessions: 28 },
]

const CONFIG: ChartConfig = {
  sessions: { label: "Sessions", color: "blue" },
}

function SeriesProbe() {
  const chart = useChart()
  const series = chart.seriesSpecs.sessions

  return (
    <g
      data-testid="series-probe"
      data-kind={series?.kind}
      data-variant={series?.variant}
    />
  )
}

function EntranceProbe() {
  const chart = useChart()

  return (
    <g
      data-testid="entrance-probe"
      data-entrance-done={String(chart.entranceDone)}
    />
  )
}

describe("Dither AreaChart integration", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320)
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(220)
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D)
    vi.mocked(requestAnimationFrame).mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("registers its series, exposes a useful name, and becomes idle", async () => {
    const { container } = render(
      <div style={{ height: 220, width: 320 }}>
        <AreaChart
          data={DATA}
          config={CONFIG}
          animationDuration={1}
          ariaLabel="Rolling seven-day sessions"
        >
          <Area dataKey="sessions" variant="gradient" />
          <SeriesProbe />
        </AreaChart>
      </div>
    )

    expect(
      await screen.findByRole("img", { name: "Rolling seven-day sessions" })
    ).toBeTruthy()
    expect(container.querySelectorAll('canvas[aria-hidden="true"]')).toHaveLength(
      2
    )

    const probe = await screen.findByTestId("series-probe")
    await waitFor(() => {
      expect(probe.getAttribute("data-kind")).toBe("area")
      expect(probe.getAttribute("data-variant")).toBe("gradient")
    })

    await new Promise((resolve) => setTimeout(resolve, 30))
    const settledFrameCount = vi.mocked(requestAnimationFrame).mock.calls.length
    expect(settledFrameCount).toBeGreaterThan(0)

    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(requestAnimationFrame).toHaveBeenCalledTimes(settledFrameCount)
  })

  it("reports the entrance complete when reduced motion skips animation", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    )

    render(
      <div style={{ height: 220, width: 320 }}>
        <AreaChart data={DATA} config={CONFIG} ariaLabel="Reduced motion chart">
          <Area dataKey="sessions" />
          <EntranceProbe />
        </AreaChart>
      </div>
    )

    const probe = await screen.findByTestId("entrance-probe")
    await waitFor(() => {
      expect(probe.getAttribute("data-entrance-done")).toBe("true")
    })
  })
})
