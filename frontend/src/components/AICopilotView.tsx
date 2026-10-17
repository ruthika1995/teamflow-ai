import React, { useState } from 'react';
import {
  Search, FileText, CheckCircle2, BookOpen, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { Project, AIChatResponse } from '../types';
import { api } from '../services/api';

interface AICopilotViewProps {
  currentProject: Project | null;
  onNavigateToKanban: () => void;
}

const EXAMPLE_QUERIES = [
  "What should I work on next?",
  "Which tasks are blocking the release?",
  "What decisions were made during kickoff?",
  "Which deadlines are currently at risk?"
];

export const AICopilotView: React.FC<AICopilotViewProps> = ({
  currentProject,
  onNavigateToKanban
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: AIChatResponse }[]>([]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!currentProject || !q || loading) return;

    try {
      setLoading(true);
      const res = await api.askCopilot(currentProject.id, q);
      setHistory(prev => [{ q, a: res }, ...prev]);
      setQuestion('');
    } catch (e) {
      console.error("Copilot error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0', maxWidth: 960 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Project Assistant & Context Query
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Query deliverables, architectural decisions, and deadlines across project records.
        </p>
      </div>

      {/* Command Query Box */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px'
      }}>
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Ask about deliverables, decisions, blockers, or deadlines..."
              className="input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              style={{ paddingLeft: 30, height: 34, fontSize: 13 }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn btn-primary btn-sm"
            style={{ height: 34, padding: '0 14px' }}
          >
            <span>{loading ? 'Searching...' : 'Search'}</span>
            <CornerDownLeft size={12} />
          </button>
        </form>

        {/* Example Questions */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Example queries:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {EXAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setQuestion(q); handleAsk(q); }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '2px 6px', border: '1px solid var(--border-subtle)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Query Answers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {history.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: 13
          }}>
            Select an example query above or search specific project context.
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px'
            }}>
              
              {/* Query Header */}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                {item.q}
              </div>

              {/* Response Body */}
              <div style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                background: 'var(--bg-surface-sunken)', padding: 12, borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)', marginBottom: 12
              }}>
                {item.a.answer}
              </div>

              {/* Recommended Action */}
              {item.a.recommended_action && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', background: 'var(--color-accent-subtle)',
                  borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-accent-border)',
                  marginBottom: 12
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    Action: {item.a.recommended_action}
                  </span>
                  <button onClick={onNavigateToKanban} className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '2px 6px' }}>
                    View Board →
                  </button>
                </div>
              )}

              {/* Referenced Sources */}
              {item.a.sources.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                    Referenced Context ({item.a.sources.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {item.a.sources.map((src, sIdx) => (
                      <div key={sIdx} style={{
                        padding: '6px 8px', background: 'var(--bg-surface-sunken)',
                        borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'flex-start', gap: 6
                      }}>
                        <div style={{ marginTop: 2 }}>
                          {src.type === 'MEETING' && <FileText size={12} color="var(--status-high)" />}
                          {src.type === 'TASK' && <CheckCircle2 size={12} color="var(--color-accent)" />}
                          {src.type === 'DOCUMENT' && <BookOpen size={12} color="var(--text-muted)" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{src.title}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>{src.snippet}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
};
