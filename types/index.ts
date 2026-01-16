export type Track = "estimations" | "behaviorals" | "reasoning";

export type EstimationsCategory = "market-sizing" | "volume" | "cost-revenue";
export type BehavioralsCategory = "easy" | "medium" | "hard";
export type ReasoningCategory = "logic";

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
  ai_credits: number;
  created_at: string;
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
