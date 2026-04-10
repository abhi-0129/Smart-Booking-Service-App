import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const { unreadCount } = useAuth();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await API.get('/admin/analytics');
      setAnalytics(res.data);
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try { const res = await API.get('/admin/users'); setUsers(res.data.users || []); } catch {}
  }, []);

  const fetchBookings = useCallback(async () => {
    try { const res = await API.get('/admin/bookings'); setBookings(res.data.bookings || []); } catch {}
  }, []);

  const fetchServices = useCallback(async () => {
    try { const res = await API.get('/admin/services'); setServices(res.data.services || []); } catch {}
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'services') fetchServices();
  }, [activeTab]);

  const toggleUser = async (userId) => {
    try {
      await API.patch(`/admin/users/${userId}/toggle`);
      showToast('User status updated.');
      fetchUsers();
    } catch { showToast('Failed to update user', 'error'); }
  };

  return (
    <div className="page">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />

      <main className="main-content">
        {toast && <div className={`alert alert-${toast.type} toast-floating`}>{toast.msg}</div>}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">Analytics Dashboard</h1>
              <p className="page-subtitle">Platform-wide overview and insights</p>
            </div>

            {/* Summary cards */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
              <div className="stat-card stat-card-accent">
                <span className="stat-icon">👥</span>
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{analytics.summary.totalUsers}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📋</span>
                <span className="stat-label">Total Bookings</span>
                <span className="stat-value">{analytics.summary.totalBookings}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💰</span>
                <span className="stat-label">Revenue Generated</span>
                <span className="stat-value" style={{ fontSize: '1.5rem' }}>
                  ₹{parseFloat(analytics.summary.totalRevenue).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⏳</span>
                <span className="stat-label">Pending Bookings</span>
                <span className="stat-value" style={{ color: 'var(--warning)' }}>{analytics.summary.pendingBookings}</span>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
              {/* Bookings by status */}
              <div className="card">
                <p className="section-heading">Bookings by Status</p>
                <div className="status-bars">
                  {analytics.bookingsByStatus.map(s => {
                    const total = analytics.summary.totalBookings || 1;
                    const pct = Math.round((s.count / total) * 100);
                    return (
                      <div key={s.status} className="status-bar-row">
                        <span className={`badge badge-${s.status}`}>{s.status}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pct}%`, background: statusColor(s.status) }} />
                        </div>
                        <span className="bar-count">{s.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Users by role */}
              <div className="card">
                <p className="section-heading">Users by Role</p>
                <div className="role-donut">
                  {analytics.usersByRole.map(r => (
                    <div key={r.role} className="role-row">
                      <span className={`badge badge-${r.role}`}>{r.role}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{
                          width: `${Math.round((r.count / analytics.summary.totalUsers) * 100)}%`,
                          background: r.role === 'customer' ? 'var(--info)' : 'var(--accent)'
                        }} />
                      </div>
                      <span className="bar-count">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top services */}
            <div className="card">
              <p className="section-heading">Top Services by Bookings</p>
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Service Name</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topServices.map((s, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-muted)', width: 40 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.booking_count}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                          ₹{parseFloat(s.revenue || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bookings per day */}
            {analytics.bookingsPerDay.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <p className="section-heading">Bookings — Last 7 Days</p>
                <MiniBarChart data={analytics.bookingsPerDay} />
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">User Management</h1>
              <p className="page-subtitle">{users.length} registered users</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-accepted' : 'badge-rejected'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleUser(u.id)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICES */}
        {activeTab === 'services' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">All Services</h1>
              <p className="page-subtitle">{services.length} services on platform</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Provider</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Bookings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {s.image && <img src={s.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.provider_name}</td>
                      <td><span className="badge badge-completed">{s.category}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-bright)' }}>₹{parseFloat(s.price).toLocaleString('en-IN')}</td>
                      <td>{s.booking_count}</td>
                      <td><span className={`badge ${s.is_active ? 'badge-accepted' : 'badge-rejected'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALL BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">All Bookings</h1>
              <p className="page-subtitle">{bookings.length} total bookings</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Provider</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ color: 'var(--text-muted)' }}>#{b.id}</td>
                      <td>{b.customer_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{b.provider_name}</td>
                      <td style={{ fontWeight: 600 }}>{b.service_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(b.booking_date).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-bright)' }}>₹{parseFloat(b.total_price).toLocaleString('en-IN')}</td>
                      <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const statusColor = (s) => ({
  pending: 'var(--warning)', accepted: 'var(--success)',
  rejected: 'var(--danger)', completed: 'var(--accent)', cancelled: 'var(--text-muted)'
}[s] || 'var(--accent)');

const MiniBarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="mini-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="mini-bar-col">
          <div className="mini-bar-fill-wrapper">
            <div className="mini-bar-fill" style={{ height: `${(d.count / max) * 100}%` }} />
          </div>
          <div className="mini-bar-label">{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
          <div className="mini-bar-value">{d.count}</div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
