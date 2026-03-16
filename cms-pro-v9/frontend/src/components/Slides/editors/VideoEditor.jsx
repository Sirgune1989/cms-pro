import React from 'react';
import MediaEditor from './MediaEditor';

export default function VideoEditor({ slide, onUpdate }) {
  const s = slide.settings || {};
  const set = (key, val) => onUpdate({ settings: { [key]: val } });

  return (
    <div>
      <MediaEditor slide={slide} onUpdate={onUpdate} />
      <div className="div" />
      <div className="fg">
        <label>Glosnosc ({s.volume || 50}%)</label>
        <input
          type="range" min="0" max="100"
          value={s.volume || 50}
          onChange={e => set('volume', parseInt(e.target.value))}
          style={{ accentColor: 'var(--g)' }}
        />
      </div>
    </div>
  );
}
