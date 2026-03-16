import React, { useCallback } from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

const SLIDERS = [
  { key: 'fsTitleSlide', label: 'Font tytulu slajdu', min: 1, max: 6, step: 0.1, unit: 'rem' },
  { key: 'fsBodySlide', label: 'Font tresci slajdu', min: 0.8, max: 4, step: 0.1, unit: 'rem' },
  { key: 'fsTicker', label: 'Font tickera', min: 0.6, max: 2.5, step: 0.05, unit: 'rem' },
  { key: 'fsClock', label: 'Font zegara', min: 1, max: 4, step: 0.1, unit: 'rem' },
  { key: 'headerH', label: 'Wysokosc nagłowka', min: 40, max: 100, step: 1, unit: 'px' },
  { key: 'tickerH', label: 'Wysokosc tickera', min: 40, max: 120, step: 1, unit: 'px' },
  { key: 'stagePad', label: 'Padding sceny', min: 0, max: 40, step: 1, unit: 'px' },
  { key: 'slideRadius', label: 'Zaokraglenie slajdow', min: 0, max: 40, step: 1, unit: 'px' },
  { key: 'wxIconSize', label: 'Ikona pogody', min: 16, max: 64, step: 1, unit: 'px' },
  { key: 'wxTempSize', label: 'Font temperatury', min: 0.6, max: 3, step: 0.1, unit: 'rem' },
  { key: 'sidebarWidth', label: 'Szerokosc sidebaru', min: 200, max: 600, step: 10, unit: 'px' },
];

const PRESETS = {
  classic: { fsTitleSlide: '3.1', fsBodySlide: '2', fsTicker: '1.05', fsClock: '2.1', headerH: '60', tickerH: '74', stagePad: '14', slideRadius: '20', wxIconSize: '36', wxTempSize: '1.2' },
  stats: { fsTitleSlide: '2.5', fsBodySlide: '1.6', fsTicker: '1', fsClock: '1.8', headerH: '50', tickerH: '60', stagePad: '10', slideRadius: '14', wxIconSize: '28', wxTempSize: '1' },
  offers: { fsTitleSlide: '2.8', fsBodySlide: '1.8', fsTicker: '1.1', fsClock: '2', headerH: '56', tickerH: '68', stagePad: '12', slideRadius: '16', wxIconSize: '32', wxTempSize: '1.1' },
  big: { fsTitleSlide: '4.2', fsBodySlide: '2.8', fsTicker: '1.4', fsClock: '3', headerH: '70', tickerH: '84', stagePad: '18', slideRadius: '24', wxIconSize: '48', wxTempSize: '1.8' },
};

export default function LayoutPage() {
  const { state, dispatch } = useCms();
  const config = state.config;

  const saveConfig = useCallback(async (updates) => {
    dispatch({ type: 'SET_CONFIG', payload: updates });
    try {
      await api.put('/config', updates);
    } catch (e) {
      toast.error('Blad zapisu: ' + e.message);
    }
  }, [dispatch]);

  const applyPreset = (name) => {
    const vals = PRESETS[name];
    if (!vals) return;
    saveConfig(vals);
    toast.success('Preset "' + name + '" zastosowany');
  };

  return (
    <div>
      <div className="pt">Layout<small>Rozmiary, czcionki, presety</small></div>

      {/* Presets */}
      <div className="card">
        <h3>Presety</h3>
        <div className="preset-btns">
          <button className="btn btn-s" onClick={() => applyPreset('classic')}>Klasyczny</button>
          <button className="btn btn-s" onClick={() => applyPreset('stats')}>Statystyki</button>
          <button className="btn btn-s" onClick={() => applyPreset('offers')}>Oferty</button>
          <button className="btn btn-s" onClick={() => applyPreset('big')}>Duzy</button>
        </div>
      </div>

      {/* Sliders */}
      <div className="card">
        <h3>Dostosuj</h3>
        {SLIDERS.map(s => {
          const val = parseFloat(config[s.key]) || s.min;
          return (
            <div key={s.key} className="slider-row">
              <label>{s.label}</label>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={val}
                onChange={e => saveConfig({ [s.key]: e.target.value })}
              />
              <span className="val">{val}{s.unit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
