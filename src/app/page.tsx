"use client";

import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  CheckCircle,
  Layers,
  Server,
  Globe,
  ShieldCheck,
  Sparkles,
  MessageSquareCode,
  Boxes,
  Target,
  TrendingUp,
  Zap,
  Award,
  Users,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const phases = [
  {
    number: "01",
    title: "Foundations",
    modules: 7,
    icon: BookOpen,
    description: "HTTP, DNS, CDN, APIs, Databases, Scaling, Estimation",
  },
  {
    number: "02",
    title: "Low-Level Design",
    modules: 8,
    icon: Layers,
    description: "OOP, SOLID, Design Patterns, UML, Case Studies",
  },
  {
    number: "03",
    title: "Core Distributed Systems",
    modules: 9,
    icon: Server,
    description: "Load Balancing, Caching, Messaging, CAP, Consistency",
  },
  {
    number: "04",
    title: "Architecture Patterns",
    modules: 7,
    icon: Boxes,
    description: "Microservices, Event-Driven, CQRS, Sagas, Kubernetes",
  },
  {
    number: "05",
    title: "Reliability & Operations",
    modules: 5,
    icon: ShieldCheck,
    description: "Observability, Deployments, DR, Chaos Engineering",
  },
  {
    number: "06",
    title: "Real-World Systems",
    modules: 8,
    icon: Globe,
    description: "URL Shortener, Twitter, Uber, YouTube, Search",
  },
  {
    number: "07",
    title: "Expert Topics",
    modules: 5,
    icon: Sparkles,
    description: "Real-Time, ML Systems, Security, Payments, Global Scale",
  },
  {
    number: "08",
    title: "Interview Prep",
    modules: 4,
    icon: MessageSquareCode,
    description: "Framework, Mock Interviews, Pitfalls, Cheat Sheets",
  },
];

const features = [
  {
    icon: Zap,
    title: "Interactive Simulations",
    description: "25 hands-on labs — from load balancers to chaos engineering",
  },
  {
    icon: Target,
    title: "4 Question Types",
    description: "Multiple choice, drag-drop, fill-in-blank, and ordering quizzes",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Track completion, quiz scores, and study time across all modules",
  },
  {
    icon: Award,
    title: "Certificate on Completion",
    description: "Get a professional PDF certificate emailed to you upon finishing",
  },
  {
    icon: Users,
    title: "Built for SDE-1 & SDE-2",
    description: "Curated content targeting real interview questions and scenarios",
  },
  {
    icon: TrendingUp,
    title: "Real-World Case Studies",
    description: "Design URL Shortener, Twitter, Uber, YouTube like real engineers do",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:px-6 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-6 text-sm">
              53 Modules · 25 Simulations · 100% Free
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Master System
              <br />
              <span className="text-primary">Design & Architecture</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              From HTTP fundamentals to designing Uber and Twitter at scale.
              Interactive lessons, hands-on labs, and real-world case studies for
              your next system design interview.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 text-base">
                  Start Learning
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/HimanshuKumar17052001/system-design-academy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="text-base">
                  View on GitHub
                </Button>
              </a>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Beginner to Advanced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Self-Paced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Certificate Included</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "53", label: "Modules" },
              { value: "25", label: "Simulations" },
              { value: "200+", label: "Quiz Questions" },
              { value: "8", label: "Phases" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-foreground md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Phases */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Complete Curriculum
            </h2>
            <p className="mt-4 text-muted-foreground">
              8 phases covering everything from basics to expert-level system design
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/50"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {phase.number}
                    </span>
                  </div>
                  <h3 className="font-semibold">{phase.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {phase.modules} modules
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {phase.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Why This Platform?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Designed for engineers who want to ace system design interviews
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-3"
                >
                  <div className="w-fit rounded-lg bg-primary/10 p-2.5">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Master System Design?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Start with Module 1 and work your way through 53 interactive modules.
              Your certificate awaits at the finish line.
            </p>
            <div className="mt-8">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 text-base">
                  Start Learning Now
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free forever. No credit card required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground md:px-6">
          <p>
            Built with Next.js, Supabase, and shadcn/ui. Open source on{" "}
            <a
              href="https://github.com/HimanshuKumar17052001/system-design-academy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
