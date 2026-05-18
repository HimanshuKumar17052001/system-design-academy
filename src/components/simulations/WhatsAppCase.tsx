"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Zap } from "lucide-react";
import CaseStudyWalkthrough from "./CaseStudyWalkthrough";
import type { CaseStudyConfig } from "@/types/case-study";

const whatsappConfig: CaseStudyConfig = {
  systemName: "WhatsApp Messaging",
  moduleId: "case-whatsapp",
  steps: [
    {
      id: "requirements",
      title: "Requirements",
      description: "Understand WhatsApp's scale and core messaging requirements.",
      thinkingPrompt: "WhatsApp serves 2B+ users, 100B messages/day. What are the key functional and non-functional requirements?",
      designDecision: "Functional: 1-to-1 messaging, group chats, media sharing, status, voice/video calls, end-to-end encryption. Non-functional: 100B messages/day (~1M/s avg, 10M/s peak), end-to-end encryption for privacy, offline message delivery, presence system.",
      commonMistakes: [
        {
          title: "Ignoring offline message delivery",
          explanation: "Users may be offline when a message is sent. The system must store and forward messages until delivery.",
        },
        {
          title: "Underestimating encryption complexity",
          explanation: "End-to-end encryption using Signal Protocol requires key management, forward secrecy, and metadata protection.",
        },
      ],
      quizQuestions: [
        {
          question: "How many messages does WhatsApp handle per day at scale?",
          options: ["1B", "10B", "100B", "1T"],
          correctIndex: 2,
          explanation: "WhatsApp processes approximately 100 billion messages per day.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "estimation",
      title: "Estimation",
      description: "Calculate storage, QPS, and infrastructure requirements.",
      thinkingPrompt: "With 2B users and 100B messages/day, how much storage is needed? What QPS must the system handle?",
      designDecision: "Message storage: ~300B per message (text, metadata). 100B/day × 300B = 30 TB/day. 30-day retention = 900 TB. Media: average 1MB per media message, 20% of messages have media = 20B media/day = 20 PB/day. QPS: 1M/s avg, 10M/s peak for messages. Media QPS: 200K/s peak.",
      commonMistakes: [
        {
          title: "Not accounting for media storage separately",
          explanation: "Media (photos, videos) dominates storage. Text messages are negligible compared to media.",
        },
        {
          title: "Ignoring notification infrastructure",
          explanation: "Push notifications for offline users require separate infrastructure (APNs, FCM).",
        },
      ],
      quizQuestions: [
        {
          question: "At 100B messages/day with 300B per message, what is daily storage?",
          options: ["3 TB", "30 TB", "300 TB", "3 PB"],
          correctIndex: 2,
          explanation: "100B × 300B = 30,000,000,000,000B = ~30 TB per day for text.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "api",
      title: "API Design",
      description: "Design message send/receive, presence, and media upload endpoints.",
      thinkingPrompt: "What protocols for message delivery? WebSocket for real-time? How handle offline messages?",
      designDecision: "Message send: WebSocket for online users (low latency), HTTP long-poll for offline (fallback). PUT /messages {dest, body, media?} → receipt. GET /messages/{cursor}?limit=50 → paginated inbox. WebSocket /presence for online status. Media upload: authenticated CDN URL from server.",
      commonMistakes: [
        {
          title: "Using only WebSocket for all message delivery",
          explanation: "WebSocket connections are expensive for rarely-active users. HTTP long-poll or push notification is better for offline users.",
        },
        {
          title: "Sending media directly through the API server",
          explanation: "Media files should be uploaded to CDN directly to avoid bottlenecking the API servers.",
        },
      ],
      quizQuestions: [
        {
          question: "Which protocol is better for delivering messages to offline users?",
          options: ["WebSocket", "HTTP long-poll", "Email", "SMS"],
          correctIndex: 1,
          explanation: "HTTP long-poll or push notifications work better for rarely-active users than maintaining expensive WebSocket connections.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "hld",
      title: "High-Level Design",
      description: "Architecture for message delivery, presence, and media handling.",
      thinkingPrompt: "How does a message travel from sender to receiver? Where does encryption happen?",
      designDecision: "Client → API Gateway → Message Service → Message Queue (Kafka) → Fan-out Service → Delivery. For online recipients, WebSocket push immediately. For offline, store in Message DB (SQLite on device, Cassandra in cloud). Media: Client → CDN upload → return URL → message includes URL.",
      commonMistakes: [
        {
          title: "Not separating hot and cold message storage",
          explanation: "Recent messages are accessed frequently. Use different storage tiers (Redis for recent, Cassandra for older).",
        },
        {
          title: "Skipping message encryption at rest",
          explanation: "Messages should be encrypted at rest in addition to end-to-end encryption in transit.",
        },
      ],
      quizQuestions: [
        {
          question: "What is the role of the message queue in WhatsApp's architecture?",
          options: ["Encrypt messages", "Decouple send from delivery, absorb spikes", "Store messages permanently", "Route messages to wrong recipients"],
          correctIndex: 1,
          explanation: "Kafka decouples message sending from delivery, allowing the system to absorb message spikes without dropping messages.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "deep-dive",
      title: "Deep Dive",
      description: "End-to-end encryption, presence system, and message delivery semantics.",
      thinkingPrompt: "How does Signal Protocol work? How does presence tracking scale to 2B users?",
      designDecision: "End-to-end encryption: Signal Protocol with Double Ratchet. Each device has identity key pair, session chain key. Messages encrypted client-side. Server stores encrypted ciphertext only. Presence: WebSocket connection to presence service, batched updates every 30s, last-seen timestamps cached in Redis.",
      commonMistakes: [
        {
          title: "Trying to decrypt messages on the server",
          explanation: "End-to-end encryption means the server never has access to plaintext. It only stores and delivers encrypted blobs.",
        },
        {
          title: "Tracking presence in real-time for all users",
          explanation: "With 2B users, tracking every user's presence in real-time is expensive. Batch updates and approximate timestamps reduce load.",
        },
      ],
      quizQuestions: [
        {
          question: "In end-to-end encryption, who can read message content?",
          options: ["WhatsApp servers", "Government agencies", "Only sender and recipient", "Nobody"],
          correctIndex: 2,
          explanation: "End-to-end encryption ensures only the sender and recipient can read messages, not even the service provider.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      description: "Delivery guarantees, encryption trade-offs, and scalability decisions.",
      thinkingPrompt: "What happens if a message fails to deliver? How does encryption affect search and moderation?",
      designDecision: "At-least-once delivery with deduplication. Messages marked delivered when recipient comes online. Server-side search: not possible with E2E encryption (use client-side search on decrypted local DB). Moderation:举报机制而非主动扫描. Media:虽然E2E加密，但服务器存储加密blob以支持离线交付。",
      commonMistakes: [
        {
          title: "Promising instant delivery to offline users",
          explanation: "Offline users get messages when they reconnect. There's an inherent trade-off between battery life, connection cost, and immediacy.",
        },
        {
          title: "Building search without considering E2E encryption",
          explanation: "Server-side search is impossible with E2E encryption. Either client-side search or homomorphic encryption research is needed.",
        },
      ],
      quizQuestions: [
        {
          question: "Why can't WhatsApp search message content on the server?",
          options: ["Not enough storage", "Messages are end-to-end encrypted", "Too many messages", "Legal restrictions"],
          correctIndex: 1,
          explanation: "End-to-end encryption means the server only sees encrypted ciphertext, not plaintext content.",
        },
      ],
      architectureNodeIds: [],
      architectureEdgeIds: [],
    },
  ],
  architectureNodes: [],
  architectureEdges: [],
};

function MessageDeliveryVisualizer() {
  const [sended, setSended] = useState(0);
  const delivered = Math.floor(sended * 0.95);
  const read = Math.floor(delivered * 0.8);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Message Delivery Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Messages Sent</span>
            <Badge variant="outline">{sended}</Badge>
          </div>
          <Slider
            defaultValue={[sended]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v: number[]) => setSended(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-blue-500"
              />
              Sent
            </span>
            <span className="font-mono">{sended}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="h-3 w-3 text-emerald-500" />
              Delivered (95%)
            </span>
            <span className="font-mono">{delivered}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-blue-500" />
              Read (80%)
            </span>
            <span className="font-mono">{read}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          WhatsApp uses single tick (sent), double tick (delivered), blue tick (read).
        </div>
      </CardContent>
    </Card>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function EncryptionVisualizer() {
  const [showKeys, setShowKeys] = useState(false);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          End-to-End Encryption
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Show Key Exchange</span>
          <Badge variant="outline" className="cursor-pointer" onClick={() => setShowKeys(!showKeys)}>
            {showKeys ? "Hide" : "Show"}
          </Badge>
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Alice (Sender)</span>
            <Lock className="h-3 w-3" />
          </div>
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              {showKeys ? (
                <>Public Key →</>
              ) : (
                <span className="flex items-center gap-1">
                  <motion.span
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🔒
                  </motion.span>
                  Encrypted Message
                </span>
              )}
            </motion.div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Bob (Receiver)</span>
            <Lock className="h-3 w-3" />
          </div>
        </div>
        <AnimatePresence>
          {showKeys && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-2 text-xs"
            >
              <p className="font-medium text-amber-800 dark:text-amber-200">Signal Protocol:</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Uses Double Ratchet Algorithm with Curve25519 for key exchange. Each message uses a unique session key.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-xs text-muted-foreground">
          Only Alice and Bob can read messages. Not even WhatsApp servers can decrypt.
        </div>
      </CardContent>
    </Card>
  );
}

function PresenceSystemViz() {
  const [lastSeen, setLastSeen] = useState(30);

  const statusText = lastSeen === 0 ? "Online" : `Last seen ${lastSeen}s ago`;

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Presence System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Seconds Since Activity</span>
            <Badge variant="outline">{lastSeen}s</Badge>
          </div>
          <Slider
            defaultValue={[lastSeen]}
            min={0}
            max={300}
            step={5}
            onValueChange={(v: number[]) => setLastSeen(v[0])}
          />
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: lastSeen === 0 ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className={`h-3 w-3 rounded-full ${lastSeen === 0 ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
          />
          <span className="text-sm">{statusText}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Presence uses WebSocket for real-time updates. Batched last-seen reduces server load.
        </div>
      </CardContent>
    </Card>
  );
}

export default function WhatsAppCase() {
  return (
    <CaseStudyWalkthrough
      config={whatsappConfig}
      renderStepExtras={(step, stepIndex) => {
        if (stepIndex === 1) return <MessageDeliveryVisualizer />;
        if (stepIndex === 3) return <EncryptionVisualizer />;
        if (stepIndex === 4) return <PresenceSystemViz />;
        return null;
      }}
    />
  );
}