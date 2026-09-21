"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { BoltIcon, FlameIcon } from "@/components/icons";
import { ActivityBarChart, MetricCard } from "@/components/ui";

export default function StatsPage() {
  const { ready, snapshot, longest } = useStore();

  const activity = useMemo(() => {
    return snapshot.journeys.map((j) => ({
      label: j.title.length > 10 ? j.title.slice(0, 10) + "…" : j.title,
      value: snapshot.logs.filter((l) => l.journeyId === j.id).length,
    }));
  }, [snapshot]);

  if (!ready) {
    return (
      <div className="gv-page flex min-h-[60vh] items-center justify-center text-gv-text-muted">
        Loading vault…
      </div>
    );
  }

  return (
    <div className="gv-page">
      <header>
        <h1 className="gv-title">Growth Insights</h1>
        <p className="mt-1 text-sm text-gv-text-muted">
          Your transformation by the numbers.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Longest Streak"
          value={longest}
          icon={<FlameIcon size={22} />}
          iconClass="text-gv-gold"
        />
        <MetricCard
          label="Total Logs"
          value={snapshot.logs.length}
          icon={<BoltIcon size={22} />}
          iconClass="text-gv-accent"
        />
      </div>

      <ActivityBarChart items={activity} />
    </div>
  );
}
