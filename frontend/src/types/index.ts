export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joined_at: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  members: WorkspaceMember[];
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  deadline?: string;
  created_at: string;
  task_count: number;
  completed_task_count: number;
  progress_percentage: number;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Task {
  id: string;
  project_id: string;
  assignee_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  estimated_hours: number;
  actual_hours: number;
  labels: string;
  position: number;
  created_at: string;
  updated_at: string;
  assignee?: User;
  comments_count: number;
  comments?: Comment[];
}

export interface ChatMessage {
  id: string;
  workspace_id: string;
  project_id?: string;
  user_id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
  user?: User;
}

export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  transcript: string;
  summary?: string;
  decisions?: string;
  action_items?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  link_url?: string;
  created_at: string;
}

export interface AIPlanTask {
  title: string;
  description: string;
  priority: TaskPriority;
  estimated_hours: number;
  suggested_role?: string;
}

export interface AIPlanMilestone {
  milestone_name: string;
  tasks: AIPlanTask[];
}

export interface AIProjectPlanResponse {
  plan_title: string;
  summary: string;
  milestones: AIPlanMilestone[];
  total_estimated_hours: number;
}

export interface AISubtask {
  title: string;
  description: string;
  estimated_hours: number;
  priority: TaskPriority;
}

export interface AITaskBreakdownResponse {
  original_task_title: string;
  subtasks: AISubtask[];
  rationale: string;
}

export interface AISprintAssignment {
  member_name: string;
  member_email: string;
  assigned_tasks: string[];
  total_hours: number;
}

export interface AISprintPlanResponse {
  sprint_name: string;
  duration_days: number;
  assignments: AISprintAssignment[];
  rationale: string;
}

export interface AIRiskAnalysisResponse {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  remaining_tasks: number;
  estimated_work_hours: number;
  available_capacity_hours: number;
  days_to_deadline: number;
  summary: string;
  recommendations: string[];
}

export interface AIActionItem {
  assignee_name?: string;
  task_title: string;
  due_date?: string;
  priority: TaskPriority;
}

export interface AIMeetingSummaryResponse {
  summary: string;
  decisions: string[];
  action_items: AIActionItem[];
}

export interface AISource {
  type: string;
  title: string;
  snippet: string;
}

export interface AIChatResponse {
  answer: string;
  sources: AISource[];
  recommended_action?: string;
}
