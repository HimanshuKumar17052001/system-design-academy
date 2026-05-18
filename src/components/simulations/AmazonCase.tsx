"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Search, CreditCard, TrendingUp, Zap } from "lucide-react";
import CaseStudyWalkthrough from "./CaseStudyWalkthrough";
import { amazonConfig } from "@/data/case-study-configs";

function InventoryReplenishmentSim() {
  const [inventory, setInventory] = useState(150);
  const [dailySales, setDailySales] = useState(30);
  const [leadDays, setLeadDays] = useState(7);

  const daysUntilStockout = Math.floor(inventory / dailySales);
  const reorderPoint = dailySales * leadDays;
  const needsReorder = inventory <= reorderPoint;

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          Inventory Replenishment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Current Inventory</span>
            <Badge variant="outline">{inventory} units</Badge>
          </div>
          <Slider
            defaultValue={[inventory]}
            min={0}
            max={500}
            step={10}
            onValueChange={(v: number[]) => setInventory(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Daily Sales</span>
            <Badge variant="outline">{dailySales}/day</Badge>
          </div>
          <Slider
            defaultValue={[dailySales]}
            min={5}
            max={100}
            step={5}
            onValueChange={(v: number[]) => setDailySales(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Supplier Lead Time</span>
            <Badge variant="outline">{leadDays} days</Badge>
          </div>
          <Slider
            defaultValue={[leadDays]}
            min={1}
            max={30}
            step={1}
            onValueChange={(v: number[]) => setLeadDays(v[0])}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Days Until Stockout</div>
            <motion.div
              key={daysUntilStockout}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${
                daysUntilStockout <= leadDays ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {daysUntilStockout}
            </motion.div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Reorder Point</div>
            <div className="text-xl font-bold text-amber-600">{reorderPoint}</div>
          </div>
        </div>
        {needsReorder && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-2 text-xs text-red-800 dark:text-red-300"
          >
            <Zap className="h-3 w-3 inline mr-1" />
            Reorder now! Stock will run out before new stock arrives.
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function SearchRankingSim() {
  const [relevance, setRelevance] = useState(80);
  const [price, setPrice] = useState(50);
  const [rating, setRating] = useState(4.5);

  const score = (relevance * 0.5) + ((5 - price / 20) * 100 * 0.25) + (rating * 20);

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Ranking Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Relevance Score</span>
            <Badge variant="outline">{relevance}%</Badge>
          </div>
          <Slider
            defaultValue={[relevance]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v: number[]) => setRelevance(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Price</span>
            <Badge variant="outline">${price}</Badge>
          </div>
          <Slider
            defaultValue={[price]}
            min={10}
            max={200}
            step={5}
            onValueChange={(v: number[]) => setPrice(v[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Rating</span>
            <Badge variant="outline">{rating}/5</Badge>
          </div>
          <Slider
            defaultValue={[rating * 20]}
            min={20}
            max={100}
            step={5}
            onValueChange={(v: number[]) => setRating(v[0] / 20)}
          />
        </div>
        <div className="rounded-md border bg-slate-50 dark:bg-slate-950 p-3">
          <div className="text-xs text-muted-foreground">Composite Ranking Score</div>
          <motion.div
            key={Math.round(score)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${
              score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600"
            }`}
          >
            {Math.round(score)}
          </motion.div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on: 50% relevance + 25% price competitiveness + 25% rating
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CartConversionFunnel() {
  const stages = [
    { name: "Product View", value: 100, color: "bg-blue-500" },
    { name: "Add to Cart", value: 35, color: "bg-amber-500" },
    { name: "Begin Checkout", value: 20, color: "bg-orange-500" },
    { name: "Payment Page", value: 15, color: "bg-red-500" },
    { name: "Purchase Complete", value: 12, color: "bg-emerald-500" },
  ];

  return (
    <Card size="sm" className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Cart Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, idx) => (
          <div key={stage.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{stage.name}</span>
              <span className="font-mono">{stage.value}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.value}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={`h-full ${stage.color}`}
              />
            </div>
          </div>
        ))}
        <div className="text-xs text-muted-foreground mt-2">
          Key drop-off: Add to Cart → Checkout. Optimize this step with guest checkout and saved payment methods.
        </div>
      </CardContent>
    </Card>
  );
}

export default function AmazonCase() {
  return (
    <CaseStudyWalkthrough
      config={amazonConfig}
      renderStepExtras={(step, stepIndex) => {
        if (stepIndex === 2) return <InventoryReplenishmentSim />;
        if (stepIndex === 3) return <SearchRankingSim />;
        if (stepIndex === 4) return <CartConversionFunnel />;
        return null;
      }}
    />
  );
}