# Tailwind v4 QA Checklist Template

## Run Metadata

- Date:
- Tester:
- Device:
- OS + Browser (version):
- Mode: Light / Dark / Both
- Viewports tested: 375px / 768px / 1024px / Desktop

## Global UI

- [ ] No console errors or warnings related to Tailwind or CSS
- [ ] Typography scale and line-heights match baseline
- [ ] Border colors and ring focus styles match baseline
- [ ] Shadows and blur effects visually match baseline
- [ ] Hover and focus states match baseline

## Navigation & Layout

- [ ] Header layout (logo, nav, CTA) matches baseline
- [ ] Mobile menu open/close works; overlay and transitions match baseline
- [ ] Footer spacing and links match baseline

## Homepage

- [ ] Hero spacing, gradient/background, and CTA buttons match baseline
- [ ] Experience cards: shadows, borders, and hover states match baseline
- [ ] Section spacing and typography scale match baseline

## Blog

- [ ] Blog list cards: border, shadow, and hover states match baseline
- [ ] Blog post page: headings, code blocks, and links match baseline

## Projects

- [ ] Project cards: hover and focus styles match baseline
- [ ] Tag pills: background and text colors match baseline

## Analytics Dashboard

- [ ] Tabs and transitions behave correctly
- [ ] Cards and charts render without spacing regressions

## Kanban Board

- [ ] Column layout and scroll behavior match baseline
- [ ] Card drag states and hover styles match baseline

## Animations

- [ ] Accordion open/close animation works
- [ ] Framer Motion stagger animations render correctly

## Responsiveness

- [ ] Layout at 375px, 768px, 1024px matches baseline
- [ ] No overflow or clipping in sections or cards

## Build & Performance

- [ ] `npm run build` succeeds
- [ ] `npm run preview` renders correct UI
- [ ] Lighthouse scores within acceptable range of baseline

## Notes / Issues

- 
