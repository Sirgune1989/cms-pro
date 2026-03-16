import React from 'react';

const MUNICIPALITIES = [
  { key: 'sztum', label: 'Sztum' },
  { key: 'dzierzgon', label: 'Dzierzgon' },
  { key: 'staryTarg', label: 'Stary Targ' },
  { key: 'staryDzierzgon', label: 'Stary Dzierzgon' },
  { key: 'mikolajki', label: 'Mikolajki Pom.' },
];

export default function StatsEditor({ slide, onUpdate }) {
  const s = slide.settings || {};
  const set = (key, val) => onUpdate({ settings: { [key]: val } });

  const updateRateHistory = (index, field, val) => {
    const rh = [...(s.rateHistory || [])];
    rh[index] = { ...rh[index], [field]: field === 'v' ? parseFloat(val) || 0 : val };
    set('rateHistory', rh);
  };

  const addRatePoint = () => {
    const rh = [...(s.rateHistory || [])];
    rh.push({ m: 'Nowy', v: 0 });
    set('rateHistory', rh);
  };

  const removeRatePoint = (index) => {
    const rh = [...(s.rateHistory || [])];
    rh.splice(index, 1);
    set('rateHistory', rh);
  };

  return (
    <div>
      <div className="gr3">
        <div className="fg">
          <label>Okres</label>
          <input type="text" value={s.period || ''} onChange={e => set('period', e.target.value)} />
        </div>
        <div className="fg">
          <label>Bezrobotni razem</label>
          <input type="number" value={s.total || 0} onChange={e => set('total', parseInt(e.target.value) || 0)} />
        </div>
        <div className="fg">
          <label>Stopa bezrobocia</label>
          <input type="text" value={s.rate || ''} onChange={e => set('rate', e.target.value)} />
        </div>
      </div>

      <div className="div" />
      <h4 style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8 }}>Bezrobocie wg gmin</h4>
      <div className="gr3" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {MUNICIPALITIES.map(m => (
          <div key={m.key} className="fg">
            <label>{m.label}</label>
            <input type="number" value={s[m.key] || 0} onChange={e => set(m.key, parseInt(e.target.value) || 0)} />
          </div>
        ))}
      </div>

      <div className="div" />
      <h4 style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8 }}>
        Trend stopy bezrobocia
        <button className="btn btn-s btn-sm" style={{ marginLeft: 8 }} onClick={addRatePoint}>+ Dodaj</button>
      </h4>
      {(s.rateHistory || []).map((rh, i) => (
        <div key={i} className="row" style={{ marginBottom: 4 }}>
          <input
            type="text" value={rh.m || ''} placeholder="Mies."
            style={{ width: 80, padding: '4px 6px', fontSize: 11, background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--tx)' }}
            onChange={e => updateRateHistory(i, 'm', e.target.value)}
          />
          <input
            type="number" value={rh.v || 0} step="0.1"
            style={{ width: 70, padding: '4px 6px', fontSize: 11, background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--tx)' }}
            onChange={e => updateRateHistory(i, 'v', e.target.value)}
          />
          <button className="btn btn-d btn-sm" onClick={() => removeRatePoint(i)}>✕</button>
        </div>
      ))}
    </div>
  );
}
