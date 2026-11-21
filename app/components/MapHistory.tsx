"use client";

import { FormEvent, useState } from "react";

const PATH_MAX = 1000;

type MapHistoryProps = {
  records: number[];
  activeIndex: number;
  busy: boolean;
  onSelect: (index: number) => void;
  onEdit: (index: number, value: number) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
  onClose: () => void;
};

export default function MapHistory({
  records,
  activeIndex,
  busy,
  onSelect,
  onEdit,
  onRemove,
  onClose,
}: MapHistoryProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(index: number, value: number) {
    setEditingIndex(index);
    setDraft(String(value));
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingIndex === null) return;
    const next = Number.parseInt(draft, 10);
    if (!Number.isInteger(next) || next < 1 || next > PATH_MAX) return;
    await onEdit(editingIndex, next);
    setEditingIndex(null);
    setDraft("");
  }

  return (
    <div className="map-panel" role="dialog" aria-label="Map history">
      <div className="map-panel-head">
        <p className="map-panel-title">Map history</p>
        <button type="button" className="map-close" onClick={onClose}>
          Close
        </button>
      </div>

      {records.length === 0 ? (
        <p className="path-status">No records yet.</p>
      ) : (
        <ol className="map-list">
          {records.map((n, i) => {
            const onRight = i % 2 === 1;
            const isActive = i === activeIndex;
            const hasNext = i < records.length - 1;
            const isEditing = editingIndex === i;

            return (
              <li key={`${n}-${i}`} className="map-step">
                <div
                  className={[
                    "map-line",
                    onRight ? "is-right" : "is-left",
                    isActive ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {onRight ? <span className="map-rail" aria-hidden /> : null}

                  <div className="map-item">
                    {isEditing ? (
                      <form className="map-edit" onSubmit={saveEdit}>
                        <input
                          type="number"
                          min={1}
                          max={PATH_MAX}
                          step={1}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          disabled={busy}
                          autoFocus
                          aria-label={`Edit record ${i + 1}`}
                        />
                        <button type="submit" disabled={busy}>
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditingIndex(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="map-value"
                          onClick={() => onSelect(i)}
                        >
                          {isActive ? `| ${n} |` : n}
                        </button>
                        <div className="map-actions">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => startEdit(i, n)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onRemove(i)}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {!onRight ? <span className="map-rail" aria-hidden /> : null}
                </div>
                {hasNext ? <div className="map-join" aria-hidden /> : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
