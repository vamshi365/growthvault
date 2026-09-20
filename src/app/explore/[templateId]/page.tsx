"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTemplate } from "@/data/templates";
import { BackIcon } from "@/components/icons";
import { CategoryPill, GradientCtaButton } from "@/components/ui";

export default function TemplateDetailPage() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const template = getTemplate(params.templateId);

  if (!template) {
    return (
      <div className="gv-page">
        <p className="text-gv-text-muted">Template not found.</p>
        <Link href="/explore" className="mt-4 inline-block text-gv-accent">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <Link
          href="/explore"
          className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <h1 className="text-xl font-bold">Template</h1>
      </header>

      <div
        className="h-40 rounded-[28px]"
        style={{ background: template.coverGradient }}
      />

      <CategoryPill label={template.category} />
      <h2 className="text-2xl font-bold">{template.title}</h2>
      <p className="text-sm leading-relaxed text-gv-text-muted">
        {template.blurb}
      </p>

      <div className="gv-card space-y-2 p-4">
        <p className="gv-eyebrow text-gv-accent-text">Suggested goal</p>
        <p className="text-sm italic text-gv-text-muted">
          “{template.ultimateGoal}”
        </p>
        <p className="gv-eyebrow pt-2 text-gv-text-muted">
          Duration · {template.durationDays} days
        </p>
      </div>

      <GradientCtaButton
        onClick={() =>
          router.push(
            `/journeys/new?template=${encodeURIComponent(template.id)}`
          )
        }
      >
        Start Journey
      </GradientCtaButton>
    </div>
  );
}
