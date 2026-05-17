"use client";

import { useEffect, useState } from "react";

export function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (isMobile) return;

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
      window.removeEventListener("resize", checkMobile);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      {/* Main glow */}
      <div
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden md:block"
        style={{
          background: isVisible
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.12), transparent 40%)`
            : "transparent",
          transition: "background 0.15s ease-out",
        }}
      />
      {/* Matrix-style trailing dots - desktop only */}
      <div
        className="pointer-events-none fixed z-[9998] hidden md:block"
        style={{
          left: position.x - 6,
          top: position.y - 6,
          transition: "left 0.12s ease-out, top 0.12s ease-out",
        }}
      >
        <div className="flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-full bg-primary/50"
              style={{
                width: 12 - i * 3,
                height: 12 - i * 3,
                opacity: 0.8 - i * 0.25,
                transform: `scale(${1 - i * 0.15})`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}