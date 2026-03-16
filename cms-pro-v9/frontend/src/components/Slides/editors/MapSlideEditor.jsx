import React from 'react';

export default function MapSlideEditor({ slide, onUpdate }) {
  return (
    <div>
      <div className="fg">
        <label>Tytul slajdu</label>
        <input type="text" value={slide.title || ''} onChange={e => onUpdate({ title: e.target.value })} />
      </div>
      <div className="hint">
        Ten slajd wyswietla mape powiatu z danymi z zakladki "Mapa". Edytuj dane na stronie Mapa.
      </div>
    </div>
  );
}
