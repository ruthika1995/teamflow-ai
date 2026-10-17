import React, { useState } from 'react';
import {
  Layers, Users, Bell, CheckCheck,
  ChevronDown, UserCheck, Shield, Plus
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
    <header style={{
      background: 'var(--bg-canvas)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 16px',
      height: 48,
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1440, margin: '0 auto' }}>
        
        {/* Left: Brand + Breadcrumb Workspace */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-medium)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Layers size={13} color="var(--text-secondary)" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              TeamFlow
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 4px',
              background: 'var(--color-accent-subtle)', color: 'var(--color-accent)',
              border: '1px solid var(--color-accent-border)',
              borderRadius: 'var(--radius-xs)',
              fontFamily: 'var(--font-mono)'
            }}>
              AI
            </span>
          </div>

          <span style={{ color: 'var(--border-strong)', fontSize: 13 }}>/</span>

          {/* Workspace dropdown button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '3px 6px', fontWeight: 500, fontSize: 13 }}
            >
              <span>{currentWorkspace?.name || 'Workspace'}</span>
              <ChevronDown size={13} color="var(--text-muted)" />
            </button>

            {showWorkspaceDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 220,
                borderRadius: 'var(--radius-sm)', padding: 4, boxShadow: 'var(--shadow-overlay)',
                zIndex: 110, background: 'var(--bg-surface)', border: '1px solid var(--border-medium)'
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', padding: '4px 8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
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
                      padding: '6px 8px', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                      fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: ws.id === currentWorkspace?.id ? 'var(--bg-surface-hover)' : 'transparent',
                      color: ws.id === currentWorkspace?.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    <span>{ws.name}</span>
                    {ws.id === currentWorkspace?.id && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User's Role Badge */}
          <span className={`role-tag ${getRoleClass(userRole)}`}>
            {userRole}
          </span>

          {/* Subtle Live Connection State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 6px' }}>
            <span className={wsConnected ? 'live-dot' : ''} style={!wsConnected ? { width: 6, height: 6, borderRadius: '50%', background: 'var(--text-dim)' } : {}} />
            <span style={{ fontSize: 11, color: wsConnected ? 'var(--text-muted)' : 'var(--text-dim)', fontWeight: 500 }}>
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Right: Actions, Notifications, User Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          
          <button onClick={onCreateProjectClick} className="btn btn-secondary btn-sm">
            <Plus size={13} />
            <span>New Project</span>
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'relative', width: 28, height: 28, padding: 0 }}
              title="Notifications"
            >
              <Bell size={14} color="var(--text-secondary)" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
                  background: 'var(--color-accent)', color: '#fff',
                  fontSize: 9, fontWeight: 700, borderRadius: 'var(--radius-xs)',
                  padding: '1px 3px', lineHeight: 1
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                width: 300, borderRadius: 'var(--radius-sm)', padding: 10,
                boxShadow: 'var(--shadow-overlay)', zIndex: 110,
                background: 'var(--bg-surface)', border: '1px solid var(--border-medium)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)', fontSize: 12 }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        style={{
                          padding: '8px 10px', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                          background: n.read ? 'transparent' : 'var(--bg-surface-raised)',
                          border: `1px solid ${n.read ? 'var(--border-subtle)' : 'var(--border-medium)'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 500, fontSize: 12, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          {!n.read && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)' }} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                          {n.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 16, width: 1, background: 'var(--border-subtle)', margin: '0 2px' }} />

          {/* Quick RBAC Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px' }}
            >
              <img
                src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                alt={currentUser?.full_name}
                style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                {currentUser?.full_name?.split(' ')[0]}
              </span>
              <ChevronDown size={12} color="var(--text-dim)" />
            </button>

            {showUserDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                width: 240, borderRadius: 'var(--radius-sm)', padding: 6,
                boxShadow: 'var(--shadow-overlay)', zIndex: 110,
                background: 'var(--bg-surface)', border: '1px solid var(--border-medium)'
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', padding: '4px 6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Switch Test Persona (RBAC)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
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
                          padding: '6px 8px', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: isCurrent ? 'var(--bg-surface-hover)' : 'transparent',
                          border: `1px solid ${isCurrent ? 'var(--border-medium)' : 'transparent'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img
                            src={user.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                            alt={user.full_name}
                            style={{ width: 20, height: 20, borderRadius: '50%' }}
                          />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {user.full_name}
                            </div>
                          </div>
                        </div>
                        <span className={`role-tag ${getRoleClass(memberRole)}`} style={{ fontSize: 9 }}>
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
