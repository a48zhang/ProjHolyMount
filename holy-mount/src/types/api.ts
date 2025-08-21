import { UserResponse } from "./user";

export interface UpdateProgressRequest {
  progress: number;
}

export interface AddWordsRequest {
  count: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiErrorResponse {
  error: string;
}

export interface LoginResponse {
  success: boolean;
  user: UserResponse;
}

export interface RegisterResponse {
  success: boolean;
  user: UserResponse;
}