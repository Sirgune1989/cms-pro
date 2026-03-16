import React from 'react';

export default function JobEditor({ slide, onUpdate }) {
  const s = slide.settings || {};
  const set = (key, val) => onUpdate({ settings: { [key]: val } });

  return (
    <div>
      <div className="fg">
        <label>Stanowisko</label>
        <input type="text" value={s.jobTitle || ''} onChange={e => set('jobTitle', e.target.value)} />
      </div>
      <div className="gr2">
        <div className="fg">
          <label>Firma</label>
          <input type="text" value={s.jobCompany || ''} onChange={e => set('jobCompany', e.target.value)} />
        </div>
        <div className="fg">
          <label>Lokalizacja</label>
          <input type="text" value={s.jobLocation || ''} onChange={e => set('jobLocation', e.target.value)} />
        </div>
      </div>
      <div className="fg">
        <label>Wymagania (linia po linii)</label>
        <textarea value={s.jobRequirements || ''} onChange={e => set('jobRequirements', e.target.value)} />
      </div>
      <div className="fg">
        <label>Kontakt</label>
        <input type="text" value={s.jobContact || ''} onChange={e => set('jobContact', e.target.value)} />
      </div>
      <div className="fg">
        <label>URL oferty (opcjonalnie, generuje QR)</label>
        <input type="url" value={s.jobUrl || ''} onChange={e => set('jobUrl', e.target.value)} placeholder="https://..." />
      </div>
    </div>
  );
}
