/** Placeholder id so static export succeeds; real IDs live in IndexedDB and resolve client-side. */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function JourneyIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
