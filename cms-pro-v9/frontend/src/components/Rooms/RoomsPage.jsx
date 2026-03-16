import React, { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

export default function RoomsPage() {
  const { state, dispatch } = useCms();
  const [form, setForm] = useState({ number: '', name: '', floor: '' });

  const addRoom = async () => {
    if (!form.number || !form.name) { toast.error('Wypelnij numer i nazwe'); return; }
    try {
      const item = await api.post('/rooms', form);
      dispatch({ type: 'SET_ROOMS', payload: [...state.rooms, item] });
      setForm({ number: '', name: '', floor: '' });
      toast.success('Dodano');
    } catch (e) { toast.error(e.message); }
  };

  const updateRoom = async (id, updates) => {
    try {
      const updated = await api.put(`/rooms/${id}`, updates);
      dispatch({ type: 'SET_ROOMS', payload: state.rooms.map(r => r.id === id ? updated : r) });
    } catch (e) { toast.error(e.message); }
  };

  const deleteRoom = async (id) => {
    if (!confirm('Usunac?')) return;
    try {
      await api.del(`/rooms/${id}`);
      dispatch({ type: 'SET_ROOMS', payload: state.rooms.filter(r => r.id !== id) });
      toast.success('Usunieto');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="pt">Pokoje<small>{state.rooms.length} pokojow</small></div>

      <div className="card">
        <h3>Dodaj pokoj</h3>
        <div className="gr3">
          <div className="fg">
            <label>Numer</label>
            <input type="text" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="np. 1" />
          </div>
          <div className="fg">
            <label>Nazwa</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="np. Obsługa" />
          </div>
          <div className="fg">
            <label>Pietro</label>
            <input type="text" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} placeholder="Parter" />
          </div>
        </div>
        <button className="btn btn-p" onClick={addRoom}>Dodaj pokoj</button>
      </div>

      <div className="card">
        <h3>Lista pokojow</h3>
        {state.rooms.map(room => (
          <div key={room.id} className="room-row">
            <input
              type="text" value={room.number}
              onChange={e => updateRoom(room.id, { number: e.target.value })}
              style={{ width: 50, padding: '4px 6px', fontSize: 12, background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--tx)', textAlign: 'center', fontWeight: 700 }}
            />
            <input
              type="text" value={room.name}
              onChange={e => updateRoom(room.id, { name: e.target.value })}
              style={{ flex: 1, padding: '4px 6px', fontSize: 12, background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--tx)' }}
            />
            <input
              type="text" value={room.floor || ''}
              onChange={e => updateRoom(room.id, { floor: e.target.value })}
              style={{ width: 80, padding: '4px 6px', fontSize: 12, background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 6, color: 'var(--tx2)' }}
            />
            <button className="btn btn-d btn-sm" onClick={() => deleteRoom(room.id)}>✕</button>
          </div>
        ))}
        {state.rooms.length === 0 && <div className="hint">Brak pokojow. Dodaj pierwszy pokoj powyzej.</div>}
      </div>
    </div>
  );
}
