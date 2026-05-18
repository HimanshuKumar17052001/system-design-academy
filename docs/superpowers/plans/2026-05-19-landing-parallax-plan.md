# Landing Page Parallax Effect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scroll-linked parallax floating effects to the Hero, Stats, and CTA sections of the landing page using Framer Motion.

**Architecture:** Hero section uses `position: sticky` with `useScroll` + `useTransform` for scroll-linked parallax. Stats and CTA sections use `whileInView` with viewport-based animations. No new dependencies — framer-motion is already installed.

**Tech Stack:** Framer Motion (`useScroll`, `useTransform`, `useRef`, `motion` components), React hooks.

---

## File Changes

- Modify: `src/app/page.tsx`

---

## Task 1: Sticky Hero Parallax Wrapper

**Files:**
- Modify: `src/app/page.tsx:367-463`

- [ ] **Step 1: Add refs and scroll hooks to LandingPage component**

Locate `export default function LandingPage()` in page.tsx. Add a `useRef` for the hero section and `useScroll` hook from framer-motion:

```tsx
const heroRef = useRef<HTMLDivElement>(null);
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ["start start", "end start"],
});
```

- [ ] **Step 2: Wrap hero content in sticky container**

Find the Hero `section` element (around line 372). Replace its opening with:

```tsx
<section ref={heroRef} className="relative overflow-hidden border-b" style={{ height: "200vh" }}>
  <div className="sticky top-0 h-screen flex items-center justify-center">
```

Close the sticky div after the hero content closes, then close the section properly.

- [ ] **Step 3: Define y-transform for hero elements**

After the `useScroll` hook, add:

```tsx
const yBadge = useTransform(scrollYProgress, [0, 1], [0, -60]);
const yTitle = useTransform(scrollYProgress, [0, 1], [0, -80]);
const ySubtitle = useTransform(scrollYProgress, [0, 1], [0, -40]);
const yButton = useTransform(scrollYProgress, [0, 1], [0, -20]);
const yPills = useTransform(scrollYProgress, [0, 0.5], [0, -30]);

const opacityBadge = useTransform(scrollYProgress, [0, 0.7], [1, 0.2]);
const opacityTitle = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
const opacitySubtitle = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
const opacityButton = useTransform(scrollYProgress, [0, 0.85], [1, 0.5]);
const opacityPills = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
```

- [ ] **Step 4: Apply transforms to hero elements**

Find each hero element and wrap it with `motion.div` using the transforms:

**Badge (around line 398):**
```tsx
<motion.div style={{ y: yBadge, opacity: opacityBadge }}>
  <Badge variant="secondary" className="mb-6 text-sm">
    53 Modules · 25 Simulations · 100% Free
  </Badge>
</motion.div>
```

**Title (around line 402-411):**
```tsx
<motion.h1
  className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
  style={{ y: yTitle, opacity: opacityTitle }}
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2, duration: 0.5 }}
>
```

**Subtitle (around line 412-421):**
```tsx
<motion.p
  className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
  style={{ y: ySubtitle, opacity: opacitySubtitle }}
  ...
>
```

**Button group (around line 422-441):**
```tsx
<motion.div
  className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
  style={{ y: yButton, opacity: opacityButton }}
  ...
>
```

**Feature pills (around line 442-460):**
```tsx
<motion.div
  className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
  style={{ y: yPills, opacity: opacityPills }}
  ...
>
```

- [ ] **Step 5: Build and verify**

Run: `cd /Users/himanshukumar/Developer/system-design-academy && npm run build`
Expected: Compiles without errors

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: Add sticky hero parallax with scroll-linked transforms"
```

---

## Task 2: Stats Section Parallax

**Files:**
- Modify: `src/app/page.tsx:465-493`

- [ ] **Step 1: Wrap stats with motion divs and apply transforms**

Find the Stats `section` (lines 466-493). Each stat item uses `motion.div` with `whileInView`. The existing `whileInView` animations already have `y: 20 → 0`. We enhance with `useTransform` for scroll-linked offset.

First, add a `useRef` and `useScroll` for the stats section at the top of the component, or inline with the section:

```tsx
const statsRef = useRef<HTMLDivElement>(null);
const statsScrollYProgress = useScroll({
  target: statsRef,
  offset: ["start end", "end start"],
}).scrollYProgress;

const statsY0 = useTransform(statsScrollYProgress, [0, 1], [0, -30]);
const statsY1 = useTransform(statsScrollYProgress, [0, 1], [0, -30]);
const statsY2 = useTransform(statsScrollYProgress, [0, 1], [0, -30]);
const statsY3 = useTransform(statsScrollYProgress, [0, 1], [0, -30]);
```

Add `ref={statsRef}` to the section element. Then apply each `y` transform to the corresponding `motion.div` inside the stats map:

```tsx
{[
  { value: "53", label: "Modules" },
  { value: "25", label: "Simulations" },
  { value: "200+", label: "Quiz Questions" },
  { value: "8", label: "Phases" },
].map((stat, i) => (
  <motion.div
    key={stat.label}
    ref={i === 0 ? statsRef : undefined}
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay: i * 0.1, duration: 0.4 }}
    style={{ y: [statsY0, statsY1, statsY2, statsY3][i] }}
    className="text-center"
  >
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: Add scroll-linked parallax to stats section"
```

---

## Task 3: CTA Section Parallax

**Files:**
- Modify: `src/app/page.tsx:567-603`

- [ ] **Step 1: Add refs and transforms for CTA section**

```tsx
const ctaRef = useRef<HTMLDivElement>(null);
const ctaScrollYProgress = useScroll({
  target: ctaRef,
  offset: ["start end", "end start"],
}).scrollYProgress;

const ctaYHeading = useTransform(ctaScrollYProgress, [0, 1], [0, -40]);
const ctaYSubtitle = useTransform(ctaScrollYProgress, [0, 1], [0, -30]);
const ctaYButton = useTransform(ctaScrollYProgress, [0, 1], [0, -15]);
```

- [ ] **Step 2: Apply transforms to CTA elements**

Find the CTA `section` and add `ref={ctaRef}`. Wrap the heading, paragraph, and button div with `motion.div` applying the transforms.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: Add scroll-linked parallax to CTA section"
```

---

## Task 4: Add Reduced Motion Support

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add prefers-reduced-motion check**

Add at component top:

```tsx
const prefersReducedMotion = useRef(false);
if (typeof window !== "undefined") {
  prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

Wrap each parallax transform set with a condition:

```tsx
const yBadge = prefersReducedMotion.current
  ? { y: 0 }
  : useTransform(scrollYProgress, [0, 1], [0, -60]);
```

Apply this pattern to all `useTransform` calls. When `prefersReducedMotion` is true, use plain `style={{ y: 0 }}` instead.

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: Add prefers-reduced-motion support for parallax"
```

---

## Final Verification

- [ ] **Step 1: Final build**

Run: `npm run build`
Expected: All checks pass, no TypeScript errors

- [ ] **Step 2: Deploy**

Run: `vercel deploy --prod && git push origin main`

- [ ] **Step 3: Manual test**

Open https://system-design-academy.online in browser. Scroll through landing page:
1. Hero content should float up and fade as you scroll down
2. Stats numbers should rise gently as section enters view
3. CTA text should rise gently as section enters view
4. On scroll up — all elements should return to original position

---

## Spec Coverage Check

- [x] Hero parallax with badge, title, subtitle, button, pills — Task 1
- [x] Stats section parallax with numbers rising — Task 2
- [x] CTA section parallax with heading, subtitle, button — Task 3
- [x] Reduced motion support — Task 4
- [x] Uses Framer Motion (no new dependencies) — All tasks
- [x] Builds and deploys — Final verification