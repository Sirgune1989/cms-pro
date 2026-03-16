import React from 'react';
import MediaEditor from './MediaEditor';

export default function SplitEditor({ slide, onUpdate }) {
  const s = slide.settings || {};
  const set = (key, val) => onUpdate({ settings: { [key]: val } });

  return (
    <div>
      <div className="fg">
        <label>Tytul</label>
        <input type="text" value={slide.title || ''} onChange={e => onUpdate({ title: e.target.value })} />
      </div>
      <div className="fg">
        <label>Tresc</label>
        <textarea value={s.body || ''} onChange={e => set('body', e.target.value)} />
      </div>
      <div className="div" />
      <h4 style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8 }}>Media (lewa strona)</h4>
      <MediaEditor slide={slide} onUpdate={onUpdate} />
    </div>
  );
}
