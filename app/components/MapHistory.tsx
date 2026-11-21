"use client";

import { animate, motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";

const PATH_MAX = 1000;
const VIEW_W = 1000;
const VIEW_H = 640;
const PAD_X = 72;
const PAD_Y = 64;

type MapHistoryProps = {
  records: number[];
  activeIndex: number;
  busy: boolean;
  onSelect: (index: number) => void;
  onEdit: (index: number, value: number) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
  onClose: () => void;
};

type Point = {
  index: number;
  value: number;
  x: number;
  y: number;
};

function buildPoints(records: number[]): Point[] {
  if (records.length === 0) return [];
  const usableW = VIEW_W - PAD_X * 2;
  const usableH = VIEW_H - PAD_Y * 2;
  const yStep = records.length === 1 ? 0 : usableH / (records.length - 1);

  return records.map((value, index) => ({
    index,
    value,
    x: PAD_X + ((clamp(value, 1, PATH_MAX) - 1) / (PATH_MAX - 1)) * usableW,
    y: PAD_Y + index * yStep,
  }));
}

function toPath(points: Point[]) {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

export default function MapHistory({
  records,
  activeIndex,
  busy,
  onSelect,
  onEdit,
  onRemove,
  onClose,
}: MapHistoryProps) {
  const [focus, setFocus] = useState(activeIndex);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const progress = useMotionValue(0);
  const [drawn, setDrawn] = useState(0);

  const points = useMemo(() => buildPoints(records), [records]);
  const d = useMemo(() => toPath(points), [points]);
  const focused = points[Math.min(focus, Math.max(points.length - 1, 0))];
  const previous =
    focused && focused.index > 0 ? points[focused.index - 1] : null;
  const delta =
    focused && previous ? focused.value - previous.value : null;

  useEffect(() => {
    setFocus(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    progress.set(0);
    const controls = animate(progress, 1, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [d, progress]);

  useMotionValueEvent(progress, "change", setDrawn);

  function startEdit() {
    if (!focused) return;
    setDraft(String(focused.value));
    setEditing(true);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!focused) return;
    const next = Number.parseInt(draft, 10);
    if (!Number.isInteger(next) || next < 1 || next > PATH_MAX) return;
    await onEdit(focused.index, next);
    setEditing(false);
  }

  return (
    <div className="trail" role="dialog" aria-label="Map history">
      <header className="trail-head">
        <div>
          <p className="trail-kicker">Route through 1-1000</p>
          <h2 className="trail-title">Journey map</h2>
        </div>
        <button type="button" className="trail-close" onClick={onClose}>
          Close
        </button>
      </header>

      {records.length === 0 ? (
        <p className="path-status">No stations yet. Add a record to begin.</p>
      ) : (
        <>
          <div className="trail-stage">
            <svg
              className="trail-svg"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="img"
              aria-label="Record journey plotted across 1 to 1000"
            >
              <defs>
                <linearGradient id="trail-glow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e85a64" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#f0b4b8" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#e85a64" stopOpacity="0.2" />
                </linearGradient>
                <filter id="trail-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const x = PAD_X + t * (VIEW_W - PAD_X * 2);
                const label = Math.round(1 + t * (PATH_MAX - 1));
                return (
                  <g key={t}>
                    <line
                      x1={x}
                      y1={PAD_Y - 18}
                      x2={x}
                      y2={VIEW_H - PAD_Y + 18}
                      className="trail-grid"
                    />
                    <text x={x} y={VIEW_H - 18} className="trail-axis">
                      {label}
                    </text>
                  </g>
                );
              })}

              {d ? (
                <>
                  <path
                    d={d}
                    className="trail-path-glow"
                    filter="url(#trail-blur)"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - drawn}
                  />
                  <path
                    d={d}
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
                const visible = drawn > point.index / Math.max(points.length, 1) - 0.05;
                return (
                  <g
                    key={`${point.value}-${point.index}`}
                    className={isFocus ? "trail-node is-focus" : "trail-node"}
                    opacity={visible ? 1 : 0}
                    style={{
                      transformOrigin: `${point.x}px ${point.y}px`,
                    }}
                  >
                    {isFocus ? (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={28}
                        className="trail-ring"
                      />
                    ) : null}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isFocus ? 10 : 6}
                      className="trail-dot"
                      onClick={() => {
                        setFocus(point.index);
                        setEditing(false);
                      }}
                    />
                    <text
                      x={point.x}
                      y={point.y - (isFocus ? 36 : 22)}
                      className="trail-label"
                      onClick={() => {
                        setFocus(point.index);
                        setEditing(false);
                      }}
                    >
                      {point.value}
                    </text>
                    <text
                      x={point.x}
                      y={point.y + (isFocus ? 34 : 24)}
                      className="trail-step"
                    >
                      {String(point.index + 1).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {focused ? (
            <motion.div
              className="trail-dock"
              key={focused.index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="trail-dock-meta">
                <p className="trail-dock-step">
                  Station {String(focused.index + 1).padStart(2, "0")}
                </p>
                {delta !== null ? (
                  <p className="trail-dock-delta">
                    {delta > 0 ? `+${delta}` : delta} from last
                  </p>
                ) : (
                  <p className="trail-dock-delta">Origin mark</p>
                )}
              </div>

              {editing ? (
                <form className="trail-edit" onSubmit={saveEdit}>
                  <input
                    type="number"
                    min={1}
                    max={PATH_MAX}
                    step={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={busy}
                    autoFocus
                    aria-label="Edit station number"
                  />
                  <button type="submit" disabled={busy}>
                    Save
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="trail-dock-actions">
                  <p className="trail-dock-value">| {focused.value} |</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSelect(focused.index)}
                  >
                    Go there
                  </button>
                  <button type="button" disabled={busy} onClick={startEdit}>
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRemove(focused.index)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </motion.div>
          ) : null}
        </>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
