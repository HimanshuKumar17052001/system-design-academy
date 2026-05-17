"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Globe,
  Database,
  HardDrive,
  MessageSquare,
  ArrowUpRight,
  Layers,
  Cpu,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Types & Data
// ------------------------------------------------------------------
interface CheatSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  points: string[];
}

const SECTIONS: CheatSection[] = [
  {
    id: "networking",
    title: "Networking",
    icon: Globe,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    points: [
      "HTTP/1.1: persistent connections, text-based, HOL blocking",
      "HTTP/2: binary framing, multiplexing, server push, HPACK header compression",
      "HTTP/3: QUIC over UDP, 0-RTT resumption, built-in TLS 1.3",
      "DNS: hierarchical, cached at OS / browser / ISP / recursive resolver",
      "DNS lookup ~10-100ms; use DNS prefetch / preconnect for critical domains",
      "TLS 1.3: 1-RTT handshake (sometimes 0-RTT), faster than TLS 1.2",
      "TCP: 3-way handshake (+ TLS = 2-3 RTTs). QUIC reduces this to 0-1 RTT",
      "WebSocket: full-duplex over TCP, starts as HTTP upgrade, good for real-time",
      "gRPC: HTTP/2 based, binary protobuf, streaming, strong types",
      "Keep-Alive: reuse TCP connections to avoid repeated handshakes",
    ],
  },
  {
    id: "storage",
    title: "Storage",
    icon: Database,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
    points: [
      "SQL: ACID, structured schema, joins, strong consistency. Good for relational data",
      "NoSQL: flexible schema, horizontal scale, eventual consistency. Types: KV, wide-column, document, graph",
      "CAP: choose 2 of Consistency, Availability, Partition Tolerance. In practice: AP or CP",
      "Partition Tolerance is mandatory in distributed systems",
      "Read replicas improve read throughput but add replication lag",
      "Write-heavy workloads: consider LSM trees (RocksDB, Cassandra)",
      "Index types: B-Tree (range scans), LSM (writes), Inverted (search), Bitmap (OLAP)",
      "Sharding strategies: hash (even distribution), range (ordered queries), geo (locality)",
      "Hot spots: mitigate with salting, prefixing, or re-sharding",
      "S3 / object storage: infinite scale, 11 9s durability, high latency vs block storage",
    ],
  },
  {
    id: "caching",
    title: "Caching",
    icon: HardDrive,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    points: [
      "Cache-Aside: app manages cache; populate on miss, invalidate on write",
      "Read-Through: cache populates itself transparently on miss",
      "Write-Through: writes go to cache + DB synchronously",
      "Write-Behind: writes go to cache first, flushed to DB asynchronously",
      "Eviction: LRU (least recently used), LFU (least frequently used), TTL (time-to-live)",
      "Redis: in-memory, single-threaded, supports data structures, pub/sub, persistence",
      "Memcached: simple KV, no persistence, multi-threaded, good for small objects",
      "CDN caching: edge locations for static assets; cache headers (Cache-Control, ETag)",
      "Cache stampede: use locks, probabilistic early expiration, or singleflight",
      "Cold start: warm cache gradually or use lazy loading with fallback",
    ],
  },
  {
    id: "messaging",
    title: "Messaging",
    icon: MessageSquare,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    points: [
      "Queue: point-to-point, one consumer per message, good for task distribution",
      "Pub-Sub: broadcast to many subscribers, decouples producers and consumers",
      "Kafka: log-based, high throughput, replayable, partitions for parallelism",
      "RabbitMQ: flexible routing (direct, topic, fanout), good for complex workflows",
      "Backpressure: slow consumer? Add buffering, scale consumers, or shed load",
      "Message ordering: same partition / queue guarantees order; multiple consumers break it",
      "At-least-once: idempotent consumers; exactly-once: harder, use transactions or dedup",
      "Dead Letter Queue (DLQ): isolate poison messages for later inspection",
      "Event sourcing: store events as source of truth; rebuild state by replaying",
      "Schema evolution: use Avro / Protobuf with schema registry for compatibility",
    ],
  },
  {
    id: "scaling",
    title: "Scaling",
    icon: ArrowUpRight,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    points: [
      "Vertical scaling: bigger machine, simple but has hard limit",
      "Horizontal scaling: add more machines, requires load balancing and statelessness",
      "Load Balancer: round-robin (even), least-connections (long-lived), IP-hash (sticky)",
      "Reverse proxy: SSL termination, compression, caching, DDoS protection",
      "Auto-scaling: scale out on CPU / memory / queue depth / latency metrics",
      "Database scaling: read replicas (read scale), sharding (write scale), federation",
      "Rate limiting: token bucket (bursty), leaky bucket (smooth), fixed/sliding window",
      "Circuit Breaker: fail fast when downstream is unhealthy; half-open to test recovery",
      "Bulkhead: isolate failures by partitioning resources (thread pools, connection pools)",
      "Graceful degradation: drop non-critical features under load to preserve core function",
    ],
  },
  {
    id: "patterns",
    title: "Patterns",
    icon: Layers,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    points: [
      "CQRS: separate read and write models; optimize each independently",
      "Saga: manage distributed transactions as a sequence of local transactions with compensations",
      "Circuit Breaker: open → half-open → closed state machine for resilient calls",
      "Idempotency Key: ensure retry-safe operations without side effects",
      "Strangler Fig: incrementally replace legacy by routing traffic to new services",
      "API Gateway: authentication, rate limiting, routing, protocol translation at the edge",
      "BFF (Backend for Frontend): tailor APIs per client (mobile vs web)",
      "Sidecar: deploy auxiliary services (logging, proxy, config) alongside main container",
      "Leader Election: one coordinator for consensus; others standby (Raft, Paxos, ZooKeeper)",
      "Multi-tenancy: isolate tenants by DB (strongest), schema, or row-level (shared DB)",
    ],
  },
  {
    id: "real-world",
    title: "Real-World",
    icon: Cpu,
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-slate-200 dark:border-slate-800",
    points: [
      "1M DAU ≈ 11.5 req/s average; 10M DAU ≈ 115 req/s",
      "1 KB per request × 1M req/day ≈ 1 GB/day of traffic",
      "SSD read: ~100 μs; SSD write: ~500 μs; HDD seek: ~10 ms",
      "RAM read: ~100 ns; L1 cache: ~1 ns; network (same DC): ~0.5 ms",
      "1 Gbps ≈ 125 MB/s; 10 Gbps ≈ 1.25 GB/s",
      "Twitter: 6,000 tweets/sec peak; 300M DAU",
      "YouTube: 500+ hours uploaded per minute; billions of views/day",
      "WhatsApp: 65B+ messages/day; Erlang/BEAM for concurrency",
      "Netflix: ~15% of global internet traffic; microservices + CDN",
      "Typical SLO: p99 latency < 200ms; availability 99.9% (8.7h downtime/year)",
    ],
  },
];

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function CheatSheetViewer() {
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(SECTIONS.map((s) => s.id)));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const lower = search.toLowerCase();
    return SECTIONS.map((section) => {
      const matchingPoints = section.points.filter((p) => p.toLowerCase().includes(lower));
      if (
        section.title.toLowerCase().includes(lower) ||
        matchingPoints.length > 0
      ) {
        return { ...section, points: matchingPoints.length > 0 ? matchingPoints : section.points };
      }
      return null;
    }).filter(Boolean) as CheatSection[];
  }, [search]);

  const totalPoints = SECTIONS.reduce((acc, s) => acc + s.points.length, 0);

  return (
    <div className="flex flex-col gap-4 h-full max-w-4xl mx-auto">
      {/* Header & Search */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              System Design Cheat Sheet
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {totalPoints} facts
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Quick-reference concepts for interviews and architecture discussions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts, terms, numbers..."
              className="w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accordion Sections */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 pr-3 pb-4">
          <AnimatePresence initial={false}>
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isOpen = openSections.has(section.id);
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className={cn("overflow-hidden", isOpen && section.bgColor)}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full"
                    >
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-md flex items-center justify-center",
                              section.bgColor,
                              section.borderColor
                            )}
                          >
                            <Icon className={cn("h-4 w-4", section.color)} />
                          </div>
                          <CardTitle className="text-sm">{section.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {section.points.length}
                          </Badge>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <CardContent>
                            <Separator className="mb-3" />
                            <ul className="space-y-2">
                              <AnimatePresence initial={false}>
                                {section.points.map((point, idx) => (
                                  <motion.li
                                    key={`${section.id}-${idx}`}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <span
                                      className={cn(
                                        "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                                        section.color.replace("text-", "bg-")
                                      )}
                                    />
                                    <span className="text-muted-foreground leading-relaxed">
                                      {highlightSearch(point, search)}
                                    </span>
                                  </motion.li>
                                ))}
                              </AnimatePresence>
                            </ul>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredSections.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for &quot;{search}&quot;</p>
              <p className="text-xs mt-1">Try a different keyword</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function highlightSearch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const lowerQuery = query.toLowerCase();
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === lowerQuery ? (
      <mark key={i} className="bg-primary/20 rounded px-0.5 font-medium">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
