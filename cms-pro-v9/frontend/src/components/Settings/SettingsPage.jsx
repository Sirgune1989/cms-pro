import React, { useState, useCallback } from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

const THEMES = [
  { id: 'light', label: 'Jasny', bg: '#F4F7FA', tile: '#fff' },
  { id: 'dark', label: 'Ciemny', bg: '#0D1117', tile: '#161B22' },
  { id: 'gray', label: 'Szary', bg: '#E8EDF3', tile: '#fff' },
  { id: 'green', label: 'Zielony', bg: '#004d26', tile: '#00703c' },
  { id: 'blue', label: 'Niebieski', bg: '#003b73', tile: '#005b9f' },
  { id: 'premium', label: 'Premium', bg: '#0e0e12', tile: '#16161c' },
];

const ACCENTS = ['#00A651', '#388bfd', '#f97316', '#ef4444', '#a855f7', '#14b8a6', '#e11d48', '#fbbf24'];
const FONTS = [
  { id: 'system', label: 'System' },
  { id: 'lato', label: 'Lato' },
  { id: 'montserrat', label: 'Montserrat' },
  { id: 'roboto', label: 'Roboto' },
];

export default function SettingsPage() {
  const { state, dispatch } = useCms();
  const config = state.config;
  const [saving, setSaving] = useState(false);

  const saveConfig = useCallback(async (updates) => {
    dispatch({ type: 'SET_CONFIG', payload: updates });
    try {
      await api.put('/config', updates);
    } catch (e) {
      toast.error('Blad zapisu: ' + e.message);
    }
  }, [dispatch]);

  const handleField = (key) => (e) => {
    saveConfig({ [key]: e.target.value });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await api.upload(file);
      saveConfig({ logoMediaId: String(result.id) });
      toast.success('Logo zaladowane');
    } catch (err) {
      toast.error('Blad uploadu: ' + err.message);
    }
  };

  return (
    <div>
      <div className="pt">Ustawienia<small>Motyw, dane organizacji, pogoda</small></div>

      {/* Theme */}
      <div className="card">
        <h3>Motyw ekranu TV</h3>
        <div className="th-opts">
          {THEMES.map(t => (
            <div
              key={t.id}
              className={`topt${config.theme === t.id ? ' on' : ''}`}
              onClick={() => saveConfig({ theme: t.id })}
            >
              <div className="tdot" style={{
                background: `linear-gradient(135deg, ${t.bg} 50%, ${t.tile} 50%)`
              }} />
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {/* Accent */}
      <div className="card">
        <h3>Kolor akcentu</h3>
        <div className="ac-row">
          <input
            type="color"
            value={config.accent || '#00A651'}
            onChange={handleField('accent')}
          />
          {ACCENTS.map(c => (
            <div
              key={c}
              className={`asw${config.accent === c ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => saveConfig({ accent: c })}
            />
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="card">
        <h3>Czcionka TV</h3>
        <div className="row" style={{ gap: 6 }}>
          {FONTS.map(f => (
            <button
              key={f.id}
              className={`btn btn-sm ${config.tvFont === f.id ? 'btn-p' : 'btn-s'}`}
              onClick={() => saveConfig({ tvFont: f.id })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Organization Info */}
      <div className="card">
        <h3>Dane organizacji</h3>
        <div className="gr2">
          <div className="fg">
            <label>Nazwa</label>
            <input type="text" value={config.orgName || ''} onChange={handleField('orgName')} />
          </div>
          <div className="fg">
            <label>Podtytul</label>
            <input type="text" value={config.orgSub || ''} onChange={handleField('orgSub')} />
          </div>
        </div>
        <div className="gr2">
          <div className="fg">
            <label>Telefon</label>
            <input type="text" value={config.orgPhone || ''} onChange={handleField('orgPhone')} />
          </div>
          <div className="fg">
            <label>Email</label>
            <input type="text" value={config.orgEmail || ''} onChange={handleField('orgEmail')} />
          </div>
        </div>
        <div className="gr2">
          <div className="fg">
            <label>WWW</label>
            <input type="text" value={config.orgWww || ''} onChange={handleField('orgWww')} />
          </div>
          <div className="fg">
            <label>Godziny</label>
            <input type="text" value={config.orgHours || ''} onChange={handleField('orgHours')} />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="card">
        <h3>Logo</h3>
        <div className="logo-zone" onClick={() => document.getElementById('logo-input').click()}>
          <div style={{ fontSize: 28 }}>🖼️</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
            <strong style={{ color: 'var(--tx)', display: 'block', marginBottom: 2 }}>Kliknij aby zaladowac logo</strong>
            PNG, JPG, SVG — max 5MB
          </div>
        </div>
        <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        {config.logoMediaId && (
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-d btn-sm" onClick={() => saveConfig({ logoMediaId: '' })}>
              Usun logo
            </button>
          </div>
        )}
      </div>

      {/* Weather */}
      <div className="card">
        <h3>Pogoda</h3>
        <div className="gr3">
          <div className="fg">
            <label>Miasto</label>
            <input type="text" value={config.wxCity || ''} onChange={handleField('wxCity')} />
          </div>
          <div className="fg">
            <label>Szerokosc geo.</label>
            <input type="text" value={config.wxLat || ''} onChange={handleField('wxLat')} />
          </div>
          <div className="fg">
            <label>Dlugosc geo.</label>
            <input type="text" value={config.wxLon || ''} onChange={handleField('wxLon')} />
          </div>
        </div>
      </div>

      {/* TTS / Slide Time */}
      <div className="card">
        <h3>Inne</h3>
        <div className="row" style={{ marginBottom: 10 }}>
          <label className="tgl">
            <input
              type="checkbox"
              checked={config.tts === 'true'}
              onChange={(e) => saveConfig({ tts: e.target.checked ? 'true' : 'false' })}
            />
            <span className="tgl-t"></span>
          </label>
          <span style={{ fontSize: 12 }}>Czytanie glosowe (TTS)</span>
        </div>
        <div className="fg">
          <label>Czas slajdu (sekundy)</label>
          <input
            type="number"
            value={config.slideTime || '10'}
            min="3"
            max="120"
            onChange={handleField('slideTime')}
          />
        </div>
      </div>
    </div>
  );
}
