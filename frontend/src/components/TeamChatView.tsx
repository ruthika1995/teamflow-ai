import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Users, Sparkles, Hash, Circle
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

  // When a new message arrives over WebSocket, append to stream if not already present
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
    }, 50);
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
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)',
      minHeight: 550, maxWidth: 960, margin: '20px auto 0 auto',
      background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)', overflow: 'hidden'
    }}>
      
      {/* Chat Room Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface-sunken)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: 'rgba(99, 102, 241, 0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Hash size={16} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              # general • {currentWorkspace?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Real-time collaboration and team discussions
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: wsConnected ? 'var(--color-emerald)' : 'var(--text-dim)' }}>
          <span className={wsConnected ? 'live-indicator' : ''} style={!wsConnected ? { width: 8, height: 8, borderRadius: '50%', background: '#64748b' } : {}} />
          <span style={{ fontWeight: 600 }}>{wsConnected ? 'Connected via WebSocket' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', margin: 'auto', fontSize: 13 }}>
            No messages yet. Send a message to start real-time chat with the team!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex', gap: 10,
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  flexDirection: isMe ? 'row-reverse' : 'row'
                }}
              >
                <img
                  src={msg.user?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt={msg.user?.full_name}
                  style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}
                />

                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
                    justifyContent: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                      {isMe ? 'You' : msg.user?.full_name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={isMe ? 'chat-bubble-user' : 'chat-bubble-peer'} style={{
                    padding: '10px 14px', fontSize: 13, color: '#fff', lineHeight: 1.4
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Input Box */}
      <form onSubmit={handleSend} style={{
        padding: 14, borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface-sunken)', display: 'flex', gap: 10
      }}>
        <input
          type="text"
          className="input"
          placeholder="Message teammates in real-time... (Press Enter to send)"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={!currentWorkspace}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending || !inputText.trim()}
          style={{ padding: '0 16px' }}
        >
          <Send size={15} />
        </button>
      </form>

    </div>
  );
};
