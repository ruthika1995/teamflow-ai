import React, { useState, useEffect } from 'react';
import {
  X, Clock, Calendar, Tag, Sparkles, Send, Trash2,
  CheckCircle2, MessageSquare
} from 'lucide-react';
import { Task, WorkspaceMember, TaskStatus, TaskPriority, AISubtask } from '../types';
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
  const [breakingDown, setBreakingDown] = useState(false);
  const [aiSubtasks, setAiSubtasks] = useState<AISubtask[] | null>(null);
  const [subtaskRationale, setSubtaskRationale] = useState('');
  const [addingSubtasks, setAddingSubtasks] = useState(false);

  useEffect(() => {
    loadFullDetail();
  }, [task.id]);

  const loadFullDetail = async () => {
    try {
      const res = await api.getTaskDetail(task.id);
      setDetail(res);
    } catch (e) {
      console.warn("Could not load task detail", e);
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
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 740, padding: 20 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className={`tag tag-${detail.status.toLowerCase()}`}>
                {detail.status.replace('_', ' ')}
              </span>
              <span className={`tag tag-${detail.priority.toLowerCase()}`}>
                {detail.priority}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                #{detail.id.slice(0, 8)}
              </span>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {detail.title}
            </h2>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ width: 26, height: 26, padding: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* Two-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginTop: 16 }}>
          
          {/* Left Column: Description & Subtasks & Comments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Description */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                Description
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                background: 'var(--bg-surface-sunken)', padding: 10, borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)', minHeight: 60
              }}>
                {detail.description || 'No detailed description provided.'}
              </div>
            </div>

            {/* AI Task Decomposition Section */}
            <div style={{
              background: 'var(--bg-surface-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', padding: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="var(--color-accent)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Decompose Task</span>
                </div>
                
                <button
                  onClick={handleAIDecompose}
                  disabled={breakingDown}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  {breakingDown ? 'Analyzing...' : 'Break down with AI'}
                </button>
              </div>

              {subtaskRationale && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                  {subtaskRationale}
                </div>
              )}

              {aiSubtasks && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                    Proposed Subtasks ({aiSubtasks.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {aiSubtasks.map((sub, idx) => (
                      <div key={idx} style={{
                        padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{sub.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{sub.description}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{sub.estimated_hours}h</span>
                          <span className={`tag tag-${sub.priority.toLowerCase()}`} style={{ fontSize: 9 }}>
                            {sub.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      onClick={handleApproveSubtasks}
                      disabled={addingSubtasks}
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle2 size={12} />
                      {addingSubtasks ? 'Adding...' : 'Approve & Add to Board'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Thread */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                Activity & Comments ({detail.comments?.length || 0})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
                {(!detail.comments || detail.comments.length === 0) ? (
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    No comments on this task yet.
                  </div>
                ) : (
                  detail.comments.map(c => (
                    <div key={c.id} style={{
                      padding: 8, background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img
                            src={c.user?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                            alt={c.user?.full_name}
                            style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{c.user?.full_name}</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.content}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Leave a comment..."
                  className="input"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  style={{ height: 32, fontSize: 12 }}
                />
                <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 10px' }}>
                  <Send size={12} />
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Metadata Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Status</label>
              <select
                className="input"
                value={detail.status}
                onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                style={{ marginTop: 4, height: 30, fontSize: 12 }}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Priority</label>
              <select
                className="input"
                value={detail.priority}
                onChange={e => handlePriorityChange(e.target.value as TaskPriority)}
                style={{ marginTop: 4, height: 30, fontSize: 12 }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Assignee</label>
              <select
                className="input"
                value={detail.assignee_id || 'UNASSIGNED'}
                onChange={e => handleAssigneeChange(e.target.value)}
                style={{ marginTop: 4, height: 30, fontSize: 12 }}
              >
                <option value="UNASSIGNED">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Estimated Effort</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
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
                  style={{ height: 30, fontSize: 12, width: 80, fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>hours</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Deadline</label>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                {detail.deadline ? new Date(detail.deadline).toLocaleDateString() : 'None set'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Labels</label>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {detail.labels || 'None'}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
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
                <Trash2 size={12} />
                <span>Delete Task</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
