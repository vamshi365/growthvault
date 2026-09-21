export type Category =
  | "Fitness"
  | "Mindset"
  | "Career"
  | "Creative"
  | "Custom";

export type JourneyStatus = "active" | "completed" | "archived";

export type Journey = {
  id: string;
  archiveNo: number;
  title: string;
  ultimateGoal: string;
  category: Category;
  durationDays: number;
  startedAt: string;
  day1PhotoUri: string | null;
  todayPhotoUri: string | null;
  status: JourneyStatus;
};

export type CaptureSource = "camera" | "gallery";

export type EvolutionLog = {
  id: string;
  journeyId: string;
  photoUri: string;
  note?: string;
  tags?: string[];
  createdAt: string;
  dayIndex: number;
  /** Optional reference used during overlay align (Day1 or prior log). */
  referenceLogId?: string;
  /** How the photo was sourced. Defaults to gallery for legacy / demo seeds. */
  captureSource?: CaptureSource;
};

export type BadgeId =
  | "seven_day_warrior"
  | "thirty_day_consistency"
  | "hundred_day_legend"
  | "growth_pioneer"
  | "transformation_master";

export type BadgeProgress = {
  id: BadgeId;
  unlockedAt: string | null;
  current: number;
  target: number;
};

export type AppProfile = {
  displayName: string;
  primaryJourneyId: string | null;
  insightSeed: number;
  passcodeEnabled: boolean;
  passcodeHash: string | null;
};

export type AppSnapshot = {
  profile: AppProfile;
  journeys: Journey[];
  logs: EvolutionLog[];
  badges: BadgeProgress[];
};

export type JourneyTemplate = {
  id: string;
  title: string;
  category: Category;
  durationDays: number;
  blurb: string;
  ultimateGoal: string;
  coverGradient: string;
};
