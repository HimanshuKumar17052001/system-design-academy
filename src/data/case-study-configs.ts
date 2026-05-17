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
