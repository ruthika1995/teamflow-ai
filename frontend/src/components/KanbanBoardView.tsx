import React, { useState } from 'react';
import {
  Plus, Search, Filter, Clock, MessageSquare, ChevronRight,
  ChevronLeft, Sparkles, CheckCircle2, User, ArrowRight
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, WorkspaceMember } from '../types';

interface KanbanBoardViewProps {
  tasks: Task[];
  members: WorkspaceMember[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onOpenCreateTaskModal: (initialStatus?: TaskStatus) => void;
  onOpenAIPlannerModal: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; lightBg: string }[] = [
  { id: 'TODO', title: 'TODO', color: '#94a3b8', lightBg: 'rgba(148, 163, 184, 0.08)' },
  { id: 'IN_PROGRESS', title: 'IN PROGRESS', color: '#38bdf8', lightBg: 'rgba(56, 189, 248, 0.08)' },
  { id: 'IN_REVIEW', title: 'IN REVIEW', color: '#c084fc', lightBg: 'rgba(192, 132, 252, 0.08)' },
  { id: 'DONE', title: 'DONE', color: '#34d399', lightBg: 'rgba(52, 211, 153, 0.08)' },
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

  // Filter tasks
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0' }}>
      
      {/* Control bar: search, filters, actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, background: 'var(--bg-surface)', padding: 14,
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)'
      }}>
        
        {/* Left: Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 220 }}>
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input
              type="text"
              placeholder="Search tasks, labels..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} color="var(--text-muted)" />
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: 130 }}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <select
            className="input"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            style={{ width: 150 }}
          >
            <option value="ALL">All Members</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
            ))}
          </select>
        </div>

        {/* Right: AI Planner & New Task buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenAIPlannerModal}
            className="btn btn-secondary btn-sm"
            style={{ border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
          >
            <Sparkles size={14} color="#818cf8" />
            AI Project Planner
          </button>

          <button onClick={() => onOpenCreateTaskModal('TODO')} className="btn btn-primary btn-sm">
            <Plus size={14} />
            Add Task
          </button>
        </div>

      </div>

      {/* Kanban Columns Horizontal Canvas */}
      <div style={{
        display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16,
        alignItems: 'flex-start'
      }}>
        {COLUMNS.map(column => {
          const columnTasks = filteredTasks.filter(t => t.status === column.id);

          return (
            <div key={column.id} className="kanban-column">
              
              {/* Column Header */}
              <div style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)',
                background: column.lightBg, borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: column.color }} />
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: '0.02em' }}>
                    {column.title}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '1px 7px',
                    borderRadius: 10, background: 'rgba(0,0,0,0.3)', color: column.color
                  }}>
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => onOpenCreateTaskModal(column.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: 2, display: 'flex'
                  }}
                  title={`Add to ${column.title}`}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Tasks List */}
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 300 }}>
                {columnTasks.length === 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flex: 1, color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic',
                    minHeight: 120, border: '1px dashed var(--border-subtle)', borderRadius: 8
                  }}>
                    No tasks in {column.title}
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <div
                      key={task.id}
                      className="kanban-task-card"
                      onClick={() => onTaskClick(task)}
                    >
                      {/* Top labels & priority */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-dim)' }}>
                          <Clock size={11} />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      </div>

                      {/* Title */}
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 6 }}>
                        {task.title}
                      </div>

                      {/* Description excerpt */}
                      {task.description && (
                        <div style={{
                          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4,
                          marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {task.description}
                        </div>
                      )}

                      {/* Labels tag */}
                      {task.labels && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                          {task.labels.split(',').map((label, idx) => (
                            <span key={idx} style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 6px',
                              borderRadius: 4, background: 'var(--bg-surface-sunken)',
                              color: 'var(--text-dim)', border: '1px solid var(--border-subtle)'
                            }}>
                              {label.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Assignee, Comments & Quick Move Arrows */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: 8, borderTop: '1px solid var(--border-subtle)', marginTop: 4
                      }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {task.assignee ? (
                            <img
                              src={task.assignee.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                              alt={task.assignee.full_name}
                              title={`Assigned to ${task.assignee.full_name}`}
                              style={{ width: 22, height: 22, borderRadius: '50%' }}
                            />
                          ) : (
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              background: 'var(--bg-surface-sunken)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center'
                            }}>
                              <User size={12} color="var(--text-dim)" />
                            </div>
                          )}

                          {task.comments_count > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-dim)' }}>
                              <MessageSquare size={11} />
                              <span>{task.comments_count}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Status Shift Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                          {getPrevStatus(task.status) && (
                            <button
                              onClick={() => onMoveTask(task.id, getPrevStatus(task.status)!)}
                              className="btn btn-outline"
                              style={{ width: 22, height: 22, padding: 0, borderRadius: 4 }}
                              title={`Move back to ${getPrevStatus(task.status)}`}
                            >
                              <ChevronLeft size={13} />
                            </button>
                          )}
                          {getNextStatus(task.status) && (
                            <button
                              onClick={() => onMoveTask(task.id, getNextStatus(task.status)!)}
                              className="btn btn-primary"
                              style={{ width: 22, height: 22, padding: 0, borderRadius: 4 }}
                              title={`Advance to ${getNextStatus(task.status)}`}
                            >
                              <ChevronRight size={13} />
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
