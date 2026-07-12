import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CommonChartContext, type CommonChart } from "./common-context"
import { Legend } from "./legend"
import { seedOfColor } from "./palette"

function chartContext(overrides: Partial<CommonChart> = {}): CommonChart {
  return {
    names: ["visits"],
    labelOf: () => "Visits",
    colorOf: () => "purple",
    seedOf: () => seedOfColor("purple"),
    variantOf: () => "dotted",
    selectedDataKey: null,
    selectDataKey: vi.fn(),
    focusDataKey: null,
    setFocusDataKey: vi.fn(),
    hoverIndex: null,
    heading: () => null,
    itemsAt: () => [],
    ready: true,
    tooltipLeft: 0,
    tooltipTop: 0,
    ...overrides,
  }
}

describe("Legend", () => {
  it("repeats the series dither texture in its swatch", () => {
    const chart = chartContext()
    render(
      <CommonChartContext.Provider value={chart}>
        <Legend />
      </CommonChartContext.Provider>
    )

    const swatch = screen.getByRole("button", { name: "Visits" }).querySelector("span")
    expect(swatch?.style.backgroundImage).toContain("radial-gradient")
    expect(swatch?.style.backgroundColor).toBe("rgba(150, 110, 255, 0.24)")
  })

  it("keeps clickable legend selection behavior", () => {
    const selectDataKey = vi.fn()
    const chart = chartContext({ selectDataKey })
    render(
      <CommonChartContext.Provider value={chart}>
        <Legend isClickable ariaLabelFormatter={(_, label) => `Toggle ${label}`} />
      </CommonChartContext.Provider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Toggle Visits" }))
    expect(selectDataKey).toHaveBeenCalledWith("visits")
  })
})
