"use client";

import { RefObject, useEffect, useState } from "react";

export type PathLayout = {
  spacing: number;
  window: number;
  curve: number;
};

const DEFAULT_LAYOUT: PathLayout = {
  spacing: 120,
  window: 2,
  curve: 0.02,
};

export function usePathLayout(
  stageRef: RefObject<HTMLElement | null>,
): PathLayout {
  const [layout, setLayout] = useState<PathLayout>(DEFAULT_LAYOUT);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const update = () => {
      const width = node.clientWidth || window.innerWidth;
      // 5 numbers: center + ±1 fully in view, ±2 sit on the edge and crop.
      const spacing = Math.max(72, Math.floor(width / 4));

      setLayout({
        spacing,
        window: 2,
        curve: 0.02,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("orientationchange", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, [stageRef]);

  return layout;
}
