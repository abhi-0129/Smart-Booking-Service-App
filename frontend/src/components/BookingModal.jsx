import { useState } from 'react';
import './BookingModal.css';

const BookingModal = ({ service, onConfirm, onClose, loading }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !time) return;
    onConfirm({ service_id: service.id, booking_date: date, booking_time: time, notes });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Book Service</h2>
            <p className="modal-subtitle">{service.name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-service-info">
          {service.image && <img src={service.image} alt={service.name} className="modal-service-img" />}
          <div>
            <p className="modal-service-provider">Provider: {service.provider_name}</p>
            <p className="modal-service-price">₹{parseFloat(service.price).toLocaleString('en-IN')}</p>
            {service.duration_minutes && <p className="modal-service-dur">Duration: {service.duration_minutes} min</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Select Date</label>
            <input
              type="date"
              className="form-input"
              min={today}
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Select Time</label>
            <input
              type="time"
              className="form-input"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Any special instructions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : '✓ Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
