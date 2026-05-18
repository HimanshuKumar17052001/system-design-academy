# Landing Page Parallax Effect — Design Spec

**Date:** 2026-05-19
**Status:** Approved

## Overview

Add subtle parallax floating effects to the landing page's key sections (Hero, Stats, CTA) using Framer Motion. Elements float out on scroll-up and return on scroll-down, creating depth without distracting from content. Existing flip cards and features grid remain unaffected.

---

## Hero Section Parallax

### Elements & Transforms

| Element | Y Offset (scroll) | Opacity Fade | Notes |
|---------|-------------------|--------------|-------|
| Badge (`53 Modules · 25 Simulations · 100% Free`) | ±60px | 1 → 0.2 | Fastest exit |
| Title (`Master System Design & Architecture`) | ±80px | 1 → 0 | Fastest, fully exits |
| Subtitle paragraph | ±40px | 1 → 0.3 | Slower, stays readable |
| "Start Learning" button | ±20px | 1 → 0.5 | Minimal movement |
| Feature pills (Beginner to Advanced, etc.) | ±30px | 1 → 0 | Exit early with hero |

### Implementation
- Wrap hero content in `position: sticky` container
- Use Framer Motion `useScroll({ target: heroRef, offset: ["start start", "end start"] })`
- Apply `useTransform` to map scroll progress to y-offset and opacity
- Container height: `200vh` to give scroll room for sticky positioning

---

## Stats Section Parallax

### Elements & Transforms

| Element | Y Offset | Opacity | Notes |
|---------|----------|---------|-------|
| Stat numbers (53, 25, 200+, 8) | +30px (upward) | 1 | Gentle rise on viewport entry |
| Stat labels | +20px | 1 | Slight offset from numbers |

### Implementation
- Use `whileInView` with `useTransform` for viewport-based animation
- Stagger: 0.1s between each stat item (index * 0.1)

---

## CTA Section Parallax

### Elements & Transforms

| Element | Y Offset | Opacity | Notes |
|---------|----------|---------|-------|
| Heading | +40px | 1 | Rises into view |
| Subtitle paragraph | +30px | 1 | Follows heading |
| Button | +15px | 1 | Minimal |

### Implementation
- Use `whileInView` with scroll-linked transforms
- Section uses `viewport={{ once: true }}` — animation plays once on entry

---

## Technical Stack

- **Library:** Framer Motion (already installed)
- **Hooks:** `useScroll`, `useTransform`, `useSpring` for smooth damping
- **No new dependencies** — reuse existing framer-motion

---

## Performance Considerations

- Disable animation for `prefers-reduced-motion: reduce`
- Use `will-change: transform` on parallax elements
- Avoid animating `opacity` and `transform` together — use transform for y-offset, opacity as separate property

---

## File Changes

- `src/app/page.tsx` — Add parallax motion hooks and sticky hero wrapper