import React, { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

const GRADIENTS = {
  blue: ['#0ea5e9', '#2563eb'], green: ['#10b981', '#059669'],
  purple: ['#a855f7', '#7c3aed'], orange: ['#f97316', '#ea580c'],
  red: ['#ef4444', '#dc2626'], teal: ['#14b8a6', '#0d9488'],
};

const GRAD_KEYS = Object.keys(GRADIENTS);

export default function StatsPage() {
  const { state, dispatch } = useCms();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', value: 0, unit: 'szt.', change: 0, icon: '📊', gradient: 'blue' });

  const resetForm = () => { setForm({ title: '', value: 0, unit: 'szt.', change: 0, icon: '📊', gradient: 'blue' }); setEditId(null); };

  const addCard = async () => {
    if (!form.title) { toast.error('Wypelnij tytul'); return; }
    try {
      if (editId) {
        const updated = await api.put(`/stat-cards/${editId}`, form);
        dispatch({ type: 'SET_STAT_CARDS', payload: state.statCards.map(c => c.id === editId ? updated : c) });
        toast.success('Zaktualizowano');
      } else {
        const card = await api.post('/stat-cards', form);
        dispatch({ type: 'SET_STAT_CARDS', payload: [...state.statCards, card] });
        toast.success('Dodano');
      }
      resetForm();
    } catch (e) { toast.error(e.message); }
  };

  const editCard = (card) => {
    setEditId(card.id);
    setForm({ title: card.title, value: card.value, unit: card.unit, change: card.change, icon: card.icon, gradient: card.gradient });
  };

  const deleteCard = async (id) => {
    if (!confirm('Usunac?')) return;
    try {
      await api.del(`/stat-cards/${id}`);
      dispatch({ type: 'SET_STAT_CARDS', payload: state.statCards.filter(c => c.id !== id) });
      toast.success('Usunieto');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="pt">Karty statystyk<small>{state.statCards.length} kart</small></div>

      {/* Card Editor */}
      <div className="card">
        <h3>{editId ? 'Edytuj karte' : 'Dodaj karte'}</h3>
        <div className="gr2">
          <div className="fg">
            <label>Tytul</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="fg">
            <label>Ikona (emoji)</label>
            <input type="text" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
          </div>
        </div>
        <div className="gr3">
          <div className="fg">
            <label>Wartosc</label>
            <input type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="fg">
            <label>Jednostka</label>
            <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="fg">
            <label>Zmiana (%)</label>
            <input type="number" step="0.1" value={form.change} onChange={e => setForm({ ...form, change: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx2)', display: 'block', marginBottom: 4 }}>Gradient</label>
          <div className="row" style={{ gap: 4 }}>
            {GRAD_KEYS.map(g => (
              <div
                key={g}
                onClick={() => setForm({ ...form, gradient: g })}
                style={{
                  width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
                  background: `linear-gradient(135deg, ${GRADIENTS[g][0]}, ${GRADIENTS[g][1]})`,
                  border: form.gradient === g ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: form.gradient === g ? '0 0 8px rgba(255,255,255,.2)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <div className="row">
          <button className="btn btn-p" onClick={addCard}>{editId ? 'Zapisz' : 'Dodaj'}</button>
          {editId && <button className="btn btn-s" onClick={resetForm}>Anuluj</button>}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="stat-cards-grid">
        {state.statCards.map(card => {
          const g = GRADIENTS[card.gradient] || GRADIENTS.blue;
          const up = card.change >= 0;
          return (
            <div key={card.id} className="stat-card" style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{card.icon}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', padding: '2px 6px' }}
                    onClick={() => editCard(card)}>✏️</button>
                  <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', padding: '2px 6px' }}
                    onClick={() => deleteCard(card.id)}>✕</button>
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: '"Courier New", monospace', marginBottom: 2 }}>
                {card.value.toLocaleString('pl-PL')} <small style={{ fontSize: 12, fontWeight: 600, opacity: .85 }}>{card.unit}</small>
              </div>
              <div style={{ fontSize: 12, opacity: .85, marginBottom: 6 }}>{card.title}</div>
              <div style={{
                display: 'inline-flex', fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '2px 8px',
                color: up ? '#7dffb3' : '#ffb3b3'
              }}>
                {up ? '↑' : '↓'} {Math.abs(card.change).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-s" onClick={() => {
          const slides = state.slides;
          const hasCardsSlide = slides.some(s => s.type === 'statsCards');
          if (!hasCardsSlide) {
            toast('Dodaj slajd "Karty stat." na stronie Slajdy aby wyswietlic te karty na TV');
          } else {
            toast.success('Slajd kart statystyk jest aktywny');
          }
        }}>
          Sprawdz slajd kart
        </button>
      </div>
    </div>
  );
}
