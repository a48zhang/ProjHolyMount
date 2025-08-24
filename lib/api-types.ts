export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface QuestionContent {
  question: string;
  options?: string[];
  [key: string]: unknown;
}

export interface PracticeItem {
  question_id: number;
  type: string;
  content: QuestionContent;
  schema_version: number;
}

export interface PracticeListResponse {
  items: PracticeItem[];
}

export interface PracticeResultResponse {
  correct: boolean;
  answer_key: string | number | string[] | number[];
}