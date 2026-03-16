import React, { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

export default function IconsPage() {
  const { state, dispatch } = useCms();
  const [name, setName] = useState('');
  const [svg, setSvg] = useState('');
  const [search, setSearch] = useState('');

  const addIcon = async () => {
    if (!name || !svg) { toast.error('Wypelnij nazwe i kod SVG'); return; }
    try {
      const item = await api.post('/icons', { name, svg, category: 'custom' });
      dispatch({ type: 'SET_ICONS', payload: [...state.icons, item] });
      setName(''); setSvg('');
      toast.success('Dodano');
    } catch (e) { toast.error(e.message); }
  };

  const deleteIcon = async (id) => {
    if (!confirm('Usunac ikone?')) return;
    try {
      await api.del(`/icons/${id}`);
      dispatch({ type: 'SET_ICONS', payload: state.icons.filter(i => i.id !== id) });
      toast.success('Usunieto');
    } catch (e) { toast.error(e.message); }
  };

  const filtered = search
    ? state.icons.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : state.icons;

  return (
    <div>
      <div className="pt">Ikony SVG<small>{state.icons.length} ikon</small></div>

      <div className="card">
        <h3>Dodaj ikone</h3>
        <div className="fg">
          <label>Nazwa</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. telefon" />
        </div>
        <div className="fg">
          <label>Kod SVG</label>
          <textarea value={svg} onChange={e => setSvg(e.target.value)} placeholder='<svg viewBox="0 0 24 24">...</svg>' />
        </div>
        {svg && (
          <div style={{ marginBottom: 8, padding: 8, background: 'var(--sf2)', borderRadius: 8, display: 'inline-flex' }}>
            <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: 48, height: 48, color: 'var(--g)' }} />
          </div>
        )}
        <div>
          <button className="btn btn-p" onClick={addIcon}>Dodaj ikone</button>
        </div>
      </div>

      <div className="card">
        <h3>Biblioteka ikon</h3>
        <div className="fg" style={{ marginBottom: 12 }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
          {filtered.map(icon => (
            <div key={icon.id} style={{
              background: 'var(--sf2)', borderRadius: 8, padding: 8,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              position: 'relative'
            }}>
              <div dangerouslySetInnerHTML={{ __html: icon.svg }}
                style={{ width: 32, height: 32, color: 'var(--g)' }} />
              <span style={{ fontSize: 9, color: 'var(--tx2)', textAlign: 'center', wordBreak: 'break-all' }}>
                {icon.name}
              </span>
              <button
                className="btn btn-d btn-sm"
                onClick={() => deleteIcon(icon.id)}
                style={{ position: 'absolute', top: 2, right: 2, padding: '1px 4px', fontSize: 9 }}
              >✕</button>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="hint">Brak ikon{search ? ' pasujacych do wyszukiwania' : ''}.</div>}
      </div>
    </div>
  );
}
