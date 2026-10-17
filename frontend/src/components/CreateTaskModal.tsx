import React, { useState } from 'react';
import { X, Plus, Clock, Tag } from 'lucide-react';
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
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, padding: 24 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Create New Task</h2>
          <button onClick={onClose} className="btn btn-outline" style={{ width: 30, height: 30, padding: 0 }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 login endpoints"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Description</label>
            <textarea
              placeholder="Context, requirements, and acceptance criteria..."
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ marginTop: 4, minHeight: 70 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={{ marginTop: 4 }}>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Priority</label>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={{ marginTop: 4 }}>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Assignee</label>
              <select className="input" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ marginTop: 4 }}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={estimatedHours}
                onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
                style={{ marginTop: 4 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Labels (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Backend, Auth, High-Priority"
              className="input"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()} className="btn btn-primary">
              <Plus size={14} />
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
