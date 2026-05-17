import type { QuizDefinition } from "@/types/curriculum";

export const caseUrlShortenerQuiz: QuizDefinition = {
  id: "case-url-shortener-quiz",
  title: "Design URL Shortener",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "In a URL shortener, why would you choose an HTTP 302 (Temporary Redirect) over a 301 (Permanent Redirect)?",
      options: [
        "302 redirects are faster to process by browsers",
        "302 allows accurate click analytics and future URL changes; 301 is cached forever by browsers",
        "302 is required for Base62 encoding",
        "301 consumes more server memory than 302",
      ],
      correctIndex: 1,
      explanation:
        "A 301 is cached forever by the browser, so subsequent requests never hit the server again. This saves server load but undercounts analytics and prevents changing the target URL. 302 forces the browser to re-check the server on each click, enabling analytics and mutable targets.",
    },
    {
      type: "multiple-choice",
      question:
        "How many Base62 characters are required to support approximately 3.5 trillion unique short codes?",
      options: [
        "5 (62^5 ≈ 916 million)",
        "6 (62^6 ≈ 56.8 billion)",
        "7 (62^7 ≈ 3.5 trillion)",
        "8 (62^8 ≈ 218 trillion)",
      ],
      correctIndex: 2,
      explanation:
        "62^5 = 916M, 62^6 = 56.8B, 62^7 = 3.5T, 62^8 = 218T. For 3.5 trillion URLs, 7 Base62 characters are sufficient. In practice, you may choose 8 to allow headroom.",
    },
    {
      type: "drag-drop",
      question: "Match each URL shortener component to its primary purpose:",
      pairs: [
        { left: "Base62 encoder", right: "Generate short, unique keys from a numeric ID" },
        { left: "CDN / Edge cache", right: "Serve redirect responses close to users with low latency" },
        { left: "NoSQL DB (e.g., DynamoDB)", right: "Store short_code → long_url mapping at scale" },
        { left: "Kafka / Message queue", right: "Ingest redirect events for async analytics" },
      ],
      explanation:
        "Base62 provides dense, URL-safe keys. CDN reduces read latency. NoSQL handles massive key-value scale. Kafka decouples analytics from the critical redirect path.",
    },
    {
      type: "fill-blank",
      question:
        "A 301 redirect is [blank1] by the browser, which reduces server load but may [blank2] click analytics. A 302 redirect ensures every hit reaches the [blank3] for accurate tracking.",
      blanks: [
        {
          id: "blank1",
          label: "Browser behavior",
          correctAnswers: ["cached", "cached forever", "permanently cached"],
        },
        {
          id: "blank2",
          label: "Analytics impact",
          correctAnswers: ["undercount", "under-count", "miss", "reduce"],
        },
        {
          id: "blank3",
          label: "System layer",
          correctAnswers: ["server", "origin", "backend"],
        },
      ],
      explanation:
        "301 is ideal for static, permanent links where you want to minimize origin load. 302 is preferred when you need per-click analytics or may update the destination URL.",
    },
    {
      type: "ordering",
      question:
        "Order the read path for a URL shortener redirect from user click to destination:",
      items: [
        "Browser requests short URL",
        "CDN / edge cache checks for cached redirect (302 or 301)",
        "Load balancer routes to an app server",
        "Cache (Redis) checks for hot short_code mapping",
        "Database lookup on cache miss; return 302 redirect to long URL",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Edge caches absorb the highest traffic. If missed, the app server checks Redis for sub-millisecond lookups. Database is the source of truth for cold URLs. 302 ensures the analytics event can be captured.",
    },
  ],
};

export const caseRateLimiterQuiz: QuizDefinition = {
  id: "case-rate-limiter-quiz",
  title: "Design Rate Limiter",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which rate limiting algorithm is best suited for allowing traffic bursts while enforcing a sustained average rate?",
      options: [
        "Fixed window counter",
        "Token bucket",
        "Leaky bucket",
        "Sliding window log",
      ],
      correctIndex: 1,
      explanation:
        "Token bucket allows bursts up to bucket capacity while refilling at a steady rate. Fixed window allows burst at boundaries. Leaky bucket smooths output. Sliding window log is accurate but memory-heavy.",
    },
    {
      type: "multiple-choice",
      question:
        "In a distributed rate limiter backed by Redis, why is a Lua script commonly used?",
      options: [
        "Lua scripts are easier to write than application code",
        "Redis executes Lua atomically on the server, eliminating race conditions between multiple API servers",
        "Redis only supports Lua for rate limiting",
        "Lua provides better logging than application logic",
      ],
      correctIndex: 1,
      explanation:
        "When multiple API servers check the same Redis key concurrently, simple GET/SET race conditions allow over-limit requests. A Lua script runs atomically on the Redis server, ensuring consistent token accounting.",
    },
    {
      type: "drag-drop",
      question: "Match each rate limiting algorithm to its defining characteristic:",
      pairs: [
        { left: "Token bucket", right: "Allows bursts up to a bucket capacity; steady refill rate" },
        { left: "Leaky bucket", right: "Smooths output to a fixed rate; queue can overflow" },
        { left: "Sliding window log", right: "Exact count of requests in the window; highest memory" },
        { left: "Fixed window", right: "Simple counter per bucket; allows burst at boundary" },
      ],
      explanation:
        "Token bucket is the most common choice for APIs because it tolerates natural burstiness. Leaky bucket is better for egress shaping. Sliding window log is used where exactness matters more than memory.",
    },
    {
      type: "fill-blank",
      question:
        "For a distributed rate limiter across multiple API servers, a [blank1] store like Redis with [blank2] scripts ensures atomic token checks. The key scope should ideally be per-[blank3] for third-party APIs.",
      blanks: [
        {
          id: "blank1",
          label: "Store type",
          correctAnswers: ["centralized", "shared", "distributed"],
        },
        {
          id: "blank2",
          label: "Script type",
          correctAnswers: ["Lua"],
        },
        {
          id: "blank3",
          label: "Key scope",
          correctAnswers: ["API key", "api key", "api_key", "user"],
        },
      ],
      explanation:
        "Centralized state is required because local per-server counters are bypassed by rotating clients. Lua scripts ensure atomicity. Per-API-key scope is more accurate than per-IP for authenticated third-party usage.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to handle a rate-limited request in a gateway with a token bucket:",
      items: [
        "Request arrives at API Gateway",
        "Gateway checks Redis token bucket for the client's key",
        "Lua atomically calculates tokens to add based on elapsed time",
        "If tokens >= 1, decrement and allow the request",
        "If tokens < 1, return HTTP 429 with Retry-After header",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "The gateway acts as the enforcement point. Redis holds the global state. Lua performs atomic read-calculate-write. Allow or reject with standard HTTP semantics so the client can back off correctly.",
    },
  ],
};

export const caseTwitterQuiz: QuizDefinition = {
  id: "case-twitter-quiz",
  title: "Design Twitter / News Feed",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is the 'celebrity problem' in Twitter's fan-out model?",
      options: [
        "Celebrity accounts are frequently hacked",
        "Fan-out on write becomes prohibitively expensive when a user has millions of followers",
        "Celebrity tweets require manual moderation before showing",
        "Celebrity followers see tweets out of chronological order",
      ],
      correctIndex: 1,
      explanation:
        "If a celebrity with 50M followers posts and the system pushes the tweet to all 50M timelines immediately, that is 50M writes. At 1ms per write, this takes ~14 hours. The celebrity problem requires hybrid fan-out strategies.",
    },
    {
      type: "multiple-choice",
      question:
        "Which data structure is most efficient for generating a merged timeline when using fan-out on read?",
      options: [
        "Hash map",
        "Min-heap (priority queue)",
        "Stack",
        "Bloom filter",
      ],
      correctIndex: 1,
      explanation:
        "With fan-out on read, you must merge K sorted lists (each followee's recent posts) into a single timeline. A min-heap achieves O(K log K) time where K is the number of followees, which is efficient for typical follow counts.",
    },
    {
      type: "drag-drop",
      question: "Match each fan-out strategy to its trade-off:",
      pairs: [
        { left: "Fan-out on write (Push)", right: "Fast reads; expensive for celebrities" },
        { left: "Fan-out on read (Pull)", right: "Cheap writes; slower reads" },
        { left: "Hybrid", right: "Best of both; highest complexity" },
        { left: "Celebrity inbox (Pull)", right: "Merge celebrity posts at read time" },
      ],
      explanation:
        "Twitter's hybrid approach: normal users (< few thousand followers) get fan-out on write into Redis timelines. Celebrities are read-time merged into followers' feeds to avoid massive write amplification.",
    },
    {
      type: "fill-blank",
      question:
        "Twitter uses a [blank1] approach: normal users use fan-out on [blank2] to pre-compute timelines in Redis, while celebrities use fan-out on [blank3] to avoid massive write amplification.",
      blanks: [
        {
          id: "blank1",
          label: "Strategy type",
          correctAnswers: ["hybrid"],
        },
        {
          id: "blank2",
          label: "Normal user mode",
          correctAnswers: ["write", "push"],
        },
        {
          id: "blank3",
          label: "Celebrity mode",
          correctAnswers: ["read", "pull"],
        },
      ],
      explanation:
        "Pre-computing timelines for normal users gives O(1) read performance. For celebrities, shifting the work to read time avoids a write storm that would overwhelm the system.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to generate a user's home timeline using the hybrid fan-out approach:",
      items: [
        "Fetch the pre-computed timeline from Redis for normal followees",
        "Fetch the latest N tweets from each celebrity followee",
        "Merge celebrity tweets into the pre-computed timeline using a min-heap",
        "Return the top K most recent tweets to the client",
        "Cache the merged result for a few seconds (micro-caching) to reduce recomputation",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "The base timeline is already materialized for most followees. Celebrity tweets are fetched and merged on demand. Micro-caching the final result for 1–5 seconds amortizes the merge cost across concurrent readers.",
    },
  ],
};

export const caseWhatsappQuiz: QuizDefinition = {
  id: "case-whatsapp-quiz",
  title: "Design WhatsApp",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Why is WebSocket the preferred transport for a real-time chat system like WhatsApp?",
      options: [
        "It is required by all mobile app stores",
        "It provides full-duplex, low-latency communication over a persistent connection",
        "It is the only protocol that supports encryption",
        "It is simpler than HTTP polling but slower",
      ],
      correctIndex: 1,
      explanation:
        "WebSocket establishes a persistent, bidirectional TCP connection. Unlike HTTP polling, there is no per-message connection setup overhead. This enables real-time delivery with low latency and efficient battery usage on mobile.",
    },
    {
      type: "multiple-choice",
      question:
        "In an end-to-end encrypted (E2EE) chat system, what is the server's role regarding message content?",
      options: [
        "Encrypt and decrypt messages using a server-side master key",
        "Route encrypted blobs between clients without being able to read the plaintext",
        "Store plaintext copies for legal compliance",
        "Generate and distribute shared secrets between all users in the system",
      ],
      correctIndex: 1,
      explanation:
        "In E2EE (e.g., Signal Protocol), the server acts as a dumb router. It stores and forwards encrypted ciphertext. Only the endpoints hold the private keys needed to decrypt. This ensures that a server compromise does not expose message content.",
    },
    {
      type: "drag-drop",
      question: "Match each WhatsApp concept to its implementation mechanism:",
      pairs: [
        { left: "WebSocket", right: "Bidirectional real-time client-server communication" },
        { left: "Kafka / Message queue", right: "Durability and fan-out to recipient servers" },
        { left: "Redis TTL", right: "Presence heartbeat and last-seen timestamp" },
        { left: "Diffie-Hellman / X3DH", right: "Establish shared secret for E2EE session" },
      ],
      explanation:
        "WebSocket enables real-time push. Kafka provides durability and horizontal scaling for message routing. Redis with TTL tracks presence. X3DH (Signal Protocol) establishes initial key agreement for E2EE.",
    },
    {
      type: "fill-blank",
      question:
        "WhatsApp uses the [blank1] Protocol for E2EE, which provides [blank2] secrecy by using a new encryption key for each message. The server stores only [blank3] message blobs and cannot read content.",
      blanks: [
        {
          id: "blank1",
          label: "Protocol name",
          correctAnswers: ["Signal"],
        },
        {
          id: "blank2",
          label: "Security property",
          correctAnswers: ["forward", "perfect forward"],
        },
        {
          id: "blank3",
          label: "Data state",
          correctAnswers: ["encrypted", "cipher"],
        },
      ],
      explanation:
        "The Signal Protocol's Double Ratchet algorithm derives a new key for every message. Forward secrecy means a compromised current key cannot decrypt past messages. The server only sees ciphertext.",
    },
    {
      type: "ordering",
      question:
        "Order the message delivery path from sender to recipient in a large WhatsApp group:",
      items: [
        "Sender client encrypts the message with the group key",
        "Sender WebSocket server publishes to Kafka topic for the group",
        "Recipient WebSocket servers consume from their partitions",
        "Push notification sent via FCM/APNS if recipient is offline",
        "Recipient client decrypts and displays the message",
      ],
      correctOrder: [0, 1, 2, 4, 3],
      explanation:
        "Encrypt first. Publish to Kafka for durability and parallel fan-out. Recipient servers push to connected clients. If offline, the message is stored and a push notification is sent. Client decrypts on receipt.",
    },
  ],
};

export const caseYoutubeQuiz: QuizDefinition = {
  id: "case-youtube-quiz",
  title: "Design YouTube",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is the primary purpose of adaptive bitrate (ABR) streaming in a video platform?",
      options: [
        "To always serve the highest quality regardless of network conditions",
        "To monitor network speed and seamlessly switch between quality levels to avoid buffering",
        "To reduce server storage costs by storing fewer formats",
        "To encrypt video content with DRM",
      ],
      correctIndex: 1,
      explanation:
        "ABR splits a video into segments at multiple resolutions/bitrates. The player monitors available bandwidth and buffer level, then switches up or down in quality seamlessly. This optimizes viewing experience across variable networks.",
    },
    {
      type: "multiple-choice",
      question:
        "Why is a video transcoding pipeline typically split into small chunks processed by multiple workers?",
      options: [
        "To reduce video quality intentionally",
        "To parallelize processing across many workers and reduce wall-clock time",
        "To avoid copyright detection",
        "Because single-threaded transcoding is required by law",
      ],
      correctIndex: 1,
      explanation:
        "A 4K video may take hours to transcode sequentially. By splitting into 1-minute chunks, each chunk is processed independently on a separate worker. Results are stitched together, reducing total processing time from hours to minutes.",
    },
    {
      type: "drag-drop",
      question: "Match each YouTube component to its function in the video pipeline:",
      pairs: [
        { left: "CDN / Edge POP", right: "Deliver cached video segments close to users" },
        { left: "Transcoding worker (GPU)", right: "Convert raw video to multiple resolutions/formats" },
        { left: "Kafka / SQS", right: "Queue encoding jobs for worker consumption" },
        { left: "Object storage (S3/GCS)", right: "Store raw uploads and transcoded output files" },
      ],
      explanation:
        "Object storage is the durable source of truth. Queues decouple upload from processing. Workers parallelize transcoding. CDNs cache and deliver at scale, reducing origin bandwidth.",
    },
    {
      type: "fill-blank",
      question:
        "YouTube uses [blank1] bitrate streaming to adjust video quality based on the user's [blank2]. Transcoded segments are distributed via a [blank3] to reduce origin server load and latency.",
      blanks: [
        {
          id: "blank1",
          label: "Streaming type",
          correctAnswers: ["adaptive"],
        },
        {
          id: "blank2",
          label: "Network metric",
          correctAnswers: ["network speed", "bandwidth", "connection speed", "throughput"],
        },
        {
          id: "blank3",
          label: "Distribution layer",
          correctAnswers: ["CDN", "content delivery network"],
        },
      ],
      explanation:
        "ABR maintains a buffer of segments. If bandwidth drops, the player switches to a lower bitrate segment to avoid rebuffering. CDNs cache segments at edge POPs for fast delivery.",
    },
    {
      type: "ordering",
      question:
        "Order the steps of the YouTube video upload and delivery pipeline:",
      items: [
        "Client uploads raw video to resumable object storage endpoint",
        "Transcoding job enqueued to Kafka/SQS",
        "GPU workers transcode into multiple resolutions (360p to 4K)",
        "Manifest files (M3U8 for HLS) reference available quality levels",
        "CDN edge nodes cache segments and serve them to players via ABR",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Upload first. Queue decouples upload from processing. Workers produce variants. Manifests tell the player which segments are available at each quality. CDN serves from cache.",
    },
  ],
};

export const caseUberQuiz: QuizDefinition = {
  id: "case-uber-quiz",
  title: "Design Uber / Ride Sharing",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which data structure is most commonly used for real-time geo-spatial indexing of available drivers?",
      options: [
        "Binary search tree",
        "Redis Geo, Quadtree, or S2 geometry cells",
        "Linked list",
        "Bloom filter",
      ],
      correctIndex: 1,
      explanation:
        "A quadtree recursively divides 2D space into quadrants. S2 (from Google) projects the sphere onto a cube face and uses a Hilbert curve for spatial indexing. Redis Geo provides built-in geohash-based radius queries. All three support fast nearest-neighbor lookups.",
    },
    {
      type: "multiple-choice",
      question:
        "How does dynamic surge pricing help during demand spikes?",
      options: [
        "It reduces driver pay to cut costs",
        "It attracts more drivers to the high-demand area and discourages low-urgency requests",
        "It bans users from requesting rides",
        "It adds more servers to the dispatch pool",
      ],
      correctIndex: 1,
      explanation:
        "Surge pricing is a market mechanism: higher fares incentivize more drivers to enter the area and reduce frivolous or low-urgency requests. This rebalances supply and demand without requiring more infrastructure.",
    },
    {
      type: "drag-drop",
      question: "Match each Uber system component to its primary purpose:",
      pairs: [
        { left: "Redis Geo / Quadtree", right: "Index driver locations for fast radius search" },
        { left: "Kafka", right: "Stream real-time driver location updates" },
        { left: "ML ETA model", right: "Predict travel time based on traffic and history" },
        { left: "WebSocket", right: "Bidirectional rider-driver location updates" },
      ],
      explanation:
        "Geo indexes find nearby drivers. Kafka publishes location streams to subscribers. ML models predict ETAs. WebSockets push location updates to both rider and driver apps in real time.",
    },
    {
      type: "fill-blank",
      question:
        "Uber's dispatch algorithm finds drivers within a [blank1] radius, scores them by ETA and distance, then sends the request to the top [blank2] drivers [blank3].",
      blanks: [
        {
          id: "blank1",
          label: "Search radius",
          correctAnswers: ["configurable", "2km", "configurable radius", "set"],
        },
        {
          id: "blank2",
          label: "Candidate count",
          correctAnswers: ["3", "three", "few"],
        },
        {
          id: "blank3",
          label: "Dispatch mode",
          correctAnswers: ["simultaneously", "at once", "concurrently", "in parallel"],
        },
      ],
      explanation:
        "Broadcasting to the top N drivers simultaneously reduces wait time. The first driver to accept gets the ride. This is more efficient than serial round-robin, especially during high-demand periods.",
    },
    {
      type: "ordering",
      question:
        "Order the steps from a rider requesting a trip to driver acceptance:",
      items: [
        "Rider app sends request to dispatch service",
        "Dispatch queries geo-spatial index for available drivers in radius",
        "Candidates are filtered by preferences and scored by ETA",
        "Top 3 drivers receive ride request via WebSocket",
        "First driver to accept is assigned; others receive cancellation",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "The dispatch pipeline: receive request → find nearby drivers → rank candidates → broadcast to top N → first-accept wins. The broadcast model minimizes rider wait time and driver idle time.",
    },
  ],
};

export const caseAmazonQuiz: QuizDefinition = {
  id: "case-amazon-quiz",
  title: "Design E-Commerce / Amazon",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "During a flash sale with 1000 limited items and 100K concurrent buyers, how can you prevent overselling most effectively?",
      options: [
        "Use eventual consistency with a relational database",
        "Use Redis with an atomic DECR counter for inventory",
        "Allow overbooking and refund later",
        "Disable the website for 10 minutes",
      ],
      correctIndex: 1,
      explanation:
        "Redis is single-threaded and executes DECR atomically. By decrementing a counter, you get an instant, race-condition-free inventory check. This is faster and more scalable than row-level locking in a relational database for this specific hot-key scenario.",
    },
    {
      type: "multiple-choice",
      question:
        "Which pattern is best suited for an e-commerce checkout flow that spans inventory reservation, payment, and shipment?",
      options: [
        "Two-phase commit (2PC) across all three services",
        "Saga with compensating transactions for each step",
        "A single monolithic database transaction",
        "Fire-and-forget messaging without any compensation",
      ],
      correctIndex: 1,
      explanation:
        "A checkout flow is a long-running distributed transaction. 2PC would block inventory and payment resources and is fragile. A saga orchestrates local transactions in each service and defines compensations (e.g., release inventory, refund payment) if a step fails.",
    },
    {
      type: "drag-drop",
      question: "Match each e-commerce component to its resilience or consistency mechanism:",
      pairs: [
        { left: "Redis counter", right: "Atomic inventory decrement for flash sales" },
        { left: "Saga orchestrator", right: "Manages checkout steps and compensation on failure" },
        { left: "Elasticsearch", right: "Denormalized product catalog search index" },
        { left: "Idempotency key", right: "Prevents double-charging on payment retry" },
      ],
      explanation:
        "Redis handles high-concurrency inventory atomically. Sagas manage multi-step distributed workflows. Elasticsearch powers fast, faceted search. Idempotency keys make retries safe.",
    },
    {
      type: "fill-blank",
      question:
        "During a flash sale, using Redis [blank1] on a counter prevents race conditions because Redis is [blank2]. If payment fails after inventory reservation, a [blank3] transaction releases the stock back to the pool.",
      blanks: [
        {
          id: "blank1",
          label: "Operation",
          correctAnswers: ["DECR", "atomic DECR", "decrement"],
        },
        {
          id: "blank2",
          label: "Execution model",
          correctAnswers: ["single-threaded", "single threaded"],
        },
        {
          id: "blank3",
          label: "Undo mechanism",
          correctAnswers: ["compensating", "compensation", "saga"],
        },
      ],
      explanation:
        "Redis's single-threaded event loop guarantees atomicity for simple operations like DECR. Sagas handle business-level undo logic across services when a downstream failure occurs after a local commit.",
    },
    {
      type: "ordering",
      question:
        "Order the steps of a flash-sale purchase using Redis inventory + saga checkout:",
      items: [
        "User clicks buy; Redis DECR inventory atomically",
        "If inventory > 0, create order and reserve inventory in DB",
        "Saga step: process payment with idempotency key",
        "If payment succeeds, saga step: create shipment",
        "If payment fails, saga compensates by releasing inventory reservation",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Redis provides the fast gate. The DB reservation is the formal saga step. Payment and shipment follow. If any step fails, compensations run in reverse order to maintain eventual consistency.",
    },
  ],
};

export const caseSearchQuiz: QuizDefinition = {
  id: "case-search-quiz",
  title: "Design Search Autocomplete",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "What is the time complexity of looking up completions for a prefix of length L in a standard trie?",
      options: [
        "O(log n)",
        "O(L)",
        "O(n)",
        "O(1)",
      ],
      correctIndex: 1,
      explanation:
        "In a trie, you traverse one node per character of the prefix. The lookup time depends on prefix length L, not the number of stored words n. This makes tries extremely fast for autocomplete.",
    },
    {
      type: "multiple-choice",
      question:
        "How can a large autocomplete trie requiring 50GB of memory be distributed across a cluster while keeping lookups efficient?",
      options: [
        "Shard by the last character of the query",
        "Shard by the first 2 characters into ~1000 shards",
        "Randomly assign prefixes to nodes",
        "You cannot shard tries; they must fit in a single machine's RAM",
      ],
      correctIndex: 1,
      explanation:
        "Sharding by the first 2 characters (e.g., 'ab', 'ac') creates ~1296 alphanumeric shards. A lookup for 'weather' goes to the 'we' shard, then traverses the local trie. This distributes memory evenly for English prefixes.",
    },
    {
      type: "drag-drop",
      question: "Match each search autocomplete concept to its purpose:",
      pairs: [
        { left: "Trie (prefix tree)", right: "Store all possible query prefixes for fast lookup" },
        { left: "Top-k at each node", right: "Store the most frequent completions for a prefix" },
        { left: "Sharding by prefix", right: "Distribute memory across cluster nodes" },
        { left: "CDN edge cache", right: "Serve top suggestions without hitting the backend" },
      ],
      explanation:
        "Tries support O(L) prefix search. Top-k at each node avoids scanning the entire subtree. Sharding by prefix distributes the dataset. CDN caching reduces backend load for the most common prefixes.",
    },
    {
      type: "fill-blank",
      question:
        "A compressed trie is called a [blank1] tree. To handle 1 billion historical queries, you can shard by the first [blank2] characters into roughly [blank3] shards.",
      blanks: [
        {
          id: "blank1",
          label: "Tree type",
          correctAnswers: ["radix", "patricia"],
        },
        {
          id: "blank2",
          label: "Prefix length",
          correctAnswers: ["2", "two"],
        },
        {
          id: "blank3",
          label: "Shard count",
          correctAnswers: ["1000", "1296", "about 1000", "about 1296"],
        },
      ],
      explanation:
        "A radix (or Patricia) trie merges single-child nodes to save space. For 36 alphanumeric characters, 36^2 = 1296 possible 2-character prefixes. Sharding by these prefixes evenly distributes the trie across a cluster.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to build and serve a trie-based autocomplete system at scale:",
      items: [
        "Collect and aggregate query logs hourly",
        "Update trie nodes with frequency counts and top-k suggestions",
        "Compress the trie into a radix tree to save memory",
        "Shard the trie by first 2 characters across the cluster",
        "Cache top-10 suggestions per prefix at CDN edge nodes",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Start with data aggregation. Build/update the trie. Compress to reduce memory. Shard to fit in cluster memory. Edge-cache the hottest prefixes to serve sub-millisecond suggestions globally.",
    },
  ],
};
