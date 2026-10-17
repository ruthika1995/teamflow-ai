import React, { useState } from 'react';
import {
  Sparkles, Search, MessageSquare, ArrowRight, BookOpen,
  FileText, CheckCircle2, AlertCircle, Send
} from 'lucide-react';
import { Project, AIChatResponse } from '../types';
import { api } from '../services/api';

interface AICopilotViewProps {
  currentProject: Project | null;
  onNavigateToKanban: () => void;
}

const QUICK_QUESTIONS = [
  "What should I work on next?",
  "What did we decide about authentication?",
  "What are the urgent tasks blocking our deadline?",
  "Who is responsible for the payment gateway?"
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0', maxWidth: 960, margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>AI Project Assistant & Search</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Ask questions across tasks, meetings, comments, and project documentation. Context-aware AI provides answers with cited sources.
        </p>
      </div>

      {/* Question Form */}
      <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Ask anything: 'What should I work on next?' or 'What did we decide about authentication?'..."
              className="input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              style={{ paddingLeft: 36, height: 42, fontSize: 13 }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn btn-primary"
            style={{ padding: '0 20px' }}
          >
            <Sparkles size={14} />
            {loading ? 'Searching...' : 'Ask AI'}
          </button>
        </form>

        {/* Quick Question Chips */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>Suggested Questions:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setQuestion(q); handleAsk(q); }}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11 }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answers Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {history.length === 0 ? (
          <div className="glass-panel" style={{
            padding: 30, borderRadius: 'var(--radius-lg)', textAlign: 'center',
            color: 'var(--text-dim)'
          }}>
            <Sparkles size={28} color="var(--color-primary)" style={{ margin: '0 auto 10px auto', opacity: 0.7 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>No queries asked yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Try asking <span style={{ color: 'var(--color-cyan)', cursor: 'pointer' }} onClick={() => handleAsk("What should I work on next?")}>"What should I work on next?"</span> to see prioritized recommendations based on deadlines and blockers!
            </div>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
              
              {/* Question */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>Q:</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.q}</span>
              </div>

              {/* Answer */}
              <div style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                background: 'var(--bg-surface-sunken)', padding: 14, borderRadius: 8,
                border: '1px solid var(--border-subtle)', marginBottom: 14
              }}>
                {item.a.answer}
              </div>

              {/* Action item recommendation if provided */}
              {item.a.recommended_action && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 6, border: '1px solid rgba(99, 102, 241, 0.25)',
                  marginBottom: 14
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c7d2fe' }}>
                    <CheckCircle2 size={13} color="var(--color-primary)" />
                    <span>Recommended Action: {item.a.recommended_action}</span>
                  </div>
                  <button onClick={onNavigateToKanban} className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}>
                    View Board
                  </button>
                </div>
              )}

              {/* Cited Sources */}
              {item.a.sources.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Referenced Project Sources ({item.a.sources.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {item.a.sources.map((src, sIdx) => (
                      <div key={sIdx} style={{
                        padding: '8px 10px', background: 'var(--bg-surface)',
                        borderRadius: 6, border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'flex-start', gap: 8
                      }}>
                        <div style={{ marginTop: 2 }}>
                          {src.type === 'MEETING' && <FileText size={13} color="var(--color-amber)" />}
                          {src.type === 'TASK' && <CheckCircle2 size={13} color="var(--color-cyan)" />}
                          {src.type === 'DOCUMENT' && <BookOpen size={13} color="var(--color-violet)" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{src.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{src.snippet}</div>
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
