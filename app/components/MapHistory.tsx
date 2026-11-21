"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  PATH_MAX,
  formatAddedAt,
  type PathRecord,
} from "@/lib/path-record";
import HistoryMap from "./HistoryMap";

type HistoryView = "table" | "map";

type MapHistoryProps = {
  records: PathRecord[];
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
  const [view, setView] = useState<HistoryView>("map");
  const [focus, setFocus] = useState(activeIndex);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setFocus(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    setEditingIndex(null);
    setDraft("");
  }, [records]);

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
    <div className="trail" role="dialog" aria-label="History">
      {records.length === 0 ? (
        <p className="path-status">No records yet.</p>
      ) : view === "map" ? (
        <HistoryMap
          records={records}
          focus={Math.min(focus, records.length - 1)}
          onFocus={setFocus}
          onSelect={onSelect}
        />
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Number</th>
                <th scope="col">Added</th>
                <th scope="col"> </th>
              </tr>
            </thead>
            <tbody>
              {records.map((_, i) => {
                // Newest first: latest at top.
                const index = records.length - 1 - i;
                const row = records[index];
                const isActive = index === activeIndex;
                const isEditing = editingIndex === index;

                return (
                  <tr
                    key={`${row.value}-${index}-${row.addedAt}`}
                    className={isActive ? "is-active" : undefined}
                  >
                    <td className="history-index">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td>
                      {isEditing ? (
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
                            aria-label={`Edit record ${index + 1}`}
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
                        <button
                          type="button"
                          className="history-number"
                          onClick={() => onSelect(index)}
                        >
                          {row.value}
                        </button>
                      )}
                    </td>
                    <td className="history-date">
                      {formatAddedAt(row.addedAt)}
                    </td>
                    <td className="history-actions">
                      {!isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => startEdit(index, row.value)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onRemove(index)}
                          >
                            Remove
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="history-view-toggle" role="group" aria-label="History view">
        <button
          type="button"
          className={view === "table" ? "is-active" : undefined}
          onClick={() => setView("table")}
        >
          Table
        </button>
        <button
          type="button"
          className={view === "map" ? "is-active" : undefined}
          onClick={() => setView("map")}
        >
          Map
        </button>
        <button type="button" className="trail-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
