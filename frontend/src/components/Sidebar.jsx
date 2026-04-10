import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = {
  customer: [
    { icon: '🏠', label: 'Dashboard', tab: 'home' },
    { icon: '🔍', label: 'Browse Services', tab: 'browse' },
    { icon: '📅', label: 'My Bookings', tab: 'bookings' },
    { icon: '🔔', label: 'Notifications', tab: 'notifications' },
  ],
  provider: [
    { icon: '🏠', label: 'Dashboard', tab: 'home' },
    { icon: '➕', label: 'Add Service', tab: 'add-service' },
    { icon: '🛠️', label: 'My Services', tab: 'services' },
    { icon: '📋', label: 'Bookings', tab: 'bookings' },
    { icon: '🔔', label: 'Notifications', tab: 'notifications' },
  ],
  admin: [
    { icon: '📊', label: 'Analytics', tab: 'analytics' },
    { icon: '👥', label: 'Users', tab: 'users' },
    { icon: '🛠️', label: 'Services', tab: 'services' },
    { icon: '📋', label: 'All Bookings', tab: 'bookings' },
  ],
};

const Sidebar = ({ activeTab, setActiveTab, unreadCount }) => {
  const { user, logout } = useAuth();
  const role = user?.user?.role;
  const items = navItems[role] || [];
  const name = user?.user?.name || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">SB</div>
        <div>
          <div className="sidebar-brand-name">SmartBook</div>
          <div className="sidebar-brand-role">{role}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.tab}
            className={`sidebar-item ${activeTab === item.tab ? 'active' : ''}`}
            onClick={() => setActiveTab(item.tab)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
            {item.tab === 'notifications' && unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{name}</div>
            <div className="sidebar-user-email">{user?.user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm sidebar-logout" onClick={logout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
