import React, { useState, useEffect } from 'react';
import {
  X, Clock, Calendar, User, Tag, Sparkles, Send, Trash2,
  AlertCircle, CheckCircle2, ChevronRight, MessageSquare
} from 'lucide-react';
import { Task, WorkspaceMember, Comment, TaskStatus, TaskPriority, AISubtask } from '../types';
import { api } from '../services/api';

interface TaskModalProps {
  task: Task;
  members: WorkspaceMember[];
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onSubtasksCreated: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  members,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onSubtasksCreated
}) => {
  const [detail, setDetail] = useState<Task>(task);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [breakingDown, setBreakingDown] = useState(false);
  const [aiSubtasks, setAiSubtasks] = useState<AISubtask[] | null>(null);
  const [subtaskRationale, setSubtaskRationale] = useState('');
  const [addingSubtasks, setAddingSubtasks] = useState(false);

  useEffect(() => {
    loadFullDetail();
  }, [task.id]);

  const loadFullDetail = async () => {
    try {
      setLoadingComments(true);
      const res = await api.getTaskDetail(task.id);
      setDetail(res);
    } catch (e) {
      console.warn("Could not load task detail", e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleStatusChange = (status: TaskStatus) => {
    setDetail(prev => ({ ...prev, status }));
    onUpdateTask(task.id, { status });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    setDetail(prev => ({ ...prev, priority }));
    onUpdateTask(task.id, { priority });
  };

  const handleAssigneeChange = (assignee_id: string) => {
    const aid = assignee_id === 'UNASSIGNED' ? undefined : assignee_id;
    setDetail(prev => ({ ...prev, assignee_id: aid }));
    onUpdateTask(task.id, { assignee_id: aid });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const added = await api.addComment(task.id, newComment.trim());
      setDetail(prev => ({
        ...prev,
        comments: [...(prev.comments || []), added],
        comments_count: (prev.comments_count || 0) + 1
      }));
      setNewComment('');
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleAIDecompose = async () => {
    try {
      setBreakingDown(true);
      const res = await api.breakdownTask(task.id);
      setAiSubtasks(res.subtasks);
      setSubtaskRationale(res.rationale);
    } catch (e) {
      console.error("Task breakdown failed", e);
    } finally {
      setBreakingDown(false);
    }
  };

  const handleApproveSubtasks = async () => {
    if (!aiSubtasks || aiSubtasks.length === 0) return;
    try {
      setAddingSubtasks(true);
      const tasksToCreate = aiSubtasks.map(s => ({
        title: s.title,
        description: s.description,
        priority: s.priority,
        estimated_hours: s.estimated_hours,
        suggested_role: "Subtask"
      }));
      await api.bulkCreateTasks(task.project_id, tasksToCreate);
      setAiSubtasks(null);
      onSubtasksCreated();
    } catch (e) {
      console.error("Failed to create subtasks", e);
    } finally {
      setAddingSubtasks(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 750, padding: 24 }}>
        
        {/* Header with Title and Close Button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className={`badge badge-${detail.status.toLowerCase()}`}>
                {detail.status.replace('_', ' ')}
              </span>
              <span className={`badge badge-${detail.priority.toLowerCase()}`}>
                {detail.priority}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>ID: {detail.id.slice(0, 8)}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
              {detail.title}
            </h2>
          </div>

          <button onClick={onClose} className="btn btn-outline" style={{ width: 32, height: 32, padding: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Two-Column Grid: Left Details & AI Breakdown, Right Metadata & Comments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 20 }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Description */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                DESCRIPTION
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                background: 'var(--bg-surface-sunken)', padding: 12, borderRadius: 8,
                border: '1px solid var(--border-subtle)', minHeight: 60
              }}>
                {detail.description || 'No detailed description provided.'}
              </div>
            </div>

            {/* AI Task Breakdown Section */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)', padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>AI Task Decomposition</span>
                </div>
                
                <button
                  onClick={handleAIDecompose}
                  disabled={breakingDown}
                  className="btn btn-primary btn-sm"
                >
                  {breakingDown ? 'Decomposing...' : 'Decompose with AI'}
                </button>
              </div>

              {subtaskRationale && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  {subtaskRationale}
                </div>
              )}

              {aiSubtasks && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                    Generated Subtasks ({aiSubtasks.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {aiSubtasks.map((sub, idx) => (
                      <div key={idx} style={{
                        padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 6,
                        border: '1px solid var(--border-subtle)', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{sub.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{sub.description}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub.estimated_hours}h</span>
                          <span className={`badge badge-${sub.priority.toLowerCase()}`} style={{ fontSize: 9 }}>
                            {sub.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      onClick={handleApproveSubtasks}
                      disabled={addingSubtasks}
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle2 size={13} />
                      {addingSubtasks ? 'Adding...' : 'Approve & Add to Board'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Stream */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={13} />
                <span>COMMENTS ({detail.comments?.length || 0})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                {(!detail.comments || detail.comments.length === 0) ? (
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  detail.comments.map(c => (
                    <div key={c.id} style={{
                      padding: 10, background: 'var(--bg-surface-sunken)', borderRadius: 8,
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img
                            src={c.user?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                            alt={c.user?.full_name}
                            style={{ width: 18, height: 18, borderRadius: '50%' }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{c.user?.full_name}</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.content}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="input"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 12px' }}>
                  <Send size={14} />
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Metadata & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Status Selector */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</label>
              <select
                className="input"
                value={detail.status}
                onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                style={{ marginTop: 4 }}
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Priority</label>
              <select
                className="input"
                value={detail.priority}
                onChange={e => handlePriorityChange(e.target.value as TaskPriority)}
                style={{ marginTop: 4 }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Assignee</label>
              <select
                className="input"
                value={detail.assignee_id || 'UNASSIGNED'}
                onChange={e => handleAssigneeChange(e.target.value)}
                style={{ marginTop: 4 }}
              >
                <option value="UNASSIGNED">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
                ))}
              </select>
            </div>

            {/* Estimated Hours */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estimated Hours</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Clock size={14} color="var(--text-muted)" />
                <input
                  type="number"
                  className="input"
                  value={detail.estimated_hours}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setDetail(prev => ({ ...prev, estimated_hours: val }));
                    onUpdateTask(task.id, { estimated_hours: val });
                  }}
                  step="0.5"
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Deadline</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Calendar size={14} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {detail.deadline ? new Date(detail.deadline).toLocaleDateString() : 'No deadline set'}
                </span>
              </div>
            </div>

            {/* Labels */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Labels</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Tag size={14} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{detail.labels || 'None'}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="btn btn-danger btn-sm"
                style={{ width: '100%' }}
              >
                <Trash2 size={13} />
                Delete Task
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
