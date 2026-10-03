// ReplaySlider.jsx — Timeline scrubber to replay engine lifecycle

export default function ReplaySlider({ cycle, maxCycles, onChange, isPlaying, onTogglePlay }) {
  const pct = maxCycles ? (cycle / maxCycles) * 100 : 0;

  // colour the track segments
  const healthyEnd  = 100 - (100 / maxCycles) * 30;   // last 30 cycles = critical
  const degradeEnd  = 100 - (100 / maxCycles) * 100;  // last 100 cycles = degrading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Engine Lifecycle Timeline
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: '#e2e8f0' }}>
            Cycle {cycle} / {maxCycles}
          </span>
          <button
            onClick={onTogglePlay}
            style={{
              padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: isPlaying ? '#ef444433' : '#10b98133',
              color: isPlaying ? '#ef4444' : '#10b981',
              fontSize: '12px', fontWeight: 600
            }}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Track with coloured zones */}
      <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
        {/* Zone background */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${degradeEnd}%`, background: '#10b981', opacity: 0.4 }} />
          <div style={{ width: `${healthyEnd - degradeEnd}%`, background: '#f59e0b', opacity: 0.4 }} />
          <div style={{ width: `${100 - healthyEnd}%`, background: '#ef4444', opacity: 0.5 }} />
        </div>

        {/* Range input */}
        <input
          type="range"
          min={1}
          max={maxCycles}
          value={cycle}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'relative', width: '100%', zIndex: 2,
            accentColor: pct > healthyEnd ? '#ef4444' : pct > degradeEnd ? '#f59e0b' : '#10b981',
            cursor: 'pointer', background: 'transparent'
          }}
        />
      </div>

      {/* Zone labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569' }}>
        <span style={{ color: '#10b981' }}>● Healthy</span>
        <span style={{ color: '#f59e0b' }}>● Degrading</span>
        <span style={{ color: '#ef4444' }}>● Critical</span>
      </div>
    </div>
  );
}
