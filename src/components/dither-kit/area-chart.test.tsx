import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
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

function InteractionProbe() {
  const chart = useChart()

  return (
    <g
      data-testid="interaction-probe"
      data-hover-index={chart.hoverIndex ?? "none"}
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
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 220,
      height: 220,
      left: 0,
      right: 320,
      top: 0,
      width: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
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

  it("scrubs only inside the plot, not over legends or chart margins", async () => {
    render(
      <div style={{ height: 220, width: 320 }}>
        <AreaChart data={DATA} config={CONFIG} ariaLabel="Bounded hover chart">
          <Area dataKey="sessions" />
          <InteractionProbe />
        </AreaChart>
      </div>
    )

    const svg = await screen.findByRole("img", { name: "Bounded hover chart" })
    const root = svg.parentElement
    const probe = screen.getByTestId("interaction-probe")
    expect(root).not.toBeNull()

    // Default margins put the plot at x=36..308 and y=10..198.
    fireEvent.pointerMove(root as HTMLElement, { clientX: 170, clientY: 100 })
    await waitFor(() => {
      expect(probe.getAttribute("data-hover-index")).not.toBe("none")
    })

    fireEvent.pointerMove(root as HTMLElement, { clientX: 170, clientY: 5 })
    await waitFor(() => {
      expect(probe.getAttribute("data-hover-index")).toBe("none")
    })

    fireEvent.pointerMove(root as HTMLElement, { clientX: 10, clientY: 100 })
    expect(probe.getAttribute("data-hover-index")).toBe("none")
  })
})
