import React, { useState } from 'react';
import { api } from '../../api/client';
import { useCms } from '../../context/CmsContext';
import toast from 'react-hot-toast';

export default function BackupPage() {
  const { loadAll } = useCms();
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);

  const exportBackup = async () => {
    try {
      const data = await api.get('/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup pobrany');
    } catch (e) {
      toast.error('Blad eksportu: ' + e.message);
    }
  };

  const importBackup = async () => {
    if (!importJson.trim()) { toast.error('Wklej dane JSON'); return; }
    let data;
    try {
      data = JSON.parse(importJson);
    } catch {
      toast.error('Nieprawidlowy JSON');
      return;
    }

    if (!confirm('Uwaga! Import nadpisze wszystkie dane. Kontynuowac?')) return;

    setImporting(true);
    try {
      await api.post('/backup', data);
      toast.success('Dane zaimportowane');
      setImportJson('');
      loadAll();
    } catch (e) {
      toast.error('Blad importu: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportJson(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="pt">Backup<small>Eksport i import danych</small></div>

      {/* Export */}
      <div className="card">
        <h3>Eksport</h3>
        <p style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 12 }}>
          Pobierz pelny backup wszystkich danych (slajdy, konfiguracja, pokoje, ticker, statystyki, mapa, ikony).
        </p>
        <button className="btn btn-p" onClick={exportBackup}>Pobierz backup JSON</button>
      </div>

      {/* Import */}
      <div className="card">
        <h3>Import</h3>
        <p style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 12 }}>
          Wklej JSON lub zaladuj plik. Uwaga: import nadpisze wszystkie istniejace dane!
        </p>
        <div style={{ marginBottom: 10 }}>
          <input
            type="file"
            accept=".json"
            onChange={importFile}
            style={{ fontSize: 12 }}
          />
        </div>
        <div className="fg">
          <label>Dane JSON</label>
          <textarea
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
            placeholder='{"version":"9.0.0","config":{...},"slides":[...]}'
            style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 11 }}
          />
        </div>
        <button className="btn btn-d" onClick={importBackup} disabled={importing}>
          {importing ? 'Importowanie...' : 'Importuj (nadpisz dane)'}
        </button>
      </div>
    </div>
  );
}
