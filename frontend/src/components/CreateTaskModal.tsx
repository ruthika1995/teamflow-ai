import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Project, WorkspaceMember, TaskStatus, TaskPriority } from '../types';
import { api } from '../services/api';

interface CreateTaskModalProps {
  currentProject: Project | null;
  members: WorkspaceMember[];
  initialStatus?: TaskStatus;
  onClose: () => void;
  onTaskCreated: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  currentProject,
  members,
  initialStatus = 'TODO',
  onClose,
  onTaskCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(4.0);
  const [labels, setLabels] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !title.trim() || loading) return;

    try {
      setLoading(true);
      await api.createTask({
        project_id: currentProject.id,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee_id: assigneeId || undefined,
        estimated_hours: estimatedHours,
        labels: labels.trim()
      });
      onTaskCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create task", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 20 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>New Task</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 24, height: 24, padding: 0 }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 login endpoints"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ marginTop: 4, height: 32 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Description</label>
            <textarea
              placeholder="Context, requirements, and acceptance criteria..."
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ marginTop: 4, minHeight: 60 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Status</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={{ marginTop: 4, height: 30 }}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Priority</label>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={{ marginTop: 4, height: 30 }}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Assignee</label>
              <select className="input" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ marginTop: 4, height: 30 }}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Estimated Effort (hours)</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={estimatedHours}
                onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
                style={{ marginTop: 4, height: 30, fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Labels (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. backend, security"
              className="input"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              style={{ marginTop: 4, height: 30 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()} className="btn btn-primary btn-sm">
              <Plus size={13} />
              <span>{loading ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
