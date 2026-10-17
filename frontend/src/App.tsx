import React, { useState, useEffect } from 'react';
import {
  Kanban, BarChart3, Sparkles, Calendar, FileText,
  MessageSquare, Search
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
  
  type TabType = 'kanban' | 'dashboard' | 'ai-planner' | 'sprint-planner' | 'meetings' | 'chat' | 'copilot';
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

  // React to Real-Time WebSocket Events
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
      if (selectedTask && selectedTask.id === data.task_id) {
        setSelectedTask(prev => prev ? {
          ...prev,
          comments: [...(prev.comments || []), data],
          comments_count: (prev.comments_count || 0) + 1
        } : null);
      }
    }
  }, [lastEvent, currentProject?.id, selectedTask?.id]);

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      setCurrentUser(res.user);
      loadNotifications();
    } catch (err) {
      console.error("Failed to switch user", err);
    }
  };

  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    loadWorkspaceDetails(ws.id);
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    loadTasks(project.id);
  };

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      
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

      {/* Workspace Subheader & Tab Navigation */}
      <div style={{
        background: 'var(--bg-canvas)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 16px'
      }}>
        <div style={{ display: 'flex', gap: 2, maxWidth: 1440, margin: '0 auto', width: '100%', overflowX: 'auto' }}>
          
          <button
            onClick={() => setActiveTab('kanban')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'kanban' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Kanban size={14} />
            <span>Board</span>
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)',
              marginLeft: 2
            }}>
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'dashboard' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <BarChart3 size={14} />
            <span>Overview & Risks</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-planner')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'ai-planner' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'ai-planner' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} />
            <span>Project Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('sprint-planner')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'sprint-planner' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'sprint-planner' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Calendar size={14} />
            <span>Sprint Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'meetings' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'meetings' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileText size={14} />
            <span>Meeting Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <MessageSquare size={14} />
            <span>Team Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'copilot' ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === 'copilot' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Search size={14} />
            <span>Search & Assistant</span>
          </button>

        </div>
      </div>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '0 16px', maxWidth: 1440, margin: '0 auto', width: '100%' }}>
        
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
