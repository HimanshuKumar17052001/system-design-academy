# System Design Academy - Curriculum Revamp Specification

**Date:** 2025-05-19  
**Status:** Draft - Pending Implementation

---

## 1. Overview

**Project:** System Design Academy Revamp  
**Goal:** Moderate refresh - better content + working simulations, keeping existing structure  
**Target Audience:** All levels (entry to senior engineers)  
**Learning Format:** Balanced mix of video, interactive simulations, and text+diagrams

---

## 2. Target Outcomes

- All 53 modules have fully functional interactive simulations
- Case studies cover all major categories (Social, Video, Ride-share, E-commerce, Messaging)
- Content includes rich Mermaid diagrams, architecture flowcharts
- Video embed placeholders ready for each module
- Simple PDF certificate + email verification on completion
- No "not implemented" errors anywhere

---

## 3. Simulation Fixes (Priority: HIGH)

### 3.1 Broken Simulations - Root Cause Analysis

The following simulations show "not implemented" because their engine functions return stub data:

| Simulation | Engine Status | UI Status |
|------------|---------------|-----------|
| `load-balancer` | ✅ Connected (fixed) | ✅ Full UI |
| `consistent-hash` | ✅ Connected (fixed) | ✅ Full UI |
| `traffic-simulator` | ✅ Connected (fixed) | ✅ Full UI |
| `db-scaling` | ✅ Connected (fixed) | ✅ Full UI |
| `mq-visualizer` | ✅ Connected (fixed) | ✅ Full UI |

**Note:** Previous fixes connected the engine functions. Need to verify UI components properly consume the simulation results.

### 3.2 LabRunner Integration

The LabRunner.tsx renders simulations but needs to:
1. Pass controls/parameters to simulation engine
2. Display results in SimulationResultPanel
3. Allow interactive parameter changes that re-run simulation

### 3.3 Simulation UI Requirements

Each simulation UI component should:
- Accept controls/parameters as props
- Have interactive controls (sliders, dropdowns, toggles)
- Call `runSimulation()` when controls change
- Display results in real-time
- Have start/pause/reset functionality

---

## 4. Content Enhancement

### 4.1 Visual Content Blocks

Add to LessonRenderer for enhanced learning:

```typescript
// New content block types
type ContentBlock =
  | { type: "mermaid"; content: string }
  | { type: "architecture-diagram"; elements: DiagramElement[] }
  | { type: "video-embed"; url: string; title: string }
  | { type: "comparison-table"; headers: string[]; rows: string[][] }
  | { type: "interactive-lab"; labKind: LabKind }
```

### 4.2 Module Structure per Phase

**Phase 1: Foundations**
- 7 modules covering HTTP, DNS, CDN, APIs, Databases, Scaling, Estimation
- Interactive: BOE Calculator, HTTP Tracer

**Phase 2: Low-Level Design**
- 8 modules covering OOP, SOLID, Design Patterns, UML
- Interactive: Code Lab, Pattern Matcher, UML Sketchpad

**Phase 3: Core Distributed Systems**
- 9 modules covering Load Balancing, Caching, Messaging, CAP, Consistency
- Interactive: Load Balancer Sim, Consistent Hash Viz, Cache Strategy Lab, Rate Limiter Lab, CAP Playground, Traffic Flow Viz, DB Scaling Sim, MQ Visualizer

**Phase 4: Architecture Patterns**
- 6 modules covering API Gateway, Service Mesh, Microservices
- Interactive: Architecture Canvas, Event Flow Builder, Saga Simulator

**Phase 5: Reliability & Ops**
- 6 modules covering Deployment, Autoscaling, Chaos Engineering
- Interactive: Deployment Visualizer, Chaos Lab, Autoscaler Sim

**Phase 6: Real-World Systems (Case Studies)**
- 7 modules covering URL Shortener, Twitter, WhatsApp, Uber, Amazon, YouTube, Netflix
- Interactive: Case Study Walkthrough components

**Phase 7: Expert Topics**
- 6 modules covering Real-time Systems, ML Pipelines, Security, Payments, Global Scale
- Interactive: Realtime Flow Builder, ML Pipeline Sim, Security Sim, Payment Sim, Global Scale Sim

**Phase 8: Interview Prep**
- 4 modules covering Cheat Sheets, Practice, Canvas, Timer
- Interactive: System Design Canvas, Interview Timer, Pitfall Detector

### 4.3 Case Study Components

| Case Study | Component | Lab ID |
|------------|-----------|--------|
| URL Shortener | URLShortenerCase | `url-shortener-lab` |
| Twitter | TwitterCase | `twitter-lab` |
| Uber | UberCase | `uber-lab` |
| WhatsApp | TBD | `case-whatsapp-lab` |
| Amazon | TBD | `case-amazon-lab` |
| YouTube | TBD | `case-youtube-lab` |
| Netflix | TBD | `case-netflix-lab` |

---

## 5. Certificate System

### 5.1 Current Implementation
- PDF generation via jsPDF
- Emailed via Resend from `support@system-design-academy.online`
- Stored in Supabase storage + database

### 5.2 Enhancement
- Keep as-is (simple PDF + email)
- Add verification endpoint for employers to validate certificates
- Certificate includes: Name, Date, Certificate Number, Course Name

---

## 6. Technical Requirements

### 6.1 Simulation Engine
- All 20+ simulation functions should return real metrics/state/events
- Each simulation should have meaningful output based on controls
- Performance: <100ms response time for simulation runs

### 6.2 LabRunner Improvements
- Debounce simulation runs (300ms after last control change)
- Show loading state during simulation
- Error boundaries around each simulation component

### 6.3 Content Renderer
- Support lazy-loading for heavy components
- Mermaid diagrams rendered client-side
- Video embeds use lite-youtube style

---

## 7. Implementation Priority

### Priority 1 (Critical - Must Fix)
1. Debug and fix all simulation UI connections
2. Ensure LabRunner passes props correctly to simulation components
3. Verify SimulationResultPanel displays real data

### Priority 2 (High - Content)
4. Add missing case study components (WhatsApp, Amazon, YouTube, Netflix)
5. Enhance lessons with Mermaid diagrams and architecture flows
6. Add video embed placeholders

### Priority 3 (Medium - Polish)
7. Add debounced auto-run for simulations
8. Improve error handling and loading states
9. Final testing across all modules

---

## 8. Out of Scope

- Adding video content (placeholders only, content to be added later)
- LinkedIn integration
- Job guarantee programs
- Major curriculum structure changes
- New authentication methods

---

## 9. Success Criteria

- [ ] Zero "not implemented" errors in any simulation
- [ ] All 53 modules accessible and functional
- [ ] All case studies render correctly
- [ ] Certificates email successfully from support@ address
- [ ] Build passes with zero TypeScript errors
- [ ] Responsive on mobile devices
- [ ] Dark mode fully supported

---

## 10. Next Steps

1. Debug simulation UI connections (LabRunner → Simulation components)
2. Implement missing case study components
3. Add visual content blocks to lessons
4. Test end-to-end flows