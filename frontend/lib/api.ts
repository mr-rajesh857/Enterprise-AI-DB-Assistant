import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LoginRequest,
  TokenResponse,
  QueryRequest,
  QueryResponse,
  AuditLog,
  Stats,
  User,
  Role,
  RoleCreate,
  UserCreate,
  UserUpdate,
  TablesList,
  ChatSession,
  ChatMessage,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from storage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', credentials);
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Query endpoints
  async chat(request: QueryRequest): Promise<QueryResponse> {
    const response = await this.client.post<QueryResponse>('/query/chat', request);
    return response.data;
  }

  async getTables(): Promise<TablesList> {
    const response = await this.client.get<TablesList>('/query/tables');
    return response.data;
  }

  // User management (admin)
  async listUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/admin/users');
    return response.data;
  }

  async createUser(user: UserCreate): Promise<User> {
    const response = await this.client.post<User>('/admin/users', user);
    return response.data;
  }

  async updateUser(userId: number, data: UserUpdate): Promise<User> {
    const response = await this.client.put<User>(`/admin/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/admin/users/${userId}`);
    return response.data;
  }

  // Role management (admin)
  async listRoles(): Promise<Role[]> {
    const response = await this.client.get<Role[]>('/admin/roles');
    return response.data;
  }

  async createRole(role: RoleCreate): Promise<Role> {
    const response = await this.client.post<Role>('/admin/roles', role);
    return response.data;
  }

  // Audit logs (admin)
  async getAuditLogs(
    skip: number = 0,
    limit: number = 50
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const response = await this.client.get<{ logs: AuditLog[]; total: number }>(
      '/admin/audit-logs',
      { params: { skip, limit } }
    );
    return response.data;
  }

  // Stats (admin)
  async getStats(): Promise<Stats> {
    const response = await this.client.get<Stats>('/admin/stats');
    return response.data;
  }

  // Chat Sessions & History
  async getChatSessions(): Promise<ChatSession[]> {
    const response = await this.client.get<ChatSession[]>('/chats');
    return response.data;
  }

  async createChatSession(title?: string): Promise<ChatSession> {
    const response = await this.client.post<ChatSession>('/chats', { title });
    return response.data;
  }

  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    const response = await this.client.get<ChatMessage[]>(`/chats/${sessionId}`);
    return response.data;
  }

  async deleteChatSession(sessionId: number): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/chats/${sessionId}`);
    return response.data;
  }
}

export const apiClient = new APIClient();
