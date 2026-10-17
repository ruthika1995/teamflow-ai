import React, { useState } from 'react';
import {
  Calendar, Users, Clock, Sparkles, CheckCircle2,
  Check, ArrowRight, Shield
} from 'lucide-react';
import { Project, AISprintPlanResponse } from '../types';
import { api } from '../services/api';

interface AISprintPlannerViewProps {
  currentProject: Project | null;
  onNavigateToKanban: () => void;
}

export const AISprintPlannerView: React.FC<AISprintPlannerViewProps> = ({
  currentProject,
  onNavigateToKanban
}) => {
  const [sprintPlan, setSprintPlan] = useState<AISprintPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleGenerateSprint = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      setApproved(false);
      const res = await api.generateSprintPlan(currentProject.id);
      setSprintPlan(res);
    } catch (e) {
      console.error("Sprint plan generation failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0', maxWidth: 960, margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #10b981, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Calendar size={16} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>AI Sprint Planner</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          The AI examines active backlog tasks, estimated hours, deadlines, and member capacities to propose an optimized 2-week Sprint allocation.
        </p>
      </div>

      {/* Generator Callout */}
      <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
            Ready to plan Sprint for {currentProject?.name}?
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Prioritizes urgent and high-priority blocking items evenly across team velocity.
          </div>
        </div>

        <button
          onClick={handleGenerateSprint}
          disabled={loading || !currentProject}
          className="btn btn-primary"
        >
          <Sparkles size={14} />
          {loading ? 'Synthesizing Sprint...' : 'Generate Sprint Plan'}
        </button>
      </div>

      {/* Sprint Results */}
      {sprintPlan && (
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-in_progress">{sprintPlan.duration_days} DAYS</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{sprintPlan.sprint_name}</h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{sprintPlan.rationale}</p>
            </div>

            <button
              onClick={() => setApproved(true)}
              className="btn btn-primary"
              disabled={approved}
            >
              <CheckCircle2 size={15} />
              {approved ? 'Sprint Approved!' : 'Approve Sprint Plan'}
            </button>
          </div>

          {approved && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex',
              alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 13, color: '#a7f3d0', fontWeight: 600 }}>
                Sprint 1 allocation approved by team lead. Tasks scheduled for upcoming cycle!
              </span>
              <button onClick={onNavigateToKanban} className="btn btn-secondary btn-sm">
                Go to Kanban Board →
              </button>
            </div>
          )}

          {/* Member Allocation Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {sprintPlan.assignments.map((assignee, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-surface-sunken)', borderRadius: 10,
                border: '1px solid var(--border-subtle)', padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-violet))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12, color: '#fff'
                    }}>
                      {assignee.member_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{assignee.member_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{assignee.member_email}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-cyan)' }}>{assignee.total_hours}h</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>allocated</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Assigned Deliverables ({assignee.assigned_tasks.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {assignee.assigned_tasks.map((taskTitle, tIdx) => (
                    <div key={tIdx} style={{
                      padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 6,
                      border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)' }} />
                      <span>{taskTitle}</span>
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
