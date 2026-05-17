import type { QuizDefinition } from "@/types/curriculum";

export const expertRealtimeQuiz: QuizDefinition = {
  id: "expert-realtime-quiz",
  title: "Real-Time Systems Design",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which real-time transport is best suited for one-way server-to-client live updates with automatic reconnection and HTTP/2 multiplexing support?",
      options: [
        "WebSocket",
        "Server-Sent Events (SSE)",
        "WebRTC DataChannel",
        "Long polling",
      ],
      correctIndex: 1,
      explanation:
        "SSE uses standard HTTP with text/event-stream, supports automatic reconnection via Last-Event-ID, and works over HTTP/2 multiplexing. WebSocket is full-duplex but requires custom reconnection. WebRTC is P2P. Long polling is inefficient.",
    },
    {
      type: "multiple-choice",
      question:
        "In a presence system using Redis TTL, what happens if a user's client crashes without sending a logout request?",
      options: [
        "The user remains online forever in Redis",
        "The TTL expires and the user is marked offline automatically",
        "Redis sends a TCP RST to the user",
        "The WebSocket server must query the database every second",
      ],
      correctIndex: 1,
      explanation:
        "Redis TTL ensures that if heartbeats stop (e.g., client crash), the key expires after the TTL duration. A consumer can listen to keyspace notifications or use a scheduled job to mark the user offline when TTL expires.",
    },
    {
      type: "drag-drop",
      question: "Match each real-time concept to its primary mechanism:",
      pairs: [
        { left: "WebSocket", right: "Persistent TCP full-duplex frame protocol after HTTP Upgrade" },
        { left: "SSE", right: "Long-lived HTTP response with text/event-stream MIME type" },
        { left: "WebRTC ICE", right: "NAT traversal using STUN/TURN candidates" },
        { left: "Presence TTL", right: "Redis EXPIRE with periodic heartbeat refresh" },
      ],
      explanation:
        "WebSocket upgrades from HTTP to a framed TCP protocol. SSE keeps an HTTP response open. WebRTC ICE gathers candidates to punch through NAT. Presence TTL uses Redis auto-expiry when heartbeats cease.",
    },
    {
      type: "fill-blank",
      question:
        "To broadcast a message to 1M users efficiently, a fan-out system should shard users by [blank1] across WebSocket servers. Messages are published to a [blank2] topic per shard so each server pushes only to its local [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Sharding key",
          correctAnswers: ["user_id", "user ID", "consistent hash"],
        },
        {
          id: "blank2",
          label: "Messaging backbone",
          correctAnswers: ["Kafka", "message queue", "pub/sub"],
        },
        {
          id: "blank3",
          label: "Local state",
          correctAnswers: ["connections", "sockets", "clients"],
        },
      ],
      explanation:
        "Sharding by user_id ensures each WebSocket server owns a subset of connections. A pub/sub backbone (Kafka/Redis) delivers messages to the right server. The server then pushes to its local in-memory socket map.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to establish a WebRTC peer-to-peer video call between two users behind NAT:",
      items: [
        "Both clients gather ICE candidates (local, STUN, TURN)",
        "Signaling server exchanges SDP offer/answer via WebSocket",
        "Each client sends ICE candidates to the other through the signaling server",
        "ICE connectivity check selects the best candidate pair",
        "P2P DTLS + SRTP media flow begins directly between peers",
      ],
      correctOrder: [1, 0, 2, 3, 4],
      explanation:
        "Signaling happens first (SDP exchange). Then ICE candidates are gathered and exchanged. Connectivity checks determine the best path. Once selected, DTLS/SRTP flows directly peer-to-peer.",
    },
    {
      type: "multiple-choice",
      question:
        "Why is long polling generally discouraged as a primary real-time strategy?",
      options: [
        "It does not support JSON payloads",
        "It creates excessive HTTP overhead and latency due to repeated connection setup",
        "It is incompatible with TLS",
        "It requires UDP ports to be open",
      ],
      correctIndex: 1,
      explanation:
        "Long polling holds an HTTP request open until data arrives, then the client immediately sends another. This creates repeated TCP/TLS handshakes and HTTP headers, wasting bandwidth and adding latency compared to persistent transports.",
    },
    {
      type: "drag-drop",
      question: "Match each fan-out optimization to its benefit:",
      pairs: [
        { left: "Message batching", right: "Reduce syscalls and CPU by sending multiple updates per flush" },
        { left: "Binary framing (MessagePack)", right: "Reduce payload size and parsing overhead vs JSON" },
        { left: "Consistent hash sharding", right: "Minimize connection migration when servers join/leave" },
        { left: "CDN edge cache for static", right: "Offload origin from repeated asset delivery" },
      ],
      explanation:
        "Batching amortizes write costs. Binary formats reduce bytes on the wire. Consistent hashing bounds resharding. Edge caches serve static data close to users.",
    },
    {
      type: "fill-blank",
      question:
        "In a WebSocket cluster, user connections are typically mapped in-memory on each server using a [blank1]. To find which server holds a given user, the system queries a [blank2] index or uses a [blank3] hash ring to route messages.",
      blanks: [
        {
          id: "blank1",
          label: "In-memory structure",
          correctAnswers: ["map", "dictionary", "hash map", "hashmap"],
        },
        {
          id: "blank2",
          label: "Lookup service",
          correctAnswers: ["presence", "routing", "directory"],
        },
        {
          id: "blank3",
          label: "Sharding strategy",
          correctAnswers: ["consistent", "consistent hashing", "hash"],
        },
      ],
      explanation:
        "Each WebSocket server keeps a local map of user_id to socket. A global presence/routing service or consistent hash ring determines which server owns a user, enabling efficient message delivery.",
    },
  ],
};

export const expertMlQuiz: QuizDefinition = {
  id: "expert-ml-quiz",
  title: "ML Systems Design",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is the primary purpose of an online feature store in a real-time ML system?",
      options: [
        "To store raw training datasets for batch model retraining",
        "To serve low-latency pre-computed features at inference time",
        "To host the model binary files",
        "To replace the need for a model registry",
      ],
      correctIndex: 1,
      explanation:
        "The online feature store serves pre-computed aggregates (e.g., click count in last 5 min) from fast storage like Redis/DynamoDB with <10ms latency, decoupling feature engineering from inference.",
    },
    {
      type: "multiple-choice",
      question:
        "Which deployment strategy sends live traffic to a new model version without exposing its predictions to users?",
      options: [
        "A/B testing",
        "Canary deployment",
        "Shadow mode",
        "Blue-green deployment",
      ],
      correctIndex: 2,
      explanation:
        "Shadow mode (dark launch) duplicates production traffic to the new model, logs its predictions, and compares them to the current model offline. This validates the model without user impact.",
    },
    {
      type: "drag-drop",
      question: "Match each ML system component to its responsibility:",
      pairs: [
        { left: "Feature store (offline)", right: "Generate training datasets from historical data" },
        { left: "Model registry", right: "Version control, metadata, and stage management for models" },
        { left: "Model serving (Triton)", right: "Host model for real-time HTTP/gRPC predictions" },
        { left: "Training pipeline", right: "Feature extraction, GPU training, evaluation, and registration" },
      ],
      explanation:
        "Offline feature stores feed training. The registry tracks versions and stages. Serving hosts inference. The training pipeline produces and evaluates new models.",
    },
    {
      type: "fill-blank",
      question:
        "To avoid training-serving skew, the same feature [blank1] logic should be used in both the offline training pipeline and the online [blank2] path. A centralized [blank3] store is the best way to guarantee this.",
      blanks: [
        {
          id: "blank1",
          label: "Processing step",
          correctAnswers: ["transformation", "engineering", "computation"],
        },
        {
          id: "blank2",
          label: "Runtime path",
          correctAnswers: ["serving", "inference", "prediction"],
        },
        {
          id: "blank3",
          label: "Central system",
          correctAnswers: ["feature", "feature store"],
        },
      ],
      explanation:
        "Training-serving skew occurs when features are computed differently offline and online. A feature store centralizes transformation logic so both paths consume identical features.",
    },
    {
      type: "ordering",
      question:
        "Order the safe steps to promote a new recommendation model from offline training to full production traffic:",
      items: [
        "Train model v2 and evaluate offline metrics on holdout set",
        "Register v2 in model registry with metadata and staging tag",
        "Deploy v2 in shadow mode and compare predictions to v1 offline",
        "Run an A/B test routing 5% of users to v2 and measure business metrics",
        "Gradually canary to 100% while monitoring latency and error rate",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "The safest path: offline validation → registry staging → shadow comparison → A/B business validation → gradual canary. Each step provides a rollback point.",
    },
    {
      type: "multiple-choice",
      question:
        "Why is batch inference preferred over real-time inference for generating daily user segmentation?",
      options: [
        "Batch inference requires fewer features",
        "Batch inference can process large datasets offline with high throughput and no strict latency requirement",
        "Real-time inference does not support segmentation models",
        "Batch inference always produces more accurate predictions",
      ],
      correctIndex: 1,
      explanation:
        "Daily segmentation does not require sub-second responses. Batch inference runs over the entire user base in a scheduled job, optimizing throughput over latency. Results are written to a database for later reads.",
    },
    {
      type: "drag-drop",
      question: "Match each model deployment strategy to its defining characteristic:",
      pairs: [
        { left: "A/B testing", right: "Compare business metrics between two model versions with user segments" },
        { left: "Canary", right: "Gradually shift traffic while monitoring health metrics" },
        { left: "Shadow mode", right: "Mirror traffic to new model without affecting user responses" },
        { left: "Blue-green", right: "Instant cutover between two identical environments" },
      ],
      explanation:
        "A/B tests measure impact. Canary reduces blast radius. Shadow mode validates silently. Blue-green enables instant rollback.",
    },
    {
      type: "fill-blank",
      question:
        "A model registry should track each version's [blank1] metrics (AUC, F1), its deployment [blank2] (staging, production, archived), and a [blank3] plan to revert to the previous version if regressions occur.",
      blanks: [
        {
          id: "blank1",
          label: "Evaluation metrics",
          correctAnswers: ["offline", "evaluation", "performance"],
        },
        {
          id: "blank2",
          label: "Lifecycle state",
          correctAnswers: ["stage", "status", "tag"],
        },
        {
          id: "blank3",
          label: "Safety mechanism",
          correctAnswers: ["rollback", "reversion"],
        },
      ],
      explanation:
        "A registry captures offline performance, current lifecycle stage, and enables rollback. This governance prevents untested models from reaching production.",
    },
  ],
};

export const expertSecurityQuiz: QuizDefinition = {
  id: "expert-security-quiz",
  title: "Security in Distributed Systems",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is the primary risk of accepting a JWT without verifying the 'aud' (audience) claim?",
      options: [
        "The JWT signature becomes invalid",
        "An attacker can replay a token issued for service A to access service B",
        "The token expiry is ignored",
        "The refresh token is leaked",
      ],
      correctIndex: 1,
      explanation:
        "If multiple services share the same signing key but do not verify the audience claim, a token minted for one service can be presented to another. This is a cross-service authentication bypass.",
    },
    {
      type: "multiple-choice",
      question:
        "In a zero-trust service mesh, what does STRICT mTLS mode enforce?",
      options: [
        "Only external clients must use TLS",
        "All service-to-service communication must present and verify X.509 certificates",
        "Only the ingress gateway uses TLS; internal traffic is plaintext",
        "Mutual authentication is optional for performance",
      ],
      correctIndex: 1,
      explanation:
        "STRICT mTLS requires both sides of every connection to present and validate certificates. This prevents lateral movement by ensuring every pod identity is cryptographically verified.",
    },
    {
      type: "drag-drop",
      question: "Match each security protocol to its use case:",
      pairs: [
        { left: "JWT", right: "Stateless user authentication with signed claims" },
        { left: "OAuth 2.0 + PKCE", right: "Mobile/SPA authorization without exposing client secrets" },
        { left: "SAML", right: "Enterprise SSO with XML assertions between IdP and SP" },
        { left: "mTLS", right: "Service-to-service identity verification via X.509 certificates" },
      ],
      explanation:
        "JWT carries user claims. OAuth 2.0 PKCE protects public clients. SAML is legacy enterprise SSO. mTLS authenticates services in a mesh.",
    },
    {
      type: "fill-blank",
      question:
        "To mitigate lateral movement after a pod compromise, combine a service mesh with [blank1] TLS, Kubernetes [blank2] policies that deny unexpected traffic, and an [blank3] policy that verifies identity on every request regardless of network location.",
      blanks: [
        {
          id: "blank1",
          label: "TLS mode",
          correctAnswers: ["mutual", "mTLS", "mtls"],
        },
        {
          id: "blank2",
          label: "Network rules",
          correctAnswers: ["network", "NetworkPolicy"],
        },
        {
          id: "blank3",
          label: "Security model",
          correctAnswers: ["zero trust", "zero-trust"],
        },
      ],
      explanation:
        "Defense in depth: mTLS verifies identities, NetworkPolicy restricts traffic, and zero trust ensures every request is authorized regardless of originating network segment.",
    },
    {
      type: "ordering",
      question:
        "Order the steps of a threat modeling session using STRIDE for a payment API:",
      items: [
        "Create a data flow diagram of the payment API and its dependencies",
        "Identify spoofing threats (e.g., forged JWTs)",
        "Identify tampering threats (e.g., modifying transaction amounts)",
        "Identify information disclosure (e.g., leaking card data in logs)",
        "Document mitigations and assign owners",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "STRIDE starts with a DFD to understand the system, then walks through each threat category. Finally, mitigations are documented and assigned.",
    },
    {
      type: "multiple-choice",
      question:
        "Why is it recommended to use short-lived certificates (e.g., 24 hours) in a service mesh?",
      options: [
        "They reduce the need for certificate rotation automation",
        "They limit the window of abuse if a private key is compromised",
        "They improve TLS handshake latency",
        "They eliminate the need for a CA",
      ],
      correctIndex: 1,
      explanation:
        "Short-lived certificates reduce the blast radius of a compromise. If an attacker extracts a private key, the certificate expires quickly, rendering the stolen credential useless. Automation (SPIRE, cert-manager) handles frequent rotation.",
    },
    {
      type: "drag-drop",
      question: "Match each secret management practice to its purpose:",
      pairs: [
        { left: "HashiCorp Vault", right: "Dynamic secrets with automatic rotation and lease revocation" },
        { left: "Kubernetes external-secrets", right: "Sync secrets from cloud providers into K8s without hardcoding" },
        { left: "httpOnly cookie", right: "Prevent JavaScript access to session tokens (XSS mitigation)" },
        { left: "Refresh token rotation", right: "Issue a new refresh token on every use; invalidate old one" },
      ],
      explanation:
        "Vault manages dynamic credentials. external-secrets integrates cloud secret stores. httpOnly cookies block XSS theft. Refresh rotation limits replay.",
    },
    {
      type: "fill-blank",
      question:
        "In OAuth 2.0, the [blank1] flow with [blank2] is recommended for mobile and single-page apps because it prevents authorization code interception. For machine-to-machine communication, the [blank3] credentials flow is used.",
      blanks: [
        {
          id: "blank1",
          label: "Flow name",
          correctAnswers: ["authorization code", "Authorization Code"],
        },
        {
          id: "blank2",
          label: "Extension",
          correctAnswers: ["PKCE", "pkce"],
        },
        {
          id: "blank3",
          label: "Grant type",
          correctAnswers: ["client", "Client Credentials"],
        },
      ],
      explanation:
        "PKCE replaces the static client secret with a dynamically generated code verifier, protecting public clients. Machine-to-machine auth uses Client Credentials without user involvement.",
    },
  ],
};

export const expertPaymentsQuiz: QuizDefinition = {
  id: "expert-payments-quiz",
  title: "Payments & FinTech",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is the main architectural goal of PCI-DSS scope reduction?",
      options: [
        "Increase transaction throughput",
        "Ensure the system never stores, processes, or transmits raw cardholder data",
        "Reduce the number of microservices",
        "Enable cross-border payments",
      ],
      correctIndex: 1,
      explanation:
        "PCI-DSS scope reduction means using a certified payment gateway to tokenize card data. Your systems handle only opaque tokens, drastically reducing compliance burden and breach risk.",
    },
    {
      type: "multiple-choice",
      question:
        "In double-entry bookkeeping, what must be true for every transaction?",
      options: [
        "There is exactly one debit and one credit",
        "The sum of all debits equals the sum of all credits for the transaction",
        "All entries use the same currency",
        "The ledger is updated in real time only",
      ],
      correctIndex: 1,
      explanation:
        "Double-entry bookkeeping requires every transaction to balance: total debits = total credits. A transaction can involve more than two accounts (e.g., split payments), but the equality must hold.",
    },
    {
      type: "drag-drop",
      question: "Match each payment concept to its implementation:",
      pairs: [
        { left: "Idempotency key", right: "Client-generated UUID cached with request/response to prevent replays" },
        { left: "Saga orchestrator", right: "Coordinates local transactions and compensating actions across services" },
        { left: "Double-entry ledger", right: "Immutable log where every transaction balances debits and credits" },
        { left: "Tokenization", right: "Replace raw PAN with an opaque token handled by a certified gateway" },
      ],
      explanation:
        "Idempotency keys prevent duplicate execution. Sagas manage distributed payment workflows. Double-entry ledgers enforce financial correctness. Tokenization reduces PCI scope.",
    },
    {
      type: "fill-blank",
      question:
        "A saga payment flow typically includes: [blank1] inventory, [blank2] funds via the processor, and [blank3] a shipment. If any step fails, compensating transactions run in reverse.",
      blanks: [
        {
          id: "blank1",
          label: "First step",
          correctAnswers: ["reserve", "hold"],
        },
        {
          id: "blank2",
          label: "Second step",
          correctAnswers: ["capture", "charge", "debit"],
        },
        {
          id: "blank3",
          label: "Third step",
          correctAnswers: ["create", "initiate", "confirm"],
        },
      ],
      explanation:
        "The saga sequences reservation, capture, and fulfillment. Compensating actions (release inventory, refund payment, cancel shipment) maintain eventual consistency.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to safely handle a retried payment request with an idempotency key:",
      items: [
        "API Gateway extracts the idempotency key from the request header",
        "Check the idempotency store for an existing record",
        "If no record exists, create one with status 'processing' and start the saga",
        "If a completed record exists, return the cached response immediately",
        "On saga completion, update the record to 'completed' with the response",
      ],
      correctOrder: [0, 1, 2, 4, 3],
      explanation:
        "The gateway extracts the key, checks the store, and either starts a new saga or returns a cached result. The completed response is stored for future retries. Note: step 3 (return cached) can happen before step 4 if a completed record already exists; the canonical flow is: extract → check → start/update → complete → return cached on retry.",
    },
    {
      type: "multiple-choice",
      question:
        "Why is 2PC (Two-Phase Commit) generally avoided for long-running payment workflows?",
      options: [
        "It does not support encryption",
        "It blocks resources during the prepare phase and is fragile if the coordinator fails",
        "It requires more database tables than saga",
        "It cannot handle JSON payloads",
      ],
      correctIndex: 1,
      explanation:
        "2PC holds locks during the prepare phase and requires all participants to be available. If the coordinator crashes after prepare, resources remain locked until recovery. This is unsuitable for long-running, cross-service payment flows.",
    },
    {
      type: "drag-drop",
      question: "Match each ledger concept to its property:",
      pairs: [
        { left: "Immutable append-only log", right: "Prevents deletion or modification of historical entries" },
        { left: "Merkle tree", right: "Cryptographically tamper-evident structure for audit trails" },
        { left: "Reconciliation job", right: "Daily comparison of internal ledger against processor statements" },
        { left: "Correlation ID", right: "Links all ledger entries belonging to the same business transaction" },
      ],
      explanation:
        "Immutability guarantees audit integrity. Merkle trees detect tampering. Reconciliation catches discrepancies. Correlation IDs enable traceability.",
    },
    {
      type: "fill-blank",
      question:
        "To guarantee exactly-once payment processing, an idempotency key should be stored in a [blank1] consistent data store with a [blank2]. The key must cover the entire [blank3], not just a single API call.",
      blanks: [
        {
          id: "blank1",
          label: "Consistency level",
          correctAnswers: ["strongly", "strong"],
        },
        {
          id: "blank2",
          label: "Expiration policy",
          correctAnswers: ["TTL", "timeout", "expiry", "time-to-live"],
        },
        {
          id: "blank3",
          label: "Operation scope",
          correctAnswers: ["saga", "workflow", "transaction", "operation"],
        },
      ],
      explanation:
        "Strong consistency prevents duplicate processing under race conditions. TTL cleans up old keys. The key must encompass the entire distributed workflow (saga) to be effective.",
    },
  ],
};

export const expertGlobalScaleQuiz: QuizDefinition = {
  id: "expert-global-scale-quiz",
  title: "Global Scale & Edge Computing",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which data structure allows concurrent updates across regions without locks and can be merged automatically?",
      options: [
        "B-tree",
        "CRDT (Conflict-Free Replicated Data Type)",
        "Hash map with row-level locking",
        "Relational table with 2PC",
      ],
      correctIndex: 1,
      explanation:
        "CRDTs are designed so that divergent replicas can be merged without coordination. Examples include G-Counters, PN-Counters, and OR-Sets. They are ideal for collaborative editing and shopping carts.",
    },
    {
      type: "multiple-choice",
      question:
        "In a Raft cluster spanning three continents, what primarily determines the lower bound of write latency?",
      options: [
        "The size of the write payload",
        "The round-trip time (RTT) from the leader to the farthest follower in the quorum",
        "The number of clients connected",
        "The database query complexity",
      ],
      correctIndex: 1,
      explanation:
        "Raft requires a majority of nodes to acknowledge a write (fsync). The slowest voter in the quorum sets the latency floor due to network RTT. This is why global strong consistency is expensive.",
    },
    {
      type: "drag-drop",
      question: "Match each multi-region pattern to its consistency and latency profile:",
      pairs: [
        { left: "Active-Passive", right: "Strong consistency; low latency reads from single primary" },
        { left: "Active-Active (CRDTs)", right: "Eventual consistency; low latency reads and writes everywhere" },
        { left: "Read-Local / Write-Global", right: "Strong writes; low latency local reads" },
        { left: "Partitioned by residency", right: "Region-local strong consistency for data sovereignty" },
      ],
      explanation:
        "Active-Passive is simple but has a single point of write. CRDTs sacrifice immediate consistency for speed. Read-Local/Write-Global optimizes read latency. Partitioning satisfies regulatory requirements.",
    },
    {
      type: "fill-blank",
      question:
        "To reduce write latency for non-critical data, use [blank1] data types that merge asynchronously. For financial data requiring strong consistency, use a [blank2] database with a leader and cross-region [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Data type",
          correctAnswers: ["CRDT", "eventual consistency", "conflict-free"],
        },
        {
          id: "blank2",
          label: "Database type",
          correctAnswers: ["global", "distributed", "strongly consistent"],
        },
        {
          id: "blank3",
          label: "Replication mode",
          correctAnswers: ["quorum", "synchronous replication", "consensus"],
        },
      ],
      explanation:
        "CRDTs handle conflicting updates without coordination. Global databases like Spanner or CockroachDB use consensus/quorum for serializable transactions across regions.",
    },
    {
      type: "ordering",
      question:
        "Order the steps a client takes when connecting to a globally distributed service using GeoDNS and edge computing:",
      items: [
        "Client DNS resolver queries the authoritative DNS server",
        "GeoDNS returns the IP of the nearest healthy region/POP based on resolver location",
        "Client connects to the edge POP for static assets",
        "Dynamic API request is routed to the nearest regional origin",
        "If the regional origin fails health checks, GeoDNS removes it from rotation",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "GeoDNS resolves the client to the closest healthy endpoint. Edge POPs serve cached static content. Dynamic requests hit the regional origin. Failed origins are removed by health checks.",
    },
    {
      type: "multiple-choice",
      question:
        "What is the main trade-off when choosing between a global consensus database (e.g., Spanner) and regional replicas with async replication?",
      options: [
        "Global databases cannot handle joins",
        "Global consensus provides strong consistency but higher write latency; async replicas offer lower latency but eventual consistency",
        "Regional replicas require more storage",
        "Global databases do not support SQL",
      ],
      correctIndex: 1,
      explanation:
        "Global consensus synchronizes writes across regions, adding network latency. Async replication commits locally and propagates later, offering lower latency at the cost of temporary divergence.",
    },
    {
      type: "drag-drop",
      question: "Match each global scale concept to its mechanism:",
      pairs: [
        { left: "GeoDNS / Anycast", right: "Route users to the nearest healthy region based on location" },
        { left: "CDN edge cache", right: "Store and serve content from POPs close to users" },
        { left: "Edge computing (Workers)", right: "Run lightweight logic at the edge before hitting origin" },
        { left: "Data sovereignty partitioning", right: "Store EU user data only in EU regions" },
      ],
      explanation:
        "GeoDNS optimizes routing. Edge caches reduce origin load. Edge computing runs logic close to users. Partitioning ensures regulatory compliance.",
    },
    {
      type: "fill-blank",
      question:
        "In a Spanner-like global database, [blank1] is used to assign monotonic timestamps across regions, enabling [blank2] consistency without locking. This avoids the need for a [blank3] clock.",
      blanks: [
        {
          id: "blank1",
          label: "Timestamp mechanism",
          correctAnswers: ["TrueTime", "TrueTime API", "atomic clocks"],
        },
        {
          id: "blank2",
          label: "Consistency level",
          correctAnswers: ["external", "serializable", "strong"],
        },
        {
          id: "blank3",
          label: "Synchronization method",
          correctAnswers: ["global", "single", "centralized"],
        },
      ],
      explanation:
        "TrueTime combines GPS and atomic clocks with bounded uncertainty intervals. It provides causality tracking and external consistency without relying on a single global clock.",
    },
  ],
};
