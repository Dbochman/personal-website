import { describe, expect, it } from "vitest"
import { computeBands } from "./scales"

const DATA = [
  { first: 1, second: 2 },
  { first: 3, second: 4 },
]
const KEYS = ["first", "second"]

describe("computeBands", () => {
  it("uses an explicit zero baseline for stacked series", () => {
    expect(computeBands(DATA, KEYS, "stacked")).toEqual({
      bands: {
        first: [
          [0, 1],
          [0, 3],
        ],
        second: [
          [1, 3],
          [3, 7],
        ],
      },
      max: 7,
    })
  })

  it("normalizes percent stacks while preserving series order", () => {
    expect(computeBands(DATA, KEYS, "percent")).toEqual({
      bands: {
        first: [
          [0, 1 / 3],
          [0, 3 / 7],
        ],
        second: [
          [1 / 3, 1],
          [3 / 7, 1],
        ],
      },
      max: 1,
    })
  })
})
