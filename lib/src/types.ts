export interface Question {
  id: string;
  number: number;
  title: string;
  track: "estimations" | "behaviorals" | "reasoning";
  category: string;
}
