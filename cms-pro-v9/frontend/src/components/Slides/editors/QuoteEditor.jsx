import React from 'react';

export default function QuoteEditor({ slide, onUpdate }) {
  const s = slide.settings || {};
  const set = (key, val) => onUpdate({ settings: { [key]: val } });

  return (
    <div>
      <div className="fg">
        <label>Cytat</label>
        <textarea value={s.quote || ''} onChange={e => set('quote', e.target.value)} />
      </div>
      <div className="fg">
        <label>Autor</label>
        <input type="text" value={s.author || ''} onChange={e => set('author', e.target.value)} />
      </div>
    </div>
  );
}
