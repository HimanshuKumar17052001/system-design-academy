"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Globe, Film, Users, Cpu, TrendingUp } from "lucide-react";
import CaseStudyWalkthrough from "./CaseStudyWalkthrough";
import { netflixConfig } from "@/data/case-study-configs";

function ContentDeliverySim() {
  const [regions, setRegions] = useState(4);
  const [cdnPop, setCdnPop] = useState(50);
  const [viewers, setViewers] = useState(1000000);

  const totalBandwidthGbps = (viewers * 5) / 1000;
  const cachedBandwidth = totalBandwidthGbps * (cdnPop / 100);
  const originBandwidth = totalBandwidthGbps - cachedBandwidth;

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Content Delivery Network
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">CDN PoPs (Points of Presence)</span>
            <Badge variant="outline">{cdnPop}</Badge>
          </div>
          <Slider
            defaultValue={[cdnPop]}
            min={10}
            max={100}
            step={5}
            onValueChange={(v: number[]) => setCdnPop(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Concurrent Viewers</span>
            <Badge variant="outline">{(viewers / 1000000).toFixed(1)}M</Badge>
          </div>
          <Slider
            defaultValue={[viewers]}
            min={100000}
            max={5000000}
            step={100000}
            onValueChange={(v: number[]) => setViewers(v[0])}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-3">
            <div className="text-xs text-emerald-700 dark:text-emerald-300">CDN Bandwidth</div>
            <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
              {cachedBandwidth.toFixed(1)} Gbps
            </div>
            <div className="text-xs text-muted-foreground">Served from cache</div>
          </div>
          <div className="rounded-md border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 p-3">
            <div className="text-xs text-red-700 dark:text-red-300">Origin Bandwidth</div>
            <div className="text-lg font-bold text-red-800 dark:text-red-200">
              {originBandwidth.toFixed(1)} Gbps
            </div>
            <div className="text-xs text-muted-foreground">Origin servers</div>
          </div>
        </div>
        <div className="rounded-md border bg-slate-50 dark:bg-slate-950 p-2 text-xs text-center">
          Cache efficiency: {cdnPop}% — {cdnPop >= 80 ? "Excellent" : "Consider more PoPs"}
        </div>
      </CardContent>
    </Card>
  );
}

function PersonalizationEngineSim() {
  const [watchHistory, setWatchHistory] = useState(500);
  const [ratings, setRatings] = useState(100);
  const [sessionTime, setSessionTime] = useState(45);

  const qualityScore = Math.min(100, (watchHistory * 0.1) + (ratings * 0.3) + (sessionTime * 1.5));
  const recommendations = Math.round(qualityScore / 10);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Film className="h-4 w-4" />
          Personalization Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Watch History</span>
            <Badge variant="outline">{watchHistory} titles</Badge>
          </div>
          <Slider
            defaultValue={[watchHistory]}
            min={0}
            max={1000}
            step={50}
            onValueChange={(v: number[]) => setWatchHistory(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Explicit Ratings</span>
            <Badge variant="outline">{ratings}</Badge>
          </div>
          <Slider
            defaultValue={[ratings]}
            min={0}
            max={500}
            step={25}
            onValueChange={(v: number[]) => setRatings(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Session Time</span>
            <Badge variant="outline">{sessionTime} min</Badge>
          </div>
          <Slider
            defaultValue={[sessionTime]}
            min={5}
            max={120}
            step={5}
            onValueChange={(v: number[]) => setSessionTime(v[0])}
          />
        </div>
        <div className="rounded-md border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-3">
          <div className="text-xs text-amber-700 dark:text-amber-300">Personalization Quality</div>
          <motion.div
            key={Math.round(qualityScore)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${
              qualityScore >= 80 ? "text-emerald-600" : qualityScore >= 50 ? "text-amber-600" : "text-red-600"
            }`}
          >
            {Math.round(qualityScore)}%
          </motion.div>
          <div className="text-xs text-muted-foreground mt-1">
            Expected: {recommendations} relevant recommendations per row
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GlobalScalingSim() {
  const [regions, setRegions] = useState(4);
  const [activeUsers, setActiveUsers] = useState(50);
  const [failoverTime, setFailoverTime] = useState(30);

  const totalCapacity = regions * 20;
  const utilization = (activeUsers / totalCapacity) * 100;
  const riskScore = Math.max(0, utilization - 80) + (failoverTime * 0.5);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Global Scaling Risk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Active Regions</span>
            <Badge variant="outline">{regions}</Badge>
          </div>
          <Slider
            defaultValue={[regions]}
            min={1}
            max={10}
            step={1}
            onValueChange={(v: number[]) => setRegions(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Active Users (millions)</span>
            <Badge variant="outline">{activeUsers}M</Badge>
          </div>
          <Slider
            defaultValue={[activeUsers]}
            min={10}
            max={200}
            step={10}
            onValueChange={(v: number[]) => setActiveUsers(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Failover Time (seconds)</span>
            <Badge variant="outline">{failoverTime}s</Badge>
          </div>
          <Slider
            defaultValue={[failoverTime]}
            min={0}
            max={120}
            step={5}
            onValueChange={(v: number[]) => setFailoverTime(v[0])}
          />
        </div>
        <div className="rounded-md border bg-slate-50 dark:bg-slate-950 p-3">
          <div className="text-xs text-muted-foreground">Region Capacity Utilization</div>
          <div className="mt-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilization, 100)}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full ${
                utilization >= 90
                  ? "bg-red-500"
                  : utilization >= 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-md border p-3 text-center ${
            riskScore <= 10
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
              : riskScore <= 30
                ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                : "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
          }`}
        >
          <div className="text-xs text-muted-foreground">Risk Score</div>
          <div className={`text-2xl font-bold ${
            riskScore <= 10 ? "text-emerald-600" : riskScore <= 30 ? "text-amber-600" : "text-red-600"
          }`}>
            {Math.round(riskScore)}
          </div>
          <div className="text-xs text-muted-foreground">
            {riskScore <= 10 ? "Low risk — stable" : riskScore <= 30 ? "Moderate — monitor closely" : "High risk — scale now"}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

export default function NetflixCase() {
  return (
    <CaseStudyWalkthrough
      config={netflixConfig}
      renderStepExtras={(step, stepIndex) => {
        if (stepIndex === 2) return <ContentDeliverySim />;
        if (stepIndex === 3) return <PersonalizationEngineSim />;
        if (stepIndex === 4) return <GlobalScalingSim />;
        return null;
      }}
    />
  );
}