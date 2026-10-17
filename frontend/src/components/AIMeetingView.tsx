import React, { useState, useEffect } from 'react';
import {
  FileText, Sparkles, CheckCircle2, CheckSquare, Calendar, Plus, Check
} from 'lucide-react';
import { Project, Meeting, AIActionItem, AIMeetingSummaryResponse } from '../types';
import { api } from '../services/api';

interface AIMeetingViewProps {
  currentProject: Project | null;
  onTasksCreated: () => void;
}

const SAMPLE_TRANSCRIPT = `Ruthi: Welcome everyone. Today we finalize the architecture for TeamFlow AI. We need full-stack collaboration, Kanban task tracking, and AI assistance.
Rahul: For backend, FastAPI with SQLAlchemy gives us great async performance. Let's use SQLite for zero-config local development and support Supabase/Postgres with pgvector.
Shaaz: Agreed. We should use native WebSockets for instant task updates so when someone moves a card, everyone sees it.
Priya: What about AI? We should use OpenRouter API for project planning, risk analysis, and meeting summarization.
Ruthi: Perfect. Let's make sure the AI acts as an assistant with human-in-the-loop approvals before creating tasks.
Deadlines:
Nov 5 -> Design authentication and Kanban board UI
Nov 8 -> Implement JWT authentication and RBAC endpoints
Nov 4 -> Set up database schema and seed data
Nov 10 -> Configure OpenRouter integration and WebSocket broadcast manager`;

export const AIMeetingView: React.FC<AIMeetingViewProps> = ({
  currentProject,
  onTasksCreated
}) => {
  const [title, setTitle] = useState('Sprint 1 Architecture & Tech Stack Kickoff');
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<AIMeetingSummaryResponse | null>(null);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [tasksCreatedSuccess, setTasksCreatedSuccess] = useState(false);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    if (currentProject) {
      loadPastMeetings(currentProject.id);
    }
  }, [currentProject?.id]);

  const loadPastMeetings = async (projectId: string) => {
    try {
      const res = await api.getMeetings(projectId);
      setPastMeetings(res);
      if (res.length > 0 && !summaryData) {
        const m = res[0];
        try {
          const decisions = m.decisions ? JSON.parse(m.decisions) : [];
          const actionItems = m.action_items ? JSON.parse(m.action_items) : [];
          setSummaryData({
            summary: m.summary || '',
            decisions,
            action_items: actionItems
          });
        } catch {}
      }
    } catch (e) {
      console.warn("Could not load meetings", e);
    }
  };

  const handleSummarize = async () => {
    if (!currentProject || !transcript.trim()) return;

    try {
      setLoading(true);
      setTasksCreatedSuccess(false);
      const meeting = await api.createMeeting(currentProject.id, title, transcript);
      const decisions = meeting.decisions ? JSON.parse(meeting.decisions) : [];
      const actionItems = meeting.action_items ? JSON.parse(meeting.action_items) : [];
      setSummaryData({
        summary: meeting.summary || '',
        decisions,
        action_items: actionItems
      });
      loadPastMeetings(currentProject.id);
    } catch (e) {
      console.error("Meeting summarization error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertActionItemsToTasks = async () => {
    if (!currentProject || !summaryData?.action_items) return;

    try {
      setCreatingTasks(true);
      const tasksToCreate = summaryData.action_items.map(item => ({
        title: item.task_title,
        description: `Action item from '${title}'. Assigned to: ${item.assignee_name || 'Team'}. Target due date: ${item.due_date || 'Sprint 1'}.`,
        priority: item.priority || 'MEDIUM',
        estimated_hours: 4.0,
        suggested_role: item.assignee_name || 'Engineering'
      }));

      await api.bulkCreateTasks(currentProject.id, tasksToCreate);
      setTasksCreatedSuccess(true);
      onTasksCreated();
    } catch (e) {
      console.error("Failed to create tasks from action items", e);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0', maxWidth: 1040 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Meeting Notes & Action Items
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Document discussions and transcripts. Synthesize key architectural decisions and convert action items into tracked tasks.
        </p>
      </div>

      {/* Editorial 2-Pane Work Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
        
        {/* Left Pane: Transcript Input */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Meeting Title
            </label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ marginTop: 4, height: 30, fontSize: 12 }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Transcript / Raw Minutes
              </label>
              <button
                onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '1px 4px' }}
              >
                Insert Sample
              </button>
            </div>
            <textarea
              className="input"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              style={{ minHeight: 240, flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSummarize}
              disabled={loading || !transcript.trim()}
              className="btn btn-primary btn-sm"
            >
              <Sparkles size={13} />
              <span>{loading ? 'Synthesizing...' : 'Summarize Notes'}</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Summary Document Output */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {summaryData ? (
            <>
              {/* Executive Summary */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Executive Summary
                  </div>

                  <button
                    onClick={handleConvertActionItemsToTasks}
                    disabled={creatingTasks || tasksCreatedSuccess || !summaryData.action_items.length}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                  >
                    <Check size={12} />
                    <span>{tasksCreatedSuccess ? 'Tasks Converted' : 'Create Tasks'}</span>
                  </button>
                </div>

                <div style={{
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                  background: 'var(--bg-surface-sunken)', padding: 10, borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {summaryData.summary}
                </div>
              </div>

              {tasksCreatedSuccess && (
                <div style={{
                  background: 'var(--status-success-subtle)', border: '1px solid var(--status-success-border)',
                  borderRadius: 'var(--radius-xs)', padding: '6px 10px', color: '#6ee7b7', fontSize: 11
                }}>
                  ✓ Action items converted to active Kanban tasks
                </div>
              )}

              {/* Key Decisions */}
              {summaryData.decisions.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                    Decisions ({summaryData.decisions.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {summaryData.decisions.map((dec, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 8px',
                        background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)',
                        fontSize: 12, color: 'var(--text-primary)'
                      }}>
                        <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓</span>
                        <span style={{ lineHeight: 1.4 }}>{dec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items Table */}
              {summaryData.action_items.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                    Action Items ({summaryData.action_items.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {summaryData.action_items.map((item, idx) => (
                      <div key={idx} style={{
                        padding: '6px 8px', background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{item.task_title}</div>
                          {item.assignee_name && (
                            <div style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>
                              @{item.assignee_name}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.due_date && (
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              {item.due_date}
                            </span>
                          )}
                          <span className={`tag ${getPriorityTagClass(item.priority)}`} style={{ fontSize: 9 }}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-dim)', fontSize: 12 }}>
              Paste transcript and click Summarize Notes
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
