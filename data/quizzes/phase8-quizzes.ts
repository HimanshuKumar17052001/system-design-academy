import type { QuizDefinition } from "@/types/curriculum";

export const interviewFrameworkQuiz: QuizDefinition = {
  id: "interview-framework-quiz",
  title: "Interview Framework",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "In a 45-minute system design interview, what is the recommended time allocation for each major phase?",
      options: [
        "10-15-10-10 (Requirements, Design, Trade-offs, Wrap-up)",
        "5-10-15-15-5 (Clarify, High-level, Deep dive, Trade-offs, Wrap-up)",
        "15-15-10-5 (Design, Deep dive, Trade-offs, Wrap-up)",
        "20-20-5 (Design, Trade-offs, Wrap-up)",
      ],
      correctIndex: 1,
      explanation:
        "The 5-10-15-15-5 rule is a widely recommended time split: 5 minutes clarifying requirements, 10 minutes on high-level design, 15 minutes on deep dive, 15 minutes on trade-offs and bottlenecks, and 5 minutes to wrap up and summarize.",
    },
    {
      type: "multiple-choice",
      question:
        "What is the primary goal of asking clarifying questions at the start of a system design interview?",
      options: [
        "To show off your knowledge of advanced algorithms",
        "To narrow scope, identify constraints, and align with the interviewer on functional and non-functional requirements",
        "To delay the design process while you think",
        "To demonstrate that you disagree with the interviewer's prompt",
      ],
      correctIndex: 1,
      explanation:
        "Clarifying questions reduce ambiguity. They help you understand functional requirements (features), non-functional requirements (scale, latency), and constraints (budget, team size) before proposing a solution.",
    },
    {
      type: "multiple-choice",
      question:
        "Which estimation technique is most useful for quickly validating whether a proposed storage or compute solution is feasible?",
      options: [
        "Exact benchmarking using production logs",
        "Back-of-the-envelope math (requests/sec, storage, bandwidth)",
        "Guessing based on intuition",
        "Asking the interviewer for the exact numbers",
      ],
      correctIndex: 1,
      explanation:
        "Back-of-the-envelope calculations let you sanity-check capacity needs in seconds. For example: 1M users × 10KB/profile = 10GB. This prevents proposing an infeasible design (e.g., storing petabytes in a single SQL instance).",
    },
    {
      type: "drag-drop",
      question: "Match each interview phase to its primary purpose:",
      pairs: [
        { left: "Clarify (5 min)", right: "Understand requirements, constraints, and success criteria" },
        { left: "High-level design (10 min)", right: "Sketch the API, data model, and basic component diagram" },
        { left: "Deep dive (15 min)", right: "Explore one component in detail (sharding, caching, consistency)" },
        { left: "Trade-offs (15 min)", right: "Discuss alternatives, failure modes, and scaling bottlenecks" },
      ],
      explanation:
        "Each phase has a distinct goal. Clarifying prevents building the wrong system. High-level design sets the skeleton. Deep dive shows technical depth. Trade-offs demonstrate mature engineering judgment.",
    },
    {
      type: "drag-drop",
      question: "Match each communication best practice to its benefit in an interview:",
      pairs: [
        { left: "Think aloud", right: "Allows the interviewer to follow your reasoning and correct misdirection early" },
        { left: "Verify assumptions", right: "Prevents building a solution for the wrong scale or constraints" },
        { left: "Summarize before diving deep", right: "Gives the interviewer a chance to redirect focus if needed" },
        { left: "Acknowledge unknowns", right: "Shows honesty and signals where you would research in practice" },
      ],
      explanation:
        "Communication is as important as technical correctness. Interviewers evaluate how you collaborate, handle ambiguity, and respond to feedback.",
    },
    {
      type: "fill-blank",
      question:
        "In the 5-10-15-15-5 framework, the first 5 minutes are spent [blank1] requirements. The next 10 minutes produce a [blank2]-level design with API and data model. The final 5 minutes should include a brief [blank3] of the design and open questions.",
      blanks: [
        {
          id: "blank1",
          label: "First phase action",
          correctAnswers: ["clarifying", "understanding", "scoping"],
        },
        {
          id: "blank2",
          label: "Design depth",
          correctAnswers: ["high", "high-level", "top-level"],
        },
        {
          id: "blank3",
          label: "Final phase output",
          correctAnswers: ["summary", "recap", "overview"],
        },
      ],
      explanation:
        "Time-boxing each phase keeps the interview on track and ensures you cover all dimensions: requirements, design, depth, trade-offs, and closure.",
    },
    {
      type: "fill-blank",
      question:
        "When drawing diagrams under pressure, it is better to use [blank1] boxes and [blank2] arrows than to attempt pixel-perfect icons. Label every [blank3] so the interviewer can read it easily without guessing.",
      blanks: [
        {
          id: "blank1",
          label: "Box style",
          correctAnswers: ["simple", "clean", "minimal", "basic"],
        },
        {
          id: "blank2",
          label: "Arrow style",
          correctAnswers: ["clear", "straight", "labeled"],
        },
        {
          id: "blank3",
          label: "Diagram element",
          correctAnswers: ["component", "box", "service", "arrow", "node"],
        },
      ],
      explanation:
        "Readability and speed beat aesthetics in live interviews. Simple diagrams that you can redraw or extend in seconds are far more valuable than ornate drawings.",
    },
    {
      type: "ordering",
      question:
        "Order the recommended steps for the first 5 minutes of a system design interview:",
      items: [
        "Restate the problem in your own words",
        "List functional requirements (features the system must support)",
        "List non-functional requirements (scale, latency, availability)",
        "Identify constraints (budget, team size, compliance)",
        "Confirm your understanding with the interviewer",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "Restating ensures alignment. Functional and non-functional requirements define what to build and at what scale. Constraints add realism. Confirming invites the interviewer to correct or add requirements.",
    },
  ],
};

export const interviewMockQuiz: QuizDefinition = {
  id: "interview-mock-quiz",
  title: "Mock Interview Simulator",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "When designing a chat application in an interview, which non-functional requirement is most commonly overlooked by candidates?",
      options: [
        "Message persistence",
        "Presence and typing indicators",
        "End-to-end encryption and offline delivery guarantees",
        "Avatar image upload",
      ],
      correctIndex: 2,
      explanation:
        "Many candidates focus on real-time delivery but forget offline delivery (store-and-forward), message ordering, and encryption. These are critical differentiators in a mature chat design.",
    },
    {
      type: "multiple-choice",
      question:
        "In a URL shortener interview, what is the most important follow-up question after presenting the basic hash-based design?",
      options: [
        "What is the CEO's favorite color?",
        "How do we handle collision resolution, analytics, and 301 vs 302 redirects?",
        "Should we use a relational or document database?",
        "What font should the short links use?",
      ],
      correctIndex: 1,
      explanation:
        "Follow-up questions demonstrate depth. Collisions, analytics, and redirect semantics are real-world concerns that separate a high-level sketch from a production-ready design.",
    },
    {
      type: "multiple-choice",
      question:
        "Which self-assessment rubric category evaluates whether you identified the right scale and estimated capacity correctly?",
      options: [
        "Communication",
        "Requirements gathering",
        "Back-of-the-envelope estimation",
        "Code quality",
      ],
      correctIndex: 2,
      explanation:
        "Estimation is its own rubric category. It checks if you reasoned about QPS, storage, bandwidth, and cache size before committing to a design.",
    },
    {
      type: "multiple-choice",
      question:
        "After presenting a high-level design for Twitter's news feed, what is a strong follow-up question from the interviewer?",
      options: [
        "What is the best programming language?",
        "How does the design handle the celebrity problem and fan-out on read vs write?",
        "Should the UI be blue or green?",
        "How many engineers work at Twitter?",
      ],
      correctIndex: 1,
      explanation:
        "The celebrity problem (users with millions of followers) is a classic deep-dive topic. It tests understanding of fan-out on write vs read, hybrid models, and timeline merging.",
    },
    {
      type: "drag-drop",
      question: "Match each mock interview prompt to a key deep-dive topic:",
      pairs: [
        { left: "Design a chat app", right: "WebSocket management, message ordering, and presence" },
        { left: "Design a URL shortener", right: "Base62 encoding, collision handling, and redirect semantics" },
        { left: "Design Twitter", right: "Fan-out on write vs read and the celebrity problem" },
      ],
      explanation:
        "Each prompt has well-known deep-dive areas. Preparing these shows the interviewer that you understand the domain beyond a superficial API listing.",
    },
    {
      type: "drag-drop",
      question: "Match each rubric dimension to what an interviewer is evaluating:",
      pairs: [
        { left: "Requirements gathering", right: "Did you ask clarifying questions and identify functional and non-functional needs?" },
        { left: "High-level design", right: "Did you propose a sensible architecture with API, data model, and basic components?" },
        { left: "Deep dive", right: "Can you explore one component in detail and justify your choices?" },
        { left: "Trade-offs", right: "Do you discuss alternatives, failure modes, and scaling limits?" },
      ],
      explanation:
        "Rubric-based self-assessment helps you diagnose weaknesses. Record a mock session and score yourself on each dimension to find gaps.",
    },
    {
      type: "fill-blank",
      question:
        "A strong mock interview answer for 'Design Twitter' should mention the [blank1] problem, discuss [blank2] on write versus read, and explain how a [blank3] approach can balance both.",
      blanks: [
        {
          id: "blank1",
          label: "Scale challenge",
          correctAnswers: ["celebrity", "celebrity problem", "high fan-out"],
        },
        {
          id: "blank2",
          label: "Distribution strategy",
          correctAnswers: ["fan-out", "fanout", "push"],
        },
        {
          id: "blank3",
          label: "Combined approach",
          correctAnswers: ["hybrid", "mixed", "blended"],
        },
      ],
      explanation:
        "The celebrity problem is the signature challenge for Twitter-like feeds. A hybrid fan-out strategy (push for normal users, pull for celebrities) is the industry-standard answer.",
    },
    {
      type: "ordering",
      question:
        "Order the typical follow-up questions an interviewer asks after a high-level URL shortener design:",
      items: [
        "How do you generate unique short codes at scale without collisions?",
        "What happens if two users submit the same long URL?",
        "How do you handle analytics for 10B redirects per month?",
        "Should you use 301 or 302 redirects, and why?",
        "How do you prevent enumeration attacks on sequential IDs?",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "These follow-ups progress from generation → deduplication → analytics → redirect semantics → security. Addressing them in this order shows structured thinking.",
    },
  ],
};

export const interviewPitfallsQuiz: QuizDefinition = {
  id: "interview-pitfalls-quiz",
  title: "Common Pitfalls",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which of the following is the best definition of over-engineering in a system design interview?",
      options: [
        "Adding too many comments in the code",
        "Designing for scale or features far beyond the stated requirements without justification",
        "Using a microservices architecture for every problem",
        "Both B and C",
      ],
      correctIndex: 3,
      explanation:
        "Over-engineering includes designing for unrealistic scale (e.g., planetary scale for a startup MVP) and defaulting to complex architectures (microservices, event sourcing) when a monolith or simple queue would suffice.",
    },
    {
      type: "multiple-choice",
      question:
        "What is the danger of premature optimization in an interview setting?",
      options: [
        "It makes the design too simple",
        "It consumes valuable time on low-impact details before the core architecture is validated",
        "It guarantees better performance",
        "It impresses the interviewer with deep knowledge",
      ],
      correctIndex: 1,
      explanation:
        "Premature optimization shifts focus from critical bottlenecks to minor tweaks. Interview time is limited; spend it on the highest-impact decisions (data model, sharding, consistency model) first.",
    },
    {
      type: "multiple-choice",
      question:
        "Which pitfall occurs when a candidate proposes a distributed system but never discusses what happens if the network partitions or a node crashes?",
      options: [
        "Over-engineering",
        "Missing non-functional requirements",
        "Ignoring failure modes",
        "Weak trade-off justification",
      ],
      correctIndex: 2,
      explanation:
        "Ignoring failure modes is a common red flag. A production design must address node failures, network partitions, disk corruption, and cascading failures. Always mention retries, circuit breakers, and replication.",
    },
    {
      type: "multiple-choice",
      question:
        "Why is 'jumping to solutions' considered a pitfall in system design interviews?",
      options: [
        "Because it shows confidence",
        "Because it skips requirement clarification and may solve the wrong problem",
        "Because the interviewer prefers slow answers",
        "Because it always leads to over-engineering",
      ],
      correctIndex: 1,
      explanation:
        "Jumping straight to a database choice or caching layer before understanding requirements often results in a mismatched design. Clarify first, then design.",
    },
    {
      type: "drag-drop",
      question: "Match each pitfall to a concrete example:",
      pairs: [
        { left: "Over-engineering", right: "Proposing a globally distributed CRDT data model for a single-region note-taking app" },
        { left: "Premature optimization", right: "Spending 10 minutes tuning a hash function before defining the data model" },
        { left: "Missing non-functional requirements", right: "Designing a chat app without mentioning latency or availability targets" },
        { left: "Weak trade-off justification", right: "Choosing eventual consistency 'because it is faster' without explaining the consistency window" },
      ],
      explanation:
        "Concrete examples help you self-diagnose. After each mock interview, review whether any of these patterns appeared in your answers.",
    },
    {
      type: "drag-drop",
      question: "Match each anti-pattern to the recommended fix:",
      pairs: [
        { left: "Over-engineering", right: "Scope to stated requirements; add extensions only after the core design is solid" },
        { left: "Premature optimization", right: "Identify the top 2-3 bottlenecks first; optimize only if estimations show they matter" },
        { left: "Ignoring failure modes", right: "Add a 'Failure Modes' section to your design before moving to trade-offs" },
        { left: "Weak trade-off justification", right: "Use a decision matrix: list options, criteria (latency, cost, complexity), and scores" },
      ],
      explanation:
        "Each pitfall has a structured antidote. Building these habits transforms a risky interview answer into a robust, senior-level design discussion.",
    },
    {
      type: "fill-blank",
      question:
        "A candidate who immediately picks [blank1] for every system without comparing it to a [blank2] or discussing [blank3] is likely over-engineering and using a one-size-fits-all architecture.",
      blanks: [
        {
          id: "blank1",
          label: "Default architecture",
          correctAnswers: ["microservices", "micro-services", "micro services", "event sourcing"],
        },
        {
          id: "blank2",
          label: "Simpler alternative",
          correctAnswers: ["monolith", "monolithic", "simpler design"],
        },
        {
          id: "blank3",
          label: "Evaluation criteria",
          correctAnswers: ["trade-offs", "tradeoffs", "trade offs", "context", "requirements"],
        },
      ],
      explanation:
        "Defaulting to microservices or event sourcing without context is a common over-engineering smell. Senior engineers match architecture to requirements, not the other way around.",
    },
    {
      type: "ordering",
      question:
        "Order the steps to avoid the 'jumping to solutions' pitfall during an interview:",
      items: [
        "Restate the problem to confirm understanding",
        "List functional and non-functional requirements",
        "Estimate scale (QPS, storage, users)",
        "Propose 2-3 high-level architecture options",
        "Select the best option based on requirements and trade-offs",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "This sequence forces disciplined problem-solving. Requirements and estimates create guardrails. Options and trade-offs demonstrate mature judgment.",
    },
  ],
};

export const interviewCheatsheetsQuiz: QuizDefinition = {
  id: "interview-cheatsheets-quiz",
  title: "Cheat Sheets & Quick Reference",
  passingScore: 70,
  questions: [
    {
      type: "multiple-choice",
      question:
        "Which HTTP status code range indicates a server-side error?",
      options: [
        "1xx",
        "2xx",
        "3xx",
        "4xx",
        "5xx",
      ],
      correctIndex: 4,
      explanation:
        "5xx codes (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout) indicate server-side failures.",
    },
    {
      type: "multiple-choice",
      question:
        "In the CAP theorem, if a network partition occurs, what must a distributed system sacrifice?",
      options: [
        "Partition tolerance",
        "Consistency or availability",
        "Throughput",
        "Durability",
      ],
      correctIndex: 1,
      explanation:
        "The CAP theorem states that during a partition, a distributed system must choose between consistency (all nodes see the same data) and availability (every request receives a response). Partition tolerance is mandatory in distributed systems.",
    },
    {
      type: "multiple-choice",
      question:
        "Which caching pattern updates the cache after writing to the database?",
      options: [
        "Cache-aside (lazy loading)",
        "Write-through",
        "Write-behind (write-back)",
        "Read-through",
      ],
      correctIndex: 1,
      explanation:
        "Write-through writes to both cache and database synchronously. Cache-aside loads data into cache on read miss. Write-behind writes to cache first and flushes to DB asynchronously.",
    },
    {
      type: "multiple-choice",
      question:
        "Which consistency pattern is best suited for a bank account balance update that must never lose a transaction?",
      options: [
        "Eventual consistency",
        "Read-after-write consistency",
        "Strong consistency / linearizability",
        "Causal consistency",
      ],
      correctIndex: 2,
      explanation:
        "Bank balances require strong consistency (or serializability) to prevent double-spending and ensure every transaction is reflected immediately and durably.",
    },
    {
      type: "drag-drop",
      question: "Match each system component to its typical responsibility:",
      pairs: [
        { left: "Load balancer", right: "Distribute traffic across healthy backend instances" },
        { left: "Message queue (Kafka)", right: "Decouple producers and consumers with durable, ordered delivery" },
        { left: "CDN", right: "Cache static content close to users to reduce latency and origin load" },
        { left: "Reverse proxy / API Gateway", right: "Rate limiting, authentication, and routing" },
      ],
      explanation:
        "These components appear in nearly every system design. Memorizing their roles helps you quickly sketch a high-level architecture.",
    },
    {
      type: "drag-drop",
      question: "Match each database type to a typical use case:",
      pairs: [
        { left: "Relational (PostgreSQL)", right: "Complex queries, transactions, and referential integrity" },
        { left: "Document (MongoDB)", right: "Flexible schemas, nested objects, and rapid prototyping" },
        { left: "Key-value (Redis)", right: "Caching, sessions, and leaderboards with sub-millisecond latency" },
        { left: "Wide-column (Cassandra)", right: "High write throughput, time-series data, and massive scale" },
      ],
      explanation:
        "Quick-reference knowledge of database strengths lets you defend a choice instantly in an interview without hesitation.",
    },
    {
      type: "fill-blank",
      question:
        "DNS resolution maps a human-readable [blank1] to an IP address. A [blank2] record maps a domain to an IPv4 address, while a [blank3] record maps a domain to another domain name.",
      blanks: [
        {
          id: "blank1",
          label: "Input type",
          correctAnswers: ["domain name", "hostname", "URL"],
        },
        {
          id: "blank2",
          label: "IPv4 record",
          correctAnswers: ["A"],
        },
        {
          id: "blank3",
          label: "Alias record",
          correctAnswers: ["CNAME"],
        },
      ],
      explanation:
        "DNS is foundational. A records point to IPv4 addresses; CNAME records create aliases; MX records handle mail; NS records delegate to name servers.",
    },
    {
      type: "fill-blank",
      question:
        "In a microservices architecture, the [blank1] pattern isolates failures so a single slow service cannot exhaust resources across the system. The [blank2] pattern retries failed requests with exponential [blank3] and jitter to avoid thundering herds.",
      blanks: [
        {
          id: "blank1",
          label: "Resource isolation pattern",
          correctAnswers: ["bulkhead", "circuit breaker", "bulkhead pattern"],
        },
        {
          id: "blank2",
          label: "Resilience pattern",
          correctAnswers: ["retry", "retry pattern"],
        },
        {
          id: "blank3",
          label: "Backoff strategy",
          correctAnswers: ["backoff", "back-off", "delay"],
        },
      ],
      explanation:
        "Bulkheads limit resource pools per dependency. Retries with exponential backoff and jitter prevent synchronized retry storms that can overwhelm a recovering service.",
    },
    {
      type: "ordering",
      question:
        "Order the steps of a typical case-study walkthrough from start to finish:",
      items: [
        "Clarify requirements and estimate scale",
        "Design the high-level architecture (API, data model, components)",
        "Choose a deep-dive component and explore trade-offs",
        "Discuss failure modes and mitigation strategies",
        "Summarize decisions and propose monitoring/next steps",
      ],
      correctOrder: [0, 1, 2, 3, 4],
      explanation:
        "This sequence mirrors a real interview flow. It ensures you cover all rubric dimensions: requirements, design, depth, resilience, and closure.",
    },
  ],
};
