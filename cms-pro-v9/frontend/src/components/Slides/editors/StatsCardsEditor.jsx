import React from 'react';

export default function StatsCardsEditor({ slide, onUpdate }) {
  return (
    <div>
      <div className="fg">
        <label>Tytul slajdu</label>
        <input type="text" value={slide.title || ''} onChange={e => onUpdate({ title: e.target.value })} />
      </div>
      <div className="hint">
        Ten slajd wyswietla karty statystyk z zakladki "Statystyki". Zarzadzaj kartami na stronie Statystyki.
      </div>
    </div>
  );
}
