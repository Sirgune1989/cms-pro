import React from 'react';
import { api } from '../../../api/client';
import toast from 'react-hot-toast';

export default function MediaEditor({ slide, onUpdate }) {
  const s = slide.settings || {};
  const set = (key, val) => onUpdate({ settings: { [key]: val } });

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error('Plik > 15MB'); return; }
    try {
      const result = await api.upload(file);
      set('mediaUrl', result.url);
      set('mmode', 'url');
      toast.success(file.name);
    } catch (e) {
      toast.error('Blad uploadu');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div>
      <div className="mmode">
        {['embed', 'url', 'folder'].map(m => (
          <button key={m} className={`mmtab${s.mmode === m ? ' on' : ''}`} onClick={() => set('mmode', m)}>
            {m === 'embed' ? 'Upload' : m === 'url' ? 'URL' : 'Folder'}
          </button>
        ))}
      </div>

      {s.mmode === 'embed' && (
        <div
          className="drop"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`media-${slide.id}`).click()}
        >
          <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
          <div style={{ fontSize: 11, color: 'var(--tx2)' }}>
            <strong style={{ display: 'block', color: 'var(--tx)', marginBottom: 2 }}>Przeciagnij lub kliknij</strong>
            JPG, PNG, GIF, MP4, WEBM — max 15MB
          </div>
          <input id={`media-${slide.id}`} type="file" style={{ display: 'none' }}
            accept="image/*,video/*" onChange={e => handleUpload(e.target.files[0])} />
        </div>
      )}

      {s.mmode === 'url' && (
        <div className="fg">
          <label>URL media</label>
          <input type="url" value={s.murl || s.mediaUrl || ''} onChange={e => set('murl', e.target.value)} placeholder="https://..." />
        </div>
      )}

      {s.mmode === 'folder' && (
        <div className="fg">
          <label>Sciezka do pliku</label>
          <input type="text" value={s.mpath || ''} onChange={e => set('mpath', e.target.value)} placeholder="media/01.jpg" />
        </div>
      )}

      {(s.mediaUrl || s.murl) && (
        <div className="mp">
          {(s.mediaUrl || s.murl || '').match(/\.(mp4|webm|ogg)$/i)
            ? <video src={s.mediaUrl || s.murl} style={{ width: '100%', maxHeight: 150 }} muted />
            : <img src={s.mediaUrl || s.murl} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover' }} />
          }
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4, display: 'block' }}>Object-fit</label>
        <div className="fit-sel">
          {['cover', 'contain', 'fill'].map(f => (
            <button key={f} className={`fit-opt${s.objectFit === f ? ' on' : ''}`} onClick={() => set('objectFit', f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
