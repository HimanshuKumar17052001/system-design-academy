import type { Module } from "@/types/curriculum";

export const phase3Modules: Module[] = [
  {
    id: "dist-lb",
    number: 16,
    category: "core-distributed",
    title: "Load Balancing",
    subtitle: "Algorithms, Layer 4 vs Layer 7, health checks, and sticky sessions.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Scale",
    prerequisites: ["boe-math"],
    lessons: [
      {
        id: "l16-why",
        title: "Why Load Balancers?",
        content: [
          {
            type: "text",
            content: "A load balancer distributes incoming network traffic across multiple backend servers. It is the single most important component for enabling horizontal scaling and high availability.",
          },
          {
            type: "bullets",
            items: [
              "Distributes traffic so no single server is overwhelmed.",
              "Provides a single entry point (virtual IP) to a pool of servers.",
              "Enables zero-downtime deployments by gradually shifting traffic.",
              "Performs health checks and removes failed servers from the pool.",
            ],
          },
        ],
      },
      {
        id: "l16-algorithms",
        title: "Load Balancing Algorithms",
        content: [
          {
            type: "text",
            content: "The choice of algorithm depends on your workload characteristics, server capacities, and session requirements.",
          },
          {
            type: "table",
            headers: ["Algorithm", "How it works", "Best for", "Cons"],
            rows: [
              ["Round Robin", "Sequential distribution", "Homogeneous servers, equal capacity", "Ignores server load and response time"],
              ["Weighted Round Robin", "Sequential with capacity weights", "Heterogeneous servers", "Still ignores real-time load"],
              ["Least Connections", "Routes to server with fewest active connections", "Long-lived connections (WebSockets)", "Does not account for connection weight"],
              ["Least Response Time", "Routes to fastest responding server", "Latency-sensitive applications", "Requires continuous health probes"],
              ["IP Hash", "Hash of client IP determines server", "Session stickiness without cookies", "Uneven distribution; problematic with NAT"],
              ["Random", "Random selection", "Homogeneous, stateless", "No predictability; rarely used alone"],
            ],
          },
        ],
      },
      {
        id: "l16-layers",
        title: "Layer 4 vs Layer 7",
        content: [
          {
            type: "text",
            content: "Load balancers operate at different layers of the OSI model, each with different capabilities and performance characteristics.",
          },
          {
            type: "table",
            headers: ["Feature", "Layer 4 (Transport)", "Layer 7 (Application)"],
            rows: [
              ["OSI Layer", "Transport (TCP/UDP)", "Application (HTTP)"],
              ["Routing based on", "IP + port", "URL, header, cookie, body content"],
              ["Performance", "Faster (no packet inspection)", "Slower (terminates TLS, parses HTTP)"],
              ["SSL/TLS", "Passes through (TCP proxy)", "Terminates and re-encrypts"],
              ["Use case", "TCP services, databases, gaming", "Web apps, API gateways, microservices"],
              ["Examples", "HAProxy (mode tcp), AWS NLB", "NGINX, AWS ALB, Envoy"],
            ],
          },
        ],
      },
    ],
    lab: {
      id: "lb-simulator-lab",
      title: "Load Balancer Simulator",
      kind: "load-balancer",
      objective: "Configure a load balancer and observe how different algorithms distribute traffic.",
      hint: "Try Round Robin first, then switch to Least Connections when one server is slower. Watch how the distribution changes.",
    },
    checkpoint: {
      prompt: "You have 3 servers: A (4 cores), B (8 cores), C (2 cores). Which algorithm would you choose, and why?",
      answer: "Weighted Round Robin or Weighted Least Connections. Assign weights proportional to capacity: B=4, A=2, C=1. This ensures B receives twice the traffic of A and four times that of C, matching its capacity. Without weights, C would be overloaded while B is underutilized.",
      type: "text",
    },
  },
  {
    id: "dist-cache",
    number: 17,
    category: "core-distributed",
    title: "Caching",
    subtitle: "Cache-aside, read-through, write-through, write-behind, eviction policies, and invalidation.",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "Database",
    prerequisites: ["dist-lb"],
    lessons: [
      {
        id: "l17-strategies",
        title: "Caching Strategies",
        content: [
          {
            type: "text",
            content: "A caching strategy defines the contract between the application, cache, and database: who reads, who writes, and who takes responsibility when truth changes.",
          },
          {
            type: "table",
            headers: ["Strategy", "Read Path", "Write Path", "Consistency", "Complexity"],
            rows: [
              ["Cache-Aside", "App checks cache first, populates on miss", "App writes DB, invalidates cache", "Eventual", "Low"],
              ["Read-Through", "Cache populates itself on miss", "App writes DB, cache invalidates", "Eventual", "Medium"],
              ["Write-Through", "App checks cache first", "App writes cache, cache writes DB synchronously", "Strong", "Medium"],
              ["Write-Behind", "App checks cache first", "App writes cache, cache writes DB asynchronously", "Eventual (risky)", "High"],
              ["Refresh-Ahead", "Cache pre-populates before expiry", "Same as cache-aside", "Eventual", "High"],
            ],
          },
        ],
      },
      {
        id: "l17-eviction",
        title: "Eviction Policies",
        content: [
          {
            type: "text",
            content: "When the cache is full, an eviction policy decides which entries to remove. The choice of policy should match your workload's access patterns.",
          },
          {
            type: "table",
            headers: ["Policy", "What it evicts", "Best for", "Implementation"],
            rows: [
              ["LRU", "Least Recently Used", "General purpose, temporal locality", "Hash map + doubly linked list"],
              ["LFU", "Least Frequently Used", "Stable popularity distributions", "Hash map + min-heap"],
              ["FIFO", "First In, First Out", "Sequential streams", "Queue"],
              ["TTL", "Time To Live expiry", "Time-sensitive data", "Priority queue by expiry time"],
              ["Random", "Random entry", "No predictable pattern", "Simple, low overhead"],
            ],
          },
        ],
      },
      {
        id: "l17-invalidation",
        title: "Cache Invalidation",
        content: [
          {
            type: "text",
            content: "There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton",
          },
          {
            type: "bullets",
            items: [
              "TTL (Time To Live): Entries expire after a fixed duration. Simple but may serve stale data until expiry.",
              "Explicit invalidation: Application deletes cache keys after database writes. Fast but complex; missed invalidations cause stale data.",
              "Write-through: Cache is always fresh because writes go through it. Higher write latency.",
              "Event-based invalidation: Use Pub/Sub (Redis) or message queues (Kafka) to broadcast invalidation events to all cache nodes.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Cache invalidation is hardest in distributed systems with multiple cache nodes. A lost invalidation message leaves stale data until TTL expires. Always use TTL as a safety net, even with explicit invalidation.",
          },
        ],
      },
    ],
    lab: {
      id: "cache-strategy-lab",
      title: "Cache Strategy Lab",
      kind: "cache-strategy",
      objective: "Simulate different caching strategies and observe hit rates, latency, and consistency trade-offs.",
      hint: "Start with cache-aside for read-heavy workloads. Switch to write-through when consistency is critical. Watch what happens during write bursts.",
    },
    checkpoint: {
      prompt: "You have a read-heavy product catalog with 1M products. Writes happen 100 times/day. Which caching strategy and eviction policy would you use?",
      answer: "Cache-aside with LRU eviction. The read-heavy ratio (millions of reads vs 100 writes) makes cache-aside optimal. LRU captures temporal locality: recently viewed products are likely to be viewed again. TTL of 1 hour as a safety net. On write, explicitly invalidate the product key. With such infrequent writes, the stale window is minimal.",
      type: "text",
    },
  },
  {
    id: "dist-cdn",
    number: 18,
    category: "core-distributed",
    title: "CDN & Edge Caching",
    subtitle: "Content Delivery Networks, cache headers, origin shield, and geographic distribution.",
    difficulty: "Intermediate",
    estimatedHours: 1,
    icon: "Globe",
    prerequisites: ["dist-cache"],
    lessons: [
      {
        id: "l18-cdn",
        title: "How CDNs Work",
        content: [
          {
            type: "text",
            content: "A Content Delivery Network (CDN) is a geographically distributed network of proxy servers and their data centers. The goal is to provide high availability and performance by serving content from edge locations close to users.",
          },
          {
            type: "bullets",
            items: [
              "Edge POP (Point of Presence): A server cluster in a city near the user.",
              "Origin Shield: An extra caching layer between edge POPs and your origin server. Reduces origin load when many edges miss simultaneously.",
              "Cache Hit Ratio: Percentage of requests served from cache. Aim for >90% for static assets.",
              "Dynamic Content: CDNs can also cache API responses with short TTLs (1-5 seconds) for 'micro-caching'.",
            ],
          },
        ],
      },
      {
        id: "l18-headers",
        title: "Cache Control Headers",
        content: [
          {
            type: "text",
            content: "HTTP cache headers tell browsers, proxies, and CDNs how long and under what conditions to cache a response.",
          },
          {
            type: "table",
            headers: ["Header", "Purpose", "Example"],
            rows: [
              ["Cache-Control: max-age", "How long (seconds) the response is fresh", "max-age=3600 (1 hour)"],
              ["Cache-Control: no-cache", "Must revalidate with origin before using cached copy", "Use for dynamic data"],
              ["Cache-Control: no-store", "Never cache this response", "Use for sensitive data"],
              ["Cache-Control: private", "Only browser cache, not shared/CDN", "User-specific pages"],
              ["Cache-Control: public", "Any cache can store", "Static assets"],
              ["ETag", "Opaque identifier for content version", "Browser sends If-None-Match for 304 Not Modified"],
              ["Last-Modified", "Timestamp of last change", "Browser sends If-Modified-Since"],
            ],
          },
        ],
      },
    ],
    lab: {
      id: "traffic-flow-lab",
      title: "Traffic Flow Visualizer",
      kind: "traffic-simulator",
      objective: "Observe how requests flow through DNS, CDN, Load Balancer, App Server, and Database. Toggle caching and slow DB to see behavior.",
      hint: "Enable CDN Cache and watch how cache hit packets stop at CDN. Enable DB Slow and observe queue buildup at the DB node.",
    },
    checkpoint: {
      prompt: "Your CDN has a 95% hit ratio for static assets but APIs show Cache-Control: no-cache. Users in Asia report 500ms API latency while US users see 50ms. What is the problem and how do you fix it?",
      answer: "Problem: APIs are not cached, and the origin server is in the US. Asian requests travel cross-continent. Fix: Use a CDN with dynamic content caching. Set Cache-Control: public, max-age=5 for API responses. Use stale-while-revalidate to serve stale content for up to 60 seconds while fetching fresh data in the background. This reduces latency to ~10ms for cached responses.",
      type: "text",
    },
  },
  {
    id: "dist-db-scale",
    number: 19,
    category: "core-distributed",
    title: "Database Scaling",
    subtitle: "Read replicas, sharding strategies, denormalization, and the celebrity problem.",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "HardDrive",
    prerequisites: ["dist-cache"],
    lessons: [
      {
        id: "l19-replication",
        title: "Database Replication",
        content: [
          {
            type: "text",
            content: "Replication copies data from a primary (leader) database to one or more secondary (follower) databases. This improves read scalability and provides failover.",
          },
          {
            type: "table",
            headers: ["Topology", "Writes", "Reads", "Use Case"],
            rows: [
              ["Primary-Replica", "Primary only", "Primary + replicas", "Read-heavy workloads, analytics"],
              ["Multi-Primary", "Any node", "Any node", "Multi-region writes, HA"],
              ["Circular", "Each node", "Each node", "MySQL legacy; avoid (split-brain risk)"],
              ["Chain", "Head node", "Propagates down chain", "Cross-region with bandwidth limits"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Replication lag is the delay between a write on the primary and its appearance on replicas. If a user updates their profile and immediately reads from a replica, they may see stale data. Solutions: read-after-write consistency (route user's own reads to primary), or session stickiness.",
          },
        ],
      },
      {
        id: "l19-sharding",
        title: "Database Sharding",
        content: [
          {
            type: "text",
            content: "Sharding splits a large database into smaller, more manageable pieces called shards. Each shard holds a subset of the data and operates as an independent database.",
          },
          {
            type: "table",
            headers: ["Strategy", "How it works", "Pros", "Cons"],
            rows: [
              ["Hash Sharding", "shard = hash(key) % N", "Even distribution", "Rebalancing is expensive when N changes"],
              ["Range Sharding", "shard = key range (A-M, N-Z)", "Efficient range queries", "Hotspot risk (e.g., 'Z' is rare)"],
              ["Directory Sharding", "Lookup table maps key → shard", "Flexible, easy rebalancing", "Extra lookup; single point of failure"],
              ["Geo Sharding", "shard = user's region", "Data locality, compliance", "Cross-shard queries for global data"],
            ],
          },
        ],
      },
      {
        id: "l19-denormalization",
        title: "Denormalization",
        content: [
          {
            type: "text",
            content: "Denormalization is the process of adding redundant data to one or more tables to improve read performance. It trades write complexity and storage for read speed.",
          },
          {
            type: "bullets",
            items: [
              "Pre-computed counters: Store like_count in the posts table instead of COUNT(*) on likes.",
              "Embedded documents: Store author_name in comments instead of joining users table.",
              "Materialized views: Pre-join and aggregate data for dashboard queries, refreshed periodically.",
              "The trade-off: Writes are slower (update multiple tables) and risk inconsistency if not atomic.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "db-scaling-lab",
      title: "Database Scaling Simulator",
      kind: "db-scaling",
      objective: "Add read replicas, implement sharding, and observe throughput and latency changes.",
      hint: "Start with a single database. Add read replicas when read QPS exceeds capacity. Shard when write QPS exceeds single-node capacity. Watch the replication lag meter.",
    },
    checkpoint: {
      prompt: "You shard a user database by hash(user_id) % 4. User 42 goes to shard 2. You need to add a 5th shard. What percentage of keys need to move? Compare with consistent hashing.",
      answer: "With modulo hashing, hash(key) % 4 → hash(key) % 5 changes the mapping for approximately 80% of keys (all keys except those where hash % 4 == hash % 5). With consistent hashing, only keys near the new node's position move, approximately 1/5 = 20% of keys. Consistent hashing minimizes rebalancing.",
      type: "text",
    },
  },
  {
    id: "dist-mq",
    number: 20,
    category: "core-distributed",
    title: "Message Queues",
    subtitle: "Kafka, RabbitMQ, SQS, pub/sub, backpressure, and delivery guarantees.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "MessageSquare",
    prerequisites: ["dist-db-scale"],
    lessons: [
      {
        id: "l20-patterns",
        title: "Messaging Patterns",
        content: [
          {
            type: "text",
            content: "Message queues decouple producers from consumers, enabling asynchronous processing, load leveling, and fault tolerance.",
          },
          {
            type: "table",
            headers: ["Pattern", "Description", "Use Case"],
            rows: [
              ["Point-to-Point", "One producer, one consumer", "Task queue: image processing jobs"],
              ["Pub/Sub", "One producer, many consumers", "Event broadcast: user signup triggers email + analytics + CRM"],
              ["Topic", "Categorized channels", "Order events: order.created, order.shipped, order.cancelled"],
              ["Stream", "Ordered, durable log", "Event sourcing, CDC, real-time analytics"],
            ],
          },
        ],
      },
      {
        id: "l20-guarantees",
        title: "Delivery Guarantees",
        content: [
          {
            type: "text",
            content: "Different use cases require different delivery guarantees. The stronger the guarantee, the higher the overhead.",
          },
          {
            type: "table",
            headers: ["Guarantee", "Meaning", "Overhead", "Example"],
            rows: [
              ["At-most-once", "Message may be lost, never duplicated", "None", "Metrics, logs (loss is acceptable)"],
              ["At-least-once", "Message is delivered, may be duplicated", "Acknowledgments + retry", "Email notification (idempotent)"],
              ["Exactly-once", "Message delivered exactly one time", "Highest (deduplication + transactions)", "Payment processing (non-idempotent)"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Exactly-once is theoretically impossible in distributed systems. In practice, we use at-least-once delivery + idempotent consumers, or two-phase commit (2PC) which sacrifices availability.",
          },
        ],
      },
      {
        id: "l20-backpressure",
        title: "Backpressure",
        content: [
          {
            type: "text",
            content: "Backpressure is the mechanism by which a consumer signals to a producer that it is overwhelmed and cannot keep up. Without backpressure, queues grow unbounded and eventually cause out-of-memory crashes.",
          },
          {
            type: "bullets",
            items: [
              "Reactive Streams (RxJava, Project Reactor): Standardized backpressure protocol (request N items at a time).",
              "Kafka: Consumers control fetch rate. If lag grows, add more consumer instances to a partition group.",
              "RabbitMQ: Prefetch count limits unacknowledged messages per consumer.",
              "SQS: Visibility timeout + maxReceiveCount + dead-letter queue for poison pills.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "mq-visualizer-lab",
      title: "Message Queue Visualizer",
      kind: "mq-visualizer",
      objective: "Send messages through a queue, add consumers, toggle delivery guarantees, and observe backpressure and message loss.",
      hint: "Produce a burst of messages and watch the queue grow. Add consumers to drain it. Toggle 'Consumer Slow' to simulate backpressure.",
    },
    checkpoint: {
      prompt: "You are designing a food delivery app. When an order is placed, the app must: charge payment, notify the restaurant, notify the driver, and send a confirmation email. Which messaging pattern and guarantee do you use for each step?",
      answer: "Payment: Synchronous (user waits) with exactly-once via idempotency key. Restaurant notification: Pub/Sub event (order.placed) with at-least-once. Driver matching: Async queue with at-least-once (can retry if no driver available). Email: Async queue with at-least-once (email is idempotent). Use an outbox pattern to ensure payment and event publication are atomic.",
      type: "text",
    },
  },
  {
    id: "dist-cap",
    number: 21,
    category: "core-distributed",
    title: "CAP Theorem",
    subtitle: "Consistency, Availability, Partition Tolerance, and PACELC. The fundamental trade-off of distributed systems.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Triangle",
    prerequisites: ["dist-mq"],
    lessons: [
      {
        id: "l21-cap",
        title: "The CAP Theorem",
        content: [
          {
            type: "text",
            content: "The CAP theorem, proven by Eric Brewer, states that a distributed data store can only provide two of the following three guarantees simultaneously: Consistency, Availability, and Partition Tolerance.",
          },
          {
            type: "bullets",
            items: [
              "Consistency: Every read receives the most recent write or an error.",
              "Availability: Every request receives a response, without guarantee it contains the most recent write.",
              "Partition Tolerance: The system continues to operate despite network partitions (communication breaks between nodes).",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Partition tolerance is not optional in distributed systems. Networks fail. Messages are lost. Therefore, the real choice is between CP (Consistency + Partition Tolerance) and AP (Availability + Partition Tolerance).",
          },
        ],
      },
      {
        id: "l21-pacelc",
    title: "PACELC Theorem",
        content: [
          {
            type: "text",
            content: "PACELC extends CAP by stating that even when there is no partition, you still have to choose between Latency and Consistency.",
          },
          {
            type: "table",
            headers: ["System", "If Partitioned", "Else (No Partition)", "Example"],
            rows: [
              ["PostgreSQL", "CP (refuses writes)", "PC (strong consistency, higher latency)", "Bank transactions"],
              ["Cassandra", "AP (continues serving)", "PA (eventual consistency, lower latency)", "Social media feeds"],
              ["DynamoDB", "AP (configurable)", "PA (configurable consistency)", "E-commerce carts"],
              ["ZooKeeper", "CP", "PC (linearizable reads)", "Configuration management"],
            ],
          },
        ],
      },
      {
        id: "l21-consistency",
        title: "Consistency Models",
        content: [
          {
            type: "text",
            content: "Different consistency models provide different guarantees about what readers see after writers update data.",
          },
          {
            type: "table",
            headers: ["Model", "Guarantee", "Use Case"],
            rows: [
              ["Strong/Linearizable", "All reads see latest write immediately", "Financial transactions, inventory"],
              ["Sequential", "Operations appear in some global order", "Collaborative editing"],
              ["Causal", "Causally related ops are ordered", "Social media comments on posts"],
              ["Read-Your-Writes", "You always see your own updates", "User profile edits"],
              ["Eventual", "Reads converge to latest write eventually", "CDN caches, social likes"],
              ["Monotonic Reads", "You never see older data than before", "News feeds"],
            ],
          },
        ],
      },
    ],
    lab: {
      id: "cap-playground-lab",
      title: "CAP Theorem Playground",
      kind: "cap-playground",
      objective: "Simulate a network partition and observe how CP vs AP systems behave.",
      hint: "Toggle the network partition switch. Watch how a CP system stops accepting writes (to preserve consistency) while an AP system continues serving possibly stale data.",
    },
    checkpoint: {
      prompt: "You are designing a stock trading platform. Should you choose CP or AP? What consistency model is appropriate for the order book vs user portfolio?",
      answer: "Order book: CP with strong consistency. A stale order book can lead to financial losses from arbitrage. Use consensus (Raft/Paxos) for the matching engine. User portfolio: Can be eventual consistency for read replicas (balance display), but trades themselves must be strongly consistent. The portfolio write path goes through the same CP consensus as the order book.",
      type: "text",
    },
  },
  {
    id: "dist-rate-limit",
    number: 22,
    category: "core-distributed",
    title: "Rate Limiting",
    subtitle: "Token bucket, leaky bucket, sliding window, and distributed rate limiting.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "Gauge",
    prerequisites: ["dist-cap"],
    lessons: [
      {
        id: "l22-algorithms",
        title: "Rate Limiting Algorithms",
        content: [
          {
            type: "text",
            content: "Rate limiting controls the rate at which requests are accepted by a system. It prevents abuse, protects backend resources, and ensures fair usage.",
          },
          {
            type: "table",
            headers: ["Algorithm", "How it works", "Burst tolerance", "Memory"],
            rows: [
              ["Token Bucket", "Tokens added at fixed rate; each request consumes a token", "Yes (accumulated tokens)", "O(1)"],
              ["Leaky Bucket", "Requests enter a queue; processed at fixed rate", "No (queue fills, then drops)", "O(queue size)"],
              ["Sliding Window Log", "Log every request timestamp; count in window", "Exact", "O(window requests)"],
              ["Sliding Window Counter", "Approximate with fixed windows + interpolation", "Approximate", "O(1) per window"],
              ["Fixed Window", "Count requests in fixed time bucket", "Yes (at bucket boundary)", "O(1)"],
            ],
          },
        ],
      },
      {
        id: "l22-distributed",
        title: "Distributed Rate Limiting",
        content: [
          {
            type: "text",
            content: "In a distributed system with multiple API servers, rate limiting state must be shared. Local rate limiting per server is insufficient because a user can rotate between servers.",
          },
          {
            type: "bullets",
            items: [
              "Redis + Lua script: Atomic INCR + EXPIRE. Fast but has race conditions across multiple Redis instances.",
              "Redis Cluster: Use hash tags to ensure all rate limit keys land on the same shard. {user123}:tokens ensures locality.",
              "Sliding window in Redis: Store timestamps in a sorted set, use ZREMRANGEBYSCORE to evict old entries, ZCARD to count current window.",
              "Global vs local: Local rate limiting (per server) + global (Redis) for defense in depth.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "rate-limiter-lab",
      title: "Rate Limiter Lab",
      kind: "rate-limiter",
      objective: "Configure a rate limiter and observe how different algorithms handle traffic bursts.",
      hint: "Token bucket allows bursts. Leaky bucket smooths traffic. Sliding window is most accurate but costs more memory. Try a traffic spike and see which algorithm drops the fewest legitimate requests.",
    },
    checkpoint: {
      prompt: "Design a rate limiter that allows 100 requests/minute per user but allows a burst of 20 requests. Which algorithm and where do you place it?",
      answer: "Token bucket with capacity=20, refill rate=100/60=1.67 tokens/second. This allows bursts of 20 and sustained rate of 100/min. Place at the API Gateway (Layer 7) to protect all backend services. Use Redis with hash tags for distributed deployment: {userId}:tokens ensures all rate limit checks for a user hit the same Redis shard.",
      type: "text",
    },
  },
  {
    id: "dist-consistent-hash",
    number: 23,
    category: "core-distributed",
    title: "Consistent Hashing",
    subtitle: "Hash rings, virtual nodes, rebalancing, and minimal key movement.",
    difficulty: "Advanced",
    estimatedHours: 2,
    icon: "CircleDot",
    prerequisites: ["dist-rate-limit"],
    lessons: [
      {
        id: "l23-problem",
        title: "The Problem with Modulo Hashing",
        content: [
          {
            type: "text",
            content: "The naive approach to distributing keys across N servers is hash(key) % N. This works until you add or remove a server, at which point almost every key must be remapped.",
          },
          {
            type: "callout",
            variant: "warning",
            content: "With modulo hashing and 4 servers, adding a 5th server remaps ~80% of keys. This causes a massive cache miss storm and database overload as every key is fetched from the new location.",
          },
        ],
      },
      {
        id: "l23-ring",
        title: "The Hash Ring",
        content: [
          {
            type: "text",
            content: "Consistent hashing maps both servers and keys to points on a circular hash ring (0 to 2^32-1). A key is assigned to the next server clockwise from its position.",
          },
          {
            type: "bullets",
            items: [
              "Both servers and keys are hashed using the same hash function (e.g., MD5, SHA-1).",
              "A key belongs to the first server with a hash value >= key's hash value (wrapping around the ring).",
              "Adding a server only affects keys between the new server and its predecessor: approximately 1/N of keys.",
              "Removing a server moves its keys to its successor: approximately 1/N of keys.",
            ],
          },
        ],
      },
      {
        id: "l23-virtual",
        title: "Virtual Nodes",
        content: [
          {
            type: "text",
            content: "Virtual nodes (replicas) solve the uneven distribution problem. Instead of placing one point per server on the ring, we place many (e.g., 150) virtual nodes per physical server.",
          },
          {
            type: "table",
            headers: ["Without VNodes", "With VNodes (150/server)"],
            rows: [
              ["Uneven distribution", "Smoother distribution via law of large numbers"],
              ["One server failure shifts all its load to one neighbor", "Load is distributed across many neighbors"],
              ["Hard to add/remove capacity incrementally", "Can add/remove single VNodes for fine-grained rebalancing"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Amazon Dynamo uses 3 virtual nodes per physical node. Cassandra uses 256 tokens per node (vnodes). The optimal number depends on cluster size and rebalancing frequency.",
          },
        ],
      },
    ],
    lab: {
      id: "consistent-hash-lab",
      title: "Consistent Hashing Visualizer",
      kind: "consistent-hash",
      objective: "Add and remove nodes from a hash ring and observe key remapping.",
      hint: "Start with 3 nodes and 100 keys. Add a 4th node and watch how only ~25% of keys move. Compare with modulo hashing where ~75% would move.",
    },
    checkpoint: {
      prompt: "You have a cache cluster with 10 nodes using consistent hashing with 100 virtual nodes per physical node. Node 5 fails. How is its load redistributed? How many keys move if you add a replacement node?",
      answer: "Node 5's 100 virtual nodes are removed from the ring. Each virtual node's keys are reassigned to the next virtual node clockwise. Because virtual nodes are interleaved across the ring, the load is distributed evenly among all 9 remaining nodes (each takes ~11% of Node 5's load). When adding a replacement, only the virtual nodes that fall between the new node and its predecessor take keys from their current owners: approximately 100/(10*100) = 1% of keys per virtual node, or ~10% total.",
      type: "text",
    },
  },
  {
    id: "arch-patterns-intro",
    number: 24,
    category: "architecture-patterns",
    title: "Architecture Design",
    subtitle: "Building scalable system architectures with best practices and validation.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Layout",
    prerequisites: ["dist-lb"],
    lessons: [
      {
        id: "l24-components",
        title: "System Components",
        content: [
          {
            type: "text",
            content: "A scalable system architecture is composed of several standard components. Understanding when and where to place each component is essential for system design interviews.",
          },
          {
            type: "bullets",
            items: [
              "Client: Web browsers, mobile apps, or third-party services consuming your APIs.",
              "Load Balancer: Distributes traffic across app servers (Layer 4 or Layer 7).",
              "API Gateway: Authentication, rate limiting, request routing, and protocol translation.",
              "App Server: Business logic execution (stateless, horizontally scalable).",
              "Cache: In-memory data store (Redis/Memcached) for fast reads and session storage.",
              "Database: Persistent storage (SQL for ACID, NoSQL for flexibility).",
              "Message Queue: Async communication and load leveling (Kafka, RabbitMQ, SQS).",
              "CDN: Edge caching for static assets and dynamic content.",
              "Blob Storage: Object storage for images, videos, and large files (S3, GCS).",
            ],
          },
        ],
      },
      {
        id: "l24-principles",
        title: "Design Principles",
        content: [
          {
            type: "text",
            content: "Great architectures follow proven principles. Here are the most important ones to validate your designs against.",
          },
          {
            type: "table",
            headers: ["Principle", "Description", "How to validate"],
            rows: [
              ["No Single Point of Failure", "Every critical component has redundancy", "Count instances of DB, LB, Gateway"],
              ["Defense in Depth", "Multiple layers of security", "Client never talks directly to DB"],
              ["Cache Early", "Cache before the database for read-heavy paths", "Cache node exists on read-heavy edges"],
              ["CDN for Static Assets", "Serve static content from edge", "CDN node exists when client is present"],
              ["Async Where Possible", "Decouple heavy or slow operations", "Message queue on write-heavy paths"],
              ["Stateless Services", "Any app server can handle any request", "No session affinity required"],
            ],
          },
        ],
      },
    ],
    lab: {
      id: "architecture-builder-lab",
      title: "Architecture Canvas",
      kind: "architecture-builder",
      objective: "Build a system architecture diagram and validate it against design best practices.",
      hint: "Start with Client → Load Balancer → App Server → Database. Then add Cache and CDN. Run Validate to check for issues.",
    },
    checkpoint: {
      prompt: "Draw a high-level architecture for a URL shortener. What components do you need and why?",
      answer: "Client → CDN (static assets) → API Gateway (rate limiting) → Load Balancer → App Servers (stateless, auto-scaled) → Cache (Redis for hot URLs) → Database (NoSQL for scalability, SQL for analytics). Add a Message Queue for async analytics ingestion. Use Blob Storage for QR codes or previews.",
      type: "diagram",
    },
  },
];
