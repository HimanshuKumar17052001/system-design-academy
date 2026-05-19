# System Design Primer Integration — Design Spec

**Date:** 2026-05-19
**Status:** Approved

## Overview

Overlay the comprehensive [System Design Primer](https://github.com/donnemartin/system-design-primer) content into the System Design Academy curriculum. Replace surface-level module content with deep, structured explanations. Add the 7 primer case studies as interactive modules with diagrams and simulations. Keep the academy's existing interactive layer (quizzes, labs, progress tracking).

---

## Current Curriculum Structure

- **8 Phases**: Foundations, Low-Level Design, Core Distributed Systems, Architecture Patterns, Reliability & Operations, Real-World Systems, Expert Topics, Interview Prep
- **53 Modules** with lessons, quizzes, and labs
- **Interactive features**: Progress tracking, certificates, AI tutor, notes

---

## Primer Content to Integrate

### Phase 1 — Foundations (Existing → Enhanced)

| Module | Current Coverage | Enhancement from Primer |
|--------|-----------------|----------------------|
| HTTP/DNS/CDN | Basic | Add DNS lookup flow, TTL, record types (A, CNAME, MX), hierarchical DNS structure |
| Load Balancing | Basic | Add L4 vs L7, active-passive vs active-active, layer 4/7 differences, SSL termination |
| Caching | Basic | Add cache-aside, write-through, write-behind, refresh-ahead patterns with flow diagrams |
| API Design | Basic | Expand REST vs GraphQL vs gRPC with trade-offs, when to use each |

### New Modules to Add

| Module | Source | Topics |
|--------|--------|--------|
| Performance vs Scalability | Primer Index | When performance = speed problem vs scale problem, proportionality |
| Latency vs Throughput | Primer Index | Definitions, target maximal throughput with acceptable latency |
| CAP Theorem | Primer Index | CP vs AP, when to choose each, real-world examples |
| Consistency Patterns | Primer Index | Weak, Eventual, Strong consistency with use cases |
| Availability Patterns | Primer Index | Fail-over (active-passive/active-active), replication, 9s calculation |

### Phase 3 — Core Distributed Systems (Existing → Enhanced)

| Module | Current Coverage | Enhancement from Primer |
|--------|-----------------|----------------------|
| Load Balancing | 2-3 paragraphs | Full deep dive: Layer 4/7, least loaded, round-robin, health checks |
| Caching | 2-3 paragraphs | Add all 4 cache patterns with diagrams, when to update cache |
| Database Sharding | Basic | Add consistent hashing, federation, SQL tuning, denormalization |
| Message Queues | Basic | Expand with task queues, back pressure, producer-consumer patterns |

### Phase 5 — Reliability & Operations (Existing → Enhanced)

| Module | Current Coverage | Enhancement from Primer |
|--------|-----------------|----------------------|
| Observability | Metrics/logs/traces | Add the three pillars, structured logging, distributed tracing |
| Disaster Recovery | Basic | Add RTO/RPO, backup strategies, multi-region failover |

### New Case Study Modules (Phase 6 → Real-World Systems)

Add these 7 as full interactive modules:

| # | Case Study | Key Design Concepts |
|---|------------|-------------------|
| 1 | **URL Shortener** (Pastebin/Bit.ly) | Hash functions (MD5, Base62), collision handling, SQL vs NoSQL |
| 2 | **Social Network Feed** (Twitter/Facebook) | Fan-out on write vs read, pull vs push, timeline vs search trade-offs |
| 3 | **Web Crawler** | BFS vs DFS, robots.txt, politeness, deduplication, frontier queue |
| 4 | **Chat Server** (WhatsApp-style) | WebSocket, message ordering, online/offline status, presence |
| 5 | **Key-Value Store** (Search engine cache) | Consistent hashing, distributed indexing, in-memory vs disk |
| 6 | **Amazon Sales Rank** | Counter aggregation, eventual consistency, hot keys |
| 7 | **Scale to Millions on AWS** | Auto-scaling, multi-region, CDN, load balancer + caching layers |

Each case study module should include:
- **4-step design framework** (scope → HLD → deep dive → scale)
- **Diagram** (use existing architecture diagrams from case-study-configs)
- **Trade-offs discussion**
- **Quiz** (5 questions)
- **Lab** (simulation where applicable)

---

## Curriculum Mapping

### Foundations Phase — Module Mapping

| Existing Module | Primer Topic | Deep Dive Level |
|----------------|-------------|----------------|
| HTTP, DNS, CDN | DNS, CDN | Full — add DNS records, hierarchical DNS, push/pull CDN |
| Load Balancing | Load balancer | Full — L4/L7, active-active/passive, SSL termination |
| API Design | REST, RPC | Enhanced — add GraphQL, gRPC, trade-offs |
| Scaling | Performance vs Scalability, Latency vs Throughput | Full |
| Databases | RDBMS, NoSQL | Enhanced — add federation, sharding, denormalization |
| Estimation | Back-of-envelope, Latency numbers | Full — add powers of 2 table |

### Core Distributed Systems Phase — Module Mapping

| Existing Module | Primer Topic | Deep Dive Level |
|----------------|-------------|----------------|
| Load Balancing | Load balancer | Already covered in Foundations |
| Caching | Cache patterns | Full — all 4 patterns with flow diagrams |
| Database Sharding | Sharding, Consistent Hashing | Full |
| Message Queues | Message queues, Task queues, Back pressure | Full |
| CAP Theorem | CAP Theorem | Full — CP/AP with examples |
| Rate Limiting | Consistent Hashing | Already covered |

### Architecture Patterns Phase — Module Mapping

| Existing Module | Primer Topic | Deep Dive Level |
|----------------|-------------|----------------|
| Microservices | Microservices, Service Discovery | Enhanced — add service mesh, sidecar |
| Event-Driven | Message queues | Already covered above |
| CQRS | Consistency patterns | Enhanced — add weak/strong/eventual consistency |

### Real-World Systems Phase — Full Rewrite

Replace existing 8 modules with the 7 primer case studies + 1 additional (Design Uber = ride matching with surge pricing).

---

## Implementation Approach

### Step 1: Update Existing Module Content
Edit `data/curriculum.ts` and phase files to enhance deep-dive topics from primer.

### Step 2: Add New Foundational Modules
Insert modules for: Performance vs Scalability, CAP Theorem, Consistency Patterns, Availability Patterns.

### Step 3: Create 7 Case Study Modules
Add to Phase 6: URL Shortener, Social Feed, Web Crawler, Chat Server, Key-Value Store, Amazon Sales Rank, Scale to Millions.

### Step 4: Add Quizzes and Labs
Each case study gets a 5-question quiz. Labs for: load balancer sim, cache sim, consistent hashing sim, message queue sim.

---

## Tech Notes

- Use existing `case-study-configs.ts` structure for case study modules
- Add `video-embed` content blocks pointing to Harvard scalability lecture and primer-linked videos
- Preserve existing quiz/lab infrastructure
- Use `prerequisites` field to enforce learning order