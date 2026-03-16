import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const CmsContext = createContext();

const initialState = {
  config: {},
  slides: [],
  ticker: [],
  rooms: [],
  statCards: [],
  mapData: {},
  icons: [],
  media: [],
  loading: true,
  authenticated: !!localStorage.getItem('cms_token')
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':
      return { ...state, ...action.payload, loading: false };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'SET_SLIDES':
      return { ...state, slides: action.payload };
    case 'ADD_SLIDE':
      return { ...state, slides: [...state.slides, action.payload] };
    case 'UPDATE_SLIDE':
      return { ...state, slides: state.slides.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SLIDE':
      return { ...state, slides: state.slides.filter(s => s.id !== action.payload) };
    case 'SET_TICKER':
      return { ...state, ticker: action.payload };
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    case 'SET_STAT_CARDS':
      return { ...state, statCards: action.payload };
    case 'SET_MAP_DATA':
      return { ...state, mapData: action.payload };
    case 'SET_ICONS':
      return { ...state, icons: action.payload };
    case 'SET_MEDIA':
      return { ...state, media: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, authenticated: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function CmsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadAll = useCallback(async () => {
    if (!localStorage.getItem('cms_token')) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const [config, slides, ticker, rooms, statCards, mapData, icons, media] = await Promise.all([
        api.get('/config'),
        api.get('/slides'),
        api.get('/ticker'),
        api.get('/rooms'),
        api.get('/stat-cards'),
        api.get('/map-data'),
        api.get('/icons'),
        api.get('/media')
      ]);
      dispatch({
        type: 'SET_ALL',
        payload: { config, slides, ticker, rooms, statCards, mapData, icons, media, authenticated: true }
      });
    } catch (e) {
      console.error('Load error:', e);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <CmsContext.Provider value={{ state, dispatch, loadAll }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  const context = useContext(CmsContext);
  if (!context) throw new Error('useCms must be used within CmsProvider');
  return context;
}
