import { JOURNEY_TEMPLATES } from "@/data/templates";

export function generateStaticParams() {
  return JOURNEY_TEMPLATES.map((t) => ({ templateId: t.id }));
}

export default function TemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
