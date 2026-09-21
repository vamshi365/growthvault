"use client";

/**
 * Overlay capture entry — routes into Log Evolution with align flow.
 * Native Capacitor Camera sheet remains the capture surface (v1.1);
 * ghost align happens after pick on /log.
 */
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CaptureRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/journeys/${params.id}/log`);
  }, [params.id, router]);

  return (
    <div className="gv-page text-sm text-gv-text-muted">Opening capture…</div>
  );
}
