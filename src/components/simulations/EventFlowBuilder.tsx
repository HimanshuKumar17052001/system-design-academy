"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Send,
  Zap,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Info,
  ShoppingCart,
  CreditCard,
  User,
  Mail,
  Package,
  Activity,
  Layers,
  X,
  Server,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type NodeType = "producer" | "eventType" | "consumer";

interface FlowNode {
  id: string;
  type: NodeType;
  name: string;
  group?: string;
}

interface FlowEdge {
  id: string;
  producerId: string;
  eventTypeId: string;
  consumerId: string;
}

interface AnimationEvent {
  id: string;
  kind: "to-bus" | "to-consumer";
  color: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  consumerId?: string;
  eventTypeId: string;
  consumerIds?: string[];
}

interface DlqItem {
  id: string;
  eventTypeId: string;
  consumerId: string;
  color: string;
  timestamp: number;
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Palette data                                                        */
/* ------------------------------------------------------------------ */

const PALETTE_PRODUCERS = [
  { id: "p-order", name: "Order Service", icon: ShoppingCart },
  { id: "p-user", name: "User Service", icon: User },
  { id: "p-payment", name: "Payment Service", icon: CreditCard },
];

const PALETTE_EVENTS = [
  { id: "e-order", name: "OrderPlaced", color: "#3b82f6" },
  { id: "e-payment", name: "PaymentProcessed", color: "#10b981" },
  { id: "e-user", name: "UserRegistered", color: "#f59e0b" },
];

const PALETTE_CONSUMERS = [
  { id: "c-email", name: "Email Service", icon: Mail },
  { id: "c-inventory", name: "Inventory Service", icon: Package },
  { id: "c-analytics", name: "Analytics Service", icon: Activity },
];

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function EventFlowBuilder() {
  /* ----------------------- Nodes ---------------------------------- */
  const [producers, setProducers] = useState<FlowNode[]>([]);
  const [eventTypes, setEventTypes] = useState<FlowNode[]>([]);
  const [consumers, setConsumers] = useState<FlowNode[]>([]);
  const [flows, setFlows] = useState<FlowEdge[]>([]);

  /* ----------------------- Connection mode ------------------------ */
  const [connecting, setConnecting] = useState<
    { step: number; producerId?: string; eventTypeId?: string } | null
  >(null);

  /* ----------------------- Positions ------------------------------ */
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const busRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  /* ----------------------- Metrics & state ------------------------ */
  const [metrics, setMetrics] = useState({
    totalProduced: 0,
    totalConsumed: 0,
    totalFailed: 0,
    inQueue: 0,
  });
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const lastSnapshotRef = useRef({ totalProduced: 0, totalConsumed: 0 });
  const [history, setHistory] = useState<{ time: number; producedRate: number; consumedRate: number }[]>([]);

  const [consumerStates, setConsumerStates] = useState<
    Record<string, { processing: number; processed: number }>
  >({});

  const [animations, setAnimations] = useState<AnimationEvent[]>([]);
  const [dlqEnabled, setDlqEnabled] = useState(false);
  const dlqEnabledRef = useRef(dlqEnabled);
  dlqEnabledRef.current = dlqEnabled;

  const [dlqItems, setDlqItems] = useState<DlqItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pulsing, setPulsing] = useState<Record<string, number>>({});
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [groupCounter, setGroupCounter] = useState(1);

  /* ----------------------- Measure positions ---------------------- */
  const measurePositions = useCallback(() => {
    if (!canvasRef.current) return;
    const containerRect = canvasRef.current.getBoundingClientRect();
    const next: Record<string, { x: number; y: number }> = {};
    Object.entries(nodeRefs.current).forEach(([id, el]) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        next[id] = {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      }
    });
    if (busRef.current) {
      const rect = busRef.current.getBoundingClientRect();
      next["bus"] = {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    }
    setPositions(next);
  }, []);

  useLayoutEffect(() => {
    measurePositions();
  }, [producers, eventTypes, consumers, measurePositions]);

  useEffect(() => {
    window.addEventListener("resize", measurePositions);
    return () => window.removeEventListener("resize", measurePositions);
  }, [measurePositions]);

  /* ----------------------- History interval ----------------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      const m = metricsRef.current;
      const producedRate = m.totalProduced - lastSnapshotRef.current.totalProduced;
      const consumedRate = m.totalConsumed - lastSnapshotRef.current.totalConsumed;
      lastSnapshotRef.current = { totalProduced: m.totalProduced, totalConsumed: m.totalConsumed };
      setHistory((prev) => [...prev.slice(-29), { time: Date.now(), producedRate, consumedRate }]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ----------------------- Helpers -------------------------------- */
  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, { id: crypto.randomUUID(), message, timestamp: Date.now() }]);
  }, []);

  const handleDragStart = (e: React.DragEvent, item: { id: string; type: NodeType; name: string }) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleDrop = (zone: NodeType) => (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json")) as {
        id: string;
        type: NodeType;
        name: string;
      };
      if (data.type !== zone) return;
      const exists =
        (zone === "producer" && producers.some((p) => p.id === data.id)) ||
        (zone === "eventType" && eventTypes.some((et) => et.id === data.id)) ||
        (zone === "consumer" && consumers.some((c) => c.id === data.id));
      if (exists) return;
      const node: FlowNode = { id: data.id, type: data.type, name: data.name };
      if (zone === "producer") setProducers((prev) => [...prev, node]);
      if (zone === "eventType") setEventTypes((prev) => [...prev, node]);
      if (zone === "consumer") {
        setConsumers((prev) => [...prev, node]);
        setConsumerStates((prev) => ({ ...prev, [node.id]: { processing: 0, processed: 0 } }));
      }
      addLog(`Added ${node.name} to canvas`);
    } catch {
      // ignore
    }
  };

  const removeNode = (node: FlowNode) => {
    if (node.type === "producer") setProducers((prev) => prev.filter((p) => p.id !== node.id));
    if (node.type === "eventType") setEventTypes((prev) => prev.filter((et) => et.id !== node.id));
    if (node.type === "consumer") {
      setConsumers((prev) => prev.filter((c) => c.id !== node.id));
      setConsumerStates((prev) => {
        const next = { ...prev };
        delete next[node.id];
        return next;
      });
    }
    setFlows((prev) =>
      prev.filter((f) => f.producerId !== node.id && f.eventTypeId !== node.id && f.consumerId !== node.id)
    );
    addLog(`Removed ${node.name}`);
  };

  const handleNodeClick = (node: FlowNode) => {
    if (!connecting) {
      if (node.type === "producer") {
        setConnecting({ step: 1, producerId: node.id });
      }
      return;
    }
    if (connecting.step === 1 && node.type === "producer") {
      setConnecting({ step: 1, producerId: node.id });
      return;
    }
    if (connecting.step === 1 && node.type === "eventType") {
      setConnecting({ step: 2, producerId: connecting.producerId, eventTypeId: node.id });
      return;
    }
    if (connecting.step === 2 && node.type === "eventType") {
      setConnecting({ step: 2, producerId: connecting.producerId, eventTypeId: node.id });
      return;
    }
    if (connecting.step === 2 && node.type === "consumer") {
      const producerId = connecting.producerId!;
      const eventTypeId = connecting.eventTypeId!;
      const consumerId = node.id;
      const exists = flows.some(
        (f) => f.producerId === producerId && f.eventTypeId === eventTypeId && f.consumerId === consumerId
      );
      if (!exists) {
        const flow: FlowEdge = {
          id: crypto.randomUUID(),
          producerId,
          eventTypeId,
          consumerId,
        };
        setFlows((prev) => [...prev, flow]);
        addLog(
          `Connected ${producers.find((p) => p.id === producerId)?.name} → ${
            eventTypes.find((et) => et.id === eventTypeId)?.name
          } → ${consumers.find((c) => c.id === consumerId)?.name}`
        );
      }
      setConnecting(null);
      return;
    }
    setConnecting(null);
  };

  /* ----------------------- Simulation ----------------------------- */
  const simulateEvent = useCallback(() => {
    const eligibleProducers = producers.filter((p) => flows.some((f) => f.producerId === p.id));
    if (eligibleProducers.length === 0) {
      setValidationMessages(["No flows configured. Connect a producer to an event type and consumer first."]);
      setShowValidation(true);
      return;
    }
    const producer = eligibleProducers[Math.floor(Math.random() * eligibleProducers.length)];
    const producerFlows = flows.filter((f) => f.producerId === producer.id);
    const byEventType = new Map<string, FlowEdge[]>();
    producerFlows.forEach((f) => {
      if (!byEventType.has(f.eventTypeId)) byEventType.set(f.eventTypeId, []);
      byEventType.get(f.eventTypeId)!.push(f);
    });
    const etIds = Array.from(byEventType.keys());
    const etId = etIds[Math.floor(Math.random() * etIds.length)];
    const etFlows = byEventType.get(etId)!;
    const et = eventTypes.find((e) => e.id === etId);
    const color = et ? PALETTE_EVENTS.find((pe) => pe.id === et.id)?.color || "#3b82f6" : "#3b82f6";

    // group consumers by group for load sharing
    const consumerIds = new Set<string>();
    etFlows.forEach((f) => {
      const consumer = consumers.find((c) => c.id === f.consumerId);
      if (consumer?.group) {
        const groupConsumers = etFlows
          .filter((fl) => consumers.find((c) => c.id === fl.consumerId)?.group === consumer.group)
          .map((fl) => fl.consumerId);
        const pick = groupConsumers[Math.floor(Math.random() * groupConsumers.length)];
        consumerIds.add(pick);
      } else {
        consumerIds.add(f.consumerId);
      }
    });

    const pPos = positions[producer.id];
    const bPos = positions["bus"];
    if (!pPos || !bPos) return;

    setMetrics((prev) => ({ ...prev, totalProduced: prev.totalProduced + 1, inQueue: prev.inQueue + 1 }));
    addLog(`Event produced at ${producer.name}`);

    // pulse
    setPulsing((prev) => ({ ...prev, [producer.id]: Date.now() }));
    setTimeout(() => {
      setPulsing((prev) => {
        const next = { ...prev };
        delete next[producer.id];
        return next;
      });
    }, 800);

    const animId = crypto.randomUUID();
    setAnimations((prev) => [
      ...prev,
      {
        id: animId,
        kind: "to-bus",
        color,
        from: pPos,
        to: bPos,
        eventTypeId: etId,
        consumerIds: Array.from(consumerIds),
      },
    ]);
  }, [producers, flows, eventTypes, consumers, positions, addLog]);

  const handleBusArrival = useCallback((anim: AnimationEvent) => {
    setAnimations((prev) => prev.filter((a) => a.id !== anim.id));
    setMetrics((prev) => ({ ...prev, inQueue: Math.max(0, prev.inQueue - 1) }));

    const bPos = positionsRef.current["bus"];
    if (!bPos || !anim.consumerIds) return;

    anim.consumerIds.forEach((cid) => {
      const cPos = positionsRef.current[cid];
      if (!cPos) return;
      setAnimations((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          kind: "to-consumer",
          color: anim.color,
          from: bPos,
          to: cPos,
          consumerId: cid,
          eventTypeId: anim.eventTypeId,
        },
      ]);
    });
  }, []);

  const handleConsumerArrival = useCallback(
    (anim: AnimationEvent) => {
      setAnimations((prev) => prev.filter((a) => a.id !== anim.id));
      const cid = anim.consumerId!;
      setConsumerStates((prev) => {
        const s = prev[cid] || { processing: 0, processed: 0 };
        return { ...prev, [cid]: { ...s, processing: s.processing + 1 } };
      });

      setTimeout(() => {
        if (dlqEnabledRef.current && Math.random() < 0.25) {
          setMetrics((prev) => ({ ...prev, totalFailed: prev.totalFailed + 1 }));
          setDlqItems((prev) => [
            ...prev,
            {
              id: anim.id,
              eventTypeId: anim.eventTypeId,
              consumerId: cid,
              color: anim.color,
              timestamp: Date.now(),
            },
          ]);
          addLog(
            `Event failed at ${consumersRef.current.find((c) => c.id === cid)?.name || "consumer"} → sent to DLQ`
          );
        } else {
          setMetrics((prev) => ({ ...prev, totalConsumed: prev.totalConsumed + 1 }));
          addLog(
            `Event consumed by ${consumersRef.current.find((c) => c.id === cid)?.name || "consumer"}`
          );
        }
        setConsumerStates((prev) => {
          const s = prev[cid] || { processing: 0, processed: 0 };
          return { ...prev, [cid]: { ...s, processing: Math.max(0, s.processing - 1), processed: s.processed + 1 } };
        });
      }, 600 + Math.random() * 800);
    },
    [addLog]
  );

  // Refs for positions and consumers to avoid stale closures in timeouts
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const consumersRef = useRef(consumers);
  consumersRef.current = consumers;

  /* ----------------------- Burst ---------------------------------- */
  const burstEvents = useCallback(() => {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => simulateEvent(), i * 100);
    }
    addLog("Burst: produced 20 events");
  }, [simulateEvent, addLog]);

  /* ----------------------- Add consumer group --------------------- */
  const addConsumerGroup = useCallback(() => {
    const groupName = `group-${groupCounter}`;
    const baseConsumer = consumers.find((c) => !c.group) || consumers[0];
    const newId = crypto.randomUUID();
    const newName = baseConsumer ? `${baseConsumer.name} (Group)` : `Consumer Group ${groupCounter}`;
    const newConsumer: FlowNode = {
      id: newId,
      type: "consumer",
      name: newName,
      group: groupName,
    };
    setConsumers((prev) => [...prev, newConsumer]);
    setConsumerStates((prev) => ({ ...prev, [newId]: { processing: 0, processed: 0 } }));
    setGroupCounter((prev) => prev + 1);
    // auto-connect to first available event type if possible
    if (eventTypes.length > 0 && producers.length > 0) {
      const et = eventTypes[0];
      const p = producers[0];
      setFlows((prev) => [
        ...prev,
        { id: crypto.randomUUID(), producerId: p.id, eventTypeId: et.id, consumerId: newId },
      ]);
    }
    addLog(`Added consumer group: ${newName}`);
  }, [consumers, eventTypes, producers, groupCounter, addLog]);

  /* ----------------------- Validation ----------------------------- */
  const runValidation = useCallback(() => {
    const messages: string[] = [];
    const orphanedProducers = producers.filter((p) => !flows.some((f) => f.producerId === p.id));
    const orphanedConsumers = consumers.filter((c) => !flows.some((f) => f.consumerId === c.id));
    if (orphanedProducers.length > 0) {
      messages.push(`Orphaned producers: ${orphanedProducers.map((p) => p.name).join(", ")}`);
    }
    if (orphanedConsumers.length > 0) {
      messages.push(`Orphaned consumers: ${orphanedConsumers.map((c) => c.name).join(", ")}`);
    }
    // cycle detection on directed graph
    const allNodes = [...producers, ...eventTypes, ...consumers];
    const adj = new Map<string, string[]>();
    allNodes.forEach((n) => adj.set(n.id, []));
    flows.forEach((f) => {
      adj.get(f.producerId)?.push(f.eventTypeId);
      adj.get(f.eventTypeId)?.push(f.consumerId);
    });
    const visited = new Set<string>();
    const recStack = new Set<string>();
    function dfs(nodeId: string): boolean {
      visited.add(nodeId);
      recStack.add(nodeId);
      for (const neighbor of adj.get(nodeId) || []) {
        if (!visited.has(neighbor) && dfs(neighbor)) return true;
        if (recStack.has(neighbor)) return true;
      }
      recStack.delete(nodeId);
      return false;
    }
    let hasCycle = false;
    for (const n of allNodes) {
      if (!visited.has(n.id) && dfs(n.id)) {
        hasCycle = true;
        break;
      }
    }
    if (hasCycle) messages.push("Circular dependency detected in the event flow.");
    if (messages.length === 0) messages.push("Validation passed. No issues found.");
    setValidationMessages(messages);
    setShowValidation(true);
  }, [producers, consumers, eventTypes, flows]);

  /* ----------------------- Render helpers ------------------------- */
  const chartData = useMemo(() => {
    return history.map((h, i) => ({ index: i, produced: h.producedRate, consumed: h.consumedRate }));
  }, [history]);

  const lagData = useMemo(() => {
    return consumers.map((c) => ({
      name: c.name,
      lag: consumerStates[c.id]?.processing || 0,
    }));
  }, [consumers, consumerStates]);

  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 h-full min-h-[600px]">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={simulateEvent} variant="outline" size="sm">
            <Send className="h-4 w-4 mr-1" />
            Simulate Event
          </Button>
          <Button onClick={burstEvents} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-1" />
            Burst Events
          </Button>
          <Button onClick={addConsumerGroup} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Consumer Group
          </Button>
          <div className="flex items-center gap-2">
            <Switch checked={dlqEnabled} onCheckedChange={setDlqEnabled} />
            <span className="text-sm">Show Dead Letter</span>
          </div>
          <Button onClick={runValidation} variant="secondary" size="sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Validate
          </Button>
          {connecting && (
            <Button onClick={() => setConnecting(null)} variant="ghost" size="sm">
              <X className="h-4 w-4 mr-1" />
              Cancel Connection
            </Button>
          )}
          {connecting && (
            <Badge variant="outline" className="animate-pulse">
              {connecting.step === 1 ? "Select an Event Type" : "Select a Consumer"}
            </Badge>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Palette */}
          <div className="w-56 flex-shrink-0 border rounded-xl bg-card p-4 space-y-4 overflow-y-auto">
            <div className="text-sm font-semibold text-muted-foreground">Event Producers</div>
            <div className="space-y-2">
              {PALETTE_PRODUCERS.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { id: item.id, type: "producer", name: item.name })}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 cursor-grab hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              ))}
            </div>
            <div className="text-sm font-semibold text-muted-foreground">Event Types</div>
            <div className="space-y-2">
              {PALETTE_EVENTS.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { id: item.id, type: "eventType", name: item.name })}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 cursor-grab hover:bg-muted transition-colors"
                  style={{ borderLeft: `4px solid ${item.color}` }}
                >
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              ))}
            </div>
            <div className="text-sm font-semibold text-muted-foreground">Consumers</div>
            <div className="space-y-2">
              {PALETTE_CONSUMERS.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { id: item.id, type: "consumer", name: item.name })}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 cursor-grab hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div ref={canvasRef} className="flex-1 relative border rounded-xl bg-muted/20 overflow-hidden">
            {/* Grid Columns */}
            <div className="grid grid-cols-3 gap-4 p-4 h-full">
              {/* Producers */}
              <div
                className="space-y-3 min-h-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop("producer")}
              >
                <div className="text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                  <Server className="h-4 w-4" />
                  Producers
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {producers.map((node) => (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        ref={setNodeRef(node.id)}
                        onClick={() => handleNodeClick(node)}
                        className={cn(
                          "relative p-3 rounded-lg border bg-card cursor-pointer hover:shadow-sm transition-all",
                          connecting?.step === 1 && connecting.producerId !== node.id && "opacity-50",
                          connecting?.producerId === node.id && "ring-2 ring-blue-500",
                          connecting?.step === 2 && "opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium">{node.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNode(node);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {pulsing[node.id] && (
                          <motion.div
                            className="absolute inset-0 rounded-lg border-2 border-amber-400"
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.15 }}
                            transition={{ duration: 0.8 }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {producers.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                      Drag producers here
                    </div>
                  )}
                </div>
              </div>

              {/* Event Bus & Event Types */}
              <div
                className="space-y-3 min-h-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop("eventType")}
              >
                <div className="text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                  <Layers className="h-4 w-4" />
                  Event Bus
                </div>
                <div
                  ref={busRef}
                  className="relative rounded-xl border bg-card p-6 flex flex-col items-center justify-center gap-2 min-h-[120px]"
                >
                  <Layers className="h-8 w-8 text-primary" />
                  <div className="text-sm font-semibold">Kafka / RabbitMQ</div>
                  <div className="text-xs text-muted-foreground">{metrics.inQueue} in queue</div>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {eventTypes.map((node) => (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        ref={setNodeRef(node.id)}
                        onClick={() => handleNodeClick(node)}
                        className={cn(
                          "relative p-2 rounded-lg border bg-card cursor-pointer hover:shadow-sm transition-all",
                          connecting?.step === 2 && connecting.eventTypeId !== node.id && "opacity-50",
                          connecting?.eventTypeId === node.id && "ring-2 ring-blue-500"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{node.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNode(node);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {eventTypes.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                      Drag event types here
                    </div>
                  )}
                </div>
              </div>

              {/* Consumers */}
              <div
                className="space-y-3 min-h-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop("consumer")}
              >
                <div className="text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                  <Activity className="h-4 w-4" />
                  Consumers
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {consumers.map((node) => (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        ref={setNodeRef(node.id)}
                        onClick={() => handleNodeClick(node)}
                        className={cn(
                          "relative p-3 rounded-lg border bg-card cursor-pointer hover:shadow-sm transition-all",
                          connecting?.step === 1 && "opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{node.name}</span>
                              {node.group && (
                                <span className="text-[10px] text-muted-foreground">{node.group}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNode(node);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {consumerStates[node.id]?.processing > 0 && (
                          <motion.div
                            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {consumers.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                      Drag consumers here
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SVG Lines */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              {flows.map((flow) => {
                const p = positions[flow.producerId];
                const c = positions[flow.consumerId];
                const b = positions["bus"];
                if (!p || !c || !b) return null;
                return (
                  <g key={flow.id}>
                    <line
                      x1={p.x}
                      y1={p.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                    <line
                      x1={b.x}
                      y1={b.y}
                      x2={c.x}
                      y2={c.y}
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Animations */}
            <div className="absolute inset-0 pointer-events-none">
              {animations.map((anim) => (
                <motion.div
                  key={anim.id}
                  className="absolute z-50 flex items-center justify-center"
                  style={{ left: anim.from.x, top: anim.from.y, x: "-50%", y: "-50%" }}
                  animate={{ left: anim.to.x, top: anim.to.y }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  onAnimationComplete={() => {
                    if (anim.kind === "to-bus") {
                      handleBusArrival(anim);
                    } else {
                      handleConsumerArrival(anim);
                    }
                  }}
                >
                  <div
                    className="h-3 w-3 rounded-full shadow-sm border border-white"
                    style={{ backgroundColor: anim.color }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Tabs */}
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="dlq">Dead Letter Queue</TabsTrigger>
            <TabsTrigger value="logs">Event Log</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Produced" value={metrics.totalProduced} tone="neutral" />
              <MetricCard label="Consumed" value={metrics.totalConsumed} tone="good" />
              <MetricCard
                label="Failed"
                value={metrics.totalFailed}
                tone={metrics.totalFailed > 0 ? "danger" : "good"}
              />
              <MetricCard
                label="In Queue"
                value={metrics.inQueue}
                tone={metrics.inQueue > 10 ? "warning" : "neutral"}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Events / sec</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="produced"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="Produced"
                        />
                        <Line
                          type="monotone"
                          dataKey="consumed"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          name="Consumed"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Consumer Lag</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lagData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="lag" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="dlq">
            <Card>
              <CardContent className="pt-6">
                {dlqItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No dead letter events.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dlqItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg border p-2 bg-red-50 dark:bg-red-900/20"
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <div className="text-xs">
                          <div className="font-medium">
                            {eventTypes.find((et) => et.id === item.eventTypeId)?.name || "Event"}
                          </div>
                          <div className="text-muted-foreground">
                            {consumers.find((c) => c.id === item.consumerId)?.name || "Consumer"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm border-b last:border-0 py-1"
                    >
                      <Badge variant="outline" className="mr-2 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Badge>
                      {log.message}
                    </motion.div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">No events yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="validation">
            <Card>
              <CardContent className="pt-6 space-y-2">
                {validationMessages.length === 0 && (
                  <div className="text-sm text-muted-foreground">Click Validate to run checks.</div>
                )}
                {validationMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-sm rounded-lg border p-2",
                      msg.includes("passed")
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}
                  >
                    {msg.includes("passed") ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {msg}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Validation Dialog */}
        <Dialog open={showValidation} onOpenChange={setShowValidation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Validation Results</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {validationMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 text-sm rounded-lg border p-2",
                    msg.includes("passed")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  )}
                >
                  {msg.includes("passed") ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {msg}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  MetricCard sub-component                                            */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const colors = {
    neutral: "text-foreground",
    good: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-lg font-semibold", colors[tone])}>{value.toLocaleString()}</div>
    </div>
  );
}
