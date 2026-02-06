"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TRAIL_LENGTH = 12;
const POINTER_SIZE = 8;
const POINTER_SIZE_HOVER = 32;

export function LandingCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [hover, setHover] = useState(false);
  const rafRef = useRef<number>(0);
  const pointerRef = useRef<HTMLDivElement>(null);

  const updateMouse = useCallback((e: MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setPos({ x: e.clientX, y: e.clientY });
      setTrail((prev) => [
        { x: e.clientX, y: e.clientY },
        ...prev.slice(0, TRAIL_LENGTH - 1),
      ]);
      rafRef.current = 0;
    });
  }, []);

  useEffect(() => {
    const onOver = () => setHover(true);
    const onOut = () => setHover(false);
    const interactives =
      "a, button, [role='button'], [data-cursor-hover], .card a, .card button";
    document.querySelectorAll(interactives).forEach((el) => {
      el.addEventListener("mouseenter", onOver);
      el.addEventListener("mouseleave", onOut);
    });
    return () => {
      document.querySelectorAll(interactives).forEach((el) => {
        el.removeEventListener("mouseenter", onOver);
        el.removeEventListener("mouseleave", onOut);
      });
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", updateMouse);
    return () => window.removeEventListener("mousemove", updateMouse);
  }, [updateMouse]);

  // Hide default cursor when custom cursor is active (landing only)
  useEffect(() => {
    document.body.classList.add("landing-cursor-active");
    return () => document.body.classList.remove("landing-cursor-active");
  }, []);

  return (
    <>
      {/* Trailing SVG path */}
      <svg
        className="pointer-events-none fixed left-0 top-0 z-9998 h-full w-full"
        style={{ mixBlendMode: "difference" }}
      >
        <defs>
          <linearGradient
            id="cursor-trail-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(139,92,246,0.9)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0)" />
          </linearGradient>
        </defs>
        <path
          fill="none"
          stroke="url(#cursor-trail-gradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          d={trail
            .filter((p) => p.x !== 0 || p.y !== 0)
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ")}
        />
      </svg>
      {/* Dot pointer */}
      <div
        ref={pointerRef}
        className="pointer-events-none fixed z-9999 rounded-full border border-white/80 bg-violet-500/80 dark:border-violet-400/80 dark:bg-violet-500/60 transition-all duration-200 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          width: hover ? POINTER_SIZE_HOVER : POINTER_SIZE,
          height: hover ? POINTER_SIZE_HOVER : POINTER_SIZE,
          transform: "translate(-50%, -50%)",
        }}
      />
    </>
  );
}
