import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ServiceCard from '../components/ServiceCard';
import NotificationsPanel from '../components/NotificationsPanel';
import Chatbot from '../components/Chatbot';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProviderDashboard.css';

const CATEGORIES = ['General', 'Cleaning', 'Plumbing', 'Electrical', 'Beauty', 'Fitness', 'Tutoring'];

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'General', duration_minutes: '60' });
  const [image, setImage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [editService, setEditService] = useState(null);
  const { user, unreadCount, socket } = useAuth();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchServices = useCallback(async () => {
    try {
      const res = await API.get('/services', { params: { provider_id: user?.user?.id } });
      setServices(res.data.services || []);
    } catch {}
  }, [user]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await API.get('/bookings');
      setBookings(res.data.bookings || []);
    } catch {}
  }, []);

  useEffect(() => { fetchServices(); fetchBookings(); }, [fetchServices, fetchBookings]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchBookings();
    socket.on('booking_updated', handler);
    socket.on('notification', handler);
    return () => { socket.off('booking_updated', handler); socket.off('notification', handler); };
  }, [socket, fetchBookings]);

  const handleAddService = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);

      if (editService) {
        await API.put(`/services/${editService.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Service updated successfully!');
        setEditService(null);
      } else {
        await API.post('/services', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Service added successfully!');
      }
      setForm({ name: '', description: '', price: '', category: 'General', duration_minutes: '60' });
      setImage(null);
      fetchServices();
      setActiveTab('services');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save service', 'error');
    } finally { setFormLoading(false); }
  };

  const startEdit = (service) => {
    setEditService(service);
    setForm({
      name: service.name,
      description: service.description || '',
      price: service.price,
      category: service.category || 'General',
      duration_minutes: service.duration_minutes || '60',
    });
    setActiveTab('add-service');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await API.delete(`/services/${id}`);
      showToast('Service deleted.');
      fetchServices();
    } catch { showToast('Failed to delete service', 'error'); }
  };

  const handleStatus = async (bookingId, status) => {
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status });
      showToast(`Booking ${status}!`);
      fetchBookings();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const stats = {
    services: services.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    revenue: bookings.filter(b => b.status === 'completed').reduce((s, b) => s + parseFloat(b.total_price || 0), 0),
  };

  return (
    <div className="page">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />

      <main className="main-content">
        {toast && <div className={`alert alert-${toast.type} toast-floating`}>{toast.msg}</div>}

        {/* HOME */}
        {activeTab === 'home' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">Provider Dashboard</h1>
              <p className="page-subtitle">Manage your services and bookings, {user?.user?.name?.split(' ')[0]}.</p>
            </div>
            <div className="grid-4" style={{ marginBottom: 32 }}>
              <div className="stat-card">
                <span className="stat-icon">🛠️</span>
                <span className="stat-label">Active Services</span>
                <span className="stat-value">{stats.services}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⏳</span>
                <span className="stat-label">Pending Requests</span>
                <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">✅</span>
                <span className="stat-label">Active Bookings</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.accepted}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💰</span>
                <span className="stat-label">Revenue Earned</span>
                <span className="stat-value" style={{ color: 'var(--accent)' }}>₹{stats.revenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {stats.pending > 0 && (
              <div className="alert alert-info" style={{ marginBottom: 24 }}>
                📬 You have <strong>{stats.pending}</strong> pending booking {stats.pending === 1 ? 'request' : 'requests'}. <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('bookings')}>Review →</button>
              </div>
            )}

            <p className="section-heading">Recent booking requests</p>
            <ProviderBookingsList bookings={bookings.slice(0, 5)} onStatus={handleStatus} />
          </div>
        )}

        {/* ADD / EDIT SERVICE */}
        {activeTab === 'add-service' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">{editService ? 'Edit Service' : 'Add New Service'}</h1>
              <p className="page-subtitle">Fill in the details to {editService ? 'update your' : 'list a new'} service.</p>
            </div>
            <div className="service-form-card card" style={{ maxWidth: 600 }}>
              <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Service Name *</label>
                  <input className="form-input" placeholder="e.g. Home Deep Cleaning" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} placeholder="What's included in your service?"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input type="number" className="form-input" placeholder="500" min="0" value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <input type="number" className="form-input" placeholder="60" min="15" value={form.duration_minutes}
                      onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Service Photo</label>
                  <div className="image-upload-area" onClick={() => document.getElementById('svc-img').click()}>
                    {image ? (
                      <img src={URL.createObjectURL(image)} alt="preview" className="image-preview" />
                    ) : editService?.image ? (
                      <img src={editService.image} alt="current" className="image-preview" />
                    ) : (
                      <div className="image-upload-placeholder">
                        <span style={{ fontSize: '2rem' }}>📷</span>
                        <span>Click to upload photo</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>JPG, PNG, WEBP • max 5MB</span>
                      </div>
                    )}
                  </div>
                  <input id="svc-img" type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => setImage(e.target.files[0])} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {editService && (
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditService(null); setActiveTab('services'); }}>
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? <><span className="spinner" /> Saving...</> : (editService ? '💾 Update Service' : '➕ Add Service')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MY SERVICES */}
        {activeTab === 'services' && (
          <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="page-title">My Services</h1>
                <p className="page-subtitle">{services.length} services listed</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setEditService(null); setActiveTab('add-service'); }}>
                + Add Service
              </button>
            </div>
            {services.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛠️</div>
                <h3>No services yet</h3>
                <p>Add your first service to start accepting bookings</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveTab('add-service')}>Add Service</button>
              </div>
            ) : (
              <div className="services-grid-provider">
                {services.map(s => (
                  <div key={s.id} className="provider-service-wrapper">
                    <ServiceCard service={s} showBookButton={false} />
                    <div className="provider-service-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">Booking Requests</h1>
              <p className="page-subtitle">{bookings.length} total bookings</p>
            </div>
            <ProviderBookingsList bookings={bookings} onStatus={handleStatus} />
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="fade-in"><NotificationsPanel /></div>
        )}
      </main>
      <Chatbot />
    </div>
  );
};

const ProviderBookingsList = ({ bookings, onStatus }) => {
  if (!bookings.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📋</div>
      <h3>No bookings yet</h3>
      <p>Booking requests will appear here</p>
    </div>
  );

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Service</th>
            <th>Date & Time</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.customer_email}</div>
                {b.customer_phone && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.customer_phone}</div>}
              </td>
              <td>{b.service_name}</td>
              <td>
                <div>{new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{b.booking_time?.slice(0, 5)}</div>
              </td>
              <td style={{ fontWeight: 700, color: 'var(--accent-bright)' }}>₹{parseFloat(b.total_price).toLocaleString('en-IN')}</td>
              <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
              <td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {b.status === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => onStatus(b.id, 'accepted')}>Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => onStatus(b.id, 'rejected')}>Reject</button>
                    </>
                  )}
                  {b.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onStatus(b.id, 'completed')}>Mark Done</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProviderDashboard;
