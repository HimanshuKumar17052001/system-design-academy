"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, Award, CheckCircle, Loader2, PartyPopper } from "lucide-react";

interface CertificateData {
  success: boolean;
  downloadUrl?: string;
  emailed?: boolean;
  message?: string;
}

interface CertificateViewerProps {
  userName: string;
  courseName?: string;
  certificateNumber?: string;
  completionDate?: string;
}

export default function CertificateViewer({
  userName,
  courseName = "System Design Academy",
  certificateNumber,
  completionDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
}: CertificateViewerProps) {
  const [loading, setLoading] = useState<"idle" | "download" | "email">("idle");
  const [result, setResult] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(true);

  const handleGenerate = async (action: "download" | "email") => {
    setLoading(action);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data: CertificateData = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to generate certificate.");
      } else {
        setResult(data);
        if (action === "download" && data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading("idle");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-3 text-amber-800 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-200"
          >
            <PartyPopper className="size-5" />
            <span className="text-sm font-medium">
              Congratulations on completing the course!
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowCelebration(false)}
              className="ml-2"
            >
              <span className="sr-only">Dismiss</span>×
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="overflow-hidden border-2 border-amber-200/60 dark:border-amber-800/40">
          <CardHeader className="relative bg-gradient-to-br from-slate-50 to-slate-100 pb-6 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="size-5 text-amber-600" />
                Certificate of Completion
              </CardTitle>
              <Badge variant="secondary">Verified</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Certificate Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {/* Decorative border */}
              <div className="absolute inset-2 rounded-md border-2 border-slate-800/10 dark:border-slate-100/10" />
              <div className="absolute inset-3 rounded-md border border-amber-400/30" />

              <div className="relative space-y-4 py-6">
                <h2 className="text-2xl font-bold tracking-wide text-slate-800 dark:text-slate-100">
                  CERTIFICATE
                </h2>
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  OF COMPLETION
                </p>

                <div className="mx-auto my-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  This certifies that
                </p>

                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  {userName}
                </p>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  has successfully completed the course
                </p>

                <p className="text-lg font-medium text-slate-800 dark:text-slate-100">
                  {courseName}
                </p>

                <div className="flex flex-col items-center gap-1 pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <p>Completion Date: {completionDate}</p>
                  {certificateNumber && (
                    <p>Certificate Number: {certificateNumber}</p>
                  )}
                </div>

                <div className="mx-auto mt-4 h-px w-40 bg-slate-300 dark:bg-slate-600" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  System Design Academy
                </p>
              </div>
            </motion.div>

            {/* Status Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}
              {result?.success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                >
                  <CheckCircle className="size-4" />
                  {result.emailed
                    ? "Certificate emailed successfully!"
                    : result.message || "Certificate generated successfully!"}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 bg-muted/30 sm:flex-row sm:justify-center">
            <Button
              onClick={() => handleGenerate("download")}
              disabled={loading !== "idle"}
              className="w-full sm:w-auto"
            >
              {loading === "download" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Download Certificate
            </Button>

            <Button
              variant="outline"
              onClick={() => handleGenerate("email")}
              disabled={loading !== "idle"}
              className="w-full sm:w-auto"
            >
              {loading === "email" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Mail className="mr-2 size-4" />
              )}
              Email Certificate
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
