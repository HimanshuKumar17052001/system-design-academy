import type { Module } from "@/types/curriculum";
import {
  caseUrlShortenerQuiz,
  caseRateLimiterQuiz,
  caseTwitterQuiz,
  caseWhatsappQuiz,
  caseYoutubeQuiz,
  caseUberQuiz,
  caseAmazonQuiz,
  caseSearchQuiz,
} from "./quizzes/phase6-quizzes";

export const phase6Modules: Module[] = [
  {
    id: "case-url-shortener",
    number: 36,
    category: "real-world-systems",
    title: "Design URL Shortener",
    subtitle: "Base62 encoding, key-value store, 301 vs 302 redirects, analytics, and scaling.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Link",
    prerequisites: ["dist-rate-limit"],
    lessons: [
      {
        id: "l36-requirements",
        title: "Requirements & Estimates",
        content: [
          {
            type: "text",
            content: "Before designing, clarify requirements and estimate scale.",
          },
          {
            type: "bullets",
            items: [
              "Functional: Shorten a long URL to a short URL. Redirect short URL to original. Optional: custom alias, analytics (click count).",
              "Non-functional: 100M new URLs/month, 10B redirects/month, read:write ratio = 100:1.",
              "Estimates: 100M URLs/month = ~40 URLs/second write. 10B redirects/month = ~4000 reads/second. Peak = 5× average = 20K writes/s, 200K reads/s.",
              "Storage: 100M URLs/month × 500 bytes = 50 GB/month. 5-year retention = 3 TB.",
            ],
          },
        ],
      },
      {
        id: "l36-design",
        title: "High-Level Design",
        content: [
          {
            type: "text",
            content: "The core is a key-value mapping: short_code → long_url. Reads are 100× more frequent than writes.",
          },
          {
            type: "bullets",
            items: [
              "Short code generation: Base62 encode of auto-increment ID (7 chars for 3.5 trillion URLs). Or MD5 hash + collision check. Or pre-generated random keys.",
              "Write path: API receives long URL → generates short code → stores in database → returns short URL.",
              "Read path: API receives short code → lookup in cache (Redis) → if miss, lookup in database → return 301/302 redirect.",
              "Analytics: Async write to Kafka on each redirect. Consumer aggregates to OLAP (ClickHouse, BigQuery).",
            ],
          },
          {
            type: "table",
            headers: ["Redirect Code", "Behavior", "Caching", "Analytics"],
            rows: [
              ["301 (Permanent)", "Browser caches forever", "Browser + CDN cache", "May not hit server again"],
              ["302 (Temporary)", "Browser does not cache", "Only CDN/cache layer", "Every redirect hits server/analytics"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Use 301 for static short URLs (saves server load, but analytics undercounts). Use 302 if you need accurate click tracking or may change the target URL.",
          },
        ],
      },
    ],
    lab: {
      id: "url-shortener-lab",
      title: "URL Shortener Design Challenge",
      kind: "case-study-walkthrough",
      objective: "Design the complete architecture for a URL shortener handling 10B redirects/month.",
      hint: "Start with the read path: CDN → Load Balancer → Cache → Database. Consider 301 vs 302 for your use case. Don't forget analytics.",
    },
    quiz: caseUrlShortenerQuiz,
    checkpoint: {
      prompt: "Your URL shortener uses Base62(auto-increment). At 10M URLs/day, how many characters does the short code need? What is the risk of sequential auto-increment IDs?",
      answer: "Base62: 62^5 = 916M, 62^6 = 56.8B. At 10M/day = 3.65B/year. 6 characters handle ~15 years. Risk of sequential IDs: Predictable short codes (abc123, abc124) allow competitors to scrape all URLs by enumerating IDs. Attackers can discover private links. Fix: Use a random key generator or scramble the auto-increment ID with a reversible permutation (e.g., Knuth's multiplicative hashing) before Base62 encoding.",
      type: "text",
    },
  },
  {
    id: "case-rate-limiter",
    number: 37,
    category: "real-world-systems",
    title: "Design Rate Limiter",
    subtitle: "Token bucket, sliding window, and distributed rate limiting at scale.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Gauge",
    prerequisites: ["case-url-shortener"],
    lessons: [
      {
        id: "l37-design",
        title: "Rate Limiter Design",
        content: [
          {
            type: "text",
            content: "A rate limiter controls the rate of requests accepted by an API. It is typically placed at the API Gateway or load balancer.",
          },
          {
            type: "bullets",
            items: [
              "Where to place: API Gateway (protects all APIs), per-service middleware (fine-grained), or client-side (unreliable, easily bypassed).",
              "Key scope: Per-IP (simple, but shared NAT affects accuracy), per-user (requires auth), per-API-key (best for third-party APIs).",
              "Algorithm choice: Token bucket for burst tolerance, sliding window for accuracy, fixed window for simplicity.",
              "Distributed: Redis with Lua scripts for atomic INCR + EXPIRE. For massive scale, use a local cache + global sync with relaxed consistency.",
              "Response: HTTP 429 Too Many Requests with Retry-After header.",
            ],
          },
        ],
      },
    ],
    quiz: caseRateLimiterQuiz,
    checkpoint: {
      prompt: "Design a rate limiter that allows 100 requests/minute per user with burst capacity of 20 requests. It must work across 10 API servers. How do you handle the race condition when two servers check Redis simultaneously?",
      answer: "Use a token bucket in Redis with a Lua script for atomic operations: 1) Get current tokens and last refill time. 2) Calculate tokens to add based on elapsed time. 3) If tokens >= 1, decrement and return ALLOWED. 4) Else return DENIED. The Lua script executes atomically on the Redis server, eliminating race conditions. For 10 servers, all use the same Redis key (rate_limit:{user_id}). Use Redis Cluster with hash tags ({user_id}:tokens) to ensure the key lands on one shard. Alternatively, use Redis Cell (a Redis module) or a centralized rate limiting service.",
      type: "text",
    },
  },
  {
    id: "case-twitter",
    number: 38,
    category: "real-world-systems",
    title: "Design Twitter / News Feed",
    subtitle: "Fan-out on write vs read, timeline generation, and the celebrity problem.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "Twitter",
    prerequisites: ["case-rate-limiter"],
    lessons: [
      {
        id: "l38-fanout",
        title: "Fan-Out Strategies",
        content: [
          {
            type: "text",
            content: "The core challenge of a social feed is distributing posts to followers. There are two primary strategies, each with different trade-offs.",
          },
          {
            type: "table",
            headers: ["Strategy", "How it works", "Pros", "Cons"],
            rows: [
              ["Fan-out on write (Push)", "When user posts, push to all followers' feeds immediately", "Fast read (pre-computed)", "Expensive for celebrities (millions of writes)"],
              ["Fan-out on read (Pull)", "Compute feed at read time by merging followees' posts", "Cheap write", "Slow read (merge + sort)"],
              ["Hybrid", "Push for normal users, pull for celebrities", "Best of both", "Complexity"],
            ],
          },
          {
            type: "callout",
            variant: "info",
            content: "Twitter uses a hybrid approach: normal users (< few thousand followers) use fan-out on write (pre-compute into Redis timelines). Celebrities use fan-out on read (merge their posts into followers' feeds at read time).",
          },
        ],
      },
      {
        id: "l38-timeline",
        title: "Timeline Generation",
        content: [
          {
            type: "text",
            content: "For fan-out on read, the timeline is generated by merging and sorting posts from all followed users. Efficient merging uses a min-heap (priority queue).",
          },
          {
            type: "bullets",
            items: [
              "Each user has a sorted list of their recent posts (e.g., last 1000).",
              "To generate a feed: Take the most recent post from each followee, push into a min-heap ordered by timestamp.",
              "Pop the oldest, push the next from that followee. Repeat for the desired feed size (e.g., 50 posts).",
              "Complexity: O(K log K) where K is number of followees. With K=1000, this is fast enough.",
              "Optimization: Cache the merged result for 1-5 seconds (micro-caching) to avoid recomputation.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "twitter-lab",
      title: "Twitter / News Feed Design Challenge",
      kind: "case-study-walkthrough",
      objective: "Design the complete architecture for a Twitter-like news feed handling 500M DAU.",
      hint: "Think about the fan-out problem. Push for normal users, pull for celebrities. Use a message queue to decouple writes.",
    },
    quiz: caseTwitterQuiz,
    checkpoint: {
      prompt: "A celebrity with 50M followers posts a tweet. Using fan-out on write, how long would it take to propagate to all followers if each Redis write takes 1ms? What is the alternative?",
      answer: "50M followers × 1ms = 50,000 seconds = ~13.9 hours. This is unacceptable. Alternative: Hybrid approach. For celebrities, use fan-out on read: store the celebrity's tweet in their own timeline. When a follower reads their feed, merge the celebrity's recent tweets into the pre-computed timeline from normal users. The merge uses a min-heap: O(K log K) where K is the number of celebrities the user follows (typically small). This shifts the cost from write time (50M writes) to read time (one merge per follower read).",
      type: "text",
    },
  },
  {
    id: "case-whatsapp",
    number: 39,
    category: "real-world-systems",
    title: "Design WhatsApp",
    subtitle: "WebSockets, message delivery guarantees, presence, and end-to-end encryption.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "MessageCircle",
    prerequisites: ["case-twitter"],
    lessons: [
      {
        id: "l39-messaging",
        title: "Real-Time Messaging Architecture",
        content: [
          {
            type: "text",
            content: "A chat system requires low-latency bidirectional communication, message persistence, and delivery guarantees.",
          },
          {
            type: "bullets",
            items: [
              "Connection: WebSocket for bidirectional real-time communication. Fallback to long-polling for older clients.",
              "Message flow: Client → WebSocket server → Message queue (Kafka) → Recipient's WebSocket server → Recipient client.",
              "Message storage: Write to database (Cassandra for high write throughput) and cache recent messages in Redis.",
              "Delivery guarantees: At-least-once with idempotency keys. Messages have unique IDs; deduplicate on client.",
              "Offline handling: Store undelivered messages. Push notification via FCM/APNS when user comes online.",
              "Presence: Last-seen timestamp stored in Redis with TTL. Heartbeat every 30 seconds refreshes TTL.",
            ],
          },
        ],
      },
      {
        id: "l39-encryption",
        title: "End-to-End Encryption",
        content: [
          {
            type: "text",
            content: "End-to-end encryption (E2EE) ensures that only the sender and recipient can read messages. The server cannot decrypt content.",
          },
          {
            type: "bullets",
            items: [
              "Key exchange: Diffie-Hellman or X3DH (Signal Protocol) to establish shared secret.",
              "Double Ratchet: Each message uses a new encryption key. Forward secrecy: compromise of current key does not reveal past messages.",
              "Server role: Stores encrypted blobs. Cannot read content. Only routes messages and handles group management metadata.",
              "Group chats: Sender encrypts with each recipient's public key, or uses sender keys for efficiency (Signal Protocol).",
            ],
          },
        ],
      },
    ],
    quiz: caseWhatsappQuiz,
    checkpoint: {
      prompt: "In a WhatsApp group of 1000 members, a user sends a message. How many database writes are needed? How does the system ensure all 1000 members receive it within 1 second?",
      answer: "1) Database writes: 1 write for the message blob (encrypted). 1000 writes to the delivery status table (one per recipient) or use a single row with a bitmap/JSON array of 1000 statuses. Better: Write to a fan-out table with recipient_id, message_id, status columns. Batch insert 1000 rows. 2) Delivery: The message is published to Kafka topic 'group:{group_id}'. 1000 WebSocket servers (one per active user) consume the message from Kafka and push to their connected clients. With 1000 consumers in one consumer group, each gets one partition. Parallel processing ensures <1s delivery. Offline users: message stays in Kafka until they reconnect or TTL expires. Push notification sent immediately via FCM/APNS.",
      type: "text",
    },
  },
  {
    id: "case-youtube",
    number: 40,
    category: "real-world-systems",
    title: "Design YouTube",
    subtitle: "Video upload pipeline, transcoding, CDN delivery, and recommendation system.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "Play",
    prerequisites: ["case-whatsapp"],
    lessons: [
      {
        id: "l40-upload",
        title: "Video Upload & Processing Pipeline",
        content: [
          {
            type: "text",
            content: "Uploading a video triggers a complex pipeline of storage, transcoding, and distribution.",
          },
          {
            type: "bullets",
            items: [
              "Upload: Client uploads to a resumable upload endpoint (supports retry on network failure). Chunked upload for large files.",
              "Storage: Raw video stored in object storage (S3, GCS) in the 'uploads' bucket.",
              "Transcoding: Message enqueued (Kafka/SQS). Worker nodes (GPU instances) transcode to multiple formats: 360p, 480p, 720p, 1080p, 4K, plus adaptive bitrate (DASH/HLS).",
              "Thumbnail generation: Extract frames at 25%, 50%, 75% of video. ML model selects the best thumbnail.",
              "Metadata extraction: Audio transcription (speech-to-text), object detection, content moderation (AI + human review).",
              "CDN distribution: Transcoded files pushed to CDN edge locations. Manifest files (M3U8 for HLS) list available qualities.",
            ],
          },
        ],
      },
      {
        id: "l40-delivery",
        title: "Video Delivery & Playback",
        content: [
          {
            type: "text",
            content: "Video delivery must balance quality, latency, and bandwidth. Adaptive bitrate streaming is the standard.",
          },
          {
            type: "bullets",
            items: [
              "Adaptive Bitrate (ABR): Player monitors network speed and switches between quality levels seamlessly.",
              "CDN: Video segments cached at edge POPs. Popular videos (trending) have very high cache hit rates.",
              "Origin shield: Reduces origin load when multiple edge POPs request the same uncached video.",
              "P2P delivery: Some platforms (e.g., Bilibili) use peer-to-peer to offload CDN for viral videos.",
              "DRM: Widevine (Chrome/Android), FairPlay (Apple), PlayReady (Microsoft) for premium content protection.",
            ],
          },
        ],
      },
    ],
    quiz: caseYoutubeQuiz,
    checkpoint: {
      prompt: "A user uploads a 4GB 4K video. The transcoding queue has 1000 videos ahead. How do you ensure the user's video is processed quickly? What if the user's internet disconnects at 90% upload?",
      answer: "1) Priority queue: Use multiple Kafka topics/queues by priority. New uploads from premium users or viral-potential content (detected by ML) go to the high-priority queue. Standard uploads go to the normal queue. 2) Parallel transcoding: Split the video into chunks (e.g., 1-minute segments) and transcode each chunk independently on different workers. Stitch together at the end. Reduces wall-clock time from hours to minutes. 3) Resumable upload: Store chunks as they arrive. If connection drops at 90%, resume from the last confirmed chunk (HTTP Range headers or custom protocol). Client retries failed chunks. Server assembles chunks on completion.",
      type: "text",
    },
  },
  {
    id: "case-uber",
    number: 41,
    category: "real-world-systems",
    title: "Design Uber / Ride Sharing",
    subtitle: "Geo-spatial indexing, dispatch algorithm, ETA calculation, and real-time tracking.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "MapPin",
    prerequisites: ["case-youtube"],
    lessons: [
      {
        id: "l41-dispatch",
        title: "Dispatch System",
        content: [
          {
            type: "text",
            content: "The core challenge is matching a rider with the nearest available driver in real-time.",
          },
          {
            type: "bullets",
            items: [
              "Driver location: Drivers report GPS coordinates every 5 seconds via WebSocket. Stored in Redis Geo (geospatial index) with TTL.",
              "Geo-spatial indexing: Redis Geo, Elasticsearch geo queries, or custom quadtree/S2 geometry cells. Divide the city into cells; index drivers by cell.",
              "Dispatch algorithm: 1) Find all available drivers in a 2km radius. 2) Filter by driver preferences, ratings, vehicle type. 3) Score candidates by ETA, distance, driver acceptance rate. 4) Send request to top 3 drivers simultaneously (broadcast). 5) First to accept gets the ride.",
              "ETA calculation: Use historical traffic data + real-time conditions. ML model predicts travel time between two points.",
            ],
          },
        ],
      },
      {
        id: "l41-realtime",
    title: "Real-Time Tracking",
        content: [
          {
            type: "text",
            content: "Both rider and driver need to see each other's location updating in real-time during the trip.",
          },
          {
            type: "bullets",
            items: [
              "Driver app: Sends GPS coordinates every 2-5 seconds via WebSocket to a location service.",
              "Location service: Updates driver's position in Redis (for dispatch) and publishes to Kafka topic 'driver_location:{driver_id}'.",
              "Rider app: Subscribes to the Kafka topic (via WebSocket bridge) to receive location updates.",
              "Map matching: Snap raw GPS coordinates to road network for accurate route display.",
              "Surge pricing: Dynamic pricing based on supply (available drivers) and demand (ride requests) in a geo-fenced area.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "uber-lab",
      title: "Uber / Ride Sharing Design Challenge",
      kind: "case-study-walkthrough",
      objective: "Design the complete architecture for a ride-sharing system handling 1M concurrent drivers and 10M rides/day.",
      hint: "Start with geo-spatial indexing. Redis Geo or S2 cells for driver locations. Broadcast dispatch to top 3 drivers. Don't forget surge pricing and ETA prediction.",
    },
    quiz: caseUberQuiz,
    checkpoint: {
      prompt: "During New Year's Eve, demand spikes 10× in a city center but driver supply increases only 2×. The dispatch system times out trying to find drivers. How do you handle this?",
      answer: "1) Surge pricing: Increase fares in high-demand areas to balance supply/demand. Higher prices attract more drivers and reduce frivolous requests. 2) Expand search radius: Gradually increase search radius from 2km to 5km to 10km if no driver accepts. 3) Waitlist: If no driver is available within a reasonable time, add rider to a waitlist and notify when a driver becomes available. 4) Driver incentives: Push notifications to nearby drivers offering bonuses for entering the surge zone. 5) Predictive pre-positioning: Use ML to predict hotspots 30 minutes ahead and suggest drivers position themselves there. 6) Shared rides: Encourage UberPool to increase effective supply by matching multiple riders with one driver.",
      type: "text",
    },
  },
  {
    id: "case-amazon",
    number: 42,
    category: "real-world-systems",
    title: "Design E-Commerce / Amazon",
    subtitle: "Catalog, inventory, checkout, payment, search, and recommendation.",
    difficulty: "Advanced",
    estimatedHours: 3,
    icon: "ShoppingCart",
    prerequisites: ["case-uber"],
    lessons: [
      {
        id: "l42-catalog",
        title: "Product Catalog & Search",
        content: [
          {
            type: "text",
            content: "The product catalog is read-heavy and must support complex faceted search. The checkout path is write-heavy and requires strong consistency.",
          },
          {
            type: "bullets",
            items: [
              "Catalog storage: Write to relational DB (PostgreSQL). Read from denormalized Elasticsearch index updated via CDC from the primary DB.",
              "Search: Elasticsearch or Solr for full-text search + faceting (brand, price, rating, category).",
              "Inventory: Critical for consistency. Use database row-level locking or atomic Redis decrement for flash sales.",
              "Checkout: Saga pattern. Step 1: Reserve inventory. Step 2: Process payment. Step 3: Create shipment. Compensate on failure.",
              "Payment: Idempotency keys prevent double-charging on retry. Store payment state machine (pending → authorized → captured → refunded).",
            ],
          },
        ],
      },
      {
        id: "l42-recommendation",
        title: "Recommendations",
        content: [
          {
            type: "text",
            content: "Recommendation systems drive significant revenue. They combine real-time and batch processing.",
          },
          {
            type: "bullets",
            items: [
              "Collaborative filtering: 'Users who bought X also bought Y.' Precomputed offline using Spark/MapReduce. Results stored in Redis for fast lookup.",
              "Content-based: Recommend similar items based on attributes (brand, category, price range).",
              "Real-time: Session-based recommendations based on current browsing behavior (e.g., 'You viewed X, here are related items').",
              "A/B testing: Serve different recommendation algorithms to user segments and measure conversion.",
            ],
          },
        ],
      },
    ],
    quiz: caseAmazonQuiz,
    checkpoint: {
      prompt: "During a flash sale, 100K users try to buy 1000 units of a limited item simultaneously. How do you prevent overselling and ensure fairness?",
      answer: "1) Inventory: Use Redis atomic DECR on a counter. If counter > 0, allow purchase. If 0, return sold out immediately. Redis single-threaded execution prevents race conditions. 2) Queue: Instead of immediate purchase, users enter a purchase queue. Process FIFO or lottery. This prevents the thundering herd from hitting the database. 3) Pre-reservation: Allow users to 'pre-order' 24 hours before, collecting payment info. At sale time, only process pre-orders first. 4) Idempotency: Each purchase attempt uses an idempotency key. If user retries, the system returns the same result (success or failure) without double-charging. 5) CAP choice: Accept CP behavior during the flash sale window (sacrifice availability for correctness). Show 'processing' state rather than 'sold out' while inventory is being checked.",
      type: "text",
    },
  },
  {
    id: "case-search",
    number: 43,
    category: "real-world-systems",
    title: "Design Search Autocomplete",
    subtitle: "Trie data structure, top-k frequent queries, and sharding suggestions.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Search",
    prerequisites: ["case-amazon"],
    lessons: [
      {
        id: "l43-trie",
        title: "Trie-Based Autocomplete",
        content: [
          {
            type: "text",
            content: "Autocomplete suggests completions as the user types. A trie (prefix tree) is the classic data structure for this.",
          },
          {
            type: "bullets",
            items: [
              "Trie structure: Each node represents a character. Paths from root to leaf form complete queries.",
              "Top-k at each node: Store the k most frequent completions at each trie node. This enables O(L) lookup where L is prefix length.",
              "Build: Process query logs hourly. Update trie with frequency counts. For large datasets, use a compressed trie (radix tree / patricia trie).",
              "Storage: The trie can be stored in memory (Redis) for sub-millisecond reads. For massive scale (billions of queries), shard by prefix prefix.",
            ],
          },
        ],
      },
      {
        id: "l43-ranking",
        title: "Ranking & Personalization",
        content: [
          {
            type: "text",
            content: "Not all suggestions are equal. Ranking considers frequency, recency, user history, and business rules.",
          },
          {
            type: "bullets",
            items: [
              "Frequency: Most popular completions globally (e.g., 'weather' for 'we').",
              "Recency: Trending queries (e.g., 'world cup 2026' during the event).",
              "Personalization: User's own search history. Requires per-user trie or filtering global trie by user profile.",
              "Business rules: Promote sponsored suggestions. Deprioritize offensive or low-revenue queries.",
              "A/B test: Test ranking algorithms by measuring suggestion acceptance rate (user clicks a suggestion vs types full query).",
            ],
          },
        ],
      },
    ],
    quiz: caseSearchQuiz,
    checkpoint: {
      prompt: "You have 1 billion historical search queries. The trie for all queries requires 50GB of memory. How do you shard this across a cluster while maintaining O(prefix_length) lookup time?",
      answer: "Shard by first 2 characters (e.g., 'ab', 'ac', 'ad'). This creates ~1000 shards (36^2 for alphanumeric). Each shard holds a trie for queries starting with those characters. A lookup for 'weather' goes to the 'we' shard, then traverses the trie for 'ather'. This distributes memory evenly if the first 2 characters are roughly uniformly distributed (English alphabet is close enough). For hot prefixes like 'yo' (YouTube), use consistent hashing within the shard to further distribute. Cache the top-10 suggestions for each prefix at the CDN edge to serve without hitting the backend.",
      type: "text",
    },
  },
];
