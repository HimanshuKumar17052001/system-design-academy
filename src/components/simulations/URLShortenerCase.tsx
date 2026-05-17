"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Link2,
  Hash,
  Clock,
  Database,
  HardDrive,
  Globe,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import CaseStudyWalkthrough from "./CaseStudyWalkthrough";
import { urlShortenerConfig } from "@/data/case-study-configs";

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(num: number): string {
  if (num === 0) return "0";
  let result = "";
  let n = num;
  while (n > 0) {
    result = BASE62[n % 62] + result;
    n = Math.floor(n / 62);
  }
  return result;
}

function Base62Demo() {
  const [input, setInput] = useState(123456789);
  const encoded = encodeBase62(input);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Base62 Encoder Demo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Input Number</label>
            <Input
              type="number"
              value={input}
              onChange={(e) => setInput(Math.max(0, Number(e.target.value)))}
              className="mt-1"
            />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground mt-5" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Base62 Output</label>
            <motion.div
              key={encoded}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono font-semibold"
            >
              {encoded}
            </motion.div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <code>62^6 = 56,800,235,584</code> unique codes with 6 characters.
        </div>
      </CardContent>
    </Card>
  );
}

function CacheSimulator() {
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [hitRate, setHitRate] = useState(85);
  const [requests, setRequests] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  const sendRequest = useCallback(() => {
    setRequests((r) => r + 1);
    if (Math.random() * 100 < hitRate) {
      setHits((h) => h + 1);
    } else {
      setMisses((m) => m + 1);
    }
  }, [hitRate]);

  const hitPercent = requests > 0 ? Math.round((hits / requests) * 100) : 0;
  const avgLatency = hits * 1 + misses * 40; // ms total
  const avgLatencyMs = requests > 0 ? (avgLatency / requests).toFixed(1) : "0";

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          Cache Hit/Miss Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={cacheEnabled} onCheckedChange={setCacheEnabled} />
            <span className="text-sm">Cache</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground w-16">Hit Rate</span>
            <Slider
              disabled={!cacheEnabled}
              defaultValue={[hitRate]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v: number[]) => setHitRate(v[0])}
              className="flex-1"
            />
            <span className="text-xs w-8">{hitRate}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={sendRequest} disabled={!cacheEnabled}>
            <ArrowRight className="h-3 w-3 mr-1" />
            Send Request
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setRequests(0); setHits(0); setMisses(0); }}>
            Reset
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Requests" value={requests} />
          <Metric label="Cache Hits" value={hits} color="text-emerald-600" />
          <Metric label="Cache Misses" value={misses} color="text-rose-600" />
        </div>
        <div className="rounded-md border p-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Actual Hit Rate:</span>
            <span className="font-semibold">{hitPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Latency:</span>
            <span className="font-semibold">{avgLatencyMs} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cache latency:</span>
            <span className="text-emerald-600">1 ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">DB latency:</span>
            <span className="text-rose-600">40 ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RedirectToggle() {
  const [use301, setUse301] = useState(true);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4" />
          301 vs 302 Redirect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={use301 ? "default" : "outline"}
            onClick={() => setUse301(true)}
          >
            301 Permanent
          </Button>
          <Button
            size="sm"
            variant={!use301 ? "default" : "outline"}
            onClick={() => setUse301(false)}
          >
            302 Temporary
          </Button>
        </div>
        <AnimatePresence mode="wait">
          {use301 ? (
            <motion.div
              key="301"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="rounded-md border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-3 text-sm"
            >
              <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                <Database className="h-4 w-4" />
                301: Browser caches forever
              </div>
              <ul className="mt-2 space-y-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                <li>• First redirect hits server + CDN</li>
                <li>• Subsequent redirects: browser cache (0ms)</li>
                <li>• Analytics undercounts repeat visits</li>
                <li>• Best for static, public short URLs</li>
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="302"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-3 text-sm"
            >
              <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                302: Browser does not cache
              </div>
              <ul className="mt-2 space-y-1 text-xs text-blue-700/80 dark:text-blue-400/80">
                <li>• Every redirect hits server / CDN</li>
                <li>• Enables accurate click analytics</li>
                <li>• Allows changing target URL later</li>
                <li>• Higher origin load at scale</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-md border bg-card p-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}

export default function URLShortenerCase() {
  return (
    <CaseStudyWalkthrough
      config={urlShortenerConfig}
      renderStepExtras={(step, stepIndex) => {
        if (stepIndex === 2) return <RedirectToggle />;
        if (stepIndex === 3) return <CacheSimulator />;
        if (stepIndex === 4) return <Base62Demo />;
        return null;
      }}
    />
  );
}
