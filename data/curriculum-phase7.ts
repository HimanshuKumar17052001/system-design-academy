import type { Module } from "@/types/curriculum";
import {
  expertRealtimeQuiz,
  expertMlQuiz,
  expertSecurityQuiz,
  expertPaymentsQuiz,
  expertGlobalScaleQuiz,
} from "./quizzes/phase7-quizzes";

export const phase7Modules: Module[] = [
  {
    id: "expert-realtime",
    number: 42,
    category: "expert-topics",
    title: "Real-Time Systems Design",
    subtitle: "WebSockets, SSE, WebRTC, long polling, presence systems, and fan-out broadcasting.",
    difficulty: "Expert",
    estimatedHours: 3,
    icon: "Zap",
    prerequisites: ["case-search"],
    lessons: [
      {
        id: "l42-transports",
        title: "Real-Time Transport Protocols",
        content: [
          {
            type: "text",
            content: "Real-time systems require persistent connections between client and server. Choosing the right transport depends on latency requirements, browser support, and infrastructure constraints.",
          },
          {
            type: "table",
            headers: ["Protocol", "Direction", "Latency", "Use Case", "Limitation"],
            rows: [
              ["WebSocket", "Full-duplex", "Lowest", "Chat, gaming, trading", "Requires persistent TCP; harder to scale"],
              ["SSE (Server-Sent Events)", "Server → Client", "Low", "Live updates, news feeds", "No client-to-server push over same stream"],
              ["WebRTC", "P2P full-duplex", "Ultra-low", "Video/audio calls", "Complex NAT traversal; no central relay by default"],
              ["Long Polling", "Simulated push", "High", "Legacy fallback", "Inefficient; many HTTP requests"],
            ],
            caption: "Comparison of real-time transports",
          },
          {
            type: "bullets",
            items: [
              "WebSocket handshake starts as HTTP Upgrade; then switches to persistent TCP frame protocol.",
              "SSE uses standard HTTP with text/event-stream MIME type and keeps response open. Works over HTTP/2 multiplexing.",
              "WebRTC uses ICE, STUN, and TURN for NAT traversal. DataChannel enables P2P messaging without a server relay.",
              "Long polling: client sends request; server holds it open until data arrives or timeout. Immediately re-polls.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Use WebSockets for bidirectional low-latency needs. Use SSE for one-way server pushes where simplicity matters. Use WebRTC when you want to offload server bandwidth (e.g., video conferencing). Use long polling only as a fallback.",
          },
        ],
      },
      {
        id: "l42-presence",
        title: "Presence & Fan-Out Broadcasting",
        content: [
          {
            type: "text",
            content: "Presence systems track who is online, idle, or offline. Fan-out broadcasting distributes a single message to many recipients efficiently.",
          },
          {
            type: "bullets",
            items: [
              "Presence: Store user status in Redis with TTL (e.g., EXPIRE 60s). Heartbeat from client refreshes TTL. On expiry, fire event to mark offline.",
              "Heartbeat trade-off: Frequent heartbeats detect disconnects faster but increase load. Every 30s is typical.",
              "Fan-out on write: Message published to Kafka topic. Consumers per shard/region read and push to WebSocket servers holding active connections.",
              "Connection state: WebSocket servers maintain a local in-memory map of user_id → socket. Shard users by consistent hashing to find the right server.",
              "Broadcasting to millions: Use a pub/sub backbone (Redis Pub/Sub or Kafka). Each WebSocket server subscribes to a shard topic.",
            ],
          },
          {
            type: "code",
            language: "javascript",
            runnable: false,
            code: `// Presence heartbeat with Redis TTL\nawait redis.setex(\`presence:\${userId}\`, 60, 'online');\nawait redis.publish('presence:channel', JSON.stringify({ userId, status: 'online' }));\n\n// Fan-out via pub/sub to WebSocket servers\nwsServer.on('message', async (msg) => {\n  const recipients = await getRecipients(msg.roomId); // 100k users\n  const shards = shardRecipients(recipients, 256);\n  for (const shard of shards) {\n    await kafkaProducer.send({\n      topic: \`room-\${msg.roomId}-shard-\${shard.id}\`,\n      messages: [{ value: JSON.stringify(msg) }]\n    });\n  }\n});`,
          },
          {
            type: "formula",
            expression: "Total\ Fan-out\ Time = \frac{N}{P} \times L_{pub} + L_{net}",
            explanation: "N = number of recipients. P = parallel consumer partitions. L_pub = publish latency per partition. L_net = last-mile network latency. To scale, increase P and batch messages per partition.",
          },
        ],
      },
    ],
    lab: {
      id: "realtime-flow-lab",
      title: "Real-Time Flow Builder",
      kind: "realtime-flow-builder",
      objective: "Design a real-time chat architecture supporting 1M concurrent connections and presence updates across 10 WebSocket servers.",
      hint: "Start with connection sharding: consistent hash user_id to a WebSocket server. Use a presence Redis with TTL. For fan-out, publish messages to Kafka sharded by room ID.",
    },
    quiz: expertRealtimeQuiz,
    checkpoint: {
      prompt: "You need to broadcast a sports score update to 5M online users within 1 second. Each WebSocket server holds 50K connections. How do you structure the pub/sub and connection management to achieve this?",
      answer: "1) Shard users by user_id across 100 WebSocket servers (50K each) using consistent hashing. 2) Maintain a presence/index service mapping user_id → server_id in Redis. 3) When a score update arrives, publish to a Kafka topic with 100 partitions (one per server). 4) Each WebSocket server consumes its partition and pushes the message to all local connections. 5) Batching: send 1KB batches of messages per connection flush to reduce syscall overhead. 6) Use binary WebSocket frames (MessagePack) to reduce payload size. Total time = Kafka publish (~5ms) + consumer fetch (~10ms) + local broadcast (~50ms for 50K conns batched) + network latency (~100ms) = well under 1s.",
      type: "text",
    },
  },
  {
    id: "expert-ml",
    number: 43,
    category: "expert-topics",
    title: "ML Systems Design",
    subtitle: "Feature stores, model serving, A/B testing, batch vs real-time inference, model versioning, and ML pipelines.",
    difficulty: "Expert",
    estimatedHours: 3,
    icon: "Brain",
    prerequisites: ["expert-realtime"],
    lessons: [
      {
        id: "l43-pipeline",
        title: "ML Pipeline & Feature Store",
        content: [
          {
            type: "text",
            content: "An ML system is more than a model. It requires data pipelines, feature engineering, training infrastructure, model registry, and serving infrastructure.",
          },
          {
            type: "bullets",
            items: [
              "Feature store: Centralized storage for curated features (online for low-latency serving, offline for training). Examples: Feast, Tecton, SageMaker Feature Store.",
              "Online features: Pre-computed aggregates (e.g., user click count in last 5 min) served from Redis/DynamoDB with <10ms latency.",
              "Offline features: Historical batch data in data warehouse (Snowflake, BigQuery) used to generate training datasets.",
              "Training pipeline: Extract features → train model (GPU cluster) → evaluate on holdout set → register in model registry.",
              "Model registry: Stores model artifacts, versions, metadata (accuracy, AUC, F1), and stage (staging, production, archived).",
            ],
          },
          {
            type: "table",
            headers: ["Component", "Purpose", "Technology", "Latency Requirement"],
            rows: [
              ["Feature Store (Online)", "Serve pre-computed features at inference time", "Redis, DynamoDB", "<10ms"],
              ["Feature Store (Offline)", "Generate training datasets from historical data", "Snowflake, BigQuery", "Minutes to hours"],
              ["Model Training", "Train on GPU cluster with distributed frameworks", "Spark, Ray, Kubeflow", "Hours to days"],
              ["Model Registry", "Version control and stage management for models", "MLflow, SageMaker", "N/A"],
              ["Model Serving", "Host model for real-time or batch predictions", "Triton, TorchServe, Vertex AI", "<100ms (real-time)"],
            ],
            caption: "Core ML system components",
          },
        ],
      },
      {
        id: "l43-serving",
        title: "Model Serving & Inference Patterns",
        content: [
          {
            type: "text",
            content: "Model serving patterns vary based on latency requirements, throughput, and whether predictions are needed in real-time or offline.",
          },
          {
            type: "bullets",
            items: [
              "Batch inference: Run predictions on large datasets offline. Output written to database for later consumption. High throughput, high latency acceptable.",
              "Real-time inference: Model hosted as an HTTP/gRPC service. Each request triggers a forward pass. Requires <100ms latency.",
              "Model caching: Cache predictions for frequent inputs (e.g., recommend top items for anonymous users).",
              "A/B testing: Route 10% of traffic to model v2, 90% to v1. Compare business metrics (CTR, conversion). Use a feature flag service.",
              "Shadow mode: Send live traffic to v2 without returning its predictions. Log v2 outputs and compare offline before promoting.",
              "Canary deployment: Gradually shift traffic from v1 to v2 while monitoring error rate and latency. Rollback if thresholds breached.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Training-serving skew is a common failure mode: the features computed at training time differ from those at serving time. Use the same transformation logic in both pipelines, ideally via the feature store.",
          },
          {
            type: "code",
            language: "python",
            runnable: false,
            code: `# Feature store + model serving pseudo-code\nfrom feast import FeatureStore\n\nstore = FeatureStore(repo_path=".")\n\n# Online feature retrieval\nfeatures = store.get_online_features(\n  features=["user:click_count_5m", "user:session_duration"],\n  entity_rows=[{"user_id": user_id}]\n).to_df()\n\n# Real-time inference via gRPC to Triton\nprediction = triton_client.infer(\n  model_name="recommendation_v3",\n  inputs=[features.values]\n)\nreturn prediction`,
          },
        ],
      },
    ],
    lab: {
      id: "ml-pipeline-lab",
      title: "ML Pipeline Simulator",
      kind: "ml-pipeline-simulator",
      objective: "Design an end-to-end ML pipeline for a recommendation system: feature engineering, training, model registry, and A/B serving.",
      hint: "Separate online and offline feature stores. Use Redis for online features. Register models with accuracy thresholds. Deploy v2 in shadow mode before A/B testing.",
    },
    quiz: expertMlQuiz,
    checkpoint: {
      prompt: "Your recommendation model v1 is in production. You train v2 with 5% better offline accuracy. How do you safely deploy v2 to production without risking revenue?",
      answer: "1) Register v2 in the model registry with offline metrics (AUC, precision, recall). 2) Deploy v2 in shadow mode: duplicate live traffic to v2 but continue serving v1 responses. Log v2 predictions and compare business metrics (CTR, revenue) offline. 3) If shadow metrics look good, run an A/B test: route 5% of users to v2, 95% to v1. Measure statistically significant improvement in conversion. 4) If A/B test passes with p < 0.05 and no latency/regression breaches, gradually canary to 25%, 50%, 100%. 5) Maintain a rollback plan: if error rate > threshold or revenue drops, automatically route 100% back to v1 via feature flags.",
      type: "text",
    },
  },
  {
    id: "expert-security",
    number: 44,
    category: "expert-topics",
    title: "Security in Distributed Systems",
    subtitle: "JWT, OAuth 2.0, SAML, TLS, mTLS, secrets management, zero trust, and threat modeling.",
    difficulty: "Expert",
    estimatedHours: 3,
    icon: "Shield",
    prerequisites: ["expert-ml"],
    lessons: [
      {
        id: "l44-auth",
        title: "Authentication & Authorization Protocols",
        content: [
          {
            type: "text",
            content: "Distributed systems must authenticate users and services across boundaries. Understanding the trade-offs between JWT, OAuth 2.0, and SAML is critical.",
          },
          {
            type: "bullets",
            items: [
              "JWT (JSON Web Token): Self-contained token with claims (user_id, roles, exp). Signed (JWS) or encrypted (JWE). Client sends JWT on every request. Server validates signature without DB lookup.",
              "OAuth 2.0: Authorization framework. User grants scoped access to a third-party app without sharing password. Flows: Authorization Code (web), PKCE (mobile/SPA), Client Credentials (service-to-service).",
              "SAML: XML-based standard for enterprise SSO. IdP sends signed SAML Assertion to SP. Heavy XML parsing; common in legacy enterprise.",
              "Token storage: Never store tokens in localStorage (XSS risk). Use httpOnly, secure, SameSite cookies for web. Use secure enclaves on mobile.",
              "Token revocation: JWTs cannot be easily revoked before expiry. Use short expiry (15 min) + refresh token rotation. Or maintain a blocklist (Redis) for revoked tokens.",
            ],
          },
          {
            type: "table",
            headers: ["Protocol", "Format", "Best For", "Key Trade-off"],
            rows: [
              ["JWT", "JSON", "Stateless auth, microservices", "Cannot revoke instantly without blocklist"],
              ["OAuth 2.0", "Framework", "Third-party access, SSO", "Complex; requires token management"],
              ["SAML", "XML", "Enterprise SSO", "Verbose; XML parsing vulnerabilities"],
            ],
            caption: "Auth protocol comparison",
          },
        ],
      },
      {
        id: "l44-tls",
        title: "TLS, mTLS & Zero Trust",
        content: [
          {
            type: "text",
            content: "Transport security ensures data is encrypted in transit. Mutual TLS (mTLS) extends this to verify both client and server identities, forming the basis of a zero-trust network.",
          },
          {
            type: "bullets",
            items: [
              "TLS 1.3: Faster handshake (1-RTT or 0-RTT with session resumption). Removes obsolete cipher suites. Mandatory forward secrecy.",
              "mTLS: Both client and server present X.509 certificates. Used in service meshes (Istio, Linkerd) to authenticate service-to-service calls.",
              "Certificate rotation: Short-lived certificates (e.g., 24h) issued by an internal CA. Automated rotation via SPIFFE/SPIRE or cert-manager.",
              "Zero trust principles: Never trust, always verify. Every request is authenticated and authorized, regardless of network location. Assume breach.",
              "Threat modeling: STRIDE methodology. Identify Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege for each component.",
              "Secrets management: Never hardcode secrets. Use HashiCorp Vault, AWS Secrets Manager, or Kubernetes external-secrets. Inject at runtime via env vars or volume mounts.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "A common vulnerability is accepting any valid JWT without checking the 'aud' (audience) claim. An attacker can take a JWT issued for service A and present it to service B if both share the same signing key but don't verify audience.",
          },
          {
            type: "code",
            language: "yaml",
            runnable: false,
            code: `# Istio PeerAuthentication enforcing mTLS\napiVersion: security.istio.io/v1beta1\nkind: PeerAuthentication\nmetadata:\n  name: default\n  namespace: production\nspec:\n  mtls:\n    mode: STRICT\n---\napiVersion: security.istio.io/v1beta1\nkind: AuthorizationPolicy\nmetadata:\n  name: service-a-policy\n  namespace: production\nspec:\n  selector:\n    matchLabels:\n      app: service-a\n  rules:\n    - from:\n        - source:\n            principals: ["cluster.local/ns/production/sa/service-b"]`
          },
        ],
      },
    ],
    lab: {
      id: "security-lab",
      title: "Security Simulator",
      kind: "security-simulator",
      objective: "Design a zero-trust architecture for a microservices cluster with mTLS, JWT authentication, secrets management, and threat modeling.",
      hint: "Use Istio for mTLS and service mesh. Issue short-lived certs via SPIRE. Store secrets in Vault. Enforce JWT audience validation at each service ingress.",
    },
    quiz: expertSecurityQuiz,
    checkpoint: {
      prompt: "In a microservices cluster with 50 services, an attacker gains access to one pod. Without zero trust, they can laterally move to any service. Design a zero-trust defense using mTLS, identity, and network policies.",
      answer: "1) Deploy a service mesh (Istio) with STRICT mTLS: every pod presents an X.509 certificate issued by an internal CA (SPIFFE/SPIRE). 2) Enforce Identity: Each service has a unique ServiceAccount and SPIFFE ID. AuthorizationPolicy allows only specific source principals to reach each service. 3) Network Policies (Kubernetes): Deny all inter-namespace traffic by default. Explicitly allow only required ports and protocols. 4) JWT + Audience: Every ingress gateway validates JWT signature AND 'aud' claim. Services reject tokens not intended for them. 5) Observability: Audit logs for every mTLS handshake and JWT validation. Anomaly detection on lateral movement patterns. 6) Secrets: No hardcoded secrets. Vault injects DB credentials at runtime with TTL. Compromised pod cannot read other pods' secrets.",
      type: "text",
    },
  },
  {
    id: "expert-payments",
    number: 45,
    category: "expert-topics",
    title: "Payments & FinTech",
    subtitle: "Idempotency keys, idempotent APIs, ledger design, distributed transactions, PCI-DSS, and double-entry bookkeeping.",
    difficulty: "Expert",
    estimatedHours: 3,
    icon: "CreditCard",
    prerequisites: ["expert-security"],
    lessons: [
      {
        id: "l45-idempotency",
        title: "Idempotency & Distributed Transactions",
        content: [
          {
            type: "text",
            content: "Payment systems must never double-charge or lose money. Idempotency and distributed transaction patterns are the foundation of financial correctness.",
          },
          {
            type: "bullets",
            items: [
              "Idempotency key: Client generates a unique key (UUID) for each intent. Server stores the mapping key → (request, response). On retry with same key, return cached response without re-executing.",
              "Key storage: Store idempotency keys in a highly consistent store (PostgreSQL, DynamoDB with strongly consistent read) with TTL (24h).",
              "Idempotency scope: The key should cover the entire operation (payment + inventory + notification). Use a saga with the key as correlation ID.",
              "Two-Phase Commit (2PC): Coordinator asks all participants to prepare. If all vote YES, coordinator sends COMMIT. Blocking; not suitable for long-running payments.",
              "Saga pattern: Sequence of local transactions with compensating actions. If payment succeeds but inventory fails, refund payment. Asynchronous, non-blocking.",
            ],
          },
          {
            type: "table",
            headers: ["Pattern", "Consistency", "Blocking", "Best For", "Risk"],
            rows: [
              ["2PC", "Strong", "Yes", "Short, in-cluster transactions", "Coordinator failure leaves locks"],
              ["Saga (Orchestration)", "Eventual", "No", "Long-running workflows", "Compensation logic complexity"],
              ["Saga (Choreography)", "Eventual", "No", "Loosely coupled services", "Hard to trace; cyclic events"],
            ],
            caption: "Distributed transaction patterns in payments",
          },
        ],
      },
      {
        id: "l45-ledger",
        title: "Ledger Design & Compliance",
        content: [
          {
            type: "text",
            content: "A financial ledger records every movement of money. Double-entry bookkeeping ensures the books always balance. PCI-DSS governs how card data is handled.",
          },
          {
            type: "bullets",
            items: [
              "Double-entry bookkeeping: Every transaction has at least one debit and one credit. Sum of all debits = sum of all credits. Immutable append-only log.",
              "Ledger table schema: (entry_id, transaction_id, account_id, debit, credit, currency, timestamp, correlation_id).",
              "Account types: Asset (cash), Liability (customer balances), Equity, Revenue, Expense. Transferring $100 from user A to B: debit A's asset $100, credit B's liability $100.",
              "PCI-DSS: If you store, process, or transmit cardholder data, you must comply. Use a tokenization service (Stripe Vault, Braintree) to avoid storing raw PANs.",
              "Reconciliation: Daily batch job comparing internal ledger against payment processor statements. Discrepancies trigger alerts.",
              "Audit trail: Cryptographically signed log entries (Merkle tree). Tamper-evident. Required for regulatory audits.",
            ],
          },
          {
            type: "code",
            language: "sql",
            runnable: false,
            code: `-- Double-entry ledger schema\nCREATE TABLE ledger_entries (\n  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  transaction_id UUID NOT NULL,\n  account_id UUID NOT NULL,\n  debit_cents BIGINT DEFAULT 0 CHECK (debit_cents >= 0),\n  credit_cents BIGINT DEFAULT 0 CHECK (credit_cents >= 0),\n  currency CHAR(3) NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  correlation_id UUID NOT NULL,\n  CONSTRAINT one_side_nonzero CHECK (debit_cents > 0 OR credit_cents > 0)\n);\n\n-- Index for reconciliation and idempotency lookup\nCREATE INDEX idx_ledger_txn ON ledger_entries(transaction_id);\nCREATE INDEX idx_ledger_corr ON ledger_entries(correlation_id);`
          },
          {
            type: "callout",
            variant: "info",
            content: "PCI-DSS scope reduction is a primary architectural goal. Use a certified payment gateway that tokenizes card data. Your servers should only handle tokens, never raw Primary Account Numbers (PANs).",
          },
        ],
      },
    ],
    lab: {
      id: "payment-lab",
      title: "Payment Simulator",
      kind: "payment-simulator",
      objective: "Design a payment flow with idempotency, saga orchestration, double-entry ledger, and PCI scope reduction.",
      hint: "Start with an idempotency key at the API gateway. Use a saga: reserve funds → capture → notify. Store ledger entries immutably. Never store raw card data.",
    },
    quiz: expertPaymentsQuiz,
    checkpoint: {
      prompt: "A user clicks 'Pay' twice due to network lag, sending two identical requests with the same idempotency key 100ms apart. The first request is still processing. How does the system guarantee exactly one charge and a correct ledger entry?",
      answer: "1) API Gateway checks the idempotency store (DynamoDB/PostgreSQL). If key exists with status 'processing', return 409 Conflict or hold the second request until the first completes (idempotency locking). 2) First request: saga step 'authorize payment' with processor. Write ledger: debit user asset, credit merchant liability. Mark idempotency record as 'completed' with response. 3) Second request: reads the idempotency record, sees 'completed', returns the cached response without re-executing the saga. 4) If first request fails after partial execution, saga compensations run: refund authorization, reverse ledger entries. Idempotency record updated to 'failed' with error response. Second request receives the same failure. 5) Ledger remains balanced because every debit has a corresponding credit, and compensations are also double-entry.",
      type: "text",
    },
  },
  {
    id: "expert-global-scale",
    number: 46,
    category: "expert-topics",
    title: "Global Scale & Edge Computing",
    subtitle: "Multi-region architecture, geo-routing, CRDTs, global databases, CDN at edge, and consensus across regions.",
    difficulty: "Expert",
    estimatedHours: 3,
    icon: "Globe",
    prerequisites: ["expert-payments"],
    lessons: [
      {
        id: "l46-multi-region",
        title: "Multi-Region Architecture & Geo-Routing",
        content: [
          {
            type: "text",
            content: "Serving users globally requires placing data and compute close to them while maintaining consistency and availability across regions.",
          },
          {
            type: "bullets",
            items: [
              "Geo-routing (GeoDNS / Anycast): Route users to the nearest healthy region. Health checks remove failed regions from DNS rotation.",
              "Multi-region deployment patterns: Active-Passive (hot standby), Active-Active (all regions serve traffic), Read-Local-Write-Global (reads from local replica, writes to global leader).",
              "Data sovereignty: EU data stays in EU regions. Partition users by residency at sign-up. Use region-aware routing rules.",
              "CDN at edge: Cache static assets and some dynamic content at edge POPs. Edge computing (Cloudflare Workers, Lambda@Edge) runs logic close to users.",
              "Global load balancer: Google Cloud Global Load Balancer, AWS Global Accelerator, or DNS-based (Route 53 latency records).",
            ],
          },
          {
            type: "table",
            headers: ["Pattern", "Read Latency", "Write Latency", "Consistency", "Best For"],
            rows: [
              ["Active-Passive", "Low (local)", "Low (single primary)", "Strong", "Disaster recovery"],
              ["Active-Active (CRDTs)", "Low", "Low", "Eventual", "Collaborative editing, carts"],
              ["Read-Local / Write-Global", "Low", "High (cross-region)", "Strong writes", "Social feeds, e-commerce"],
              ["Partitioned (Data Sovereignty)", "Low", "Low", "Region-local", "GDPR, regulated data"],
            ],
            caption: "Multi-region deployment patterns",
          },
        ],
      },
      {
        id: "l46-crdts",
        title: "CRDTs & Global Consensus",
        content: [
          {
            type: "text",
            content: "Conflict-Free Replicated Data Types (CRDTs) allow concurrent updates across regions without coordination. For cases requiring strong consistency, cross-region consensus is necessary.",
          },
          {
            type: "bullets",
            items: [
              "CRDTs: Data structures designed such that conflicting updates can be merged automatically without locks. Examples: G-Counter (monotonic increment), PN-Counter (increment/decrement), LWW-Register (last-write-wins), OR-Set (observed-remove set).",
              "Use cases: Real-time collaborative editing (Figma uses CRDTs), shopping carts, like counts, presence indicators.",
              "Global databases: Spanner (TrueTime for external consistency), CockroachDB (serializable default), YugabyteDB (Raft across regions).",
              "Consensus across regions: Raft/Paxos quorum spans regions. Latency = RTT to farthest voter. Typical: leader in primary region, followers in 2+ regions. 3-region quorum tolerates 1 region failure.",
              "Trade-off: Strong global consistency requires synchronous replication. Latency increases with distance. For <100ms writes, keep quorum within one continent.",
            ],
          },
          {
            type: "formula",
            expression: "Write\ Latency \approx RTT_{leader \to farthest\ follower} + L_{fsync}",
            explanation: "In a Raft cluster spanning regions, a write must be fsynced and acknowledged by a majority. If the leader is in us-east and a follower is in ap-south, the RTT dominates. To reduce latency, place the leader closer to the write source or use asynchronous replication with conflict resolution.",
          },
          {
            type: "callout",
            variant: "tip",
            content: "Use CRDTs for user-facing features that tolerate eventual consistency (carts, likes, cursors). Use global consensus (Spanner/CockroachDB) for financial ledgers, inventory, and identity where strong consistency is non-negotiable.",
          },
        ],
      },
    ],
    lab: {
      id: "global-scale-lab",
      title: "Global Scale Simulator",
      kind: "global-scale-simulator",
      objective: "Design a multi-region architecture for a global SaaS product with low-latency reads, data sovereignty, and strong consistency for payments.",
      hint: "Use geo-routing to the nearest region. Serve reads from local replicas. Route payment writes to a strongly consistent global database (CockroachDB/Spanner) with leader in the primary region. Use CRDTs for collaborative features.",
    },
    quiz: expertGlobalScaleQuiz,
    checkpoint: {
      prompt: "Your e-commerce platform runs in 5 regions. Users in Asia see 300ms write latency because the database leader is in us-east. How do you reduce latency for non-financial writes (e.g., shopping cart updates) while keeping payment writes strongly consistent?",
      answer: "1) Separate data planes: Use a CRDT-based shopping cart service (e.g., Redis CRDT or custom OR-Set) in each region. Cart updates are local (<10ms) and merge asynchronously across regions. No leader required. 2) Payment writes: Keep a strongly consistent ledger in CockroachDB/Spanner with leader in us-east. Payment flows accept 300ms latency because they are infrequent and correctness is critical. 3) Inventory reservation: Use a global consensus-backed counter for high-value items (strong consistency). Use local stock pools per region with async replenishment for low-risk items. 4) Geo-routing: Route cart API to local region. Route payment API to the region hosting the ledger leader, or use a global load balancer that sends payment requests to the leader region. 5) Read path: Product catalog and search served from local Elasticsearch replicas with CDC from global source of truth.",
      type: "text",
    },
  },
];
