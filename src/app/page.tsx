"use client";

import { useState, useEffect } from "react";
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
  Info,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { useTheme } from "next-themes";

const phases = [
  {
    number: "01",
    title: "Foundations",
    modules: 7,
    icon: BookOpen,
    description: "HTTP, DNS, CDN, APIs, Databases, Scaling, Estimation",
    topics: [
      "HTTP/1.1 vs HTTP/2 vs HTTP/3",
      "DNS resolution flow",
      "CDN caching strategies",
      "REST vs GraphQL vs gRPC",
      "SQL vs NoSQL databases",
      "Vertical vs Horizontal scaling",
      "Back-of-envelope estimation",
    ],
  },
  {
    number: "02",
    title: "Low-Level Design",
    modules: 8,
    icon: Layers,
    description: "OOP, SOLID, Design Patterns, UML, Case Studies",
    topics: [
      "OOP principles & classes",
      "SOLID principles deep dive",
      "Creational patterns (Singleton, Factory)",
      "Structural patterns (Adapter, Decorator)",
      "Behavioral patterns (Observer, Strategy)",
      "UML class & sequence diagrams",
      "Design Parking Lot system",
      "Design Elevator system",
    ],
  },
  {
    number: "03",
    title: "Core Distributed Systems",
    modules: 9,
    icon: Server,
    description: "Load Balancing, Caching, Messaging, CAP, Consistency",
    topics: [
      "Load balancer algorithms",
      "Cache eviction strategies",
      "CDN architecture",
      "Database sharding & replication",
      "Message queues & pub-sub",
      "CAP theorem trade-offs",
      "Rate limiting algorithms",
      "Consistent hashing",
      "Distributed transactions",
    ],
  },
  {
    number: "04",
    title: "Architecture Patterns",
    modules: 7,
    icon: Boxes,
    description: "Microservices, Event-Driven, CQRS, Sagas, Kubernetes",
    topics: [
      "Monolith vs Microservices",
      "API Gateway patterns",
      "Event-driven architecture",
      "CQRS & Event Sourcing",
      "Saga pattern (orchestration vs choreography)",
      "Circuit breaker pattern",
      "Kubernetes fundamentals",
    ],
  },
  {
    number: "05",
    title: "Reliability & Operations",
    modules: 5,
    icon: ShieldCheck,
    description: "Observability, Deployments, DR, Chaos Engineering",
    topics: [
      "Observability (metrics, logs, traces)",
      "Blue-Green & Canary deployments",
      "Disaster recovery strategies",
      "Chaos engineering principles",
      "Auto-scaling policies",
    ],
  },
  {
    number: "06",
    title: "Real-World Systems",
    modules: 8,
    icon: Globe,
    description: "URL Shortener, Twitter, Uber, YouTube, Search",
    topics: [
      "Design URL Shortener (Base62)",
      "Design Rate Limiter",
      "Design Twitter feed",
      "Design WhatsApp messaging",
      "Design YouTube video streaming",
      "Design Uber ride matching",
      "Design Amazon e-commerce",
      "Design Search Autocomplete",
    ],
  },
  {
    number: "07",
    title: "Expert Topics",
    modules: 5,
    icon: Sparkles,
    description: "Real-Time, ML Systems, Security, Payments, Global Scale",
    topics: [
      "WebSocket & SSE real-time systems",
      "ML serving pipelines",
      "Security (JWT, OAuth, mTLS)",
      "Payment processing & idempotency",
      "Multi-region global scale",
    ],
  },
  {
    number: "08",
    title: "Interview Prep",
    modules: 4,
    icon: MessageSquareCode,
    description: "Framework, Mock Interviews, Pitfalls, Cheat Sheets",
    topics: [
      "4-step interview framework",
      "45-min mock interview timer",
      "Common pitfalls to avoid",
      "Quick reference cheat sheets",
    ],
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

function PhaseCard({ phase, index }: { phase: typeof phases[0]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const Icon = phase.icon;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={() => isMobile && setFlipped(!flipped)}
      onMouseEnter={() => !isMobile && setFlipped(true)}
      onMouseLeave={() => !isMobile && setFlipped(false)}
    >
      <motion.div
        className="relative h-[280px] sm:h-[300px] w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border bg-card p-5 sm:p-6 transition-colors group-hover:border-primary/50 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Icon className="size-5 sm:size-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {phase.number}
            </span>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold text-base sm:text-lg">{phase.title}</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
              {phase.modules} modules
            </p>
          </div>
          
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {phase.description}
          </p>
          
          <div className="mt-auto pt-3 flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground/70">
            <Info className="size-3" />
            <span>{isMobile ? "Tap to see topics" : "Hover to see topics"}</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border bg-card p-5 sm:p-6 flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between shrink-0 mb-3 pb-3 border-b">
            <h3 className="font-semibold text-sm">{phase.title}</h3>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {phase.number}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ul className="space-y-2">
              {phase.topics.map((topic, i) => (
                <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CheckCircle className="size-3 sm:size-4 mt-0.5 shrink-0 text-primary/70" />
                  <span className="leading-snug">{topic}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 pt-3 border-t shrink-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 text-center">
              {phase.modules} modules · {phase.topics.length} topics
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="fixed top-4 right-4 z-50"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const handleStartLearning = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />

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
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 text-base">
                    Start Learning
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="gap-2 text-base" onClick={handleStartLearning}>
                  Start Learning
                  <ArrowRight className="size-4" />
                </Button>
              )}
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

      {/* Curriculum Phases with Flip Cards */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Complete Curriculum
            </h2>
            <p className="mt-4 text-muted-foreground">
              8 phases covering everything from basics to expert-level system design
            </p>
            <p className="mt-2 text-xs text-muted-foreground hidden sm:block">
              Hover over any card to see topics
            </p>
            <p className="mt-2 text-xs text-muted-foreground sm:hidden">
              Tap any card to see topics
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase, i) => (
              <PhaseCard key={phase.number} phase={phase} index={i} />
            ))}
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
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 text-base">
                    Start Learning Now
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="gap-2 text-base" onClick={handleStartLearning}>
                  Start Learning Now
                  <ArrowRight className="size-4" />
                </Button>
              )}
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

      {/* Auth Modal */}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
