import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Calendar,
  ArrowRight, Sparkles, RefreshCw
} from 'lucide-react';
import { Project, Task, AIRiskAnalysisResponse } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  currentProject: Project | null;
  projects: Project[];
  tasks: Task[];
  onSelectProject: (project: Project) => void;
  onNavigateToKanban: () => void;
  onNavigateToSprintPlan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentProject,
  projects,
  tasks,
  onSelectProject,
  onNavigateToKanban,
  onNavigateToSprintPlan
}) => {
  const [riskData, setRiskData] = useState<AIRiskAnalysisResponse | null>(null);
  const [loadingRisk, setLoadingRisk] = useState<boolean>(false);

  useEffect(() => {
    if (currentProject) {
      loadRiskAnalysis(currentProject.id);
    }
  }, [currentProject?.id, tasks.length]);

  const loadRiskAnalysis = async (projectId: string) => {
    try {
      setLoadingRisk(true);
      const res = await api.getRiskAnalysis(projectId);
      setRiskData(res);
    } catch (e) {
      console.warn("Could not load risk analysis", e);
    } finally {
      setLoadingRisk(false);
    }
  };

  const completedCount = tasks.filter(t => t.status === 'DONE').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewCount = tasks.filter(t => t.status === 'IN_REVIEW').length;
  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const totalEstHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

  const getRiskTagClass = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'tag-urgent';
      case 'HIGH': return 'tag-high';
      case 'MEDIUM': return 'tag-medium';
      default: return 'tag-done';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0', maxWidth: 1100 }}>
      
      {/* Project Switcher Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {currentProject?.name || 'Project Overview'}
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ({totalTasks} total tasks)
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {currentProject?.description || 'Track deliverables, sprint velocity, and delivery risks.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            className="input"
            value={currentProject?.id || ''}
            onChange={(e) => {
              const p = projects.find(item => item.id === e.target.value);
              if (p) onSelectProject(p);
            }}
            style={{ width: 180, height: 30, fontSize: 12 }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button onClick={onNavigateToKanban} className="btn btn-secondary btn-sm">
            <span>View Board</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Structured Sections Hierarchy (Not a generic card grid!) */}
      
      {/* 1. PROJECT OVERVIEW */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          Project Progress
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            {progressPct}%
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span><strong>{totalTasks}</strong> total tasks</span>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span style={{ color: 'var(--status-success)' }}><strong>{completedCount}</strong> completed</span>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span style={{ color: 'var(--color-accent)' }}><strong>{inProgressCount}</strong> in progress</span>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}><strong>{todoCount + inReviewCount}</strong> remaining</span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div style={{ marginTop: 12, height: 4, background: 'var(--bg-surface-sunken)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'var(--color-accent)',
            borderRadius: 2,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* 2. PROJECT HEALTH & DELIVERY RISK */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Delivery Schedule & Health Analysis
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => currentProject && loadRiskAnalysis(currentProject.id)}
              className="btn btn-ghost btn-sm"
              disabled={loadingRisk}
              title="Refresh Health Analysis"
              style={{ fontSize: 11, padding: '2px 6px' }}
            >
              <RefreshCw size={11} className={loadingRisk ? 'spin' : ''} />
              <span>Recalculate</span>
            </button>
          </div>
        </div>

        {riskData ? (
          <div>
            {/* Inline Health Metrics Row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
              padding: '12px 14px', background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Delivery Risk</div>
                <div style={{ marginTop: 4 }}>
                  <span className={`tag ${getRiskTagClass(riskData.risk_level)}`} style={{ fontSize: 11, textTransform: 'uppercase' }}>
                    {riskData.risk_level}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Estimated Work</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {riskData.estimated_work_hours} hrs
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Available Capacity</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {riskData.available_capacity_hours} hrs
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Days to Deadline</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {riskData.days_to_deadline} days
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
              {riskData.summary}
            </div>

            {/* Recommendations List */}
            {riskData.recommendations.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                  Recommended Adjustments:
                </div>
                <ul style={{ paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {riskData.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Calculating delivery health...</div>
        )}
      </div>

      {/* 3. PRIORITY DELIVERABLES */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Active Tasks in Flight
          </div>

          <button onClick={onNavigateToKanban} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
            View Full Board
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tasks.slice(0, 5).map(task => (
            <div
              key={task.id}
              onClick={onNavigateToKanban}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', background: 'var(--bg-surface-sunken)',
                borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', transition: 'background var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`tag tag-${task.status.toLowerCase()}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{task.title}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`tag tag-${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {task.estimated_hours}h
                </span>
                {task.assignee && (
                  <img
                    src={task.assignee.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                    alt={task.assignee.full_name}
                    title={task.assignee.full_name}
                    style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
