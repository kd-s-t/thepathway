"use client";

import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathLayout } from "../hooks/usePathLayout";
import MapHistory from "./MapHistory";

const PATH_MAX = 1000;

type PathReelProps = {
  initialRecords: number[];
};

type RecordsResponse = {
  records?: number[];
  error?: string;
};

export default function PathReel({ initialRecords }: PathReelProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const { spacing, window: sideWindow, curve } = usePathLayout(mainRef);

  const [records, setRecords] = useState(initialRecords);
  const [index, setIndex] = useState(() =>
    initialRecords.length > 0 ? initialRecords.length - 1 : 0,
  );
  const [showMap, setShowMap] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/records")
      .then((response) => response.json())
      .then((data: RecordsResponse) => {
        if (cancelled || !data.records) return;
        setRecords(data.records);
        setIndex(data.records.length > 0 ? data.records.length - 1 : 0);
      })
      .catch(() => {
        // Keep bundled initial records if live sync fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const safeIndex =
    records.length === 0 ? 0 : Math.min(index, records.length - 1);

  const target =
    records.length > 0 ? clamp(records[safeIndex], 1, PATH_MAX) : 1;

  const display = useMotionValue(target);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const controls = animate(display, target, {
      type: "tween",
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [display, target]);

  useMotionValueEvent(display, "change", setValue);

  const current = Math.round(value);

  const steps = useMemo(() => {
    const list: number[] = [];
    for (let n = current - sideWindow; n <= current + sideWindow; n += 1) {
      if (n >= 1 && n <= PATH_MAX) list.push(n);
    }
    return list;
  }, [current, sideWindow]);

  async function mutate(
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
    failure: string,
  ): Promise<number[]> {
    const response = await fetch("/api/records", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as RecordsResponse;
    if (!response.ok || !data.records) {
      throw new Error(data.error ?? failure);
    }
    return data.records;
  }

  async function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const next = await mutate("POST", { value: draft }, "Could not add record");
      setRecords(next);
      setIndex(next.length - 1);
      setDraft("");
      setShowMap(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add record");
    } finally {
      setSaving(false);
    }
  }

  async function editRecord(recordIndex: number, nextValue: number) {
    setError(null);
    setSaving(true);
    try {
      const next = await mutate(
        "PATCH",
        { index: recordIndex, value: nextValue },
        "Could not edit record",
      );
      setRecords(next);
      setIndex(recordIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not edit record");
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(recordIndex: number) {
    setError(null);
    setSaving(true);
    try {
      const next = await mutate(
        "DELETE",
        { index: recordIndex },
        "Could not remove record",
      );
      setRecords(next);
      setIndex((currentIndex) => {
        if (next.length === 0) return 0;
        if (currentIndex > recordIndex) return currentIndex - 1;
        return Math.min(currentIndex, next.length - 1);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="path-shell">
      <div className="path-main" ref={mainRef}>
        {records.length === 0 ? (
          <p className="path-status">Add a number from 1 to 1000</p>
        ) : null}

        {showMap ? (
          <MapHistory
            records={records}
            activeIndex={safeIndex}
            busy={saving}
            onSelect={(i) => {
              setIndex(i);
              setShowMap(false);
            }}
            onEdit={editRecord}
            onRemove={removeRecord}
            onClose={() => setShowMap(false)}
          />
        ) : (
          <div className="path-stage" aria-live="polite">
            <div className="path-curve">
              {steps.map((n) => {
                const offset = n - value;
                const x = offset * spacing;
                const y = offset * offset * curve * spacing;
                const distance = Math.abs(offset);
                const isActive = n === current;
                const isMark = records.includes(n);
                const opacity = Math.max(0.22, 1 - distance * 0.08);
                const rotate = offset * 0.55;

                return (
                  <span
                    key={n}
                    className={[
                      "path-num",
                      isActive ? "is-active" : "",
                      isMark ? "is-mark" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: spacing,
                      opacity,
                      zIndex: isActive ? 20 : Math.round(20 - distance),
                      transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotate}deg)`,
                    }}
                  >
                    {isActive ? (
                      <>
                        <span className="path-bracket" aria-hidden>
                          |
                        </span>
                        <span className="path-target">{n}</span>
                        <span className="path-bracket" aria-hidden>
                          |
                        </span>
                      </>
                    ) : (
                      n
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="path-controls">
        <form className="path-add" onSubmit={addRecord}>
          <input
            type="number"
            min={1}
            max={PATH_MAX}
            step={1}
            inputMode="numeric"
            placeholder="1-1000"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            aria-label="New record number"
          />
          <button type="submit" disabled={saving || draft.trim() === ""}>
            {saving ? "Saving…" : "Add record"}
          </button>
        </form>
        {error ? <p className="path-error">{error}</p> : null}

        <nav className="path-nav">
          <button type="button" onClick={() => setShowMap((open) => !open)}>
            {showMap ? "Path" : "Map history"}
          </button>
          {!showMap && records.length > 1 ? (
            <>
              <button
                type="button"
                disabled={safeIndex <= 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={safeIndex >= records.length - 1}
                onClick={() =>
                  setIndex((i) => Math.min(records.length - 1, i + 1))
                }
              >
                Next
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
