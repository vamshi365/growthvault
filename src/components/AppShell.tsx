"use client";

import { FloatingTabBar } from "./FloatingTabBar";
import { ToastProvider } from "./Toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative min-h-dvh bg-gv-bg">
        <main>{children}</main>
        <FloatingTabBar />
      </div>
    </ToastProvider>
  );
}
