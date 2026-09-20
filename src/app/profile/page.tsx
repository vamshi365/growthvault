"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BackIcon, LockIcon } from "@/components/icons";

export default function ProfilePage() {
  const { ready, snapshot, updateProfile, loadDemo, clearData } = useStore();
  const [name, setName] = useState(snapshot.profile.displayName);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!ready) {
    return <div className="gv-page text-gv-text-muted">Loading…</div>;
  }

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <Link
          href="/home"
          className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <div className="gv-card space-y-3 p-4">
        <label className="block space-y-2">
          <span className="gv-eyebrow text-gv-accent-text">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 outline-none focus:border-gv-accent"
          />
        </label>
        <button
          type="button"
          className="gv-cta w-full py-3 text-sm"
          onClick={() => {
            void updateProfile({ displayName: name.trim() || "Growth Seeker" });
            setMsg("Name saved.");
          }}
        >
          Save name
        </button>
      </div>

      <div className="gv-card divide-y divide-gv-border overflow-hidden">
        <Link
          href="/profile/passcode"
          className="flex items-center gap-3 px-4 py-4"
        >
          <LockIcon className="text-gv-accent" />
          <div className="flex-1">
            <p className="font-semibold">Passcode lock</p>
            <p className="text-xs text-gv-text-muted">
              {snapshot.profile.passcodeEnabled
                ? "Enabled (local demo)"
                : "Optional local gate"}
            </p>
          </div>
          <span className="text-gv-accent">→</span>
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-4 text-left"
          onClick={async () => {
            await loadDemo();
            setName("Alex");
            setMsg("Demo data loaded.");
          }}
        >
          <span className="text-gv-accent">◎</span>
          <div>
            <p className="font-semibold">Load demo data</p>
            <p className="text-xs text-gv-text-muted">
              Summer Body Prep · 7 logs · pioneer + warrior
            </p>
          </div>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-4 text-left"
          onClick={() => setConfirmClear(true)}
        >
          <span className="text-[#FF8A80]">✕</span>
          <div>
            <p className="font-semibold">Clear all data</p>
            <p className="text-xs text-gv-text-muted">
              Wipes IndexedDB journeys, logs, badges
            </p>
          </div>
        </button>
      </div>

      {confirmClear && (
        <div className="gv-card space-y-3 border border-[#FF8A80]/40 p-4">
          <p className="text-sm">Clear everything? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-full bg-[#FF8A80] py-2.5 text-sm font-bold text-black"
              onClick={async () => {
                await clearData();
                setName("Growth Seeker");
                setConfirmClear(false);
                setMsg("Vault cleared.");
              }}
            >
              Confirm clear
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-gv-muted py-2.5 text-sm"
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && <p className="text-sm text-gv-accent-text">{msg}</p>}

      <p className="text-center text-xs leading-relaxed text-gv-text-muted">
        GrowthVault is local-first. Insights are static quotes — not AI claims.
        Explore shows curated templates only (no social feed).
      </p>
    </div>
  );
}
