"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, GitMerge, Calculator } from "lucide-react";
import CaseStudyWalkthrough from "./CaseStudyWalkthrough";
import { twitterConfig } from "@/data/case-study-configs";

function FanOutCalculator() {
  const [followers, setFollowers] = useState(700);
  const writes = followers;
  const timeMs = followers * 1; // 1ms per write
  const timeSec = (timeMs / 1000).toFixed(1);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Fan-Out Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Follower Count</span>
            <Badge variant="outline">{followers.toLocaleString()}</Badge>
          </div>
          <Slider
            defaultValue={[followers]}
            min={10}
            max={50000}
            step={10}
            onValueChange={(v: number[]) => setFollowers(v[0])}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 p-3">
            <div className="text-xs text-rose-700 dark:text-rose-300">Writes Needed (Push)</div>
            <motion.div
              key={writes}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-rose-800 dark:text-rose-200"
            >
              {writes.toLocaleString()}
            </motion.div>
          </div>
          <div className="rounded-md border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-3">
            <div className="text-xs text-amber-700 dark:text-amber-300">Write Time @ 1ms/write</div>
            <motion.div
              key={timeSec}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-amber-800 dark:text-amber-200"
            >
              {timeSec}s
            </motion.div>
          </div>
        </div>
        {followers > 10000 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-2 text-xs text-red-800 dark:text-red-300"
          >
            <Zap className="h-3 w-3 inline mr-1" />
            Above 10K followers, push becomes expensive. This is the celebrity problem!
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function CelebrityThresholdSlider() {
  const [threshold, setThreshold] = useState(10000);
  const [followerCount, setFollowerCount] = useState(5000);

  const approach = followerCount >= threshold ? "Pull (Fan-out on Read)" : "Push (Fan-out on Write)";
  const color = followerCount >= threshold ? "text-amber-600" : "text-emerald-600";
  const bg = followerCount >= threshold ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800";

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Celebrity Threshold
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Threshold</span>
            <Badge variant="outline">{threshold.toLocaleString()} followers</Badge>
          </div>
          <Slider
            defaultValue={[threshold]}
            min={1000}
            max={50000}
            step={1000}
            onValueChange={(v: number[]) => setThreshold(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">User Follower Count</span>
            <Badge variant="outline">{followerCount.toLocaleString()}</Badge>
          </div>
          <Slider
            defaultValue={[followerCount]}
            min={100}
            max={50000}
            step={100}
            onValueChange={(v: number[]) => setFollowerCount(v[0])}
          />
        </div>
        <motion.div
          key={approach}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-md border p-3 ${bg}`}
        >
          <div className={`text-sm font-semibold ${color}`}>{approach}</div>
          <div className="text-xs mt-1 text-muted-foreground">
            {followerCount >= threshold
              ? "User has too many followers for push. Timeline is merged at read time."
              : "User has few enough followers to pre-compute timelines on write."}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

function TimelineMergeViz() {
  const [celebrityTweets] = useState([
    { id: "c1", author: "Elon", time: "2m ago", text: "Mars update..." },
    { id: "c2", author: "Elon", time: "15m ago", text: "Starship launch" },
  ]);
  const [normalTimeline] = useState([
    { id: "n1", author: "Alice", time: "1m ago", text: "Coffee time" },
    { id: "n2", author: "Bob", time: "5m ago", text: "New blog post" },
    { id: "n3", author: "Carol", time: "10m ago", text: "Weekend plans" },
  ]);

  const merged = useMemo(() => {
    const all = [...celebrityTweets, ...normalTimeline];
    return all.sort((a, b) => {
      const order = ["1m", "2m", "5m", "10m", "15m"];
      return order.indexOf(a.time.replace(" ago", "")) - order.indexOf(b.time.replace(" ago", ""));
    });
  }, [celebrityTweets, normalTimeline]);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitMerge className="h-4 w-4" />
          Timeline Merge Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-2">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Pre-computed (Normal)</div>
            <div className="space-y-1">
              {normalTimeline.map((t) => (
                <div key={t.id} className="text-xs rounded bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 border border-emerald-200 dark:border-emerald-800">
                  <span className="font-medium">{t.author}</span> <span className="text-muted-foreground">{t.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-xs font-semibold text-muted-foreground mb-2">On-Read (Celebrity)</div>
            <div className="space-y-1">
              {celebrityTweets.map((t) => (
                <div key={t.id} className="text-xs rounded bg-amber-50 dark:bg-amber-950/30 px-2 py-1 border border-amber-200 dark:border-amber-800">
                  <span className="font-medium">{t.author}</span> <span className="text-muted-foreground">{t.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <GitMerge className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="rounded-md border p-2">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Merged Home Timeline</div>
          <div className="space-y-1">
            {merged.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`text-xs rounded px-2 py-1 border ${
                  t.author === "Elon"
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                    : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                }`}
              >
                <span className="font-medium">{t.author}</span>{" "}
                <span className="text-muted-foreground">{t.time}</span>{" "}
                <span className="text-muted-foreground/70">— {t.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Celebrity tweets are merged at read time using a min-heap sorted by timestamp.
        </div>
      </CardContent>
    </Card>
  );
}

export default function TwitterCase() {
  return (
    <CaseStudyWalkthrough
      config={twitterConfig}
      renderStepExtras={(step, stepIndex) => {
        if (stepIndex === 1) return <FanOutCalculator />;
        if (stepIndex === 3) return <CelebrityThresholdSlider />;
        if (stepIndex === 4) return <TimelineMergeViz />;
        return null;
      }}
    />
  );
}
