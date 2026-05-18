import type { Module } from "@/types/curriculum";
import {
  archMonolithMicroQuiz,
  archGatewayQuiz,
  archEdaQuiz,
  archCqrsQuiz,
  archSagaQuiz,
  archResilienceQuiz,
  archK8sQuiz,
} from "./quizzes/phase4-quizzes";

export const phase4Modules: Module[] = [
  {
    id: "arch-monolith-micro",
    number: 24,
    category: "architecture-patterns",
    title: "Monolith vs Microservices",
    subtitle: "Service boundaries, inter-service communication, service discovery, and trade-offs.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Blocks",
    prerequisites: ["dist-consistent-hash"],
    lessons: [
      {
        id: "l24-monolith",
        title: "The Monolithic Architecture",
        content: [
          {
            type: "text",
            content: "A monolith is a single deployable unit where all components — UI, business logic, data access — live in one codebase and one process. It is the default architecture for early-stage products.",
          },
          {
            type: "bullets",
            items: [
              "Single codebase, single deployment, single database.",
              "Simple to develop, test, and debug in early stages.",
              "Performance: in-process method calls are orders of magnitude faster than network calls.",
              "Scalability bottleneck: must scale the entire application even if only one feature is hot.",
              "Technology lock-in: every component uses the same language and framework.",
              "Risky deployments: a bug in any module can bring down the entire system.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Start with a well-modularized monolith. Extract services only when a module has independent scaling needs, a different technology requirement, or a separate deployment cadence.",
          },
        ],
      },
      {
        id: "l24-microservices",
        title: "The Microservices Architecture",
        content: [
          {
            type: "text",
            content: "Microservices decompose an application into small, independently deployable services, each owning its own database and communicating over the network. They enable independent scaling, technology diversity, and team autonomy.",
          },
          {
            type: "bullets",
            items: [
              "Each service has a single responsibility and its own data store.",
              "Independent deployment: deploy the Order Service without touching the Payment Service.",
              "Technology diversity: Use Go for high-throughput services, Python for ML, Node.js for UI BFFs.",
              "Organizational alignment: Conway's Law — teams own services end-to-end.",
              "Trade-offs: Network latency, distributed transactions, operational complexity, testing complexity.",
            ],
          },
          {
            type: "table",
            headers: ["Concern", "Monolith", "Microservices"],
            rows: [
              ["Deployment", "One artifact, risky", "Many artifacts, independent"],
              ["Scaling", "Scale everything", "Scale only hot services"],
              ["Fault isolation", "One failure takes all down", "Circuit breaker isolates"],
              ["Data consistency", "Single ACID database", "Distributed, eventual consistency"],
              ["Complexity", "Code complexity", "Operational + network complexity"],
              ["Debugging", "Single stack trace", "Distributed tracing required"],
            ],
          },
        ],
      },
      {
        id: "l24-communication",
        title: "Inter-Service Communication",
        content: [
          {
            type: "text",
            content: "Services communicate synchronously (request-response) or asynchronously (event-driven). The choice determines coupling, latency, and failure behavior.",
          },
          {
            type: "table",
            headers: ["Pattern", "Protocol", "Coupling", "Latency", "Use Case"],
            rows: [
              ["Synchronous REST", "HTTP/JSON", "Tight", "Round-trip", "User-facing queries"],
              ["Synchronous gRPC", "HTTP/2 + Protobuf", "Tight", "Low (binary)", "Internal service calls"],
              ["Async Message Queue", "Kafka/RabbitMQ", "Loose", "Decoupled", "Background jobs, events"],
              ["Async Event Bus", "Pub/Sub", "Loose", "Decoupled", "Domain events, notifications"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Synchronous chains (A calls B, B calls C, C calls D) multiply latency and failure probability. If D is slow, A times out. Prefer async for non-user-facing paths.",
          },
        ],
      },
    ],
    lab: {
      id: "microservices-builder-lab",
      title: "Architecture Decision Lab",
      kind: "architecture-builder",
      objective: "Given a set of requirements, decide which components should be monolithic vs microservice.",
      hint: "Start monolithic. Extract only when there is a clear scaling, technology, or team boundary reason.",
    },
    quiz: archMonolithMicroQuiz,
    checkpoint: {
      prompt: "An e-commerce platform has these modules: Product Catalog, Search, Shopping Cart, Checkout, Payment, Order History, User Profiles, Notifications. Which should be separate microservices and why? Which should stay together?",
      answer: "Separate: Search (Elasticsearch, different scaling), Payment (PCI compliance, security isolation), Notifications (async, high volume). Together initially: Shopping Cart + Checkout + Order History (same transactional boundary, same team). User Profiles can be separate if it serves multiple domains. Product Catalog is read-heavy; if search needs it, consider API composition or caching rather than shared DB.",
      type: "text",
    },
  },
  {
    id: "arch-gateway",
    number: 25,
    category: "architecture-patterns",
    title: "API Gateway & Service Mesh",
    subtitle: "Edge routing, rate limiting, mTLS, and the evolution from gateway to mesh.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Route",
    prerequisites: ["arch-monolith-micro"],
    lessons: [
      {
        id: "l25-gateway",
        title: "API Gateway",
        content: [
          {
            type: "text",
            content: "An API Gateway is the single entry point for all clients. It handles cross-cutting concerns so that individual services can focus on business logic.",
          },
          {
            type: "bullets",
            items: [
              "Request routing: /users → User Service, /orders → Order Service.",
              "Authentication and authorization: Validate JWT tokens, extract user ID.",
              "Rate limiting: Protect backend from abuse (token bucket at the edge).",
              "SSL termination: Handle TLS at the edge, internal traffic can use plain HTTP or mTLS.",
              "Request/response transformation: Protocol translation (REST → gRPC), header injection.",
              "Caching: Cache read-heavy endpoints at the gateway with short TTLs.",
              "Request collapsing: Combine multiple client requests into one backend call (GraphQL federation, Backend-for-Frontend).",
            ],
          },
        ],
      },
      {
        id: "l25-service-mesh",
        title: "Service Mesh",
        content: [
          {
            type: "text",
            content: "A service mesh is a dedicated infrastructure layer for handling service-to-service communication. It adds observability, security, and reliability without changing application code.",
          },
          {
            type: "table",
            headers: ["Feature", "Without Mesh", "With Mesh (Istio/Linkerd)"],
            rows: [
              ["mTLS", "App implements TLS", "Sidecar proxy auto-encrypts"],
              ["Retries", "App code", "Configurable per route"],
              ["Circuit breaker", "App library (e.g., Resilience4j)", "Sidecar policy"],
              ["Observability", "Manual instrumentation", "Automatic metrics + traces"],
              ["Traffic split", "Load balancer config", "Canary/blue-green via sidecar"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Service mesh adds latency (extra network hop via sidecar) and operational complexity. Adopt when you have 20+ services and observability/reliability is critical. Do not adopt for a 5-service system.",
          },
        ],
      },
    ],
    quiz: archGatewayQuiz,
    checkpoint: {
      prompt: "Your microservices architecture has 15 services. You need mutual TLS between all services, automatic retries, distributed tracing, and canary deployments. Should you implement these in each service or use a service mesh? What are the trade-offs?",
      answer: "Use a service mesh (Istio/Linkerd). Implementing in each service leads to inconsistent policies, library dependency hell, and duplicated effort. A mesh centralizes these as infrastructure concerns. Trade-offs: +2-5ms latency per hop, increased operational complexity (sidecar upgrades, control plane HA), resource overhead (sidecar memory). For 15 services, the benefits outweigh the costs.",
      type: "text",
    },
  },
  {
    id: "arch-eda",
    number: 26,
    category: "architecture-patterns",
    title: "Event-Driven Architecture",
    subtitle: "Events, event buses, eventual consistency, and the choreography vs orchestration debate.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "Zap",
    prerequisites: ["arch-gateway"],
    lessons: [
      {
        id: "l26-events",
        title: "Events as First-Class Citizens",
        content: [
          {
            type: "text",
            content: "In event-driven architecture, services communicate by publishing and subscribing to events rather than calling each other directly. This decouples producers from consumers.",
          },
          {
            type: "bullets",
            items: [
              "Event: A statement of fact that something happened (e.g., OrderPlaced, PaymentProcessed).",
              "Event Bus / Broker: The infrastructure that transports events from producers to consumers (Kafka, RabbitMQ, SNS).",
              "Consumer groups: Multiple consumers can read the same topic; each message is delivered to one member of the group.",
              "Replayability: Kafka's log-based model lets consumers re-read historical events.",
            ],
          },
        ],
      },
      {
        id: "l26-choreography",
        title: "Choreography vs Orchestration",
        content: [
          {
            type: "text",
            content: "There are two ways to coordinate multi-step business processes in an event-driven system.",
          },
          {
            type: "table",
            headers: ["Aspect", "Choreography", "Orchestration"],
            rows: [
              ["Control flow", "Each service reacts to events and publishes next event", "Central orchestrator directs each step"],
              ["Coupling", "Loose (services don't know each other)", "Tighter (orchestrator knows all services)"],
              ["Visibility", "Hard to trace (distributed logic)", "Easy to trace (central workflow definition)"],
              ["Flexibility", "Easy to add new consumers", "Easy to change workflow sequence"],
              ["Complexity", "Emergent complexity", "Centralized complexity"],
              ["Examples", "Order service emits OrderPlaced; Payment service listens and emits PaymentProcessed; Shipping listens...", "Saga orchestrator: Step 1 call Payment, Step 2 call Inventory, Step 3 call Shipping"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Use choreography for simple, linear event chains. Use orchestration (Saga pattern) for complex workflows with compensating transactions.",
          },
        ],
      },
    ],
    lab: {
      id: "event-flow-lab",
      title: "Event Flow Builder",
      kind: "event-flow-builder",
      objective: "Design an event-driven flow for an e-commerce order: from OrderPlaced to PaymentProcessed to Shipped.",
      hint: "Start with the OrderPlaced event. Which services need to react? What events do they produce? Avoid circular dependencies.",
    },
    quiz: archEdaQuiz,
    checkpoint: {
      prompt: "In an event-driven system, the Inventory service listens to OrderPlaced and decrements stock. If the Payment service fails, how does Inventory know to restore the stock?",
      answer: "This requires a compensating transaction (Saga pattern). The orchestrator detects the payment failure and emits a PaymentFailed event. The Inventory service subscribes to PaymentFailed and executes a compensating action (restore stock). Without orchestration, choreography would need each service to emit failure events that downstream services listen for — harder to reason about but possible with careful event design.",
      type: "text",
    },
  },
  {
    id: "arch-cqrs",
    number: 27,
    category: "architecture-patterns",
    title: "CQRS & Event Sourcing",
    subtitle: "Separating reads from writes and storing state as a sequence of events.",
    difficulty: "Expert",
    estimatedHours: 3,
    icon: "Split",
    prerequisites: ["arch-eda"],
    lessons: [
      {
        id: "l27-cqrs",
        title: "Command Query Responsibility Segregation",
        content: [
          {
            type: "text",
            content: "CQRS separates the read model from the write model. Commands (writes) go through one path optimized for consistency and validation. Queries (reads) go through another path optimized for speed and denormalized views.",
          },
          {
            type: "bullets",
            items: [
              "Command side: Validates business rules, enforces invariants, uses fully normalized domain models.",
              "Query side: Denormalized, read-optimized views (materialized views, Elasticsearch, Redis).",
              "Sync mechanism: Events from command side update query-side projections asynchronously.",
              "When to use: Read/write ratio is extreme (1000:1), or read and write schemas are fundamentally different.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "CQRS adds significant complexity. Do not use it unless you have clear evidence that a single model is the bottleneck. Most CRUD applications do not need CQRS.",
          },
        ],
      },
      {
        id: "l27-event-sourcing",
        title: "Event Sourcing",
        content: [
          {
            type: "text",
            content: "Event sourcing stores the state of an entity as a sequence of events rather than a current snapshot. The current state is derived by replaying all events for that entity.",
          },
          {
            type: "bullets",
            items: [
              "Source of truth is the event log, not a database row.",
              "Audit trail is automatic: every change is recorded with timestamp and metadata.",
              "Temporal queries: 'What was the account balance on March 15th?' — replay events up to that point.",
              "Projections: Build read models by consuming the event stream (natural fit with CQRS).",
              "Challenges: Event schema evolution, large event logs (snapshotting for performance), complex testing.",
            ],
          },
        ],
      },
    ],
    quiz: archCqrsQuiz,
    checkpoint: {
      prompt: "You are designing a banking ledger. Should you use event sourcing? If yes, how do you handle the performance of replaying 10 years of transactions for a high-volume account?",
      answer: "Yes, event sourcing is ideal for financial ledgers because it provides an immutable audit trail and supports temporal queries. To handle performance: implement snapshotting — every N events (e.g., 1000), store a snapshot of the account state. When reconstructing current state, start from the latest snapshot and replay only events after that snapshot. For read-heavy balance queries, maintain a separate projection (CQRS) that is updated asynchronously from the event stream.",
      type: "text",
    },
  },
  {
    id: "arch-saga",
    number: 28,
    category: "architecture-patterns",
    title: "Distributed Transactions & Sagas",
    subtitle: "2PC, TCC, and Saga orchestration vs choreography for multi-service transactions.",
    difficulty: "Expert",
    estimatedHours: 3,
    icon: "GitBranch",
    prerequisites: ["arch-cqrs"],
    lessons: [
      {
        id: "l28-2pc",
        title: "Two-Phase Commit (2PC)",
        content: [
          {
            type: "text",
            content: "2PC is a consensus protocol for distributed transactions. It ensures atomicity across multiple databases but sacrifices availability.",
          },
          {
            type: "bullets",
            items: [
              "Phase 1 (Prepare): Coordinator asks all participants to prepare. Each participant locks resources and votes yes/no.",
              "Phase 2 (Commit/Abort): If all vote yes, coordinator sends Commit. If any votes no, sends Abort.",
              "Blocking: Participants hold locks during Phase 1, blocking other transactions.",
              "Coordinator failure: If coordinator crashes after Prepare, participants are uncertain. Must block until coordinator recovers.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "2PC is rarely used in modern microservices. It is slow, blocks resources, and the coordinator is a single point of failure. Prefer sagas for long-running distributed transactions.",
          },
        ],
      },
      {
        id: "l28-saga",
        title: "The Saga Pattern",
        content: [
          {
            type: "text",
            content: "A saga is a sequence of local transactions where each service performs its own transaction and publishes an event. If a step fails, compensating transactions undo the completed steps.",
          },
          {
            type: "table",
            headers: ["Aspect", "Orchestration", "Choreography"],
            rows: [
              ["Coordinator", "Central saga orchestrator service", "No central coordinator; services react to events"],
              ["Failure handling", "Orchestrator invokes compensating actions in reverse order", "Each service must know how to compensate its own actions"],
              ["Visibility", "Workflow is explicit in orchestrator code", "Workflow is emergent from event subscriptions"],
              ["Complexity", "Centralized", "Distributed"],
              ["Example tools", "Camunda, Temporal, Netflix Conductor", "Kafka + event handlers"],
            ],
          },
        ],
      },
      {
        id: "l28-tcc",
        title: "Try-Confirm-Cancel (TCC)",
        content: [
          {
            type: "text",
            content: "TCC is a variant of saga where each service exposes three operations: Try (reserve resources), Confirm (commit), and Cancel (release reservation). It provides better isolation than pure saga because resources are reserved.",
          },
          {
            type: "bullets",
            items: [
              "Try: Service checks availability and creates a tentative reservation (e.g., pre-allocate seat).",
              "Confirm: If all Try steps succeed, orchestrator calls Confirm on all services.",
              "Cancel: If any Try fails, orchestrator calls Cancel on all services that completed Try.",
              "Trade-off: Better isolation than saga (no overbooking), but requires all services to support reservation semantics.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "saga-simulator-lab",
      title: "Saga Flow Simulator",
      kind: "saga-simulator",
      objective: "Design a saga for an e-commerce checkout and simulate success and failure scenarios with compensation.",
      hint: "Steps: Reserve Inventory → Process Payment → Create Shipment. If Payment fails, cancel inventory reservation. If Shipment fails, refund payment and cancel reservation.",
    },
    quiz: archSagaQuiz,
    checkpoint: {
      prompt: "Design a Saga for booking a flight + hotel + car rental. The flight must be booked first. If hotel is unavailable, cancel the flight. If car rental fails, keep the flight and hotel. How would this differ in orchestration vs choreography?",
      answer: "Orchestration: Saga orchestrator calls Flight.book(), then Hotel.book(), then Car.book(). If Hotel fails, orchestrator calls Flight.cancel(). If Car fails, no compensation needed (flight + hotel are kept). The workflow is explicit in the orchestrator code. Choreography: Flight service emits FlightBooked. Hotel service subscribes, books, emits HotelBooked or HotelFailed. A separate Compensation service listens for HotelFailed and calls Flight.cancel(). Car service subscribes to HotelBooked and books. If Car fails, it emits CarFailed, but no consumer compensates (as per requirement). Harder to trace but more decoupled.",
      type: "text",
    },
  },
  {
    id: "arch-resilience",
    number: 29,
    category: "architecture-patterns",
    title: "Circuit Breakers & Bulkhead",
    subtitle: "Failure isolation, retry strategies, and exponential backoff.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "ShieldAlert",
    prerequisites: ["arch-saga"],
    lessons: [
      {
        id: "l29-circuit-breaker",
        title: "Circuit Breaker Pattern",
        content: [
          {
            type: "text",
            content: "The circuit breaker prevents a network or service failure from cascading to other services. It monitors calls to a dependency and trips open when failures exceed a threshold.",
          },
          {
            type: "table",
            headers: ["State", "Behavior", "Trigger"],
            rows: [
              ["CLOSED", "Requests pass through to the service", "Normal operation"],
              ["OPEN", "Requests fail fast (no call made)", "Failure rate exceeds threshold (e.g., 50% over 10s)"],
              ["HALF-OPEN", "Allow limited test requests through", "Timeout expires after OPEN (e.g., 30s)"],
            ],
          },
          {
            type: "bullets",
            items: [
              "Fail fast: When OPEN, return an error immediately or serve from cache (degraded mode).",
              "Self-healing: After a timeout, HALF-OPEN allows test requests. If they succeed, CLOSE the circuit.",
              "Libraries: Resilience4j (Java), Polly (.NET), Hystrix (deprecated, use Resilience4j).",
              "Service mesh: Istio can apply circuit breaker policies at the sidecar level.",
            ],
          },
        ],
      },
      {
        id: "l29-bulkhead",
        title: "Bulkhead & Retry",
        content: [
          {
            type: "text",
            content: "Bulkhead isolates failures by limiting resources (threads, connections) allocated to a specific dependency. Retry with exponential backoff handles transient failures without overwhelming the target.",
          },
          {
            type: "bullets",
            items: [
              "Bulkhead: Limit concurrent calls to Service X to 10 threads. If Service X is slow, those 10 threads wait, but the remaining thread pool is free for other services.",
              "Retry: On transient failures (network timeout), retry with exponential backoff (1s, 2s, 4s, 8s) plus jitter (randomize to avoid thundering herd).",
              "Idempotency: Retries are safe only if operations are idempotent. Use idempotency keys for non-idempotent operations.",
              "Timeout: Always set aggressive timeouts. A 30-second timeout on a 50ms operation means one slow call consumes a thread for 30 seconds.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Combine all three: Circuit breaker for cascading failure prevention, bulkhead for resource isolation, retry + timeout for transient failure handling. This is the resilience triad.",
          },
        ],
      },
    ],
    lab: {
      id: "circuit-breaker-lab",
      title: "Circuit Breaker Lab",
      kind: "chaos-lab",
      objective: "Configure a circuit breaker and observe how it protects the system during a downstream failure.",
      hint: "Set failure threshold to 50% over 10 requests. Simulate 20 requests with 80% failure rate. Watch the circuit trip OPEN, then allow test requests after the timeout.",
    },
    quiz: archResilienceQuiz,
    checkpoint: {
      prompt: "A microservice calls a third-party payment API that occasionally has 500ms latency spikes. Users see timeouts. How do you fix this with circuit breaker, bulkhead, and retry patterns?",
      answer: "1) Set a timeout of 100ms (aggressive, since normal is <50ms). 2) Configure retry with exponential backoff (100ms, 200ms, 400ms) + jitter, max 3 attempts. 3) Wrap the call in a circuit breaker: if 50% of calls fail over 10 attempts, trip OPEN for 30s. During OPEN, fail fast and queue the payment for async retry. 4) Apply a bulkhead: limit concurrent calls to the payment API to 5 threads so slow calls don't starve the rest of the service. 5) Ensure all retryable calls use idempotency keys.",
      type: "text",
    },
  },
  {
    id: "arch-k8s",
    number: 30,
    category: "architecture-patterns",
    title: "Container Orchestration",
    subtitle: "Kubernetes basics: pods, services, ingress, HPA/VPA, and deployment strategies.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Container",
    prerequisites: ["arch-resilience"],
    lessons: [
      {
        id: "l30-k8s-concepts",
        title: "Kubernetes Core Concepts",
        content: [
          {
            type: "text",
            content: "Kubernetes (K8s) is a container orchestration platform that automates deployment, scaling, and management of containerized applications.",
          },
          {
            type: "bullets",
            items: [
              "Pod: The smallest deployable unit. One or more containers that share storage and network.",
              "Deployment: Declares the desired state (N replicas of a pod). K8s ensures actual state matches.",
              "Service: Exposes a set of pods as a network service (ClusterIP, NodePort, LoadBalancer, ExternalName).",
              "Ingress: Routes external HTTP/S traffic to services based on host/path rules.",
              "ConfigMap/Secret: Decouples configuration from container images.",
              "Namespace: Virtual clusters for resource isolation (dev, staging, prod).",
            ],
          },
        ],
      },
      {
        id: "l30-scaling",
        title: "Autoscaling in Kubernetes",
        content: [
          {
            type: "text",
            content: "Kubernetes provides multiple autoscaling mechanisms to handle varying load.",
          },
          {
            type: "table",
            headers: ["Scaler", "What it scales", "Trigger", "Latency"],
            rows: [
              ["HPA", "Pod replicas", "CPU, memory, or custom metrics", "30-60s to react"],
              ["VPA", "Pod resource requests/limits", "Historical usage", "Requires pod restart"],
              ["Cluster Autoscaler", "Number of nodes", "Pending pods (resource pressure)", "1-5 minutes to provision node"],
              ["KEDA", "Pod replicas", "Event-driven (Kafka lag, queue depth)", "Near real-time"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "HPA scales pods but cannot scale faster than application startup time. For bursty traffic, use KEDA for event-driven scaling or over-provision with a buffer. Cluster Autoscaler takes minutes — not suitable for sudden spikes.",
          },
        ],
      },
    ],
    quiz: archK8sQuiz,
    checkpoint: {
      prompt: "Your API service running on Kubernetes sees traffic spike every morning at 9 AM. Pods take 30s to start. Currently, HPA scales based on CPU > 70%. Users see errors during the first 2 minutes of the spike. How do you fix this?",
      answer: "1) Reduce HPA target to 50% CPU so scaling starts earlier. 2) Set minReplicas higher during peak hours using Cron-based HPA or KEDA with a cron trigger that pre-scales to N replicas at 8:55 AM. 3) Use KEDA with a custom metric (e.g., queue depth or request rate) for faster reaction than CPU. 4) Over-provision slightly: maintain a buffer of 20% extra capacity. 5) Ensure readiness probes are tuned so new pods serve traffic as soon as they start. 6) Consider pod startup optimization: smaller images, faster JVM/Node startup, connection pooling pre-warming.",
      type: "text",
    },
  },
];
