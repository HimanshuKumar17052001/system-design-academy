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
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden md:block"
      style={{
        background: isVisible
          ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.12), transparent 40%)`
          : "transparent",
        transition: "background 0.15s ease-out",
      }}
    />
  );
}