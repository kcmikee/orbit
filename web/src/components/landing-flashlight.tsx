"use client";

import { useCallback, useEffect, useState } from "react";

export function LandingFlashlight() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [cardPositions, setCardPositions] = useState<
    Map<Element, { x: number; y: number; w: number; h: number }>
  >(new Map());

  const updateMouse = useCallback((e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    const updateCards = () => {
      const cards = document.querySelectorAll(".card");
      const next = new Map<
        Element,
        { x: number; y: number; w: number; h: number }
      >();
      cards.forEach((el) => {
        const rect = el.getBoundingClientRect();
        next.set(el, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          w: rect.width,
          h: rect.height,
        });
      });
      setCardPositions(next);
    };
    updateCards();
    window.addEventListener("resize", updateCards);
    window.addEventListener("scroll", updateCards, { passive: true });
    return () => {
      window.removeEventListener("resize", updateCards);
      window.removeEventListener("scroll", updateCards);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", updateMouse);
    return () => window.removeEventListener("mousemove", updateMouse);
  }, [updateMouse]);

  useEffect(() => {
    const mainBg = document.querySelector(".main-bg");
    if (mainBg && mainBg instanceof HTMLElement) {
      mainBg.style.setProperty("--mouse-x", `${mouse.x}px`);
      mainBg.style.setProperty("--mouse-y", `${mouse.y}px`);
    }
    cardPositions.forEach((pos, el) => {
      if (el instanceof HTMLElement) {
        const angle = Math.atan2(mouse.y - pos.y, mouse.x - pos.x);
        const deg = (angle * 180) / Math.PI + 90;
        el.style.setProperty("--mouse-x", `${mouse.x - (pos.x - pos.w / 2)}px`);
        el.style.setProperty("--mouse-y", `${mouse.y - (pos.y - pos.h / 2)}px`);
        el.style.setProperty("--mouse-angle", `${deg}deg`);
      }
    });
  }, [mouse, cardPositions]);

  return null;
}
