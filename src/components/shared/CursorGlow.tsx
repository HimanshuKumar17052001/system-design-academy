"use client";

import { useEffect, useState } from "react";

export function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (Math.abs(x - lastX) > 5 || Math.abs(y - lastY) > 5) {
        setPosition({ x, y });
        setIsVisible(true);
        lastX = x;
        lastY = y;
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <>
      {/* Main glow */}
      <div
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
        style={{
          background: isVisible
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`
            : "transparent",
          transition: "background 0.1s ease-out",
        }}
      />
      {/* Matrix-style trailing dots */}
      <div
        className="pointer-events-none fixed z-[9998]"
        style={{
          left: position.x - 4,
          top: position.y - 4,
          transition: "left 0.15s ease-out, top 0.15s ease-out",
        }}
      >
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-full bg-primary/40 animate-pulse"
              style={{
                width: 8 - i * 2,
                height: 8 - i * 2,
                opacity: 1 - i * 0.3,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}