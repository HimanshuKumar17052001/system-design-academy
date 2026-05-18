import type {
  LabKind,
  SimulationResult,
  SimulationMetric,
  SimulationStateItem,
} from "@/types/curriculum";

export interface SimulationControls {
  [key: string]: number | boolean | string;
}

export interface SimulationParameters {
  [key: string]: number | boolean | string;
}

export function runSimulation(
  kind: LabKind,
  controls: SimulationControls,
  parameters: SimulationParameters
): SimulationResult {
  switch (kind) {
    case "boe-calculator":
      return runBoECalculator(parameters);
    case "http-tracer":
      return runHTTPTracer();
    case "scaling-simulator":
      return runScalingSimulator(controls);
    case "cap-playground":
      return runCAPPlayground(controls);
    case "cache-strategy":
      return runCacheStrategy(controls);
    case "rate-limiter":
      return runRateLimiter(controls);
    case "case-study-walkthrough":
      return runCaseStudySimulation();
    case "deployment-visualizer":
      return runDeploymentVisualizer(controls);
    case "chaos-lab":
      return runChaosLab(controls);
    case "autoscaler":
      return runAutoscaler(controls);
    case "event-flow-builder":
      return runEventFlowSimulation(controls);
    case "saga-simulator":
      return runSagaSimulation(controls);
    case "realtime-flow-builder":
      return runRealtimeFlowSimulation(controls);
    case "ml-pipeline-simulator":
      return runMLPipelineSimulation(controls);
    case "security-simulator":
      return runSecuritySimulation(controls);
    case "payment-simulator":
      return runPaymentSimulation(controls);
    case "global-scale-simulator":
      return runGlobalScaleSimulation(controls);
    case "interview-timer":
      return runInterviewTimerSimulation();
    case "system-design-canvas":
      return runSystemDesignCanvasSimulation();
    case "pitfall-detector":
      return runPitfallDetectorSimulation();
    case "load-balancer":
      return runLoadBalancerSimulation(controls, parameters);
    case "consistent-hash":
      return runConsistentHashSimulation(controls);
    case "traffic-simulator":
      return runTrafficSimulatorSimulation(controls);
    case "db-scaling":
      return runDBScalingSimulation(controls);
    case "mq-visualizer":
      return runMessageQueueSimulation(controls);
    default:
      return {
        title: "Simulation Result",
        summary: "No simulation data available for this lab kind.",
        output: [],
        metrics: [],
        state: [],
        events: [],
      };
  }
}

function runStub(title: string, summary: string): SimulationResult {
  return {
    title,
    summary,
    output: ["Interactive mode — use the controls above to simulate."],
    metrics: [],
    state: [],
    events: ["Simulation initialized", "Waiting for user input..."],
  };
}

function runLoadBalancerSimulation(
  controls: SimulationControls,
  parameters: SimulationParameters
): SimulationResult {
  const algorithm = (controls.algorithm as string) || "round-robin";
  const serverCount = Number(controls.servers ?? 3);
  const speed = Number(controls.speed ?? 1);

  const events = [
    `Load balancer initialized with ${serverCount} backend servers`,
    `Algorithm set to ${algorithm}`,
    `Speed multiplier: ${speed}x`,
    "Health checks running every 2 seconds",
    "Requests routing based on selected algorithm...",
  ];

  const metrics: SimulationMetric[] = [
    { label: "Servers", value: serverCount, unit: "", tone: "neutral" },
    { label: "Algorithm", value: algorithm, tone: "neutral" },
    { label: "Speed", value: `${speed}x`, tone: "neutral" },
  ];

  const state: SimulationStateItem[] = [
    { label: "Status", value: "Running", status: "running", tone: "good" },
    { label: "Algorithm", value: algorithm, tone: "neutral" },
    { label: "Servers", value: serverCount, tone: "neutral" },
    { label: "Speed", value: `${speed}x`, tone: "neutral" },
  ];

  return {
    title: "Load Balancer Simulation",
    summary: `Simulating ${algorithm} load balancing across ${serverCount} servers at ${speed}x speed. Use the interactive controls above to observe request distribution, health checks, and algorithm behavior under burst traffic.`,
    output: [
      `Servers: ${serverCount}`,
      `Algorithm: ${algorithm}`,
      `Speed: ${speed}x`,
      "Interactive mode — adjust server weights, mark servers as slow/failed, and observe traffic redistribution.",
    ],
    metrics,
    state,
    events,
  };
}

function runConsistentHashSimulation(controls: SimulationControls): SimulationResult {
  const nodeCount = Number(controls.nodes ?? 3);
  const virtualNodes = Number(controls.virtualNodes ?? 3);
  const useVirtual = controls.useVirtualNodes === true || controls.useVirtualNodes === "true";
  const keyCount = Number(controls.keyCount ?? 12);

  const events = [
    `Initialized consistent hash ring with ${nodeCount} physical nodes`,
    useVirtual ? `Added ${virtualNodes} virtual nodes per physical (total ${nodeCount * virtualNodes})` : "Using physical nodes only",
    `Distributing ${keyCount} keys across ring`,
    "Hash space: 0 to 2^32-1",
    "Each key maps to the first node clockwise on the ring",
    useVirtual ? "Virtual nodes provide better distribution and easier node add/remove" : "Adding/removing nodes causes significant key remapping",
  ];

  const metrics: SimulationMetric[] = [
    { label: "Physical Nodes", value: nodeCount, unit: "", tone: "neutral" },
    { label: "Virtual Nodes", value: useVirtual ? nodeCount * virtualNodes : 0, unit: "", tone: "neutral" },
    { label: "Keys", value: keyCount, unit: "", tone: "neutral" },
    { label: "Rebalance on Add", value: useVirtual ? "1/n" : "~1", unit: "fraction", tone: "good" },
  ];

  const state: SimulationStateItem[] = [
    { label: "Ring Status", value: "Healthy", status: "success", tone: "good" },
    { label: "Node Count", value: useVirtual ? nodeCount * virtualNodes : nodeCount, tone: "neutral" },
    { label: "Virtual Nodes", value: useVirtual ? "On" : "Off", tone: "neutral" },
  ];

  return {
    title: "Consistent Hash Simulation",
    summary: `Simulating consistent hashing with ${nodeCount} nodes${useVirtual ? ` and ${virtualNodes} virtual nodes each` : ''}. Keys are distributed using a hash ring to minimize reorganization when nodes are added or removed.`,
    output: [
      `Physical nodes: ${nodeCount}`,
      `Virtual nodes per node: ${useVirtual ? virtualNodes : "disabled"}`,
      `Total ring entries: ${useVirtual ? nodeCount * virtualNodes : nodeCount}`,
      `Keys to distribute: ${keyCount}`,
      `Expected distribution: ~${Math.round(keyCount / (useVirtual ? nodeCount * virtualNodes : nodeCount))} keys per node`,
    ],
    metrics,
    state,
    events,
  };
}

function runTrafficSimulatorSimulation(controls: SimulationControls): SimulationResult {
  const cdnEnabled = controls.cdnEnabled !== false;
  const cacheEnabled = controls.cacheEnabled !== false;
  const load = Number(controls.load ?? 1);
  const speed = Number(controls.speed ?? 1);

  const cacheHitRate = cdnEnabled ? 0.6 : 0;
  const avgLatency = cdnEnabled ? 50 : cacheEnabled ? 120 : 250;
  const dbQueries = cacheEnabled ? 0.4 : 1.0;

  const events = [
    cdnEnabled ? "CDN enabled - requests may be served from edge cache" : "CDN disabled - all requests go to origin",
    cacheEnabled ? "Application cache enabled - reduces database load" : "Application cache disabled",
    `Traffic load: ${load}x`,
    `Average latency: ~${avgLatency}ms`,
    `Cache hit rate: ${Math.round(cacheHitRate * 100)}%`,
    `DB query ratio: ${dbQueries * 100}%`,
  ];

  const metrics: SimulationMetric[] = [
    { label: "Avg Latency", value: avgLatency, unit: "ms", tone: avgLatency < 100 ? "good" : avgLatency < 200 ? "warning" : "danger" },
    { label: "Cache Hit Rate", value: `${Math.round(cacheHitRate * 100)}%`, tone: cacheHitRate > 0.5 ? "good" : cacheHitRate > 0.2 ? "warning" : "danger" },
    { label: "DB Query Ratio", value: `${Math.round(dbQueries * 100)}%`, tone: dbQueries < 0.5 ? "good" : dbQueries < 0.8 ? "warning" : "danger" },
    { label: "Throughput", value: load * 1000, unit: "req/s", tone: "neutral" },
  ];

  const state: SimulationStateItem[] = [
    { label: "CDN", value: cdnEnabled ? "Enabled" : "Disabled", tone: cdnEnabled ? "good" : "neutral" },
    { label: "App Cache", value: cacheEnabled ? "Enabled" : "Disabled", tone: cacheEnabled ? "good" : "neutral" },
    { label: "Traffic", value: `${load}x`, tone: "neutral" },
  ];

  return {
    title: "Traffic Flow Simulation",
    summary: `Simulating request flow through CDN (${cdnEnabled ? "enabled" : "disabled"}), app cache (${cacheEnabled ? "enabled" : "disabled"}), and database at ${load}x load.`,
    output: [
      `Path: Client → ${cdnEnabled ? "CDN" : ""} → ${cacheEnabled ? "App Cache" : ""} → App Server → Database`,
      `Latency: ${avgLatency}ms average`,
      `Cache hit rate: ${Math.round(cacheHitRate * 100)}%`,
      `DB query fraction: ${Math.round(dbQueries * 100)}%`,
    ],
    metrics,
    state,
    events,
  };
}

function runDBScalingSimulation(controls: SimulationControls): SimulationResult {
  const mode = (controls.mode as string) || "single";
  const readQps = Number(controls.readQps ?? 100);
  const writeQps = Number(controls.writeQps ?? 10);
  const replicaCount = Number(controls.replicas ?? 2);
  const shardCount = Number(controls.shards ?? 3);

  const totalQps = readQps + writeQps;
  let connections = totalQps;
  let latency = 5;
  let lag = 0;

  if (mode === "replica") {
    connections = Math.min(writeQps + readQps / (replicaCount + 1), 500);
    latency = 8;
    lag = Math.round(readQps / (replicaCount * 200));
  } else if (mode === "shard") {
    const perShardQps = totalQps / shardCount;
    connections = Math.min(perShardQps, 500);
    latency = 12;
  }

  const events = [
    `Mode: ${mode}`,
    mode === "single" ? "All read/write on single primary" : "",
    mode === "replica" ? `${replicaCount} read replicas distributing ${readQps} read QPS` : "",
    mode === "shard" ? `${shardCount} shards distributing load horizontally` : "",
    `Total connections: ${connections}/500`,
    `Estimated latency: ${latency}ms`,
    mode === "replica" ? `Replication lag: ~${lag}ms` : "",
  ].filter(Boolean);

  const metrics: SimulationMetric[] = [
    { label: "Total QPS", value: totalQps, unit: "", tone: totalQps > 2000 ? "warning" : "good" },
    { label: "Connections", value: connections, unit: "/500", tone: connections > 400 ? "danger" : connections > 300 ? "warning" : "good" },
    { label: "Latency", value: latency, unit: "ms", tone: latency < 15 ? "good" : latency < 30 ? "warning" : "danger" },
    { label: "Replication Lag", value: lag, unit: "ms", tone: lag < 50 ? "good" : lag < 200 ? "warning" : "danger" },
  ];

  const state: SimulationStateItem[] = [
    { label: "Mode", value: mode, tone: "neutral" },
    { label: "Replicas", value: mode === "replica" ? replicaCount : 0, tone: "neutral" },
    { label: "Shards", value: mode === "shard" ? shardCount : 0, tone: "neutral" },
    { label: "Write QPS", value: writeQps, tone: "neutral" },
  ];

  return {
    title: "DB Scaling Simulation",
    summary: `Simulating ${mode} database scaling with ${readQps} read QPS and ${writeQps} write QPS.`,
    output: [
      `Scaling mode: ${mode}`,
      `Read QPS: ${readQps}, Write QPS: ${writeQps}`,
      mode === "replica" ? `Read replicas: ${replicaCount}` : "",
      mode === "shard" ? `Shard count: ${shardCount}` : "",
      `Max connections: ${connections}/500`,
      `Avg latency: ${latency}ms`,
    ].filter(Boolean),
    metrics,
    state,
    events,
  };
}

function runMessageQueueSimulation(controls: SimulationControls): SimulationResult {
  const queueType = (controls.queueType as string) || "point-to-point";
  const consumerCount = Number(controls.consumers ?? 3);
  const deliveryMode = (controls.deliveryMode as string) || "at-least-once";
  const throughput = Number(controls.throughput ?? 50);

  const events = [
    `Queue type: ${queueType}`,
    `Consumer count: ${consumerCount}`,
    `Delivery mode: ${deliveryMode}`,
    `Target throughput: ${throughput} msgs/s`,
    deliveryMode === "at-least-once" ? "Messages may be redelivered (compensate with idempotency)" : "",
    deliveryMode === "at-most-once" ? "Messages may be lost (acceptable for logging)" : "",
    deliveryMode === "exactly-once" ? "Duplicates eliminated via deduplication (higher latency)" : "",
    queueType === "pub-sub" ? "Fan-out to all consumers - each gets every message" : "Load-balanced across consumers",
  ].filter(Boolean);

  const metrics: SimulationMetric[] = [
    { label: "Consumers", value: consumerCount, unit: "", tone: "neutral" },
    { label: "Queue Type", value: queueType === "point-to-point" ? "P2P" : "Pub/Sub", tone: "neutral" },
    { label: "Delivery", value: deliveryMode.split("-")[0], tone: "neutral" },
    { label: "Throughput", value: throughput, unit: "msg/s", tone: throughput > 100 ? "good" : "warning" },
  ];

  const state: SimulationStateItem[] = [
    { label: "Queue", value: queueType === "point-to-point" ? "Point-to-Point" : "Pub/Sub", tone: "neutral" },
    { label: "Consumers", value: consumerCount, tone: "neutral" },
    { label: "Mode", value: deliveryMode, tone: "neutral" },
    { label: "Status", value: "Running", status: "running", tone: "good" },
  ];

  return {
    title: "Message Queue Simulation",
    summary: `Simulating ${queueType} queue with ${consumerCount} consumers using ${deliveryMode} delivery mode at ${throughput} msgs/s throughput.`,
    output: [
      `Queue type: ${queueType}`,
      `Consumers: ${consumerCount}`,
      `Delivery guarantee: ${deliveryMode}`,
      `Target throughput: ${throughput} msgs/s`,
      deliveryMode === "at-least-once" ? "Requires idempotent consumers" : "",
    ].filter(Boolean),
    metrics,
    state,
    events,
  };
}

function runArchitectureBuilderSimulation(): SimulationResult {
  const events = [
    "Canvas initialized",
    "Drag nodes from the palette onto the canvas",
    "Connect nodes with edges (sync, async, bottleneck)",
    "Run Validate to check design best practices",
    "Save exports the graph as JSON",
  ];

  const metrics: SimulationMetric[] = [
    { label: "Node Types", value: 9, unit: "", tone: "neutral" },
    { label: "Edge Types", value: 3, unit: "", tone: "neutral" },
  ];

  const state: SimulationStateItem[] = [
    { label: "Status", value: "Ready", status: "idle", tone: "neutral" },
    { label: "Validation", value: "Not run", tone: "neutral" },
  ];

  return {
    title: "Architecture Canvas",
    summary:
      "Drag-and-drop architecture builder powered by React Flow. Add nodes, connect them, validate your design against system design best practices, and export as JSON.",
    output: [
      "Canvas ready.",
      "Available nodes: Client, Load Balancer, API Gateway, App Server, Cache, Database, Message Queue, CDN, Blob Storage.",
      "Edge types: Sync (solid), Async (dashed), Bottleneck (red).",
      "Click Validate to run checks.",
    ],
    metrics,
    state,
    events,
  };
}

function runBoECalculator(
  parameters: SimulationParameters
): SimulationResult {
  const dau = Number(parameters.dau ?? 1_000_000);
  const actionsPerDay = Number(parameters.actionsPerDay ?? 5);
  const recordSizeBytes = Number(parameters.recordSizeBytes ?? 1024);
  const retentionDays = Number(parameters.retentionDays ?? 365);

  const avgQps = (dau * actionsPerDay) / 86400;
  const peakQps = avgQps * 3;
  const dailyStorageGb = (dau * actionsPerDay * recordSizeBytes) / Math.pow(2, 30);
  const annualStorageTb = (dailyStorageGb * retentionDays) / Math.pow(2, 10);
  const bandwidthMbs = (peakQps * recordSizeBytes) / Math.pow(2, 20);

  const metrics: SimulationMetric[] = [
    {
      label: "Average QPS",
      value: Math.round(avgQps).toLocaleString(),
      unit: "req/s",
      tone: avgQps > 100_000 ? "danger" : avgQps > 10_000 ? "warning" : "good",
    },
    {
      label: "Peak QPS",
      value: Math.round(peakQps).toLocaleString(),
      unit: "req/s",
      tone: peakQps > 300_000 ? "danger" : peakQps > 30_000 ? "warning" : "good",
    },
    {
      label: "Daily Storage",
      value: dailyStorageGb.toFixed(2),
      unit: "GB",
      tone:
        dailyStorageGb > 100_000
          ? "danger"
          : dailyStorageGb > 10_000
            ? "warning"
            : "good",
    },
    {
      label: "Annual Storage",
      value: annualStorageTb.toFixed(2),
      unit: "TB",
      tone:
        annualStorageTb > 100_000
          ? "danger"
          : annualStorageTb > 10_000
            ? "warning"
            : "good",
    },
    {
      label: "Bandwidth",
      value: bandwidthMbs.toFixed(2),
      unit: "MB/s",
      tone: bandwidthMbs > 1000 ? "danger" : bandwidthMbs > 100 ? "warning" : "good",
    },
  ];

  const state: SimulationStateItem[] = [
    { label: "DAU", value: dau.toLocaleString(), tone: "neutral" },
    { label: "Actions/Day", value: actionsPerDay, tone: "neutral" },
    { label: "Record Size", value: `${recordSizeBytes} B`, tone: "neutral" },
    { label: "Retention", value: `${retentionDays} days`, tone: "neutral" },
  ];

  return {
    title: "Back-of-Envelope Calculation",
    summary: `For ${dau.toLocaleString()} DAU with ${actionsPerDay} actions/day and ${recordSizeBytes}B records over ${retentionDays} days: avg QPS ≈ ${Math.round(avgQps).toLocaleString()}, peak ≈ ${Math.round(peakQps).toLocaleString()}, daily storage ≈ ${dailyStorageGb.toFixed(1)} GB, annual ≈ ${annualStorageTb.toFixed(1)} TB.`,
    output: [
      `QPS_avg = (${dau.toLocaleString()} × ${actionsPerDay}) / 86,400 = ${Math.round(avgQps).toLocaleString()} req/s`,
      `QPS_peak = 3 × ${Math.round(avgQps).toLocaleString()} = ${Math.round(peakQps).toLocaleString()} req/s`,
      `Storage_day = (${dau.toLocaleString()} × ${actionsPerDay} × ${recordSizeBytes}) / 2^30 = ${dailyStorageGb.toFixed(2)} GB`,
      `Storage_year = (${dailyStorageGb.toFixed(2)} GB × ${retentionDays}) / 2^10 = ${annualStorageTb.toFixed(2)} TB`,
      `Bandwidth = (${Math.round(peakQps).toLocaleString()} × ${recordSizeBytes}) / 2^20 = ${bandwidthMbs.toFixed(2)} MB/s`,
    ],
    metrics,
    state,
    events: [
      "Input parameters received",
      "Computed average QPS from DAU and actions",
      "Applied 3× peak multiplier",
      "Calculated daily storage in bytes → GB",
      "Projected annual storage GB → TB",
      "Computed peak bandwidth MB/s",
      "Evaluated capacity feasibility",
    ],
  };
}

function runHTTPTracer(): SimulationResult {
  const events = [
    "Browser initiates request to example.com",
    "DNS Resolver: resolves example.com → 203.0.113.45 (cached: 0ms, uncached: 50ms)",
    "TCP Handshake: SYN → SYN-ACK → ACK (~1.5 RTT ≈ 75ms)",
    "TLS Handshake: Certificate exchange + key agreement (~1-2 RTT ≈ 100ms)",
    "Load Balancer: Routes to healthiest backend server (Round Robin)",
    "App Server: Processes request, queries database",
    "Database: Executes query, returns result set",
    "Response: HTTP 200 OK with JSON payload (~20ms serialization)",
  ];

  const cumulativeLatencies = [0, 0, 75, 175, 190, 240, 290, 310];

  const metrics: SimulationMetric[] = [
    { label: "DNS Latency", value: 0, unit: "ms", tone: "good" },
    { label: "TCP + TLS", value: 175, unit: "ms", tone: "neutral" },
    { label: "Server Processing", value: 100, unit: "ms", tone: "neutral" },
    { label: "Total Latency", value: 310, unit: "ms", tone: "good" },
  ];

  const state: SimulationStateItem[] = [
    { label: "Protocol", value: "HTTPS/1.1", tone: "neutral" },
    { label: "DNS Cache", value: "HIT", status: "hit", tone: "good" },
    { label: "TLS Version", value: "TLS 1.3", tone: "neutral" },
    { label: "LB Algorithm", value: "Round Robin", tone: "neutral" },
    { label: "Response Status", value: "200 OK", status: "success", tone: "good" },
  ];

  return {
    title: "HTTP Request Tracer",
    summary:
      "A full HTTPS request to example.com took ~310ms total: DNS (cached, 0ms) + TCP/TLS (175ms) + server processing (100ms) + response serialization (20ms).",
    output: events.map((e, i) => `[+${cumulativeLatencies[i]}ms] ${e}`),
    metrics,
    state,
    events,
  };
}

function runScalingSimulator(
  controls: SimulationControls
): SimulationResult {
  const mode = (controls.mode as string) || "vertical";
  const users = Number(controls.users ?? 100);

  if (mode === "vertical") {
    const maxUsers = 500;
    const cpuPercent = Math.min(100, (users / maxUsers) * 100);
    const ramPercent = Math.min(100, (users / maxUsers) * 80);
    const latencyMs = 20 + (users / maxUsers) * 300;
    const failed = users > maxUsers ? users - maxUsers : 0;

    const metrics: SimulationMetric[] = [
      {
        label: "CPU Usage",
        value: Math.round(cpuPercent),
        unit: "%",
        tone: cpuPercent > 90 ? "danger" : cpuPercent > 70 ? "warning" : "good",
      },
      {
        label: "RAM Usage",
        value: Math.round(ramPercent),
        unit: "%",
        tone: ramPercent > 90 ? "danger" : ramPercent > 70 ? "warning" : "good",
      },
      {
        label: "Latency",
        value: Math.round(latencyMs),
        unit: "ms",
        tone: latencyMs > 200 ? "warning" : "good",
      },
      {
        label: "Failed Requests",
        value: failed,
        unit: "req/s",
        tone: failed > 0 ? "danger" : "good",
      },
    ];

    const state: SimulationStateItem[] = [
      { label: "Mode", value: "Vertical", tone: "neutral" },
      { label: "Servers", value: 1, tone: "neutral" },
      { label: "Users", value: users, tone: "neutral" },
      {
        label: "Status",
        value: cpuPercent >= 100 ? "At Capacity" : "Healthy",
        status: cpuPercent >= 100 ? "failed" : "running",
        tone: cpuPercent >= 100 ? "danger" : "good",
      },
    ];

    return {
      title: "Vertical Scaling Simulation",
      summary:
        cpuPercent >= 100
          ? `Vertical scaling limit reached at ${maxUsers} users. CPU at 100%, ${failed} requests failing. Switch to horizontal scaling.`
          : `Single server handling ${users} users. CPU at ${Math.round(cpuPercent)}%, latency ${Math.round(latencyMs)}ms.`,
      output: [
        `Server: 1 instance (vertical mode)`,
        `CPU: ${Math.round(cpuPercent)}% utilized`,
        `RAM: ${Math.round(ramPercent)}% utilized`,
        `Avg latency: ${Math.round(latencyMs)}ms`,
        `Failed requests: ${failed}/s`,
      ],
      metrics,
      state,
      events: [
        "Single server initialized",
        `Load increased to ${users} concurrent users`,
        `CPU climbed to ${Math.round(cpuPercent)}%`,
        `RAM climbed to ${Math.round(ramPercent)}%`,
        cpuPercent >= 100
          ? "SCALE LIMIT REACHED: cannot add more users"
          : "System operating within capacity",
      ],
    };
  } else {
    const servers = Number(controls.servers ?? 2);
    const usersPerServer = Math.floor(users / servers);
    const overflow = users % servers;
    const latencyMs = 20 + (usersPerServer / 200) * 100;
    const capacity = servers * 500;
    const failed = users > capacity ? users - capacity : 0;

    const metrics: SimulationMetric[] = [
      {
        label: "Total Capacity",
        value: capacity,
        unit: "users",
        tone: "neutral",
      },
      {
        label: "Users Served",
        value: Math.min(users, capacity),
        unit: "users",
        tone: "good",
      },
      {
        label: "Avg Latency",
        value: Math.round(latencyMs),
        unit: "ms",
        tone: latencyMs > 100 ? "warning" : "good",
      },
      {
        label: "Failed Requests",
        value: failed,
        unit: "req/s",
        tone: failed > 0 ? "danger" : "good",
      },
    ];

    const state: SimulationStateItem[] = [
      { label: "Mode", value: "Horizontal", tone: "neutral" },
      { label: "Servers", value: servers, tone: "neutral" },
      { label: "Users", value: users, tone: "neutral" },
      {
        label: "Status",
        value: failed > 0 ? "Overloaded" : "Healthy",
        status: failed > 0 ? "failed" : "running",
        tone: failed > 0 ? "danger" : "good",
      },
    ];

    return {
      title: "Horizontal Scaling Simulation",
      summary:
        failed > 0
          ? `${servers} servers cannot handle ${users} users. Capacity is ${capacity}. ${failed} requests failing.`
          : `${servers} servers distributed ${users} users evenly (${usersPerServer}${overflow > 0 ? "+" + overflow : ""} per server). Latency ${Math.round(latencyMs)}ms.`,
      output: [
        `Servers: ${servers} instances (horizontal mode)`,
        `Users per server: ~${usersPerServer}`,
        `Total capacity: ${capacity} users`,
        `Avg latency: ${Math.round(latencyMs)}ms`,
        `Failed requests: ${failed}/s`,
      ],
      metrics,
      state,
      events: [
        `Load balancer initialized with ${servers} backend servers`,
        `Traffic distributed evenly (Round Robin)`,
        `Load increased to ${users} concurrent users`,
        `Each server handling ~${usersPerServer} users`,
        failed > 0
          ? "CLUSTER OVERLOADED: add more servers"
          : "Cluster operating within capacity",
      ],
    };
  }
}

function runCAPPlayground(controls: SimulationControls): SimulationResult {
  const mode = (controls.mode as string) || "CP";
  return {
    title: "CAP Theorem Playground",
    summary: `CAP simulation in ${mode} mode. Toggle network partitions to observe consistency vs availability trade-offs.`,
    output: [
      `System mode: ${mode}`,
      "Nodes: A, B, C configured with replicated data",
      "Network partition can be toggled between any pair",
      mode === "CP"
        ? "CP mode: Partitioned nodes reject writes to preserve consistency"
        : "AP mode: All nodes remain available, may serve stale data",
    ],
    metrics: [
      { label: "Nodes", value: 3, tone: "neutral" },
      { label: "Mode", value: mode.toUpperCase(), tone: "neutral" },
      { label: "Replication", value: "Synchronous", tone: "neutral" },
    ],
    state: [
      { label: "Node A", value: "x=5", status: "success", tone: "good" },
      { label: "Node B", value: "x=5", status: "success", tone: "good" },
      { label: "Node C", value: "x=5", status: "success", tone: "good" },
    ],
    events: [
      "System initialized with 3 nodes",
      "Data replicated across all nodes",
      `Mode set to ${mode.toUpperCase()}`,
      "Ready for writes and partition simulation",
    ],
  };
}

function runCacheStrategy(controls: SimulationControls): SimulationResult {
  const strategy = (controls.strategy as string) || "cache-aside";
  return {
    title: "Cache Strategy Lab",
    summary: `Simulating ${strategy} caching strategy. Observe hit rates, latency, and consistency trade-offs.`,
    output: [
      `Strategy: ${strategy}`,
      "Cache capacity: 10 entries",
      "Cache hit latency: 0.1ms",
      "Cache miss latency: 5ms",
      "Perform reads and writes to populate metrics",
    ],
    metrics: [
      { label: "Strategy", value: strategy, tone: "neutral" },
      { label: "Cache Size", value: "0/10", tone: "neutral" },
      { label: "Hit Rate", value: "0%", tone: "neutral" },
      { label: "Avg Latency", value: "0ms", tone: "neutral" },
    ],
    state: [
      { label: "Cache Entries", value: 0, tone: "neutral" },
      { label: "DB Entries", value: 2, tone: "neutral" },
      { label: "Pending Writes", value: 0, tone: "neutral" },
    ],
    events: [
      "Cache strategy lab initialized",
      `Selected strategy: ${strategy}`,
      "Database seeded with A=10, B=20",
      "Ready for read/write operations",
    ],
  };
}

export function runCaseStudySimulation(): SimulationResult {
  return {
    title: "Case Study Walkthrough",
    summary:
      "Interactive case study simulation. Use the walkthrough panels and architecture canvas to explore the system design step by step.",
    output: [
      "Case study framework initialized",
      "Follow the steps: Requirements → Estimation → API → HLD → Deep Dive → Trade-offs",
      "Architecture canvas builds up as you progress",
      "Answer quiz questions to test your understanding",
    ],
    metrics: [
      { label: "Steps", value: 6, tone: "neutral" },
      { label: "Mode", value: "Interactive", tone: "neutral" },
    ],
    state: [
      { label: "Status", value: "Ready", status: "idle", tone: "neutral" },
    ],
    events: [
      "Case study framework initialized",
      "Waiting for user to begin walkthrough",
    ],
  };
}

function runRateLimiter(controls: SimulationControls): SimulationResult {
  const algorithm = (controls.algorithm as string) || "token-bucket";
  const rate = Number(controls.rate ?? 10);
  return {
    title: "Rate Limiter Lab",
    summary: `Simulating ${algorithm} rate limiter at ${rate} requests/second. Start traffic to observe acceptance and rejection patterns.`,
    output: [
      `Algorithm: ${algorithm}`,
      `Rate: ${rate} req/s`,
      "Start steady, burst, or mixed traffic to observe behavior",
      "Monitor accepted vs rejected counts over time",
    ],
    metrics: [
      { label: "Algorithm", value: algorithm, tone: "neutral" },
      { label: "Rate", value: rate, unit: "req/s", tone: "neutral" },
      { label: "Accepted", value: 0, tone: "good" },
      { label: "Rejected", value: 0, tone: "danger" },
    ],
    state: [
      { label: "Status", value: "Idle", status: "idle", tone: "neutral" },
      { label: "Traffic Mode", value: "None", tone: "neutral" },
      { label: "Total Requests", value: 0, tone: "neutral" },
    ],
    events: [
      "Rate limiter initialized",
      `Algorithm: ${algorithm}`,
      `Configured rate: ${rate} req/s`,
      "Ready for traffic generation",
    ],
  };
}

function runEventFlowSimulation(controls: SimulationControls): SimulationResult {
  const flow = (controls.flow as string) || "ecommerce-order";
  return {
    title: "Event Flow Builder",
    summary: `Simulating event-driven flow: ${flow}. Observe how events propagate between services and where compensations may be needed.`,
    output: [
      `Flow preset: ${flow}`,
      "Events: OrderPlaced → PaymentProcessed → InventoryReserved → Shipped",
      "Use controls to inject failures and observe compensation behavior.",
    ],
    metrics: [
      { label: "Flow", value: flow, tone: "neutral" },
      { label: "Events Emitted", value: 0, tone: "neutral" },
      { label: "Consumers", value: 3, tone: "neutral" },
    ],
    state: [
      { label: "Order Service", value: "Idle", status: "idle", tone: "neutral" },
      { label: "Payment Service", value: "Idle", status: "idle", tone: "neutral" },
      { label: "Inventory Service", value: "Idle", status: "idle", tone: "neutral" },
      { label: "Shipping Service", value: "Idle", status: "idle", tone: "neutral" },
    ],
    events: [
      "Event flow builder initialized",
      `Selected flow: ${flow}`,
      "Ready to emit events and observe choreography",
    ],
  };
}

function runSagaSimulation(controls: SimulationControls): SimulationResult {
  const saga = (controls.saga as string) || "ecommerce-checkout";
  return {
    title: "Saga Flow Simulator",
    summary: `Simulating saga: ${saga}. Configure steps and failure injection to observe compensating transactions.`,
    output: [
      `Saga preset: ${saga}`,
      "Steps: Reserve Inventory → Process Payment → Create Shipment",
      "Inject a failure to trigger compensation (refund + restore stock).",
    ],
    metrics: [
      { label: "Saga", value: saga, tone: "neutral" },
      { label: "Steps", value: 3, tone: "neutral" },
      { label: "Compensations", value: 0, tone: "neutral" },
    ],
    state: [
      { label: "Orchestrator", value: "Idle", status: "idle", tone: "neutral" },
      { label: "Inventory", value: "Not reserved", tone: "neutral" },
      { label: "Payment", value: "Not charged", tone: "neutral" },
      { label: "Shipment", value: "Not created", tone: "neutral" },
    ],
    events: [
      "Saga simulator initialized",
      `Loaded saga: ${saga}`,
      "Ready to run success and failure scenarios",
    ],
  };
}

function runDeploymentVisualizer(controls: SimulationControls): SimulationResult {
  const strategy = (controls.strategy as string) || "rolling";
  const replicas = Number(controls.replicas ?? 5);
  return {
    title: "Deployment Visualizer",
    summary: `Simulating ${strategy} deployment across ${replicas} replicas. Observe traffic shift, health checks, and rollback behavior.`,
    output: [
      `Strategy: ${strategy}`,
      `Replicas: ${replicas}`,
      "Watch how pods are replaced and traffic is shifted over time.",
    ],
    metrics: [
      { label: "Strategy", value: strategy, tone: "neutral" },
      { label: "Replicas", value: replicas, tone: "neutral" },
      { label: "Healthy Pods", value: replicas, tone: "good" },
      { label: "Failed Pods", value: 0, tone: "good" },
    ],
    state: [
      { label: "Current Version", value: "v1", tone: "neutral" },
      { label: "Target Version", value: "v2", tone: "neutral" },
      { label: "Traffic Split", value: "100% v1", tone: "neutral" },
      { label: "Status", value: "Ready", status: "success", tone: "good" },
    ],
    events: [
      "Deployment visualizer initialized",
      `Strategy: ${strategy}`,
      `Replica set size: ${replicas}`,
      "Ready to start deployment simulation",
    ],
  };
}

function runChaosLab(controls: SimulationControls): SimulationResult {
  return {
    title: "Chaos Lab",
    summary:
      "Inject failures into a simulated system and apply defenses (circuit breakers, retries, fallbacks) to maintain availability.",
    output: [
      "Chaos Lab initialized with Load Balancer, API tier, Database, Cache, and Queue.",
      "Use the attack panel to inject failures.",
      "Apply defenses before or during an attack to mitigate damage.",
      "Goal: Maintain >95% availability for 2 minutes.",
    ],
    metrics: [
      { label: "Score", value: 100, tone: "good" },
      { label: "Availability", value: "100%", tone: "good" },
      { label: "API Replicas", value: 3, tone: "neutral" },
    ],
    state: [
      { label: "Status", value: "Ready", status: "idle", tone: "neutral" },
      { label: "LB", value: "Healthy", tone: "good" },
      { label: "API", value: "Healthy", tone: "good" },
      { label: "DB", value: "Healthy", tone: "good" },
      { label: "Cache", value: "Healthy", tone: "good" },
      { label: "Queue", value: "Healthy", tone: "good" },
    ],
    events: [
      "Simulation initialized. Goal: maintain >95% availability for 2 minutes.",
      "Waiting for user input...",
    ],
  };
}

function runAutoscaler(controls: SimulationControls): SimulationResult {
  const metric = (controls.metric as string) || "cpu";
  const target = Number(controls.target ?? 50);
  return {
    title: "Autoscaler Simulator",
    summary: `Simulating HPA behavior scaling on ${metric} with target ${target}%. Observe replica count changes as load varies.`,
    output: [
      `Metric: ${metric}`,
      `Target: ${target}%`,
      "Use controls to change incoming load and observe scale-up/down.",
    ],
    metrics: [
      { label: "Metric", value: metric, tone: "neutral" },
      { label: "Target", value: `${target}%`, tone: "neutral" },
      { label: "Current Replicas", value: 2, tone: "neutral" },
      { label: "Desired Replicas", value: 2, tone: "neutral" },
    ],
    state: [
      { label: "Load", value: "Low", tone: "good" },
      { label: "Metric Value", value: `${Math.round(target * 0.8)}%`, tone: "good" },
      { label: "Scale Status", value: "Stable", status: "success", tone: "good" },
    ],
    events: [
      "Autoscaler initialized",
      `Scaling metric: ${metric}`,
      `Target threshold: ${target}%`,
      "Ready to simulate load variations",
    ],
  };
}

function runCaseStudyWalkthrough(controls: SimulationControls): SimulationResult {
  const caseStudy = (controls.case as string) || "url-shortener";
  return {
    title: "Case Study Walkthrough",
    summary: `Interactive walkthrough for ${caseStudy}. Follow the design steps: requirements → high-level design → deep dive → trade-offs.`,
    output: [
      `Case study: ${caseStudy}`,
      "Step 1: Clarify functional and non-functional requirements.",
      "Step 2: Sketch the high-level design with APIs and data stores.",
      "Step 3: Deep dive into 2–3 critical components.",
      "Step 4: Discuss trade-offs and future improvements.",
    ],
    metrics: [
      { label: "Case", value: caseStudy, tone: "neutral" },
      { label: "Steps", value: 4, tone: "neutral" },
      { label: "Progress", value: "0%", tone: "neutral" },
    ],
    state: [
      { label: "Current Step", value: "Requirements", tone: "neutral" },
      { label: "Status", value: "In Progress", status: "running", tone: "good" },
    ],
    events: [
      "Case study walkthrough initialized",
      `Selected system: ${caseStudy}`,
      "Use the guided steps to build your design iteratively.",
    ],
  };
}

function runRealtimeFlowSimulation(controls: SimulationControls): SimulationResult {
  const protocol = (controls.protocol as string) || "websocket";
  return {
    title: "Real-Time Flow Builder",
    summary: `Simulating ${protocol} real-time communication flow. Observe connection lifecycle, message broadcasting, and presence management.`,
    output: [
      `Protocol: ${protocol}`,
      "Clients can connect, send messages, and receive broadcasts.",
      "Watch connection state changes and server load distribution.",
    ],
    metrics: [
      { label: "Protocol", value: protocol, tone: "neutral" },
      { label: "Connections", value: 0, tone: "neutral" },
      { label: "Messages/sec", value: 0, tone: "neutral" },
    ],
    state: [
      { label: "Server", value: "Idle", status: "idle", tone: "neutral" },
      { label: "Connections", value: 0, tone: "neutral" },
    ],
    events: [
      "Real-time flow builder initialized",
      `Protocol set to ${protocol}`,
      "Ready to simulate client connections and message flow",
    ],
  };
}

function runMLPipelineSimulation(controls: SimulationControls): SimulationResult {
  const pipeline = (controls.pipeline as string) || "batch-inference";
  return {
    title: "ML Pipeline Simulator",
    summary: `Simulating ${pipeline} ML pipeline. Observe feature engineering, model serving, and A/B testing flow.`,
    output: [
      `Pipeline: ${pipeline}`,
      "Stages: Feature Store → Preprocessing → Model Inference → Post-processing → Response",
      "Monitor latency, throughput, and model versioning.",
    ],
    metrics: [
      { label: "Pipeline", value: pipeline, tone: "neutral" },
      { label: "Latency", value: "0ms", tone: "neutral" },
      { label: "Throughput", value: "0 req/s", tone: "neutral" },
    ],
    state: [
      { label: "Feature Store", value: "Ready", status: "idle", tone: "neutral" },
      { label: "Model Server", value: "Idle", status: "idle", tone: "neutral" },
    ],
    events: [
      "ML pipeline simulator initialized",
      `Pipeline preset: ${pipeline}`,
      "Ready to simulate inference requests",
    ],
  };
}

function runSecuritySimulation(controls: SimulationControls): SimulationResult {
  const scenario = (controls.scenario as string) || "jwt-auth";
  return {
    title: "Security Simulator",
    summary: `Simulating ${scenario} security flow. Observe authentication, authorization, and encryption mechanisms.`,
    output: [
      `Scenario: ${scenario}`,
      "Trace request through auth layers: TLS termination → JWT validation → RBAC check → Resource access.",
      "Toggle mTLS, OAuth2, or SAML to compare flows.",
    ],
    metrics: [
      { label: "Scenario", value: scenario, tone: "neutral" },
      { label: "Latency", value: "0ms", tone: "neutral" },
      { label: "Security Score", value: "100%", tone: "good" },
    ],
    state: [
      { label: "TLS", value: "Active", status: "success", tone: "good" },
      { label: "Auth", value: "Verified", status: "success", tone: "good" },
    ],
    events: [
      "Security simulator initialized",
      `Scenario: ${scenario}`,
      "Ready to simulate authentication and authorization flow",
    ],
  };
}

function runPaymentSimulation(controls: SimulationControls): SimulationResult {
  const flow = (controls.flow as string) || "card-payment";
  return {
    title: "Payment Flow Simulator",
    summary: `Simulating ${flow} with idempotency keys, ledger updates, and distributed transaction coordination.`,
    output: [
      `Flow: ${flow}`,
      "Stages: Request → Idempotency Check → Auth → Capture → Ledger Update → Confirmation",
      "Inject failures to observe rollback and compensation behavior.",
    ],
    metrics: [
      { label: "Flow", value: flow, tone: "neutral" },
      { label: "Success Rate", value: "100%", tone: "good" },
      { label: "Latency", value: "0ms", tone: "neutral" },
    ],
    state: [
      { label: "Idempotency", value: "Active", status: "success", tone: "good" },
      { label: "Ledger", value: "Consistent", status: "success", tone: "good" },
    ],
    events: [
      "Payment simulator initialized",
      `Flow preset: ${flow}`,
      "Ready to simulate payment processing with idempotency",
    ],
  };
}

function runGlobalScaleSimulation(controls: SimulationControls): SimulationResult {
  const topology = (controls.topology as string) || "3-region";
  return {
    title: "Global Scale Simulator",
    summary: `Simulating ${topology} multi-region deployment. Observe geo-routing, data replication, and consistency trade-offs.`,
    output: [
      `Topology: ${topology}`,
      "Regions: US-East, US-West, EU-Central, APAC-Singapore",
      "Monitor latency, replication lag, and failover behavior.",
    ],
    metrics: [
      { label: "Topology", value: topology, tone: "neutral" },
      { label: "Regions", value: 3, tone: "neutral" },
      { label: "Replication Lag", value: "0ms", tone: "good" },
    ],
    state: [
      { label: "US-East", value: "Healthy", status: "success", tone: "good" },
      { label: "US-West", value: "Healthy", status: "success", tone: "good" },
      { label: "EU-Central", value: "Healthy", status: "success", tone: "good" },
    ],
    events: [
      "Global scale simulator initialized",
      `Topology: ${topology}`,
      "Ready to simulate multi-region traffic and failures",
    ],
  };
}

function runInterviewTimerSimulation(): SimulationResult {
  return {
    title: "Interview Timer",
    summary: "45-minute system design interview timer. Tracks time allocation across requirement gathering, high-level design, deep dive, and trade-offs.",
    output: [
      "Interview Timer initialized",
      "Phase 1: Requirements (5-10 min)",
      "Phase 2: High-Level Design (15-20 min)",
      "Phase 3: Deep Dive (15-20 min)",
      "Phase 4: Trade-offs & Wrap-up (5 min)",
    ],
    metrics: [
      { label: "Total Time", value: "45:00", tone: "neutral" },
      { label: "Phase", value: "Requirements", tone: "neutral" },
      { label: "Progress", value: "0%", tone: "neutral" },
    ],
    state: [
      { label: "Timer", value: "Running", status: "running", tone: "good" },
      { label: "Phase", value: "Requirements", tone: "neutral" },
    ],
    events: [
      "Interview timer started",
      "45-minute countdown initiated",
      "Phase tracking enabled",
    ],
  };
}

function runSystemDesignCanvasSimulation(): SimulationResult {
  return {
    title: "System Design Canvas",
    summary: "Interactive canvas for sketching system designs during interviews. Drag components, draw connections, and validate your architecture.",
    output: [
      "System Design Canvas initialized",
      "Available components: Client, Load Balancer, API Gateway, App Server, Cache, Database, Queue, CDN, Blob Storage",
      "Draw connections and validate your design against best practices.",
    ],
    metrics: [
      { label: "Components", value: 9, tone: "neutral" },
      { label: "Validation", value: "Not run", tone: "neutral" },
    ],
    state: [
      { label: "Canvas", value: "Ready", status: "idle", tone: "neutral" },
      { label: "Components", value: 0, tone: "neutral" },
    ],
    events: [
      "System design canvas initialized",
      "Canvas ready for sketching",
      "Use the component palette to start building",
    ],
  };
}

function runPitfallDetectorSimulation(): SimulationResult {
  return {
    title: "Pitfall Detector",
    summary: "Identify common system design mistakes in presented scenarios. Spot over-engineering, premature optimization, missing requirements, and weak trade-offs.",
    output: [
      "Pitfall detector initialized",
      "Review the presented design scenario and identify mistakes.",
      "Common pitfalls: over-engineering, missing NFRs, weak consistency, no fallback plans.",
    ],
    metrics: [
      { label: "Scenarios", value: 5, tone: "neutral" },
      { label: "Score", value: "0/5", tone: "neutral" },
    ],
    state: [
      { label: "Status", value: "Ready", status: "idle", tone: "neutral" },
      { label: "Current Scenario", value: "None", tone: "neutral" },
    ],
    events: [
      "Pitfall detector initialized",
      "5 scenarios loaded",
      "Ready to identify design mistakes",
    ],
  };
}
