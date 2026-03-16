import React, { useState } from 'react';

export default function LivePreview() {
  const [key, setKey] = useState(0);
  const tvUrl = '/api/screen/main';

  return (
    <div className="preview-pane">
      <div className="preview-bar">
        <div className="dot"></div>
        <span className="lbl">Podglad TV</span>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-s btn-sm"
          onClick={() => setKey(k => k + 1)}
        >
          Odswiez
        </button>
      </div>
      <iframe
        key={key}
        className="preview-frame"
        src={`/tv-preview.html?t=${Date.now()}`}
        title="TV Preview"
      />
    </div>
  );
}
