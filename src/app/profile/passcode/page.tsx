"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { BackIcon, LockIcon } from "@/components/icons";

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`gv:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function PasscodePage() {
  const { snapshot, updateProfile } = useStore();
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"set" | "unlock">(
    snapshot.profile.passcodeEnabled ? "unlock" : "set"
  );
  const [msg, setMsg] = useState<string | null>(null);

  const dots = useMemo(
    () => Array.from({ length: 4 }, (_, i) => i < pin.length),
    [pin]
  );

  function press(n: string) {
    if (pin.length >= 4) return;
    const next = pin + n;
    setPin(next);
    if (next.length === 4) void commit(next);
  }

  async function commit(value: string) {
    if (mode === "set") {
      const hash = await hashPin(value);
      await updateProfile({
        passcodeEnabled: true,
        passcodeHash: hash,
      });
      setMsg("Demo passcode saved locally — not encryption.");
      setPin("");
      setMode("unlock");
      return;
    }
    const hash = await hashPin(value);
    if (hash === snapshot.profile.passcodeHash) {
      setMsg("Demo unlock OK — app was never gated.");
      setPin("");
    } else {
      setMsg("Incorrect passcode.");
      setPin("");
    }
  }

  async function disable() {
    await updateProfile({ passcodeEnabled: false, passcodeHash: null });
    setMode("set");
    setMsg("Passcode disabled.");
    setPin("");
  }

  return (
    <div className="gv-page flex min-h-dvh flex-col">
      <header className="mb-8 flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <h1 className="text-xl font-bold">Passcode (demo)</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(159,132,255,0.15)] text-gv-accent">
          <LockIcon size={28} />
        </div>
        <p className="max-w-xs text-center text-sm text-gv-text-muted">
          Local demo keypad only — not a vault lock and does not encrypt data.
        </p>
        <p className="text-sm text-gv-text-muted">
          {mode === "set" ? "Create a 4-digit demo passcode" : "Enter demo passcode"}
        </p>
        <div className="flex gap-3">
          {dots.map((on, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full ${
                on ? "bg-gv-accent" : "border border-gv-border"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
            (k, i) =>
              k === "" ? (
                <div key={`e-${i}`} />
              ) : (
                <button
                  key={k}
                  type="button"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gv-card text-xl font-semibold"
                  onClick={() => {
                    if (k === "⌫") setPin((p) => p.slice(0, -1));
                    else press(k);
                  }}
                >
                  {k}
                </button>
              )
          )}
        </div>

        <button
          type="button"
          className="text-sm text-gv-accent-text"
          onClick={() => setMsg("Demo only — no recovery email.")}
        >
          Forgot?
        </button>

        {snapshot.profile.passcodeEnabled && (
          <button
            type="button"
            className="text-sm text-gv-text-muted"
            onClick={() => void disable()}
          >
            Disable passcode
          </button>
        )}

        {msg && <p className="text-sm text-gv-accent-text">{msg}</p>}
      </div>
    </div>
  );
}
