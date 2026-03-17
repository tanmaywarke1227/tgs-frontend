import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      student: { email: 'rahul.sharma@student.edu', password: 'student123' },
      faculty: { email: 'amit.verma@college.edu', password: 'faculty123' },
      admin:   { email: 'admin@college.edu',        password: 'admin123'   },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-grid" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">TGS</div>
          <h1 className="login-title">Term Grant Slip System</h1>
          <p className="login-subtitle">Digital approval portal for semester examinations</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? <><span className="mini-spinner" /> Signing in...</> : 'Sign In →'}
          </button>
        </form>

        <div className="demo-section">
          <p className="demo-label">Quick Demo Login</p>
          <div className="demo-btns">
            <button className="demo-btn student" onClick={() => fillDemo('student')}>Student</button>
            <button className="demo-btn faculty" onClick={() => fillDemo('faculty')}>Faculty</button>
            <button className="demo-btn admin"   onClick={() => fillDemo('admin')}>Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
