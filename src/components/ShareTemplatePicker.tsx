"use client";

import type { ShareTemplateId } from "@/lib/types";
import { SHARE_TEMPLATES } from "@/lib/share";

export function ShareTemplatePicker({
  value,
  onChange,
}: {
  value: ShareTemplateId;
  onChange: (id: ShareTemplateId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="listbox" aria-label="Share card template">
      {SHARE_TEMPLATES.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`min-h-[72px] rounded-[22px] border px-3 py-3 text-left transition-colors ${
              active
                ? "border-gv-accent bg-[rgba(159,132,255,0.18)]"
                : "border-gv-border bg-gv-muted"
            }`}
          >
            <span className="gv-eyebrow text-gv-accent">Template {t.letter}</span>
            <p className="mt-1 text-sm font-bold text-gv-text">{t.label}</p>
            <p className="mt-0.5 text-[11px] text-gv-text-muted">{t.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}
