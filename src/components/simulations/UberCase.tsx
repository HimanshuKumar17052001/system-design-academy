"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car, Star, Zap, TrendingUp, DollarSign } from "lucide-react";
import CaseStudyWalkthrough from "./CaseStudyWalkthrough";
import { uberConfig } from "@/data/case-study-configs";

interface Driver {
  id: number;
  x: number;
  y: number;
  available: boolean;
}

function generateDrivers(count: number): Driver[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    available: Math.random() > 0.3,
  }));
}

function MapGrid() {
  const [drivers, setDrivers] = useState<Driver[]>(() => generateDrivers(20));
  const [searching, setSearching] = useState(false);
  const [radius, setRadius] = useState(0);
  const [foundDrivers, setFoundDrivers] = useState<number[]>([]);
  const [nearestId, setNearestId] = useState<number | null>(null);
  const rider = { x: 50, y: 50 };

  const findNearest = useCallback(() => {
    setSearching(true);
    setRadius(0);
    setFoundDrivers([]);
    setNearestId(null);

    let step = 0;
    const maxSteps = 30;
    const interval = setInterval(() => {
      step++;
      const r = (step / maxSteps) * 50;
      setRadius(r);

      const found = drivers
        .filter((d) => d.available)
        .filter((d) => {
          const dist = Math.hypot(d.x - rider.x, d.y - rider.y);
          return dist <= r;
        })
        .map((d) => d.id);
      setFoundDrivers(found);

      if (step >= maxSteps) {
        clearInterval(interval);
        setSearching(false);
        const nearest = drivers
          .filter((d) => d.available)
          .sort((a, b) => {
            const da = Math.hypot(a.x - rider.x, a.y - rider.y);
            const db = Math.hypot(b.x - rider.x, b.y - rider.y);
            return da - db;
          })[0];
        if (nearest) setNearestId(nearest.id);
      }
    }, 80);
  }, [drivers, rider.x, rider.y]);

  const reset = useCallback(() => {
    setDrivers(generateDrivers(20));
    setSearching(false);
    setRadius(0);
    setFoundDrivers([]);
    setNearestId(null);
  }, []);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Driver Search Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative w-full aspect-square rounded-md border bg-slate-50 dark:bg-slate-950 overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <React.Fragment key={i}>
                <div className="absolute bg-foreground" style={{ left: `${i * 10}%`, top: 0, bottom: 0, width: 1 }} />
                <div className="absolute bg-foreground" style={{ top: `${i * 10}%`, left: 0, right: 0, height: 1 }} />
              </React.Fragment>
            ))}
          </div>

          {/* Search radius */}
          <AnimatePresence>
            {searching && (
              <motion.div
                className="absolute rounded-full border-2 border-dashed border-blue-400 opacity-30"
                style={{
                  left: `${rider.x}%`,
                  top: `${rider.y}%`,
                  width: `${radius * 2}%`,
                  height: `${radius * 2}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              />
            )}
          </AnimatePresence>

          {/* Drivers */}
          {drivers.map((d) => {
            const isFound = foundDrivers.includes(d.id);
            const isNearest = d.id === nearestId;
            const dist = Math.hypot(d.x - rider.x, d.y - rider.y);
            const inRange = dist <= radius;

            return (
              <motion.div
                key={d.id}
                className="absolute"
                style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%, -50%)" }}
                animate={
                  isNearest
                    ? { scale: [1, 1.4, 1] }
                    : isFound
                      ? { scale: 1.2 }
                      : { scale: 1 }
                }
                transition={isNearest ? { repeat: Infinity, duration: 0.8 } : {}}
              >
                <div
                  className={`rounded-full p-1 ${
                    isNearest
                      ? "bg-blue-500 text-white shadow-lg ring-2 ring-blue-300"
                      : isFound
                        ? "bg-emerald-500 text-white"
                        : d.available
                          ? "bg-slate-400 text-white"
                          : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <Car className="h-3 w-3" />
                </div>
              </motion.div>
            );
          })}

          {/* Rider */}
          <div
            className="absolute"
            style={{ left: `${rider.x}%`, top: `${rider.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="rounded-full bg-red-500 text-white p-1.5 shadow-lg ring-2 ring-red-300">
              <Star className="h-3 w-3" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={findNearest} disabled={searching}>
            <Zap className="h-3 w-3 mr-1" />
            Find Nearest Driver
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>

        {nearestId !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-2 text-xs text-blue-800 dark:text-blue-300"
          >
            <Zap className="h-3 w-3 inline mr-1" />
            Driver #{nearestId} is the nearest available match. Broadcast request sent.
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function SurgePricingCalc() {
  const [supply, setSupply] = useState(50);
  const [demand, setDemand] = useState(80);

  const ratio = supply / Math.max(demand, 1);
  const multiplier = useMemo(() => {
    if (ratio >= 1.0) return 1.0;
    if (ratio >= 0.8) return 1.2;
    if (ratio >= 0.6) return 1.5;
    if (ratio >= 0.4) return 2.0;
    if (ratio >= 0.2) return 3.0;
    return 5.0;
  }, [ratio]);

  const priceColor = multiplier <= 1.2 ? "text-emerald-600" : multiplier <= 2.0 ? "text-amber-600" : "text-red-600";
  const priceBg = multiplier <= 1.2 ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : multiplier <= 2.0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Surge Pricing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Available Drivers (Supply)</span>
            <Badge variant="outline">{supply}</Badge>
          </div>
          <Slider
            defaultValue={[supply]}
            min={10}
            max={200}
            step={5}
            onValueChange={(v: number[]) => setSupply(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Ride Requests (Demand)</span>
            <Badge variant="outline">{demand}</Badge>
          </div>
          <Slider
            defaultValue={[demand]}
            min={10}
            max={200}
            step={5}
            onValueChange={(v: number[]) => setDemand(v[0])}
          />
        </div>
        <div className={`rounded-md border p-3 ${priceBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Supply / Demand Ratio</div>
              <div className="text-sm font-semibold">{ratio.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Price Multiplier</div>
              <motion.div
                key={multiplier}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`text-2xl font-bold ${priceColor}`}
              >
                <DollarSign className="h-5 w-5 inline" />
                {multiplier.toFixed(1)}×
              </motion.div>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {multiplier > 1
            ? "High demand relative to supply triggers surge pricing to attract more drivers."
            : "Supply meets or exceeds demand. Standard pricing applies."}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UberCase() {
  return (
    <CaseStudyWalkthrough
      config={uberConfig}
      renderStepExtras={(step, stepIndex) => {
        if (stepIndex === 3) return <MapGrid />;
        if (stepIndex === 4) return <SurgePricingCalc />;
        return null;
      }}
    />
  );
}
