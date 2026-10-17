import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Hash
} from 'lucide-react';
import { Workspace, Project, User, ChatMessage } from '../types';
import { api } from '../services/api';

interface TeamChatViewProps {
  currentWorkspace: Workspace | null;
  currentProject: Project | null;
  currentUser: User | null;
  wsConnected: boolean;
  incomingMessage: ChatMessage | null;
}

export const TeamChatView: React.FC<TeamChatViewProps> = ({
  currentWorkspace,
  currentProject,
  currentUser,
  wsConnected,
  incomingMessage
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadMessages(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, currentProject?.id]);

  useEffect(() => {
    if (incomingMessage) {
      setMessages(prev => {
        if (prev.some(m => m.id === incomingMessage.id)) return prev;
        return [...prev, incomingMessage];
      });
      scrollToBottom();
    }
  }, [incomingMessage]);

  const loadMessages = async (workspaceId: string) => {
    try {
      const res = await api.getChatMessages(workspaceId, currentProject?.id);
      setMessages(res);
      scrollToBottom();
    } catch (e) {
      console.warn("Could not load messages", e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !inputText.trim() || sending) return;

    try {
      setSending(true);
      const text = inputText.trim();
      setInputText('');
      const sent = await api.sendChatMessage(currentWorkspace.id, text, currentProject?.id);
      setMessages(prev => [...prev, sent]);
      scrollToBottom();
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)',
      minHeight: 520, maxWidth: 960, margin: '16px auto 0 auto',
      background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)', overflow: 'hidden'
    }}>
      
      {/* Quiet Header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-canvas)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Hash size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            general
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            — {currentWorkspace?.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
          <span className={wsConnected ? 'live-dot' : ''} style={!wsConnected ? { width: 6, height: 6, borderRadius: '50%', background: 'var(--text-dim)' } : {}} />
          <span>{wsConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Clean Linear Message Stream (No bubbly rounded bubbles) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', margin: 'auto', fontSize: 12 }}>
            No messages in #general yet.
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === currentUser?.id;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const isSameSender = prevMsg && prevMsg.user_id === msg.user_id;

            return (
              <div
                key={msg.id}
                className="chat-row"
                style={{
                  paddingTop: isSameSender ? 2 : 8,
                  paddingBottom: 2
                }}
              >
                {!isSameSender ? (
                  <img
                    src={msg.user?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                    alt={msg.user?.full_name}
                    style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
                  />
                ) : (
                  <div style={{ width: 26, flexShrink: 0 }} />
                )}

                <div style={{ flex: 1 }}>
                  {!isSameSender && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isMe ? 'var(--color-accent)' : 'var(--text-primary)' }}>
                        {isMe ? 'You' : msg.user?.full_name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} style={{
        padding: '10px 14px', borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-canvas)', display: 'flex', gap: 8
      }}>
        <input
          type="text"
          className="input"
          placeholder="Message #general... (Press Enter to send)"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={!currentWorkspace}
          style={{ height: 32, fontSize: 12 }}
        />
        <button
          type="submit"
          className="btn btn-secondary btn-sm"
          disabled={sending || !inputText.trim()}
          style={{ height: 32, padding: '0 12px' }}
        >
          <Send size={12} />
        </button>
      </form>

    </div>
  );
};
