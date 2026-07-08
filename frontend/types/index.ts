export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string | Role;
  allowed_tables: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  description?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role_id: number;
  allowed_tables?: string;
}

export interface UserUpdate {
  full_name?: string;
  is_active?: boolean;
  role_id?: number;
  allowed_tables?: string;
}

export interface QueryRequest {
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface QueryResponse {
  answer: string;
  sql?: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
  row_count?: number;
  status: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  natural_language?: string;
  sql_query?: string;
  ip_address: string;
  status: string;
  error_message?: string;
  row_count?: number;
  created_at: string;
}

export interface Stats {
  total_users: number;
  active_users: number;
  total_queries: number;
  queries_today: number;
  successful: number;
  failed: number;
}

export interface TablesList {
  tables: string[];
  count: number;
}
