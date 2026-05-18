"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Upload, Film, Gauge, Cloud, Zap } from "lucide-react";
import CaseStudyWalkthrough from "./CaseStudyWalkthrough";
import { youtubeConfig } from "@/data/case-study-configs";

function TranscodingPipelineSim() {
  const [duration, setDuration] = useState(120);

  const phases = [
    { name: "Upload", time: duration * 0.1, color: "bg-blue-500" },
    { name: "Analysis", time: duration * 0.15, color: "bg-amber-500" },
    { name: "Transcode", time: duration * 0.5, color: "bg-orange-500" },
    { name: "Audio", time: duration * 0.1, color: "bg-purple-500" },
    { name: "Thumbnail", time: duration * 0.05, color: "bg-pink-500" },
    { name: "CDN Push", time: duration * 0.1, color: "bg-emerald-500" },
  ];

  const totalTime = phases.reduce((acc, p) => acc + p.time, 0);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Film className="h-4 w-4" />
          Transcoding Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Video Duration</span>
            <Badge variant="outline">{duration}s</Badge>
          </div>
          <Slider
            defaultValue={[duration]}
            min={30}
            max={600}
            step={30}
            onValueChange={(v: number[]) => setDuration(v[0])}
          />
        </div>
        <div className="space-y-2">
          {phases.map((phase) => (
            <div key={phase.name} className="flex items-center gap-2">
              <div className="w-16 text-xs text-muted-foreground">{phase.name}</div>
              <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(phase.time / totalTime) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${phase.color}`}
                />
              </div>
              <div className="w-12 text-xs text-right font-mono">
                {Math.round(phase.time)}s
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-md border bg-slate-50 dark:bg-slate-950 p-2 text-xs text-center">
          Total processing: ~{Math.round(totalTime)}s at 1x speed
        </div>
      </CardContent>
    </Card>
  );
}

function CDNCacheSim() {
  const [cacheHitRate, setCacheHitRate] = useState(85);
  const [requests, setRequests] = useState(100000);

  const cachedRequests = Math.round(requests * (cacheHitRate / 100));
  const originRequests = requests - cachedRequests;
  const latencySaved = cachedRequests * 50;
  const originLatency = originRequests * 200;

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          CDN Cache Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Cache Hit Rate</span>
            <Badge variant="outline">{cacheHitRate}%</Badge>
          </div>
          <Slider
            defaultValue={[cacheHitRate]}
            min={50}
            max={99}
            step={1}
            onValueChange={(v: number[]) => setCacheHitRate(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Requests</span>
            <Badge variant="outline">{requests.toLocaleString()}</Badge>
          </div>
          <Slider
            defaultValue={[requests]}
            min={10000}
            max={1000000}
            step={10000}
            onValueChange={(v: number[]) => setRequests(v[0])}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-3">
            <div className="text-xs text-emerald-700 dark:text-emerald-300">Cache Hits</div>
            <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
              {cachedRequests.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">~50ms latency</div>
          </div>
          <div className="rounded-md border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 p-3">
            <div className="text-xs text-red-700 dark:text-red-300">Origin Requests</div>
            <div className="text-xl font-bold text-red-800 dark:text-red-200">
              {originRequests.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">~200ms latency</div>
          </div>
        </div>
        <div className="rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-3">
          <div className="text-xs text-blue-700 dark:text-blue-300">Total Latency Budget</div>
          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {(latencySaved + originLatency) / 1000}s
          </div>
          <div className="text-xs text-muted-foreground">
            vs {(requests * 200) / 1000}s without CDN
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationEnginesSim() {
  const [views, setViews] = useState(1000);
  const [engagement, setEngagement] = useState(65);
  const [recsShown, setRecsShown] = useState(5);

  const predictedCTR = (engagement / 100) * (views / 1000) * 0.1;
  const clickedRecs = Math.round(recsShown * predictedCTR);
  const rankScore = (views * 0.3) + (engagement * 5) + (clickedRecs * 20);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Recommendation Ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Video Views</span>
            <Badge variant="outline">{views.toLocaleString()}</Badge>
          </div>
          <Slider
            defaultValue={[views]}
            min={100}
            max={10000}
            step={100}
            onValueChange={(v: number[]) => setViews(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Engagement Rate</span>
            <Badge variant="outline">{engagement}%</Badge>
          </div>
          <Slider
            defaultValue={[engagement]}
            min={10}
            max={95}
            step={5}
            onValueChange={(v: number[]) => setEngagement(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Recommendations Shown</span>
            <Badge variant="outline">{recsShown}</Badge>
          </div>
          <Slider
            defaultValue={[recsShown]}
            min={1}
            max={20}
            step={1}
            onValueChange={(v: number[]) => setRecsShown(v[0])}
          />
        </div>
        <div className="rounded-md border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-3">
          <div className="text-xs text-amber-700 dark:text-amber-300">Video Rank Score</div>
          <motion.div
            key={Math.round(rankScore)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${
              rankScore >= 500 ? "text-emerald-600" : rankScore >= 200 ? "text-amber-600" : "text-red-600"
            }`}
          >
            {Math.round(rankScore)}
          </motion.div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on: views (30%) + engagement (33%) + CTR on recs (37%)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function YouTubeCase() {
  return (
    <CaseStudyWalkthrough
      config={youtubeConfig}
      renderStepExtras={(step, stepIndex) => {
        if (stepIndex === 2) return <TranscodingPipelineSim />;
        if (stepIndex === 3) return <CDNCacheSim />;
        if (stepIndex === 4) return <RecommendationEnginesSim />;
        return null;
      }}
    />
  );
}