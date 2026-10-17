import {
  User, Workspace, WorkspaceMember, Project, Task,
  Comment, ChatMessage, Meeting, NotificationItem,
  AIProjectPlanResponse, AIPlanTask, AITaskBreakdownResponse,
  AISprintPlanResponse, AIRiskAnalysisResponse,
  AIMeetingSummaryResponse, AIChatResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8008/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('teamflow_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('teamflow_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('teamflow_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorDetail = 'API Request failed';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }
      throw new Error(errorDetail || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async getDemoUsers(): Promise<User[]> {
    return this.request<User[]>('/auth/demo-users');
  }

  async switchUser(userId: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>(`/auth/switch-user/${userId}`, {
      method: 'POST'
    });
    this.setToken(res.access_token);
    return res;
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>('/workspaces');
  }

  async createWorkspace(name: string): Promise<Workspace> {
    return this.request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
  }

  // Projects
  async getProjects(workspaceId?: string): Promise<Project[]> {
    const qs = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return this.request<Project[]>(`/projects${qs}`);
  }

  async createProject(workspaceId: string, name: string, description?: string, deadline?: string): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, name, description, deadline })
    });
  }

  // Tasks
  async getTasks(projectId: string, status?: string, assigneeId?: string): Promise<Task[]> {
    let url = `/tasks?project_id=${projectId}`;
    if (status) url += `&status=${status}`;
    if (assigneeId) url += `&assignee_id=${assigneeId}`;
    return this.request<Task[]>(url);
  }

  async createTask(taskData: {
    project_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    deadline?: string;
    estimated_hours?: number;
    labels?: string;
  }): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async moveTask(taskId: string, status: string, position: number = 0): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ status, position })
    });
  }

  async deleteTask(taskId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }

  async getTaskDetail(taskId: string): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}`);
  }

  async addComment(taskId: string, content: string): Promise<Comment> {
    return this.request<Comment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // Chat
  async getChatMessages(workspaceId: string, projectId?: string): Promise<ChatMessage[]> {
    let url = `/chat/messages?workspace_id=${workspaceId}`;
    if (projectId) url += `&project_id=${projectId}`;
    return this.request<ChatMessage[]>(url);
  }

  async sendChatMessage(workspaceId: string, content: string, projectId?: string): Promise<ChatMessage> {
    return this.request<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, project_id: projectId, content })
    });
  }

  // Meetings
  async getMeetings(projectId: string): Promise<Meeting[]> {
    return this.request<Meeting[]>(`/meetings?project_id=${projectId}`);
  }

  async createMeeting(projectId: string, title: string, transcript: string): Promise<Meeting> {
    return this.request<Meeting>('/meetings', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, title, transcript })
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/mark-all-read', { method: 'POST' });
  }

  // AI Workflows
  async generateProjectPlan(projectId: string, prompt: string): Promise<AIProjectPlanResponse> {
    return this.request<AIProjectPlanResponse>('/ai/project-plan', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, prompt })
    });
  }

  async bulkCreateTasks(projectId: string, tasks: AIPlanTask[]): Promise<Task[]> {
    return this.request<Task[]>('/ai/bulk-create-tasks', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, tasks })
    });
  }

  async breakdownTask(taskId: string): Promise<AITaskBreakdownResponse> {
    return this.request<AITaskBreakdownResponse>('/ai/task-breakdown', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId })
    });
  }

  async generateSprintPlan(projectId: string): Promise<AISprintPlanResponse> {
    return this.request<AISprintPlanResponse>('/ai/sprint-plan', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId })
    });
  }

  async getRiskAnalysis(projectId: string): Promise<AIRiskAnalysisResponse> {
    return this.request<AIRiskAnalysisResponse>('/ai/risk-analysis', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId })
    });
  }

  async askCopilot(projectId: string, question: string): Promise<AIChatResponse> {
    return this.request<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, question })
    });
  }
}

export const api = new ApiService();
