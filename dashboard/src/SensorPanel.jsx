// SensorPanel.jsx — Top sensors driving the health prediction

const IMPORTANCE_BAR_MAX = 0.25; // max expected importance (sensor_15 = ~0.224)

export default function SensorPanel({ topSensors, importanceScores, sensorValues }) {
  const sensors = topSensors || [];
  const scores = importanceScores || [];
  const values = sensorValues || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Top Failure Drivers
      </h3>

      {sensors.length === 0 && (
        <p style={{ color: '#475569', fontSize: '13px' }}>No sensor data available.</p>
      )}

      {sensors.map((sensor, i) => {
        const score = scores[i] || 0;
        const pct = Math.min((score / IMPORTANCE_BAR_MAX) * 100, 100);
        const rawVal = values[sensor];
        const displayVal = rawVal != null ? rawVal.toFixed(3) : '—';
        const barColor = score > 0.15 ? '#ef4444' : score > 0.08 ? '#f59e0b' : '#10b981';

        return (
          <div key={sensor} style={{ background: '#0f172a', borderRadius: '8px', padding: '10px 14px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>
                {sensor.replace('_', ' ').toUpperCase()}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>val: </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#7dd3fc' }}>{displayVal}</span>
              </div>
            </div>
            {/* Importance bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: '11px', color: barColor, minWidth: '36px', textAlign: 'right', fontWeight: 600 }}>
                {(score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
