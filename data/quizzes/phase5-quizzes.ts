import type { QuizDefinition } from "@/types/curriculum";

export const opsObservabilityQuiz: QuizDefinition = {
  id: "ops-observability-quiz",
  title: "Observability",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which observability pillar best answers the question 'Which microservice added 500ms of latency to this specific request?'",
      options: [
        "Metrics",
        "Logs",
        "Traces",
        "Alerts",
      ],
      correctIndex: 2,
      explanation:
        "Traces capture the end-to-end request path across services, showing latency per span. Metrics tell you THAT there is a problem. Logs tell you WHAT happened in a single service. Traces tell you WHERE the latency originated in the distributed path.",
    },
    {
      type: "multiple-choice",
      question:
        "What is the relationship between an SLI and an SLO?",
      options: [
        "SLI is a contractual penalty; SLO is the metric being measured",
        "SLO is a target value for an SLI over a specified time window",
        "SLI and SLO are synonyms used interchangeably",
        "SLO is the dashboard URL that displays SLIs",
      ],
      correctIndex: 1,
      explanation:
        "SLI (Service Level Indicator) is the quantitative measure (e.g., p99 latency). SLO (Service Level Objective) is the target for that SLI (e.g., 'p99 latency < 200ms over 30 days'). SLA adds contractual consequences.",
    },
    {
      type: "drag-drop",
      question: "Match each observability term to its definition:",
      pairs: [
        { left: "SLI", right: "Quantitative measure of service quality (e.g., error rate, latency)" },
        { left: "SLO", right: "Target value for an SLI over a time window" },
        { left: "SLA", right: "Contractual agreement with consequences for breach" },
        { left: "Error Budget", right: "Allowable unavailability within the SLO window" },
      ],
      explanation:
        "SLIs are the metrics. SLOs are the goals. SLAs are the contracts. Error budget is the headroom (e.g., 43.2 minutes/month for 99.9% availability).",
    },
    {
      type: "fill-blank",
      question:
        "The three pillars of observability are [blank1], [blank2], and [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Pillar 1",
          correctAnswers: ["metrics"],
        },
        {
          id: "blank2",
          label: "Pillar 2",
          correctAnswers: ["logs"],
        },
        {
          id: "blank3",
          label: "Pillar 3",
          correctAnswers: ["traces"],
        },
      ],
      explanation:
        "Metrics (aggregated numeric data), Logs (discrete events), and Traces (end-to-end request paths) are the three pillars. Together they provide the full picture of system behavior.",
    },
    {
      type: "ordering",
      question:
        "Order the typical incident response workflow using the three pillars:",
      items: [
        "Metrics alert: p99 latency jumped from 100ms to 2s",
        "Traces: identify that the Payment Service span is the bottleneck",
        "Logs: find 'Connection pool exhausted' in Payment Service",
        "Fix: increase pool size and add a circuit breaker",
        "Verify: metric returns to baseline, trace shows reduced span time",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Metrics detect the symptom. Traces locate the affected service. Logs provide the root cause context. Fix and verify using the same pillars in reverse order.",
    },
  ],
};

export const opsDeploymentQuiz: QuizDefinition = {
  id: "ops-deployment-quiz",
  title: "Deployment Strategies",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which deployment strategy provides instant rollback capability but requires maintaining two identical production environments?",
      options: [
        "Rolling deployment",
        "Blue-Green deployment",
        "Canary deployment",
        "Recreate deployment",
      ],
      correctIndex: 1,
      explanation:
        "Blue-Green maintains two identical environments (Blue = current, Green = new). Traffic is switched instantly. Rollback is another instant switch back to Blue. The trade-off is 2× resource cost.",
    },
    {
      type: "multiple-choice",
      question:
        "What is the primary benefit of feature flags (feature toggles) in a continuous deployment pipeline?",
      options: [
        "They speed up code compilation",
        "They decouple deployment from release, enabling gradual rollout and instant kill switches",
        "They replace the need for unit tests",
        "They eliminate the need for a CDN",
      ],
      correctIndex: 1,
      explanation:
        "Feature flags allow code to be deployed to production while hidden. You can then enable it for 1% of users, monitor, expand, or instantly disable without redeploying. This reduces the blast radius of new features.",
    },
    {
      type: "drag-drop",
      question: "Match each deployment strategy to its risk and resource profile:",
      pairs: [
        { left: "Rolling", right: "Medium risk, low cost (replaces pods one by one)" },
        { left: "Blue-Green", right: "Low risk, high cost (two full environments)" },
        { left: "Canary", right: "Low risk, medium cost (routes small % to new version)" },
        { left: "Recreate", right: "High risk, low cost (stop old, start new with downtime)" },
      ],
      explanation:
        "Rolling is cheap but slow to rollback. Blue-Green is expensive but safest. Canary balances cost and risk by testing with real traffic. Recreate is cheapest but has downtime.",
    },
    {
      type: "fill-blank",
      question:
        "A [blank1] deployment routes a small percentage of traffic to the new version to validate behavior before a full rollout. A [blank2] deployment maintains two identical environments for instant switch and [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Gradual rollout strategy",
          correctAnswers: ["canary"],
        },
        {
          id: "blank2",
          label: "Dual-environment strategy",
          correctAnswers: ["blue-green", "blue green", "bluegreen"],
        },
        {
          id: "blank3",
          label: "Benefit",
          correctAnswers: ["instant rollback", "fast rollback", "quick rollback"],
        },
      ],
      explanation:
        "Canary starts small and grows. Blue-Green keeps both environments warm for instant switch and rollback. Both are safer than rolling or recreate for critical user-facing changes.",
    },
    {
      type: "ordering",
      question:
        "Order the safest sequence for releasing a major new recommendation algorithm to production:",
      items: [
        "Deploy the new code behind a feature flag (disabled)",
        "Enable the flag for internal employees only",
        "Expand to 1% of real users (canary)",
        "Monitor conversion rate and error metrics for 30 minutes",
        "If metrics are healthy, expand to 100% and remove the flag after validation",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Start dark (flag off). Dogfood internally. Canary to a small real user base. Observe business metrics, not just technical metrics. Gradually expand only after validation. This is defense in depth for deployments.",
    },
  ],
};

export const opsDrQuiz: QuizDefinition = {
  id: "ops-dr-quiz",
  title: "Disaster Recovery",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Recovery Point Objective (RPO) is best defined as:",
      options: [
        "The time required to restore the system after a disaster",
        "The maximum acceptable amount of data loss measured in time",
        "The uptime percentage guaranteed by the SLA",
        "The frequency of automated backups",
      ],
      correctIndex: 1,
      explanation:
        "RPO defines how much data you can afford to lose (e.g., RPO=1 hour means losing up to 1 hour of data is acceptable). It drives backup frequency and replication strategy.",
    },
    {
      type: "multiple-choice",
      question:
        "Which multi-region strategy provides near-zero RTO and RPO but at the highest infrastructure cost?",
      options: [
        "Active-Passive (Cold Standby)",
        "Active-Passive (Warm Standby)",
        "Active-Active",
        "Manual backup with tape storage",
      ],
      correctIndex: 2,
      explanation:
        "Active-Active runs both regions simultaneously serving traffic. If one fails, traffic is instantly routed to the other. The trade-off is 2× infrastructure cost and the need for conflict resolution for writes.",
    },
    {
      type: "drag-drop",
      question: "Match each multi-region strategy to its recovery characteristics:",
      pairs: [
        { left: "Cold Standby", right: "Standby region is off; hours RTO; minutes-to-hours RPO" },
        { left: "Warm Standby", right: "Standby runs minimal instances; minutes RTO; minutes RPO" },
        { left: "Active-Active", right: "Both regions serve traffic; near-zero RTO and RPO" },
        { left: "Pilot Light", right: "Core systems running; data replicated; scales up on disaster" },
      ],
      explanation:
        "Cold = cheapest, slowest. Warm = balanced. Active-Active = most expensive, fastest. Pilot Light is a middle ground where core components are always running but capacity scales on demand.",
    },
    {
      type: "fill-blank",
      question:
        "RPO measures how much [blank1] you can afford to lose, while RTO measures how [blank2] you must recover. If RTO is 5 minutes, failover must be [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Resource",
          correctAnswers: ["data"],
        },
        {
          id: "blank2",
          label: "Time requirement",
          correctAnswers: ["quickly", "fast", "soon", "rapidly"],
        },
        {
          id: "blank3",
          label: "Failover mode",
          correctAnswers: ["automated", "automatic"],
        },
      ],
      explanation:
        "RPO drives backup/replication frequency. RTO drives automation requirements: a 5-minute RTO cannot rely on a human waking up; it needs automated health checks, DNS failover, and runbook automation.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to execute a disaster recovery failover for a database with RPO=0 and RTO=5 minutes:",
      items: [
        "Automated monitoring detects primary region health check failures",
        "DNS / traffic manager routes write traffic to secondary region",
        "Secondary database is promoted to primary (synchronous replication ensures no data loss)",
        "Application connection pool is refreshed to target the new primary",
        "On-call engineer is paged for verification and post-mortem",
      ],
      correctOrder: [0, 2, 3, 1, 4],
      explanation:
        "Detection first. Promote secondary (RPO=0 means sync replication, so secondary is up to date). Refresh app pools. Route traffic. Page human for verification after automated recovery.",
    },
  ],
};

export const opsChaosQuiz: QuizDefinition = {
  id: "ops-chaos-quiz",
  title: "Chaos Engineering",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is the first step in a chaos engineering experiment?",
      options: [
        "Randomly kill a production server",
        "Define a steady-state hypothesis describing normal system behavior",
        "Scale all services to zero",
        "Notify all customers of an upcoming outage",
      ],
      correctIndex: 1,
      explanation:
        "Chaos engineering is disciplined experimentation. You start with a steady-state hypothesis (e.g., 'p99 latency < 200ms and error rate < 1%'). Only then do you introduce controlled failures and measure deviation from the hypothesis.",
    },
    {
      type: "multiple-choice",
      question:
        "Why is it critical to minimize blast radius when running chaos experiments in production?",
      options: [
        "To reduce cloud infrastructure costs",
        "To limit customer impact if the system fails to withstand the injected fault",
        "To avoid generating too many log entries",
        "To comply with HTTP protocol specifications",
      ],
      correctIndex: 1,
      explanation:
        "Blast radius control (canary scope, feature flags, time-bound experiments) ensures that if the hypothesis fails, only a small subset of users or traffic is affected while the team learns and fixes the weakness.",
    },
    {
      type: "drag-drop",
      question: "Match each chaos experiment to what it validates:",
      pairs: [
        { left: "Instance failure (Chaos Monkey)", right: "Auto-scaling and failover behavior" },
        { left: "Latency injection (Toxiproxy)", right: "Timeout and circuit breaker configuration" },
        { left: "Network partition (Chaos Mesh)", right: "Split-brain handling and CAP choices" },
        { left: "CPU/memory pressure", right: "Resource limits and OOM handling" },
      ],
      explanation:
        "Each experiment targets a specific resilience mechanism. Instance failure tests redundancy. Latency tests graceful degradation. Partitions test consensus and leadership election. Resource pressure tests limits.",
    },
    {
      type: "fill-blank",
      question:
        "Chaos Monkey randomly [blank1] production instances to validate that the system can [blank2] without human intervention. Before running in production, experiments should start in [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Action",
          correctAnswers: ["terminates", "kills", "shuts down", "stops"],
        },
        {
          id: "blank2",
          label: "System behavior",
          correctAnswers: ["recover", "heal", "auto-scale", "failover", "self-heal"],
        },
        {
          id: "blank3",
          label: "Starting environment",
          correctAnswers: ["staging", "development", "dev", "test", "pre-production"],
        },
      ],
      explanation:
        "Netflix's Chaos Monkey randomly terminates VMs to force engineers to build redundant, auto-recovering systems. Blast radius is minimized by starting experiments in non-production environments and gradually expanding scope.",
    },
    {
      type: "ordering",
      question:
        "Order the recommended progression of a chaos engineering practice maturity model:",
      items: [
        "Run automated fault injection in dev/staging during business hours",
        "Define steady-state hypotheses and automated rollback criteria",
        "Expand to production with limited blast radius (canary customers)",
        "Automate continuous chaos experiments as part of CI/CD",
        "Run GameDays with cross-team incident response drills",
      ],
      correctOrder: [1, 0, 4, 2, 3],
      explanation:
        "First, define what 'normal' means and how to stop the experiment. Then run in staging. Then practice cross-team response in GameDays. After confidence is built, expand to production canary. Finally, automate continuously.",
    },
  ],
};

export const opsAutoscaleQuiz: QuizDefinition = {
  id: "ops-autoscale-quiz",
  title: "Autoscaling Strategies",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "A video encoding service is I/O-bound on network storage. CPU stays at 40% while the job queue grows from 10 to 5000. Why does CPU-based HPA fail to scale it?",
      options: [
        "HPA cannot measure CPU utilization",
        "CPU is not the bottleneck; queue depth is the correct signal",
        "I/O-bound services do not need scaling",
        "Kubernetes does not support HPA for worker pools",
      ],
      correctIndex: 1,
      explanation:
        "HPA is only as good as the metric it watches. If the bottleneck is network I/O or external dependency latency, CPU may stay low while work piles up. For queue-based workloads, scale on queue depth using KEDA.",
    },
    {
      type: "multiple-choice",
      question:
        "What is a key advantage of schedule-based autoscaling over reactive metric-based scaling?",
      options: [
        "It handles unexpected traffic spikes automatically",
        "It provides instant pre-scaling for predictable patterns (e.g., business hours)",
        "It uses machine learning to forecast demand",
        "It requires no configuration or monitoring",
      ],
      correctIndex: 1,
      explanation:
        "Schedule-based scaling (e.g., CronHPA) pre-warms capacity before known events. It cannot handle unexpected spikes, but it eliminates the 30–60 second reactive lag of metric-based scaling for predictable workloads.",
    },
    {
      type: "drag-drop",
      question: "Match each scaling trigger to its ideal workload:",
      pairs: [
        { left: "CPU utilization", right: "General-purpose compute with CPU-bound load" },
        { left: "Queue depth", right: "Worker pools and message consumers" },
        { left: "Schedule-based", right: "Predictable traffic patterns (e.g., 9 AM spike)" },
        { left: "Predictive ML", right: "Complex, variable patterns requiring pre-scaling" },
      ],
      explanation:
        "Choose metrics that correlate with your bottleneck. CPU for compute. Queue depth for async workers. Schedule for known patterns. ML for complex trends where reactive scaling is too slow.",
    },
    {
      type: "fill-blank",
      question:
        "KEDA enables [blank1]-driven scaling based on metrics like Kafka [blank2] or queue depth, providing [blank3] reaction times than CPU-based HPA for bursty asynchronous workloads.",
      blanks: [
        {
          id: "blank1",
          label: "Scaling paradigm",
          correctAnswers: ["event", "event-driven", "event driven"],
        },
        {
          id: "blank2",
          label: "Kafka metric",
          correctAnswers: ["lag", "consumer lag", "topic lag"],
        },
        {
          id: "blank3",
          label: "Comparison",
          correctAnswers: ["faster", "better", "quicker", "near real-time", "nearer real-time"],
        },
      ],
      explanation:
        "KEDA (Kubernetes Event-driven Autoscaling) scales on external events (Kafka lag, SQS queue depth, HTTP request rate) rather than pod-level metrics. For async burst workloads, this is much more responsive than CPU HPA.",
    },
    {
      type: "ordering",
      question:
        "Order the Kubernetes autoscaling layers from fastest to slowest reaction time:",
      items: [
        "HPA scales pod replicas based on CPU/memory",
        "VPA adjusts pod resource requests (requires restart)",
        "KEDA scales pods based on external events",
        "Cluster Autoscaler adds nodes to the cluster",
      ],
      correctOrder: [2, 0, 1, 3],
      explanation:
        "KEDA reacts in near real-time to events. HPA reacts in 30–60s. VPA requires pod restart (minutes). Cluster Autoscaler provisions new VMs (1–5 minutes). For sudden spikes, you need faster layers or pre-provisioning.",
    },
  ],
};
