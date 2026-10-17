import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, Clock, Layers, ArrowRight, Check
} from 'lucide-react';
import { Project, AIProjectPlanResponse, AIPlanTask } from '../types';
import { api } from '../services/api';

interface AIPlannerViewProps {
  currentProject: Project | null;
  onTasksCreated: () => void;
  onNavigateToKanban: () => void;
}

const PRESETS = [
  "Build an e-commerce website with React and FastAPI, including Stripe checkout and inventory management.",
  "Cross-platform mobile app for real-time logistics tracking and field driver updates.",
  "Customer support escalation workflow with human-in-the-loop approvals and ticket categorization.",
  "Team collaboration workspace with real-time WebSocket state synchronization and RBAC."
];

export const AIPlannerView: React.FC<AIPlannerViewProps> = ({
  currentProject,
  onTasksCreated,
  onNavigateToKanban
}) => {
  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AIProjectPlanResponse | null>(null);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleGeneratePlan = async () => {
    if (!currentProject || !prompt.trim()) return;

    try {
      setLoading(true);
      setSuccessMessage('');
      const res = await api.generateProjectPlan(currentProject.id, prompt);
      setPlan(res);
    } catch (err) {
      console.error("Failed to generate plan", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!currentProject || !plan) return;

    try {
      setCreatingTasks(true);
      const allTasks: AIPlanTask[] = [];
      plan.milestones.forEach(m => {
        allTasks.push(...m.tasks);
      });

      await api.bulkCreateTasks(currentProject.id, allTasks);
      setSuccessMessage(`Created ${allTasks.length} tasks in ${currentProject.name}`);
      onTasksCreated();
    } catch (err) {
      console.error("Failed to bulk create tasks", err);
    } finally {
      setCreatingTasks(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0', maxWidth: 1000 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Project Planning & Milestone Decomposition
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Describe technical requirements or sprint goals. The system synthesizes a multi-phase implementation plan with estimated effort.
        </p>
      </div>

      {/* 1. Project Brief Section */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          Step 1: Project Scope Brief
        </div>

        <textarea
          className="input"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Specify deliverables, technologies, and target functionality..."
          style={{ minHeight: 70, fontSize: 13 }}
        />

        {/* Presets */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Example templates:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '2px 6px', border: '1px solid var(--border-subtle)' }}
              >
                {p.slice(0, 44)}...
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={handleGeneratePlan}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary btn-sm"
          >
            <Sparkles size={13} />
            <span>{loading ? 'Synthesizing Architecture...' : 'Generate Implementation Plan'}</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div style={{
          background: 'var(--status-success-subtle)', border: '1px solid var(--status-success-border)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6ee7b7', fontSize: 13 }}>
            <CheckCircle2 size={15} />
            <span>{successMessage}</span>
          </div>
          <button onClick={onNavigateToKanban} className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
            View in Board →
          </button>
        </div>
      )}

      {/* 2. Structured Implementation Workspace */}
      {plan && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          
          {/* Plan Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Step 2: Generated Implementation Plan
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{plan.plan_title}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{plan.summary}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Total Effort</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {plan.total_estimated_hours} hrs
                </div>
              </div>

              <button
                onClick={handleCreateTasks}
                disabled={creatingTasks}
                className="btn btn-primary btn-sm"
              >
                <Check size={13} />
                <span>{creatingTasks ? 'Creating...' : 'Approve & Create Tasks'}</span>
              </button>
            </div>
          </div>

          {/* Phased Milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {plan.milestones.map((m, mIdx) => (
              <div key={mIdx} style={{
                background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)', padding: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={13} color="var(--color-accent)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.milestone_name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {m.tasks.length} tasks
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {m.tasks.map((task, tIdx) => (
                    <div key={tIdx} style={{
                      padding: 10, background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className={`tag ${getPriorityTagClass(task.priority)}`} style={{ fontSize: 10 }}>
                          {task.priority}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {task.estimated_hours}h
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {task.description}
                      </div>
                      {task.suggested_role && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                          Role: {task.suggested_role}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
