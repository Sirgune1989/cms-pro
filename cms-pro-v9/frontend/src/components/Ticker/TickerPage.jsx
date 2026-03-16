import React, { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

export default function TickerPage() {
  const { state, dispatch } = useCms();
  const [newText, setNewText] = useState('');

  const addItem = async () => {
    if (!newText.trim()) return;
    try {
      const item = await api.post('/ticker', { text: newText.trim() });
      dispatch({ type: 'SET_TICKER', payload: [...state.ticker, item] });
      setNewText('');
      toast.success('Dodano');
    } catch (e) { toast.error(e.message); }
  };

  const updateItem = async (id, text) => {
    try {
      const updated = await api.put(`/ticker/${id}`, { text });
      dispatch({ type: 'SET_TICKER', payload: state.ticker.map(t => t.id === id ? updated : t) });
    } catch (e) { toast.error(e.message); }
  };

  const toggleItem = async (id, active) => {
    try {
      const updated = await api.put(`/ticker/${id}`, { active: !active });
      dispatch({ type: 'SET_TICKER', payload: state.ticker.map(t => t.id === id ? updated : t) });
    } catch (e) { toast.error(e.message); }
  };

  const deleteItem = async (id) => {
    if (!confirm('Usunac?')) return;
    try {
      await api.del(`/ticker/${id}`);
      dispatch({ type: 'SET_TICKER', payload: state.ticker.filter(t => t.id !== id) });
      toast.success('Usunieto');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="pt">Pasek wiadomosci<small>{state.ticker.length} wiadomosci</small></div>

      <div className="card">
        <h3>Dodaj wiadomosc</h3>
        <div className="row">
          <input
            type="text" className="fg" value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Tresc wiadomosci..."
            onKeyDown={e => e.key === 'Enter' && addItem()}
            style={{ flex: 1, marginBottom: 0, background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 10px', color: 'var(--tx)', fontSize: 12 }}
          />
          <button className="btn btn-p" onClick={addItem}>Dodaj</button>
        </div>
      </div>

      {state.ticker.map(item => (
        <div key={item.id} className="sl-card" style={{ opacity: item.active ? 1 : 0.45 }}>
          <div className="sl-hd" style={{ cursor: 'default' }}>
            <span className="sl-badge">📢</span>
            <input
              type="text" value={item.text}
              onChange={e => updateItem(item.id, e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--tx)', fontSize: 12, outline: 'none' }}
            />
            <div className="sl-acts">
              <button className="btn btn-s btn-sm" onClick={() => toggleItem(item.id, item.active)}>
                {item.active ? '👁️' : '🚫'}
              </button>
              <button className="btn btn-d btn-sm" onClick={() => deleteItem(item.id)}>✕</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
