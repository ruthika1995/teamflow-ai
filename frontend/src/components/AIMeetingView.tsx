import React, { useState, useEffect } from 'react';
import {
  FileText, Sparkles, CheckCircle2, CheckSquare, Clock,
  Calendar, ArrowRight, PlusCircle
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
        // Load the most recent meeting summary
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
        description: `Action item from meeting '${title}'. Assigned to: ${item.assignee_name || 'Team'}. Due: ${item.due_date || 'Sprint 1'}.`,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0', maxWidth: 960, margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #f59e0b, #f43f5e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={16} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>AI Meeting Intelligence</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Paste meeting notes or transcripts. AI extracts key decisions, commitments, and converts action items into actual Kanban tasks with 1 click.
        </p>
      </div>

      {/* Input Box */}
      <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Meeting Title</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Transcript or Raw Notes</label>
            <button
              onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 11, cursor: 'pointer' }}
            >
              Load Demo Transcript
            </button>
          </div>
          <textarea
            className="input"
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            style={{ minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button
            onClick={handleSummarize}
            disabled={loading || !transcript.trim()}
            className="btn btn-primary"
          >
            <Sparkles size={14} />
            {loading ? 'Analyzing Transcript...' : 'Summarize & Extract Action Items'}
          </button>
        </div>
      </div>

      {/* Summary Output */}
      {summaryData && (
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Executive Summary</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                {summaryData.summary}
              </p>
            </div>

            <button
              onClick={handleConvertActionItemsToTasks}
              disabled={creatingTasks || tasksCreatedSuccess || !summaryData.action_items.length}
              className="btn btn-primary"
            >
              <CheckCircle2 size={15} />
              {tasksCreatedSuccess ? 'Tasks Created!' : 'Create Tasks from Action Items'}
            </button>
          </div>

          {tasksCreatedSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 18, color: '#a7f3d0', fontSize: 12, fontWeight: 600
            }}>
              ✓ Successfully converted all action items into tasks on the Kanban board!
            </div>
          )}

          {/* Decisions */}
          {summaryData.decisions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                Key Decisions Made:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {summaryData.decisions.map((dec, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    background: 'var(--bg-surface-sunken)', borderRadius: 6, border: '1px solid var(--border-subtle)',
                    fontSize: 13, color: '#fff'
                  }}>
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 800 }}>✓</span>
                    <span>{dec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {summaryData.action_items.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                Action Items ({summaryData.action_items.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {summaryData.action_items.map((item, idx) => (
                  <div key={idx} style={{
                    padding: 12, background: 'var(--bg-surface-sunken)', borderRadius: 8,
                    border: '1px solid var(--border-subtle)', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckSquare size={16} color="var(--color-primary)" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.task_title}</div>
                        {item.assignee_name && (
                          <div style={{ fontSize: 11, color: 'var(--color-cyan)', marginTop: 2 }}>
                            Assignee: {item.assignee_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.due_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-dim)' }}>
                          <Calendar size={12} />
                          <span>{item.due_date}</span>
                        </div>
                      )}
                      <span className={`badge badge-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
