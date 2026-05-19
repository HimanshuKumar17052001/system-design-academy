import type { Module } from "@/types/curriculum";
import { sampleQuiz } from "./quizzes/sample-quiz";
import { phase2Modules } from "./curriculum-phase2";
import { phase3Modules } from "./curriculum-phase3";
import { phase4Modules } from "./curriculum-phase4";
import { phase5Modules } from "./curriculum-phase5";
import { phase6Modules } from "./curriculum-phase6";
import { phase7Modules } from "./curriculum-phase7";
import { phase8Modules } from "./curriculum-phase8";

export const modules: Module[] = [
  {
    id: "sd-fundamentals",
    number: 1,
    category: "foundations",
    title: "What is System Design?",
    subtitle: "HLD vs LLD, the design process, and how to think like an architect.",
    difficulty: "Beginner",
    estimatedHours: 2,
    icon: "BookOpen",
    prerequisites: [],
    lessons: [
      {
        id: "l1-what-is-sd",
        title: "What is System Design?",
        content: [
          {
            type: "text",
            content:
              "System Design is the art and science of building software systems that are scalable, reliable, and efficient. It is not just about writing code — it is about architecting solutions that can handle real-world challenges like traffic spikes, data consistency, and system failures.",
          },
          {
            type: "callout",
            variant: "info",
            content:
              "When asked to 'design a system' in an interview, always start by clarifying requirements. Never jump to architecture before understanding constraints.",
          },
          {
            type: "text",
            content:
              "A well-designed system is assembled from well-understood building blocks — load balancers, caches, queues, databases, CDNs — connected by clear data flows. The skill lies in choosing the right blocks, sizing them correctly, and understanding the trade-offs each choice introduces.",
          },
          {
            type: "video-embed",
            url: "",
            title: "Introduction to System Design",
            duration: "8:30",
          },
          {
            type: "bullets",
            items: [
              "High-Level Design (HLD): Focuses on architecture, scalability, and component interaction.",
              "Low-Level Design (LLD): Focuses on implementation details — classes, methods, design patterns, and code structure.",
              "In practice, you start with HLD to establish the blueprint, then move to LLD for implementation specifics.",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "DNS Hierarchy: Client → ISP DNS → Root DNS → TLD DNS → Authoritative DNS. Each level caches results with TTL.",
          },
          {
            type: "bullets",
            items: [
              "DNS Record Types: A (address), CNAME (canonical), MX (mail exchange), NS (name server)",
              "DNS Resolution Flow: recursive resolver → root → TLD → authoritative server",
              "CDN Benefits: Reduces latency, offloads origin servers, provides DDoS protection",
              "Push CDN: Content uploaded once when changed. Best for static, infrequently updated content.",
              "Pull CDN: Content fetched on first request, cached until TTL expires. Best for high-traffic content.",
            ],
          },
          {
            type: "table",
            headers: ["DNS Record", "Purpose", "Example"],
            rows: [
              ["A", "Points hostname to IPv4 address", "www.example.com → 93.184.216.34"],
              ["CNAME", "Points hostname to another hostname", "www.example.com → example.com"],
              ["MX", "Mail server for domain", "example.com → mail.example.com"],
              ["NS", "Authoritative DNS servers", "example.com → ns1.example.com"],
            ],
            caption: "Common DNS record types",
          },
        ],
      },
      {
        id: "l1-design-process",
        title: "The 4-Step Design Process",
        content: [
          {
            type: "text",
            content:
              "Every system design follows four stages. Without a structured process, designs either stay too abstract or get lost in premature detail.",
          },
          {
            type: "table",
            headers: ["Step", "Time", "What to do"],
            rows: [
              ["1. Clarify Requirements", "5-10 min", "Ask about functional and non-functional requirements. Agree on scale (DAU, QPS, storage)."],
              ["2. High-Level Design", "15-20 min", "Draw a diagram with APIs, services, data stores, and data flow arrows."],
              ["3. Deep Dive", "15-20 min", "Pick 2-3 critical components and design them in detail."],
              ["4. Trade-offs & Wrap-up", "5 min", "Summarize trade-offs, identify bottlenecks, suggest future improvements."],
            ],
            caption: "The standard interview time allocation for a 45-minute session.",
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "Never skip Step 1. Ambiguity in scope leads to wasted design effort. Interviewers judge your process more than your final architecture.",
          },
        ],
      },
      {
        id: "l1-trade-offs",
        title: "Thinking in Trade-offs",
        content: [
          {
            type: "text",
            content:
              "Every design decision involves trade-offs. The best engineers can articulate why they chose A over B, and under what conditions they would change their mind.",
          },
          {
            type: "table",
            headers: ["Decision", "Option A", "Option B", "When to choose"],
            rows: [
              ["Consistency vs Availability", "Strong consistency (CP)", "Eventual consistency (AP)", "Payments need CP; social likes can be AP."],
              ["SQL vs NoSQL", "Relational (ACID)", "Document/Key-Value (BASE)", "Complex joins need SQL; massive scale needs NoSQL."],
              ["Sync vs Async", "Synchronous (REST/gRPC)", "Asynchronous (Message Queue)", "User-facing paths need sync; analytics need async."],
              ["Cache vs No Cache", "Cache for speed", "No cache for freshness", "Read-heavy + tolerable stale = cache."],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "Use the phrase 'It depends on...' often. Interviewers want to see conditional reasoning, not dogma.",
          },
          {
            type: "mermaid",
            title: "System Design Process Flow",
            caption: "The 4-step process every system design interview follows",
            code: `flowchart LR
    A[1. Clarify<br/>Requirements] --> B[2. High-Level<br/>Design]
    B --> C[3. Deep Dive]
    C --> D[4. Trade-offs<br/>& Wrap-up]
    
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style B fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#10b981,stroke:#059669,color:#fff`,
          },
        ],
      },
    ],
    quiz: sampleQuiz,
    checkpoint: {
      prompt:
        "You are asked to design a URL shortener. What are the first three questions you should ask the interviewer?",
      answer:
        "1) What is the expected scale (reads/day, writes/day)? 2) What is the acceptable latency for redirect vs creation? 3) Do we need analytics or custom aliases?",
      type: "text",
    },
  },
  {
    id: "client-server-http",
    number: 2,
    category: "foundations",
    title: "Client-Server & HTTP",
    subtitle: "Understanding the request/response cycle, HTTP methods, and status codes.",
    difficulty: "Beginner",
    estimatedHours: 2,
    icon: "Globe",
    prerequisites: ["sd-fundamentals"],
    lessons: [
      {
        id: "l2-request-cycle",
        title: "The Request/Response Cycle",
        content: [
          {
            type: "text",
            content:
              "Every web request follows a predictable path from the user's browser to the server and back. Understanding this path is the foundation of system design.",
          },
          {
            type: "interactive",
            component: "HttpTracer",
          },
          {
            type: "text",
            content:
              "The cycle starts when a user enters a URL or clicks a link. The browser constructs an HTTP request, resolves the domain via DNS, opens a TCP connection, sends the request, and waits for the server to respond.",
          },
          {
            type: "mermaid",
            title: "HTTP Request/Response Flow",
            caption: "Full request lifecycle from browser to server and back",
            code: `flowchart TD
    A[Browser] --> B{DNS Lookup}
    B --> C[Cache Hit?]
    C -->|Yes| D[Return IP]
    C -->|No| E[Recursive Resolver]
    E --> F[Root Server]
    F --> G[TLD Server]
    G --> H[Authoritative Server]
    H --> D
    D --> I[TCP Handshake<br/>SYN → SYN-ACK → ACK]
    I --> J[TLS Handshake<br/>Certificate + Key Exchange]
    J --> K[HTTP Request<br/>GET /api/users HTTP/1.1]
    K --> L[Load Balancer]
    L --> M[Web Server]
    M --> N[Application Server]
    N --> O[(Database)]
    N --> P[(Cache<br/>Redis)]
    O --> Q[Response Assembly]
    P --> Q
    Q --> R[HTTP Response<br/>200 OK + JSON]
    R --> A
    
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style O fill:#f59e0b,stroke:#d97706,color:#fff
    style P fill:#10b981,stroke:#059669,color:#fff`,
          },
          {
            type: "bullets",
            items: [
              "DNS Resolution: domain.com → 203.0.113.45 (cached at multiple levels)",
              "TCP Handshake: SYN → SYN-ACK → ACK (1.5 RTT)",
              "TLS Handshake: Certificate exchange + key agreement (1-2 RTT, optional)",
              "HTTP Request: Method + URL + Headers + Body (for POST/PUT)",
              "Server Processing: Route matching → Business logic → Database query → Response assembly",
              "HTTP Response: Status code + Headers + Body",
            ],
          },
        ],
      },
      {
        id: "l2-http-methods",
        title: "HTTP Methods & Idempotency",
        content: [
          {
            type: "text",
            content:
              "HTTP methods define the action to be performed on a resource. Choosing the right method matters for caching, retries, and API semantics.",
          },
          {
            type: "table",
            headers: ["Method", "Safe", "Idempotent", "Purpose"],
            rows: [
              ["GET", "Yes", "Yes", "Retrieve a resource. Can be cached by browsers and proxies."],
              ["POST", "No", "No", "Create a resource. Not cached. Retry may create duplicates."],
              ["PUT", "No", "Yes", "Replace a resource entirely. Retry is safe."],
              ["PATCH", "No", "No*", "Partial update. Idempotency depends on implementation."],
              ["DELETE", "No", "Yes", "Remove a resource. Retry is safe (idempotent)."],
            ],
            caption: "*PATCH is not guaranteed idempotent by the spec; design it to be.",
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "Non-idempotent operations (like POST) need special handling for retries. Use idempotency keys or make the operation naturally idempotent.",
          },
        ],
      },
      {
        id: "l2-status-codes",
        title: "HTTP Status Codes",
        content: [
          {
            type: "text",
            content:
              "Status codes tell the client what happened. They are grouped by the first digit into five classes.",
          },
          {
            type: "table",
            headers: ["Class", "Range", "Meaning", "Examples"],
            rows: [
              ["1xx", "100-199", "Informational", "100 Continue — client should proceed."],
              ["2xx", "200-299", "Success", "200 OK, 201 Created, 204 No Content"],
              ["3xx", "300-399", "Redirection", "301 Moved Permanently, 302 Found, 304 Not Modified"],
              ["4xx", "400-499", "Client Error", "400 Bad Request, 401 Unauthorized, 404 Not Found, 429 Too Many Requests"],
              ["5xx", "500-599", "Server Error", "500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "429 Too Many Requests is the correct response when rate limiting triggers. Always include a Retry-After header.",
          },
        ],
      },
    ],
    lab: {
      id: "http-tracer-lab",
      title: "HTTP Request Tracer",
      kind: "http-tracer",
      objective: "Trace a full HTTP request from browser to database and back.",
      hint: "Click each step to see what happens. Pay attention to where time is spent.",
    },
    checkpoint: {
      prompt: "Why is GET idempotent but POST is not? Give a concrete example.",
      answer:
        "GET /user/123 always returns the same user (assuming no changes). POST /orders with body {product: 'A'} creates a new order each time; retrying creates a duplicate order.",
      type: "text",
    },
  },
  {
    id: "dns-cdn",
    number: 3,
    category: "foundations",
    title: "DNS, CDN & The Internet",
    subtitle: "How domain names resolve and how CDNs bring content closer to users.",
    difficulty: "Beginner",
    estimatedHours: 2,
    icon: "MapPin",
    prerequisites: ["client-server-http"],
    lessons: [
      {
        id: "l3-dns",
        title: "DNS Resolution",
        content: [
          {
            type: "text",
            content:
              "The Domain Name System (DNS) is the phonebook of the internet. When you type google.com, DNS translates that human-readable name into an IP address.",
          },
          {
            type: "mermaid",
            title: "DNS Resolution Steps",
            caption: "Recursive resolution path from browser to authoritative nameserver",
            code: `flowchart LR
    A[Browser] --> B[Browser DNS<br/>Cache]
    B -->|miss| C[OS DNS<br/>Cache]
    C -->|miss| D[Recursive<br/>Resolver<br/>8.8.8.8]
    D --> E[Root Nameserver<br/>.] 
    E --> F[TLD Server<br/>.com]
    F --> G[Authoritative<br/>Nameserver<br/>google.com]
    G --> D
    D --> H[IP Address<br/>142.250.185.46]
    H --> A
    
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style D fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style G fill:#10b981,stroke:#059669,color:#fff
    style H fill:#f59e0b,stroke:#d97706,color:#fff`,
          },
          {
            type: "bullets",
            items: [
              "Browser cache → OS cache → Recursive resolver → Root server → TLD server → Authoritative server",
              "Each layer caches the result for the TTL (Time To Live) specified by the authoritative server.",
              "TTL is a trade-off: short TTL allows rapid failover; long TTL reduces DNS lookup load.",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content:
              "DNS resolution can take 10-200ms. A cached DNS entry is instant. This is why 'DNS prefetch' is a common optimization.",
          },
        ],
      },
      {
        id: "l3-cdn",
        title: "Content Delivery Networks",
        content: [
          {
            type: "text",
            content:
              "A CDN caches static assets (images, CSS, JS) at edge locations geographically close to users. This reduces latency and offloads the origin server.",
          },
          {
            type: "mermaid",
            title: "CDN Caching Strategy",
            caption: "Cache hierarchy from user to origin with hit/miss flows",
            code: `flowchart TD
    A[User<br/>Mumbai] --> B[Edge POP<br/>Mumbai<br/>Cache Hit?]
    B -->|HIT| C[Return<br/>Cached<br/>~10-30ms]
    B -->|MISS| D[Origin Shield<br/>US-East<br/>Cache Hit?]
    D -->|HIT| E[Return<br/>Cached<br/>~50-100ms]
    D -->|MISS| F[Origin Server<br/>Virginia]
    F -->|First Request| G[(Cache at<br/>Edge POP)]
    G --> E
    F -->|First Request| H[(Cache at<br/>Origin Shield)]
    H --> E
    
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style C fill:#10b981,stroke:#059669,color:#fff
    style E fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff`,
          },
          {
            type: "bullets",
            items: [
              "Edge POP (Point of Presence): A server in a city near the user.",
              "Origin Shield: An extra caching layer between edge POPs and the origin server. Reduces origin load.",
              "Cache Hit: Content is served directly from the edge. Fast (~10-50ms).",
              "Cache Miss: Edge fetches from origin or origin shield. Slower, but subsequent requests are cached.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "Version your asset filenames (e.g., main.a3f2b1.css) so you can set very long cache headers. When you deploy, the filename changes, bypassing the cache.",
          },
        ],
      },
    ],
    checkpoint: {
      prompt:
        "A user in Mumbai requests an image from your server in Virginia. Explain how a CDN reduces latency.",
      answer:
        "Without a CDN, the request travels 13,000km to Virginia (~200ms RTT). With a CDN, the image is cached at an edge POP in Mumbai (~10-30ms). The edge only contacts the origin on a cache miss.",
      type: "text",
    },
  },
  {
    id: "api-design",
    number: 4,
    category: "foundations",
    title: "API Design",
    subtitle: "REST principles, versioning, pagination, idempotency, and GraphQL vs gRPC.",
    difficulty: "Beginner",
    estimatedHours: 3,
    icon: "Plug",
    prerequisites: ["client-server-http"],
    lessons: [
      {
        id: "l4-rest",
        title: "REST API Design",
        content: [
          {
            type: "text",
            content:
              "REST (Representational State Transfer) is an architectural style for designing networked applications. It uses a stateless, client-server protocol (HTTP) and treats resources as nouns addressed by URLs.",
          },
          {
            type: "bullets",
            items: [
              "Use nouns, not verbs: GET /users not GET /getUsers.",
              "Plural resources: /users, /orders, /products.",
              "Nested resources for relationships: /users/123/orders.",
              "Use HTTP status codes correctly. 201 for created, 204 for deleted, 400 for bad input.",
              "Version in the URL: /v1/users. Or use a header: Accept: application/vnd.api+json;version=2.",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content:
              "API versioning in the URL is easier for clients. Versioning in headers is cleaner for the API surface but harder to debug.",
          },
        ],
      },
      {
        id: "l4-pagination",
        title: "Pagination Strategies",
        content: [
          {
            type: "text",
            content:
              "When a resource collection is large, you must paginate. There are three common strategies, each with trade-offs.",
          },
          {
            type: "table",
            headers: ["Strategy", "How it works", "Pros", "Cons"],
            rows: [
              ["Offset/Limit", "?offset=20&limit=10", "Simple, intuitive", "Performance degrades with large offsets; data shifts between pages"],
              ["Cursor-based", "?after=abc123&limit=10", "Consistent view; efficient at scale", "Cannot jump to arbitrary page; requires sorted unique cursor"],
              ["Keyset", "?last_seen_id=50&limit=10", "Very efficient for indexed columns", "Only works with single sort column"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "Offset pagination with OFFSET 1000000 is a database performance trap. The DB must scan and discard a million rows. Use cursor pagination for large datasets.",
          },
        ],
      },
      {
        id: "l4-graphql-grpc",
        title: "GraphQL vs gRPC vs REST",
        content: [
          {
            type: "text",
            content:
              "REST is the default for public APIs. GraphQL and gRPC solve specific problems that REST handles poorly.",
          },
          {
            type: "table",
            headers: ["Feature", "REST", "GraphQL", "gRPC"],
            rows: [
              ["Data shape", "Fixed by server", "Client specifies fields", "Fixed by protobuf"],
              ["Over-fetching", "Common", "Eliminated", "Possible"],
              ["Network format", "JSON", "JSON", "Binary (Protobuf)"],
              [ "Browser support", "Native", "Native", "Requires gRPC-Web proxy" ],
              [ "Best for", "Public APIs, caching", "Complex UIs, mobile", "Internal microservices" ],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "For a mobile app with varying screen sizes, GraphQL lets the client request exactly the fields it needs. For backend service-to-service calls, gRPC is faster due to binary serialization and HTTP/2 multiplexing.",
          },
        ],
      },
    ],
    lab: {
      id: "api-designer-lab",
      title: "API Design Studio",
      kind: "api-designer",
      objective: "Design a REST endpoint for a resource and validate it against best practices.",
      hint: "Remember: nouns, proper status codes, and consider pagination for list endpoints.",
    },
    checkpoint: {
      prompt: "Design GET and POST endpoints for a blog post resource. Include pagination for the list endpoint.",
      answer:
        "GET /v1/posts?limit=20&cursor=abc123 (cursor pagination), POST /v1/posts with body {title, content, authorId} returns 201 Created with Location: /v1/posts/456",
      type: "text",
    },
  },
  {
    id: "databases",
    number: 5,
    category: "foundations",
    title: "Databases: SQL vs NoSQL",
    subtitle: "ACID, BASE, schema design, indexing basics, and when to choose each.",
    difficulty: "Beginner",
    estimatedHours: 3,
    icon: "Database",
    prerequisites: ["api-design"],
    lessons: [
      {
        id: "l5-sql",
        title: "Relational Databases (SQL)",
        content: [
          {
            type: "text",
            content:
              "SQL databases store data in tables with predefined schemas. They guarantee ACID properties, making them ideal for transactions where correctness is critical.",
          },
          {
            type: "video-embed",
            url: "",
            title: "Introduction to SQL Databases",
            duration: "12:45",
          },
          {
            type: "bullets",
            items: [
              "Atomicity: All operations in a transaction succeed or all are rolled back.",
              "Consistency: The database moves from one valid state to another.",
              "Isolation: Concurrent transactions do not interfere with each other.",
              "Durability: Once committed, data survives power loss.",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content:
              "PostgreSQL and MySQL are the most common choices. PostgreSQL has richer features (JSONB, full-text search, GIS). MySQL is simpler and widely supported.",
          },
        ],
      },
      {
        id: "l5-nosql",
        title: "NoSQL Databases",
        content: [
          {
            type: "text",
            content:
              "NoSQL databases trade some ACID guarantees for horizontal scalability and flexible schemas. They are categorized into four types.",
          },
          {
            type: "table",
            headers: ["Type", "Examples", "Best for", "Trade-off"],
            rows: [
              ["Document Store", "MongoDB, Couchbase", "JSON-like objects, flexible schema", "No joins; denormalize or application-side join"],
              ["Key-Value Store", "Redis, DynamoDB", "Simple lookups, caching, sessions", "Limited query capabilities"],
              ["Wide-Column", "Cassandra, HBase", "Time-series, massive write throughput", "Eventual consistency; complex querying"],
              ["Graph", "Neo4j, Amazon Neptune", "Relationships, social networks, fraud detection", "Not for general-purpose workloads"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "The BASE model (Basically Available, Soft state, Eventual consistency) means NoSQL systems may return slightly stale data. This is acceptable for social media likes but not for bank balances.",
          },
        ],
      },
      {
        id: "l5-indexing",
        title: "Indexing Basics",
        content: [
          {
            type: "text",
            content:
              "An index is a data structure that speeds up queries at the cost of slower writes and extra storage. Without indexes, the database scans every row (full table scan).",
          },
          {
            type: "bullets",
            items: [
              "B-Tree index: Default for most databases. Balanced tree for O(log n) lookups, range scans, and sorting.",
              "Hash index: O(1) exact match lookups. Cannot do range queries.",
              "Composite index: Index on (A, B) speeds up queries on A alone and A+B, but not B alone.",
              "Covering index: The index contains all columns needed for the query. The database never touches the table.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "Every index adds write overhead because the index must be updated on INSERT, UPDATE, and DELETE. Do not index every column. Index only the columns you query by frequently.",
          },
        ],
      },
    ],
    lab: {
      id: "db-selector-lab",
      title: "Database Selector",
      kind: "db-selector",
      objective: "Answer questions about a workload and get a database recommendation.",
      hint: "Think about consistency requirements, query patterns, and scale needs.",
    },
    checkpoint: {
      prompt:
        "You are building a financial ledger. Should you use SQL or NoSQL? Why?",
      answer:
        "SQL (PostgreSQL). Financial ledgers require ACID transactions, strict consistency, and complex relational queries (e.g., account balances, transaction history with joins). NoSQL's eventual consistency is unacceptable here.",
      type: "text",
    },
  },
  {
    id: "scaling-basics",
    number: 6,
    category: "foundations",
    title: "Scaling Basics",
    subtitle: "Vertical vs horizontal scaling, stateless vs stateful, and sticky sessions.",
    difficulty: "Beginner",
    estimatedHours: 2,
    icon: "TrendingUp",
    prerequisites: ["databases"],
    lessons: [
      {
        id: "l6-vertical",
        title: "Vertical Scaling (Scale Up)",
        content: [
          {
            type: "text",
            content:
              "Vertical scaling means adding more CPU, RAM, or faster storage to a single machine. It is simple but has hard physical limits.",
          },
          {
            type: "bullets",
            items: [
              "Pros: No code changes; no distributed system complexity.",
              "Cons: Hardware ceiling (e.g., 256 CPU cores, 4TB RAM); single point of failure; downtime to upgrade.",
              "When to use: Early-stage startups, single-node databases with replication for reads.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "There is no such thing as a 10,000-core single machine at commodity prices. At some point, vertical scaling becomes prohibitively expensive.",
          },
        ],
      },
      {
        id: "l6-horizontal",
        title: "Horizontal Scaling (Scale Out)",
        content: [
          {
            type: "text",
            content:
              "Horizontal scaling means adding more machines to distribute the load. It is the only way to reach web scale, but it introduces distributed system complexity.",
          },
          {
            type: "video-embed",
            url: "",
            title: "Horizontal Scaling Explained",
            duration: "7:20",
          },
          {
            type: "mermaid",
            title: "Load Balancer Algorithms",
            caption: "Four common algorithms for distributing incoming traffic",
            code: `flowchart LR
    A[Clients] --> B[Load Balancer]
    B --> C1[Server 1]
    B --> C2[Server 2]
    B --> C3[Server 3]
    B --> C4[Server N]
    
    subgraph Round Robin
    B1[LB] -->|1st| S1[Server 1]
    B1 -->|2nd| S2[Server 2]
    B1 -->|3rd| S3[Server 3]
    B1 -->|4th| S4[Server 4]
    B1 -->|5th| S1
    end
    
    style B fill:#3b82f6,stroke:#2563eb,color:#fff
    style C1 fill:#10b981,stroke:#059669,color:#fff
    style C2 fill:#10b981,stroke:#059669,color:#fff
    style C3 fill:#10b981,stroke:#059669,color:#fff
    style C4 fill:#10b981,stroke:#059669,color:#fff`,
          },
          {
            type: "bullets",
            items: [
              "Stateless services are easy to scale: any server can handle any request.",
              "Stateful services (sessions, caches, databases) need coordination: sticky sessions or external state stores.",
              "Load balancers distribute traffic across the pool of servers.",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content:
              "The key to horizontal scaling is statelessness. If a server stores user session data in memory, you cannot move that user's request to another server without losing the session.",
          },
        ],
      },
      {
        id: "l6-stateless",
        title: "Stateless vs Stateful",
        content: [
          {
            type: "text",
            content:
              "A stateless service does not store any client-specific data between requests. A stateful service does. This distinction is critical for scaling.",
          },
          {
            type: "table",
            headers: ["Property", "Stateless", "Stateful"],
            rows: [
              ["Scaling", "Easy: add more instances", "Hard: need session affinity or shared state"],
              ["Recovery", "Fast: any instance handles request", "Slow: must restore state or route to correct instance"],
              ["Deployment", "Rolling restart is safe", "Must drain connections or migrate state"],
              ["Examples", "API servers, image processors", "WebSocket servers, game servers, shopping carts"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "If you need state, store it in Redis or a database, not in application memory. This makes your app servers stateless and easy to scale.",
          },
        ],
      },
    ],
    lab: {
      id: "scaling-simulator-lab",
      title: "Scaling Simulator",
      kind: "scaling-simulator",
      objective: "Add users to a system and observe when vertical scaling hits its limit, then switch to horizontal.",
      hint: "Watch the latency graph. When vertical hits 100% CPU, horizontal scaling is the only option.",
    },
    checkpoint: {
      prompt:
        "Your e-commerce app stores shopping carts in application memory. You need to scale from 2 to 10 servers. What problem do you face, and how do you fix it?",
      answer:
        "Problem: Carts are stateful; a user's request routed to a different server loses their cart. Fix: Move cart state to an external Redis cluster. App servers become stateless; any server can access any cart via Redis key user:{id}:cart.",
      type: "text",
    },
  },
  {
    id: "boe-math",
    number: 7,
    category: "foundations",
    title: "Back-of-Envelope Math",
    subtitle: "Powers of two, latency numbers, QPS estimation, storage math, and availability nines.",
    difficulty: "Beginner",
    estimatedHours: 3,
    icon: "Calculator",
    prerequisites: ["scaling-basics"],
    lessons: [
      {
        id: "l7-powers",
        title: "Powers of Two",
        content: [
          {
            type: "text",
            content:
              "Back-of-the-envelope calculations rely on order-of-magnitude estimation. Know these powers of two by heart.",
          },
          {
            type: "table",
            headers: ["Power", "Approximate Value", "Real Value"],
            rows: [
              ["2^10", "1 Thousand", "1,024"],
              ["2^20", "1 Million", "1,048,576"],
              ["2^30", "1 Billion", "1,073,741,824"],
              ["2^40", "1 Trillion", "1,099,511,627,776"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content:
              "In interviews, round aggressively. The goal is order of magnitude, not precision. 1 million users × 5 actions/day = 5M actions. Divide by 86,400 seconds ≈ 58 QPS average.",
          },
        ],
      },
      {
        id: "l7-latency",
        title: "Latency Numbers Every Programmer Should Know",
        content: [
          {
            type: "text",
            content:
              "These numbers, popularized by Jeff Dean, are the foundation of performance reasoning. They show the vast difference between memory, disk, and network.",
          },
          {
            type: "table",
            headers: ["Operation", "Latency", "Context"],
            rows: [
              ["L1 cache read", "0.5 ns", "Fastest access, CPU-local"],
              ["L2 cache read", "7 ns", "Still on-chip"],
              ["Main memory (RAM) read", "100 ns", "~100× slower than L1"],
              ["SSD read", "100 μs", "~1000× slower than RAM"],
              ["Disk seek", "10 ms", "~100,000× slower than RAM"],
              ["Round-trip same datacenter", "0.5 ms", "Network within one building"],
              ["Round-trip cross-continent", "150 ms", "New York to London"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content:
              "If your algorithm does 1000 disk seeks, that's 10 seconds. A single Redis lookup (100μs) is 100,000× faster. This is why caching is the single most effective optimization.",
          },
        ],
      },
      {
        id: "l7-qps",
        title: "Estimating QPS and Storage",
        content: [
          {
            type: "text",
            content:
              "Capacity estimation prevents two failure modes: over-provisioning (wasting money) and under-provisioning (outages under load).",
          },
          {
            type: "formula",
            expression: "QPS_avg = (DAU × Actions_per_day) / 86,400",
            explanation:
              "100M DAU × 5 actions = 500M actions/day. 500M / 86,400 ≈ 5,800 QPS average. Peak is typically 2-5× average, so ~30K QPS peak.",
          },
          {
            type: "formula",
            expression: "Storage = Records_per_day × Record_size × Retention_days",
            explanation:
              "500M tweets/day × 300 bytes × 365 days = ~55 TB/year. Plan for 2× growth in Year 1.",
          },
          {
            type: "callout",
            variant: "info",
            content:
              "Availability is measured in 'nines'. 99.9% = 8.77 hours downtime/year. 99.99% = 52.6 minutes. Each additional nine is exponentially harder and more expensive.",
          },
        ],
      },
    ],
    lab: {
      id: "boe-calculator-lab",
      title: "BoE Calculator",
      kind: "boe-calculator",
      objective: "Estimate QPS, storage, and bandwidth for a given system.",
      hint: "Start with DAU and actions per day. Peak QPS is usually 3× average. Don't forget growth!",
    },
    checkpoint: {
      prompt:
        "A photo-sharing app has 10M DAU. Each user uploads 2 photos/day (avg 2MB) and views 50 photos/day. Estimate daily storage growth and peak read QPS.",
      answer:
        "Storage: 10M × 2 × 2MB = 40 TB/day. QPS: 10M × 50 / 86,400 ≈ 5,800 avg. Peak ≈ 3× = ~17,400 QPS. Bandwidth: 5,800 × 2MB ≈ 11.6 GB/s read throughput.",
      type: "text",
    },
  },
  ...phase2Modules,
  ...phase3Modules,
  ...phase4Modules,
  ...phase5Modules,
  ...phase6Modules,
  ...phase7Modules,
  ...phase8Modules,
];

export const getModuleById = (id: string): Module | undefined =>
  modules.find((m) => m.id === id);

export const getModulesByCategory = (category: string): Module[] =>
  modules.filter((m) => m.category === category);

export const getAllCategories = (): string[] => [
  ...new Set(modules.map((m) => m.category)),
];
