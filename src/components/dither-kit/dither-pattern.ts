import type { CSSProperties } from "react"
import type { AreaVariant } from "./chart-context"
import { rgb, seedOfColor, type DitherColor } from "./palette"

/** CSS counterpart to the canvas textures for compact DOM-based meters. */
export function ditherPatternStyle(
  color: DitherColor,
  variant: AreaVariant
): CSSProperties {
  const fill = seedOfColor(color).fill
  const strong = rgb(fill, 1, 0.9)
  const soft = rgb(fill, 1, 0.24)

  switch (variant) {
    case "dotted":
      return {
        backgroundColor: soft,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${strong} 0 1px, transparent 1.2px)`,
        backgroundSize: "4px 4px",
      }
    case "hatched":
      return {
        backgroundColor: soft,
        backgroundImage: `repeating-linear-gradient(135deg, ${strong} 0 2px, transparent 2px 5px)`,
      }
    case "solid":
      return { backgroundColor: strong }
    default:
      return {
        backgroundColor: soft,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${strong} 0 0.8px, transparent 1px), linear-gradient(90deg, ${soft}, ${strong})`,
        backgroundSize: "4px 4px, 100% 100%",
      }
  }
}
