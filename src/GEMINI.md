You are a senior UI/UX engineer and design systems expert specializing in modern web applications (2025–2026). I need you to fully redesign the **ExpoFlow** event management platform — a Next.js 15 app (App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui).

## Current Design Context

- Style: "Formal Elegance" — Teal primary (hsl 180 25% 25%), Warm Sand secondary (hsl 38 30% 94%)
- Font: Inter (UI) + Montserrat (headings)
- Components: shadcn/ui base with minor customizations
- Layout: Multi-level collapsible sidebar, card-based dashboard, data tables

## New Design Direction: Glassmorphism / Frosted UI (2025–2026)

Apply the following modern design language consistently across ALL components:

### Visual System

- **Glass surfaces**: Use `backdrop-filter: blur(12–24px)` on panels, cards, modals, and sidebar. Background should be `rgba(white/dark, 0.06–0.12)` with `saturate(180%)`.
- **Layered depth**: 3 distinct depth layers — (1) page background with subtle mesh gradient, (2) glass cards/panels, (3) elevated modals/tooltips.
- **Borders**: Use `border: 1px solid rgba(255,255,255,0.12)` on glass elements in light mode; `rgba(255,255,255,0.08)` in dark mode.
- **Background**: Replace flat `hsl(180 20% 98.5%)` with a multi-stop radial/mesh gradient combining `hsl(180 40% 96%)` and `hsl(38 35% 95%)` with subtle noise texture overlay.

### Typography

- Replace Inter with **Plus Jakarta Sans** (UI text, weights 400/500/600)
- Replace Montserrat with **Syne** (headings/display, weights 600/800)
- Keep fluid sizing: `clamp()` for responsive heading scales

### Color Evolution (keep brand identity, modernize application)

- **Primary**: `hsl(180 35% 22%)` — deeper teal for better contrast on glass
- **Accent**: Introduce a subtle **Aurora gradient** `linear-gradient(135deg, hsl(180 60% 50%), hsl(210 70% 60%))` for CTAs and active states only
- **Glow effects**: Primary color glow `box-shadow: 0 0 20px hsl(180 60% 50% / 0.15)` on focus/active states
- Maintain full dark mode support using Tailwind CSS 4 `@theme` variables

### Component-Level Rules

1. **Cards**: Frosted glass (`bg-white/5 backdrop-blur-xl`), subtle inner shadow `inset 0 1px 0 rgba(255,255,255,0.1)`, hover lifts with `translateY(-2px)` and glow
2. **Buttons (Primary)**: Gradient fill with glass shimmer on hover via `::before` pseudo element
3. **Inputs**: Glass background, focus glow ring using primary color at 30% opacity
4. **Sidebar**: Dark frosted (`hsl(180 30% 8% / 0.85)` + `backdrop-blur-2xl`), floating icon labels
5. **Tables**: Alternating glass rows, sticky frosted header
6. **Badges/Status**: Frosted pill with matching glow, semi-transparent fill

### Motion & Micro-interactions

- Use `transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)` as default easing
- Page transitions: shared layout animations via Framer Motion `layoutId`
- Skeleton loaders: animated shimmer gradient matching glass aesthetic
- Sidebar collapse: spring physics (`stiffness: 300, damping: 30`)

### Technical Requirements

- All glass effects must have CPU-safe fallbacks: `@supports not (backdrop-filter: blur(1px))` → solid semi-opaque background
- Use Tailwind CSS 4 arbitrary values: `backdrop-blur-[14px]`, `bg-white/[0.07]`
- Maintain WCAG AA contrast — glass backgrounds must pass with overlaid text
- All components must work in both light and dark mode without separate style blocks
- Keep full TypeScript type safety and shadcn/ui component API compatibility

### Files to Modify

1. `src/app/globals.css` — redesign `@theme` tokens
2. `src/components/ui/card.tsx` — glass card variant
3. `src/components/ui/sidebar.tsx` — frosted sidebar
4. All dashboard components under `src/components/dashboard/`

Produce complete, production-ready code. Include CSS custom properties, component code, and usage examples. Do not use placeholder comments — write the actual implementation.
