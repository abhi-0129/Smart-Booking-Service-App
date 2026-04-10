import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ServiceCard from '../components/ServiceCard';
import BookingModal from '../components/BookingModal';
import NotificationsPanel from '../components/NotificationsPanel';
import Chatbot from '../components/Chatbot';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CustomerDashboard.css';

const CATEGORIES = ['All', 'Cleaning', 'Plumbing', 'Electrical', 'Beauty', 'Fitness', 'Tutoring', 'General'];

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedService, setSelectedService] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const { user, unreadCount, socket } = useAuth();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const res = await API.get('/services', { params });
      setServices(res.data.services || []);
    } catch { showToast('Failed to load services', 'error'); }
    finally { setServicesLoading(false); }
  }, [search, category]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await API.get('/bookings');
      setBookings(res.data.bookings || []);
    } catch {}
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => { if (activeTab === 'bookings') fetchBookings(); }, [activeTab, fetchBookings]);

  // Real-time booking update via socket
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchBookings();
    socket.on('booking_updated', handler);
    return () => socket.off('booking_updated', handler);
  }, [socket, fetchBookings]);

  const handleBook = async (data) => {
    setBookingLoading(true);
    try {
      await API.post('/bookings', data);
      setSelectedService(null);
      showToast('Booking confirmed! Provider will be notified. ✅');
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking failed', 'error');
    } finally { setBookingLoading(false); }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      showToast('Booking cancelled.');
      fetchBookings();
    } catch { showToast('Failed to cancel booking', 'error'); }
  };

  const handleReview = async (bookingId, rating, comment) => {
    try {
      await API.post(`/bookings/${bookingId}/review`, { rating, comment });
      showToast('Review submitted! Thank you ⭐');
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Review failed', 'error');
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="page">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />

      <main className="main-content">
        {toast && (
          <div className={`alert alert-${toast.type} toast-floating`}>{toast.msg}</div>
        )}

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">Good to see you, {user?.user?.name?.split(' ')[0]} 👋</h1>
              <p className="page-subtitle">Browse services and manage your bookings below.</p>
            </div>

            <div className="grid-4" style={{ marginBottom: 32 }}>
              <div className="stat-card">
                <span className="stat-icon">📋</span>
                <span className="stat-label">Total Bookings</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⏳</span>
                <span className="stat-label">Pending</span>
                <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">✅</span>
                <span className="stat-label">Accepted</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.accepted}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎉</span>
                <span className="stat-label">Completed</span>
                <span className="stat-value" style={{ color: 'var(--accent)' }}>{stats.completed}</span>
              </div>
            </div>

            <p className="section-heading">Quick browse</p>
            <ServicesGrid
              services={services.slice(0, 6)}
              loading={servicesLoading}
              onBook={setSelectedService}
              onViewAll={() => setActiveTab('browse')}
            />
          </div>
        )}

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">Browse Services</h1>
              <p className="page-subtitle">{services.length} services available</p>
            </div>

            <div className="browse-filters">
              <input
                className="form-input browse-search"
                placeholder="🔍  Search services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="category-pills">
                {CATEGORIES.map(c => (
                  <button key={c}
                    className={`pill ${category === c ? 'active' : ''}`}
                    onClick={() => setCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <ServicesGrid services={services} loading={servicesLoading} onBook={setSelectedService} />
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="fade-in">
            <div className="page-header">
              <h1 className="page-title">My Bookings</h1>
            </div>
            <BookingsList
              bookings={bookings}
              onCancel={handleCancel}
              onReview={handleReview}
              onRefresh={fetchBookings}
            />
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="fade-in">
            <NotificationsPanel />
          </div>
        )}
      </main>

      {selectedService && (
        <BookingModal
          service={selectedService}
          onConfirm={handleBook}
          onClose={() => setSelectedService(null)}
          loading={bookingLoading}
        />
      )}

      <Chatbot />
    </div>
  );
};

/* ---- Inner Components ---- */

const ServicesGrid = ({ services, loading, onBook, onViewAll }) => {
  if (loading) return <div className="empty-state"><span className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!services.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔍</div>
      <h3>No services found</h3>
      <p>Try a different search or category</p>
    </div>
  );
  return (
    <>
      <div className="services-grid">
        {services.map(s => <ServiceCard key={s.id} service={s} onBook={onBook} />)}
      </div>
      {onViewAll && services.length >= 6 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-outline" onClick={onViewAll}>View all services →</button>
        </div>
      )}
    </>
  );
};

const BookingsList = ({ bookings, onCancel, onReview }) => {
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!bookings.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📅</div>
      <h3>No bookings yet</h3>
      <p>Browse services and make your first booking!</p>
    </div>
  );

  const submitReview = () => {
    onReview(reviewModal, rating, comment);
    setReviewModal(null);
    setComment('');
    setRating(5);
  };

  return (
    <>
      <div className="bookings-list">
        {bookings.map(b => (
          <div key={b.id} className="booking-card">
            {b.service_image && <img src={b.service_image} alt="" className="booking-img" />}
            <div className="booking-info">
              <div className="booking-service">{b.service_name}</div>
              <div className="booking-meta">
                <span>👤 {b.provider_name}</span>
                <span>📅 {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>⏰ {b.booking_time?.slice(0, 5)}</span>
                <span>💰 ₹{parseFloat(b.total_price).toLocaleString('en-IN')}</span>
              </div>
              {b.notes && <p className="booking-notes">📝 {b.notes}</p>}
            </div>
            <div className="booking-actions">
              <span className={`badge badge-${b.status}`}>{b.status}</span>
              {b.status === 'pending' && (
                <button className="btn btn-danger btn-sm" onClick={() => onCancel(b.id)}>Cancel</button>
              )}
              {b.status === 'completed' && (
                <button className="btn btn-outline btn-sm" onClick={() => setReviewModal(b.id)}>⭐ Review</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Leave a Review</h2>
              <button className="modal-close" onClick={() => setReviewModal(null)}>✕</button>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Rating</label>
                <div className="stars" style={{ fontSize: '1.8rem', gap: 4, cursor: 'pointer' }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} onClick={() => setRating(i)} className={`star ${i <= rating ? 'filled' : ''}`}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea className="form-input" rows={3} value={comment}
                  onChange={e => setComment(e.target.value)} placeholder="Share your experience..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setReviewModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={submitReview}>Submit Review</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerDashboard;
