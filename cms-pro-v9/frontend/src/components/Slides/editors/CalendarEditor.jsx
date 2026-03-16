import React from 'react';

export default function CalendarEditor({ slide, onUpdate }) {
  const s = slide.settings || {};
  const set = (key, val) => onUpdate({ settings: { [key]: val } });

  return (
    <div>
      <div className="gr2">
        <div className="fg">
          <label>Rok</label>
          <input type="number" value={s.calYear || 2026} onChange={e => set('calYear', parseInt(e.target.value) || 2026)} />
        </div>
        <div className="fg">
          <label>Miesiac (1-12)</label>
          <input type="number" value={s.calMonth || 1} min="1" max="12"
            onChange={e => set('calMonth', parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <div className="fg">
        <label>Wydarzenia (dzien|opis, linia po linii)</label>
        <textarea
          value={s.events || ''}
          onChange={e => set('events', e.target.value)}
          placeholder="1|Nowy nabor wnioskow&#10;15|Targi pracy"
        />
      </div>
    </div>
  );
}
