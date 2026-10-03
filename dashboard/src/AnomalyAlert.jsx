// AnomalyAlert.jsx — Pulsing red warning box when engine is anomalous

import { useEffect, useState } from 'react';

export default function AnomalyAlert({ isAnomalous, rul }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!isAnomalous) return;
    const t = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(t);
  }, [isAnomalous]);

  if (!isAnomalous) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: '#10b98111', border: '1px solid #10b98133' }}>
        <span style={{ fontSize: '18px' }}>✅</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>No Anomaly Detected</div>
          <div style={{ fontSize: '11px', color: '#475569' }}>Engine pattern within normal operating range</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
      borderRadius: '10px', background: '#ef444422',
      border: `1px solid ${pulse ? '#ef4444' : '#ef444488'}`,
      boxShadow: pulse ? '0 0 20px #ef444444' : '0 0 4px #ef444422',
      transition: 'all 0.4s ease'
    }}>
      <span style={{ fontSize: '22px', animation: 'none' }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.04em' }}>
          ANOMALY DETECTED
        </div>
        <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: 3 }}>
          Unusual sensor pattern detected — not consistent with normal degradation curve
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444', fontFamily: "'JetBrains Mono',monospace" }}>
          {rul}
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>cycles left</div>
      </div>
    </div>
  );
}
