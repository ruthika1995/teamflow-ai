import React, { useState } from 'react';
import {
  Layers, Users, Bell, Activity, Sparkles, CheckCheck,
  ChevronDown, UserCheck, Shield
} from 'lucide-react';
import { User, Workspace, WorkspaceMember, NotificationItem } from '../types';

interface NavbarProps {
  currentUser: User | null;
  demoUsers: User[];
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  notifications: NotificationItem[];
  wsConnected: boolean;
  onSwitchUser: (userId: string) => void;
  onSelectWorkspace: (workspace: Workspace) => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onCreateProjectClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  demoUsers,
  currentWorkspace,
  workspaces,
  members,
  notifications,
  wsConnected,
  onSwitchUser,
  onSelectWorkspace,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onCreateProjectClick
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Determine current user's role in this workspace
  const currentMember = members.find(m => m.user_id === currentUser?.id);
  const userRole = currentMember?.role || 'MEMBER';

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'OWNER': return 'role-owner';
      case 'ADMIN': return 'role-admin';
      case 'MEMBER': return 'role-member';
      default: return 'role-viewer';
    }
  };

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-subtle)', padding: '10px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1440, margin: '0 auto' }}>
        
        {/* Left: Brand + Workspace Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
            }}>
              <Layers size={18} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: '#fff' }}>TeamFlow</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: 4 }}>AI</span>
              </div>
            </div>
          </div>

          <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />

          {/* Workspace dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Users size={14} color="var(--text-muted)" />
              <span style={{ fontWeight: 600 }}>{currentWorkspace?.name || 'Workspace'}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {showWorkspaceDropdown && (
              <div className="glass-panel" style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 6, width: 220,
                borderRadius: 8, padding: 6, boxShadow: 'var(--shadow-lg)', zIndex: 110,
                background: 'var(--bg-surface)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Workspaces
                </div>
                {workspaces.map(ws => (
                  <div
                    key={ws.id}
                    onClick={() => {
                      onSelectWorkspace(ws);
                      setShowWorkspaceDropdown(false);
                    }}
                    style={{
                      padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                      fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: ws.id === currentWorkspace?.id ? 'var(--bg-surface-highlight)' : 'transparent'
                    }}
                  >
                    <span>{ws.name}</span>
                    {ws.id === currentWorkspace?.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User's Role Badge */}
          <div className={`role-badge ${getRoleClass(userRole)}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Shield size={11} />
            <span>{userRole}</span>
          </div>

          {/* WebSocket Status Indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(16, 185, 129, 0.08)', padding: '3px 8px', borderRadius: 20,
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <span className={wsConnected ? 'live-indicator' : ''} style={!wsConnected ? { width: 8, height: 8, borderRadius: '50%', background: '#64748b' } : {}} />
            <span style={{ fontSize: 11, fontWeight: 600, color: wsConnected ? '#34d399' : '#94a3b8' }}>
              {wsConnected ? 'LIVE SYNC' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Right: Actions, Notifications, User Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          
          <button onClick={onCreateProjectClick} className="btn btn-outline btn-sm">
            + New Project
          </button>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-outline btn-sm"
              style={{ position: 'relative', width: 34, height: 34, padding: 0 }}
              title="Notifications"
            >
              <Bell size={16} color="var(--text-secondary)" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  background: 'var(--color-rose)', color: '#fff',
                  fontSize: 10, fontWeight: 700, borderRadius: '50%',
                  width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="glass-panel" style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 320, borderRadius: 12, padding: 12, boxShadow: 'var(--shadow-lg)',
                zIndex: 110, background: 'var(--bg-surface)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dim)', fontSize: 12 }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        style={{
                          padding: 10, borderRadius: 8, cursor: 'pointer',
                          background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                          border: `1px solid ${n.read ? 'var(--border-subtle)' : 'rgba(99, 102, 241, 0.25)'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, fontSize: 12, color: n.read ? 'var(--text-secondary)' : '#fff' }}>
                            {n.title}
                          </span>
                          {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          {n.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />

          {/* Quick RBAC Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px' }}
            >
              <img
                src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                alt={currentUser?.full_name}
                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{currentUser?.full_name?.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Switch role</div>
              </div>
              <ChevronDown size={13} color="var(--text-dim)" />
            </button>

            {showUserDropdown && (
              <div className="glass-panel" style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 260, borderRadius: 12, padding: 10, boxShadow: 'var(--shadow-lg)',
                zIndex: 110, background: 'var(--bg-surface)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', padding: '4px 8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserCheck size={13} /> Demo Identity Switcher
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 8px 8px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  Test RBAC roles instantly without logging out:
                </div>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {demoUsers.map(user => {
                    const memberRole = members.find(m => m.user_id === user.id)?.role || 'MEMBER';
                    const isCurrent = user.id === currentUser?.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user.id);
                          setShowUserDropdown(false);
                        }}
                        style={{
                          padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: isCurrent ? 'var(--bg-surface-highlight)' : 'transparent',
                          border: `1px solid ${isCurrent ? 'var(--border-medium)' : 'transparent'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img
                            src={user.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                            alt={user.full_name}
                            style={{ width: 26, height: 26, borderRadius: '50%' }}
                          />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? '#fff' : 'var(--text-secondary)' }}>
                              {user.full_name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{user.email}</div>
                          </div>
                        </div>
                        <span className={`role-badge ${getRoleClass(memberRole)}`} style={{ fontSize: 9 }}>
                          {memberRole}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
