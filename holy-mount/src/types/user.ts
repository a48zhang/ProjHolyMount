import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  level: "初级" | "中级" | "高级";
  progress: number;
  studyDays: number;
  wordsLearned: number;
  avatar?: string;
  isActive: boolean;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  level?: "初级" | "中级" | "高级";
  progress?: number;
  studyDays?: number;
  wordsLearned?: number;
  avatar?: string;
}

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  level: "初级" | "中级" | "高级";
  progress: number;
  studyDays: number;
  wordsLearned: number;
  avatar?: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}