import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { section: 'Tresc', items: [
    { to: '/slides', icon: '🖥️', label: 'Slajdy' },
    { to: '/ticker', icon: '📢', label: 'Pasek' },
    { to: '/rooms', icon: '🚪', label: 'Pokoje' },
  ]},
  { section: 'Dane', items: [
    { to: '/stats', icon: '📊', label: 'Statystyki' },
    { to: '/map', icon: '🗺️', label: 'Mapa' },
    { to: '/icons', icon: '🎨', label: 'Ikony SVG' },
  ]},
  { section: 'System', items: [
    { to: '/settings', icon: '⚙️', label: 'Ustawienia' },
    { to: '/layout', icon: '📐', label: 'Layout' },
    { to: '/backup', icon: '💾', label: 'Backup' },
  ]},
];

export default function Sidebar() {
  return (
    <nav className="nav">
      {navItems.map(group => (
        <React.Fragment key={group.section}>
          <div className="ns">{group.section}</div>
          {group.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `ni${isActive ? ' on' : ''}`}
            >
              <span className="ic">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </React.Fragment>
      ))}
    </nav>
  );
}
