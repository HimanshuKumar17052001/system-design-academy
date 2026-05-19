# System Design Primer Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the System Design Academy curriculum with comprehensive content from the System Design Primer repo — deeper explanations, 5 new foundational modules, and 7 case study modules.

**Architecture:** 
- Update `data/curriculum.ts` and phase files to enhance existing module content
- Add new modules by inserting into the `modules` array in `data/curriculum.ts`
- Add 7 case studies following the existing case study module structure
- Use existing content types: text, callout, table, bullets, video-embed, diagram, quiz

**Tech Stack:** TypeScript, React components, existing curriculum infrastructure

---

## File Structure

**Existing files to modify:**
- `data/curriculum.ts` — Main module registry, add new module IDs
- `data/curriculum-phase3.ts` — Core Distributed Systems phase (enhance caching, message queues)
- `data/curriculum-phase6.ts` — Real-World Systems phase (replace with 7 case studies)
- `data/case-study-configs.ts` — Existing case study config structure
- `src/types/curriculum.ts` — Type definitions

**New files to create:**
- `data/curriculum-primer-modules.ts` — New foundational modules (CAP, Performance, Consistency, Availability patterns)
- `data/case-study-url-shortener.ts` — Case study 1
- `data/case-study-social-feed.ts` — Case study 2
- `data/case-study-web-crawler.ts` — Case study 3
- `data/case-study-chat-server.ts` — Case study 4
- `data/case-study-key-value-store.ts` — Case study 5
- `data/case-study-sales-rank.ts` — Case study 6
- `data/case-study-scale-millions.ts` — Case study 7

---

## Task 1: Enhance Foundations Phase Content

**Files:**
- Modify: `data/curriculum.ts` (Phase 1 modules, module IDs 1-7)

- [ ] **Step 1: Read current Phase 1 module structure**

Run: Read `data/curriculum.ts` lines 11-200 to understand module structure

- [ ] **Step 2: Enhance "HTTP, DNS, CDN" module content**

In `curriculum.ts`, find module `sd-fundamentals` and add DNS deep-dive content to lesson `l1-what-is-sd`. Add to the existing lesson content:

```typescript
// Add to the "What is System Design?" lesson:
{
  type: "callout",
  variant: "info",
  content: "DNS Hierarchy: Client → ISP DNS → Root DNS → TLD DNS → Authoritative DNS. Each level caches results with TTL."
},
{
  type: "bullets",
  items: [
    "DNS Record Types: A (address), CNAME (canonical), MX (mail exchange), NS (name server)",
    "DNS Resolution Flow: recursive resolver → root → TLD → authoritative server",
    "CDN Benefits: Reduces latency, offloads origin servers, provides DDoS protection",
    "Push CDN: Content uploaded once when changed. Best for static, infrequently updated content.",
    "Pull CDN: Content fetched on first request, cached until TTL expires. Best for high-traffic content."
  ]
},
{
  type: "table",
  headers: ["DNS Record", "Purpose", "Example"],
  rows: [
    ["A", "Points hostname to IPv4 address", "www.example.com → 93.184.216.34"],
    ["CNAME", "Points hostname to another hostname", "www.example.com → example.com"],
    ["MX", "Mail server for domain", "example.com → mail.example.com"],
    ["NS", "Authoritative DNS servers", "example.com → ns1.example.com"]
  ],
  caption: "Common DNS record types"
}
```

- [ ] **Step 3: Enhance Load Balancing module**

Find load balancer module (likely `sd-load-balancer`) and add:

```typescript
{
  type: "table",
  headers: ["Layer", "What it routes", "Examples"],
  rows: [
    ["Layer 4 (Transport)", "IP address + TCP/UDP port", "HAProxy TCP, AWS NLB"],
    ["Layer 7 (Application)", "HTTP URLs, headers, content", "HAProxy HTTP, AWS ALB, Nginx"]
  ],
  caption: "Load balancer layers"
},
{
  type: "bullets",
  items: [
    "Active-Passive Failover: Only active handles traffic. Passive takes over on failure. Heartbeats detect failure.",
    "Active-Active Failover: Both servers handle traffic. DNS routes to both. Requires session persistence.",
    "SSL Termination: Load balancer decrypts SSL, forwards plain HTTP to backend. Reduces backend CPU load.",
    "Session Persistence: Cookie-based routing ensures a user's requests go to the same server instance."
  ]
}
```

- [ ] **Step 4: Build and commit**

Run: `cd /Users/himanshukumar/Developer/system-design-academy && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add data/curriculum.ts
git commit -m "enhance: Add DNS and load balancer deep-dive content from primer"
```

---

## Task 2: Add 5 New Foundational Modules

**Files:**
- Create: `data/curriculum-primer-modules.ts`
- Modify: `data/curriculum.ts` (import and register new modules)
- Modify: Phase mapping for prerequisites

- [ ] **Step 1: Create new modules file**

Create `data/curriculum-primer-modules.ts` with 5 new modules:

```typescript
import type { Module } from "@/types/curriculum";

export const primerModules: Module[] = [
  {
    id: "sd-performance-scalability",
    number: 101, // Temporary number
    category: "foundations",
    title: "Performance vs Scalability",
    subtitle: "When slow matters vs when growth matters — understanding the difference.",
    difficulty: "Beginner",
    estimatedHours: 1,
    icon: "TrendingUp",
    prerequisites: [],
    lessons: [
      {
        id: "l-ps-intro",
        title: "Performance vs Scalability",
        content: [
          {
            type: "text",
            content: "A service is SCALABLE if increasing resources yields proportional performance increase. A service has a PERFORMANCE problem if it's slow for a single user."
          },
          {
            type: "callout",
            variant: "info",
            content: "Example: If doubling your servers doubles your throughput, you're scalable. If adding more users makes everyone slower without adding resources, you have a performance problem."
          },
          {
            type: "table",
            headers: ["Symptom", "Problem Type", "Fix"],
            rows: [
              ["Slow for single user", "Performance", "Optimize code, add caching"],
              ["Slow under heavy load", "Scalability", "Add resources, scale horizontally"],
              ["Works with 100 users, fails with 10000", "Scalability", "Redesign for scale"]
            ],
            caption: "Performance vs Scalability diagnosis"
          }
        ]
      }
    ]
  },
  {
    id: "sd-cap-theorem",
    number: 102,
    category: "foundations",
    title: "CAP Theorem",
    subtitle: "Consistency, Availability, Partition tolerance — choose 2 out of 3.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Shield",
    prerequisites: ["sd-performance-scalability"],
    lessons: [
      {
        id: "l-cap-intro",
        title: "The CAP Theorem",
        content: [
          {
            type: "text",
            content: "In a distributed system, you can only guarantee 2 of 3: Consistency (every read gets most recent write), Availability (every request gets a response), Partition Tolerance (system works despite network failures)."
          },
          {
            type: "callout",
            variant: "warning",
            content: "Networks aren't reliable — partition tolerance is non-negotiable. You must choose between CP (Consistency + Partition Tolerance) or AP (Availability + Partition Tolerance)."
          },
          {
            type: "table",
            headers: ["System Type", "Trade-off", "When to Use"],
            rows: [
              ["CP", "Consistency over Availability", "Payments, banking, atomic operations"],
              ["AP", "Availability over Consistency", "Social media feeds, comments, likes"]
            ],
            caption: "CP vs AP systems"
          }
        ]
      }
    ]
  },
  {
    id: "sd-consistency-patterns",
    number: 103,
    category: "foundations",
    title: "Consistency Patterns",
    subtitle: "Weak, Eventual, and Strong consistency — when each matters.",
    difficulty: "Intermediate",
    estimatedHours: 1.5,
    icon: "RefreshCw",
    prerequisites: ["sd-cap-theorem"],
    lessons: [
      {
        id: "l-consistency-intro",
        title: "Consistency Patterns",
        content: [
          {
            type: "bullets",
            items: [
              "Weak Consistency: After a write, reads may or may not see it. Used in real-time apps (VoIP, video calls, multiplayer games).",
              "Eventual Consistency: After a write, reads will eventually see it (milliseconds). Used in DNS, email, CDNs. High availability.",
              "Strong Consistency: After a write, reads always see it. Used in file systems, RDBMS. Transactional systems require this."
            ]
          }
        ]
      }
    ]
  },
  {
    id: "sd-availability-patterns",
    number: 104,
    category: "foundations",
    title: "Availability Patterns",
    subtitle: "Failover and replication strategies for high availability.",
    difficulty: "Intermediate",
    estimatedHours: 1.5,
    icon: "CheckCircle",
    prerequisites: ["sd-performance-scalability"],
    lessons: [
      {
        id: "l-availability-intro",
        title: "High Availability Patterns",
        content: [
          {
            type: "bullets",
            items: [
              "Active-Passive Failover: Backup server on standby. Heartbeats detect failure. Downtime = detection time + failover time.",
              "Active-Active Failover: Multiple servers handle traffic. Spreads load, requires load balancer awareness of both.",
              "Replication: Copying data to multiple nodes. Master-slave (async, one write node) or Master-master (sync, multiple write nodes)."
            ]
          },
          {
            type: "table",
            headers: ["Availability", "Downtime/Year", "Downtime/Day"],
            rows: [
              ["99.9999% (6 nines)", "31.5 seconds", "0.086 seconds"],
              ["99.999% (5 nines)", "5.25 minutes", "0.86 seconds"],
              ["99.99% (4 nines)", "52.6 minutes", "8.6 seconds"],
              ["99.9% (3 nines)", "8.76 hours", "1.44 minutes"],
              ["99% (2 nines)", "3.65 days", "14.4 minutes"]
            ],
            caption: "Availability and downtime impact"
          }
        ]
      }
    ]
  },
  {
    id: "sd-latency-throughput",
    number: 105,
    category: "foundations",
    title: "Latency vs Throughput",
    subtitle: "Speed of operations vs volume of operations — both matter.",
    difficulty: "Beginner",
    estimatedHours: 1,
    icon: "Gauge",
    prerequisites: [],
    lessons: [
      {
        id: "l-latency-throughput",
        title: "Latency and Throughput",
        content: [
          {
            type: "bullets",
            items: [
              "Latency: Time to perform an action or produce a result. Measured in ms or seconds.",
              "Throughput: Number of actions per unit time. Measured in QPS, RPS, TPS.",
              "Goal: Maximize throughput while keeping latency acceptable."
            ]
          },
          {
            type: "callout",
            variant: "info",
            content: "Back-of-envelope: If a system has 100ms latency and can handle 10 concurrent requests, max throughput = 10 req/100ms = 100 QPS."
          }
        ]
      }
    ]
  }
];
```

- [ ] **Step 2: Import and register in curriculum.ts**

Open `data/curriculum.ts`, add import:
```typescript
import { primerModules } from "./curriculum-primer-modules";
```

In the `modules` array, add `...primerModules` spread after existing modules (or integrate into correct phase order by category).

- [ ] **Step 3: Build and commit**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add data/curriculum-primer-modules.ts data/curriculum.ts
git commit -m "feat: Add 5 foundational modules from system design primer"
```

---

## Task 3: Add 7 Case Study Modules

**Files:**
- Create: `data/case-study-url-shortener.ts`
- Create: `data/case-study-social-feed.ts`
- Create: `data/case-study-web-crawler.ts`
- Create: `data/case-study-chat-server.ts`
- Create: `data/case-study-key-value-store.ts`
- Create: `data/case-study-sales-rank.ts`
- Create: `data/case-study-scale-millions.ts`
- Modify: `data/curriculum.ts` (register case studies, likely in phase 6)

- [ ] **Step 1: Create URL Shortener case study**

Create `data/case-study-url-shortener.ts`:

```typescript
import type { Module } from "@/types/curriculum";

export const urlShortenerModule: Module = {
  id: "cs-url-shortener",
  number: 61,
  category: "real-world-systems",
  title: "Design URL Shortener (Bit.ly)",
  subtitle: "Hash-based URL shortening with collision handling and analytics.",
  difficulty: "Intermediate",
  estimatedHours: 2,
  icon: "Link",
  prerequisites: ["sd-fundamentals"],
  lessons: [
    {
      id: "cs-url-l1",
      title: "Step 1: Clarify Requirements",
      content: [
        {
          type: "text",
          content: "Design a URL shortening service like Bit.ly or TinyURL. Users submit a long URL, get a short URL back."
        },
        {
          type: "bullets",
          items: [
            "Functional: Shorten URL, redirect short URL to original, custom aliases (paid)",
            "Non-functional: 100M URLs/day, redirects < 10ms, 99.9% uptime",
            "Scale: 10M new URLs/day, 100:1 read/write ratio (redirects vs creates)"
          ]
        }
      ]
    },
    {
      id: "cs-url-l2",
      title: "Step 2: High-Level Design",
      content: [
        {
          type: "diagram",
          title: "URL Shortener Architecture",
          description: "Client → API Gateway → URL Shortener Service → Database + Cache",
          data: { type: "architecture", components: ["Client", "API Gateway", "Shortener Service", "Redis Cache", "SQL/NoSQL DB"] }
        },
        {
          type: "bullets",
          items: [
            "Hash Function: MD5(URL) → 128-bit hash → Base62 encode → 7-8 character key",
            "Base62 encoding: 0-9, A-Z, a-z gives 62 chars per position",
            "Collision handling: Check DB, if exists append counter, re-hash",
            "SQL Schema: id, short_url, long_url, created_at, click_count"
          ]
        }
      ]
    },
    {
      id: "cs-url-l3",
      title: "Step 3: Deep Dive — Hash Generation",
      content: [
        {
          type: "table",
          headers: ["Method", "Pros", "Cons"],
          rows: [
            ["MD5 + Base62", "Simple, fast", "64-bit collision risk"],
            ["Base36 + timestamp", "Collision-free", "Predictable"],
            ["KSuid", "Time-ordered, unique", "20-char length"]
          ],
          caption: "Hash generation approaches"
        },
        {
          type: "callout",
          variant: "info",
          content: "Bit.ly uses a proprietary ID generation scheme that's time-ordered and globally unique."
        }
      ]
    },
    {
      id: "cs-url-l4",
      title: "Step 4: Scale the Design",
      content: [
        {
          type: "bullets",
          items: [
            "Bottleneck: Database writes are the bottleneck at 10M writes/day",
            "Solution: Batch writes, async DB updates after redirect confirmation",
            "Cache: Redis cache for hot URLs (popular links), LRU eviction",
            "Read scaling: Read replicas, Redis cache, CDN for static assets"
          ]
        }
      ]
    }
  ]
};
```

- [ ] **Step 2: Create Social Feed case study**

Create `data/case-study-social-feed.ts` with similar structure for Twitter/Facebook feed design. Cover:
- Push (fan-out on write) vs Pull (fan-out on read)
- Hybrid approaches
- Timeline vs search trade-offs
- Cache strategies

- [ ] **Step 3: Create Web Crawler case study**

Create `data/case-study-web-crawler.ts`. Cover:
- BFS vs DFS crawling
- robots.txt compliance
- Politeness (rate limiting)
- Deduplication (Bloom filter)
- Frontier queue pattern

- [ ] **Step 4: Create remaining 4 case studies**

Create chat server, key-value store, sales rank, and scale-to-millions following the same pattern as Step 1.

- [ ] **Step 5: Register case studies in curriculum.ts**

Add imports and spread into modules array.

- [ ] **Step 6: Build and commit**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add data/case-study-*.ts data/curriculum.ts
git commit -m "feat: Add 7 case study modules from system design primer"
```

---

## Task 4: Enhance Caching & Message Queues (Phase 3)

**Files:**
- Modify: `data/curriculum-phase3.ts`

- [ ] **Step 1: Read current caching module**

Run: `awk 'NR>=1 && NR<=50' data/curriculum-phase3.ts`

- [ ] **Step 2: Add cache patterns deep-dive**

Find the caching module in phase 3 and add a new lesson with all 4 cache patterns:

```typescript
{
  id: "l-cache-patterns",
  title: "When to Update the Cache",
  content: [
    {
      type: "table",
      headers: ["Pattern", "Read", "Write", "Use Case"],
      rows: [
        ["Cache-aside", "App reads from cache, falls back to DB", "App writes to DB, invalidates cache", "Read-heavy, tolerate stale data"],
        ["Write-through", "App reads from cache", "App writes to cache AND DB synchronously", "Must have current data always"],
        ["Write-behind (write-back)", "App reads from cache", "App writes to cache, DB updated async", "Write-heavy, can lose data on crash"],
        ["Refresh-ahead", "Cache auto-refreshes before expiry", "Background refresh triggered by TTL", "Predictable data, reduce cache misses"]
      ],
      caption: "Cache update patterns"
    }
  ]
}
```

- [ ] **Step 3: Add message queues deep-dive**

Find message queues module and add:

```typescript
{
  id: "l-mq-patterns", 
  title: "Message Queues and Task Queues",
  content: [
    {
      type: "bullets",
      items: [
        "Message Queue: Producer sends messages, consumer reads. Fire-and-forget delivery. Examples: RabbitMQ, Kafka.",
        "Task Queue: Worker pulls tasks, processes, acknowledges. At-least-once delivery. Examples: Celery, RQ.",
        "Back Pressure: When queue fills up, tell producers to slow down instead of dropping messages.",
        "Dead Letter Queue: Failed messages go here for later inspection instead of disappearing."
      ]
    }
  ]
}
```

- [ ] **Step 4: Build and commit**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add data/curriculum-phase3.ts
git commit -m "enhance: Add cache patterns and message queue deep-dive"
```

---

## Final Verification

- [ ] **Step 1: Verify curriculum structure**

Run: `node -e "const { modules } = require('./data/curriculum.ts'); console.log(modules.length + ' modules'); console.log(modules.filter(m => m.category === 'real-world-systems').map(m => m.title).join(', '))"`
Expected: 53+ modules including 7 case studies

- [ ] **Step 2: Verify no build errors**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Push to origin**

```bash
git push origin main
vercel deploy --prod
```

---

## Spec Coverage Checklist

- [x] Performance vs Scalability module — Task 2
- [x] CAP Theorem module — Task 2
- [x] Consistency Patterns module — Task 2
- [x] Availability Patterns module — Task 2
- [x] Latency vs Throughput module — Task 2
- [x] DNS deep-dive (HTTP/DNS/CDN) — Task 1
- [x] Load balancer deep-dive — Task 1
- [x] Cache patterns (all 4) — Task 4
- [x] Message queues + task queues + back pressure — Task 4
- [x] 7 Case studies — Task 3
- [x] Build passes — All tasks