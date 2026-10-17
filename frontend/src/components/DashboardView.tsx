import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Calendar, BarChart3,
  TrendingUp, Users, ArrowUpRight, Sparkles, RefreshCw
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

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', text: '#fda4af', badge: '#f43f5e' };
      case 'HIGH': return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fde68a', badge: '#f59e0b' };
      case 'MEDIUM': return { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', text: '#bae6fd', badge: '#38bdf8' };
      default: return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#a7f3d0', badge: '#10b981' };
    }
  };

  const riskColors = getRiskColor(riskData?.risk_level);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 0' }}>
      
      {/* Top Header Row with Project Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {currentProject?.name || 'Project Dashboard'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {currentProject?.description || 'Real-time progress overview, AI delivery risks, and team capacity'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            className="input"
            value={currentProject?.id || ''}
            onChange={(e) => {
              const p = projects.find(item => item.id === e.target.value);
              if (p) onSelectProject(p);
            }}
            style={{ width: 220 }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button onClick={onNavigateToKanban} className="btn btn-primary btn-sm">
            Open Kanban Board →
          </button>
        </div>
      </div>

      {/* 🚨 AI DEADLINE RISK DETECTION BANNER */}
      {riskData && (
        <div style={{
          background: riskColors.bg,
          border: `1px solid ${riskColors.border}`,
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: riskColors.badge,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 16px ${riskColors.badge}66`
              }}>
                <AlertTriangle size={18} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
                    AI Delivery Risk Analysis
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800,
                    background: riskColors.badge, color: '#fff', textTransform: 'uppercase'
                  }}>
                    {riskData.risk_level} RISK
                  </span>
                </div>
                <div style={{ fontSize: 13, color: riskColors.text, marginTop: 4, maxWidth: 750, lineHeight: 1.4 }}>
                  {riskData.summary}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => currentProject && loadRiskAnalysis(currentProject.id)}
                className="btn btn-secondary btn-sm"
                disabled={loadingRisk}
                title="Refresh AI Risk Analysis"
              >
                <RefreshCw size={13} className={loadingRisk ? 'spin' : ''} />
                Re-evaluate
              </button>
              <button onClick={onNavigateToSprintPlan} className="btn btn-primary btn-sm">
                <Sparkles size={13} /> Optimize Sprint
              </button>
            </div>
          </div>

          {/* Risk Metrics Strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14,
            marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Remaining Tasks</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>{riskData.remaining_tasks}</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Work</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>{riskData.estimated_work_hours} hrs</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Team Capacity</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>{riskData.available_capacity_hours} hrs</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Days to Deadline</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>{riskData.days_to_deadline} days</div>
            </div>
          </div>

          {/* Recommendations List */}
          {riskData.recommendations.length > 0 && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="var(--color-amber)" /> AI Recommended Actions:
              </div>
              <ul style={{ paddingLeft: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {riskData.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        {/* Progress Card */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>PROJECT PROGRESS</span>
            <TrendingUp size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{progressPct}%</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{completedCount} of {totalTasks} done</span>
          </div>
          <div style={{ marginTop: 12, height: 8, background: 'var(--bg-surface-sunken)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-cyan))',
              borderRadius: 4,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Task Breakdown Card */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE PIPELINE</span>
            <BarChart3 size={16} color="var(--color-cyan)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#cbd5e1' }}>{todoCount}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>TODO</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{inProgressCount}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>DOING</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc' }}>{inReviewCount}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>REVIEW</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{completedCount}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>DONE</div>
            </div>
          </div>
        </div>

        {/* Effort & Hours Card */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ESTIMATED WORK</span>
            <Clock size={16} color="var(--color-amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{totalEstHours}h</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{totalActualHours}h logged</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            Avg effort per task: {totalTasks > 0 ? (totalEstHours / totalTasks).toFixed(1) : 0}h
          </div>
        </div>

        {/* Milestone / Deadline Card */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>PROJECT DEADLINE</span>
            <Calendar size={16} color="var(--color-rose)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 12 }}>
            {currentProject?.deadline ? new Date(currentProject.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No set deadline'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-emerald)', marginTop: 6, fontWeight: 600 }}>
            {riskData?.days_to_deadline ? `${riskData.days_to_deadline} days remaining` : 'Schedule on track'}
          </div>
        </div>

      </div>

      {/* Active Tasks & Priority Backlog */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Priority Deliverables & Active Status</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Critical items currently in-flight across the team</p>
          </div>
          <button onClick={onNavigateToKanban} className="btn btn-outline btn-sm">
            View All in Board
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.slice(0, 5).map(task => (
            <div
              key={task.id}
              onClick={onNavigateToKanban}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-surface-sunken)',
                borderRadius: 8, border: '1px solid var(--border-subtle)',
                cursor: 'pointer', transition: 'background 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`badge badge-${task.status.toLowerCase()}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{task.title}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className={`badge badge-${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <Clock size={12} />
                  <span>{task.estimated_hours}h</span>
                </div>
                {task.assignee && (
                  <img
                    src={task.assignee.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                    alt={task.assignee.full_name}
                    title={task.assignee.full_name}
                    style={{ width: 22, height: 22, borderRadius: '50%' }}
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
