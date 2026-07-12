import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DitherBarList } from "./bar-list"
import { DitherComposition, DitherMeter } from "./meter"

describe("Dither DOM meters", () => {
  it("clamps invalid values and exposes exact progress semantics", () => {
    const { rerender } = render(
      <DitherMeter
        value={Number.NaN}
        max={100}
        ariaLabel="Performance"
        ariaValueText="No valid score"
      />
    )

    expect(screen.getByRole("progressbar", { name: "Performance" })).toHaveAttribute(
      "aria-valuenow",
      "0"
    )

    rerender(
      <DitherMeter value={130} max={100} ariaLabel="Performance" />
    )
    expect(screen.getByRole("progressbar", { name: "Performance" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    )
  })

  it("renders a labelled composition while ignoring invalid segment values", () => {
    const { container } = render(
      <DitherComposition
        ariaLabel="Traffic: 75 human, 25 CI"
        segments={[
          { key: "human", label: "Human", value: 75, color: "green", variant: "gradient" },
          { key: "ci", label: "CI", value: 25, color: "blue", variant: "dotted" },
          { key: "bot", label: "Bot", value: Number.NaN, color: "red", variant: "hatched" },
        ]}
      />
    )

    expect(screen.getByRole("img", { name: "Traffic: 75 human, 25 CI" })).toBeTruthy()
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(2)
  })

  it("keeps full ranked labels and values visible", () => {
    render(
      <DitherBarList
        ariaLabel="Channel sessions"
        data={[
          {
            key: "organic",
            label: "Organic Search",
            value: 1234,
            color: "blue",
            variant: "gradient",
            detail: "61.7%",
          },
        ]}
      />
    )

    expect(screen.getByRole("list", { name: "Channel sessions" })).toHaveTextContent(
      "Organic Search"
    )
    expect(screen.getByText("1,234")).toBeTruthy()
    expect(screen.getByText("61.7%")).toBeTruthy()
    expect(screen.getByRole("progressbar", { name: "Organic Search" })).toHaveAttribute(
      "aria-valuetext",
      "Organic Search: 1,234, 61.7%"
    )
  })
})
