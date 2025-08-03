// Cloudflare环境变量类型定义
export interface CloudflareEnv {
	ASSETS: Fetcher;
	DB: D1Database;
	JWT_SECRET: string;
}

// 用户类型
export interface User {
	id: number;
	username: string;
	email: string;
	display_name?: string;
	avatar_url?: string;
	level: number;
	points: number;
	created_at: string;
	updated_at: string;
}

// 注册请求类型
export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	display_name?: string;
}

// 登录请求类型
export interface LoginRequest {
	username: string;
	password: string;
}

// 登录响应类型
export interface LoginResponse {
	token: string;
	user: Omit<User, 'password_hash'>;
}

// API响应类型
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

// 全局类型声明
declare global {
  var DB: D1Database;
  var JWT_SECRET: string;
  var ASSETS: Fetcher;
}