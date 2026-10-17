import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, Clock, Shield, ArrowRight,
  ListTodo, Layers, RefreshCw, Send
} from 'lucide-react';
import { Project, AIProjectPlanResponse, AIPlanTask } from '../types';
import { api } from '../services/api';

interface AIPlannerViewProps {
  currentProject: Project | null;
  onTasksCreated: () => void;
  onNavigateToKanban: () => void;
}

const PRESETS = [
  "We need to build an e-commerce website with React and FastAPI, including Stripe checkout and inventory management.",
  "Build a cross-platform mobile app for real-time logistics tracking and driver notifications.",
  "Develop an AI Customer Support Agent with human-in-the-loop escalation and RAG over Zendesk tickets.",
  "Implement a multi-tenant SaaS team collaboration workspace with real-time WebSockets and RBAC."
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
      setSuccessMessage(`Successfully created ${allTasks.length} tasks in ${currentProject.name}!`);
      onTasksCreated();
    } catch (err) {
      console.error("Failed to bulk create tasks", err);
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
            background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>AI Project Planner</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Describe your project requirements or goals. OpenRouter AI will architect a 4-phase milestone execution plan and generate actual tasks.
        </p>
      </div>

      {/* Prompt Form */}
      <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>
          Project Scope & Technical Requirements
        </div>
        <textarea
          className="input"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. We need to build an e-commerce website with React and FastAPI..."
          style={{ minHeight: 90, fontSize: 14 }}
        />

        {/* Preset quick buttons */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>Try a preset:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11, textAlign: 'left' }}
              >
                {p.slice(0, 48)}...
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleGeneratePlan}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary"
          >
            <Sparkles size={14} />
            {loading ? 'Synthesizing Architecture...' : 'Generate Project Plan'}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a7f3d0', fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{successMessage}</span>
          </div>
          <button onClick={onNavigateToKanban} className="btn btn-primary btn-sm">
            View in Kanban Board →
          </button>
        </div>
      )}

      {/* Plan Preview */}
      {plan && (
        <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{plan.plan_title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{plan.summary}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Effort</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-cyan)' }}>{plan.total_estimated_hours} hrs</div>
              </div>

              <button
                onClick={handleCreateTasks}
                disabled={creatingTasks}
                className="btn btn-primary"
                style={{ padding: '8px 18px' }}
              >
                <CheckCircle2 size={15} />
                {creatingTasks ? 'Creating Tasks...' : 'Create Tasks in Board'}
              </button>
            </div>
          </div>

          {/* Milestones and Tasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {plan.milestones.map((m, mIdx) => (
              <div key={mIdx} style={{
                background: 'var(--bg-surface-sunken)', borderRadius: 10,
                border: '1px solid var(--border-subtle)', padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Layers size={16} color="var(--color-primary)" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.milestone_name}</h3>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                    {m.tasks.length} tasks
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                  {m.tasks.map((task, tIdx) => (
                    <div key={tIdx} style={{
                      padding: 12, background: 'var(--bg-surface)', borderRadius: 8,
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-dim)' }}>
                          <Clock size={11} />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {task.description}
                      </div>
                      {task.suggested_role && (
                        <div style={{ fontSize: 10, color: 'var(--color-cyan)', marginTop: 8, fontWeight: 600 }}>
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
