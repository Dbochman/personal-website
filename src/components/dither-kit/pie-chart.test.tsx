import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AreaVariant, ChartConfig } from "./chart-context"
import { Pie } from "./pie"
import { PieChart } from "./pie-chart"
import { usePolarChart } from "./polar-context"

const DATA = [
  { key: "Desktop", value: 60 },
  { key: "Mobile", value: 30 },
  { key: "Tablet", value: 10 },
]

const CONFIG: ChartConfig = {
  Desktop: { label: "Desktop", color: "blue" },
  Mobile: { label: "Mobile", color: "purple" },
  Tablet: { label: "Tablet", color: "orange" },
}

const VARIANTS: Record<string, AreaVariant> = {
  Desktop: "gradient",
  Mobile: "dotted",
  Tablet: "hatched",
}

function VariantProbe() {
  const chart = usePolarChart()

  return (
    <g
      data-testid="variant-probe"
      data-desktop={chart.variantOf("Desktop")}
      data-mobile={chart.variantOf("Mobile")}
      data-tablet={chart.variantOf("Tablet")}
    />
  )
}

describe("Dither PieChart integration", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(240)
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(200)
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

  it("registers per-slice textures and lets the canvas become idle", async () => {
    render(
      <div style={{ height: 200, width: 240 }}>
        <PieChart
          data={DATA}
          config={CONFIG}
          dataKey="value"
          nameKey="key"
          animate={false}
          ariaLabel="Device session distribution"
        >
          <Pie variants={VARIANTS} />
          <VariantProbe />
        </PieChart>
      </div>
    )

    expect(
      await screen.findByRole("img", { name: "Device session distribution" })
    ).toBeTruthy()

    const probe = await screen.findByTestId("variant-probe")
    await waitFor(() => {
      expect(probe.getAttribute("data-desktop")).toBe("gradient")
      expect(probe.getAttribute("data-mobile")).toBe("dotted")
      expect(probe.getAttribute("data-tablet")).toBe("hatched")
    })

    await new Promise((resolve) => setTimeout(resolve, 30))
    const settledFrameCount = vi.mocked(requestAnimationFrame).mock.calls.length
    expect(settledFrameCount).toBeGreaterThan(0)

    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(requestAnimationFrame).toHaveBeenCalledTimes(settledFrameCount)
  })
})
