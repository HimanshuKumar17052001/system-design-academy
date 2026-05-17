"use client";

import React, { useState, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, CheckCircle2, AlertTriangle, Lightbulb, Code2 } from "lucide-react";

interface ValidationFinding {
  type: "syntax" | "pattern" | "solid" | "info";
  message: string;
  line?: number;
  tone: "good" | "warning" | "danger" | "neutral";
}

interface CodeLabProps {
  starterCode?: string;
  language?: string;
  hint?: string;
}

const DEFAULT_STARTER = `class ReportGenerator {
  void generatePDF() { /* ... */ }
  void generateExcel() { /* ... */ }
  void sendEmail() { /* ... */ }
  void saveToDatabase() { /* ... */ }
}`;

const toneIcons = {
  good: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  danger: <AlertTriangle className="h-4 w-4 text-red-500" />,
  neutral: <Lightbulb className="h-4 w-4 text-blue-500" />,
};

const toneBadge = {
  good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  neutral: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function CodeLab({ starterCode = DEFAULT_STARTER, language = "java", hint }: CodeLabProps) {
  const [code, setCode] = useState(starterCode);
  const [findings, setFindings] = useState<ValidationFinding[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const editorRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof Editor>["onMount"]>>[0] | null>(null);

  const handleEditorMount = useCallback((editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>["onMount"]>>[0]) => {
    editorRef.current = editor;
  }, []);

  const analyzeCode = useCallback(() => {
    const source = code;
    const lines = source.split("\n");
    const results: ValidationFinding[] = [];

    // --- Syntax checks (lightweight static analysis) ---
    const brackets: string[] = [];
    let inString = false;
    let stringChar = "";
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      const prev = source[i - 1];
      if (!inString && (ch === '"' || ch === "'" || ch === "`")) {
        inString = true;
        stringChar = ch;
      } else if (inString && ch === stringChar && prev !== "\\") {
        inString = false;
      } else if (!inString) {
        if (ch === "(" || ch === "{" || ch === "[") brackets.push(ch);
        else if (ch === ")" || ch === "}" || ch === "]") {
          const last = brackets.pop();
          const expected = ch === ")" ? "(" : ch === "}" ? "{" : "[";
          if (last !== expected) {
            results.push({ type: "syntax", message: `Mismatched bracket: expected ${expected} before ${ch}`, tone: "danger" });
          }
        }
      }
    }
    if (brackets.length > 0) {
      results.push({ type: "syntax", message: `Unclosed brackets: ${brackets.join(", ")}`, tone: "danger" });
    }
    if (results.filter((r) => r.type === "syntax").length === 0) {
      results.push({ type: "syntax", message: "Brackets are balanced", tone: "good" });
    }

    // --- Pattern detection ---
    const lower = source.toLowerCase();
    if (/getinstance\s*\(\)/.test(lower) && /private\s+.*constructor/.test(lower)) {
      results.push({ type: "pattern", message: "Singleton pattern detected: private constructor + getInstance()", tone: "good" });
    }
    if (/create\w*\s*\(.*\)/.test(source) && /interface|abstract/.test(lower)) {
      results.push({ type: "pattern", message: "Factory Method pattern likely present", tone: "good" });
    }
    if (/\.build\s*\(\)/.test(source) || /new\s+\w+\.Builder/.test(source)) {
      results.push({ type: "pattern", message: "Builder pattern detected", tone: "good" });
    }
    if (/extends\s+\w+/.test(source) && /implements\s+\w+/.test(source)) {
      results.push({ type: "pattern", message: "Adapter pattern likely present (extends + implements)", tone: "good" });
    }
    if (/decorate|wrapper|wrap/.test(lower)) {
      results.push({ type: "pattern", message: "Decorator pattern keyword detected", tone: "good" });
    }
    if (/strategy|algorithm|behaviour/.test(lower)) {
      results.push({ type: "pattern", message: "Strategy pattern keyword detected", tone: "good" });
    }
    if (/observer|subscribe|notify|listener/.test(lower)) {
      results.push({ type: "pattern", message: "Observer pattern keyword detected", tone: "good" });
    }
    if (results.filter((r) => r.type === "pattern").length === 0) {
      results.push({ type: "pattern", message: "No common design pattern signatures detected", tone: "neutral" });
    }

    // --- SOLID checks ---
    // Count methods per class
    const classMatches = [...source.matchAll(/class\s+(\w+)/g)];
    classMatches.forEach((match) => {
      const className = match[1];
      const classStart = match.index ?? 0;
      // rough block extraction: find the opening brace of this class
      const blockStart = source.indexOf("{", classStart);
      let braceCount = 0;
      let blockEnd = source.length;
      for (let i = blockStart; i < source.length; i++) {
        if (source[i] === "{") braceCount++;
        else if (source[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            blockEnd = i;
            break;
          }
        }
      }
      const classBody = source.slice(blockStart, blockEnd + 1);
      const methodMatches = [...classBody.matchAll(/\b(void|int|String|boolean|double|float|long|char|byte|short|Object|List|Map|Set|Iterable)\s+\w+\s*\(/g)];
      const methodCount = methodMatches.length;
      if (methodCount > 5) {
        results.push({
          type: "solid",
          message: `Class "${className}" has ${methodCount} methods — possible Single Responsibility Principle (SRP) violation`,
          tone: "warning",
        });
      }
    });

    if (/new\s+\w+\(.*\)/.test(source) && !/interface|abstract|Factory|DI|Inject/.test(source)) {
      results.push({
        type: "solid",
        message: "Direct instantiation detected — consider Dependency Inversion (depend on abstractions, not concrete classes)",
        tone: "warning",
      });
    }

    if (/if\s*\(.*instanceof\s+/.test(source)) {
      results.push({
        type: "solid",
        message: "Instanceof checks suggest tight coupling — possible Open/Closed Principle violation. Use polymorphism instead.",
        tone: "warning",
      });
    }

    const totalFindings = results.length;
    if (totalFindings > 0) {
      results.push({ type: "info", message: `Analysis complete: ${totalFindings} finding(s) found.`, tone: "neutral" });
    } else {
      results.push({ type: "info", message: "Analysis complete: no findings.", tone: "neutral" });
    }

    setFindings(results);
    setHasRun(true);
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setFindings([]);
    setHasRun(false);
    if (editorRef.current) {
      editorRef.current.setValue(starterCode);
    }
  }, [starterCode]);

  const lang = language.toLowerCase() === "typescript" ? "typescript" : language.toLowerCase() === "python" ? "python" : "java";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Code Editor</CardTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {lang}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg overflow-hidden border"
          >
            <Editor
              height="300px"
              language={lang}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </motion.div>

          {hint && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
              <span className="font-semibold">Hint: </span>
              {hint}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={analyzeCode}>
              <Play className="h-4 w-4 mr-1" />
              Run Analysis
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {hasRun && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <div className="space-y-2">
                    {findings.map((finding, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-start gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="mt-0.5 shrink-0">{toneIcons[finding.tone]}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase ${toneBadge[finding.tone]}`}
                            >
                              {finding.type}
                            </Badge>
                            {finding.line && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Line {finding.line}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1">{finding.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
