import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useCms } from './context/CmsContext';
import LoginPage from './pages/LoginPage';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import SlidesPage from './components/Slides/SlidesPage';
import SettingsPage from './components/Settings/SettingsPage';
import LayoutPage from './components/LayoutEditor/LayoutPage';
import StatsPage from './components/Stats/StatsPage';
import MapPage from './components/Map/MapPage';
import IconsPage from './components/Icons/IconsPage';
import TickerPage from './components/Ticker/TickerPage';
import RoomsPage from './components/Rooms/RoomsPage';
import BackupPage from './components/Backup/BackupPage';
import LivePreview from './components/Preview/LivePreview';

export default function App() {
  const { state } = useCms();

  if (state.loading) {
    return <div className="loading-screen">Wczytywanie...</div>;
  }

  if (!state.authenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/slides" replace />} />
            <Route path="/slides" element={<SlidesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/layout" element={<LayoutPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/icons" element={<IconsPage />} />
            <Route path="/ticker" element={<TickerPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/backup" element={<BackupPage />} />
          </Routes>
        </main>
        <LivePreview />
      </div>
    </div>
  );
}
