"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  code: string;
  title?: string;
  caption?: string;
  className?: string;
}

export function MermaidDiagram({
  code,
  title,
  caption,
  className,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "#6366f1",
        primaryTextColor: "#fff",
        primaryBorderColor: "#818cf8",
        lineColor: "#94a3b8",
        secondaryColor: "#1e293b",
        tertiaryColor: "#0f172a",
        background: "#0f172a",
        mainBkg: "#1e293b",
        nodeBorder: "#6366f1",
        clusterBkg: "#1e293b",
        clusterBorder: "#475569",
        titleColor: "#f8fafc",
        edgeLabelBackground: "#1e293b",
      },
      flowchart: {
        curve: "basis",
        padding: 20,
      },
      sequence: {
        actorMargin: 50,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
      },
    });

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
        setError("");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to render diagram";
        setError(message);
        console.error("Mermaid render error:", err);
      }
    };

    renderDiagram();
  }, [code]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={cn("my-6 rounded-lg border bg-card", className)}>
      {(title || caption) && (
        <div className="border-b px-4 py-3">
          {title && <h4 className="font-semibold text-sm">{title}</h4>}
          {caption && (
            <p className="text-xs text-muted-foreground mt-1">{caption}</p>
          )}
        </div>
      )}

      <div className="relative">
        {error && (
          <div className="p-4 text-center text-sm text-destructive">
            <p>Failed to render diagram</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {svg && (
          <>
            <div
              className="overflow-hidden cursor-grab active:cursor-grabbing p-4"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="transition-transform duration-100"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>

            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="px-2 py-1 text-xs bg-muted hover:bg-accent rounded"
              >
                −
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                className="px-2 py-1 text-xs bg-muted hover:bg-accent rounded"
              >
                +
              </button>
              <button
                onClick={resetView}
                className="px-2 py-1 text-xs bg-muted hover:bg-accent rounded"
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      <div className="border-t px-4 py-2 bg-muted/30">
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            View source code
          </summary>
          <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto p-2 bg-muted rounded">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    </div>
  );
}