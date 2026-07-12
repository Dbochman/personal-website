# Dither Kit provenance

This directory vendors the `pie-chart` registry component from
[Boring Software's Dither Kit](https://github.com/Boring-Software-Inc/dither-kit)
at commit `6b490cc14a1311e9c027153b83a87bee61728ee3`. The upstream
`package.json` declares the project under the MIT license.

Imported through the pinned shadcn registry item on 2026-07-12:

```text
Boring-Software-Inc/dither-kit/pie-chart#6b490cc14a1311e9c027153b83a87bee61728ee3
```

Local adaptations:

- React 18 context compatibility and stable registration callbacks
- per-slice pie textures
- an explicit accessible chart label
- an event-driven canvas loop that stops when animation and interaction settle
- reuse of the site's existing `framer-motion` dependency
