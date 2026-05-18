import type { CaseStudyConfig } from "@/types/case-study";
import type { Node, Edge } from "@xyflow/react";

// ------------------------------------------------------------------
// URL Shortener Architecture Nodes
// ------------------------------------------------------------------
const urlShortenerNodes: Node<Record<string, unknown>>[] = [
  { id: "client", type: "presentation", position: { x: 50, y: 50 }, data: { kind: "client", label: "Client" } },
  { id: "cdn", type: "presentation", position: { x: 200, y: 50 }, data: { kind: "cdn", label: "CDN" } },
  { id: "lb", type: "presentation", position: { x: 350, y: 50 }, data: { kind: "load-balancer", label: "Load Balancer" } },
  { id: "api", type: "presentation", position: { x: 500, y: 50 }, data: { kind: "app-server", label: "API Server" } },
  { id: "cache", type: "presentation", position: { x: 400, y: 180 }, data: { kind: "cache", label: "Redis Cache" } },
  { id: "db", type: "presentation", position: { x: 600, y: 180 }, data: { kind: "database", label: "Key-Value DB" } },
  { id: "analytics", type: "presentation", position: { x: 500, y: 310 }, data: { kind: "analytics", label: "Analytics (Kafka + OLAP)" } },
];

const urlShortenerEdges: Edge<Record<string, unknown>>[] = [
  { id: "e1", source: "client", target: "cdn", type: "default" },
  { id: "e2", source: "cdn", target: "lb", type: "default" },
  { id: "e3", source: "lb", target: "api", type: "default" },
  { id: "e4", source: "api", target: "cache", type: "default" },
  { id: "e5", source: "cache", target: "db", type: "default" },
  { id: "e6", source: "api", target: "analytics", type: "default" },
  { id: "e7", source: "client", target: "cdn", type: "default", label: "redirect" },
];

export const urlShortenerConfig: CaseStudyConfig = {
  systemName: "URL Shortener",
  moduleId: "case-url-shortener",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Clarify functional and non-functional requirements before designing.",
      thinkingPrompt:
        "A URL shortener seems simple: input a long URL, get a short one. But at 100M new URLs/month and 10B redirects/month, what hidden requirements emerge? Consider custom aliases, analytics, and expiration policies.",
      designDecision:
        "Functional: shorten URL, redirect by short code, optional custom alias, click analytics (count, referrer, geo), expiration. Non-functional: 100M writes/month (~40/s avg, 200/s peak), 10B reads/month (~4K/s avg, 20K/s peak), read:write = 100:1. Latency: redirect < 10ms (cached), < 50ms (DB). Availability: 99.99%.",
      commonMistakes: [
        {
          title: "Ignoring the read:write ratio",
          explanation:
            "Many candidates treat writes and reads equally. With 100:1 ratio, the design must optimize heavily for reads (cache, CDN) while keeping writes simple.",
        },
        {
          title: "Forgetting analytics",
          explanation:
            "Analytics is often an afterthought but drives business value. It should be async (fire-and-forget to a queue) so it doesn't slow down redirects.",
        },
      ],
      quizQuestions: [
        {
          question: "What is the approximate peak read QPS for 10B redirects/month with a 5x peak multiplier?",
          options: ["4,000", "20,000", "100,000", "1,000,000"],
          correctIndex: 1,
          explanation:
            "10B/month ÷ 30 days ÷ 86,400s ≈ 3,860/s average. 5× peak ≈ 19,300/s, rounded to ~20,000/s.",
        },
        {
          question: "Which requirement is most important given the 100:1 read:write ratio?",
          options: [
            "Optimize write throughput",
            "Optimize read latency and caching",
            "Use a graph database",
            "Implement real-time collaboration",
          ],
          correctIndex: 1,
          explanation:
            "With 100× more reads than writes, the design must aggressively cache redirects and minimize read-path latency.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "Back-of-the-envelope calculations for storage, QPS, and bandwidth.",
      thinkingPrompt:
        "How many characters does a Base62 short code need to handle 100M URLs/month for 5 years? How much storage will the mapping table consume?",
      designDecision:
        "62^5 ≈ 916M, 62^6 ≈ 56.8B. At 10M/day = 3.65B/year, 6 characters handle ~15 years. Short code (6B) + long URL (500B avg) + metadata (100B) = ~600B per record. 100M/month × 600B = 60 GB/month. 5-year retention = 3.6 TB. QPS: write 40/s avg (200/s peak), read 4K/s avg (20K/s peak).",
      commonMistakes: [
        {
          title: "Using 5-character codes for long-term scale",
          explanation:
            "62^5 = 916M is only enough for ~250 days at 100M/month. 6 chars provide 56.8B combinations, enough for years.",
        },
        {
          title: "Not accounting for metadata storage",
          explanation:
            "Storing only the URL mapping ignores user_id, timestamps, analytics flags, and TTL. Add ~100B per record.",
        },
      ],
      quizQuestions: [
        {
          question: "How many Base62 characters are needed to support 3.65 billion unique URLs per year?",
          options: ["5", "6", "7", "8"],
          correctIndex: 1,
          explanation:
            "62^5 = 916M (too small). 62^6 = 56.8B (more than enough). 6 characters is the minimum.",
        },
        {
          question: "At 100M URLs/month with ~600 bytes per record, what is the monthly storage requirement?",
          options: ["~6 GB", "~60 GB", "~600 GB", "~6 TB"],
          correctIndex: 1,
          explanation:
            "100M × 600B = 60,000,000,000B = ~60 GB per month. 5 years ≈ 3.6 TB.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Design the REST API endpoints and choose redirect semantics.",
      thinkingPrompt:
        "What endpoints does the API need? Should redirects use HTTP 301 (permanent) or 302 (temporary)? What are the trade-offs for caching and analytics?",
      designDecision:
        "POST /shorten {longUrl, customAlias?, ttl?} → {shortCode, shortUrl}. GET /{shortCode} → 301 or 302 redirect to long URL. GET /{shortCode}/stats → analytics summary. 301: browser caches forever — reduces server load but undercounts analytics. 302: no browser cache — every redirect hits server, accurate analytics but higher load. Most commercial shorteners use 301 for speed + CDN, with async analytics beacon.",
      commonMistakes: [
        {
          title: "Choosing 302 without considering the 10B redirect scale",
          explanation:
            "With 10B redirects/month, 302 means every single one hits your origin. 301 + CDN can absorb 90%+ of traffic.",
        },
        {
          title: "Forgetting rate limiting on /shorten",
          explanation:
            "Without rate limiting, a malicious user could exhaust your key space by creating millions of URLs.",
        },
      ],
      quizQuestions: [
        {
          question: "Which redirect code causes the browser to cache the mapping indefinitely?",
          options: ["300", "301", "302", "307"],
          correctIndex: 1,
          explanation:
            "HTTP 301 (Moved Permanently) tells browsers to cache the redirect forever. 302 is temporary and not cached by browsers.",
        },
        {
          question: "Why might you still choose 302 over 301 for a URL shortener?",
          options: [
            "It is faster",
            "It allows accurate click tracking",
            "It uses less bandwidth",
            "It is the default browser behavior",
          ],
          correctIndex: 1,
          explanation:
            "302 ensures every redirect hits your server, enabling accurate analytics. 301 may cause undercounting because browsers cache and skip the server.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "Sketch the major components and data flow.",
      thinkingPrompt:
        "Draw the read path and write path. Where does caching fit? How do you handle the massive read traffic?",
      designDecision:
        "Read path (10B/month): Client → CDN (cached 301) → Load Balancer → API Server → Redis Cache → Database (on miss). Write path (100M/month): Client → LB → API Server → Generate short code → Write to DB → Invalidate cache. Analytics: Fire async event to Kafka on each redirect (only if not CDN-cached). Consumer writes to OLAP (ClickHouse/BigQuery).",
      commonMistakes: [
        {
          title: "Omitting the CDN from the read path",
          explanation:
            "Without CDN, even 301 cached in-browser won't help first-time users or users who cleared cache. A CDN edge caches for millions.",
        },
        {
          title: "Writing analytics synchronously",
          explanation:
            "Blocking the redirect to write analytics adds latency. Use an async fire-and-forget message queue.",
        },
      ],
      quizQuestions: [
        {
          question: "In the read path, which component serves the majority of requests at scale?",
          options: ["Database", "Load Balancer", "CDN", "Message Queue"],
          correctIndex: 2,
          explanation:
            "The CDN caches 301 redirects at edge locations, serving the vast majority of requests without ever hitting the origin.",
        },
        {
          question: "What happens on a cache miss for a redirect lookup?",
          options: [
            "Return 404",
            "Query the database and populate the cache",
            "Generate a new short code",
            "Redirect to a fallback URL",
          ],
          correctIndex: 1,
          explanation:
            "On cache miss, the API server queries the database for the mapping, returns the redirect, and writes the result to Redis for future requests.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api", "cache", "db"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5"],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "Short code generation strategies and caching internals.",
      thinkingPrompt:
        "How do you generate short codes? Auto-increment ID + Base62? MD5 hash? Random keys? What are the collision and predictability trade-offs?",
      designDecision:
        "Option A: Auto-increment ID + Base62 — simple, no collisions, but predictable (abc123, abc124). Attackers can enumerate URLs. Option B: MD5(longUrl) + first 6 chars — deterministic, but collisions possible with billions of URLs. Option C: Random 6-char Base62 key — unguessable, but requires collision check on insert. Best practice: random key generator with pre-allocated key pool (like a ticket dispenser) to avoid DB collisions on write. For cache: use Redis with LRU eviction. TTL on short codes if specified.",
      commonMistakes: [
        {
          title: "Using pure auto-increment without permutation",
          explanation:
            "Sequential IDs are trivial to scrape. If you use auto-increment, apply a reversible permutation (e.g., Knuth's multiplicative hashing) before Base62 encoding.",
        },
        {
          title: "Not handling hash collisions in MD5 approach",
          explanation:
            "MD6 of different URLs can produce the same first 6 characters (birthday paradox). You need a collision resolution strategy.",
        },
      ],
      quizQuestions: [
        {
          question: "What is the main risk of using auto-increment IDs for short codes?",
          options: [
            "They are too long",
            "They are predictable and enumerable",
            "They cause database deadlocks",
            "They use too much storage",
          ],
          correctIndex: 1,
          explanation:
            "Auto-increment IDs produce sequential short codes (abc123, abc124), allowing attackers to enumerate all URLs by guessing IDs.",
        },
        {
          question: "Why might you pre-generate random short codes in a pool?",
          options: [
            "To reduce database size",
            "To eliminate write-time collision checks",
            "To improve Base62 encoding speed",
            "To enable custom aliases",
          ],
          correctIndex: 1,
          explanation:
            "Pre-generating a pool of unique random codes means the API server can 'pop' a code instantly without checking the DB for collisions at write time.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api", "cache", "db", "analytics"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6"],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Evaluate the key design trade-offs and justify decisions.",
      thinkingPrompt:
        "If you chose 301 for performance, how do you get accurate click counts? If you chose 302 for analytics, how do you survive 10B redirects? What's the sweet spot?",
      designDecision:
        "301 vs 302: Use 301 as default for public short URLs (CDN absorbs load, browser caches). For campaigns needing accurate analytics, use 302 or a 301 with an async analytics pixel (1×1 transparent image) on the landing page. Read vs write optimization: Heavily optimize reads (CDN + Redis) since they dominate 100:1. Writes can afford slight latency for collision checks or key pool allocation. Analytics accuracy vs system load: Use sampling (1% detailed logging) + aggregated counts for 99% of traffic to balance accuracy and cost.",
      commonMistakes: [
        {
          title: "Picking 301 or 302 universally without context",
          explanation:
            "The right answer depends on the use case. Marketing campaigns need accurate counts (302 or pixel tracking). Social media shares need speed (301).",
        },
        {
          title: "Storing every click in the primary database",
          explanation:
            "Writing 10B click records/month to your main DB will destroy performance. Use an async pipeline to an OLAP store.",
        },
      ],
      quizQuestions: [
        {
          question: "What is a common hybrid approach to get both 301 performance and accurate analytics?",
          options: [
            "Use 302 for all redirects",
            "Use 301 + an async analytics beacon on the landing page",
            "Store every click in Redis",
            "Disable browser caching entirely",
          ],
          correctIndex: 1,
          explanation:
            "301 gives CDN/browser cache benefits. An async analytics beacon (e.g., a JavaScript pixel) on the final page captures visits without slowing redirects.",
        },
        {
          question: "At 10B redirects/month, why shouldn't analytics be written to the primary key-value database?",
          options: [
            "It violates normalization",
            "It would overwhelm the write capacity of the main DB",
            "It makes short codes longer",
            "It prevents custom aliases",
          ],
          correctIndex: 1,
          explanation:
            "The primary database is optimized for fast lookups of shortCode→longUrl. Adding 10B analytics writes would starve it of resources.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api", "cache", "db", "analytics"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7"],
      annotations: [
        { nodeId: "cdn", text: "301 cached at edge — absorbs 90%+ traffic", type: "trade-off" },
        { nodeId: "analytics", text: "Async pipeline avoids blocking redirects", type: "note" },
        { nodeId: "cache", text: "Redis LRU — sub-ms lookups for hot URLs", type: "note" },
      ],
    },
  ],
  architectureNodes: urlShortenerNodes,
  architectureEdges: urlShortenerEdges,
};

// ------------------------------------------------------------------
// Twitter / News Feed Architecture Nodes
// ------------------------------------------------------------------
const twitterNodes: Node<Record<string, unknown>>[] = [
  { id: "client", type: "presentation", position: { x: 50, y: 50 }, data: { kind: "client", label: "Client" } },
  { id: "lb", type: "presentation", position: { x: 200, y: 50 }, data: { kind: "load-balancer", label: "Load Balancer" } },
  { id: "api", type: "presentation", position: { x: 350, y: 50 }, data: { kind: "app-server", label: "API Gateway" } },
  { id: "tweet-service", type: "presentation", position: { x: 250, y: 180 }, data: { kind: "tweet-service", label: "Tweet Service" } },
  { id: "timeline-service", type: "presentation", position: { x: 400, y: 180 }, data: { kind: "timeline-service", label: "Timeline Service" } },
  { id: "graph-service", type: "presentation", position: { x: 550, y: 180 }, data: { kind: "graph-service", label: "Graph Service" } },
  { id: "cache", type: "presentation", position: { x: 350, y: 310 }, data: { kind: "cache", label: "Redis Cache" } },
  { id: "db", type: "presentation", position: { x: 500, y: 310 }, data: { kind: "database", label: "Database (Sharded)" } },
  { id: "mq", type: "presentation", position: { x: 650, y: 310 }, data: { kind: "message-queue", label: "Message Queue" } },
];

const twitterEdges: Edge<Record<string, unknown>>[] = [
  { id: "e1", source: "client", target: "lb", type: "default" },
  { id: "e2", source: "lb", target: "api", type: "default" },
  { id: "e3", source: "api", target: "tweet-service", type: "default" },
  { id: "e4", source: "api", target: "timeline-service", type: "default" },
  { id: "e5", source: "api", target: "graph-service", type: "default" },
  { id: "e6", source: "tweet-service", target: "db", type: "default" },
  { id: "e7", source: "timeline-service", target: "cache", type: "default" },
  { id: "e8", source: "timeline-service", target: "db", type: "default" },
  { id: "e9", source: "graph-service", target: "db", type: "default" },
  { id: "e10", source: "tweet-service", target: "mq", type: "default" },
  { id: "e11", source: "mq", target: "timeline-service", type: "default" },
];

export const twitterConfig: CaseStudyConfig = {
  systemName: "Twitter / News Feed",
  moduleId: "case-twitter",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Clarify what the system must do at 500M DAU scale.",
      thinkingPrompt:
        "Twitter has 500M DAU. Users post tweets, view timelines, follow/unfollow. What are the read and write patterns? Which operations are most frequent?",
      designDecision:
        "Functional: post tweet (text, media, reply, retweet), view home timeline, view user profile/tweets, follow/unfollow, like. Non-functional: 500M DAU, 50% post daily = 250M tweets/day. Average follower count: ~700. Home timeline reads: each DAU reads 5×/day = 2.5B timeline loads/day. Latency: timeline < 200ms, post tweet < 500ms. Availability: 99.99%.",
      commonMistakes: [
        {
          title: "Assuming all users have the same follower count",
          explanation:
            "The celebrity problem (users with millions of followers) breaks naive fan-out. You must design for both normal users and celebrities.",
        },
        {
          title: "Ignoring media storage and CDN",
          explanation:
            "Tweets often contain images/videos. Media must be stored in blob storage and served via CDN, separate from the tweet metadata.",
        },
      ],
      quizQuestions: [
        {
          question: "At 500M DAU with 5 timeline reads per day, how many timeline loads per day?",
          options: ["500M", "1B", "2.5B", "5B"],
          correctIndex: 2,
          explanation:
            "500M DAU × 5 reads/day = 2.5 billion timeline loads per day.",
        },
        {
          question: "What is the 'celebrity problem' in social feed design?",
          options: [
            "Celebrities can't post tweets",
            "A user with millions of followers causes massive write amplification on fan-out",
            "Celebrities need special login",
            "Celebrity accounts are more likely to be hacked",
          ],
          correctIndex: 1,
          explanation:
            "Fan-out on write for a celebrity with 50M followers means 50M database writes per tweet. This is the celebrity problem.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "Calculate QPS, storage, and fan-out costs.",
      thinkingPrompt:
        "How much storage for 250M tweets/day? What is the write amplification if each tweet is fanned out to all followers? How do you handle the celebrity edge case?",
      designDecision:
        "Tweet metadata: ~300B (text, user_id, timestamp, media refs). 250M/day × 300B = 75 GB/day. Media: average 2MB per tweet with media, 10% of tweets have media = 25M media uploads/day = 50 TB/day. Fan-out: normal user (700 followers) = 700 writes/tweet. 250M tweets × 700 = 175B writes/day = 2M writes/s. This is too high. Solution: hybrid fan-out — pre-compute for normal users, pull for celebrities. Timeline storage: user timeline is a list of tweet_ids (8B each). 700 followees × 100 recent tweets = 70KB per timeline in cache.",
      commonMistakes: [
        {
          title: "Computing fan-out for all users equally",
          explanation:
            "Applying 700 followers average to celebrities like @elonmusk (200M followers) produces absurd write numbers. Always handle celebrities separately.",
        },
        {
          title: "Storing full tweet content in every follower timeline",
          explanation:
            "This duplicates data massively. Store only tweet_id in timelines and fetch full tweet content on read (or cache hot tweets).",
        },
      ],
      quizQuestions: [
        {
          question: "If a celebrity with 50M followers posts a tweet, how many writes does pure fan-out on write require?",
          options: ["50", "50,000", "50M", "500M"],
          correctIndex: 2,
          explanation:
            "Fan-out on write pushes the tweet to every follower's timeline. 50M followers = 50 million writes.",
        },
        {
          question: "Why store only tweet_id in timelines rather than full tweet content?",
          options: [
            "To make tweets anonymous",
            "To reduce storage duplication and allow lazy content loading",
            "To prevent editing tweets",
            "To improve search indexing",
          ],
          correctIndex: 1,
          explanation:
            "Storing only IDs prevents duplicating 300B of content per follower. Full tweet content is fetched once and cached globally.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Design REST/GraphQL endpoints for the core operations.",
      thinkingPrompt:
        "What endpoints do clients need? How do you handle pagination for large timelines? Should the API support real-time updates via WebSocket or SSE?",
      designDecision:
        "POST /tweets {text, mediaIds[], replyTo?, quoteTweetId?} → tweet object. GET /timeline/home?cursor=xyz&limit=20 → paginated tweet list (cursor-based, not offset). GET /timeline/user/:userId?cursor=xyz → user's tweets. POST /follow/:userId, DELETE /follow/:userId. POST /like/:tweetId. Real-time: WebSocket or SSE for live tweet push to connected clients. Pagination: cursor-based using tweet_id (snowflake ID contains timestamp), avoids offset skip issues with concurrent writes.",
      commonMistakes: [
        {
          title: "Using offset-based pagination for timelines",
          explanation:
            "Offset pagination breaks when new tweets are inserted while the user is scrolling. Cursor-based (last_seen_tweet_id) is stable.",
        },
        {
          title: "Not versioning the API",
          explanation:
            "Mobile clients may lag behind. API versioning (v1, v2 in path or header) lets you evolve without breaking older apps.",
        },
      ],
      quizQuestions: [
        {
          question: "Why is cursor-based pagination preferred over offset for timelines?",
          options: [
            "It's easier to implement",
            "It remains stable when new items are inserted concurrently",
            "It uses less bandwidth",
            "It doesn't require a database index",
          ],
          correctIndex: 1,
          explanation:
            "With offset pagination, inserting a new tweet shifts all offsets. Cursor-based (last seen ID) is stable against concurrent inserts.",
        },
        {
          question: "What mechanism is best for pushing new tweets to active clients in real-time?",
          options: ["Long polling", "WebSocket / SSE", "Email", "SMS"],
          correctIndex: 1,
          explanation:
            "WebSockets or Server-Sent Events (SSE) provide low-latency bidirectional or unidirectional push for live updates.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "Map services, databases, and caches.",
      thinkingPrompt:
        "How do you separate tweet creation from timeline delivery? What services own which data? Where does caching live?",
      designDecision:
        "Client → LB → API Gateway → routes to: Tweet Service (creates tweets, stores in DB), Timeline Service (materializes home timelines in Redis), Graph Service (follows/unfollows, stores in Graph DB like Neo4j or sharded relational). Tweet Service publishes event to Message Queue (Kafka). Timeline Service consumes events and fans out to follower timelines (for normal users). For celebrities, Timeline Service skips fan-out; their tweets are merged at read time. Cache: Redis clusters for hot timelines and user profiles. DB: Sharded by user_id for tweets, separate shard for graph edges.",
      commonMistakes: [
        {
          title: "Putting all logic in a single monolithic service",
          explanation:
            "At 500M DAU, a monolith can't scale tweet writes and timeline reads independently. Separate services let you scale each axis.",
        },
        {
          title: "Using a single database for tweets and follows",
          explanation:
            "Tweets are write-heavy time-series data. Follows are graph data with different access patterns. Separate storage systems optimize each.",
        },
      ],
      quizQuestions: [
        {
          question: "Which service is responsible for fanning out tweets to follower timelines?",
          options: [
            "Tweet Service",
            "Timeline Service",
            "Graph Service",
            "API Gateway",
          ],
          correctIndex: 1,
          explanation:
            "The Timeline Service consumes tweet creation events and writes to follower timelines (for normal users) or handles read-time merging (for celebrities).",
        },
        {
          question: "Why use a message queue between Tweet Service and Timeline Service?",
          options: [
            "To encrypt tweets",
            "To decouple write and fan-out, absorbing traffic spikes",
            "To validate tweet content",
            "To compress media",
          ],
          correctIndex: 1,
          explanation:
            "A message queue (Kafka) decouples tweet creation from timeline fan-out, allowing the system to absorb viral tweet spikes without dropping writes.",
        },
      ],
      architectureNodeIds: ["client", "lb", "api", "tweet-service", "timeline-service", "graph-service", "db", "cache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "Fan-out on write vs read, the celebrity problem, and timeline merging.",
      thinkingPrompt:
        "At what follower count should you switch from push to pull? How do you merge celebrity tweets into a user's timeline at read time?",
      designDecision:
        "Threshold-based hybrid: users with < 10,000 followers use fan-out on write (push). Users with ≥ 10,000 followers use fan-out on read (pull). Normal user timeline = pre-computed Redis list of tweet_ids. On read: fetch pre-computed list from Redis (fast). Celebrity merge: for each celebrity the user follows, fetch their recent tweets (cached), merge with pre-computed timeline using a min-heap sorted by timestamp. Complexity: O(K log K) where K = number of celebrities followed (typically < 100). This shifts the cost from 50M writes to a fast merge per read.",
      commonMistakes: [
        {
          title: "Using a fixed threshold without testing",
          explanation:
            "The 10K threshold should be tuned based on measured Redis write capacity and read latency. It may vary by region or time of day.",
        },
        {
          title: "Merging celebrity tweets with a simple list concat + sort",
          explanation:
            "Concatenating lists and sorting is O(N log N) where N is total tweets. A min-heap merge is O(K log K) where K is number of celebrity lists.",
        },
      ],
      quizQuestions: [
        {
          question: "What is the time complexity of merging K sorted celebrity tweet lists using a min-heap?",
          options: ["O(N log N)", "O(K log K)", "O(K)", "O(N)"],
          correctIndex: 1,
          explanation:
            "A min-heap merge of K sorted lists is O(K log K) where K is the number of lists (celebrities). Each pop/push is log K.",
        },
        {
          question: "Why is fan-out on read (pull) better for celebrities than push?",
          options: [
            "It's always faster",
            "It avoids millions of writes per tweet, shifting cost to a small merge per read",
            "It prevents users from unfollowing",
            "It uses less memory",
          ],
          correctIndex: 1,
          explanation:
            "For a celebrity with 50M followers, push requires 50M writes. Pull shifts that to a fast O(K log K) merge on each follower read.",
        },
      ],
      architectureNodeIds: ["client", "lb", "api", "tweet-service", "timeline-service", "graph-service", "db", "cache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Push vs pull, eventual consistency, and timeline staleness.",
      thinkingPrompt:
        "If a user unfollows someone, how quickly should their timeline reflect it? What consistency level is acceptable for social feeds?",
      designDecision:
        "Push vs Pull: Push gives fast reads (< 10ms) but expensive writes and complex consistency. Pull gives cheap writes but slower reads (50-200ms). Hybrid gives the best of both at the cost of complexity. Consistency: Eventual consistency is acceptable for timelines. A user unfollowing someone may see their tweets for a few seconds — acceptable UX. Staleness: Cache timelines for 1-5 seconds (micro-caching) to reduce DB load. For celebrities, cache their recent tweets for 10-30 seconds. Strong consistency is only needed for likes, follows, and direct messages.",
      commonMistakes: [
        {
          title: "Requiring strong consistency for home timelines",
          explanation:
            "Strong consistency across a distributed social graph is extremely expensive and unnecessary. Users tolerate slight staleness.",
        },
        {
          title: "Not handling the unfollow race condition",
          explanation:
            "When a user unfollows, in-flight fan-out events may still write to their timeline. Use a follow-check at read time or TTL on timeline entries.",
        },
      ],
      quizQuestions: [
        {
          question: "Why is eventual consistency acceptable for Twitter timelines?",
          options: [
            "Users don't care about tweets at all",
            "Slight staleness (seconds) is imperceptible and reduces system complexity massively",
            "It is required by law",
            "Databases can't do strong consistency",
          ],
          correctIndex: 1,
          explanation:
            "A few seconds of staleness in a social feed is imperceptible to users and allows massive scalability gains through caching and async processing.",
        },
        {
          question: "What consistency level is appropriate for a 'follow' action?",
          options: [
            "Eventual consistency",
            "Strong consistency",
            "None",
            "Causal consistency",
          ],
          correctIndex: 1,
          explanation:
            "A follow/unfollow action should be strongly consistent so the user immediately sees the effect and duplicate follows are prevented.",
        },
      ],
      architectureNodeIds: ["client", "lb", "api", "tweet-service", "timeline-service", "graph-service", "db", "cache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
      annotations: [
        { nodeId: "timeline-service", text: "Hybrid: push normal, pull celebrities", type: "trade-off" },
        { nodeId: "cache", text: "Micro-cache timelines 1-5s for read speed", type: "note" },
        { nodeId: "mq", text: "Absorbs viral tweet spikes without dropping", type: "note" },
      ],
    },
  ],
  architectureNodes: twitterNodes,
  architectureEdges: twitterEdges,
};

// ------------------------------------------------------------------
// Uber / Ride Sharing Architecture Nodes
// ------------------------------------------------------------------
const uberNodes: Node<Record<string, unknown>>[] = [
  { id: "client", type: "presentation", position: { x: 50, y: 50 }, data: { kind: "client", label: "Rider App" } },
  { id: "gateway", type: "presentation", position: { x: 200, y: 50 }, data: { kind: "api-gateway", label: "API Gateway" } },
  { id: "dispatch", type: "presentation", position: { x: 350, y: 50 }, data: { kind: "dispatch", label: "Dispatch Service" } },
  { id: "driver-app", type: "presentation", position: { x: 50, y: 180 }, data: { kind: "client", label: "Driver App" } },
  { id: "geo-index", type: "presentation", position: { x: 200, y: 180 }, data: { kind: "geo-index", label: "Geo Index (Redis Geo)" } },
  { id: "driver-service", type: "presentation", position: { x: 350, y: 180 }, data: { kind: "app-server", label: "Driver Service" } },
  { id: "payment", type: "presentation", position: { x: 500, y: 180 }, data: { kind: "app-server", label: "Payment Service" } },
  { id: "cache", type: "presentation", position: { x: 200, y: 310 }, data: { kind: "cache", label: "Redis Cache" } },
  { id: "db", type: "presentation", position: { x: 350, y: 310 }, data: { kind: "database", label: "Database" } },
  { id: "mq", type: "presentation", position: { x: 500, y: 310 }, data: { kind: "message-queue", label: "Message Queue" } },
];

const uberEdges: Edge<Record<string, unknown>>[] = [
  { id: "e1", source: "client", target: "gateway", type: "default" },
  { id: "e2", source: "gateway", target: "dispatch", type: "default" },
  { id: "e3", source: "dispatch", target: "geo-index", type: "default" },
  { id: "e4", source: "dispatch", target: "driver-service", type: "default" },
  { id: "e5", source: "driver-app", target: "gateway", type: "default" },
  { id: "e6", source: "driver-service", target: "db", type: "default" },
  { id: "e7", source: "dispatch", target: "payment", type: "default" },
  { id: "e8", source: "geo-index", target: "cache", type: "default" },
  { id: "e9", source: "driver-service", target: "mq", type: "default" },
  { id: "e10", source: "client", target: "gateway", type: "default", label: "location" },
];

export const uberConfig: CaseStudyConfig = {
  systemName: "Uber / Ride Sharing",
  moduleId: "case-uber",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Real-time matching, ETA, tracking, and surge pricing.",
      thinkingPrompt:
        "A rider opens the app and sees nearby drivers with ETAs. They request a ride, get matched, and track the driver in real-time. What are the latency and consistency requirements?",
      designDecision:
        "Functional: request ride, match with nearest driver, real-time driver location tracking, ETA prediction, surge pricing, payment, trip history, ratings. Non-functional: 1M drivers online, 10M rides/day. Driver location updates: 1M drivers × every 5s = 200K updates/s. Dispatch QPS: 10M requests/day ÷ 86,400 ≈ 115/s, peak 5× = 575/s. ETA latency: < 2s. Location freshness: < 10s. Availability: 99.99% during peak hours.",
      commonMistakes: [
        {
          title: "Treating driver location as a standard database query",
          explanation:
            "200K location updates/second to a relational DB will crush it. Geo-spatial indexes (Redis Geo, S2, quadtree) are purpose-built for this.",
        },
        {
          title: "Ignoring peak hour surge behavior",
          explanation:
            "Surge pricing is not just a multiplier. It affects demand elasticity and driver supply. The system must update prices in real-time per geo-fenced area.",
        },
      ],
      quizQuestions: [
        {
          question: "At 1M drivers reporting location every 5 seconds, how many location updates per second?",
          options: ["50,000", "200,000", "1,000,000", "5,000,000"],
          correctIndex: 1,
          explanation:
            "1,000,000 drivers ÷ 5 seconds = 200,000 location updates per second.",
        },
        {
          question: "Which is the most critical non-functional requirement for the dispatch system?",
          options: [
            "Strong consistency across all cities",
            "Low latency matching (< 2s)",
            "Permanent storage of all driver locations",
            "Exact count of drivers globally",
          ],
          correctIndex: 1,
          explanation:
            "Riders expect near-instant matching. Latency is the primary UX metric for the dispatch system.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "QPS, storage, and bandwidth for a global ride-sharing system.",
      thinkingPrompt:
        "How much storage for trip history? What bandwidth do location updates consume? How many dispatch servers do you need?",
      designDecision:
        "Location update: ~50B (driver_id, lat, lng, timestamp, speed, heading). 200K/s × 50B = 10 MB/s ingress. Most locations are ephemeral — keep last 24h in Redis Geo, archive older to S3. Trip history: 10M trips/day × 2KB metadata = 20 GB/day. 5-year retention = 36 TB. Dispatch servers: 575 peak dispatch QPS, each server handles ~1K QPS = 1 server for dispatch logic + redundancy. Driver location ingestion: 200K/s, each server ~50K WebSocket connections = 4 location ingestion servers + redundancy.",
      commonMistakes: [
        {
          title: "Storing all historical locations in the primary database",
          explanation:
            "200K locations/second × 86,400s = 17B records/day. A relational DB cannot handle this. Use time-series or object storage for history.",
        },
        {
          title: "Underestimating WebSocket server capacity",
          explanation:
            "Each WebSocket server can handle ~50K concurrent connections. You need multiple servers behind a load balancer with sticky sessions or a shared pub/sub layer.",
        },
      ],
      quizQuestions: [
        {
          question: "If each location update is ~50 bytes and there are 200K updates/s, what is the total ingress bandwidth?",
          options: ["~1 MB/s", "~10 MB/s", "~100 MB/s", "~1 GB/s"],
          correctIndex: 1,
          explanation:
            "200,000 × 50B = 10,000,000 bytes/s = ~10 MB/s.",
        },
        {
          question: "Why should driver locations be kept in Redis Geo rather than a relational database?",
          options: [
            "Redis is cheaper",
            "Redis Geo supports fast geospatial queries (nearby drivers) and high write throughput",
            "Relational databases don't support latitude",
            "Redis has better backup features",
          ],
          correctIndex: 1,
          explanation:
            "Redis Geo provides geospatial indexing commands (GEORADIUS, GEOPOS) with sub-millisecond latency and can handle 200K writes/s with clustering.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Endpoints for ride lifecycle and location streaming.",
      thinkingPrompt:
        "How do clients request rides? How do drivers send location? Should location use WebSocket or periodic HTTP? How do you broadcast a ride request to nearby drivers?",
      designDecision:
        "POST /rides/request {pickup_lat, pickup_lng, vehicle_type?} → ride object (pending). WebSocket /driver/location: driver streams GPS every 5s. GET /rides/:id/eta → ETA in seconds (ML model or map service). POST /rides/:id/accept (driver). GET /rides/:id/location → driver's current location for rider tracking. Broadcast: Dispatch Service queries Geo Index for drivers within 2km radius, sends push notification + WebSocket event to top 3 drivers simultaneously. First to accept wins.",
      commonMistakes: [
        {
          title: "Using HTTP polling for driver location",
          explanation:
            "Polling every 5s creates connection overhead and battery drain. WebSockets maintain a persistent connection with lower overhead.",
        },
        {
          title: "Sending ride requests to one driver at a time",
          explanation:
            "Serial dispatch is too slow. If the first driver declines, seconds pass. Broadcasting to the top 3 simultaneously reduces matching latency.",
        },
      ],
      quizQuestions: [
        {
          question: "Why broadcast a ride request to multiple drivers simultaneously?",
          options: [
            "To confuse the system",
            "To reduce matching latency if the nearest driver declines",
            "To increase surge pricing",
            "To comply with regulations",
          ],
          correctIndex: 1,
          explanation:
            "Broadcasting to top 3 drivers means if the nearest declines, the second-nearest can accept immediately, keeping latency low.",
        },
        {
          question: "What is the best protocol for streaming driver GPS locations?",
          options: ["HTTP polling", "WebSocket", "FTP", "Email"],
          correctIndex: 1,
          explanation:
            "WebSockets provide a persistent, low-latency connection ideal for streaming frequent small updates like GPS coordinates.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "Services, geo-indexing, and real-time data flow.",
      thinkingPrompt:
        "How does the Dispatch Service find nearby drivers? What stores the driver locations? How does the rider track the driver during the trip?",
      designDecision:
        "Rider App → API Gateway → Dispatch Service. Dispatch queries Geo Index (Redis Geo) for available drivers within radius. Driver App → WebSocket → Gateway → Driver Service → updates location in Geo Index + publishes to Kafka topic 'driver_location:{driver_id}'. Rider subscribes to same Kafka topic (via WebSocket bridge) to receive live location. Payment Service handles pricing, payments, and surge multipliers. Trip DB stores ride history. Message Queue (Kafka) decouples location updates from dispatch and tracking.",
      commonMistakes: [
        {
          title: "Using a single Redis instance for global geo data",
          explanation:
            "A single Redis can't handle 200K writes/s globally. Use Redis Cluster with geo-fenced shards (e.g., by city or S2 cell prefix).",
        },
        {
          title: "Not separating read and write paths for locations",
          explanation:
            "Location writes (200K/s) and location reads (ETA, tracking) have different patterns. Separate ingestion from query services to isolate load.",
        },
      ],
      quizQuestions: [
        {
          question: "What data structure is ideal for 'find nearest driver' queries?",
          options: ["B-Tree", "Quadtree / Geo-Hash / Redis Geo", "Linked List", "Bloom Filter"],
          correctIndex: 1,
          explanation:
            "Spatial indexes like quadtrees, S2 geometry cells, geohashes, or Redis Geo are designed for nearest-neighbor queries.",
        },
        {
          question: "Why decouple location updates from the Dispatch Service using Kafka?",
          options: [
            "To increase latency",
            "To absorb location write spikes without affecting dispatch queries",
            "To encrypt locations",
            "To reduce driver pay",
          ],
          correctIndex: 1,
          explanation:
            "Kafka acts as a shock absorber. 200K/s location writes don't directly hit the Dispatch Service, which only queries the Geo Index.",
        },
      ],
      architectureNodeIds: ["client", "gateway", "dispatch", "driver-app", "geo-index", "driver-service", "payment", "db", "cache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "Geo-spatial indexing, broadcast dispatch, and ETA prediction.",
      thinkingPrompt:
        "How do you partition the world for driver indexing? What happens during New Year's Eve when demand spikes? How is ETA calculated?",
      designDecision:
        "Geo-indexing: Divide the world into S2 cells or geohashes. Store driver location in Redis Geo per cell. Query: find drivers in the same cell + adjacent cells, then compute exact distance. Broadcast dispatch: Query returns top 10 candidates within 2km. Score by ETA, distance, driver rating. Send request to top 3 simultaneously with a 15-second timeout. First accept wins; others get cancellation. ETA: Historical travel time between S2 cells + real-time traffic (from Google Maps/HERE) + ML model predicting based on time-of-day, weather, events. Surge: Compute supply/demand ratio per geo-fenced cell. If ratio < 0.3, apply multiplier up to 5×.",
      commonMistakes: [
        {
          title: "Searching all drivers globally for each request",
          explanation:
            "Scanning 1M drivers globally is O(N). Spatial indexing reduces this to O(log N) for the relevant cells.",
        },
        {
          title: "Using Euclidean distance instead of haversine",
          explanation:
            "On a sphere, straight-line Euclidean distance is inaccurate. Use haversine formula or geodesic distance for accurate proximity.",
        },
      ],
      quizQuestions: [
        {
          question: "Why use S2 cells or geohashes instead of a simple radius search on lat/lng?",
          options: [
            "They look better in diagrams",
            "They enable efficient spatial indexing and reduce search space from global to local cells",
            "They are required by GPS satellites",
            "They increase driver pay",
          ],
          correctIndex: 1,
          explanation:
            "Spatial indexing (S2, geohash, quadtree) partitions the world so 'nearby' queries only search relevant cells instead of all drivers.",
        },
        {
          question: "What happens if none of the top 3 drivers accept a broadcast request?",
          options: [
            "The ride is cancelled",
            "Expand search radius and broadcast to next 3 drivers",
            "The rider is banned",
            "The price is reduced",
          ],
          correctIndex: 1,
          explanation:
            "Uber expands the search radius incrementally (2km → 5km → 10km) and broadcasts to the next batch of drivers until someone accepts.",
        },
      ],
      architectureNodeIds: ["client", "gateway", "dispatch", "driver-app", "geo-index", "driver-service", "payment", "db", "cache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Exact vs approximate nearest driver, surge pricing fairness.",
      thinkingPrompt:
        "Is the absolute nearest driver always the best match? How do you balance ETA, driver rating, and fairness? Is surge pricing fair to riders?",
      designDecision:
        "Exact nearest vs best match: The absolute nearest driver may be stuck in traffic or have a low acceptance rate. A slightly farther driver with a clear route may arrive sooner. Scoring function: weighted combination of ETA (60%), distance (20%), acceptance rate (15%), rating (5%). Surge pricing fairness: Surge is economically efficient (balances supply/demand) but perceived as unfair. Mitigations: show upfront pricing so riders know the cost before requesting; cap surge multiplier during emergencies; offer ride pooling to reduce individual cost. Approximate geo-index: Using S2 cells gives approximate nearest drivers, but the exact distance check filters false positives. This is a classic latency-vs-accuracy trade-off.",
      commonMistakes: [
        {
          title: "Always matching the absolute nearest driver",
          explanation:
            "The nearest driver by straight-line distance may be blocked by a one-way street or traffic. ETA is a better metric than distance.",
        },
        {
          title: "Surge pricing without transparency",
          explanation:
            "Hidden surge multipliers cause rider outrage. Upfront pricing and surge notifications improve trust.",
        },
      ],
      quizQuestions: [
        {
          question: "Why might a slightly farther driver be a better match than the absolute nearest?",
          options: [
            "They have a newer car",
            "They may have a faster route, higher acceptance rate, or be less affected by traffic",
            "They charge less",
            "They are required by law",
          ],
          correctIndex: 1,
          explanation:
            "A scoring function that includes ETA, acceptance rate, and traffic conditions often selects a better driver than pure proximity.",
        },
        {
          question: "What is the main criticism of surge pricing and how can it be mitigated?",
          options: [
            "It reduces driver pay; pay drivers more",
            "It is perceived as unfair; mitigate with upfront pricing, caps, and ride pooling",
            "It causes traffic jams; ban cars",
            "It is illegal everywhere; remove it",
          ],
          correctIndex: 1,
          explanation:
            "Surge pricing balances supply and demand but feels exploitative. Transparency (upfront cost), emergency caps, and pooling options improve fairness.",
        },
      ],
      architectureNodeIds: ["client", "gateway", "dispatch", "driver-app", "geo-index", "driver-service", "payment", "db", "cache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
      annotations: [
        { nodeId: "dispatch", text: "Weighted scoring: ETA > distance > acceptance", type: "trade-off" },
        { nodeId: "geo-index", text: "Approximate cells + exact distance filter", type: "note" },
        { nodeId: "payment", text: "Upfront pricing + surge caps for fairness", type: "warning" },
      ],
    },
  ],
  architectureNodes: uberNodes,
  architectureEdges: uberEdges,
};

// ------------------------------------------------------------------
// WhatsApp / Messaging Architecture Nodes
// ------------------------------------------------------------------
const whatsappNodes: Node<Record<string, unknown>>[] = [
  { id: "client-a", type: "presentation", position: { x: 50, y: 50 }, data: { kind: "client", label: "User A (Sender)" } },
  { id: "client-b", type: "presentation", position: { x: 50, y: 200 }, data: { kind: "client", label: "User B (Receiver)" } },
  { id: "lbs", type: "presentation", position: { x: 200, y: 125 }, data: { kind: "load-balancer", label: "LB / Edge Proxy" } },
  { id: "ws-gateway", type: "presentation", position: { x: 350, y: 125 }, data: { kind: "api-gateway", label: "WebSocket Gateway" } },
  { id: "msg-router", type: "presentation", position: { x: 500, y: 125 }, data: { kind: "app-server", label: "Message Router" } },
  { id: "presence", type: "presentation", position: { x: 650, y: 50 }, data: { kind: "app-server", label: "Presence Service" } },
  { id: "e2ee", type: "presentation", position: { x: 650, y: 200 }, data: { kind: "encryption", label: "E2EE (Signal)" } },
  { id: "cache", type: "presentation", position: { x: 350, y: 260 }, data: { kind: "cache", label: "Redis (Sessions)" } },
  { id: "msg-store", type: "presentation", position: { x: 500, y: 260 }, data: { kind: "database", label: "Message Store" } },
  { id: "mq", type: "presentation", position: { x: 200, y: 260 }, data: { kind: "message-queue", label: "Message Queue" } },
];

const whatsappEdges: Edge<Record<string, unknown>>[] = [
  { id: "e1", source: "client-a", target: "lbs", type: "default" },
  { id: "e2", source: "lbs", target: "ws-gateway", type: "default" },
  { id: "e3", source: "ws-gateway", target: "msg-router", type: "default" },
  { id: "e4", source: "msg-router", target: "msg-store", type: "default" },
  { id: "e5", source: "msg-router", target: "mq", type: "default" },
  { id: "e6", source: "mq", target: "ws-gateway", type: "default" },
  { id: "e7", source: "ws-gateway", target: "client-b", type: "default" },
  { id: "e8", source: "msg-router", target: "presence", type: "default" },
  { id: "e9", source: "msg-router", target: "e2ee", type: "default" },
  { id: "e10", source: "ws-gateway", target: "cache", type: "default" },
];

export const whatsappConfig: CaseStudyConfig = {
  systemName: "WhatsApp / Real-Time Messaging",
  moduleId: "case-whatsapp",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Define functional and non-functional requirements for 2B users.",
      thinkingPrompt:
        "WhatsApp supports 2B users sending 100B messages/day. What are the core requirements? How do delivery guarantees, encryption, and presence differ from a simple REST API?",
      designDecision:
        "Functional: 1:1 messaging, group messaging (up to 1024 members), media sharing (photos, video, audio, documents), read receipts, typing indicators, online/last seen status, message delete/edit. Non-functional: 100B messages/day (~1.2M/s avg, 5M/s peak), end-to-end encryption for privacy, message delivery within 100ms, online status within 1s, 99.99% availability, offline message delivery (store-and-forward).",
      commonMistakes: [
        {
          title: "Treating messaging as simple HTTP request-response",
          explanation:
            "WhatsApp uses persistent WebSocket connections for real-time push. Long polling or HTTP would add 100ms+ latency per message.",
        },
        {
          title: "Ignoring offline message delivery",
          explanation:
            "When a recipient is offline, messages must be stored and delivered when they come online. This requires a reliable message queue with persistence.",
        },
      ],
      quizQuestions: [
        {
          question: "At 100B messages/day, what is the average messages per second?",
          options: ["~1,000", "~12,000", "~1.2M", "~5M"],
          correctIndex: 2,
          explanation:
            "100,000,000,000 ÷ 86,400 ≈ 1,157,407/s ≈ 1.2M messages per second average.",
        },
        {
          question: "Which protocol is essential for real-time messaging push?",
          options: ["HTTP/1.1", "WebSocket", "FTP", "SMTP"],
          correctIndex: 1,
          explanation:
            "WebSockets provide a persistent bidirectional connection ideal for real-time message delivery without repeated connection overhead.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "Calculate storage, QPS, and connection capacity.",
      thinkingPrompt:
        "How much storage for message history? How many WebSocket connections? What network bandwidth for presence updates?",
      designDecision:
        "Message storage: 100B msgs/day × 200B avg (text, metadata) = 20 TB/day. 7-day ephemeral storage = 140 TB. Users with full history stored separately (Google Drive backup). WebSocket connections: 2B users, ~500M DAU, 10% active at peak = 50M concurrent WebSocket connections. Each connection ~10KB = 500 GB RAM for connection state. Presence: 50M users × 1 update/5s = 10M presence updates/s. Use Redis sorted sets for last-seen with 60s batching.",
      commonMistakes: [
        {
          title: "Not estimating WebSocket memory requirements",
          explanation:
            "50M WebSocket connections × 10KB per connection = 500GB RAM just for connection state. This requires distributed gateway clusters.",
        },
        {
          title: "Storing all messages forever in the primary DB",
          explanation:
            "100B messages/day × 365 = 36.5T messages/year. Use tiered storage: hot (7 days, Redis), warm (30 days, SSD), cold (archived, object storage).",
        },
      ],
      quizQuestions: [
        {
          question: "If 50M users have persistent WebSocket connections and each connection uses 10KB, how much RAM is needed?",
          options: ["50 GB", "500 GB", "5 TB", "50 TB"],
          correctIndex: 1,
          explanation:
            "50,000,000 × 10KB = 500,000,000KB = 500GB RAM just for WebSocket connection state.",
        },
        {
          question: "Why batch presence updates instead of sending immediately?",
          options: [
            "To save bandwidth for the client",
            "To reduce server-side write QPS from presence updates",
            "To make presence less accurate",
            "To comply with regulations",
          ],
          correctIndex: 1,
          explanation:
            "Batching presence updates (e.g., every 60s) reduces the presence update QPS from millions per second to thousands per second.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Design message delivery and presence protocols.",
      thinkingPrompt:
        "What protocols for message send? Should it be synchronous (confirm delivery) or asynchronous (fire-and-forget)? How does the client maintain session state?",
      designDecision:
        "Message Send: WebSocket send {to, content, client_msg_id} → server acks {server_msg_id, status}. Server stores in DB, pushes to recipient via their WebSocket. If recipient offline, message queue holds it. Message ID: client-generated UUID prevents duplicates on retry. GET /chats, GET /chats/:id/messages (cursor pagination). WebSocket /ws for real-time: events = message, ack, delivered, read, typing, presence. Binary protocol (not JSON) to reduce bandwidth on mobile.",
      commonMistakes: [
        {
          title: "Using JSON for high-volume messaging",
          explanation:
            "JSON adds ~2× overhead vs binary (Protocol Buffers/FlatBuffers). At 1M+ messages/s, this is significant bandwidth and parsing cost.",
        },
        {
          title: "Not implementing idempotent send",
          explanation:
            "Network retries can cause duplicate messages. Client-generated message IDs let the server deduplicate.",
        },
      ],
      quizQuestions: [
        {
          question: "Why use client-generated message IDs?",
          options: [
            "To make messages unique",
            "To enable deduplication on network retries",
            "To encrypt messages faster",
            "To reduce message size",
          ],
          correctIndex: 1,
          explanation:
            "Client message IDs allow the server to detect and discard duplicate sends when the client retries due to network failures.",
        },
        {
          question: "Why is a binary protocol preferred over JSON for mobile messaging?",
          options: [
            "JSON is too slow to parse",
            "Binary protocols use less bandwidth and are faster to encode/decode",
            "JSON is not secure",
            "Binary protocols are required by law",
          ],
          correctIndex: 1,
          explanation:
            "Binary protocols like Protocol Buffers can be 5-10× smaller and 10× faster to parse than JSON, critical for mobile networks.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "WebSocket routing, message queue, and delivery guarantees.",
      thinkingPrompt:
        "How does a message travel from User A to User B? What happens if B is offline? How does the system ensure exactly-once delivery?",
      designDecision:
        "User A → WebSocket Gateway (LB) → Message Router. Message Router: (1) Store in Message Store (Cassandra/ ScyllaDB), (2) Publish to Kafka topic partitioned by recipient_id. Recipient's WebSocket Gateway subscribes, pushes to connected client. Offline handling: Kafka retains messages for 7 days. When User B reconnects, WebSocket Gateway fetches undelivered from Kafka, delivers, marks as delivered. Delivery guarantee: at-least-once via Kafka + client ACK. Idempotency via client_msg_id dedup.",
      commonMistakes: [
        {
          title: "Using point-to-point HTTP for message delivery",
          explanation:
            "HTTP request-response doesn't scale for 1M+ messages/s. WebSocket + message queue decouples send from delivery and handles offline.",
        },
        {
          title: "Not handling the reconnection race condition",
          explanation:
            "When User B reconnects, there may be in-flight messages to their old connection. Use sequence numbers or message IDs to reconcile.",
        },
      ],
      quizQuestions: [
        {
          question: "Why use Kafka partitioned by recipient_id for message delivery?",
          options: [
            "To encrypt messages",
            "To ensure all messages for a user go to the same partition for ordering",
            "To reduce storage costs",
            "To make messages searchable",
          ],
          correctIndex: 1,
          explanation:
            "Partitioning by recipient_id ensures all messages for a user are processed in order by a single consumer, preventing out-of-order delivery.",
        },
        {
          question: "How does WhatsApp handle offline message delivery?",
          options: [
            "Messages are lost",
            "Messages are stored in a queue and delivered when the user reconnects",
            "Messages are sent to email",
            "Messages are stored on the client only",
          ],
          correctIndex: 1,
          explanation:
            "When the recipient is offline, messages are stored in a persistent queue (Kafka). Upon reconnection, undelivered messages are fetched and delivered.",
        },
      ],
      architectureNodeIds: ["client-a", "lbs", "ws-gateway", "msg-router", "msg-store", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7"],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "E2EE Signal protocol and presence system internals.",
      thinkingPrompt:
        "How does end-to-end encryption work without sharing keys beforehand? How does the presence system scale to 50M concurrent online users?",
      designDecision:
        "E2EE (Signal Protocol): Each user has identity key pair (long-term) + prekey bundle (ephemeral). On first message, run X3DH key agreement to derive shared secret. Then use Double Ratchet: each message has a new session key derived from previous + new DH output. If attacker records encrypted messages and later compromises a key, only a small window is exposed (forward secrecy). Server never sees plaintext. Presence: WebSocket gateway maintains connection state. Presence Service tracks online users in Redis sorted set (user_id → last heartbeat timestamp). Heartbeat every 30s. Offline if no heartbeat for 60s. Typing indicators: debounced client-side 3s timeout, sent as ephemeral WebSocket event not stored.",
      commonMistakes: [
        {
          title: "Encrypting messages at the transport layer only",
          explanation:
            "TLS encrypts only in transit. WhatsApp E2EE encrypts end-to-end so even the server cannot read messages. This requires the Signal protocol.",
        },
        {
          title: "Sending presence updates on every user action",
          explanation:
            "Every keystroke, open/close app would flood the presence system. Batch heartbeats every 30s with debounced typing indicators.",
        },
      ],
      quizQuestions: [
        {
          question: "What property of the Signal protocol prevents past messages from being decrypted if a key is compromised?",
          options: ["Authentication", "Forward secrecy", "Non-repudiation", "Compression"],
          correctIndex: 1,
          explanation:
            "Forward secrecy means each message uses a unique session key. Compromising one key doesn't expose past messages.",
        },
        {
          question: "Why batch presence heartbeats every 30 seconds?",
          options: [
            "To make users appear offline",
            "To reduce presence update QPS from millions to thousands per second",
            "To save client battery at the cost of accuracy",
            "To comply with messaging regulations",
          ],
          correctIndex: 1,
          explanation:
            "50M users × 1 heartbeat/30s = ~1.7M presence updates/s. Without batching, this would be 50M/s.",
        },
      ],
      architectureNodeIds: ["client-a", "lbs", "ws-gateway", "msg-router", "msg-store", "mq", "presence", "e2ee"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9"],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Delivery guarantees, encryption trade-offs, and consistency.",
      thinkingPrompt:
        "What's the cost of end-to-end encryption? Does it prevent spam? How do you balance delivery speed vs exactly-once semantics?",
      designDecision:
        "E2EE trade-offs: Server cannot scan for spam/illegal content (good for privacy, bad for content moderation). Solution: report feature encrypts flagged content client-side. Delivery speed vs correctness: at-least-once + client dedup is faster than synchronous exactly-once (2PC). Most apps use at-least-once. Read receipts: blue ticks are opt-in, provide delivery confirmation but can cause anxiety. Optional. Message deletion: 2-minute delete window prevents misuse but limits legitimate undo. Group messaging: sender FANOUT vs receiver pull. Small groups (< 256): sender fan-out. Large groups: server-side distribution list.",
      commonMistakes: [
        {
          title: "Requiring exactly-once delivery for all messages",
          explanation:
            "Exactly-once requires 2PC coordination which adds 100ms+ latency. At-least-once with client-side dedup is sufficient for most use cases.",
        },
        {
          title: "Mandatory read receipts",
          explanation:
            "Blue ticks can create social pressure and anxiety. Make them optional to improve user experience.",
        },
      ],
      quizQuestions: [
        {
          question: "What is the main privacy benefit of end-to-end encryption?",
          options: [
            "Messages load faster",
            "The server cannot read message content, only endpoints can",
            "Messages cannot be lost",
            "Messages work offline",
          ],
          correctIndex: 1,
          explanation:
            "E2EE ensures only the communicating endpoints can decrypt messages. Even WhatsApp's servers cannot read the content.",
        },
        {
          question: "Why is at-least-once with client-side dedup preferred over exactly-once for messaging?",
          options: [
            "It is simpler to implement",
            "It provides lower latency at acceptable correctness",
            "Exactly-once is impossible",
            "At-least-once uses less storage",
          ],
          correctIndex: 1,
          explanation:
            "Exactly-once requires synchronous coordination (2PC) adding 100ms+ latency. At-least-once with client-side UUID dedup achieves 99.9% correctness with better latency.",
        },
      ],
      architectureNodeIds: ["client-a", "lbs", "ws-gateway", "msg-router", "msg-store", "mq", "presence", "e2ee", "cache"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
      annotations: [
        { nodeId: "msg-router", text: "At-least-once delivery + UUID dedup", type: "trade-off" },
        { nodeId: "e2ee", text: "Signal protocol: X3DH + Double Ratchet", type: "note" },
        { nodeId: "presence", text: "60s offline threshold, 30s heartbeat batch", type: "note" },
      ],
    },
  ],
  architectureNodes: whatsappNodes,
  architectureEdges: whatsappEdges,
};

// ------------------------------------------------------------------
// Amazon / E-Commerce Architecture Nodes
// ------------------------------------------------------------------
const amazonNodes: Node<Record<string, unknown>>[] = [
  { id: "client", type: "presentation", position: { x: 50, y: 50 }, data: { kind: "client", label: "Client Browser/App" } },
  { id: "cdn", type: "presentation", position: { x: 200, y: 50 }, data: { kind: "cdn", label: "CloudFront CDN" } },
  { id: "lb", type: "presentation", position: { x: 350, y: 50 }, data: { kind: "load-balancer", label: "Load Balancer" } },
  { id: "api-gateway", type: "presentation", position: { x: 500, y: 50 }, data: { kind: "api-gateway", label: "API Gateway" } },
  { id: "catalog-service", type: "presentation", position: { x: 250, y: 180 }, data: { kind: "app-server", label: "Catalog Service" } },
  { id: "search-service", type: "presentation", position: { x: 400, y: 180 }, data: { kind: "search", label: "Search Service (Elasticsearch)" } },
  { id: "recommendation-service", type: "presentation", position: { x: 550, y: 180 }, data: { kind: "app-server", label: "Recommendation Engine" } },
  { id: "inventory-service", type: "presentation", position: { x: 700, y: 180 }, data: { kind: "app-server", label: "Inventory Service" } },
  { id: "order-service", type: "presentation", position: { x: 250, y: 310 }, data: { kind: "app-server", label: "Order Service" } },
  { id: "payment-service", type: "presentation", position: { x: 400, y: 310 }, data: { kind: "app-server", label: "Payment Service" } },
  { id: "fulfillment-service", type: "presentation", position: { x: 550, y: 310 }, data: { kind: "app-server", label: "Fulfillment Service" } },
  { id: "cache", type: "presentation", position: { x: 400, y: 440 }, data: { kind: "cache", label: "Redis Cache" } },
  { id: "db", type: "presentation", position: { x: 550, y: 440 }, data: { kind: "database", label: "Database (RDS + DynamoDB)" } },
  { id: "mq", type: "presentation", position: { x: 700, y: 440 }, data: { kind: "message-queue", label: "Message Queue (SQS/Kafka)" } },
];

const amazonEdges: Edge<Record<string, unknown>>[] = [
  { id: "e1", source: "client", target: "cdn", type: "default" },
  { id: "e2", source: "cdn", target: "lb", type: "default" },
  { id: "e3", source: "lb", target: "api-gateway", type: "default" },
  { id: "e4", source: "api-gateway", target: "catalog-service", type: "default" },
  { id: "e5", source: "api-gateway", target: "search-service", type: "default" },
  { id: "e6", source: "api-gateway", target: "recommendation-service", type: "default" },
  { id: "e7", source: "api-gateway", target: "order-service", type: "default" },
  { id: "e8", source: "api-gateway", target: "payment-service", type: "default" },
  { id: "e9", source: "catalog-service", target: "cache", type: "default" },
  { id: "e10", source: "search-service", target: "cache", type: "default" },
  { id: "e11", source: "order-service", target: "inventory-service", type: "default" },
  { id: "e12", source: "order-service", target: "payment-service", type: "default" },
  { id: "e13", source: "order-service", target: "fulfillment-service", type: "default" },
  { id: "e14", source: "order-service", target: "mq", type: "default" },
  { id: "e15", source: "inventory-service", target: "db", type: "default" },
  { id: "e16", source: "payment-service", target: "db", type: "default" },
  { id: "e17", source: "fulfillment-service", target: "mq", type: "default" },
];

export const amazonConfig: CaseStudyConfig = {
  systemName: "Amazon / E-Commerce Platform",
  moduleId: "case-amazon",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Define functional and non-functional requirements for a global e-commerce platform.",
      thinkingPrompt:
        "Amazon handles 300M products, 500M customers, peak 600K orders/minute on Prime Day. What are the core flows and their scale?",
      designDecision:
        "Functional: product catalog browsing, search, recommendations, shopping cart, checkout, payments, order tracking, inventory management, seller dashboard. Non-functional: 500M customers globally, 300M+ products, 600K orders/minute peak (Prime Day), 99.99% availability, search latency < 200ms, checkout latency < 3s, inventory accuracy within seconds.",
      commonMistakes: [
        {
          title: "Treating product catalog as a single relational table",
          explanation:
            "300M products with varied attributes (clothing sizes, electronics specs) require a flexible schema or separate tables per category.",
        },
        {
          title: "Ignoring the difference between browse and search traffic",
          explanation:
            "Browse traffic (category pages) and search traffic have different access patterns and caching requirements.",
        },
      ],
      quizQuestions: [
        {
          question: "At 600K orders/minute peak, what is the average orders per second?",
          options: ["6,000", "10,000", "600,000", "1,000,000"],
          correctIndex: 1,
          explanation:
            "600,000 orders ÷ 60 seconds = 10,000 orders/second peak.",
        },
        {
          question: "Which is the most critical consistency requirement for inventory?",
          options: [
            "Eventual consistency is fine",
            "Strong consistency to prevent overselling",
            "No consistency needed",
            "Eventual consistency for reads, strong for writes",
          ],
          correctIndex: 1,
          explanation:
            "Inventory must be strongly consistent to prevent overselling products that are out of stock.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "Calculate storage, QPS, and capacity requirements.",
      thinkingPrompt:
        "How much storage for 300M products? What QPS does the search system need? How many inventory updates per second during Prime Day?",
      designDecision:
        "Product catalog: average 2KB per product × 300M = 600 GB. Images served via CDN (S3 + CloudFront). Search index: Elasticsearch ~3TB for 300M products with full-text. QPS: browse 50K/s, search 100K/s peak, checkout 10K/s. Inventory updates: 600K orders/min = 10K/s inventory decrements. Payment processing: 10K TPS with PCI-DSS compliance.",
      commonMistakes: [
        {
          title: "Not separating hot and cold product data",
          explanation:
            "Popular products (20%) get 80% of traffic. Cache hot data aggressively, cold data can use slower storage.",
        },
        {
          title: "Storing all product images in the same storage tier",
          explanation:
            "Product images have different access patterns. Use CDN edge caching for popular images, S3 Standard for frequent, S3 Glacier for archival.",
        },
      ],
      quizQuestions: [
        {
          question: "For 300M products averaging 2KB each, how much storage for the catalog alone?",
          options: ["60 GB", "600 GB", "6 TB", "60 TB"],
          correctIndex: 1,
          explanation:
            "300,000,000 × 2,000 bytes = 600,000,000,000 bytes = ~600 GB.",
        },
        {
          question: "Why is search indexing typically separate from the main product database?",
          options: [
            "To increase costs",
            "To optimize for read-heavy full-text queries vs transactional writes",
            "To simplify the schema",
            "To reduce security",
          ],
          correctIndex: 1,
          explanation:
            "Search engines like Elasticsearch are optimized for full-text search and faceted filtering, while relational DBs optimize for transactional writes.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Design APIs for catalog, search, cart, and checkout.",
      thinkingPrompt:
        "What APIs does the client need? Should search be REST or use a specialized search API? How do you handle session state for cart?",
      designDecision:
        "GET /products/:id — product details. GET /products?category=electronics&brand=apple — browse with filters. GET /search?q=laptop+8gb&sort=price_asc — full-text search with pagination. POST /cart/items, PUT /cart/items/:id, DELETE /cart/items/:id. POST /orders — checkout. GET /orders/:id — order status. Use Redis for cart session storage (24hr TTL). Search uses Elasticsearch query DSL via internal service call.",
      commonMistakes: [
        {
          title: "Using the database for cart storage",
          explanation:
            "Carts are ephemeral (most are abandoned). Redis with TTL avoids DB load from millions of abandoned carts.",
        },
        {
          title: "Returning full product details in search results",
          explanation:
            "Search results should return minimal product data (id, title, price, image). Full details fetched on detail page to reduce search payload.",
        },
      ],
      quizQuestions: [
        {
          question: "Why use Redis for shopping cart instead of a database?",
          options: [
            "Redis is cheaper",
            "Carts are ephemeral with 24hr TTL; Redis avoids DB bloat from abandoned carts",
            "Redis has better durability",
            "Databases can't store carts",
          ],
          correctIndex: 1,
          explanation:
            "Most shopping carts are abandoned. Storing them in Redis with a 24-hour TTL avoids persisting millions of temporary carts to the database.",
        },
        {
          question: "Why return minimal data in search results rather than full product details?",
          options: [
            "To save database storage",
            "To reduce search latency and payload size",
            "To force users to click",
            "To improve security",
          ],
          correctIndex: 1,
          explanation:
            "Search results need only id, title, price, thumbnail. Full details (descriptions, specs, reviews) are fetched when viewing the product page.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "Major services, data flow, and scalability patterns.",
      thinkingPrompt:
        "Draw the browse flow, search flow, and checkout flow. What services own what data? Where does caching help?",
      designDecision:
        "Browse: Client → CDN (cached category pages) → LB → API GW → Catalog Service → Redis Cache → RDS. Search: Client → CDN (cached search results for popular queries) → LB → API GW → Search Service → Elasticsearch. Checkout: Client → LB → API GW → Order Service → Inventory Service (decrement, with distributed lock) → Payment Service → Fulfillment Service → SQS for async fulfillment. All writes go through the Order Service which publishes events.",
      commonMistakes: [
        {
          title: "Not using distributed locks for inventory",
          explanation:
            "Without locks, two simultaneous orders could both succeed for the last item. Use Redis or database locks for inventory decrements.",
        },
        {
          title: "Making checkout synchronous end-to-end",
          explanation:
            "Fulfillment is slow (hours/days). Checkout should be synchronous but fulfillment should be async via message queue.",
        },
      ],
      quizQuestions: [
        {
          question: "Why is inventory decrement done with a distributed lock?",
          options: [
            "To improve performance",
            "To prevent overselling when two orders try to buy the last item simultaneously",
            "To reduce costs",
            "To simplify the code",
          ],
          correctIndex: 1,
          explanation:
            "Two concurrent requests could both read '1 remaining' and both succeed without locking, resulting in overselling.",
        },
        {
          question: "Why is fulfillment handled asynchronously after checkout?",
          options: [
            "To speed up checkout for the customer",
            "Fulfillment is slow (pick, pack, ship) and doesn't need to block the checkout response",
            "To reduce payment costs",
            "To improve search speed",
          ],
          correctIndex: 1,
          explanation:
            "Fulfillment involves physical processes taking hours to days. Making it async keeps checkout fast while fulfillment happens in the background.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "catalog-service", "search-service", "order-service", "payment-service", "cache", "db"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e7", "e8", "e9", "e10", "e15", "e16"],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "Search, recommendations, inventory consistency, and payments.",
      thinkingPrompt:
        "How does Amazon's search handle 100K QPS? How are recommendations generated? How does inventory stay consistent across regions?",
      designDecision:
        "Search: Elasticsearch cluster with 50+ nodes, sharded by product_id. Query rewriting (typo tolerance, synonyms, personalization). Results cached in Redis (5min TTL) for popular queries. Recommendations: Collaborative filtering (user-user similarity from purchase history) + content-based (item similarity) + trending. Hybrid approach using ML ranking model. Inventory: Regional inventory pods. On order, reserve inventory in nearest region with available stock. Global inventory sync via event sourcing (inventory events published to Kafka, each region maintains replica).",
      commonMistakes: [
        {
          title: "Using SQL LIKE for product search",
          explanation:
            "LIKE queries don't scale. Full-text search engines (Elasticsearch, Solr) provide typo tolerance, ranking, and faceting essential for e-commerce.",
        },
        {
          title: "Single-region inventory database",
          explanation:
            "Global e-commerce needs regional inventory to reduce shipping time. Use event sourcing to keep regional inventories in sync.",
        },
      ],
      quizQuestions: [
        {
          question: "Why is Elasticsearch preferred over SQL LIKE for e-commerce search?",
          options: [
            "It's cheaper",
            "It provides typo tolerance, synonym handling, relevance ranking, and faceted filtering",
            "It uses less storage",
            "It's easier to set up",
          ],
          correctIndex: 1,
          explanation:
            "E-commerce search needs typo tolerance (did you mean?), synonyms (laptop/notebook), relevance ranking, and filters (brand, price) which SQL cannot provide efficiently.",
        },
        {
          question: "How does Amazon keep regional inventories consistent?",
          options: [
            "Single master database",
            "Event sourcing: all inventory changes published to Kafka, each region maintains a replica",
            "No consistency needed",
            "Manual synchronization",
          ],
          correctIndex: 1,
          explanation:
            "Event sourcing publishes every inventory mutation to Kafka. Regional pods consume and apply events to maintain local replicas.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "catalog-service", "search-service", "recommendation-service", "inventory-service", "order-service", "payment-service", "fulfillment-service", "cache", "db", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13", "e14", "e15", "e16", "e17"],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Inventory vs availability, search recall vs precision, payment reliability.",
      thinkingPrompt:
        "Should Amazon show products that might be out of stock? How do you balance search recall (finding everything) vs precision (showing relevant)?",
      designDecision:
        "Inventory availability vs showing out-of-stock: Show products but indicate 'Only X left' or 'Usually ships in 2-3 weeks'. Prevents lost sales from hiding inventory. Search recall vs precision: Prioritize precision for high-intent queries (user knows what they want), recall for exploratory searches. Use ML ranking model to balance. Payment reliability: Synchronous payment with 3DS (bank verification) for fraud prevention. Payment confirmation before order confirmation. Idempotent payment requests using idempotency keys to handle retries.",
      commonMistakes: [
        {
          title: "Hiding out-of-stock products entirely",
          explanation:
            "Showing 'backordered' or 'ships in 2 weeks' captures sales that would otherwise be lost to competitors.",
        },
        {
          title: "Using eventual consistency for inventory decrements",
          explanation:
            "Eventual consistency would cause overselling. Inventory decrements must be strongly consistent with distributed locking.",
        },
      ],
      quizQuestions: [
        {
          question: "Why might you show 'Only 2 left' rather than hiding the product entirely?",
          options: [
            "To increase prices",
            "To capture sales that would otherwise go to competitors",
            "To confuse customers",
            "To reduce inventory",
          ],
          correctIndex: 1,
          explanation:
            "A customer willing to wait may still buy. Hiding products loses the sale entirely to a competitor who shows availability.",
        },
        {
          question: "Why use idempotency keys for payment requests?",
          options: [
            "To speed up payments",
            "To prevent duplicate charges when the client retries due to network failure",
            "To reduce payment costs",
            "To encrypt payments",
          ],
          correctIndex: 1,
          explanation:
            "Network failures can cause retries. An idempotency key (e.g., order_id) lets the payment service recognize and reject duplicate requests.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "catalog-service", "search-service", "recommendation-service", "inventory-service", "order-service", "payment-service", "fulfillment-service", "cache", "db", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13", "e14", "e15", "e16", "e17"],
      annotations: [
        { nodeId: "search-service", text: "Elasticsearch: typo tolerance, synonyms, facets", type: "note" },
        { nodeId: "inventory-service", text: "Distributed lock prevents overselling", type: "warning" },
        { nodeId: "recommendation-service", text: "Hybrid: collaborative + content-based + ML ranking", type: "note" },
        { nodeId: "payment-service", text: "PCI-DSS compliant, idempotent requests", type: "warning" },
      ],
    },
  ],
  architectureNodes: amazonNodes,
  architectureEdges: amazonEdges,
};

// ------------------------------------------------------------------
// Netflix / Video Streaming Architecture Nodes
// ------------------------------------------------------------------
const netflixNodes: Node<Record<string, unknown>>[] = [
  { id: "client", type: "presentation", position: { x: 50, y: 50 }, data: { kind: "client", label: "Client (Web/TV/Mobile)" } },
  { id: "cdn", type: "presentation", position: { x: 200, y: 50 }, data: { kind: "cdn", label: "Open Connect CDN" } },
  { id: "lb", type: "presentation", position: { x: 350, y: 50 }, data: { kind: "load-balancer", label: "Load Balancer" } },
  { id: "api-gateway", type: "presentation", position: { x: 500, y: 50 }, data: { kind: "api-gateway", label: "API Gateway" } },
  { id: "browse-service", type: "presentation", position: { x: 300, y: 180 }, data: { kind: "app-server", label: "Browse Service" } },
  { id: "personalization", type: "presentation", position: { x: 450, y: 180 }, data: { kind: "app-server", label: "Personalization Engine" } },
  { id: "transcoding", type: "presentation", position: { x: 600, y: 180 }, data: { kind: "transcoding", label: "Transcoding Service" } },
  { id: "asset-storage", type: "presentation", position: { x: 750, y: 180 }, data: { kind: "storage", label: "S3 / Blob Storage" } },
  { id: "cache", type: "presentation", position: { x: 300, y: 310 }, data: { kind: "cache", label: "Redis Cache" } },
  { id: "db", type: "presentation", position: { x: 450, y: 310 }, data: { kind: "database", label: "Cassandra (Metadata)" } },
  { id: "evcache", type: "presentation", position: { x: 600, y: 310 }, data: { kind: "cache", label: "EVCache (Per-request)" } },
  { id: "mq", type: "presentation", position: { x: 750, y: 310 }, data: { kind: "message-queue", label: "Kafka (Events)" } },
];

const netflixEdges: Edge<Record<string, unknown>>[] = [
  { id: "e1", source: "client", target: "cdn", type: "default" },
  { id: "e2", source: "cdn", target: "lb", type: "default" },
  { id: "e3", source: "lb", target: "api-gateway", type: "default" },
  { id: "e4", source: "api-gateway", target: "browse-service", type: "default" },
  { id: "e5", source: "api-gateway", target: "personalization", type: "default" },
  { id: "e6", source: "api-gateway", target: "transcoding", type: "default" },
  { id: "e7", source: "transcoding", target: "asset-storage", type: "default" },
  { id: "e8", source: "browse-service", target: "cache", type: "default" },
  { id: "e9", source: "personalization", target: "evcache", type: "default" },
  { id: "e10", source: "browse-service", target: "db", type: "default" },
  { id: "e11", source: "personalization", target: "mq", type: "default" },
  { id: "e12", source: "mq", target: "evcache", type: "default" },
  { id: "e13", source: "client", target: "cdn", type: "default", label: "video stream" },
];

export const netflixConfig: CaseStudyConfig = {
  systemName: "Netflix / Video Streaming",
  moduleId: "case-netflix",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Define streaming quality, personalization, and global scale requirements.",
      thinkingPrompt:
        "Netflix serves 230M+ subscribers in 190 countries. How do you ensure smooth playback across varied network conditions? What makes Netflix different from YouTube?",
      designDecision:
        "Functional: video streaming (play/pause/seek), browse and search, personalized recommendations, user profiles, download for offline. Non-functional: 230M subscribers, 50% in US. 500M playback hours/day. Adaptive bitrate streaming (ABR) adjusts quality in real-time. Target: 99.99% availability, startup latency < 2s, rebuffering < 0.5% of play time, consistent quality across devices.",
      commonMistakes: [
        {
          title: "Treating streaming like regular HTTP file downloads",
          explanation:
            "Video streaming requires ABR (adaptive bitrate) to adjust quality to network conditions, not fixed bitrate downloads.",
        },
        {
          title: "Ignoring 'Netflix效应' (bandwidth spikes)",
          explanation:
            "A popular show release can cause 20%+ bandwidth spikes in a region. CDN and origin must handle this.",
        },
      ],
      quizQuestions: [
        {
          question: "At 500M playback hours/day, what is the average simultaneous streams if avg movie is 2 hours?",
          options: ["5M", "25M", "250M", "500M"],
          correctIndex: 1,
          explanation:
            "500M hours/day ÷ (24 × 3600s) = 5,787 streams/second average. With 2-hour average content, that's ~25M concurrent if spread evenly (much higher peak).",
        },
        {
          question: "What is ABR in video streaming?",
          options: [
            "A protocol for faster buffering",
            "Adaptive Bitrate — adjusts video quality based on network conditions",
            "A compression algorithm",
            "A type of CDN",
          ],
          correctIndex: 1,
          explanation:
            "ABR (Adaptive Bitrate) streaming adjusts video quality in real-time based on the viewer's network speed to prevent rebuffering.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "Calculate storage, bandwidth, and transcoding costs.",
      thinkingPrompt:
        "Netflix has 50K+ titles. Each title has multiple quality levels (4K, 1080p, 720p, etc.) and multiple audio tracks. How much storage and bandwidth does this need?",
      designDecision:
        "Video storage: 50K titles × average 5GB per title (multiple qualities) = 250 PB. CDN bandwidth: 500M hours/day × 4 Mbps (1080p) = 250 Tbps peak. Transcoding: 50K titles × 5 quality levels × 2 hours × 4 cores × 8 hours = massive parallel processing. Use AWS Elemental for transcoding. CDN cost: Open Connect (Netflix's CDN) serves 95% of traffic locally, saving $2B/year vs third-party CDN.",
      commonMistakes: [
        {
          title: "Not estimating CDN costs for video",
          explanation:
            "At 250 Tbps peak, third-party CDN costs would be prohibitive. Netflix built its own CDN (Open Connect) to save costs.",
        },
        {
          title: "Transcoding every video in real-time",
          explanation:
            "Transcoding is slow (hours per title). Pre-transcode all quality levels and store. Streaming serves pre-computed versions.",
        },
      ],
      quizQuestions: [
        {
          question: "If Netflix serves 250 Tbps at peak, why did they build their own CDN?",
          options: [
            "Third-party CDNs don't exist",
            "To save ~$2B/year vs using third-party CDN providers",
            "For better security",
            "Because AWS was too expensive",
          ],
          correctIndex: 1,
          explanation:
            "At Netflix's scale, third-party CDN costs would be prohibitive. Open Connect serves 95% of traffic locally, dramatically reducing costs.",
        },
        {
          question: "Why pre-transcode videos into multiple quality levels?",
          options: [
            "To save storage",
            "To enable ABR streaming — serve the right quality for each viewer's network",
            "To reduce transcoding costs",
            "To improve security",
          ],
          correctIndex: 1,
          explanation:
            "ABR needs multiple pre-encoded versions (4K, 1080p, 720p, 480p, etc.). The player selects the best quality for current network conditions.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Design APIs for browsing, playback, and recommendations.",
      thinkingPrompt:
        "What APIs does a TV app need? How do you handle personalized rows without overloading the personalization service?",
      designDecision:
        "GET /browse/mylist — user's saved content. GET /browse row (personalized row, e.g., 'Because you watched...') with page token. GET /titles/:id/metadata — title details, cast, similar. POST /playback/session {titleId, playbackPosition?} — start streaming session, returns manifest URL (HLS/DASH). GET /search?q= — search titles. Playback manifest points to CDN URL with signed URLs expiring in 4-6 hours.",
      commonMistakes: [
        {
          title: "Per-user personalization at the API level for every row",
          explanation:
            "Personalized rows (250+) would require 250 API calls. Netflix pre-computes personalized rows hourly and caches them.",
        },
        {
          title: "Long-lived signed URLs for video",
          explanation:
            "Long-lived URLs can be shared. Use short-lived (4hr) signed URLs to prevent link sharing and allow revocation.",
        },
      ],
      quizQuestions: [
        {
          question: "Why does Netflix pre-compute personalized rows rather than computing them per request?",
          options: [
            "To improve accuracy",
            "To avoid 250+ personalized API calls per page load, reducing latency and load",
            "To save storage",
            "To comply with regulations",
          ],
          correctIndex: 1,
          explanation:
            "Computing 250 personalized rows per user per page load would require massive compute. Pre-computing hourly with caching is far more efficient.",
        },
        {
          question: "Why use short-lived signed URLs for video playback?",
          options: [
            "To save bandwidth",
            "To prevent link sharing and enable URL revocation",
            "To reduce CDN costs",
            "To improve video quality",
          ],
          correctIndex: 1,
          explanation:
            "Short-lived URLs (4hr) prevent users from sharing links and allow Netflix to revoke access (e.g., after subscription ends).",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "CDN architecture, transcoding pipeline, and personalization.",
      thinkingPrompt:
        "How does video travel from storage to the TV? How does personalization work at Netflix's scale?",
      designDecision:
        "Video flow: S3 Origin → Open Connect CDN (ISP-level caching) → Client. Open Connect servers are deployed at ISP data centers worldwide, serving 95% of traffic locally. Transcoding pipeline: Upload → SQS queue → Transcoding workers (AWS Elemental) → Multiple qualities → Store back to S3 → Update metadata in Cassandra. Personalization: User events (play, pause, rating, search) → Kafka → ML training pipeline (每周) → Personalized ranking models → Pre-computed rows cached in EVCache → API serves cached rows.",
      commonMistakes: [
        {
          title: "Relying on third-party CDN without ISP-level deployment",
          explanation:
            "Netflix's Open Connect at ISP data centers is more efficient than traversing the internet. It reduces backbone traffic dramatically.",
        },
        {
          title: "Training ML models in real-time",
          explanation:
            "Real-time training would be too slow and expensive. Netflix trains models periodically (daily/weekly) and serves pre-computed recommendations.",
        },
      ],
      quizQuestions: [
        {
          question: "What makes Open Connect CDN different from CloudFront or Akamai?",
          options: [
            "It's cheaper",
            "It's deployed inside ISP networks at their data centers, reducing backbone traffic",
            "It's faster",
            "It's open source",
          ],
          correctIndex: 1,
          explanation:
            "Open Connect servers are installed directly in ISP data centers worldwide, serving 95% of traffic locally without traversing the public internet.",
        },
        {
          question: "Why use Kafka for user events in the personalization pipeline?",
          options: [
            "To encrypt events",
            "To decouple event ingestion from ML training, absorbing traffic spikes",
            "To store events permanently",
            "To reduce latency",
          ],
          correctIndex: 1,
          explanation:
            "Kafka buffers user events (billions/day) and feeds them to the ML training pipeline asynchronously, decoupling ingestion from training.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "browse-service", "personalization", "transcoding", "asset-storage", "cache", "db", "evcache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13"],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "ABR streaming internals, multi-region resilience, and chaos engineering.",
      thinkingPrompt:
        "How does ABR decide which quality to serve? How does Netflix handle region failures? What is chaos engineering?",
      designDecision:
        "ABR (HLS/DASH): Video divided into 2-10 second chunks. Client measures download speed every chunk, decides next chunk quality. Netflix uses perceptive hashing (pHash) to detect scene changes and optimize encoding. Multi-region: Active-active in 3 AWS regions (US-East, US-West, EU). S3 cross-region replication. If one region fails, DNS failover < 30s. Chaos Engineering: Netflix invented Chaos Monkey — randomly kills servers in production to ensure resilience.",
      commonMistakes: [
        {
          title: "Using fixed-bitrate encoding for all content",
          explanation:
            "Action movies need high bitrate for fast motion. Talk shows can use lower bitrate. Content-aware encoding optimizes bitrate per scene type.",
        },
        {
          title: "Single-region deployment",
          explanation:
            "Single region means complete outage if it fails. Multi-region active-active with DNS failover provides 99.99% availability.",
        },
      ],
      quizQuestions: [
        {
          question: "How does ABR streaming decide the next chunk's quality?",
          options: [
            "固定的bitrate",
            "Client measures download speed and buffer fullness, selects highest sustainable quality",
            "Server decides based on subscription tier",
            "Random selection",
          ],
          correctIndex: 1,
          explanation:
            "The client player measures how fast chunks download and how full the buffer is. It picks the highest quality that won't cause rebuffering.",
        },
        {
          question: "What is Chaos Monkey and why does Netflix use it?",
          options: [
            "A video codec",
            "随机杀死生产服务器以确保系统能在故障中存活",
            "A load testing tool",
            "A monitoring system",
          ],
          correctIndex: 1,
          explanation:
            "Chaos Monkey randomly kills production servers to ensure the system survives failures. This is chaos engineering — testing resilience in production.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "browse-service", "personalization", "transcoding", "asset-storage", "cache", "db", "evcache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13"],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Quality vs bandwidth, personalization vs privacy, cost vs availability.",
      thinkingPrompt:
        "Netflix wants the best quality but not everyone has fiber. How do you balance quality for all? How much personalization is too much?",
      designDecision:
        "Quality vs bandwidth: ABR solves this by adapting to each viewer's network. Netflix also uses perceptual hashing to optimize encoding — lower bitrate for same perceived quality. Global quality tiers: developing markets get lower default max quality. Personalization vs privacy: Netflix knows viewing habits intimately. This enables great recommendations but raises privacy concerns. Mitigate with local processing where possible and transparent data policies. Cost vs availability: Multi-region active-active costs 2× but provides 99.99% availability. For a service generating $30B/year, downtime is extremely costly.",
      commonMistakes: [
        {
          title: "One-size-fits-all quality for all markets",
          explanation:
            "A viewer on mobile with limited data caps needs different quality settings than a home fiber user. Adaptive defaults per market are essential.",
        },
        {
          title: "Ignoring the cost of multi-region redundancy",
          explanation:
            "Multi-region active-active doubles infrastructure cost. This is worth it only if the cost of downtime exceeds the redundancy cost.",
        },
      ],
      quizQuestions: [
        {
          question: "Why does ABR streaming help both quality and bandwidth efficiency?",
          options: [
            "It uses better codecs",
            "It matches quality to network — higher quality when possible, lower when needed, avoiding both rebuffering andwasted bandwidth",
            "It compresses more efficiently",
            "It uses less server compute",
          ],
          correctIndex: 1,
          explanation:
            "ABR provides the best possible quality for the current network. On fast connections, it delivers 4K. On slow mobile, it delivers 480p without buffering.",
        },
        {
          question: "What is the business case for Netflix's multi-region active-active deployment?",
          options: [
            "Regulatory compliance",
            "The cost of downtime ($30B/year revenue) far exceeds 2× infrastructure cost",
            "Performance improvement",
            "Marketing advantage",
          ],
          correctIndex: 1,
          explanation:
            "At $30B/year revenue, even 0.1% downtime costs $30M. Multi-region redundancy costing a fraction of that is clearly worth it.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "browse-service", "personalization", "transcoding", "asset-storage", "cache", "db", "evcache", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13"],
      annotations: [
        { nodeId: "cdn", text: "Open Connect: 95% local serving, saves $2B/year", type: "note" },
        { nodeId: "transcoding", text: "Content-aware encoding: per-scene optimization", type: "note" },
        { nodeId: "personalization", text: "Offline-trained models, pre-computed rows hourly", type: "note" },
        { nodeId: "evcache", text: "Per-request cache for low-latency ranking", type: "trade-off" },
      ],
    },
  ],
  architectureNodes: netflixNodes,
  architectureEdges: netflixEdges,
};

// ------------------------------------------------------------------
// YouTube / Video Platform Architecture Nodes
// ------------------------------------------------------------------
const youtubeNodes: Node<Record<string, unknown>>[] = [
  { id: "client", type: "presentation", position: { x: 50, y: 50 }, data: { kind: "client", label: "Client (Web/Mobile/App)" } },
  { id: "cdn", type: "presentation", position: { x: 200, y: 50 }, data: { kind: "cdn", label: "Google Cloud CDN" } },
  { id: "lb", type: "presentation", position: { x: 350, y: 50 }, data: { kind: "load-balancer", label: "Load Balancer" } },
  { id: "api-gateway", type: "presentation", position: { x: 500, y: 50 }, data: { kind: "api-gateway", label: "API Gateway" } },
  { id: "upload-service", type: "presentation", position: { x: 300, y: 180 }, data: { kind: "app-server", label: "Upload Service" } },
  { id: "transcoding", type: "presentation", position: { x: 450, y: 180 }, data: { kind: "transcoding", label: "Transcoding (VideoPipe)" } },
  { id: "metadata-service", type: "presentation", position: { x: 600, y: 180 }, data: { kind: "app-server", label: "Metadata Service" } },
  { id: "recommendation", type: "presentation", position: { x: 750, y: 180 }, data: { kind: "app-server", label: "Recommendation Engine" } },
  { id: "storage", type: "presentation", position: { x: 300, y: 310 }, data: { kind: "storage", label: "Blob Storage (GCS)" } },
  { id: "cache", type: "presentation", position: { x: 450, y: 310 }, data: { kind: "cache", label: "Redis / Memcache" } },
  { id: "db", type: "presentation", position: { x: 600, y: 310 }, data: { kind: "database", label: "BigTable / Spanner" } },
  { id: "mq", type: "presentation", position: { x: 750, y: 310 }, data: { kind: "message-queue", label: "Pub/Sub (Events)" } },
];

const youtubeEdges: Edge<Record<string, unknown>>[] = [
  { id: "e1", source: "client", target: "cdn", type: "default" },
  { id: "e2", source: "cdn", target: "lb", type: "default" },
  { id: "e3", source: "lb", target: "api-gateway", type: "default" },
  { id: "e4", source: "api-gateway", target: "metadata-service", type: "default" },
  { id: "e5", source: "api-gateway", target: "recommendation", type: "default" },
  { id: "e6", source: "client", target: "upload-service", type: "default" },
  { id: "e7", source: "upload-service", target: "storage", type: "default" },
  { id: "e8", source: "upload-service", target: "transcoding", type: "default" },
  { id: "e9", source: "transcoding", target: "storage", type: "default" },
  { id: "e10", source: "transcoding", target: "metadata-service", type: "default" },
  { id: "e11", source: "metadata-service", target: "cache", type: "default" },
  { id: "e12", source: "metadata-service", target: "db", type: "default" },
  { id: "e13", source: "recommendation", target: "mq", type: "default" },
  { id: "e14", source: "client", target: "cdn", type: "default", label: "video stream" },
];

export const youtubeConfig: CaseStudyConfig = {
  systemName: "YouTube / Video Platform",
  moduleId: "case-youtube",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Define upload, streaming, and interaction requirements at YouTube scale.",
      thinkingPrompt:
        "YouTube has 2B+ users uploading 500 hours of video per minute. How is this different from Netflix? What unique challenges does user-generated content bring?",
      designDecision:
        "Functional: video upload, transcoding, storage, streaming (play/seek), search, recommendations, likes/shares/comments, channels, live streaming. Non-functional: 2B users, 500 hours video uploaded/minute, 1B+ playback hours/day. Upload latency < 10min for 1GB video. Search latency < 200ms. 99.99% availability. Content moderation (copyright, harmful content) is a major challenge unique to UGC.",
      commonMistakes: [
        {
          title: "Treating YouTube like Netflix",
          explanation:
            "Netflix has 50K professional titles. YouTube has billions of UGC videos with varying quality, length, and content. Upload pipeline must handle everything.",
        },
        {
          title: "Ignoring content moderation at scale",
          explanation:
            "With 500 hours/minute uploaded, manual review is impossible. AI-based moderation (hash matching, ML classification) is essential.",
        },
      ],
      quizQuestions: [
        {
          question: "At 500 hours of video uploaded per minute, how much video is uploaded per day?",
          options: ["12,000 hours", "720,000 hours", "12M hours", "720M hours"],
          correctIndex: 1,
          explanation:
            "500 hours/minute × 60 minutes × 24 hours = 720,000 hours per day.",
        },
        {
          question: "What is the primary challenge unique to UGC platforms vs professional streaming?",
          options: [
            "Higher video quality",
            "Content moderation at scale — 500 hrs/min cannot be manually reviewed",
            "Lower costs",
            "Better recommendations",
          ],
          correctIndex: 1,
          explanation:
            "User-generated content means everything from professional productions to spam. AI moderation is essential because manual review cannot scale.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "Calculate storage, transcoding, and bandwidth requirements.",
      thinkingPrompt:
        "500 hours/minute of video at 1080p is how much storage per day? How many transcoding servers needed? What about bandwidth for 1B playback hours/day?",
      designDecision:
        "Storage: 500 hrs/min × 60 × 24 = 720K hrs/day. Average 1GB per hour (720p) = 720 TB/day uploaded. After transcoding to multiple qualities, 3-5× overhead = ~3 PB/day. Retention: popular videos stored hot, cold after 90 days. Transcoding: 720K hrs/day ÷ 24 hrs = 30K hrs/hour to transcode. At 1:1 transcode ratio (1hr video takes 1hr to transcode on 1 core), need 30K parallel transcoders. Use parallel processing + distributed job queue.",
      commonMistakes: [
        {
          title: "Not accounting for multi-quality transcoding storage overhead",
          explanation:
            "Each video is transcoded into 5+ quality levels (144p to 4K). This multiplies storage 3-5× beyond the original upload.",
        },
        {
          title: "Using real-time transcoding",
          explanation:
            "Transcoding 1 hour of video takes hours on a single machine. YouTube uses distributed transcoding clusters with massive parallelism.",
        },
      ],
      quizQuestions: [
        {
          question: "If 720 TB of video is uploaded daily and transcoded to 5 quality levels, what is the daily storage addition?",
          options: ["720 TB", "3.6 PB", "36 PB", "720 PB"],
          correctIndex: 1,
          explanation:
            "720 TB × 5 quality levels = 3.6 PB per day just for new content.",
        },
        {
          question: "Why does YouTube transcode uploaded videos into multiple quality levels?",
          options: [
            "To save storage",
            "To enable ABR streaming that adapts to each viewer's network speed",
            "To improve video quality",
            "To reduce upload time",
          ],
          correctIndex: 1,
          explanation:
            "ABR requires multiple pre-encoded versions. Users on mobile get 360p, fiber users get 4K — all from the same upload.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Design APIs for upload, streaming, and social features.",
      thinkingPrompt:
        "How do you handle large video uploads without timeout? What's the API for likes/comments? How do you prevent spam on social features?",
      designDecision:
        "Upload: POST /upload/video (initiate) → resumable upload in chunks (5MB chunks) → POST /upload/complete. Allows resume on failure. Streaming: GET /videos/:id/manifest (HLS/DASH) → client plays chunks from CDN. Social: POST /videos/:id/like, POST /videos/:id/comment, GET /videos/:id/comments. Rate limiting: 1 like per user per video (enforced server-side). Comment spam: ML filter + captcha for new accounts.",
      commonMistakes: [
        {
          title: "Using single-request upload for large videos",
          explanation:
            "A 4GB video upload over mobile would timeout. Chunked resumable upload is essential — if it fails, only the failed chunk is retried.",
        },
        {
          title: "Counting likes with eventual consistency",
          explanation:
            "Like counts are highly visible and expected to be accurate. They should be strongly consistent, not eventual.",
        },
      ],
      quizQuestions: [
        {
          question: "Why use chunked resumable upload instead of single PUT?",
          options: [
            "To save bandwidth",
            "To allow resume on failure — only the failed chunk is retried, not the entire file",
            "To encrypt uploads",
            "To compress uploads",
          ],
          correctIndex: 1,
          explanation:
            "A 4GB upload over mobile could take an hour. If it fails at 99%, chunked upload retries only the last chunk. Single PUT restarts from 0.",
        },
        {
          question: "Why should like counts be strongly consistent?",
          options: [
            "Performance is better",
            "Likes are highly visible social signals users expect to be accurate",
            "Storage is cheaper",
            "It's simpler to implement",
          ],
          correctIndex: 1,
          explanation:
            "Unlike timeline feeds, like counts are exact numbers shown prominently. Users notice discrepancies, making eventual consistency unacceptable.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "Upload pipeline, transcoding, and CDN delivery.",
      thinkingPrompt:
        "Draw the upload path from client to storage. What happens after upload? How does a video go from raw bytes to streamable content?",
      designDecision:
        "Upload path: Client → Upload Service → GCS (raw) → Triggers transcoding job queue. Transcoding pipeline: Distributed workers (VideoPipe) pull jobs, transcode to multiple qualities (144p to 4K), store back to GCS, notify Metadata Service. Streaming path: Client → API GW → Metadata Service (get manifest URL) → CDN → stream chunks from GCS. Social features: Like/Comment → API GW → Metadata Service → BigTable (strong consistency) → Pub/Sub for async fan-out to comment subscribers.",
      commonMistakes: [
        {
          title: "Transcoding synchronously in the upload request",
          explanation:
            "Transcoding takes hours. Synchronous transcoding would make uploads timeout. Always use async job queue for transcoding.",
        },
        {
          title: "Serving video directly from storage without CDN",
          explanation:
            "Without CDN, storage servers would be overwhelmed. Video must be cached at CDN edge locations close to viewers.",
        },
      ],
      quizQuestions: [
        {
          question: "Why is transcoding done asynchronously via a job queue?",
          options: [
            "To save compute",
            "Transcoding takes hours — synchronous response would timeout",
            "To improve quality",
            "To reduce storage",
          ],
          correctIndex: 1,
          explanation:
            "A 2-hour 4K video takes hours to transcode to multiple quality levels. Async queue allows the upload to return immediately while transcoding continues.",
        },
        {
          question: "What is the role of the CDN in YouTube's streaming architecture?",
          options: [
            "To store videos permanently",
            "To cache video chunks at edge locations close to viewers, reducing origin load",
            "To transcode videos",
            "To manage user accounts",
          ],
          correctIndex: 1,
          explanation:
            "Without CDN, YouTube's origin storage would be overwhelmed by millions of concurrent viewers. CDN edge servers cache popular content.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "upload-service", "transcoding", "metadata-service", "storage", "cache", "db", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e14"],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "Transcoding internals, recommendation system, and content moderation.",
      thinkingPrompt:
        "How does YouTube transcode 720K hours/day? How does the recommendation system work? How does content moderation at this scale work?",
      designDecision:
        "Transcoding: Use distributed transcoding (FFmpeg-based) with sharded processing. Each video is split into GOP (group of pictures) for parallel processing. 720K hrs/day requires massive parallelism — YouTube uses Borg (Kubernetes predecessor) for container orchestration. Recommendations: Two-tower neural network — one tower for video embedding, one for user embedding. Trained on watch history, search queries, context. Serving: Pre-computed per-user recommendations cached in Redis, refreshed hourly. Content moderation: Three layers — upload hash check (Content ID for copyrighted), AI vision/classifier for harmful content, human review for flagged content.",
      commonMistakes: [
        {
          title: "Transcoding video as a single monolithic job",
          explanation:
            "A 2-hour video takes 2 hours to transcode on 1 core. Sharding by GOP (group of pictures) allows parallel transcoding in minutes.",
        },
        {
          title: "Real-time recommendation computation per user",
          explanation:
            "Computing personalized recommendations for 2B users in real-time would require enormous compute. Pre-compute hourly and cache.",
        },
      ],
      quizQuestions: [
        {
          question: "How does sharding transcoding by GOP (group of pictures) help?",
          options: [
            "It improves video quality",
            "It allows parallel processing — each GOP is independent and can be transcoded on a different machine simultaneously",
            "It reduces storage",
            "It improves security",
          ],
          correctIndex: 1,
          explanation:
            "A 2-hour video has ~180K GOPs (2-second intervals). Each can be transcoded independently, reducing total time from hours to minutes.",
        },
        {
          question: "What is the 'two-tower' neural network in YouTube recommendations?",
          options: [
            "Two data centers for recommendations",
            "One network tower for video embeddings, one for user embeddings, learned jointly",
            "Two recommendation algorithms run in parallel",
            "A backup recommendation system",
          ],
          correctIndex: 1,
          explanation:
            "The two-tower model learns video embeddings and user embeddings in the same vector space. Dot product similarity gives personalized scores.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "upload-service", "transcoding", "metadata-service", "recommendation", "storage", "cache", "db", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13", "e14"],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Upload quality vs processing time, recommendation relevance vs exploration, censorship vs free speech.",
      thinkingPrompt:
        "Should YouTube accept any upload quality or enforce standards? How do you balance engagement-maximizing recommendations vs potential harm?",
      designDecision:
        "Upload quality: Accept any quality input (mobile to professional camera). Transcoding normalizes to ABR ladder. This enables anyone to upload while ensuring consistent playback. Recommendation trade-offs: Engagement-maximizing recommendations can create filter bubbles and promote extreme content. Mitigations: add diversity/explainability signals to recommendations, reduce recommendation of borderline content. Content moderation: Impossible to be perfect. Error on side of free speech for ambiguous cases, but remove clearly harmful content (CSAM, terrorism). Appeal process for mistaken removals.",
      commonMistakes: [
        {
          title: "Requiring standardized upload formats",
          explanation:
            "Forcing users to encode before upload excludes casual uploaders. Transcoding pipeline should accept any input.",
        },
        {
          title: "Optimizing recommendations purely for engagement",
          explanation:
            "Engagement-maximizing ML can amplify extreme content. Add diversity, quality, and safety signals to the recommendation objective.",
        },
      ],
      quizQuestions: [
        {
          question: "Why should YouTube's transcoding accept any input quality?",
          options: [
            "To save storage",
            "To enable anyone to upload without technical expertise — the platform normalizes quality",
            "To improve recommendations",
            "To reduce costs",
          ],
          correctIndex: 1,
          explanation:
            "If YouTube required pre-encoded uploads, casual mobile uploaders couldn't participate. Accept any input, transcode to ABR on the backend.",
        },
        {
          question: "Why add diversity signals to YouTube's recommendation objective?",
          options: [
            "To improve engagement only",
            "To prevent filter bubbles and reduce harmful content amplification",
            "To save compute",
            "To comply with regulations",
          ],
          correctIndex: 1,
          explanation:
            "Pure engagement maximization creates filter bubbles and can amplify harmful content. Diversity signals ensure users see varied perspectives.",
        },
      ],
      architectureNodeIds: ["client", "cdn", "lb", "api-gateway", "upload-service", "transcoding", "metadata-service", "recommendation", "storage", "cache", "db", "mq"],
      architectureEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13", "e14"],
      annotations: [
        { nodeId: "transcoding", text: "GOP-sharded parallel transcoding: minutes not hours", type: "note" },
        { nodeId: "storage", text: "Multi-quality ABR ladder: 144p to 4K", type: "note" },
        { nodeId: "recommendation", text: "Two-tower model: pre-computed hourly, cached in Redis", type: "note" },
        { nodeId: "metadata-service", text: "Strong consistency for likes/comments", type: "trade-off" },
      ],
    },
  ],
  architectureNodes: youtubeNodes,
  architectureEdges: youtubeEdges,
};
