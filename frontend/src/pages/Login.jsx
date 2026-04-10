import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data);
      const role = res.data.user?.role;
      if (role === 'customer') navigate('/customer');
      else if (role === 'provider') navigate('/provider');
      else if (role === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-left-panel">
        <div className="auth-brand">
          <div className="auth-brand-logo">SB</div>
          <div className="auth-brand-name">SmartBook</div>
        </div>
        <h1 className="auth-tagline">
          Book trusted services <em>effortlessly</em>
        </h1>
        <p className="auth-tagline-sub">
          Connect with verified providers across cleaning, plumbing, beauty, fitness, and more.
        </p>
        <div className="auth-features">
          {[
            { icon: '✅', text: 'Verified service providers' },
            { icon: '📅', text: 'Real-time booking & scheduling' },
            { icon: '🔔', text: 'Instant notifications' },
            { icon: '⭐', text: 'Ratings & reviews' },
          ].map(f => (
            <div className="auth-feature" key={f.text}>
              <div className="auth-feature-icon">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right-panel">
        <div className="auth-card">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your SmartBook account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <p className="auth-link">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </p>

        
        </div>
      </div>
    </div>
  );
};

export default Login;