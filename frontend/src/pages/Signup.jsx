import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import './Auth.css';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await API.post('/auth/signup', form);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-brand">
          <div className="auth-brand-logo">SB</div>
          <div className="auth-brand-name">SmartBook</div>
        </div>
        <h1 className="auth-tagline">
          Join thousands of <em>happy customers</em>
        </h1>
        <p className="auth-tagline-sub">
          Create your free account in seconds and start booking trusted local services today.
        </p>
        <div className="auth-features">
          {[
            { icon: '🛒', text: 'Book as a customer — browse & schedule' },
            { icon: '🔧', text: 'Join as a provider — list & earn' },
            { icon: '🔒', text: 'Secure login with JWT authentication' },
            { icon: '📲', text: 'Real-time updates via notifications' },
          ].map(f => (
            <div className="auth-feature" key={f.text}>
              <div className="auth-feature-icon">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-card">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Get started with SmartBook for free</p>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">I want to</label>
              <div className="role-select">
                <button type="button" className={`role-btn ${form.role === 'customer' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: 'customer' })}>
                  🛒 Book Services
                </button>
                <button type="button" className={`role-btn ${form.role === 'provider' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: 'provider' })}>
                  🔧 Offer Services
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;