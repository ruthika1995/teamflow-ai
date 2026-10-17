import React, { useState } from 'react';
import {
  Calendar, Users, Clock, Sparkles, Check, ArrowRight
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0', maxWidth: 1000 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Sprint Capacity & Workload Allocation
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Balances backlog deliverables across active contributors based on velocity, estimates, and blocking priority.
        </p>
      </div>

      {/* Control Banner */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Schedule Next Sprint for {currentProject?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Assigns unblocked high-priority deliverables evenly within weekly working limits.
          </div>
        </div>

        <button
          onClick={handleGenerateSprint}
          disabled={loading || !currentProject}
          className="btn btn-primary btn-sm"
        >
          <Sparkles size={13} />
          <span>{loading ? 'Synthesizing...' : 'Generate Sprint Plan'}</span>
        </button>
      </div>

      {/* Sprint Results */}
      {sprintPlan && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="tag tag-in_progress" style={{ fontSize: 10 }}>{sprintPlan.duration_days} DAYS</span>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{sprintPlan.sprint_name}</h2>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sprintPlan.rationale}</p>
            </div>

            <button
              onClick={() => setApproved(true)}
              className="btn btn-primary btn-sm"
              disabled={approved}
            >
              <Check size={13} />
              <span>{approved ? 'Sprint Approved' : 'Approve Schedule'}</span>
            </button>
          </div>

          {approved && (
            <div style={{
              background: 'var(--status-success-subtle)', border: '1px solid var(--status-success-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 12, color: '#6ee7b7' }}>
                Sprint 1 allocation approved. Deliverables are prioritized on the active board.
              </span>
              <button onClick={onNavigateToKanban} className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
                View Board →
              </button>
            </div>
          )}

          {/* Member Allocation Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {sprintPlan.assignments.map((assignee, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)', padding: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--bg-surface-raised)', border: '1px solid var(--border-medium)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: 11, color: 'var(--text-primary)'
                    }}>
                      {assignee.member_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{assignee.member_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{assignee.member_email}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {assignee.total_hours}h
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>allocated</div>
                  </div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                  Assigned Tasks ({assignee.assigned_tasks.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {assignee.assigned_tasks.map((taskTitle, tIdx) => (
                    <div key={tIdx} style={{
                      padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)' }} />
                      <span style={{ lineHeight: 1.3 }}>{taskTitle}</span>
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
