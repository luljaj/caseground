"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { TARGET_ROLE_LABELS, type TargetRole } from "@/types";

type PreferencesCardProps = {
  currentRole: TargetRole | null;
  onSave: (role: TargetRole | null) => Promise<boolean>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function PreferencesCard({
  currentRole,
  onSave,
}: PreferencesCardProps) {
  const [selectedRole, setSelectedRole] = useState<TargetRole | "">(
    currentRole ?? ""
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    setSelectedRole(currentRole ?? "");
    setSaveState("idle");
  }, [currentRole]);

  const hasChanges = selectedRole !== (currentRole ?? "");
  const canSave = selectedRole !== "" && hasChanges && saveState !== "saving";

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setSaveState("saving");
    const ok = await onSave(selectedRole);
    setSaveState(ok ? "saved" : "error");
    if (ok) {
      window.setTimeout(() => setSaveState("idle"), 2000);
    }
  };

  return (
    <div className="animate-fade-up" style={{ animationDelay: "25ms" }}>
      <div className="rounded-3xl border border-zinc-700/50 bg-zinc-800/50 p-8 transition-colors">
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
            Preferences
          </h2>
          <p className="text-sm text-text-secondary">
            Used to recommend relevant collections.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
            Target role
          </label>
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <select
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value as TargetRole | "");
                setSaveState("idle");
              }}
              className="min-w-[220px] flex-1 rounded-md border border-white/10 bg-surface/60 px-3 py-2 text-sm text-text-primary"
            >
              <option value="">Select a role</option>
              {Object.entries(TARGET_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleSave} disabled={!canSave}>
              {saveState === "saving" ? "Saving..." : "Save"}
            </Button>
            {saveState === "saved" ? (
              <span className="text-xs text-emerald-400">Saved</span>
            ) : null}
            {saveState === "error" ? (
              <span className="text-xs text-error">Unable to save</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
