import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Kanban, Sparkles, Calendar, FileText,
  MessageSquare, Search, Plus, Layers, AlertCircle
} from 'lucide-react';
import {
  User, Workspace, WorkspaceMember, Project, Task,
  NotificationItem, TaskStatus, ChatMessage
} from './types';
import { api } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';

import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { TaskModal } from './components/TaskModal';
import { AIPlannerView } from './components/AIPlannerView';
import { AISprintPlannerView } from './components/AISprintPlannerView';
import { AIMeetingView } from './components/AIMeetingView';
import { TeamChatView } from './components/TeamChatView';
import { AICopilotView } from './components/AICopilotView';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateProjectModal } from './components/CreateProjectModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  type TabType = 'dashboard' | 'kanban' | 'ai-planner' | 'sprint-planner' | 'meetings' | 'chat' | 'copilot';
  const [activeTab, setActiveTab] = useState<TabType>('kanban');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState<TaskStatus>('TODO');
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  // Incoming live chat message holder
  const [incomingChatMessage, setIncomingChatMessage] = useState<ChatMessage | null>(null);

  // WebSocket Connection
  const { isConnected: wsConnected, lastEvent } = useWebSocket(
    currentWorkspace?.id || null,
    currentUser?.id || null
  );

  // 1. Initial Load: Demo users, Current User, Workspaces
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const users = await api.getDemoUsers();
      setDemoUsers(users);

      let me: User;
      try {
        me = await api.getMe();
      } catch {
        // Fallback login as Ruthi (Lead) by default
        const loginRes = await api.login('ruthi@teamflow.ai', 'password123');
        me = loginRes.user;
      }
      setCurrentUser(me);

      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        const defaultWs = wsList[0];
        setCurrentWorkspace(defaultWs);
        loadWorkspaceDetails(defaultWs.id);
      }

      loadNotifications();
    } catch (err) {
      console.error("Initialization error", err);
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (e) {
      console.warn("Could not load notifications", e);
    }
  };

  const loadWorkspaceDetails = async (workspaceId: string) => {
    try {
      const [members, projList] = await Promise.all([
        api.getWorkspaceMembers(workspaceId),
        api.getProjects(workspaceId)
      ]);
      setWorkspaceMembers(members);
      setProjects(projList);

      if (projList.length > 0) {
        const selected = projList[0];
        setCurrentProject(selected);
        loadTasks(selected.id);
      } else {
        setCurrentProject(null);
        setTasks([]);
      }
    } catch (err) {
      console.error("Failed to load workspace details", err);
    }
  };

  const loadTasks = async (projectId: string) => {
    try {
      const taskList = await api.getTasks(projectId);
      setTasks(taskList);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };

  // 2. React to Real-Time WebSocket Events
  useEffect(() => {
    if (!lastEvent) return;

    const { type, data } = lastEvent;

    if (type === 'TASK_CREATED') {
      if (data.project_id === currentProject?.id) {
        setTasks(prev => [data, ...prev.filter(t => t.id !== data.id)]);
      }
    } else if (type === 'TASK_UPDATED' || type === 'TASK_MOVED') {
      if (data.project_id === currentProject?.id) {
        setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
        if (selectedTask && selectedTask.id === data.id) {
          setSelectedTask(prev => prev ? { ...prev, ...data } : null);
        }
      }
    } else if (type === 'TASK_DELETED') {
      if (data.project_id === currentProject?.id) {
        setTasks(prev => prev.filter(t => t.id !== data.id));
      }
    } else if (type === 'TASKS_BULK_CREATED') {
      if (data.project_id === currentProject?.id) {
        loadTasks(data.project_id);
      }
    } else if (type === 'NEW_CHAT_MESSAGE') {
      setIncomingChatMessage(data);
    } else if (type === 'NEW_COMMENT') {
      // Reload task comments if modal open
      if (selectedTask && selectedTask.id === data.task_id) {
        setSelectedTask(prev => prev ? {
          ...prev,
          comments: [...(prev.comments || []), data],
          comments_count: (prev.comments_count || 0) + 1
        } : null);
      }
    }
  }, [lastEvent, currentProject?.id, selectedTask?.id]);

  // Handler: Switch identity to test RBAC roles
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      setCurrentUser(res.user);
      loadNotifications();
    } catch (err) {
      console.error("Failed to switch user", err);
    }
  };

  // Handler: Select workspace
  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    loadWorkspaceDetails(ws.id);
  };

  // Handler: Select project
  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    loadTasks(project.id);
  };

  // Handler: Move task (optimistic + API)
  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.moveTask(taskId, newStatus);
    } catch (e) {
      console.error("Move task failed", e);
      if (currentProject) loadTasks(currentProject.id);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    try {
      await api.updateTask(taskId, updates);
    } catch (e) {
      console.error("Update task failed", e);
      if (currentProject) loadTasks(currentProject.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch (e) {
      console.error("Delete task failed", e);
      if (currentProject) loadTasks(currentProject.id);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Global Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        demoUsers={demoUsers}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        members={workspaceMembers}
        notifications={notifications}
        wsConnected={wsConnected}
        onSwitchUser={handleSwitchUser}
        onSelectWorkspace={handleSelectWorkspace}
        onMarkNotificationRead={async (id) => {
          await api.markNotificationRead(id);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }}
        onMarkAllNotificationsRead={async () => {
          await api.markAllNotificationsRead();
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
        onCreateProjectClick={() => setCreateProjectModalOpen(true)}
      />

      {/* Workspace Tabs Navigation */}
      <div style={{
        background: 'var(--bg-surface-sunken)', borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 1440, margin: '0 auto', width: '100%', overflowX: 'auto' }}>
          
          <button
            onClick={() => setActiveTab('kanban')}
            className="btn btn-outline"
            style={{
              borderRadius: 0, padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'kanban' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'kanban' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'kanban' ? 700 : 500,
              fontSize: 13
            }}
          >
            <Kanban size={15} />
            <span>Kanban Board</span>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 10 }}>
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="btn btn-outline"
            style={{
              borderRadius: 0, padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'dashboard' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'dashboard' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              fontSize: 13
            }}
          >
            <BarChart3 size={15} />
            <span>Dashboard & Risks</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-planner')}
            className="btn btn-outline"
            style={{
              borderRadius: 0, padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'ai-planner' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'ai-planner' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: activeTab === 'ai-planner' ? 700 : 500,
              fontSize: 13
            }}
          >
            <Sparkles size={15} color="#818cf8" />
            <span>AI Project Planner</span>
          </button>

          <button
            onClick={() => setActiveTab('sprint-planner')}
            className="btn btn-outline"
            style={{
              borderRadius: 0, padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'sprint-planner' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'sprint-planner' ? '#34d399' : 'var(--text-muted)',
              fontWeight: activeTab === 'sprint-planner' ? 700 : 500,
              fontSize: 13
            }}
          >
            <Calendar size={15} />
            <span>AI Sprint Planner</span>
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            className="btn btn-outline"
            style={{
              borderRadius: 0, padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'meetings' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'meetings' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'meetings' ? 700 : 500,
              fontSize: 13
            }}
          >
            <FileText size={15} />
            <span>Meeting Summarizer</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className="btn btn-outline"
            style={{
              borderRadius: 0, padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'chat' ? '#38bdf8' : 'var(--text-muted)',
              fontWeight: activeTab === 'chat' ? 700 : 500,
              fontSize: 13
            }}
          >
            <MessageSquare size={15} />
            <span>Team Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className="btn btn-outline"
            style={{
              borderRadius: 0, padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'copilot' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'copilot' ? '#c084fc' : 'var(--text-muted)',
              fontWeight: activeTab === 'copilot' ? 700 : 500,
              fontSize: 13
            }}
          >
            <Search size={15} />
            <span>AI Assistant & Q&A</span>
          </button>

        </div>
      </div>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '0 24px', maxWidth: 1440, margin: '0 auto', width: '100%' }}>
        
        {activeTab === 'kanban' && (
          <KanbanBoardView
            tasks={tasks}
            members={workspaceMembers}
            onTaskClick={(task) => setSelectedTask(task)}
            onMoveTask={handleMoveTask}
            onOpenCreateTaskModal={(initStatus) => {
              setCreateTaskInitialStatus(initStatus || 'TODO');
              setCreateTaskModalOpen(true);
            }}
            onOpenAIPlannerModal={() => setActiveTab('ai-planner')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            currentProject={currentProject}
            projects={projects}
            tasks={tasks}
            onSelectProject={handleSelectProject}
            onNavigateToKanban={() => setActiveTab('kanban')}
            onNavigateToSprintPlan={() => setActiveTab('sprint-planner')}
          />
        )}

        {activeTab === 'ai-planner' && (
          <AIPlannerView
            currentProject={currentProject}
            onTasksCreated={() => {
              if (currentProject) loadTasks(currentProject.id);
            }}
            onNavigateToKanban={() => setActiveTab('kanban')}
          />
        )}

        {activeTab === 'sprint-planner' && (
          <AISprintPlannerView
            currentProject={currentProject}
            onNavigateToKanban={() => setActiveTab('kanban')}
          />
        )}

        {activeTab === 'meetings' && (
          <AIMeetingView
            currentProject={currentProject}
            onTasksCreated={() => {
              if (currentProject) loadTasks(currentProject.id);
            }}
          />
        )}

        {activeTab === 'chat' && (
          <TeamChatView
            currentWorkspace={currentWorkspace}
            currentProject={currentProject}
            currentUser={currentUser}
            wsConnected={wsConnected}
            incomingMessage={incomingChatMessage}
          />
        )}

        {activeTab === 'copilot' && (
          <AICopilotView
            currentProject={currentProject}
            onNavigateToKanban={() => setActiveTab('kanban')}
          />
        )}

      </main>

      {/* Task Modal for details, comments, and AI breakdown */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={workspaceMembers}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onSubtasksCreated={() => {
            if (currentProject) loadTasks(currentProject.id);
          }}
        />
      )}

      {/* Create Task Modal */}
      {createTaskModalOpen && (
        <CreateTaskModal
          currentProject={currentProject}
          members={workspaceMembers}
          initialStatus={createTaskInitialStatus}
          onClose={() => setCreateTaskModalOpen(false)}
          onTaskCreated={() => {
            if (currentProject) loadTasks(currentProject.id);
          }}
        />
      )}

      {/* Create Project Modal */}
      {createProjectModalOpen && (
        <CreateProjectModal
          currentWorkspace={currentWorkspace}
          onClose={() => setCreateProjectModalOpen(false)}
          onProjectCreated={() => {
            if (currentWorkspace) loadWorkspaceDetails(currentWorkspace.id);
          }}
        />
      )}

    </div>
  );
};

export default App;
