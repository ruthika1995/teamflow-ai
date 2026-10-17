import React, { useState } from 'react';
import {
  Plus, Search, Filter, Clock, MessageSquare, ChevronRight,
  ChevronLeft, Sparkles, User
} from 'lucide-react';
import { Task, TaskStatus, WorkspaceMember } from '../types';

interface KanbanBoardViewProps {
  tasks: Task[];
  members: WorkspaceMember[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onOpenCreateTaskModal: (initialStatus?: TaskStatus) => void;
  onOpenAIPlannerModal: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; tagClass: string }[] = [
  { id: 'TODO', title: 'To Do', tagClass: 'tag-todo' },
  { id: 'IN_PROGRESS', title: 'In Progress', tagClass: 'tag-in_progress' },
  { id: 'IN_REVIEW', title: 'In Review', tagClass: 'tag-in_review' },
  { id: 'DONE', title: 'Done', tagClass: 'tag-done' },
];

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  tasks,
  members,
  onTaskClick,
  onMoveTask,
  onOpenCreateTaskModal,
  onOpenAIPlannerModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.labels || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || task.assignee_id === assigneeFilter;

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'TODO': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'IN_REVIEW';
      case 'IN_REVIEW': return 'DONE';
      default: return null;
    }
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'DONE': return 'IN_REVIEW';
      case 'IN_REVIEW': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'TODO';
      default: return null;
    }
  };

  const getPriorityTagClass = (p: string) => {
    switch (p) {
      case 'URGENT': return 'tag-urgent';
      case 'HIGH': return 'tag-high';
      case 'MEDIUM': return 'tag-medium';
      default: return 'tag-low';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
      
      {/* Restrained Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10
      }}>
        
        {/* Left: Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', left: 8, top: 8 }} />
            <input
              type="text"
              placeholder="Filter tasks..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 26, height: 30, fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: 110, height: 30, fontSize: 12, padding: '4px 8px' }}
            >
              <option value="ALL">Priority: All</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              className="input"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              style={{ width: 130, height: 30, fontSize: 12, padding: '4px 8px' }}
            >
              <option value="ALL">Assignee: All</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: AI Planner & New Task */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onOpenAIPlannerModal}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={13} color="var(--color-accent)" />
            <span>AI Plan</span>
          </button>

          <button onClick={() => onOpenCreateTaskModal('TODO')} className="btn btn-primary btn-sm">
            <Plus size={13} />
            <span>New Task</span>
          </button>
        </div>

      </div>

      {/* Kanban Columns Horizontal Layout */}
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16,
        alignItems: 'flex-start'
      }}>
        {COLUMNS.map(column => {
          const columnTasks = filteredTasks.filter(t => t.status === column.id);

          return (
            <div key={column.id} className="kanban-column">
              
              {/* Column Header */}
              <div style={{
                padding: '10px 12px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                    {column.title}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '1px 5px',
                    borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface-raised)',
                    color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'
                  }}>
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => onOpenCreateTaskModal(column.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-dim)',
                    cursor: 'pointer', padding: 2, display: 'flex', borderRadius: 'var(--radius-xs)'
                  }}
                  title={`Add to ${column.title}`}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Tasks List */}
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 320 }}>
                {columnTasks.length === 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flex: 1, color: 'var(--text-dim)', fontSize: 12,
                    minHeight: 100, border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)'
                  }}>
                    No tasks
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <div
                      key={task.id}
                      className="kanban-task-card"
                      onClick={() => onTaskClick(task)}
                    >
                      {/* Priority & Estimate */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className={`tag ${getPriorityTagClass(task.priority)}`}>
                          {task.priority}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          <Clock size={11} />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      </div>

                      {/* Title */}
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 }}>
                        {task.title}
                      </div>

                      {/* Description excerpt */}
                      {task.description && (
                        <div style={{
                          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4,
                          marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {task.description}
                        </div>
                      )}

                      {/* Labels tag */}
                      {task.labels && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
                          {task.labels.split(',').map((label, idx) => (
                            <span key={idx} style={{
                              fontSize: 10, padding: '1px 5px',
                              borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface-sunken)',
                              color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {label.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Assignee, Comments & Move controls */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: 6, borderTop: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {task.assignee ? (
                            <img
                              src={task.assignee.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                              alt={task.assignee.full_name}
                              title={task.assignee.full_name}
                              style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: 'var(--bg-surface-raised)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center'
                            }}>
                              <User size={10} color="var(--text-dim)" />
                            </div>
                          )}

                          {task.comments_count > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              <MessageSquare size={10} />
                              <span>{task.comments_count}</span>
                            </div>
                          )}
                        </div>

                        {/* Shift Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                          {getPrevStatus(task.status) && (
                            <button
                              onClick={() => onMoveTask(task.id, getPrevStatus(task.status)!)}
                              className="btn btn-ghost"
                              style={{ width: 20, height: 20, padding: 0 }}
                              title={`Move to ${getPrevStatus(task.status)}`}
                            >
                              <ChevronLeft size={12} />
                            </button>
                          )}
                          {getNextStatus(task.status) && (
                            <button
                              onClick={() => onMoveTask(task.id, getNextStatus(task.status)!)}
                              className="btn btn-ghost"
                              style={{ width: 20, height: 20, padding: 0 }}
                              title={`Advance to ${getNextStatus(task.status)}`}
                            >
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
