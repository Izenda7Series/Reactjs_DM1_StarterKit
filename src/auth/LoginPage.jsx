import { useState } from 'react';
import { useAuth } from './AuthContext';
import { history, useLocation } from '../router';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [tenant, setTenant] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    const res = await fetch('/user/Login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant: tenant || null, email, password })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Invalid login attempt.');
      return;
    }

    login(tenant, email);
    const returnUrl = (location && location.query && location.query.returnUrl) || '/izenda';
    history.push(returnUrl);
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ maxWidth: 420, width: '100%' }}>
        <h2 className="mb-1">Log in</h2>
        <p className="text-muted small mb-3">Use a local account to log in.</p>
        <hr />
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="tenant" className="form-label">Tenant</label>
            <input
              id="tenant"
              type="text"
              className="form-control"
              value={tenant}
              onChange={e => setTenant(e.target.value)}
              placeholder="System level login does not require tenant"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Log in</button>
        </form>
      </div>
    </div>
  );
}
