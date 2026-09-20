"use client";

import { FloatingTabBar } from "./FloatingTabBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-gv-bg">
      <main>{children}</main>
      <FloatingTabBar />
    </div>
  );
}
