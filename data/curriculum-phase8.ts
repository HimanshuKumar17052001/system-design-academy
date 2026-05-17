import type { Module } from "@/types/curriculum";
import {
  interviewFrameworkQuiz,
  interviewMockQuiz,
  interviewPitfallsQuiz,
  interviewCheatsheetsQuiz,
} from "./quizzes/phase8-quizzes";

export const phase8Modules: Module[] = [
  {
    id: "interview-framework",
    number: 47,
    category: "interview-prep",
    title: "Interview Framework",
    subtitle:
      "The 4-step interview process, communication best practices, clarifying questions, time management, estimation, and diagramming under pressure.",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "Timer",
    prerequisites: ["expert-global-scale"],
    lessons: [
      {
        id: "l47-process",
        title: "The 4-Step Interview Process",
        content: [
          {
            type: "text",
            content:
              "A structured interview process prevents rambling and ensures you cover all evaluation dimensions. Most interviewers score you on requirements gathering, high-level design, deep dive, trade-offs, and communication.",
          },
          {
            type: "table",
            headers: ["Phase", "Time", "Goal", "What to produce"],
            rows: [
              [
                "Clarify",
                "~5 min",
                "Align on scope, scale, and constraints",
                "Requirements list + rough estimates",
              ],
              [
                "High-level design",
                "~10 min",
                "Sketch the skeleton",
                "API contract, data model, component diagram",
              ],
              [
                "Deep dive",
                "~15 min",
                "Explore one critical component",
                "Detailed design of bottleneck (sharding, caching, consensus)",
              ],
              [
                "Trade-offs & wrap-up",
                "~15 min",
                "Discuss alternatives, failure modes, monitoring",
                "Decision matrix + summary",
              ],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "Time-box each phase. If you spend 25 minutes on the high-level diagram, you will not have time to discuss failure modes or monitoring — both are common rubric categories.",
          },
          {
            type: "code",
            language: "markdown",
            code: `## Example opening script
"Let me restate the problem to make sure I understand it correctly.
We need to design a system that does X for Y users with Z latency.
Before I start, I'd like to confirm a few requirements..."`,
            runnable: false,
          },
        ],
      },
      {
        id: "l47-communication",
        title: "Communication & Diagramming",
        content: [
          {
            type: "text",
            content:
              "You are evaluated on how clearly you think, not just what you know. Interviewers want to collaborate with you. Think aloud, verify assumptions, and invite redirection.",
          },
          {
            type: "bullets",
            items: [
              "Think aloud: Verbalize your reasoning so the interviewer can course-correct before you go too deep.",
              "Verify assumptions: 'Are we designing for a global audience or a single region?' 'Do we need strong consistency or is eventual consistency acceptable?'",
              "Label everything: Boxes, arrows, databases, caches. Unlabeled boxes force the interviewer to guess.",
              "Start simple, then elaborate: Draw a single API server + DB first. Add load balancer, cache, and sharding only after the skeleton is agreed upon.",
              "Use standard shapes: Cylinders for databases, rectangles for services, clouds for CDNs, lightning bolts for caches.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "Do not attempt pixel-perfect icons. A clean rectangle with a label is infinitely better than a tiny, unreadable microservice icon that took 2 minutes to draw.",
          },
        ],
      },
      {
        id: "l47-estimation",
        title: "Estimation Techniques",
        content: [
          {
            type: "text",
            content:
              "Back-of-the-envelope math validates feasibility. If your design requires 10 PB of RAM cache but the company has 1 PB of total data, it is infeasible. Estimation prevents these mismatches.",
          },
          {
            type: "bullets",
            items: [
              "Users: Start with DAU/MAU. Convert to peak QPS using the 1% rule (1% of users are active at peak).",
              "Storage: Data per entity × number of entities × replication factor × time horizon.",
              "Bandwidth: Average request size × QPS. Compare against typical NIC limits (1 Gbps ≈ 125 MB/s).",
              "Cache size: Working set percentage (e.g., 20% of data is 80% of reads) × data size.",
            ],
          },
          {
            type: "formula",
            expression: "Peak QPS ≈ DAU × avg_actions_per_user_per_day / 86400 × peak_multiplier",
            explanation: "Convert daily active users to peak queries per second using the average actions per user and a peak multiplier (typically 2-5×).",
          },
          {
            type: "formula",
            expression: "Storage per year = writes_per_second × avg_write_size × replication_factor × seconds_per_year",
            explanation: "Calculate annual storage by multiplying write throughput, record size, replication factor, and time. Convert to TB for readability.",
          },
          {
            type: "callout",
            variant: "info",
            content:
              "Memorize a few constants: 1M QPS is heavy, 1 PB is large, 1 Gbps NIC can handle ~10K 100KB requests/sec. Round aggressively — the interviewer cares about orders of magnitude, not exact bytes.",
          },
        ],
      },
    ],
    lab: {
      id: "interview-timer-lab",
      title: "Interview Timer",
      kind: "interview-timer",
      objective:
        "Practice pacing yourself with a 45-minute countdown that tracks the 5-10-15-15-5 phases.",
      hint:
        "Start the timer and simulate answering a prompt. Pause when you exceed a phase limit. Reflect: which phase took too long?",
    },
    quiz: interviewFrameworkQuiz,
    checkpoint: {
      prompt:
        "You are asked to design a ride-sharing app. List 3 clarifying questions, 2 functional requirements, 2 non-functional requirements, and a rough QPS estimate for 1M daily rides.",
      answer:
        "Clarifying: 1) Is this global or a single city? 2) Do we need real-time driver location or batched updates? 3) What is the latency target for ride matching? Functional: 1) Riders can request a ride and see ETA. 2) Drivers can accept/decline and navigate to pickup. Non-functional: 1) Match latency < 2s. 2) Availability 99.9%. QPS: 1M rides/day ≈ 11.5 rides/sec average. Peak 5× = ~60 rides/sec. Each ride generates ~10 events (location, status, payment) = ~600 events/sec peak.",
      type: "text",
    },
  },
  {
    id: "interview-mock",
    number: 48,
    category: "interview-prep",
    title: "Mock Interview Simulator",
    subtitle:
      "Practice with realistic prompts, rubric-based self-assessment, and common follow-up questions.",
    difficulty: "Intermediate",
    estimatedHours: 4,
    icon: "MonitorPlay",
    prerequisites: ["interview-framework"],
    lessons: [
      {
        id: "l48-prompts",
        title: "Realistic Interview Prompts",
        content: [
          {
            type: "text",
            content:
              "Most system design interviews use one of a small set of well-known prompts. Preparing structured answers for these gives you a template to adapt under pressure.",
          },
          {
            type: "bullets",
            items: [
              "Design a chat app (WhatsApp/Slack): Focus on WebSockets, message ordering, presence, and offline delivery.",
              "Design a URL shortener (Bitly): Focus on key generation, collision handling, redirect semantics, and analytics.",
              "Design Twitter / News feed: Focus on fan-out on write vs read, the celebrity problem, and timeline generation.",
            ],
          },
          {
            type: "table",
            headers: ["Prompt", "Classic deep-dive", "Common trap"],
            rows: [
              [
                "Chat app",
                "Message ordering in distributed systems; presence TTL",
                "Forgetting offline delivery and push notifications",
              ],
              [
                "URL shortener",
                "Base62 vs MD5; 301 vs 302; analytics pipeline",
                "Ignoring collision resolution at scale",
              ],
              [
                "Twitter",
                "Hybrid fan-out; min-heap timeline merge",
                "Pushing to 50M followers in real time",
              ],
            ],
          },
        ],
      },
      {
        id: "l48-rubric",
        title: "Rubric-Based Self-Assessment",
        content: [
          {
            type: "text",
            content:
              "After a mock interview, score yourself on each dimension. This turns vague 'I think it went okay' into actionable improvement areas.",
          },
          {
            type: "table",
            headers: ["Dimension", "Strong (4-5)", "Weak (1-2)"],
            rows: [
              [
                "Requirements",
                "Asked clarifying questions; listed functional + non-functional; estimated scale",
                "Jumped straight to design; missed scale or latency targets",
              ],
              [
                "High-level design",
                "Clear API, data model, and component diagram; logical flow",
                "Vague boxes with no labels; missing API or data model",
              ],
              [
                "Deep dive",
                "Explored one component with detail and justified choices",
                "Stayed shallow across all components; no technical depth",
              ],
              [
                "Trade-offs",
                "Compared 2+ alternatives; discussed failure modes and monitoring",
                "Stated one solution as 'obvious' without comparison",
              ],
              [
                "Communication",
                "Think aloud; invited feedback; summarized at transitions",
                "Silent for long periods; defensive to hints",
              ],
            ],
          },
        ],
      },
      {
        id: "l48-followups",
        title: "Common Follow-Up Questions",
        content: [
          {
            type: "text",
            content:
              "Interviewers probe deeper to distinguish senior engineers from juniors. Prepare answers for these follow-ups before you walk into the room.",
          },
          {
            type: "bullets",
            items: [
              "'How does your design handle a 10× traffic spike?' → Horizontal autoscaling, circuit breakers, load shedding, queue-based buffering.",
              "'What happens if this database node goes down?' → Replication, failover, backup/restore RPO/RTO, degraded mode.",
              "'Why did you choose eventual consistency here?' → Latency requirements, partition tolerance, conflict resolution strategy.",
              "'How would you monitor this system?' → SLIs (latency, error rate), SLOs (p99 < 200ms), dashboards, alerting thresholds.",
              "'What is the bottleneck in your design?' → Usually the database or the hottest cache shard. Quantify with estimation.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "When asked 'What would you do differently with unlimited time/resources?', mention testing, chaos engineering, formal verification, or a more rigorous capacity model.",
          },
        ],
      },
    ],
    lab: {
      id: "system-design-canvas-lab",
      title: "System Design Canvas",
      kind: "system-design-canvas",
      objective:
        "Sketch a high-level design for a given prompt using the interactive canvas tool. Add components, draw connections, and label each box.",
      hint:
        "Start with the user and API gateway. Add one database. Only add cache, CDN, and sharding after the skeleton is approved. Keep it readable.",
    },
    quiz: interviewMockQuiz,
    checkpoint: {
      prompt:
        "You are asked to design Twitter. Outline your opening 2-minute requirements clarification and your 5-minute high-level design sketch.",
      answer:
        "Clarification (2 min): 1) Scale: 500M DAU, avg 5 tweets/day = 2.5B tweets/day. 2) Features: post tweet, view home timeline, follow/unfollow, like. 3) Non-functional: timeline load < 200ms p99, availability 99.99%, global. High-level (5 min): API: POST /tweet, GET /timeline, POST /follow. Data model: User table, Tweet table, Follow graph (social graph). Components: Load balancer → API servers → Tweet service + Timeline service. Timeline service uses hybrid fan-out: push to Redis timelines for normal users, pull (merge) for celebrities. Redis cluster for hot timelines. Cassandra for tweet storage. CDN for media.",
      type: "text",
    },
  },
  {
    id: "interview-pitfalls",
    number: 49,
    category: "interview-prep",
    title: "Common Pitfalls",
    subtitle:
      "Over-engineering, premature optimization, missing non-functional requirements, ignoring failure modes, weak trade-off justification, and jumping to solutions.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "AlertTriangle",
    prerequisites: ["interview-mock"],
    lessons: [
      {
        id: "l49-overengineering",
        title: "Over-Engineering & Premature Optimization",
        content: [
          {
            type: "text",
            content:
              "Junior candidates often show off by proposing planetary-scale architectures for a simple problem. Senior engineers solve the right problem at the right scale.",
          },
          {
            type: "bullets",
            items: [
              "Over-engineering: Proposing microservices, event sourcing, or CRDTs for a single-region MVP with 1K users.",
              "Premature optimization: Spending 10 minutes tuning a hash function before validating the data model or consistency requirements.",
              "The antidote: Start with the simplest design that meets requirements. Add complexity only when estimations prove it is necessary.",
              "Magic phrase: 'For the stated scale, a single PostgreSQL instance with read replicas is sufficient. If we grow 100×, we can shard by user_id.'",
            ],
          },
          {
            type: "table",
            headers: ["Signal", "Risk", "Better approach"],
            rows: [
              [
                "'We need a global CRDT data model'",
                "Massive complexity for unclear benefit",
                "Use last-write-wins + vector clocks only if conflict rate justifies it",
              ],
              [
                "'Let's use Kafka for everything'",
                "Adds latency and operational overhead",
                "Use in-process queues or DB polling for low-throughput cases",
              ],
              [
                "'I can optimize this O(n) to O(log n)'",
                "Wastes interview time on low-impact details",
                "Quantify if n is large enough to matter first",
              ],
            ],
          },
        ],
      },
      {
        id: "l49-nfrs",
        title: "Missing Non-Functional Requirements & Failure Modes",
        content: [
          {
            type: "text",
            content:
              "A design that works in the happy path is only half a design. Interviewers explicitly test whether you consider latency, availability, consistency, and failure scenarios.",
          },
          {
            type: "bullets",
            items: [
              "Missing NFRs: Designing a payment system without mentioning latency, idempotency, or fraud detection.",
              "Ignoring failure modes: Proposing a distributed system but never discussing node crashes, network partitions, or cascading failures.",
              "Weak trade-off justification: Picking eventual consistency 'because it is faster' without quantifying the consistency window or conflict resolution.",
              "Jumping to solutions: Selecting Cassandra before asking whether the workload is read-heavy or write-heavy.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "Always add a 'Failure Modes' section to your design before moving to trade-offs. It signals operational maturity.",
          },
          {
            type: "code",
            language: "markdown",
            code: `## Failure mode checklist
- Single node failure → replication + failover
- Network partition → CAP choice + degraded mode
- Cascading failure → circuit breaker + bulkhead + rate limiter
- Data corruption → backups + checksums + point-in-time restore
- Traffic spike → autoscaling + load shedding + queue buffering`,
            runnable: false,
          },
        ],
      },
      {
        id: "l49-tradeoffs",
        title: "Weak Trade-Off Justification",
        content: [
          {
            type: "text",
            content:
              "Trade-offs are the signature of senior engineering. Anyone can pick a technology; senior engineers explain why they rejected the alternatives.",
          },
          {
            type: "bullets",
            items: [
              "Decision matrix: List options (e.g., SQL vs NoSQL, push vs pull, strong vs eventual consistency). Score each against criteria: latency, cost, complexity, team familiarity.",
              "Quantify where possible: 'SQL gives us ACID transactions at the cost of 2ms additional latency per write compared to Cassandra.'",
              "Acknowledge downsides: 'Sharding by user_id simplifies routing but makes cross-user queries expensive. For this use case, cross-user queries are rare, so the trade-off is acceptable.'",
              "Invite disagreement: 'I am leaning toward X, but I would validate this with load testing before committing.'",
            ],
          },
          {
            type: "formula",
            expression: "Decision score = Σ (weight_i × score_option_i) for each criterion i",
            explanation: "Score each design option against weighted criteria (latency, cost, complexity, team familiarity) to make objective trade-off decisions.",
          },
          {
            type: "callout",
            variant: "info",
            content:
              "Interviewers reward self-awareness. Saying 'I am not sure which is better at this scale; I would prototype both and measure' is often stronger than a blind guess.",
          },
        ],
      },
    ],
    lab: {
      id: "pitfall-detector-lab",
      title: "Pitfall Detector",
      kind: "pitfall-detector",
      objective:
        "Review 3 interactive design scenarios and identify which over-engineering, missing NFR, or failure-mode mistakes are present.",
      hint:
        "Read the scenario, then check the NFRs and failure modes first. Most errors hide in what was NOT said.",
    },
    quiz: interviewPitfallsQuiz,
    checkpoint: {
      prompt:
        "A candidate designs a URL shortener using a monolithic Go service + PostgreSQL + Redis cache. The interviewer asks, 'What if traffic grows 100× in one day?' The candidate immediately says, 'We should migrate to a microservices architecture with Kafka, Cassandra, and Kubernetes.' Identify the pitfall and suggest a better response.",
      answer:
        "Pitfall: Over-engineering and jumping to a complex architecture without analyzing the actual bottleneck. Better response: 'Let's identify the bottleneck first. With 100× traffic, QPS may jump from 1K to 100K. The current design likely bottlenecks at the database connection pool and single Redis instance. Step 1: Scale the monolith horizontally behind a load balancer and add read replicas to PostgreSQL. Step 2: Shard Redis by short_code prefix. Step 3: If writes become the bottleneck, shard PostgreSQL by short_code range. Microservices and Kafka add operational complexity; we should only introduce them if the monolith cannot scale further or if team size justifies service boundaries.'",
      type: "text",
    },
  },
  {
    id: "interview-cheatsheets",
    number: 50,
    category: "interview-prep",
    title: "Cheat Sheets & Quick Reference",
    subtitle:
      "One-page summaries for HTTP, DNS, caching, load balancing, databases, queues, microservices, CAP, consistency patterns, and real-world systems.",
    difficulty: "Advanced",
    estimatedHours: 4,
    icon: "BookOpen",
    prerequisites: ["interview-pitfalls"],
    lessons: [
      {
        id: "l50-networking",
        title: "Networking & Protocols Quick Reference",
        content: [
          {
            type: "text",
            content:
              "These constants and semantics appear in almost every system design. Memorize them so you can reference them instantly without breaking flow.",
          },
          {
            type: "table",
            headers: ["Concept", "Key facts", "Typical values"],
            rows: [
              [
                "HTTP methods",
                "GET (safe/idempotent), POST (create), PUT (idempotent update), DELETE (idempotent remove), PATCH (partial update)",
                "-",
              ],
              [
                "HTTP status codes",
                "2xx success, 3xx redirect, 4xx client error, 5xx server error",
                "200 OK, 201 Created, 301/302 Redirect, 400 Bad Request, 401 Unauthorized, 429 Too Many Requests, 500/502/503/504 Server errors",
              ],
              [
                "DNS records",
                "A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), NS (name server), TXT (verification)",
                "TTL: 300s to 86400s",
              ],
              [
                "TLS handshake",
                "Client hello → Server hello + certificate → Key exchange → Finished",
                "1-2 RTTs; TLS 1.3 reduces to 1 RTT",
              ],
            ],
          },
          {
            type: "code",
            language: "markdown",
            code: `## Quick DNS lookup flow
1. Browser cache → OS cache → Recursive resolver
2. Resolver queries Root → TLD (.com) → Authoritative (example.com)
3. Resolver returns A/AAAA record to client
4. Client opens TCP connection to IP + port 443
5. TLS handshake → HTTP request → Response`,
            runnable: false,
          },
        ],
      },
      {
        id: "l50-storage",
        title: "Storage, Caching & Consistency Quick Reference",
        content: [
          {
            type: "text",
            content:
              "Choosing the right storage and consistency model is a high-frequency interview decision. Have a mental cheat sheet ready.",
          },
          {
            type: "table",
            headers: ["Pattern", "When to use", "Watch out for"],
            rows: [
              [
                "Cache-aside",
                "Read-heavy, cache miss tolerable",
                "Stale data; thundering herd on cold start",
              ],
              [
                "Write-through",
                "Cache and DB must stay in sync",
                "Higher write latency; cache has all data (memory cost)",
              ],
              [
                "Write-behind",
                "Write-heavy, async durability acceptable",
                "Data loss if cache fails before flush",
              ],
              [
                "Read-through",
                "Simplify application logic",
                "Cache becomes a critical dependency",
              ],
            ],
          },
          {
            type: "table",
            headers: ["Consistency", "Definition", "Example use case"],
            rows: [
              [
                "Strong / Linearizable",
                "All reads see the latest write",
                "Bank balance, inventory",
              ],
              [
                "Eventual",
                "Reads may be stale; converge over time",
                "Social media likes, comments",
              ],
              [
                "Read-after-write",
                "User sees their own writes immediately",
                "User profile update",
              ],
              [
                "Causal",
                "Preserves happens-before relationships",
                "Collaborative editing",
              ],
            ],
          },
          {
            type: "bullets",
            items: [
              "CAP: During a partition, pick consistency (CP) or availability (AP). All distributed systems are partition-tolerant.",
              "PACELC: If partitioned, choose C or A; else choose latency or consistency.",
              "2PC: Strong consistency across services; blocking, coordinator is a SPOF.",
              "Saga: Eventual consistency; compensating transactions; preferred for long-running workflows.",
            ],
          },
        ],
      },
      {
        id: "l50-systems",
        title: "Real-World Systems Quick Reference",
        content: [
          {
            type: "text",
            content:
              "Interviewers often ask you to compare your design to how real companies solved similar problems. Having these references demonstrates industry awareness.",
          },
          {
            type: "table",
            headers: ["System", "Key technique", "Why it matters"],
            rows: [
              [
                "Twitter timeline",
                "Hybrid fan-out: push for normal users, pull for celebrities",
                "Classic read vs write amplification trade-off",
              ],
              [
                "Uber dispatch",
                "Redis Geo / quadtree + broadcast to top 3 drivers",
                "Geo-spatial indexing + matching latency",
              ],
              [
                "YouTube video",
                "ABR streaming (HLS/DASH) + CDN + transcoding pipeline",
                "Bandwidth adaptation + massive storage + processing",
              ],
              [
                "Amazon checkout",
                "Saga pattern + idempotency keys + Redis inventory DECR",
                "Distributed transactions + flash-sale consistency",
              ],
              [
                "Search autocomplete",
                "Trie / radix tree + sharding by prefix + CDN edge cache",
                "O(L) lookup + horizontal scaling + edge offload",
              ],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "Use these references as analogies: 'This is similar to Twitter's hybrid fan-out approach, but our read:write ratio is different, so I would adjust by...'",
          },
          {
            type: "code",
            language: "markdown",
            code: `## Microservices resilience cheat sheet
- Retry: Exponential backoff + jitter + max attempts
- Circuit breaker: Open → Half-open → Closed; fail fast
- Bulkhead: Isolate thread pools per dependency
- Rate limiter: Token bucket / sliding window per user/API key
- Timeout: Always set RPC timeouts shorter than upstream timeouts
- Idempotency: Idempotency keys on all mutating operations`,
            runnable: false,
          },
        ],
      },
    ],
    lab: {
      id: "case-study-walkthrough-lab",
      title: "Case Study Walkthrough",
      kind: "case-study-walkthrough",
      objective:
        "Review a complete design from requirements to trade-offs. Identify what was done well and what could be improved.",
      hint:
        "Start by reading the requirements and estimates. Then compare the proposed architecture to the checklist in your cheat sheets. Note missing failure modes or weak trade-offs.",
    },
    quiz: interviewCheatsheetsQuiz,
    checkpoint: {
      prompt:
        "You have 2 minutes left in an interview. Summarize your design for a URL shortener in 3-4 sentences, covering the core architecture, one key trade-off, and one failure mode.",
      answer:
        "Summary: 'We use a load balancer → API servers → Redis cache → PostgreSQL for short_code → long_url mapping. Base62 encoding of auto-increment IDs gives us 56.8B unique 6-character codes. Trade-off: We use 302 redirects for accurate analytics at the cost of higher origin load; 301 would reduce load but undercount clicks. Failure mode: If PostgreSQL becomes a write bottleneck, we shard by short_code prefix range. If Redis fails, reads fall through to the DB with a circuit breaker to prevent overload.'",
      type: "text",
    },
  },
];
