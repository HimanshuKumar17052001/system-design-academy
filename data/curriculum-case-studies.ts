import type { Module } from "@/types/curriculum";

export const caseStudyModules: Module[] = [
  {
    id: "cs-url-shortener",
    number: 201,
    category: "case-studies",
    title: "URL Shortener",
    subtitle: "Design a URL redirection service like Bit.ly",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "Link",
    prerequisites: ["sd-dns", "sd-caching"],
    lessons: [
      {
        id: "cs-url-shortener-design",
        title: "System Design",
        content: [
          {
            type: "text",
            content: "A URL shortener takes a long URL and produces a shorter, unique URL. When clicked, it redirects to the original URL. The core challenge is generating short, unique keys and handling high-volume redirects efficiently.",
          },
          {
            type: "bullets",
            items: [
              "Base62 encoding: Use characters a-z, A-Z, 0-9 to encode URL IDs in base 62",
              "Hash-based: MD5 or SHA-256 the long URL, then base62 encode a portion",
              "301/302 redirects: Permanent (301) caches at browser, temporary (302) doesn't",
              "Custom aliases: Allow users to choose their own short keys (e.g., bit.ly/my-link)",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "Base62 gives 62^7 ≈ 3.5 trillion unique URLs with 7 characters. Even 6 characters (62^6 ≈ 56 billion) covers most use cases.",
          },
          {
            type: "mermaid",
            title: "URL Shortener Flow",
            caption: "Creation and redirection flows for a URL shortener",
            code: `flowchart TD
                subgraph Create
                A[User submits long URL] --> B[Generate short key<br/>base62(ID) or MD5]
                B --> C{Key exists?}
                C -->|Yes| D[Regenerate with collision check]
                C -->|No| E[Store mapping<br/>short_url → long_url]
                E --> F[Return short URL]
                end
                
                subgraph Redirect
                G[User clicks short URL] --> H[Lookup in DB/Redis]
                H --> I{Cache hit?}
                I -->|Yes| J[Return cached long_url]
                I -->|No| K[Query database]
                K --> J
                J --> L[302 Redirect to long_url]
                end`,
          },
          {
            type: "callout",
            variant: "tip",
            content: "Use 302 (Found/temporary redirect) by default so you can update the destination URL without losing analytics. Use 301 only if you are certain the mapping will never change.",
          },
        ],
      },
      {
        id: "cs-url-shortener-data",
        title: "Data Model",
        content: [
          {
            type: "text",
            content: "The URL shortener needs to store the mapping between short keys and long URLs. The workload is read-heavy (redirects) vs write-light (creation), so caching hot URLs in Redis is critical.",
          },
          {
            type: "table",
            headers: ["Storage", "Data", "Access Pattern"],
            rows: [
              ["PostgreSQL", "id, short_key, long_url, created_at, click_count", "Persist all mappings, index on short_key"],
              ["Redis", "short_key → long_url", "Cache hot URLs, TTL matching peak hours"],
              ["Cassandra", "shard by short_key prefix", "If sharding across nodes for 100M+ URLs/day"],
            ],
          },
          {
            type: "bullets",
            items: [
              "Primary key: short_key (unique index) for O(1) lookups",
              "Click counter: Incremented async via message queue to avoid write contention",
              "Redis cache: LRU or LFU eviction; hot URLs (top 1%) serve 99% of traffic",
              "Analytics: Store timestamp, referrer, user-agent for each redirect",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Never increment click_count synchronously on the redirect path. This would double your write load and hurt redirect latency. Use a queue to batch-increment counter updates.",
          },
        ],
      },
      {
        id: "cs-url-shortener-scale",
        title: "Scale",
        content: [
          {
            type: "text",
            content: "At 100M new URLs/day and 10K:1 read-to-write ratio, you handle ~1B redirects/day. This is a heavily read-optimized system where every millisecond of latency matters.",
          },
          {
            type: "formula",
            expression: "Write QPS = 100M / 86,400 ≈ 1,160 writes/sec",
            explanation: "Creation is ~1,200 writes/sec, modest for a distributed database.",
          },
          {
            type: "formula",
            expression: "Read QPS = 100M × 10,000 / 86,400 ≈ 1.16 billion reads/day ≈ 13,400 QPS",
            explanation: "Redirects are ~13,000 QPS peak, served primarily from Redis cache.",
          },
          {
            type: "bullets",
            items: [
              "Redis cluster: 3 master nodes, each handling ~4,500 QPS with sub-millisecond latency",
              "Rate limiting: 10-100 creation requests per user per minute via Redis sliding window",
              "Pre-warm cache: On startup, load top 10K URLs into Redis to handle peak traffic",
              "Geo-distribution: Deploy Redis replicas in multiple regions; local redirects for each region",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "At 13K QPS redirect load, even 1ms extra latency means 13,000 unnecessary database queries. Always use Redis for hot URL lookups, never hit the database directly on the redirect path.",
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Design the data model and caching strategy for a URL shortener handling 1B redirects/day.",
      answer: "PostgreSQL stores id, short_key, long_url, click_count. Redis caches hot URLs (LRU, TTL 1hr). Redis handles ~99% of redirect traffic. Click counts are batch-updated via a message queue to avoid write contention. Shard PostgreSQL by short_key prefix if single node becomes bottleneck.",
      type: "text",
    },
  },
  {
    id: "cs-social-feed",
    number: 202,
    category: "case-studies",
    title: "Social Feed",
    subtitle: "Design a newsfeed system like Twitter/X or Instagram",
    difficulty: "Advanced",
    estimatedHours: 4,
    icon: "Users",
    prerequisites: ["sd-caching", "sd-queues"],
    lessons: [
      {
        id: "cs-social-feed-fanout",
        title: "Fan-out",
        content: [
          {
            type: "text",
            content: "A social feed shows posts from all users you follow. The fundamental design decision is when to distribute posts: at write time (push) or at read time (pull).",
          },
          {
            type: "table",
            headers: ["Model", "Write", "Read", "Best for", "Trade-off"],
            rows: [
              ["Push (Fan-out Write)", "Distribute to followers on post", "Read own feed from cache", "Write-heavy, few followers", "Expensive writes if user has 1M followers"],
              ["Pull (Fan-out Read)", "Store only author's post", "Query all followed users' posts at read time", "Celebrities with millions of followers", "Expensive reads, slow fan-out"],
              ["Hybrid", "Push for normal users, pull for celebrities", "Merge cached + live queries", "Mixed follower distribution", "Most practical approach"],
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "Twitter's hybrid approach: Push your posts to followers with <10K followers immediately. For celebrities (1M+ followers), do not push—let their posts appear via pull when you request your feed.",
          },
          {
            type: "bullets",
            items: [
              "Push model: Write once, read many. Follower's feed is pre-computed and cached.",
              "Pull model: Write once, read merges posts from all followed users at query time.",
              "Celebrity problem: A user with 10M followers cannot have each follower updated synchronously.",
              "Feed size limit: Store only last 1000 posts per user to bound storage and merge cost.",
            ],
          },
        ],
      },
      {
        id: "cs-social-feed-ranking",
        title: "Ranking",
        content: [
          {
            type: "text",
            content: "A chronological feed is simple but not engaging. Real feeds rank posts by relevance using multiple signals: recency, engagement, affinity, and content quality.",
          },
          {
            type: "table",
            headers: ["Signal", "Description", "Weight"],
            rows: [
              ["Recency", "How recently was the post published?", "High for news, lower for entertainment"],
              ["Engagement", "Likes, retweets, comments, shares", "Hot posts get boosted to top"],
              ["Affinity", "How much do you interact with this author?", "Close friends appear higher"],
              ["Content Type", "Video > images > text (in general)", "Platform-dependent"],
              ["Diversity", "Avoid showing 3 posts from same author in row", "Keeps feed interesting"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Ranking is a business decision, not just a technical one. The algorithm directly controls what content gets seen. This has implications for content moderation and filter bubbles.",
          },
          {
            type: "bullets",
            items: [
              "Edge ranking: Facebook's name for their ranking algorithm uses thousands of features.",
              "Inverted-timestamp penalty: New posts start at top but decay if engagement is low.",
              "Gamma distribution: Model time-decay and engagement signals as probability distributions.",
              "A/B testing: Production ranking systems are continuously tested and improved.",
            ],
          },
        ],
      },
      {
        id: "cs-social-feed-scale",
        title: "Scale",
        content: [
          {
            type: "text",
            content: "At 300M DAU with 50% daily active users, a social feed must handle massive read and write throughput with strict latency requirements (feed loads in <1 second).",
          },
          {
            type: "formula",
            expression: "Read QPS = 150M DAU × 5 feeds/day / 86,400 ≈ 8,700 QPS",
            explanation: "Average feed read rate across all users.",
          },
          {
            type: "formula",
            expression: "Write QPS = 150M DAU × 2 posts/day / 86,400 ≈ 3,500 writes/sec",
            explanation: "Post creation rate; each triggers fan-out to followers.",
          },
          {
            type: "bullets",
            items: [
              "Shard by user_id: Feed for user 123 is stored on node responsible for user 123.",
              "Photo/video storage: Use S3 + CloudFront; never store media in the feed database.",
              "Comment latency: Show post immediately, load comments asynchronously.",
              "Read replicas: Each shard has 2-3 replicas for read scaling and fault tolerance.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Separate hot and cold storage. Posts older than 7 days can be moved to slower, cheaper storage. The active feed (last 7 days) stays in fast storage; older posts are fetched on-demand.",
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Compare push vs pull fan-out models. When would you use a hybrid approach?",
      answer: "Push model fan-outs posts to all followers at write time (good for few followers). Pull model queries followed users' posts at read time (good for celebrities). Hybrid: push for normal users (e.g., <10K followers) and pull for celebrities. This avoids expensive fan-out writes for celebrity accounts while keeping normal users' feeds fast.",
      type: "text",
    },
  },
  {
    id: "cs-web-crawler",
    number: 203,
    category: "case-studies",
    title: "Web Crawler",
    subtitle: "Design a scalable web crawling system",
    difficulty: "Advanced",
    estimatedHours: 4,
    icon: "Spider",
    prerequisites: ["sd-queues", "sd-consistency-patterns"],
    lessons: [
      {
        id: "cs-web-crawler-politeness",
        title: "Politeness",
        content: [
          {
            type: "text",
            content: "A web crawler fetches pages from millions of websites. Being polite means respecting server capacity, following robots.txt directives, and not overwhelming any single domain.",
          },
          {
            type: "bullets",
            items: [
              "Respect robots.txt: Parse and obey each site's robots.txt file before crawling.",
              "Rate limiting per domain: Never fetch more than 1-10 pages/second from a single domain.",
              "Exponential backoff: If a server returns 429 or 503, wait and retry with doubling delays.",
              "Off-peak crawling: Prioritize crawling during off-hours to reduce impact on origin servers.",
            ],
          },
          {
            type: "table",
            headers: ["Status Code", "Meaning", "Crawler Action"],
            rows: [
              ["200", "Success", "Parse content, extract links, schedule new URLs"],
              ["301/302", "Redirect", "Follow redirect, record new URL"],
              ["429", "Too Many Requests", "Exponential backoff, respect Retry-After header"],
              ["503", "Service Unavailable", "Retry after delay; check robots.txt again"],
              ["404", "Not Found", "Mark URL as dead, do not revisit for weeks"],
              ["403", "Forbidden", "Honor immediately; do not retry without permission"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Aggressive crawling can cause a denial-of-service on the target website. Always implement per-domain rate limits before running a large-scale crawl.",
          },
        ],
      },
      {
        id: "cs-web-crawler-architecture",
        title: "Architecture",
        content: [
          {
            type: "text",
            content: "A production web crawler is a multi-stage pipeline: URL frontier queues URLs, schedulers prioritize them, fetchers retrieve pages, parsers extract content and links, and storage holds the results.",
          },
          {
            type: "mermaid",
            title: "Web Crawler Architecture",
            caption: "Multi-stage pipeline from URL frontier to content storage",
            code: `flowchart LR
                A[URL Frontier<br/>Priority Queue] --> B[Scheduler<br/>Queues by domain]
                B --> C[Fetcher<br/>Rate-limited<br/>per domain]
                C --> D[Parser<br/>Extracts content<br/>& links]
                D --> E[(Content<br/>Storage)]
                D -->|New URLs| A
                C -->|Error| F[Backoff<br/>Retry Queue]`,
          },
          {
            type: "bullets",
            items: [
              "URL Frontier: Priority queue (typically Redis or a custom queue) holding URLs to crawl.",
              "Scheduler: Groups URLs by domain, enforces politeness constraints, outputs rate-limited requests.",
              "Fetcher: HTTP client with connection pooling, handles redirects, cookies, and SSL.",
              "Parser: Extracts raw text, structured data, and new URLs from HTML content.",
              "Storage: Raw HTML in blob storage (S3), parsed content in database, metadata in search index.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Separate the crawl rate by domain. A global rate limit of 1000 pages/second sounds safe, but it could mean 1000 pages/second from domain X if X has enqueued URLs—definitely not polite.",
          },
        ],
      },
      {
        id: "cs-web-crawler-dedup",
        title: "Deduplication",
        content: [
          {
            type: "text",
            content: "A web crawler encounters the same URL many times through different links. URL deduplication prevents re-crawling pages already visited or queued.",
          },
          {
            type: "table",
            headers: ["Technique", "Data Structure", "False Positive", "Memory"],
            rows: [
              ["Exact Match", "HashSet / Bloom filter", "None", "High (8 bytes per URL)"],
              ["Bloom Filter", "Bitmap + k hash functions", "~1% possible", "1 bit per URL"],
              ["Normalized URL Set", "Canonical URL + HashSet", "None", "Medium"],
            ],
          },
          {
            type: "bullets",
            items: [
              "URL normalization: Remove fragments (#), normalize trailing slashes, lowercase scheme+host.",
              "Canonical URLs: www.example.com = example.com. Handle redirect chains before deduplication.",
              "Bloom filter: Space-efficient probabilistic data structure. Small false positive rate is acceptable.",
              "Visited set: Store in Redis with TTL; revisit if content changed (Etag/Last-Modified).",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "A 10-billion URL Bloom filter with 1% false positive rate uses ~1.2 GB of memory. This is a standard technique in production crawlers like Googlebot.",
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Design the politeness layer for a web crawler handling 1M pages/day.",
      answer: "Per-domain rate limiting: max 1 page/second per domain. Use a domain-based scheduler that queues URLs by domain and dispatches at the allowed rate. On 429/503, implement exponential backoff (1s, 2s, 4s, 8s...). Parse robots.txt before crawling any domain. Store crawl state in Redis with per-domain crawl delays.",
      type: "text",
    },
  },
  {
    id: "cs-chat-server",
    number: 204,
    category: "case-studies",
    title: "Chat Server",
    subtitle: "Design a real-time messaging system like WhatsApp or Slack",
    difficulty: "Advanced",
    estimatedHours: 4,
    icon: "MessageSquare",
    prerequisites: ["sd-availability-patterns", "sd-queues"],
    lessons: [
      {
        id: "cs-chat-server-presence",
        title: "Presence",
        content: [
          {
            type: "text",
            content: "Presence indicates whether a user is online, offline, or away. It enables 'last seen' timestamps, online status indicators, and typing indicators.",
          },
          {
            type: "bullets",
            items: [
              "Heartbeat mechanism: Client sends heartbeat every 30 seconds. Server marks user online if heartbeat received within timeout.",
              "Last seen timestamp: Store and display approximate time (e.g., 'last seen 5 minutes ago').",
              "Push notifications: Webhook to mobile push service (APNs, FCM) when a message arrives for offline user.",
              "Typing indicators: Ephemeral message with 3-5 second TTL—do not persist.",
            ],
          },
          {
            type: "mermaid",
            title: "Presence State Machine",
            caption: "Transitions between online, away, and offline states",
            code: `stateDiagram-v2
                [*] --> Online: Connect
                Online --> Away: No activity 5min
                Online --> Offline: Disconnect / Timeout
                Away --> Online: Activity detected
                Away --> Offline: Extended timeout
                Offline --> Online: Reconnect
                
                note right of Online: Heartbeat every 30s
                note right of Away: Last seen visible
                note right of Offline: Message queue active`,
          },
          {
            type: "callout",
            variant: "tip",
            content: "Don't show precise timestamps for offline users. Instead, bucket them: 'last seen 5 minutes ago', 'last seen 2 hours ago'. This reduces privacy exposure and UI churn.",
          },
        ],
      },
      {
        id: "cs-chat-server-messaging",
        title: "Messaging",
        content: [
          {
            type: "text",
            content: "Direct messages (DM) are 1:1; group chats are 1:N. Both need message persistence, delivery guarantees, and offline message queuing.",
          },
          {
            type: "table",
            headers: ["Feature", "Implementation", "Trade-off"],
            rows: [
              ["Message persistence", "Store in PostgreSQL with conversation_id index", "Required for offline access"],
              ["Delivery guarantee", "At-least-once delivery with client ACK", "May duplicate; deduplicate by message_id"],
              ["Ordering", "Lamport timestamp or sequence number per conversation", "Out-of-order display if client-side sort is imperfect"],
              ["Offline queue", "Store undelivered messages in Redis; deliver on reconnect", "TTL on queued messages (max 7 days)"],
              ["Read receipts", "Update 'last_read_message_id' per user per conversation", "Privacy concern; make optional"],
            ],
          },
          {
            type: "bullets",
            items: [
              "WebSocket connection: Maintains persistent TCP connection for real-time bidirectional messaging.",
              "Message ID: UUID or snowflake ID with timestamp and node identifier embedded.",
              "Group chat: Expand recipient list at write time (push to all members). Limit to 1000 members.",
              "Reaction emojis: Ephemeral counters, not new messages. Store in separate reaction table.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "If a user is offline when a message is sent, queue it. Do not lose messages. Use Redis LIST as a queue with RPUSH (enqueue) and LPOP (dequeue) pattern.",
          },
        ],
      },
      {
        id: "cs-chat-server-scale",
        title: "Scale",
        content: [
          {
            type: "text",
            content: "WhatsApp handles 65M messages/sec at peak. At this scale, connection state management and message fan-out are the primary bottlenecks.",
          },
          {
            type: "formula",
            expression: "Connections = 1M DAU × (0.1 concurrent connections/user) ≈ 100K concurrent WebSocket connections",
            explanation: "Average concurrent WebSocket connections for 1M DAU with burst patterns.",
          },
          {
            type: "bullets",
            items: [
              "Connection state: Store in Redis or a distributed session store. Never in application memory.",
              "Message ordering: Assign monotonic sequence numbers per conversation. Client reorders if needed.",
              "Read replicas: Route read requests (message history) to replicas. Writes go to primary.",
              "Sharding: Shard conversations across DB nodes by conversation_id. Co-locate messages for same conversation.",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "For 100K concurrent connections, use a distributed connection registry in Redis rather than sticky sessions on load balancers. This allows any server to send messages to any user.",
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Design a presence system that handles 1M concurrent users.",
      answer: "Heartbeat every 30s. User is ONLINE if heartbeat received within 60s; AWAY if > 60s; OFFLINE if > 5min or disconnected. Store presence in Redis hash: user:{id}:presence = {status, last_seen, server_id}. Push updates via WebSocket to interested parties (contacts, group members). Scale with Redis Cluster sharded by user_id.",
      type: "text",
    },
  },
  {
    id: "cs-key-value-store",
    number: 205,
    category: "case-studies",
    title: "Key-Value Store",
    subtitle: "Design a distributed key-value store like Redis or DynamoDB",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "Database",
    prerequisites: ["sd-cap-theorem", "sd-consistency-patterns"],
    lessons: [
      {
        id: "cs-key-value-store-design",
        title: "Design",
        content: [
          {
            type: "text",
            content: "A key-value store provides get/put operations on arbitrary keys with values. Simple in concept, but distributed key-value stores must handle node failures, data partitioning, and consistency.",
          },
          {
            type: "bullets",
            items: [
              "Consistent hashing: Partition key space across nodes; remap minimal keys on node add/remove.",
              "Versioning: Each key has multiple versions with version numbers or vector clocks.",
              "TTL support: Expire keys after a time-to-live. Implement with periodic background cleanup or lazy expiration.",
              "CAS (Check-and-Set): Conditional write only if version matches expected value.",
            ],
          },
          {
            type: "mermaid",
            title: "Consistent Hashing",
            caption: "Key space partitioned across 4 nodes with virtual nodes for load balancing",
            code: `flowchart TD
                A[Key Space<br/>0 to 2^32] --> B[Node 1<br/>0-85]
                A --> C[Node 2<br/>85-170]
                A --> D[Node 3<br/>170-255]
                A --> E[Node 4<br/>255-0]
                B --> F[Virtual Node 1a, 1b, 1c]
                C --> G[Virtual Node 2a, 2b, 2c]
                D --> H[Virtual Node 3a, 3b, 3c]
                E --> I[Virtual Node 4a, 4b, 4c]
                style B fill:#3b82f6,stroke:#2563eb,color:#fff
                style C fill:#10b981,stroke:#059669,color:#fff
                style D fill:#f59e0b,stroke:#d97706,color:#fff
                style E fill:#8b5cf6,stroke:#7c3aed,color:#fff`,
          },
          {
            type: "callout",
            variant: "info",
            content: "Virtual nodes (also called VNodes) assign multiple hash slots per physical node, improving load distribution and making it easier to add/remove nodes gradually.",
          },
        ],
      },
      {
        id: "cs-key-value-store-consistency",
        title: "Consistency",
        content: [
          {
            type: "text",
            content: "Distributed key-value stores trade consistency for availability. Quorum-based systems allow you to tune the consistency level.",
          },
          {
            type: "table",
            headers: ["Quorum Type", "Read", "Write", "Description"],
            rows: [
              ["Strict Quorum", "R + W > N", "R + W > N", "Strong consistency; R and W overlap on majority"],
              [" sloppy quorum", "Any W replicas", "First N healthy replicas", "Temporarily write to non-preferred nodes if preferred is down"],
              ["Read-your-writes", "Read from version written by same client", "Track client session", "Client always sees its own writes"],
            ],
          },
          {
            type: "bullets",
            items: [
              "Quorum reads/writes: R = number of replicas read, W = number of replicas written. Strong consistency requires R + W > N.",
              "Vector clocks: {node_id: counter} pairs track causal history. Detect concurrent writes.",
              "Conflict resolution: Last-write-wins (simple), semantic merge (for sets), or return all versions to client.",
              "Dynamo-style: Return all conflicting versions to client; let client resolve.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Vector clocks grow unboundedly if a key is updated by many nodes. Implement version pruning: keep last N versions or versions older than 1 hour.",
          },
        ],
      },
      {
        id: "cs-key-value-store-availability",
        title: "Availability",
        content: [
          {
            type: "text",
            content: "When a node fails, its data must be re-replicated to healthy nodes. Anti-entropy ensures replicas don't diverge over time.",
          },
          {
            type: "bullets",
            items: [
              "Handoff on failure: When a node fails, its replicas are re-replicated to other nodes. Reads continue from available replicas.",
              "Anti-entropy: Background process compares replicas using Merkle trees; syncs divergent keys.",
              "Merkle trees: Hash tree where leaf nodes are key hashes; comparing roots identifies buckets of divergent keys.",
              "Hinted handoff: If node N is temporarily unavailable, writes to N are stored on another node with a hint to replay when N recovers.",
            ],
          },
          {
            type: "table",
            headers: ["Failure Type", "Detection", "Recovery"],
            rows: [
              ["Node crash", "Heartbeat timeout (~10s)", "Re-replicate to new node; anti-entropy sync"],
              ["Network partition", "Gossip protocol detects unreachable nodes", "Reads served from remaining quorum; writes buffered"],
              ["Byzantine failure", "Checksums and version vectors", "Node marked suspicious; data verified before serving"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Merkle trees are efficient for large datasets: comparing two trees of 1M keys requires only O(log n) data transfer if roots match, not O(n).",
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Design a key-value store with strong consistency using quorum reads/writes.",
      answer: "Use N = 3 replicas. For strong consistency, require W = 2 (majority) writes and R = 2 reads. This ensures R + W > N (2 + 2 > 3). Every write must be acknowledged by 2 replicas before returning success. Read must contact 2 replicas and return the latest version. Use vector clocks to track causality.",
      type: "text",
    },
  },
  {
    id: "cs-sales-rank",
    number: 206,
    category: "case-studies",
    title: "Sales Rank",
    subtitle: "Design a product ranking and trending system like Amazon or Etsy",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "TrendingUp",
    prerequisites: ["sd-caching", "sd-cdn"],
    lessons: [
      {
        id: "cs-sales-rank-algorithm",
        title: "Ranking Algorithm",
        content: [
          {
            type: "text",
            content: "Sales rank combines multiple signals into a time-decay score. Products that sold recently and frequently rank higher than products with old sales.",
          },
          {
            type: "formula",
            expression: "Score = Σ(sale_weight × time_decay) + popularity_boost + inventory_penalty",
            explanation: "Recent sales weighted heavily; older sales decay exponentially. Popularity boost for high-engagement items. Inventory penalty for low stock.",
          },
          {
            type: "table",
            headers: ["Signal", "Description", "Weight Range"],
            rows: [
              ["Recent sales", "Sales in last 24 hours", "High (0.5-0.7)"],
              ["Weekly sales", "Sales in last 7 days", "Medium (0.2-0.3)"],
              ["Total reviews", "Count of product reviews", "Low (0.05-0.1)"],
              ["Conversion rate", "Views-to-purchase ratio", "Medium (0.1-0.2)"],
              ["Inventory level", "Stock relative to typical stock", "Penalty (-0.1 if low)"],
            ],
          },
          {
            type: "bullets",
            items: [
              "Time-decay functions: Half-life decay (score halves every N hours) or exponential decay.",
              "Category-specific ranking: Separate rankings for Electronics, Clothing, Home, etc.",
              "Seasonal adjustment: Boost holiday-related categories during shopping seasons.",
              "A/B testing: Continuously test weight combinations against conversion rate.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Use a half-life decay: score = sales_count / (1 + hours_since_sale)^1.5. Products sold 1 hour ago contribute 1.0; products sold 24 hours ago contribute 0.04.",
          },
        ],
      },
      {
        id: "cs-sales-rank-data",
        title: "Data Model",
        content: [
          {
            type: "text",
            content: "Rankings must update in near-real-time as sales happen. Redis sorted sets are the ideal data structure: O(log n) insertions and deletions, O(log n + m) range queries.",
          },
          {
            type: "bullets",
            items: [
              "Redis sorted set: key = 'ranking:category:{id}', score = rank_score, member = product_id.",
              "Item metadata: PostgreSQL stores product details (name, price, image_url, category).",
              "Category hierarchy: Tree structure (Electronics > Phones > Smartphones). Products ranked within their leaf category.",
              "Composite rankings: Store multiple sorted sets per category, per time window (hourly, daily, weekly).",
            ],
          },
          {
            type: "table",
            headers: ["Data Store", "Contents", "Access Pattern"],
            rows: [
              ["Redis Sorted Set", "product_id → score per category", "ZREVRANGE for top-N; ZADD for updates"],
              ["PostgreSQL", "Product metadata (name, price, category)", "Product detail page; indexed by id"],
              ["Message Queue", "Sale events for batch scoring", "Batch score updates every 5-10 minutes"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Updating Redis scores for every sale event is expensive. Batch updates every 5-10 minutes: collect sale events in a queue, compute new scores, then ZADD the batch.",
          },
        ],
      },
      {
        id: "cs-sales-rank-consistency",
        title: "Consistency",
        content: [
          {
            type: "text",
            content: "Sales rank updates are eventually consistent. The tradeoff: immediate consistency (update on every sale) vs throughput (batch updates).",
          },
          {
            type: "bullets",
            items: [
              "Batch updates: Collect sales events for 5-10 minutes, then recompute scores and update Redis.",
              "Eventual consistency: Rankings may be stale by up to 10 minutes; acceptable for non-critical use.",
              "Cache invalidation: When product metadata changes (name, category), invalidate and recompute its score.",
              "Fallback rankings: If Redis is unavailable, serve pre-computed static rankings from CDN edge.",
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "Amazon's 'Hot New Releases' and 'Movers & Shakers' are updated daily, not in real-time. Eventual consistency is acceptable for most ranking use cases.",
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Design a product ranking system using Redis sorted sets.",
      answer: "Store sorted set per category: ZADD 'ranking:electronics' {score} {product_id}. Score = weighted sum of recent_sales with time decay. On sale event, increment in-memory counter. Every 5 minutes, batch-update Redis scores via ZADD. Use ZREVRANGE to get top-N products. Separate sorted sets for daily/weekly/all-time rankings.",
      type: "text",
    },
  },
  {
    id: "cs-scale-millions",
    number: 207,
    category: "case-studies",
    title: "Scale to Millions",
    subtitle: "Design patterns for scaling to millions of users and beyond",
    difficulty: "Advanced",
    estimatedHours: 5,
    icon: "Maximize",
    prerequisites: [
      "cs-url-shortener",
      "cs-social-feed",
      "cs-web-crawler",
      "cs-chat-server",
      "cs-key-value-store",
      "cs-sales-rank",
    ],
    lessons: [
      {
        id: "cs-scale-millions-estimation",
        title: "Estimation",
        content: [
          {
            type: "text",
            content: "Before designing, estimate scale from requirements. This drives architecture decisions about QPS, storage, bandwidth, and cost.",
          },
          {
            type: "formula",
            expression: "QPS_avg = (DAU × Sessions_per_day × Requests_per_session) / 86,400",
            explanation: "Example: 100M DAU × 5 sessions/day × 20 requests/session = 10B requests/day ≈ 116K QPS average.",
          },
          {
            type: "formula",
            expression: "QPS_peak = QPS_avg × Peak_to_Average_Ratio",
            explanation: "Peak is typically 2-5× average. For 116K average, peak ≈ 300K-600K QPS.",
          },
          {
            type: "formula",
            expression: "Storage_per_year = (Records_per_day × Record_size × 365) / Compression_Ratio",
            explanation: "1B events/day × 1KB × 365 = 365 TB/year. With 3× replication = ~1.1 PB.",
          },
          {
            type: "bullets",
            items: [
              "Bandwidth: QPS_peak × Average_Request_Size = 300K × 10KB = 3 GB/s ≈ 24 Gbps.",
              "Memory: Active working set in Redis = hot data only. Not all 365 TB needs to be in memory.",
              "Cost estimation: 1 PB storage ≈ $20K/month at $0.023/GB (S3). Add compute, network, and ops.",
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Underestimating peak QPS is the #1 cause of production outages. Always design for 3-5× peak, not average. A system at 100% capacity has no headroom for traffic spikes.",
          },
        ],
      },
      {
        id: "cs-scale-millions-patterns",
        title: "Architecture Patterns",
        content: [
          {
            type: "text",
            content: "At millions-of-users scale, monolithic architectures break down. Three patterns enable horizontal scaling: microservices, event sourcing, and CQRS.",
          },
          {
            type: "table",
            headers: ["Pattern", "What it does", "Benefit", "Trade-off"],
            rows: [
              ["Microservices", "Decompose into independent services", "Independent scaling, fault isolation", "Complexity: networking, monitoring, data consistency"],
              ["Event Sourcing", "Store all events, derive current state", "Audit log, replay, temporal queries", "Learning curve; event schema evolution"],
              ["CQRS", "Separate read and write models", "Optimize each for its access pattern", "Keeping read/write models in sync"],
            ],
          },
          {
            type: "mermaid",
            title: "Microservices Architecture",
            caption: "Decomposed services with API gateway and message queue",
            code: `flowchart TD
                A[Client] --> B[API Gateway]
                B --> C[Auth Service]
                B --> D[User Service]
                B --> E[Order Service]
                B --> F[Payment Service]
                G[(Message Queue)] -.-> C
                G -.-> D
                G -.-> E
                G -.-> F
                C --> H[(User DB)]
                D --> I[(User DB)]
                E --> J[(Order DB)]
                F --> K[(Payment DB)]`,
          },
          {
            type: "callout",
            variant: "info",
            content: "Netflix decomposes everything: API gateway routes to specific microservices (user, title, devices, billing). Each microservice owns its data and scales independently.",
          },
        ],
      },
      {
        id: "cs-scale-millions-database",
        title: "Database Scaling",
        content: [
          {
            type: "text",
            content: "A single database node cannot handle millions of users. Scale read capacity with replicas; scale write capacity with sharding.",
          },
          {
            type: "bullets",
            items: [
              "Read replicas: 1 primary + 3 replicas. Route reads to replicas, writes to primary. Replica lag introduces eventual consistency for reads.",
              "Sharding strategies: Hash-based (key % n), range-based (user_id 0-1M on node 1), directory-based (lookup service).",
              "Denormalization: Store pre-computed joins in a single table to avoid multi-table queries.",
              "Change Data Capture (CDC): Stream database changes to downstream consumers via Debezium or Kafka Connect.",
            ],
          },
          {
            type: "table",
            headers: ["Sharding Key", "Example", "Best for", "Challenge"],
            rows: [
              ["User ID", "Shard by user_id % 4", "User-centric data", "Hot users; cross-shard queries"],
              ["Time", "Shard by month", "Time-series data, logs", "Uneven load (recent months hot)"],
              ["Entity ID", "Shard by order_id", "Order ID is globally unique", "User's orders scattered across shards"],
              ["Geography", "Shard by region", "Latency-sensitive apps", "Cross-region queries"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "The best shard key minimizes cross-shard joins and evenly distributes load. User ID is often a good choice for social applications because most queries are by user.",
          },
        ],
      },
      {
        id: "cs-scale-millions-roundup",
        title: "Case Study Roundup",
        content: [
          {
            type: "text",
            content: "Real-world systems at Google, Amazon, and Netflix face the same scaling challenges, solved with patterns you've learned.",
          },
          {
            type: "table",
            headers: ["Company", "Scale", "Key Patterns", "Notable Solution"],
            rows: [
              ["Google Search", "3.5B searches/day", "BigTable, GFS, MapReduce", "Percolate (continuous search)"],
              ["Amazon DynamoDB", "10M requests/sec", "Consistent hashing, Quorum", "On-demand and provisioned capacity"],
              ["Netflix", "250M subscribers", "Cassandra, Chaos Monkey, Zuul", "Open Connect CDN for video"],
              ["Uber", "100M trips", "Schemaless, Postgres", "Base58 UUIDs for trip IDs"],
              ["YouTube", "500M users, 1B videos", "BigTable, MySQL shards", "Tiered storage (hot/cold)"],
            ],
          },
          {
            type: "bullets",
            items: [
              "Google's approach: Build custom infrastructure (GFS, BigTable, MapReduce) for their specific needs.",
              "Amazon's approach: Make it a service (DynamoDB, S3). Customer pays per request, AWS handles scaling.",
              "Netflix's approach: 'Chaos monkey' kills random servers to ensure fault tolerance. Open-source their tools.",
              "Uber's approach: Schema-less document store for flexible trip data. Postgres with JSONB for structured data.",
            ],
          },
          {
            type: "callout",
            variant: "success",
            content: "The patterns are universal: caching, queuing, sharding, replication, and stateless services. The implementation details differ, but the principles remain constant. Master these patterns, and you can design any system.",
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Design a system for 100M DAU with 5 sessions/day and 20 requests/session. Estimate QPS peak, storage, and bandwidth.",
      answer: "QPS_avg = 100M × 5 × 20 / 86,400 ≈ 116K QPS. QPS_peak ≈ 300K-500K (3-5× average). Storage = 100M users × 1KB user data = 100 GB for user profiles. Messages: 1B/day × 500 bytes × 30 days = 15 TB. Bandwidth = 300K QPS × 10KB avg = 3 GB/s ≈ 24 Gbps.",
      type: "text",
    },
  },
];