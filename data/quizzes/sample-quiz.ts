import type { QuizDefinition } from "@/types/curriculum";

export const sampleQuiz: QuizDefinition = {
  id: "sd-fundamentals-quiz",
  title: "System Design Fundamentals",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "You are designing a social media feed. Which consistency model is MOST appropriate for the 'like' count on a post?",
      options: [
        "Strong consistency with synchronous cross-region replication",
        "Eventual consistency with asynchronous replication",
        "Linearizable consistency with Paxos consensus per like",
        "Serializable isolation with two-phase commit",
      ],
      correctIndex: 1,
      explanation:
        "Like counts on social media tolerate brief staleness. Eventual consistency allows high write throughput and low latency. Strong consistency would create unnecessary bottlenecks and increase latency for a metric where exact real-time precision is not business-critical.",
    },
    {
      type: "multiple-choice",
      question:
        "A single API server handles 1,000 RPS at 50% CPU. You need to support 10,000 RPS. The server is stateless. What is the most cost-effective approach?",
      options: [
        "Vertical scaling: upgrade to a machine with 10× CPU cores",
        "Horizontal scaling: deploy 10 stateless instances behind a load balancer",
        "Add a CDN to cache API responses",
        "Rewrite the API in a faster language like C++",
      ],
      correctIndex: 1,
      explanation:
        "Horizontal scaling is the standard approach for stateless services. 10 instances behind a load balancer handle 10,000 RPS with no code changes. Vertical scaling hits hardware ceilings and creates a single point of failure. A CDN caches static content, not dynamic API responses. Rewriting in C++ is expensive and usually unnecessary.",
    },
    {
      type: "drag-drop",
      question: "Match each HLD concept to its correct description:",
      pairs: [
        {
          left: "Load Balancer",
          right: "Distributes incoming traffic across multiple servers",
        },
        {
          left: "CDN",
          right: "Caches static assets at edge locations near users",
        },
        {
          left: "Message Queue",
          right: "Decouples producers and consumers for async processing",
        },
        {
          left: "Cache",
          right: "Stores frequently accessed data in memory for fast reads",
        },
      ],
      explanation:
        "Load balancers distribute traffic for horizontal scaling. CDNs reduce latency by serving content from geographically close edge servers. Message queues enable async architectures and absorb traffic spikes. Caches reduce database load by serving hot data from memory.",
    },
    {
      type: "fill-blank",
      question:
        "The 4-step system design process is: 1) [blank1], 2) [blank2], 3) [blank3], 4) [blank4].",
      blanks: [
        {
          id: "blank1",
          label: "Step 1",
          correctAnswers: [
            "clarify requirements",
            "clarify",
            "requirements",
            "gather requirements",
            "understand requirements",
          ],
        },
        {
          id: "blank2",
          label: "Step 2",
          correctAnswers: [
            "high-level design",
            "hld",
            "high level design",
            "sketch design",
            "architecture",
          ],
        },
        {
          id: "blank3",
          label: "Step 3",
          correctAnswers: [
            "deep dive",
            "detail design",
            "detailed design",
            "component design",
            "design details",
          ],
        },
        {
          id: "blank4",
          label: "Step 4",
          correctAnswers: [
            "trade-offs",
            "tradeoffs",
            "wrap-up",
            "wrap up",
            "wrapup",
            "discuss trade-offs",
            "evaluate trade-offs",
          ],
        },
      ],
      explanation:
        "The canonical interview process is: (1) Clarify requirements — functional, non-functional, scale. (2) High-Level Design — APIs, services, data stores, data flow. (3) Deep Dive — detail 2-3 critical components. (4) Trade-offs & Wrap-up — summarize choices, identify bottlenecks, suggest improvements.",
    },
    {
      type: "ordering",
      question:
        "Order the following steps of what happens when you type 'google.com' in a browser:",
      items: [
        "Browser checks its local cache for the IP address",
        "OS performs a DNS lookup via recursive resolver",
        "TCP three-way handshake with the server",
        "TLS handshake (if HTTPS)",
        "HTTP GET request sent to the server",
        "Server processes request and sends HTTP response",
      ],
      correctOrder: [0, 1, 2, 3, 4, 5],
      explanation:
        "The full request lifecycle: (1) Browser cache check → (2) OS / recursive DNS resolver → (3) TCP SYN/SYN-ACK/ACK → (4) TLS certificate exchange + key agreement → (5) HTTP request over established connection → (6) Server routing, business logic, DB queries, response assembly.",
    },
  ],
};
