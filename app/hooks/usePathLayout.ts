"use client";

import { RefObject, useEffect, useState } from "react";

export type PathLayout = {
  spacing: number;
  window: number;
  curve: number;
};

const DEFAULT_LAYOUT: PathLayout = {
  spacing: 160,
  window: 10,
  curve: 0.01,
};

export function usePathLayout(
  stageRef: RefObject<HTMLElement | null>,
): PathLayout {
  const [layout, setLayout] = useState<PathLayout>(DEFAULT_LAYOUT);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const update = () => {
      const width = Math.min(node.clientWidth || window.innerWidth, 920);
      const spacing =
        width < 380 ? 64 : width < 520 ? 78 : width < 760 ? 104 : width < 920 ? 132 : 160;
      const visible = Math.max(3, Math.floor(width / spacing));
      const side = Math.max(2, Math.floor((visible - 1) / 2));

      setLayout({
        spacing,
        window: Math.min(10, side),
        curve: width < 520 ? 0.006 : width < 760 ? 0.008 : 0.01,
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
