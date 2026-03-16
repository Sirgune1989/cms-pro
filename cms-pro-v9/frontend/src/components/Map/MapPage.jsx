import React, { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

const MUNICIPALITIES = [
  { key: 'sztum', label: 'Sztum', p: 'M60,40 L190,25 L220,65 L240,140 L220,220 L160,260 L90,250 L50,190 L30,110Z', cx: 140, cy: 140 },
  { key: 'dzierzgon', label: 'Dzierzgon', p: 'M190,25 L330,8 L380,45 L395,130 L350,185 L240,140 L220,65Z', cx: 300, cy: 85 },
  { key: 'staryTarg', label: 'Stary Targ', p: 'M90,250 L160,260 L220,220 L210,310 L165,360 L100,370 L55,330 L50,280Z', cx: 140, cy: 300 },
  { key: 'staryDzierzgon', label: 'Stary Dzierzgon', p: 'M240,140 L350,185 L370,265 L325,320 L260,330 L210,310 L220,220Z', cx: 295, cy: 240 },
  { key: 'mikolajki', label: 'Mikolajki Pom.', p: 'M260,330 L325,320 L370,360 L350,390 L280,400 L210,380 L210,310Z', cx: 290, cy: 355 },
];

export default function MapPage() {
  const { state, dispatch } = useCms();
  const mapData = state.mapData;
  const [csvText, setCsvText] = useState('');

  const updateValue = async (key, value) => {
    const newData = { ...mapData, [key]: parseInt(value) || 0 };
    dispatch({ type: 'SET_MAP_DATA', payload: newData });
    try {
      await api.put('/map-data', { [key]: parseInt(value) || 0 });
    } catch (e) { toast.error(e.message); }
  };

  const importCsv = async () => {
    if (!csvText.trim()) return;
    try {
      const result = await api.post('/map-data/import-csv', { csv: csvText });
      toast.success(`Zaimportowano ${result.imported} rekordow`);
      const data = await api.get('/map-data');
      dispatch({ type: 'SET_MAP_DATA', payload: data });
      setCsvText('');
    } catch (e) { toast.error(e.message); }
  };

  const maxVal = Math.max(...MUNICIPALITIES.map(m => mapData[m.key] || 0)) || 1;
  const getColor = (v) => {
    const t = Math.min(v / maxVal, 1);
    return `rgb(${Math.round(20 * t)}, ${Math.round(180 - 100 * t)}, ${Math.round(100 - 60 * t)})`;
  };

  return (
    <div>
      <div className="pt">Mapa powiatu<small>Dane bezrobocia wg gmin</small></div>

      <div className="card">
        <h3>Wartosci gmin</h3>
        <div className="gr3" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {MUNICIPALITIES.map(m => (
            <div key={m.key} className="fg">
              <label>{m.label}</label>
              <input
                type="number" value={mapData[m.key] || 0}
                onChange={e => updateValue(m.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Map Preview */}
      <div className="card">
        <h3>Podglad mapy</h3>
        <div style={{ background: 'var(--sf2)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 420 410" style={{ width: 300, height: 'auto' }}>
            {MUNICIPALITIES.map(m => (
              <g key={m.key}>
                <path d={m.p} fill={getColor(mapData[m.key] || 0)} stroke="rgba(255,255,255,.6)" strokeWidth="2.5" opacity=".92" />
                <text x={m.cx} y={m.cy - 6} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke="rgba(0,0,0,.5)" strokeWidth=".4">
                  {m.label}
                </text>
                <text x={m.cx} y={m.cy + 14} textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff" stroke="rgba(0,0,0,.6)" strokeWidth=".5">
                  {mapData[m.key] || 0}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* CSV Import */}
      <div className="card">
        <h3>Import CSV</h3>
        <div className="fg">
          <label>Dane CSV (gmina, wartosc — linia po linii)</label>
          <textarea
            value={csvText} onChange={e => setCsvText(e.target.value)}
            placeholder="sztum,217&#10;dzierzgon,200&#10;staryTarg,90"
          />
        </div>
        <button className="btn btn-p" onClick={importCsv}>Importuj</button>
      </div>
    </div>
  );
}
