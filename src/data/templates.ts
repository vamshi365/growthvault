import type { JourneyTemplate } from "@/lib/types";

/** Curated local templates — no fake social users. */
export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: "summer-body-prep",
    title: "Summer Body Prep",
    category: "Fitness",
    durationDays: 30,
    blurb: "Build strength and consistency with daily movement logs.",
    ultimateGoal: "Feel strong and confident in my body by summer.",
    coverGradient: "linear-gradient(135deg, #7C5CFF 0%, #5B7CFF 100%)",
  },
  {
    id: "100-days-of-code",
    title: "100 Days of Code",
    category: "Career",
    durationDays: 100,
    blurb: "Ship code every day and document your craft growth.",
    ultimateGoal: "Complete 100 consecutive days of deliberate coding practice.",
    coverGradient: "linear-gradient(135deg, #5B7CFF 0%, #9F84FF 100%)",
  },
  {
    id: "morning-mindset",
    title: "Morning Mindset",
    category: "Mindset",
    durationDays: 21,
    blurb: "Start each day with intention, journaling, and stillness.",
    ultimateGoal: "Own my mornings and set a calm, focused tone for the day.",
    coverGradient: "linear-gradient(135deg, #9F84FF 0%, #FF9F43 80%)",
  },
  {
    id: "creative-daily-sketch",
    title: "Creative Daily Sketch",
    category: "Creative",
    durationDays: 30,
    blurb: "One sketch a day — quantity unlocks quality.",
    ultimateGoal: "Fill a sketchbook and rebuild my creative muscle.",
    coverGradient: "linear-gradient(135deg, #FF9F43 0%, #9F84FF 100%)",
  },
  {
    id: "debt-free-focus",
    title: "Debt-Free Focus",
    category: "Career",
    durationDays: 90,
    blurb: "Track money decisions and stay accountable to your payoff plan.",
    ultimateGoal: "Crush a major debt milestone in 90 days.",
    coverGradient: "linear-gradient(135deg, #5B7CFF 0%, #2A2A3A 100%)",
  },
  {
    id: "sleep-reset",
    title: "Sleep Reset",
    category: "Mindset",
    durationDays: 14,
    blurb: "Rebuild your wind-down ritual and protect 7+ hours.",
    ultimateGoal: "Wake up rested for two straight weeks.",
    coverGradient: "linear-gradient(135deg, #14141C 0%, #9F84FF 100%)",
  },
  {
    id: "habit-stack-builder",
    title: "Habit Stack Builder",
    category: "Custom",
    durationDays: 45,
    blurb: "Layer tiny habits until they become automatic.",
    ultimateGoal: "Lock in three non-negotiable daily habits.",
    coverGradient: "linear-gradient(135deg, #8B8BF5 0%, #7C5CFF 100%)",
  },
];

export function getTemplate(id: string): JourneyTemplate | undefined {
  return JOURNEY_TEMPLATES.find((t) => t.id === id);
}
