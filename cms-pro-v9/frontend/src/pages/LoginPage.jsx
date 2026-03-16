import React, { useState } from 'react';
import { setToken } from '../api/client';
import { useCms } from '../context/CmsContext';

export default function LoginPage() {
  const [token, setTokenVal] = useState('');
  const [error, setError] = useState('');
  const { dispatch, loadAll } = useCms();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setToken(token.trim());
    try {
      const res = await fetch('/api/config', {
        headers: { 'Authorization': `Bearer ${token.trim()}` }
      });
      if (!res.ok) throw new Error();
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      loadAll();
    } catch {
      setError('Nieprawidlowy token');
      localStorage.removeItem('cms_token');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">📺</div>
        <h1>PUP InfoHub CMS</h1>
        <p>Wersja 9.0</p>
        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Token autoryzacji</label>
            <input
              type="password"
              value={token}
              onChange={e => { setTokenVal(e.target.value); setError(''); }}
              placeholder="Wpisz token..."
              autoFocus
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-p" style={{ width: '100%', marginTop: 8 }}>
            Zaloguj
          </button>
        </form>
      </div>
    </div>
  );
}
