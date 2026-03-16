import React from 'react';
import { clearToken } from '../../api/client';

export default function Header() {
  const handleLogout = () => {
    clearToken();
    window.location.reload();
  };

  return (
    <div className="hd">
      <div className="logo-hd">
        <div className="logo-hd-ic">📺</div>
        <div>
          <h1>PUP InfoHub CMS</h1>
          <span>v9.0 — Panel administracyjny</span>
        </div>
      </div>
      <div className="hd-r">
        <button className="btn btn-s btn-sm" onClick={handleLogout}>
          Wyloguj
        </button>
      </div>
    </div>
  );
}
