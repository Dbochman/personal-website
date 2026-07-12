import { useEffect } from "react"
import type { AreaVariant } from "./chart-context"
import { usePolarPart } from "./polar-context"

const EMPTY_VARIANTS: Record<string, AreaVariant> = {}

export type PieProps = {
  /** Fill texture applied to every slice. */
  variant?: AreaVariant
  /** Optional per-slice textures keyed by the chart's `nameKey` values. */
  variants?: Record<string, AreaVariant>
}

/**
 * The pie/donut ring. Slices come from the chart `data` (one per row); this part
 * sets the shared fill variant. The dithered wedges are painted on the canvas.
 */
export function Pie({
  variant = "gradient",
  variants = EMPTY_VARIANTS,
}: PieProps) {
  const ctx = usePolarPart("Pie", "pie")
  const { registerVariant, unregisterVariant } = ctx

  useEffect(() => {
    registerVariant("*", variant)
    const entries = Object.entries(variants)
    for (const [key, sliceVariant] of entries) {
      registerVariant(key, sliceVariant)
    }
    return () => {
      unregisterVariant("*")
      for (const [key] of entries) unregisterVariant(key)
    }
  }, [variant, variants, registerVariant, unregisterVariant])

  return null
}
