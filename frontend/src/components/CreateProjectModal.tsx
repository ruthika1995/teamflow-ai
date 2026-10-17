import React, { useState } from 'react';
import { X, Plus, FolderPlus } from 'lucide-react';
import { Workspace } from '../types';
import { api } from '../services/api';

interface CreateProjectModalProps {
  currentWorkspace: Workspace | null;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  currentWorkspace,
  onClose,
  onProjectCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(21);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !name.trim() || loading) return;

    try {
      setLoading(true);
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

      await api.createProject(
        currentWorkspace.id,
        name.trim(),
        description.trim(),
        deadlineDate.toISOString()
      );
      onProjectCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create project", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 20 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FolderPlus size={15} color="var(--color-accent)" />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>New Project</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 24, height: 24, padding: 0 }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Application"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ marginTop: 4, height: 32 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Description</label>
            <textarea
              placeholder="Project goals, milestones, and scope..."
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ marginTop: 4, minHeight: 60 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Target Deadline</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <input
                type="number"
                min="1"
                max="180"
                className="input"
                value={deadlineDays}
                onChange={e => setDeadlineDays(parseInt(e.target.value) || 14)}
                style={{ width: 70, height: 30, fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>days from today</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="btn btn-primary btn-sm">
              <Plus size={13} />
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
