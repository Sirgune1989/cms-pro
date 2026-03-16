import React, { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';
import TextEditor from './editors/TextEditor';
import MediaEditor from './editors/MediaEditor';
import SplitEditor from './editors/SplitEditor';
import StatsEditor from './editors/StatsEditor';
import QuoteEditor from './editors/QuoteEditor';
import VideoEditor from './editors/VideoEditor';
import CalendarEditor from './editors/CalendarEditor';
import StatsCardsEditor from './editors/StatsCardsEditor';
import MapSlideEditor from './editors/MapSlideEditor';
import JobEditor from './editors/JobEditor';

const LABELS = {
  text: '📝 Tekst', media: '🖼️ Media', split: '⬛ Split',
  stats: '📊 Statystyki', quote: '💬 Cytat', video: '🎬 Wideo',
  calendar: '📅 Kalendarz', statsCards: '📈 Karty stat.',
  mapSlide: '🗺️ Mapa', job: '💼 Oferta',
};

const EDITORS = {
  text: TextEditor, media: MediaEditor, split: SplitEditor,
  stats: StatsEditor, quote: QuoteEditor, video: VideoEditor,
  calendar: CalendarEditor, statsCards: StatsCardsEditor,
  mapSlide: MapSlideEditor, job: JobEditor,
};

export default function SlideCard({ slide }) {
  const [open, setOpen] = useState(false);
  const { dispatch } = useCms();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateSlide = useCallback(async (updates) => {
    const merged = { ...slide, ...updates };
    if (updates.settings) {
      merged.settings = { ...slide.settings, ...updates.settings };
    }
    dispatch({ type: 'UPDATE_SLIDE', payload: merged });
    try {
      await api.put(`/slides/${slide.id}`, {
        title: merged.title,
        active: merged.active,
        duration: merged.duration,
        tts_text: merged.tts_text,
        settings: merged.settings,
      });
    } catch (e) {
      toast.error('Blad zapisu');
    }
  }, [slide, dispatch]);

  const deleteSlide = async () => {
    if (!confirm('Usunac slajd?')) return;
    try {
      await api.del(`/slides/${slide.id}`);
      dispatch({ type: 'DELETE_SLIDE', payload: slide.id });
      toast.success('Usunieto');
    } catch (e) {
      toast.error('Blad: ' + e.message);
    }
  };

  const toggleActive = () => updateSlide({ active: !slide.active });

  const Editor = EDITORS[slide.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sl-card${!slide.active ? ' dis' : ''}${open ? ' open' : ''}${isDragging ? ' dragging' : ''}`}
    >
      <div className="sl-hd" onClick={() => setOpen(!open)}>
        <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
        <span className="sl-badge">{LABELS[slide.type] || slide.type}</span>
        <span className="sl-title">{slide.title || '(bez tytulu)'}</span>
        <div className="sl-acts" onClick={e => e.stopPropagation()}>
          <button className="btn btn-s btn-sm" onClick={toggleActive}>
            {slide.active ? '👁️' : '🚫'}
          </button>
          <button className="btn btn-d btn-sm" onClick={deleteSlide}>✕</button>
        </div>
      </div>
      <div className="sl-body">
        {Editor && <Editor slide={slide} onUpdate={updateSlide} />}

        {/* Common fields */}
        <div className="div" />
        <div className="gr2">
          <div className="fg">
            <label>Czas trwania (s, 0 = domyslny)</label>
            <input
              type="number"
              value={slide.duration || 0}
              min="0"
              onChange={e => updateSlide({ duration: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="fg">
            <label>Tekst TTS</label>
            <input
              type="text"
              value={slide.tts_text || ''}
              onChange={e => updateSlide({ tts_text: e.target.value })}
              placeholder="Tekst do odczytania..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
