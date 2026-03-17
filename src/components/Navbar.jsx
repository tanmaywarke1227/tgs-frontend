import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread || 0);
    } catch (_) {}
  };

  const markRead = async () => {
    if (unread > 0) {
      try {
        await api.post('/api/notifications/mark-read');
        setUnread(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (_) {}
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const roleColors = {
    student: '#3b82f6',
    faculty: '#8b5cf6',
    admin: '#f59e0b'
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">TGS</div>
        <div>
          <span className="navbar-title">Term Grant Slip</span>
          <span className="navbar-subtitle">Digitalization System</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Notifications — student only */}
        {user?.role === 'student' && (
          <div className="notif-wrapper">
            <button
              className="notif-btn"
              onClick={() => { setShowNotifs(!showNotifs); markRead(); }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </button>

            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span>Notifications</span>
                  <button onClick={() => setShowNotifs(false)}>✕</button>
                </div>
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.notifId} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                      <div className={`notif-dot ${n.type}`} />
                      <div>
                        <p className="notif-msg">{n.message}</p>
                        <p className="notif-time">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* User info */}
        <div className="user-pill">
          <div className="user-avatar" style={{ background: roleColors[user?.role] }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role?.toUpperCase()}</span>
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}
