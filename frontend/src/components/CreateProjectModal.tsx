import React, { useState } from 'react';
import { X, Plus, Calendar, FolderPlus } from 'lucide-react';
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
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, padding: 24 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderPlus size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>New Project</h2>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ width: 30, height: 30, padding: 0 }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Next-Gen Mobile App"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Description & Scope</label>
            <textarea
              placeholder="Describe what this project will deliver..."
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ marginTop: 4, minHeight: 70 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Target Deadline</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="number"
                min="1"
                max="180"
                className="input"
                value={deadlineDays}
                onChange={e => setDeadlineDays(parseInt(e.target.value) || 14)}
                style={{ width: 90 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>days from today</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="btn btn-primary">
              <Plus size={14} />
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
