"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Send, Zap, Plus, Trash2, MessageSquare, Users, Package, AlertTriangle } from "lucide-react";

type DeliveryMode = "at-most-once" | "at-least-once" | "exactly-once";
type QueueType = "point-to-point" | "pub-sub";

interface Message {
  id: string;
  label: string;
  inQueue: boolean;
  assignedConsumerId?: string;
  acked: boolean;
  lost: boolean;
  createdAt: number;
  color: string;
}

interface Consumer {
  id: string;
  label: string;
  processing: boolean;
  processedCount: number;
  slow: boolean;
}

const MESSAGE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const QUEUE_CAPACITY = 20;

export default function MessageQueueVisualizer() {
  const [queueType, setQueueType] = useState<QueueType>("point-to-point");
  const [messages, setMessages] = useState<Message[]>([]);
  const [consumers, setConsumers] = useState<Consumer[]>([
    { id: "consumer-1", label: "Consumer 1", processing: false, processedCount: 0, slow: false },
  ]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("at-least-once");
  const [consumerSlow, setConsumerSlow] = useState(false);
  const [messageLoss, setMessageLoss] = useState(false);
  const [history, setHistory] = useState<{ time: number; queueSize: number; consumerThroughput: number }[]>([]);
  const [events, setEvents] = useState<string[]>(["System initialized with 1 consumer."]);
  const messageIdRef = useRef(0);
  const consumerIdRef = useRef(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalProduced = useRef(0);
  const totalConsumed = useRef(0);
  const totalLost = useRef(0);
  const [counters, setCounters] = useState({ produced: 0, consumed: 0, lost: 0 });

  const inQueue = messages.filter((m) => m.inQueue && !m.lost);
  const queueOverflow = inQueue.length > QUEUE_CAPACITY;

  const produce = useCallback(
    (count = 1) => {
      const newMsgs: Message[] = [];
      for (let i = 0; i < count; i++) {
        const id = `msg-${++messageIdRef.current}`;
        const labels = ["OrderCreated", "PaymentProcessed", "EmailSent", "InventoryUpdated", "UserSignup"];
        const label = labels[Math.floor(Math.random() * labels.length)];
        const lost = messageLoss && Math.random() < 0.1;
        const msg: Message = {
          id,
          label,
          inQueue: !lost,
          acked: false,
          lost,
          createdAt: Date.now(),
          color: MESSAGE_COLORS[Math.floor(Math.random() * MESSAGE_COLORS.length)],
        };
        newMsgs.push(msg);
        totalProduced.current += 1;
        if (lost) totalLost.current += 1;
      }
      setMessages((prev) => [...prev, ...newMsgs]);
      setCounters({
        produced: totalProduced.current,
        consumed: totalConsumed.current,
        lost: totalLost.current,
      });
      if (count === 1) {
        setEvents((e) => [`Produced 1 message. Queue: ${inQueue.length + (newMsgs.filter((m) => !m.lost).length)}`, ...e].slice(0, 20));
      } else {
        setEvents((e) => [`Burst: produced ${count} messages. Queue: ${inQueue.length + newMsgs.filter((m) => !m.lost).length}`, ...e].slice(0, 20));
      }
    },
    [inQueue.length, messageLoss]
  );

  const addConsumer = () => {
    const id = `consumer-${++consumerIdRef.current}`;
    const newConsumer: Consumer = {
      id,
      label: `Consumer ${consumerIdRef.current}`,
      processing: false,
      processedCount: 0,
      slow: false,
    };
    setConsumers((prev) => [...prev, newConsumer]);
    setEvents((e) => [`${newConsumer.label} added.`, ...e].slice(0, 20));
  };

  const removeConsumer = (id: string) => {
    setConsumers((prev) => prev.filter((c) => c.id !== id));
    setEvents((e) => [`Consumer removed.`, ...e].slice(0, 20));
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setConsumers((prev) => {
        const updated = prev.map((c) => {
          const isSlow = consumerSlow && c.id === "consumer-1";
          if (c.processing) {
            // processing: chance to finish
            const finishChance = isSlow ? 0.1 : 0.5;
            if (Math.random() < finishChance) {
              return { ...c, processing: false, processedCount: c.processedCount + 1 };
            }
            return { ...c, processing: true };
          } else {
            // try to pull from queue
            const pullChance = isSlow ? 0.05 : 0.3;
            if (Math.random() < pullChance) {
              return { ...c, processing: true };
            }
            return c;
          }
        });
        return updated;
      });
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [consumerSlow]);

  useEffect(() => {
    // Assign/deassign messages based on consumer state
    setMessages((prev) => {
      const updated = [...prev];
      consumers.forEach((c) => {
        if (c.processing && !updated.some((m) => m.assignedConsumerId === c.id)) {
          const unassigned = updated.find((m) => m.inQueue && !m.assignedConsumerId && !m.lost);
          if (unassigned) {
            unassigned.assignedConsumerId = c.id;
          }
        }
        if (!c.processing) {
          const done = updated.filter((m) => m.assignedConsumerId === c.id);
          done.forEach((m) => {
            m.inQueue = false;
            m.assignedConsumerId = undefined;
            totalConsumed.current += 1;
          });
        }
      });
      return updated;
    });
    setCounters({
      produced: totalProduced.current,
      consumed: totalConsumed.current,
      lost: totalLost.current,
    });
  }, [consumers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((h) => {
        const queueSize = messages.filter((m) => m.inQueue && !m.lost).length;
        const throughput = consumers.reduce((sum, c) => sum + c.processedCount, 0);
        return [...h.slice(-59), { time: Date.now(), queueSize, consumerThroughput: throughput }];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [messages, consumers]);

  const chartData = useMemo(() => {
    return history.map((h, i) => ({ index: i, queueSize: h.queueSize, throughput: h.consumerThroughput }));
  }, [history]);

  const consumerThroughputData = useMemo(() => {
    return consumers.map((c) => ({ name: c.label, throughput: c.processedCount }));
  }, [consumers]);

  return (
    <div className="space-y-6">
      {/* Queue Type & Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={queueType} onValueChange={(v) => setQueueType(v as QueueType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="point-to-point">Point-to-Point</SelectItem>
            <SelectItem value="pub-sub">Pub/Sub</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => produce(1)} variant="outline" size="sm">
          <Send className="h-4 w-4 mr-1" />
          Produce Message
        </Button>
        <Button onClick={() => produce(20)} variant="outline" size="sm">
          <Zap className="h-4 w-4 mr-1" />
          Produce Burst
        </Button>
        <Button onClick={addConsumer} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Consumer
        </Button>
        <div className="flex items-center gap-2">
          <Switch checked={consumerSlow} onCheckedChange={setConsumerSlow} />
          <span className="text-sm">Consumer Slow</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={messageLoss} onCheckedChange={setMessageLoss} />
          <span className="text-sm">Message Loss</span>
        </div>
        <Select value={deliveryMode} onValueChange={(v) => setDeliveryMode(v as DeliveryMode)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="at-most-once">At-Most-Once</SelectItem>
            <SelectItem value="at-least-once">At-Least-Once</SelectItem>
            <SelectItem value="exactly-once">Exactly-Once</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visual Layout */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 items-start">
            {/* Producer Column */}
            <div className="space-y-3">
              <div className="text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                Producer
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 min-h-[200px] flex flex-col items-center gap-2">
                <AnimatePresence>
                  {messages
                    .filter((m) => !m.inQueue && !m.lost && !m.assignedConsumerId)
                    .slice(-8)
                    .map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="rounded px-2 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.label}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Queue Column */}
            <div className="space-y-3">
              <div className="text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Package className="h-4 w-4" />
                Queue / Topic
              </div>
              <div
                className={cn(
                  "rounded-lg border p-4 min-h-[200px] flex flex-col items-center gap-2 transition-colors",
                  queueOverflow ? "bg-red-50 border-red-300 dark:bg-red-900/20" : "bg-muted/50"
                )}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {inQueue.length} / {QUEUE_CAPACITY} messages
                </div>
                <AnimatePresence>
                  {inQueue.slice(0, QUEUE_CAPACITY + 5).map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className={cn(
                        "rounded px-2 py-1 text-xs font-medium text-white w-full text-center",
                        m.assignedConsumerId ? "opacity-60" : ""
                      )}
                      style={{ backgroundColor: m.color }}
                    >
                      {m.label} {m.assignedConsumerId && "(processing)"}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {queueOverflow && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 text-xs text-red-600 font-medium"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Queue overflow! Dropping messages.
                  </motion.div>
                )}
              </div>
            </div>

            {/* Consumers Column */}
            <div className="space-y-3">
              <div className="text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                Consumers
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 min-h-[200px] space-y-3">
                <AnimatePresence>
                  {consumers.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={cn(
                        "rounded-lg border p-2 flex items-center justify-between",
                        c.processing ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20" : "bg-card"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">{c.label}</span>
                        {c.processing && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="h-2 w-2 rounded-full bg-blue-500"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {c.processedCount}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeConsumer(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Produced" value={counters.produced.toLocaleString()} unit="" />
        <MetricCard label="Consumed" value={counters.consumed.toLocaleString()} unit="" />
        <MetricCard label="In Queue" value={inQueue.length.toLocaleString()} unit="" tone={queueOverflow ? "danger" : inQueue.length > 10 ? "warning" : "good"} />
        <MetricCard label="Lost" value={counters.lost.toLocaleString()} unit="" tone={counters.lost > 0 ? "danger" : "good"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Messages in Queue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" hide />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="queueSize" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Consumer Throughput</CardTitle>
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
                  <Line type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={2} dot={false} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {events.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm border-b last:border-0 py-1"
              >
                <Badge variant="outline" className="mr-2 text-xs">
                  {events.length - i}
                </Badge>
                {ev}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit: string;
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
      <div className={cn("text-lg font-semibold", colors[tone])}>
        {value}
        <span className="text-xs ml-1 font-normal text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
