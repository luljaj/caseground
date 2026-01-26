"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

type QuestionSummary = {
  id: string;
  title: string;
  track: string;
  category: string;
  suggested_time: number;
};

export default function CreateCustomModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, problemIds: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    async function fetchQuestions() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/questions?perPage=1000&page=1", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load questions.");
        }
        const payload = await response.json();
        if (isMounted) {
          setQuestions(payload.questions ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError((err as Error).message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setSearch("");
      setSelectedIds(new Set());
      setLoadError(null);
      setFormError(null);
    }
  }, [open]);

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) {
      return questions;
    }
    const term = search.toLowerCase();
    return questions.filter((question) =>
      question.title.toLowerCase().includes(term)
    );
  }, [questions, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= 20) {
        return next;
      }
      next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setFormError("Name your collection.");
      return;
    }
    if (selectedIds.size === 0) {
      setFormError("Select at least one problem.");
      return;
    }
    setFormError(null);
    onCreate(name.trim(), Array.from(selectedIds));
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Create Custom Collection</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
              Collection name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-text-primary"
              placeholder="e.g. Consulting Warmup"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
              Search problems
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-text-primary"
              placeholder="Search by title"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-text-muted">
            Selected {selectedIds.size}/20 problems
          </p>
        </div>

        <div className="mt-3 max-h-[300px] overflow-y-auto rounded-lg border border-white/10">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={20} />
            </div>
          ) : loadError ? (
            <div className="px-4 py-3 text-sm text-error">{loadError}</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filteredQuestions.map((question) => {
                const isSelected = selectedIds.has(question.id);
                const isDisabled = !isSelected && selectedIds.size >= 20;
                return (
                  <li key={question.id} className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => toggleSelect(question.id)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary line-clamp-1">
                        {question.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {question.track} / {question.category}
                      </p>
                    </div>
                    <span className="text-xs text-text-muted">
                      {question.suggested_time} min
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {formError ? (
            <p className="mr-auto text-xs text-error">{formError}</p>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate}>
            Create Collection
          </Button>
        </div>
      </div>
    </div>
  );
}
