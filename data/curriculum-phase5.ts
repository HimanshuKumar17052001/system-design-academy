import type { Module } from "@/types/curriculum";
import {
  opsObservabilityQuiz,
  opsDeploymentQuiz,
  opsDrQuiz,
  opsChaosQuiz,
  opsAutoscaleQuiz,
} from "./quizzes/phase5-quizzes";

export const phase5Modules: Module[] = [
  {
    id: "ops-observability",
    number: 31,
    category: "reliability-ops",
    title: "Observability",
    subtitle: "The Three Pillars: metrics, logging, and distributed tracing.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Activity",
    prerequisites: ["arch-k8s"],
    lessons: [
      {
        id: "l31-pillars",
        title: "The Three Pillars",
        content: [
          {
            type: "text",
            content: "Observability is the ability to understand the internal state of a system by examining its outputs. The three pillars — metrics, logs, and traces — provide complementary views into system behavior.",
          },
          {
            type: "table",
            headers: ["Pillar", "What it captures", "Granularity", "Tools", "Use Case"],
            rows: [
              ["Metrics", "Numeric data over time (counters, gauges, histograms)", "Aggregated", "Prometheus, Datadog, CloudWatch", "Alert on error rate > 1%"],
              ["Logs", "Discrete events with timestamps and context", "Per-event", "ELK, Splunk, Loki, CloudWatch Logs", "Debug why a specific request failed"],
              ["Traces", "End-to-end request path across services", "Per-request", "Jaeger, Zipkin, AWS X-Ray", "Find which microservice added 500ms latency"],
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "Metrics tell you THAT there is a problem. Logs tell you WHAT happened. Traces tell you WHERE it happened. You need all three.",
          },
        ],
      },
      {
        id: "l31-slislo",
        title: "SLIs, SLOs, and SLAs",
        content: [
          {
            type: "text",
            content: "Service Level Indicators (SLIs), Objectives (SLOs), and Agreements (SLAs) define reliability targets in measurable terms.",
          },
          {
            type: "bullets",
            items: [
              "SLI: A quantitative measure of service quality. Examples: request latency (p99 < 200ms), error rate (< 0.1%), availability (99.99%).",
              "SLO: A target value for an SLI. '99.9% of requests complete in < 500ms over a 30-day window.'",
              "SLA: A contractual agreement with consequences. 'If availability drops below 99.9%, we provide a 10% service credit.'",
              "Error budget: The allowable unavailability within an SLO window. 99.9% over 30 days = 43.2 minutes of downtime budget.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "observability-dashboard-lab",
      title: "Three Pillars Dashboard",
      kind: "traffic-simulator",
      objective: "Explore a simulated system with metrics, logs, and traces to identify the source of a performance regression.",
      hint: "Start with the metrics dashboard. Identify the service with elevated latency. Then follow traces to find the exact span. Inspect logs for the error context.",
    },
    quiz: opsObservabilityQuiz,
    checkpoint: {
      prompt: "Your p99 latency jumped from 100ms to 2s. Metrics show database CPU at 95%. Traces show all slow requests pass through the Payment Service. Logs show 'Connection pool exhausted'. What is the root cause and fix?",
      answer: "Root cause: The database connection pool is too small for the current load, causing requests to wait for available connections. Fix: 1) Increase connection pool size (but monitor DB capacity — more connections = more DB load). 2) Add a circuit breaker or bulkhead on the Payment Service to fail fast when the pool is exhausted, preventing cascading slowdown. 3) Check for connection leaks (connections not returned to the pool). 4) Consider read replicas to offload read queries. 5) Add a cache layer for read-heavy payment lookups.",
      type: "text",
    },
  },
  {
    id: "ops-deployment",
    number: 32,
    category: "reliability-ops",
    title: "Deployment Strategies",
    subtitle: "Rolling, blue-green, canary, and feature flags for safe releases.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Rocket",
    prerequisites: ["ops-observability"],
    lessons: [
      {
        id: "l32-strategies",
        title: "Deployment Strategies Compared",
        content: [
          {
            type: "text",
            content: "Deployment strategy determines how new code is introduced to production. The right choice depends on risk tolerance, rollback speed requirement, and infrastructure cost.",
          },
          {
            type: "table",
            headers: ["Strategy", "How it works", "Risk", "Rollback", "Cost"],
            rows: [
              ["Recreate", "Stop old, start new (downtime)", "High", "Slow (restart old)", "Low"],
              ["Rolling", "Replace pods one by one", "Medium", "Slow (roll back one by one)", "Low"],
              ["Blue-Green", "Two identical environments; instant switch", "Low", "Instant (switch back)", "High (2× resources)"],
              ["Canary", "Route small % to new version, monitor, expand", "Low", "Fast (route traffic back)", "Medium"],
              ["A/B Testing", "Route by user segment (feature test)", "Low", "Fast", "Medium"],
            ],
          },
        ],
      },
      {
        id: "l32-feature-flags",
        title: "Feature Flags",
        content: [
          {
            type: "text",
            content: "Feature flags (feature toggles) decouple deployment from release. Code is deployed to production but hidden behind a toggle that can be enabled for specific users, regions, or percentages.",
          },
          {
            type: "bullets",
            items: [
              "Kill switch: Instantly disable a feature if it causes issues, without redeploying.",
              "Gradual rollout: Enable for 1% of users, then 5%, 10%, 50%, 100%.",
              "User targeting: Enable for internal users first (dogfooding), then beta users.",
              "Experimentation: A/B test two variations by routing users to different code paths.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Feature flag debt is real. Flags that are permanently on should be removed from code after validation. Use a flag management platform (LaunchDarkly, Unleash, Flagsmith) to track and clean up.",
          },
        ],
      },
    ],
    quiz: opsDeploymentQuiz,
    lab: {
      id: "deployment-strategies-lab",
      title: "Deployment Visualizer",
      kind: "deployment-visualizer",
      objective: "Visualize rolling, blue-green, canary, and A/B test deployments in a simulated environment.",
      hint: "Switch between strategy tabs and use the controls to start, pause, and rollback deployments. Watch how traffic shifts and health checks behave.",
    },
    checkpoint: {
      prompt: "You deploy a new recommendation algorithm. Within 10 minutes, conversion rate drops 30%. You used a canary deployment at 5% traffic. How do you respond, and what would have happened with a rolling deployment?",
      answer: "With canary: Immediately route 100% traffic back to the stable version (the 95% baseline). The 5% canary users are affected, but 95% are protected. Investigate the canary metrics (recommendation quality, latency, error rate) to identify the bug. Fix and redeploy canary at 1% with stricter metrics gates. With rolling deployment: The bad version would have slowly replaced all pods over 10-20 minutes. By the time you detected the drop, 50-100% of users might be affected. Rollback requires replacing all pods again — much slower and higher blast radius.",
      type: "text",
    },
  },
  {
    id: "ops-dr",
    number: 33,
    category: "reliability-ops",
    title: "Disaster Recovery",
    subtitle: "RPO, RTO, multi-region failover, and backup strategies.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Shield",
    prerequisites: ["ops-deployment"],
    lessons: [
      {
        id: "l33-rpo-rto",
        title: "RPO and RTO",
        content: [
          {
            type: "text",
            content: "Recovery Point Objective (RPO) and Recovery Time Objective (RTO) are the two critical metrics that define your disaster recovery strategy.",
          },
          {
            type: "bullets",
            items: [
              "RPO: How much data can you afford to lose? Measured in time (e.g., 1 hour = you can lose 1 hour of data).",
              "RTO: How quickly must you recover? Measured in time (e.g., 5 minutes = system must be back online within 5 minutes).",
              "RPO drives backup frequency: RPO=1h means hourly backups. RPO=0 means synchronous replication.",
              "RTO drives automation: RTO=5min requires automated failover. RTO=24h allows manual failover.",
            ],
          },
        ],
      },
      {
        id: "l33-multi-region",
        title: "Multi-Region Strategies",
        content: [
          {
            type: "text",
            content: "Running in multiple regions provides resilience against datacenter-level failures. There are three primary strategies.",
          },
          {
            type: "table",
            headers: ["Strategy", "How it works", "RTO", "RPO", "Cost"],
            rows: [
              ["Active-Passive (Cold Standby)", "Standby region is off; data replicated; manual failover on disaster", "Hours", "Minutes to hours", "Low"],
              ["Active-Passive (Warm Standby)", "Standby runs minimal instances; scaled up on failover", "Minutes", "Minutes", "Medium"],
              ["Active-Active", "Both regions serve traffic continuously", "Near-zero", "Near-zero", "High (2× infrastructure)"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Active-active is the gold standard for high-availability systems but requires conflict resolution for writes that hit both regions. Use last-write-wins, vector clocks, or CRDTs depending on data semantics.",
          },
        ],
      },
    ],
    quiz: opsDrQuiz,
    checkpoint: {
      prompt: "A bank requires RPO=0 and RTO=5 minutes for its core ledger. Which multi-region strategy and replication method should they use? What are the trade-offs?",
      answer: "Strategy: Active-active with synchronous replication between regions. Every write is committed to both regions before acknowledging the client. Trade-offs: 1) Write latency increases (cross-region round-trip, ~50-150ms). 2) If one region is partitioned, the system must choose between availability and consistency (CP). For a bank ledger, CP is correct: prefer to stop accepting writes than to risk data inconsistency. 3) Active-active requires conflict resolution for edge cases (e.g., account debits in both regions simultaneously). Use distributed consensus (Paxos/Raft) for the ledger. 4) Cost is 2× infrastructure plus cross-region bandwidth.",
      type: "text",
    },
  },
  {
    id: "ops-chaos",
    number: 34,
    category: "reliability-ops",
    title: "Chaos Engineering",
    subtitle: "Fault injection, GameDays, and building confidence through controlled failure.",
    difficulty: "Expert",
    estimatedHours: 2,
    icon: "Flame",
    prerequisites: ["ops-dr"],
    lessons: [
      {
        id: "l34-principles",
        title: "Principles of Chaos Engineering",
        content: [
          {
            type: "text",
            content: "Chaos Engineering is the discipline of experimenting on a system to build confidence in its capability to withstand turbulent conditions in production.",
          },
          {
            type: "bullets",
            items: [
              "Start with a steady-state hypothesis: 'The system maintains <1% error rate under normal load.'",
              "Introduce real-world failures: kill a server, introduce network latency, drop packets, fill a disk.",
              "Validate the hypothesis: If error rate stays <1%, the system is resilient. If not, you found a weakness.",
              "Automate and run continuously: Netflix's Chaos Monkey randomly terminates production instances every day.",
              "Minimize blast radius: Start in dev/staging, then production with canary scope, then full production.",
            ],
          },
        ],
      },
      {
        id: "l34-experiments",
        title: "Common Chaos Experiments",
        content: [
          {
            type: "table",
            headers: ["Experiment", "What it tests", "Tool"],
            rows: [
              ["Instance failure", "Auto-scaling and failover", "Chaos Monkey"],
              ["Latency injection", "Timeout and circuit breaker config", "Toxiproxy, Chaos Mesh"],
              ["Network partition", "Split-brain handling, CAP choices", "Chaos Mesh, Gremlin"],
              ["CPU/memory pressure", "Resource limits and OOM handling", "Stress-ng, Chaos Mesh"],
              ["Dependency failure", "Graceful degradation", "Chaos Monkey for specific services"],
              ["Clock skew", "Time-sensitive operations", "libfaketime"],
            ],
          },
        ],
      },
    ],
    lab: {
      id: "chaos-lab",
      title: "Chaos Lab",
      kind: "chaos-lab",
      objective: "Inject failures into a simulated system and apply defenses (circuit breakers, retries, fallbacks) to maintain availability.",
      hint: "Start by killing one server. If traffic still succeeds, try killing the database. Apply a circuit breaker to fail fast. Add a fallback cache for degraded mode.",
    },
    quiz: opsChaosQuiz,
    checkpoint: {
      prompt: "During a GameDay, you kill the primary database. The application shows 500 errors for 5 minutes before the replica is promoted. How do you reduce this to <30 seconds?",
      answer: "1) Automated failover: Use a managed database (RDS Multi-AZ, Cloud SQL HA) or Patroni + etcd for automatic primary promotion. Manual failover is too slow. 2) Connection pooling + health checks: The application connection pool should detect the primary is dead within seconds (aggressive TCP keepalive + health checks every 2s). 3) Read replicas for reads: Route read traffic to replicas immediately; only writes are blocked. 4) Circuit breaker on write path: Trip OPEN when DB is unavailable, queue writes for later replay. 5) Cache warm standby: Maintain a hot cache of critical data so reads can serve from cache during the brief failover window.",
      type: "text",
    },
  },
  {
    id: "ops-autoscale",
    number: 35,
    category: "reliability-ops",
    title: "Autoscaling Strategies",
    subtitle: "CPU-based, custom metrics, predictive scaling, and cost optimization.",
    difficulty: "Advanced",
    estimatedHours: 1,
    icon: "TrendingUp",
    prerequisites: ["ops-chaos"],
    lessons: [
      {
        id: "l35-strategies",
        title: "Scaling Strategies",
        content: [
          {
            type: "text",
            content: "Autoscaling ensures your system handles traffic variations without manual intervention. The key is choosing the right metric to scale on.",
          },
          {
            type: "table",
            headers: ["Metric", "When to use", "Latency", "Risk"],
            rows: [
              ["CPU utilization", "General-purpose compute", "30-60s", "CPU may not correlate with load (I/O bound)"],
              ["Request count / QPS", "API services", "10-30s", "Can over-scale if requests are cheap"],
              ["Queue depth", "Worker pools, message consumers", "10-30s", "If consumers are slow, scaling may not help"],
              ["Custom metric", "ML inference (GPU utilization), cache hit rate", "Configurable", "Requires instrumentation"],
              ["Schedule-based", "Predictable patterns (business hours)", "Instant", "Does not handle unexpected spikes"],
              ["Predictive (ML)", "Complex, variable patterns", "Pre-scales before spike", "Cost of false positives (over-provisioning)"],
            ],
          },
        ],
      },
    ],
    quiz: opsAutoscaleQuiz,
    lab: {
      id: "autoscaler-lab",
      title: "Autoscaler Simulator",
      kind: "autoscaler",
      objective: "Simulate Kubernetes HPA behavior with configurable metrics, thresholds, and delays.",
      hint: "Increase traffic load and observe how pods scale up after the configured delay. Try a viral event scenario with high scale-up delay to see overload.",
    },
    checkpoint: {
      prompt: "Your video encoding service uses CPU-based HPA. During a viral video event, CPU stays at 40% (I/O bound on network storage) but queue depth grows from 10 to 5000. Videos take 10 minutes to start encoding. How do you fix the scaling?",
      answer: "Switch from CPU-based to queue-depth-based scaling using KEDA. Configure KEDA to scale on the encoding job queue depth: target average queue depth per pod = 50. At 5000 queue depth, this scales to 100 pods. Set maxReplicas to a reasonable limit (e.g., 200) to control cost. Add a second trigger: scale on schedule to pre-warm 20 pods at 8 AM when viral content typically drops. Consider predictive scaling using historical patterns (viral events often follow a predictable curve in the first hour).",
      type: "text",
    },
  },
];
