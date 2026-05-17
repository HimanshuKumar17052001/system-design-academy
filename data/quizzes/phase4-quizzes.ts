import type { QuizDefinition } from "@/types/curriculum";

export const archMonolithMicroQuiz: QuizDefinition = {
  id: "arch-monolith-micro-quiz",
  title: "Monolith vs Microservices",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "When is it most appropriate to extract a module from a monolith into a separate microservice?",
      options: [
        "As soon as the product idea is validated",
        "When the module has independent scaling needs, different technology requirements, or a separate team boundary",
        "Only after the monolith reaches 1 million lines of code",
        "When the company hires its 100th engineer",
      ],
      correctIndex: 1,
      explanation:
        "Extracting too early adds unnecessary operational complexity. The right triggers are independent scaling (e.g., search needs 10× more resources than checkout), technology mismatch (e.g., ML pipeline in Python vs API in Go), or team autonomy (Conway's Law).",
    },
    {
      type: "multiple-choice",
      question:
        "What is the primary performance advantage of a monolithic architecture over microservices?",
      options: [
        "Better fault isolation per feature",
        "Independent deployment of each component",
        "In-process method calls are orders of magnitude faster than network calls",
        "Technology diversity across modules",
      ],
      correctIndex: 2,
      explanation:
        "Monoliths avoid network overhead, serialization, and connection setup. A method call is nanoseconds; a REST call is milliseconds (1000×+ slower). The trade-off is that monoliths must scale as a unit and have tighter fault coupling.",
    },
    {
      type: "drag-drop",
      question: "Match each communication pattern to its coupling characteristic:",
      pairs: [
        { left: "Synchronous REST", right: "Tight coupling (caller waits for response)" },
        { left: "Async Message Queue", right: "Loose coupling (producer does not wait)" },
        { left: "gRPC", right: "Tight coupling (binary, but still request-response)" },
        { left: "Event Bus (Pub/Sub)", right: "Loose coupling (consumers are unknown to producer)" },
      ],
      explanation:
        "Synchronous patterns tie the caller's fate to the callee's latency and availability. Asynchronous patterns decouple producers from consumers, enabling independent failure domains and absorb spikes.",
    },
    {
      type: "fill-blank",
      question:
        "Microservices communicate over the [blank1], which introduces [blank2] compared to in-process calls. To reduce coupling between services, prefer [blank3] communication for non-user-facing paths.",
      blanks: [
        {
          id: "blank1",
          label: "Medium",
          correctAnswers: ["network"],
        },
        {
          id: "blank2",
          label: "Drawback",
          correctAnswers: ["latency", "overhead", "network latency", "complexity"],
        },
        {
          id: "blank3",
          label: "Preferred style",
          correctAnswers: ["asynchronous", "async", "event-driven", "message-based"],
        },
      ],
      explanation:
        "Network calls add latency, serialization overhead, and partial failure risk. Async communication (message queues, event buses) decouples availability and allows backpressure handling.",
    },
    {
      type: "ordering",
      question:
        "Order the recommended steps to evolve from a well-modularized monolith to microservices:",
      items: [
        "Identify a bounded context with clear boundaries",
        "Extract the service with its own database",
        "Set up inter-service communication (API or events)",
        "Add an API Gateway for client-facing routing",
        "Implement circuit breakers and retries between services",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Start by finding a module with independent scaling, tech, or team needs. Give it its own data store to avoid distributed monolith anti-patterns. Then connect it, expose via gateway, and add resilience patterns.",
    },
  ],
};

export const archGatewayQuiz: QuizDefinition = {
  id: "arch-gateway-quiz",
  title: "API Gateway & Service Mesh",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which of the following is NOT a primary responsibility of an API Gateway?",
      options: [
        "Request routing to backend services",
        "Rate limiting and SSL termination",
        "Executing core business logic such as payment calculation",
        "Authentication and request transformation",
      ],
      correctIndex: 2,
      explanation:
        "An API Gateway handles cross-cutting concerns at the edge: routing, auth, rate limiting, SSL termination, and protocol translation. Core business logic belongs inside domain microservices to keep the gateway stateless and avoid turning it into a bottleneck.",
    },
    {
      type: "multiple-choice",
      question:
        "A company has 25 microservices and needs mutual TLS, automatic retries, distributed tracing, and canary deployments between all services. What is the most maintainable solution?",
      options: [
        "Implement mTLS, retries, tracing, and canary logic in each service",
        "Use a service mesh (e.g., Istio/Linkerd) as a sidecar infrastructure layer",
        "Replace all microservices with a single monolith",
        "Use a centralized API Gateway for service-to-service calls",
      ],
      correctIndex: 1,
      explanation:
        "A service mesh centralizes cross-cutting service-to-service concerns without modifying application code. Sidecars (Envoy/Linkerd) handle mTLS, retries, and traffic split. The trade-off is +2–5ms latency per hop and operational complexity.",
    },
    {
      type: "drag-drop",
      question: "Match each feature to the layer that typically implements it:",
      pairs: [
        { left: "mTLS between services", right: "Service Mesh sidecar" },
        { left: "Rate limiting at the edge", right: "API Gateway" },
        { left: "Business rule validation", right: "Microservice" },
        { left: "Distributed tracing headers", right: "Service Mesh (auto-injected)" },
      ],
      explanation:
        "API Gateways protect the perimeter. Service meshes protect the interior service-to-service fabric. Business logic stays in the application to preserve separation of concerns.",
    },
    {
      type: "fill-blank",
      question:
        "The API Gateway handles [blank1] concerns like authentication and rate limiting, while a service mesh handles [blank2] communication between services using [blank3] for encryption.",
      blanks: [
        {
          id: "blank1",
          label: "Concern type",
          correctAnswers: ["cross-cutting", "edge", "infrastructure"],
        },
        {
          id: "blank2",
          label: "Communication scope",
          correctAnswers: ["service-to-service", "inter-service", "east-west"],
        },
        {
          id: "blank3",
          label: "Encryption mechanism",
          correctAnswers: ["mTLS", "mutual TLS", "mutual authentication"],
        },
      ],
      explanation:
        "The gateway is the north-south (client-to-service) edge. The mesh is the east-west (service-to-service) fabric. mTLS provides mutual authentication and encryption transparently via sidecars.",
    },
    {
      type: "ordering",
      question:
        "Order the evolution of traffic management in a growing microservices architecture:",
      items: [
        "Clients call individual services directly",
        "Add an API Gateway for routing and auth",
        "Add client-side load balancing and retries in SDKs",
        "Adopt a service mesh for mTLS and observability",
        "Shift to Gateway + Mesh for unified edge and interior control",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Early systems call services directly. As complexity grows, add a gateway for the edge. Client-side libraries add resilience but create dependency hell. A service mesh replaces library-based resilience with infrastructure-side policies.",
    },
  ],
};

export const archEdaQuiz: QuizDefinition = {
  id: "arch-eda-quiz",
  title: "Event-Driven Architecture",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "In choreography-based event-driven architecture, how does a service know what to do next in a workflow?",
      options: [
        "A central orchestrator tells it explicitly",
        "It reacts to events it has subscribed to on the event bus",
        "It polls a shared database table every second",
        "It calls a dispatcher service for instructions",
      ],
      correctIndex: 1,
      explanation:
        "Choreography decentralizes control: each service listens for relevant events and publishes new events. There is no central coordinator, which reduces coupling but makes workflows harder to trace.",
    },
    {
      type: "multiple-choice",
      question:
        "What is a key advantage of orchestration over choreography for complex workflows?",
      options: [
        "Looser coupling between services",
        "Easier to trace workflow state and handle compensations centrally",
        "No single point of failure",
        "Better suited for simple linear event chains",
      ],
      correctIndex: 1,
      explanation:
        "Orchestration uses a central saga orchestrator that knows all steps and can invoke compensating actions in reverse order. This makes debugging and failure handling easier than distributed choreography logic.",
    },
    {
      type: "drag-drop",
      question: "Match each event-driven concept to its correct description:",
      pairs: [
        { left: "Choreography", right: "Services react to events independently without a central controller" },
        { left: "Orchestration", right: "A central controller directs each step of the workflow" },
        { left: "Event Sourcing", right: "State is stored as a sequence of immutable events" },
        { left: "CQRS", right: "Separates read and write models for independent optimization" },
      ],
      explanation:
        "Choreography is decentralized and loosely coupled. Orchestration is centralized and easier to reason about for complex flows. Event sourcing and CQRS are data patterns often used alongside event-driven systems.",
    },
    {
      type: "fill-blank",
      question:
        "In event-driven architecture, an [blank1] represents a fact that something happened. Services communicate via an [blank2], which decouples [blank3] from consumers.",
      blanks: [
        {
          id: "blank1",
          label: "Core concept",
          correctAnswers: ["event"],
        },
        {
          id: "blank2",
          label: "Infrastructure",
          correctAnswers: ["event bus", "message broker", "broker", "event broker", "message bus"],
        },
        {
          id: "blank3",
          label: "Decoupled side",
          correctAnswers: ["producers", "publishers", "event producers"],
        },
      ],
      explanation:
        "Events are statements of fact (e.g., OrderPlaced). An event bus transports them from producers to interested consumers without the producer knowing who consumes the event.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to handle a failed payment in an event-driven e-commerce checkout using compensating transactions:",
      items: [
        "OrderPlaced event emitted",
        "Inventory service reserves stock",
        "Payment service attempts charge",
        "PaymentFailed event emitted",
        "Inventory service restores stock on receiving PaymentFailed",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "The saga listens for the PaymentFailed event and triggers compensations. Each service that performed a reversible action must know how to undo it. This is choreography-style compensation.",
    },
  ],
};

export const archCqrsQuiz: QuizDefinition = {
  id: "arch-cqrs-quiz",
  title: "CQRS & Event Sourcing",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Under which condition is CQRS (Command Query Responsibility Segregation) most justified?",
      options: [
        "Every CRUD application should use CQRS by default",
        "When the read/write ratio is extreme or read and write schemas are fundamentally different",
        "When the team has fewer than 5 developers",
        "When strong consistency is required on both reads and writes",
      ],
      correctIndex: 1,
      explanation:
        "CQRS adds significant complexity: two models, sync mechanisms, and eventual consistency between them. It pays off when reads and writes have very different access patterns or scales (e.g., 1000:1 read/write ratio).",
    },
    {
      type: "multiple-choice",
      question:
        "In event sourcing, what is the ultimate source of truth for an entity's state?",
      options: [
        "A normalized SQL table",
        "The immutable event log (stream of all events)",
        "A materialized read model projection",
        "A Redis cache snapshot",
      ],
      correctIndex: 1,
      explanation:
        "In event sourcing, the event log is the single source of truth. Current state is derived by replaying all events for an entity. Projections and caches are derived views, not sources of truth.",
    },
    {
      type: "drag-drop",
      question: "Match each CQRS/Event Sourcing concept to its description:",
      pairs: [
        { left: "Command side", right: "Validates business rules and writes events" },
        { left: "Query side", right: "Denormalized, read-optimized views" },
        { left: "Event Sourcing", right: "State stored as a sequence of events" },
        { left: "Snapshot", right: "Periodic state capture to speed up replay" },
      ],
      explanation:
        "The command side owns invariants and writes. The query side serves fast reads. Event sourcing stores history. Snapshots avoid replaying years of events by storing periodic state checkpoints.",
    },
    {
      type: "fill-blank",
      question:
        "CQRS separates the [blank1] model from the [blank2] model. Event sourcing stores state as a sequence of immutable [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Write model",
          correctAnswers: ["command", "write"],
        },
        {
          id: "blank2",
          label: "Read model",
          correctAnswers: ["query", "read"],
        },
        {
          id: "blank3",
          label: "Stored unit",
          correctAnswers: ["events"],
        },
      ],
      explanation:
        "CQRS stands for Command Query Responsibility Segregation. Commands mutate state; queries read optimized projections. Event sourcing naturally pairs with CQRS because the event stream feeds the query-side projections.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to reconstruct the current account balance in an event-sourced banking ledger with snapshots:",
      items: [
        "Read the latest snapshot for the account",
        "Find all events after the snapshot timestamp",
        "Apply each event to the snapshot state in sequence",
        "Return the final computed balance",
        "If no snapshot exists, start from the first event",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Snapshots optimize replay performance. Start from the snapshot, then apply only newer events. Without a snapshot, replay the entire stream from the beginning.",
    },
  ],
};

export const archSagaQuiz: QuizDefinition = {
  id: "arch-saga-quiz",
  title: "Distributed Transactions & Sagas",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is a compensating transaction in the context of a saga?",
      options: [
        "A retry mechanism for the failed step",
        "An operation that semantically undoes a previously completed step",
        "A two-phase commit across distributed databases",
        "A logging entry for audit purposes",
      ],
      correctIndex: 1,
      explanation:
        "Sagas do not use global locks. Instead, if a step fails, previously completed steps are undone by executing compensating transactions (e.g., cancel reservation, refund payment).",
    },
    {
      type: "multiple-choice",
      question:
        "Why is Two-Phase Commit (2PC) generally avoided in modern microservices architectures?",
      options: [
        "It is too simple to implement correctly",
        "It blocks resources during preparation and the coordinator is a single point of failure",
        "It does not support ACID guarantees",
        "It requires too much storage for logs",
      ],
      correctIndex: 1,
      explanation:
        "2PC holds locks during the prepare phase, blocking other transactions. If the coordinator fails after prepare, participants remain uncertain. Sagas trade atomicity for availability and are preferred for long-running distributed transactions.",
    },
    {
      type: "drag-drop",
      question: "Match each pattern to its defining characteristic:",
      pairs: [
        { left: "2PC", right: "Blocking protocol with a coordinator SPOF" },
        { left: "Saga", right: "Sequence of local transactions with compensation" },
        { left: "TCC", right: "Try-Confirm-Cancel with explicit reservation" },
        { left: "Choreography", right: "No central coordinator; services react to events" },
      ],
      explanation:
        "2PC is a consensus protocol with strong consistency but poor availability. Sagas are preferred for microservices. TCC improves saga isolation by reserving resources before confirming. Choreography distributes control.",
    },
    {
      type: "fill-blank",
      question:
        "In a saga, if step 3 fails, the orchestrator invokes [blank1] actions in [blank2] order to undo steps 2 and 1. This differs from [blank3], which locks resources during the prepare phase.",
      blanks: [
        {
          id: "blank1",
          label: "Action type",
          correctAnswers: ["compensating", "compensation"],
        },
        {
          id: "blank2",
          label: "Direction",
          correctAnswers: ["reverse", "backwards", "inverse"],
        },
        {
          id: "blank3",
          label: "Alternative protocol",
          correctAnswers: ["2PC", "two-phase commit", "Two-Phase Commit"],
        },
      ],
      explanation:
        "Compensations run backwards through the saga steps to leave the system in a consistent state. 2PC uses prepare + commit locks, making it unsuitable for long-running or cross-service transactions.",
    },
    {
      type: "ordering",
      question:
        "Order the steps of a TCC (Try-Confirm-Cancel) transaction for booking a flight:",
      items: [
        "Try: Reserve a seat without confirming",
        "Try: Reserve a hotel room without confirming",
        "If both Try steps succeed, Confirm the flight",
        "Confirm the hotel",
        "If any Try fails, Cancel all successful reservations",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "TCC first tentatively reserves resources (Try). Only if all reservations succeed does it confirm them. If any reservation fails, it cancels the tentative holds, preventing overbooking better than pure saga.",
    },
  ],
};

export const archResilienceQuiz: QuizDefinition = {
  id: "arch-resilience-quiz",
  title: "Circuit Breakers & Bulkhead",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "In a circuit breaker pattern, what happens when the breaker is in the HALF-OPEN state?",
      options: [
        "All requests fail fast immediately",
        "A limited number of test requests are allowed through to probe recovery",
        "The circuit is permanently closed and all requests pass",
        "Requests are queued for batch retry",
      ],
      correctIndex: 1,
      explanation:
        "HALF-OPEN is the self-healing phase. After a timeout in OPEN, a few test requests are allowed. If they succeed, the breaker CLOSES; if they fail, it reopens. This prevents thundering herd on a recovering service.",
    },
    {
      type: "multiple-choice",
      question:
        "What does the bulkhead pattern achieve in a microservices architecture?",
      options: [
        "Caches failed responses to reduce load",
        "Isolates failures by limiting resources (threads, connections) per dependency",
        "Encrypts traffic between services",
        "Load balances requests across geographic regions",
      ],
      correctIndex: 1,
      explanation:
        "Bulkhead partitions resources so that a failure in one dependency (e.g., slow payment API) does not exhaust the thread pool for other dependencies (e.g., catalog API). It is named after ship bulkheads that contain flooding.",
    },
    {
      type: "drag-drop",
      question: "Match each resilience pattern to its primary purpose:",
      pairs: [
        { left: "Circuit Breaker", right: "Prevent cascading failures by stopping calls to unhealthy dependencies" },
        { left: "Bulkhead", right: "Isolate resource usage per dependency" },
        { left: "Retry + Exponential Backoff", right: "Handle transient failures without overwhelming the target" },
        { left: "Timeout", right: "Prevent thread starvation from slow calls" },
      ],
      explanation:
        "These four patterns form the 'resilience triad' (breaker, bulkhead, retry/timeout). Breakers stop the flow of failures; bulkheads contain them; retries handle noise; timeouts cap worst-case latency.",
    },
    {
      type: "fill-blank",
      question:
        "A circuit breaker has three states: [blank1], [blank2], and [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Normal state",
          correctAnswers: ["closed"],
        },
        {
          id: "blank2",
          label: "Failing state",
          correctAnswers: ["open"],
        },
        {
          id: "blank3",
          label: "Recovery probe state",
          correctAnswers: ["half-open", "half open"],
        },
      ],
      explanation:
        "CLOSED: requests pass through normally. OPEN: requests fail fast (return cached/default). HALF-OPEN: limited probe requests test if the dependency has recovered.",
    },
    {
      type: "ordering",
      question:
        "Order the recommended configuration steps to protect a service calling a flaky downstream API:",
      items: [
        "Set an aggressive timeout (e.g., 100ms for a 50ms normal call)",
        "Configure retry with exponential backoff and jitter",
        "Wrap the call in a circuit breaker with a failure threshold",
        "Apply a bulkhead limiting concurrent calls to the dependency",
        "Ensure all retryable operations are idempotent with unique keys",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Start with timeouts to cap latency. Add retries for transient noise. Add circuit breaker to stop cascading. Add bulkhead to isolate resource pools. Finally, ensure idempotency so retries are safe.",
    },
  ],
};

export const archK8sQuiz: QuizDefinition = {
  id: "arch-k8s-quiz",
  title: "Container Orchestration",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What does the Kubernetes Horizontal Pod Autoscaler (HPA) primarily scale?",
      options: [
        "The number of nodes in the cluster",
        "The number of pod replicas based on observed metrics",
        "The CPU limits inside a single container",
        "The size of the container image",
      ],
      correctIndex: 1,
      explanation:
        "HPA adjusts the replica count of a Deployment based on metrics like CPU, memory, or custom metrics. It does not change node count (Cluster Autoscaler does) or individual pod resource limits (VPA does).",
    },
    {
      type: "multiple-choice",
      question:
        "What is the main trade-off of the Vertical Pod Autoscaler (VPA) compared to HPA?",
      options: [
        "VPA scales horizontally by adding pods",
        "VPA adjusts CPU/memory requests but typically requires pod restart",
        "VPA only scales memory, not CPU",
        "VPA reacts faster than HPA to traffic spikes",
      ],
      correctIndex: 1,
      explanation:
        "VPA changes the resource requests/limits of a pod's containers, which usually means the pod must be recreated. This makes it suitable for right-sizing over time, not for handling sudden traffic bursts where HPA is preferred.",
    },
    {
      type: "drag-drop",
      question: "Match each Kubernetes component to its core function:",
      pairs: [
        { left: "Pod", right: "Smallest deployable unit (one or more containers)" },
        { left: "Deployment", right: "Declares desired state and ensures actual state matches" },
        { left: "Service", right: "Exposes a set of pods as a network service" },
        { left: "Ingress", right: "Routes external HTTP/S traffic by host/path rules" },
        { left: "Namespace", right: "Virtual cluster for resource isolation" },
      ],
      explanation:
        "Pods run containers. Deployments manage pod lifecycle. Services provide stable networking. Ingress handles external routing. Namespaces isolate environments (dev/staging/prod).",
    },
    {
      type: "fill-blank",
      question:
        "HPA scales [blank1] based on [blank2] or custom metrics, while VPA adjusts a pod's [blank3] and typically requires a restart.",
      blanks: [
        {
          id: "blank1",
          label: "What HPA scales",
          correctAnswers: ["pod replicas", "replicas", "pods"],
        },
        {
          id: "blank2",
          label: "Common metric",
          correctAnswers: ["CPU", "memory", "CPU utilization", "memory utilization"],
        },
        {
          id: "blank3",
          label: "VPA adjustment",
          correctAnswers: ["resource requests", "resource limits", "CPU/memory requests", "requests and limits"],
        },
      ],
      explanation:
        "HPA is horizontal (more pods). VPA is vertical (bigger pods). HPA uses metrics like CPU. VPA changes requests/limits and often restarts the pod to apply new resource constraints.",
    },
    {
      type: "ordering",
      question:
        "Order the lifecycle phases of a Kubernetes Pod from creation to termination:",
      items: [
        "Pending: scheduled to a node, containers not yet running",
        "Running: at least one container is active",
        "Succeeded: all containers terminated successfully",
        "Failed: all containers terminated with at least one failure",
        "Terminating: deletion requested, graceful shutdown in progress",
      ],
      correctOrder: [0, 1, 4, 2, 3],
      explanation:
        "Pending → Running. When a pod is deleted, it enters Terminating (graceful shutdown with preStop hooks). After termination, it is either Succeeded (clean exit) or Failed (non-zero exit code).",
    },
  ],
};
