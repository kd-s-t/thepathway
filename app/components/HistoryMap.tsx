"use client";

import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { PATH_MAX, type PathRecord } from "@/lib/path-record";

const VIEW_W = 1000;
const VIEW_H = 640;
const PAD_X = 72;
const PAD_Y = 64;

type Point = {
  index: number;
  value: number;
  x: number;
  y: number;
};

type HistoryMapProps = {
  records: PathRecord[];
  focus: number;
  onFocus: (index: number) => void;
  onSelect: (index: number) => void;
};

function buildPoints(records: PathRecord[]): Point[] {
  if (records.length === 0) return [];
  const usableW = VIEW_W - PAD_X * 2;
  const usableH = VIEW_H - PAD_Y * 2;
  const yStep = records.length === 1 ? 0 : usableH / (records.length - 1);
  const last = records.length - 1;

  return records.map((record, index) => ({
    index,
    value: record.value,
    x: PAD_X + ((clamp(record.value, 1, PATH_MAX) - 1) / (PATH_MAX - 1)) * usableW,
    // Latest at top, oldest at bottom.
    y: PAD_Y + (last - index) * yStep,
  }));
}

function toPath(points: Point[]) {
  if (points.length === 0) return "";
  // Draw oldest -> newest so the trail climbs toward the latest.
  const ordered = [...points].sort((a, b) => a.index - b.index);
  return ordered
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

export default function HistoryMap({
  records,
  focus,
  onFocus,
  onSelect,
}: HistoryMapProps) {
  const progress = useMotionValue(0);
  const [drawn, setDrawn] = useState(0);
  const points = useMemo(() => buildPoints(records), [records]);
  const d = useMemo(() => toPath(points), [points]);

  useEffect(() => {
    progress.set(0);
    const controls = animate(progress, 1, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [d, progress]);

  useMotionValueEvent(progress, "change", setDrawn);

  return (
    <div className="trail-canvas">
      <svg
        className="trail-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Record history map"
      >
        <defs>
          <linearGradient id="trail-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0b4b8" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#ffd6d9" stopOpacity="1" />
            <stop offset="100%" stopColor="#e85a64" stopOpacity="0.85" />
          </linearGradient>
          <filter id="trail-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {[0, 0.5, 1].map((t) => {
          const x = PAD_X + t * (VIEW_W - PAD_X * 2);
          return (
            <line
              key={t}
              x1={x}
              y1={PAD_Y - 18}
              x2={x}
              y2={VIEW_H - PAD_Y + 18}
              className="trail-grid"
            />
          );
        })}

        {d ? (
          <>
            <path
              d={d}
              fill="none"
              className="trail-path-glow"
              filter="url(#trail-blur)"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - drawn}
            />
            <path
              d={d}
              fill="none"
              className="trail-path"
              stroke="url(#trail-glow)"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - drawn}
            />
          </>
        ) : null}

        {points.map((point) => {
          const isFocus = point.index === focus;
          const visible =
            drawn > point.index / Math.max(points.length, 1) - 0.05;

          return (
            <g
              key={`${point.value}-${point.index}`}
              className={isFocus ? "trail-node is-focus" : "trail-node"}
              opacity={visible ? 1 : 0}
            >
              {isFocus ? (
                <circle cx={point.x} cy={point.y} r={28} className="trail-ring" />
              ) : null}
              <circle
                cx={point.x}
                cy={point.y}
                r={isFocus ? 10 : 6}
                className="trail-dot"
                onClick={() => {
                  onFocus(point.index);
                  onSelect(point.index);
                }}
              />
              <text
                x={point.x}
                y={point.y - (isFocus ? 36 : 22)}
                className="trail-label"
                onClick={() => {
                  onFocus(point.index);
                  onSelect(point.index);
                }}
              >
                {point.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
