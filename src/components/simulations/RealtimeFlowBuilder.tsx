"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Server,
  Wifi,
  WifiOff,
  MessageSquare,
  Activity,
  Radio,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Globe,
  Plug,
  Unplug,
  Send,
  Users,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Protocol = "websocket" | "sse" | "webrtc" | "long-polling";

interface ClientNode {
  id: string;
  name: string;
  status: "connected" | "connecting" | "disconnected" | "error";
  latencyHistory: number[];
  messagesReceived: number;
  messagesSent: number;
}

interface SimMessage {
  id: string;
  text: string;
  from: "server" | string; // "server" or client id
  to: "broadcast" | string; // "broadcast" or client id
  timestamp: number;
  protocol: Protocol;
  delivered: boolean;
}

interface LatencyPoint {
  time: number;
  avgLatency: number;
  throughput: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PROTOCOL_CONFIG: Record<
  Protocol,
  { label: string; baseLatency: number; overhead: number; color: string }
> = {
  websocket: { label: "WebSocket", baseLatency: 15, overhead: 2, color: "#3b82f6" },
  sse: { label: "SSE", baseLatency: 25, overhead: 5, color: "#10b981" },
  webrtc: { label: "WebRTC", baseLatency: 10, overhead: 1, color: "#8b5cf6" },
  "long-polling": { label: "Long Polling", baseLatency: 80, overhead: 20, color: "#f59e0b" },
};

const INITIAL_CLIENTS: ClientNode[] = [
  { id: "c1", name: "Client A", status: "disconnected", latencyHistory: [], messagesReceived: 0, messagesSent: 0 },
  { id: "c2", name: "Client B", status: "disconnected", latencyHistory: [], messagesReceived: 0, messagesSent: 0 },
  { id: "c3", name: "Client C", status: "disconnected", latencyHistory: [], messagesReceived: 0, messagesSent: 0 },
  { id: "c4", name: "Client D", status: "disconnected", latencyHistory: [], messagesReceived: 0, messagesSent: 0 },
];

const DEMO_MESSAGES = [
  "User joined room",
  "Price update: BTC $42,150",
  "New notification",
  "Chat message received",
  "Live score: 2-1",
  "Stock tick: AAPL +1.2%",
  "Presence update",
  "Typing indicator",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RealtimeFlowBuilder() {
  const [protocol, setProtocol] = useState<Protocol>("websocket");
  const [clients, setClients] = useState<ClientNode[]>(INITIAL_CLIENTS);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [autoBroadcast, setAutoBroadcast] = useState(false);
  const [broadcastRate, setBroadcastRate] = useState(2);
  const [latencyHistory, setLatencyHistory] = useState<LatencyPoint[]>([]);
  const [logs, setLogs] = useState<string[]>(["Simulation initialized. Select a protocol and connect clients."]);
  const tickRef = useRef(0);
  const msgIdRef = useRef(0);

  /* ------------------------ Helpers ------------------------------- */

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev.slice(-49), `${time}: ${msg}`]);
  }, []);

  const connectedClients = clients.filter((c) => c.status === "connected");

  /* ------------------------ Connection ---------------------------- */

  const toggleClient = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        if (c.status === "disconnected" || c.status === "error") {
          addLog(`${c.name} connecting via ${PROTOCOL_CONFIG[protocol].label}...`);
          // Simulate connection delay
          setTimeout(() => {
            setClients((prev2) =>
              prev2.map((x) =>
                x.id === clientId
                  ? { ...x, status: "connected", latencyHistory: [] }
                  : x
              )
            );
            addLog(`${c.name} connected (${PROTOCOL_CONFIG[protocol].label})`);
          }, 600 + Math.random() * 400);
          return { ...c, status: "connecting" };
        }
        addLog(`${c.name} disconnected`);
        return { ...c, status: "disconnected" };
      })
    );
  };

  const connectAll = () => {
    clients.forEach((c) => {
      if (c.status === "disconnected" || c.status === "error") {
        toggleClient(c.id);
      }
    });
  };

  const disconnectAll = () => {
    setClients((prev) =>
      prev.map((c) => (c.status === "connected" || c.status === "connecting" ? { ...c, status: "disconnected" } : c))
    );
    addLog("All clients disconnected");
  };

  /* ------------------------ Messaging ----------------------------- */

  const sendMessage = useCallback(
    (from: "server" | string, to: "broadcast" | string, text?: string) => {
      const cfg = PROTOCOL_CONFIG[protocol];
      const content = text || DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
      const id = `msg-${msgIdRef.current++}`;
      const timestamp = Date.now();

      const simMsg: SimMessage = {
        id,
        text: content,
        from,
        to,
        timestamp,
        protocol,
        delivered: false,
      };

      setMessages((prev) => [...prev.slice(-99), simMsg]);

      // Calculate latency per target
      const targets = to === "broadcast" ? connectedClients.map((c) => c.id) : [to];

      targets.forEach((targetId) => {
        const base = cfg.baseLatency + Math.random() * cfg.overhead;
        const networkJitter = Math.random() * 10;
        const totalLatency = Math.round(base + networkJitter);

        setTimeout(() => {
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, delivered: true } : m)));
          setClients((prev) =>
            prev.map((c) => {
              if (c.id !== targetId) return c;
              const newHistory = [...c.latencyHistory.slice(-19), totalLatency];
              return {
                ...c,
                latencyHistory: newHistory,
                messagesReceived: c.messagesReceived + (from === "server" ? 1 : 0),
                messagesSent: c.messagesSent + (from === c.id ? 1 : 0),
              };
            })
          );
        }, totalLatency * 3); // scaled for visual effect
      });
    },
    [protocol, connectedClients]
  );

  const broadcastFromServer = useCallback(() => {
    if (connectedClients.length === 0) {
      addLog("No connected clients to broadcast to");
      return;
    }
    sendMessage("server", "broadcast");
    addLog(`Server broadcast via ${PROTOCOL_CONFIG[protocol].label}`);
  }, [sendMessage, connectedClients, protocol, addLog]);

  const sendClientMessage = (clientId: string) => {
    const target = connectedClients.find((c) => c.id !== clientId);
    if (!target) {
      addLog("No other connected clients");
      return;
    }
    sendMessage(clientId, target.id, `Hello from ${clientId}`);
    addLog(`${clients.find((c) => c.id === clientId)?.name} → ${target.name}`);
  };

  /* ------------------------ Auto broadcast ------------------------ */

  useEffect(() => {
    if (!isRunning || !autoBroadcast) return;
    const interval = setInterval(() => {
      broadcastFromServer();
    }, Math.max(500, 5000 / broadcastRate));
    return () => clearInterval(interval);
  }, [isRunning, autoBroadcast, broadcastRate, broadcastFromServer]);

  /* ------------------------ Metrics history ----------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;
      const activeClients = clients.filter((c) => c.status === "connected");
      const avgLatency =
        activeClients.length > 0
          ? Math.round(
              activeClients.reduce((sum, c) => {
                const avg = c.latencyHistory.length > 0 ? c.latencyHistory.reduce((a, b) => a + b, 0) / c.latencyHistory.length : 0;
                return sum + avg;
              }, 0) / activeClients.length
            )
          : 0;

      const recentMessages = messages.filter((m) => Date.now() - m.timestamp < 5000 && m.delivered);
      const throughput = Math.round(recentMessages.length / 5);

      setLatencyHistory((prev) => [...prev.slice(-29), { time: tickRef.current, avgLatency, throughput }]);
    }, 1000);
    return () => clearInterval(timer);
  }, [clients, messages]);

  /* ------------------------ Reset ------------------------------- */

  const handleReset = () => {
    setIsRunning(false);
    setAutoBroadcast(false);
    setClients(INITIAL_CLIENTS);
    setMessages([]);
    setLatencyHistory([]);
    setLogs(["Simulation reset."]);
    tickRef.current = 0;
  };

  /* ------------------------ Render Helpers ------------------------ */

  const statusColor = (status: ClientNode["status"]) => {
    switch (status) {
      case "connected":
        return "bg-emerald-500";
      case "connecting":
        return "bg-amber-400 animate-pulse";
      case "disconnected":
        return "bg-slate-400";
      case "error":
        return "bg-red-500";
    }
  };

  const statusText = (status: ClientNode["status"]) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Offline";
      case "error":
        return "Error";
    }
  };

  const chartData = latencyHistory.map((h, i) => ({ index: i, latency: h.avgLatency, throughput: h.throughput }));

  const totalMessages = messages.length;
  const deliveredMessages = messages.filter((m) => m.delivered).length;
  const deliveryRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 100;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant={isRunning ? "destructive" : "default"} size="sm" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Protocol:</span>
            <Select value={protocol} onValueChange={(v) => setProtocol(v as Protocol)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="websocket">WebSocket</SelectItem>
                <SelectItem value="sse">SSE</SelectItem>
                <SelectItem value="webrtc">WebRTC</SelectItem>
                <SelectItem value="long-polling">Long Polling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={autoBroadcast} onCheckedChange={setAutoBroadcast} />
            <span className="text-sm">Auto-broadcast</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rate:</span>
            <div className="w-24">
              <Slider value={[broadcastRate]} min={1} max={10} step={1} onValueChange={(v) => setBroadcastRate(v[0])} />
            </div>
            <span className="text-xs text-muted-foreground w-8">{broadcastRate}/s</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={connectAll}>
              <Plug className="h-4 w-4 mr-1" />
              Connect All
            </Button>
            <Button variant="outline" size="sm" onClick={disconnectAll}>
              <Unplug className="h-4 w-4 mr-1" />
              Disconnect All
            </Button>
            <Button variant="secondary" size="sm" onClick={broadcastFromServer}>
              <Send className="h-4 w-4 mr-1" />
              Broadcast
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Animation Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Real-time Connection Topology
                </CardTitle>
                <CardDescription>
                  {PROTOCOL_CONFIG[protocol].label} — {connectedClients.length} of {clients.length} clients connected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-72 bg-muted/30 rounded-lg overflow-hidden border">
                  {/* Server Node (center-top) */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <motion.div
                      animate={{ scale: connectedClients.length > 0 ? [1, 1.05, 1] : 1 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-14 h-14 rounded-xl border-2 border-primary bg-primary/10 flex items-center justify-center">
                        <Server className="h-7 w-7 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Server
                      </Badge>
                    </motion.div>
                  </div>

                  {/* Client Nodes (bottom arc) */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 px-4">
                    {clients.map((c, i) => {
                      const offset = (i - (clients.length - 1) / 2) * 80;
                      return (
                        <motion.div
                          key={c.id}
                          className="flex flex-col items-center gap-1"
                          animate={{ x: offset }}
                          transition={{ type: "spring", stiffness: 100 }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => toggleClient(c.id)}
                                className={cn(
                                  "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors relative",
                                  c.status === "connected"
                                    ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                                    : c.status === "connecting"
                                      ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                                      : "border-slate-300 bg-slate-50 dark:bg-slate-900/20"
                                )}
                              >
                                {c.status === "connected" ? (
                                  <Wifi className="h-5 w-5 text-emerald-500" />
                                ) : c.status === "connecting" ? (
                                  <Activity className="h-5 w-5 text-amber-500 animate-spin" />
                                ) : (
                                  <WifiOff className="h-5 w-5 text-slate-400" />
                                )}
                                <span
                                  className={cn(
                                    "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                                    statusColor(c.status)
                                  )}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <div className="font-medium">{c.name}</div>
                              <div className="text-muted-foreground">{statusText(c.status)}</div>
                              <div className="text-muted-foreground">Received: {c.messagesReceived}</div>
                              {c.latencyHistory.length > 0 && (
                                <div className="text-muted-foreground">
                                  Avg Latency: {Math.round(c.latencyHistory.reduce((a, b) => a + b, 0) / c.latencyHistory.length)}ms
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-[10px] font-medium">{c.name}</span>
                          {c.status === "connected" && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-5 text-[10px] px-1"
                              onClick={() => sendClientMessage(c.id)}
                            >
                              <MessageSquare className="h-3 w-3 mr-0.5" />
                              Send
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Connection lines */}
                  <svg className="absolute inset-0 pointer-events-none w-full h-full">
                    {clients.map((c, i) => {
                      if (c.status !== "connected") return null;
                      const cx = 50 + (i - (clients.length - 1) / 2) * 18;
                      const cy = 75;
                      return (
                        <motion.line
                          key={`line-${c.id}`}
                          x1="50%"
                          y1="18%"
                          x2={`${cx}%`}
                          y2={`${cy}%`}
                          stroke={PROTOCOL_CONFIG[protocol].color}
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.6 }}
                          transition={{ duration: 0.5 }}
                        />
                      );
                    })}
                  </svg>

                  {/* Animated Messages */}
                  <AnimatePresence>
                    {messages.slice(-20).map((msg) => {
                      const fromIndex = msg.from === "server" ? -1 : clients.findIndex((c) => c.id === msg.from);
                      const toIndex = msg.to === "broadcast" ? -1 : clients.findIndex((c) => c.id === msg.to);

                      const startX = msg.from === "server" ? 50 : 50 + (fromIndex - 1.5) * 18;
                      const startY = msg.from === "server" ? 18 : 75;

                      // If broadcast, animate to each connected client; otherwise to specific target
                      const targets = msg.to === "broadcast" ? clients.filter((c) => c.status === "connected") : [clients.find((c) => c.id === msg.to)].filter(Boolean);

                      return targets.map((target, ti) => {
                        if (!target) return null;
                        const tIdx = clients.findIndex((c) => c.id === target.id);
                        const endX = 50 + (tIdx - 1.5) * 18;
                        const endY = 75;
                        const delay = ti * 0.1;

                        return (
                          <motion.div
                            key={`${msg.id}-${target.id}`}
                            className="absolute z-10"
                            style={{ left: `${startX}%`, top: `${startY}%` }}
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{
                              left: `${endX}%`,
                              top: `${endY}%`,
                              opacity: msg.delivered ? 0 : 1,
                              scale: msg.delivered ? 0.5 : 1,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, delay, ease: "easeInOut" }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/50"
                              style={{ backgroundColor: PROTOCOL_CONFIG[msg.protocol].color }}
                            />
                          </motion.div>
                        );
                      });
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Protocol Info */}
            <Card size="sm">
              <CardContent className="pt-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">{PROTOCOL_CONFIG[protocol].label}:</span>{" "}
                    {protocol === "websocket" &&
                      "Full-duplex persistent connection. Low latency, ideal for chat, gaming, and live updates. Maintains connection state."}
                    {protocol === "sse" &&
                      "Server-Sent Events. One-way server→client push over HTTP. Simple, auto-reconnects, good for feeds and notifications."}
                    {protocol === "webrtc" &&
                      "Peer-to-peer after initial handshake. Lowest latency, direct data channels. Complex signaling setup required."}
                    {protocol === "long-polling" &&
                      "Client repeatedly polls server. Highest latency and overhead. Fallback for older browsers/proxies."}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Log */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-muted-foreground border-b last:border-0 pb-1"
                    >
                      {log}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox label="Connected" value={`${connectedClients.length}/${clients.length}`} icon={<Users className="h-3 w-3" />} />
                  <MetricBox label="Messages" value={totalMessages.toString()} icon={<MessageSquare className="h-3 w-3" />} />
                  <MetricBox
                    label="Delivery Rate"
                    value={`${deliveryRate}%`}
                    icon={<Zap className="h-3 w-3" />}
                    tone={deliveryRate < 90 ? "warning" : "good"}
                  />
                  <MetricBox
                    label="Protocol"
                    value={PROTOCOL_CONFIG[protocol].label}
                    icon={<Globe className="h-3 w-3" />}
                  />
                </div>

                {/* Latency Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Avg Latency (ms)</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} unit="ms" />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="latency"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                          name="Latency"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Throughput Chart */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Throughput (msg/s)</div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="throughput"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="Throughput"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Per-client latency */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Client Latencies</div>
                  <div className="space-y-1.5">
                    {clients.map((c) => {
                      const avg =
                        c.latencyHistory.length > 0
                          ? Math.round(c.latencyHistory.reduce((a, b) => a + b, 0) / c.latencyHistory.length)
                          : 0;
                      return (
                        <div key={c.id} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full", statusColor(c.status))} />
                            {c.name}
                          </span>
                          <span className="font-mono text-muted-foreground">{avg > 0 ? `${avg}ms` : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MetricBox({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const colors = {
    neutral: "text-foreground",
    good: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={cn("text-sm font-semibold", colors[tone])}>{value}</div>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
