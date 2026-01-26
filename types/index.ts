export type Track = "estimations" | "behaviorals" | "reasoning";

export type EstimationsCategory = "market-sizing" | "volume" | "cost-revenue";
export type BehavioralsCategory = "easy" | "medium" | "hard";
export type ReasoningCategory =
  | "logic"
  | "Financial Statements"
  | "Valuation"
  | "DCF Analysis"
  | "Merger Models"
  | "LBO Models";

export type Category =
  | EstimationsCategory
  | BehavioralsCategory
  | ReasoningCategory;

export interface RubricItem {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  track: Track;
  category: Category;
  title: string;
  prompt: string;
  description: string;
  rubric: RubricItem[];
  example_answer: string;
  suggested_time: number;
  companies: string[];
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string | null;
  ai_credits: number;
  created_at: string;
  stripe_customer_id?: string | null;
  stripe_subscription_status: StripeSubscriptionStatus;
  subscription_period_end?: string | null;
  subscription_cancel_at_period_end?: boolean;
}

export interface UserResponse {
  id: string;
  user_id: string;
  question_id: string;
  response: string;
  time_taken: number | null;
  ai_feedback: string | null;
  created_at: string;
}

export type FeedbackType = "problem" | "collection";

export type FeedbackStatus = "pending" | "completed" | "failed" | "expired";

export interface AIFeedback {
  id: string;
  user_id: string;
  response_id: string | null;
  collection_id: string | null;
  feedback_type: FeedbackType;
  content: string;
  model: string | null;
  tokens_used: number | null;
  generation_time_ms: number | null;
  prompt_hash: string | null;
  status: FeedbackStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAIFeedbackInput {
  response_id?: string;
  collection_id?: string;
  feedback_type: FeedbackType;
  content: string;
  model?: string;
  tokens_used?: number;
  generation_time_ms?: number;
}

export interface AIFeedbackWithMeta extends AIFeedback {
  question_title?: string;
  collection_name?: string;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface FilterParams {
  track?: Track;
  category?: Category;
  completed?: boolean;
}

export interface SortParams {
  field: "number" | "track";
  direction: "asc" | "desc";
}

export type StripeSubscriptionStatus =
  | "none"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export function hasSubscriptionAccess(status: StripeSubscriptionStatus): boolean {
  return ["active", "trialing", "past_due"].includes(status);
}

export interface UserSubscription {
  status: StripeSubscriptionStatus;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface StatsPayload {
  totalAttempted: number;
  aiCredits: number;
  byType: {
    estimations: number;
    behaviorals: number;
    reasoning: number;
  };
  subscription: UserSubscription;
}

export type BillingProduct = "credits_50" | "credits_110" | "unlimited";

export type CollectionSection =
  | "consulting"
  | "ib"
  | "pe"
  | "pm"
  | "corporate_strategy"
  | "tech"
  | "brain_teaser"
  | "behavioral"
  | "market_sizing"
  | "profitability"
  | "technical";

export const COLLECTION_SECTION_LABELS: Record<CollectionSection, string> = {
  consulting: "Consulting",
  ib: "Investment Banking",
  pe: "Private Equity",
  pm: "Product Management",
  corporate_strategy: "Corporate Strategy",
  tech: "Tech / Strategy",
  brain_teaser: "Brain Teasers",
  behavioral: "Behavioral",
  market_sizing: "Market Sizing",
  profitability: "Profitability",
  technical: "Technical",
};

export type CollectionDifficulty = "beginner" | "intermediate" | "advanced";

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  section: CollectionSection;
  target_roles: TargetRole[];
  difficulty: CollectionDifficulty;
  problem_ids: string[];
  estimated_time_minutes: number | null;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithStatus extends Collection {
  isComplete: boolean;
  completedAt: string | null;
  attemptedPercent: number;
  problemsAttemptedCount: number;
}

export interface UserCollectionCompletion {
  user_id: string;
  collection_id: string;
  completed_at: string;
}

export interface CollectionSession {
  collectionId: string;
  collectionSlug: string;
  collectionName?: string;
  currentIndex: number;
  problemIds: string[];
  completedThisSession: string[];
  skippedThisSession: string[];
  startedAt: string;
  isCustom?: boolean;
}

export interface CustomCollection {
  id: string;
  name: string;
  problem_ids: string[];
  created_at: string;
  is_complete: boolean;
}

export type TargetRole =
  | "consulting"
  | "pm"
  | "ib"
  | "pe"
  | "corporate_strategy"
  | "tech"
  | "marketing"
  | "wealth_management";

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  consulting: "Management Consulting",
  pm: "Product Management",
  ib: "Investment Banking",
  pe: "Private Equity",
  corporate_strategy: "Corporate Strategy",
  tech: "Tech / Strategy",
  marketing: "Marketing / Brand Strategy",
  wealth_management: "Wealth Management",
};

export const TARGET_ROLE_DESCRIPTIONS: Record<TargetRole, string> = {
  consulting: "McKinsey, BCG, Bain, and boutique firms",
  pm: "Product roles at tech companies",
  ib: "Goldman, Morgan Stanley, JP Morgan, and boutiques",
  pe: "KKR, Blackstone, Apollo, and growth equity",
  corporate_strategy: "In-house strategy teams at F500",
  tech: "Strategy and operations at tech companies",
  marketing: "Brand management and go-to-market strategy",
  wealth_management: "Private banking and asset management",
};

export interface UserPreferences {
  target_role: TargetRole | null;
  onboarding_completed_at: string | null;
}
