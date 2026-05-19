import type { Module } from "@/types/curriculum";

export const primerModules: Module[] = [
  {
    id: "sd-performance-scalability",
    number: 101,
    category: "foundations",
    title: "Performance vs Scalability",
    subtitle: "When slow matters vs when growth matters — understanding the difference.",
    difficulty: "Beginner",
    estimatedHours: 1,
    icon: "TrendingUp",
    prerequisites: [],
    lessons: [
      {
        id: "l-ps-intro",
        title: "Performance vs Scalability",
        content: [
          {
            type: "text",
            content: "A service is SCALABLE if increasing resources yields proportional performance increase. A service has a PERFORMANCE problem if it's slow for a single user."
          },
          {
            type: "callout",
            variant: "info",
            content: "Example: If doubling your servers doubles your throughput, you're scalable. If adding more users makes everyone slower without adding resources, you have a performance problem."
          },
          {
            type: "table",
            headers: ["Symptom", "Problem Type", "Fix"],
            rows: [
              ["Slow for single user", "Performance", "Optimize code, add caching"],
              ["Slow under heavy load", "Scalability", "Add resources, scale horizontally"],
              ["Works with 100 users, fails with 10000", "Scalability", "Redesign for scale"]
            ],
            caption: "Performance vs Scalability diagnosis"
          }
        ]
      }
    ],
    checkpoint: {
      prompt: "A service handles 1000 users fine but slows to a crawl with 2000 users. Is this a performance or scalability problem?",
      answer: "Scalability problem. The service works for a single user (no performance issue at small scale) but degrades under heavy load. Fix: scale horizontally, add resources, or redesign for higher capacity.",
      type: "text"
    }
  },
  {
    id: "sd-cap-theorem",
    number: 102,
    category: "foundations",
    title: "CAP Theorem",
    subtitle: "Consistency, Availability, Partition tolerance — choose 2 out of 3.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Shield",
    prerequisites: ["sd-performance-scalability"],
    lessons: [
      {
        id: "l-cap-intro",
        title: "CAP Theorem",
        content: [
          {
            type: "text",
            content: "The CAP theorem states that a distributed system can provide at most two of three guarantees: Consistency, Availability, and Partition tolerance. Since network partitions are unavoidable, you must choose between CP (Consistency + Partition tolerance) and AP (Availability + Partition tolerance)."
          },
          {
            type: "bullets",
            items: [
              "CP systems: Sacrifice availability during partitions. Example: Traditional databases, Zookeeper, etcd.",
              "AP systems: Sacrifice strong consistency during partitions. Example: Cassandra, DynamoDB, CouchDB.",
              "Eventual consistency is acceptable for many use cases (social media likes, comments)."
            ]
          },
          {
            type: "callout",
            variant: "warning",
            content: "Networks aren't reliable. Always assume partitions will happen. Design for the case you choose, not for the ideal case."
          },
          {
            type: "table",
            headers: ["Scenario", "CP (Consistency)", "AP (Availability)"],
            rows: [
              ["Network partition occurs", "Block requests until resolved", "Continue serving stale data"],
              ["Trade-off", "Strong consistency, may reject writes", "Eventual consistency, always accept writes"],
              ["When to choose", "Financial systems, inventory, primary DB", "Social feeds, analytics, shopping carts"]
            ],
            caption: "CP vs AP: When to use each"
          }
        ]
      }
    ],
    checkpoint: {
      prompt: "You are designing a shopping cart service. A user adds an item, then loses connection mid-request. Should this be CP or AP?",
      answer: "AP. Shopping carts should always accept writes (availability) even during partitions. Eventual consistency is fine — if the item is occasionally missing from the cart for a few seconds, users can re-add it. Losing a sale is worse than a brief inconsistency.",
      type: "text"
    }
  },
  {
    id: "sd-consistency-patterns",
    number: 103,
    category: "foundations",
    title: "Consistency Patterns",
    subtitle: "Weak, Eventual, and Strong consistency — when each matters.",
    difficulty: "Intermediate",
    estimatedHours: 1.5,
    icon: "RefreshCw",
    prerequisites: ["sd-cap-theorem"],
    lessons: [
      {
        id: "l-consistency-intro",
        title: "Consistency Patterns",
        content: [
          {
            type: "bullets",
            items: [
              "Weak consistency: Data may not be immediately visible after a write. Use when: gaming leaderboards, real-time metrics, IoT sensor data.",
              "Eventual consistency: Data becomes consistent after some delay (usually milliseconds). Use when: email, social media posts, analytics.",
              "Strong consistency: Data is immediately visible to all readers after a write. Use when: bank transactions, inventory management, payment processing."
            ]
          },
          {
            type: "callout",
            variant: "info",
            content: "The right consistency level depends on your use case. Financial systems need strong consistency; social media can tolerate eventual consistency. Most systems use a mix."
          },
          {
            type: "table",
            headers: ["Pattern", "Latency", "Use Cases"],
            rows: [
              ["Weak", "Lowest", "Gaming, IoT, real-time bidding"],
              ["Eventual", "Medium", "CDN, DNS, social media, search indexes"],
              ["Strong", "Highest", "Databases, financial transactions, inventory"]
            ],
            caption: "Consistency patterns and their trade-offs"
          }
        ]
      }
    ],
    checkpoint: {
      prompt: "A stock trading platform shows a user's balance. The user sells shares and immediately checks their balance. Which consistency pattern is needed?",
      answer: "Strong consistency. Financial transactions require immediate visibility of updates. A trader might sell shares and immediately buy others — if the balance update is not immediately visible, they could overdraw.",
      type: "text"
    }
  },
  {
    id: "sd-availability-patterns",
    number: 104,
    category: "foundations",
    title: "Availability Patterns",
    subtitle: "Failover and replication strategies for high availability.",
    difficulty: "Intermediate",
    estimatedHours: 1.5,
    icon: "CheckCircle",
    prerequisites: ["sd-performance-scalability"],
    lessons: [
      {
        id: "l-availability-intro",
        title: "Availability Patterns",
        content: [
          {
            type: "bullets",
            items: [
              "Active-passive failover: Primary server handles traffic. On failure, standby takes over. Heartbeat keeps standby ready.",
              "Active-active failover: Multiple servers handle traffic simultaneously. All are healthy. On failure, traffic redirects to remaining servers.",
              "Replication: Data is copied to replicas. Master handles writes, replicas handle reads. Asynchronous for performance, synchronous for consistency."
            ]
          },
          {
            type: "callout",
            variant: "info",
            content: "High availability is achieved through redundancy. No single point of failure should exist in the critical path."
          },
          {
            type: "table",
            headers: ["Availability", "Downtime/Year", "Use Cases"],
            rows: [
              ["99%", "3.65 days", "Development, internal tools"],
              ["99.9%", "8.77 hours", "User-facing apps, e-commerce"],
              ["99.99%", "52.6 minutes", "Critical services, payment processing"],
              ["99.999%", "5.26 minutes", "Telecom, emergency systems"],
              ["99.9999%", "31.5 seconds", "Aerospace, medical devices"]
            ],
            caption: "Availability percentages and their real-world impact"
          }
        ]
      }
    ],
    checkpoint: {
      prompt: "You are designing a payment processing service that must never go down. What availability target should you aim for and why?",
      answer: "99.99% (52.6 minutes downtime/year) or higher. Payment processing is critical infrastructure — even 8.77 hours downtime (99.9%) means lost transactions and customer trust. Use active-active failover across multiple data centers with real-time replication.",
      type: "text"
    }
  },
  {
    id: "sd-latency-throughput",
    number: 105,
    category: "foundations",
    title: "Latency vs Throughput",
    subtitle: "Speed of operations vs volume of operations — both matter.",
    difficulty: "Beginner",
    estimatedHours: 1,
    icon: "Gauge",
    prerequisites: [],
    lessons: [
      {
        id: "l-lat-throughput-intro",
        title: "Latency vs Throughput",
        content: [
          {
            type: "bullets",
            items: [
              "Latency: How long a single operation takes. Measured in ms. Example: 50ms to process one request.",
              "Throughput: How many operations per second. Measured in QPS, RPS, or ops/sec. Example: 2000 requests per second.",
              "Goal: Minimize latency while maximizing throughput. Often a trade-off exists."
            ]
          },
          {
            type: "callout",
            variant: "tip",
            content: "Maximum throughput = 1000ms / average latency. If avg latency is 50ms, max throughput is 20 QPS. To increase throughput, reduce latency or scale horizontally."
          },
          {
            type: "text",
            content: "Optimizing latency vs throughput depends on your load. Under light load, focus on latency (fast response). Under heavy load, focus on throughput (handle volume)."
          }
        ]
      }
    ],
    checkpoint: {
      prompt: "Your API has 100ms average latency. What is the maximum throughput, and how would you increase it?",
      answer: "Maximum throughput = 1000ms / 100ms = 10 QPS. To increase: 1) Reduce latency (optimize code, add caching, use faster DB). 2) Scale horizontally (add more servers to handle more concurrent requests).",
      type: "text"
    }
  }
];