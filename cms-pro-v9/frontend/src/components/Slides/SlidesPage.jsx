import React from 'react';
import { useCms } from '../../context/CmsContext';
import { api } from '../../api/client';
import toast from 'react-hot-toast';
import SlideList from './SlideList';

const SLIDE_TYPES = [
  { type: 'text', label: 'Tekst', icon: '📝' },
  { type: 'media', label: 'Media', icon: '🖼️' },
  { type: 'split', label: 'Split', icon: '⬛' },
  { type: 'stats', label: 'Statystyki', icon: '📊' },
  { type: 'quote', label: 'Cytat', icon: '💬' },
  { type: 'video', label: 'Wideo', icon: '🎬' },
  { type: 'calendar', label: 'Kalendarz', icon: '📅' },
  { type: 'statsCards', label: 'Karty stat.', icon: '📈' },
  { type: 'mapSlide', label: 'Mapa', icon: '🗺️' },
  { type: 'job', label: 'Oferta pracy', icon: '💼' },
];

const DEFAULTS = {
  text: { title: 'Nowy slajd informacyjny', settings: { body: 'Treść slajdu...', icon: '📌', svgIcon: '' } },
  media: { title: '', settings: { mmode: 'embed', mdata: '', mpath: '', murl: '', objectFit: 'cover' } },
  split: { title: 'Tytuł', settings: { body: 'Opis...', mmode: 'embed', mdata: '', mpath: '', murl: '', objectFit: 'cover' } },
  stats: { title: 'Statystyki PUP', settings: {
    period: 'Luty 2026', total: 618, rate: '5,8%',
    sztum: 217, dzierzgon: 200, staryTarg: 90, staryDzierzgon: 57, mikolajki: 54,
    rateHistory: [
      { m: 'Wrz 25', v: 6.4 }, { m: 'Paź 25', v: 6.1 }, { m: 'Lis 25', v: 6.0 },
      { m: 'Gru 25', v: 5.9 }, { m: 'Sty 26', v: 5.9 }, { m: 'Lut 26', v: 5.8 }
    ]
  }},
  quote: { title: 'Cytat', settings: { quote: 'Praca to nie tylko zarobek...', author: '— Doradca zawodowy PUP Sztum' } },
  video: { title: '', settings: { mmode: 'embed', mdata: '', mpath: '', murl: '', volume: 50 } },
  calendar: { title: 'Kalendarz', settings: { calYear: 2026, calMonth: 3, events: '1|Nowy nabór wniosków\n15|Targi pracy' } },
  statsCards: { title: 'Statystyki PUP', settings: {} },
  mapSlide: { title: 'Bezrobocie w powiecie sztumskim', settings: {} },
  job: { title: 'Oferta pracy', settings: {
    jobTitle: 'Pracownik biurowy', jobCompany: 'ABC Sp. z o.o.', jobLocation: 'Sztum',
    jobRequirements: 'Wykształcenie średnie\nZnajomość MS Office\nPrawo jazdy kat. B',
    jobContact: 'Pokój nr 10 — Pośrednicy Pracy', jobUrl: ''
  }},
};

export default function SlidesPage() {
  const { state, dispatch } = useCms();

  const addSlide = async (type) => {
    try {
      const def = DEFAULTS[type];
      const slide = await api.post('/slides', {
        type,
        title: def.title,
        active: true,
        duration: 0,
        tts_text: '',
        settings: def.settings
      });
      dispatch({ type: 'ADD_SLIDE', payload: slide });
      toast.success(`Dodano: ${SLIDE_TYPES.find(s => s.type === type)?.label}`);
    } catch (e) {
      toast.error('Blad: ' + e.message);
    }
  };

  return (
    <div>
      <div className="pt">
        Slajdy
        <small>{state.slides.length} slajdow ({state.slides.filter(s => s.active).length} aktywnych)</small>
      </div>

      <div className="add-btns">
        {SLIDE_TYPES.map(st => (
          <button key={st.type} className="stype-btn" onClick={() => addSlide(st.type)}>
            {st.icon} {st.label}
          </button>
        ))}
      </div>

      <SlideList />
    </div>
  );
}
