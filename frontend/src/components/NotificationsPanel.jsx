import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import './NotificationsPanel.css';

const NotificationsPanel = () => {
  const { notifications, setNotifications, setUnreadCount } = useAuth();

  useEffect(() => {
    API.get('/notifications').then(res => {
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread || 0);
    }).catch(() => {});
  }, []);

  const markAllRead = async () => {
    await API.patch('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const typeIcons = {
    new_booking: '📅',
    booking_accepted: '✅',
    booking_rejected: '❌',
    booking_completed: '🎉',
    booking_cancelled: '🚫',
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <h2 className="page-title">Notifications</h2>
        {notifications.some(n => !n.is_read) && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n, i) => (
            <div key={n.id || i} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
              <div className="notif-icon">{typeIcons[n.type] || '🔔'}</div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">{formatTime(n.created_at)}</div>
              </div>
              {!n.is_read && <div className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
