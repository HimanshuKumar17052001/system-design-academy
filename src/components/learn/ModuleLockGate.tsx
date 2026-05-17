"use client";

import { Lock } from "lucide-react";
import { useProgressStore } from "@/lib/progress";
import type { Module } from "@/types/curriculum";

interface ModuleLockGateProps {
  module: Module;
  children: React.ReactNode;
}

export function ModuleLockGate({ module, children }: ModuleLockGateProps) {
  const status = useProgressStore((s) => s.getModuleStatus(module.id));

  if (status === "locked") {
    return (
      <div className="relative rounded-xl border border-border bg-muted/30 p-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Lock className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Module Locked</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Complete the following prerequisites to unlock this module:
            </p>
            <ul className="mt-2 text-sm text-muted-foreground">
              {module.prerequisites.length > 0 ? (
                module.prerequisites.map((prereq) => (
                  <li key={prereq} className="font-mono text-xs">
                    {prereq}
                  </li>
                ))
              ) : (
                <li>This module has no defined prerequisites.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
