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
