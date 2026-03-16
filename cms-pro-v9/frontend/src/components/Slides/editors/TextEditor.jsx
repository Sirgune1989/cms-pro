import React from 'react';

export default function TextEditor({ slide, onUpdate }) {
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
      <div className="gr2">
        <div className="fg">
          <label>Ikona (emoji)</label>
          <input type="text" value={s.icon || ''} onChange={e => set('icon', e.target.value)} />
        </div>
        <div className="fg">
          <label>SVG ikona (kod SVG)</label>
          <input type="text" value={s.svgIcon || ''} onChange={e => set('svgIcon', e.target.value)} placeholder="<svg>...</svg>" />
        </div>
      </div>
    </div>
  );
}
