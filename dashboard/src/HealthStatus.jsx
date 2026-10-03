// HealthStatus.jsx — RUL countdown, confidence indicator, and health stage badge

const STAGE_CONFIG = {
  0: { label: 'HEALTHY',   color: '#10b981', bg: '#10b98122', desc: 'Engine operating normally. No immediate action required.' },
  1: { label: 'DEGRADING', color: '#f59e0b', bg: '#f59e0b22', desc: 'Performance decline detected. Schedule maintenance soon.' },
  2: { label: 'CRITICAL',  color: '#ef4444', bg: '#ef444422', desc: 'Severe degradation detected. Immediate maintenance required.' },
};

function ConfidenceRing({ confidence }) {
  const pct = Math.round(confidence * 100);
  const circumference = 2 * Math.PI * 22;
  const dash = (pct / 100) * circumference;
  const color = pct >= 85 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: 60, height: 60 }}>
      <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="30" cy="30" r="22" fill="none" stroke="#1e293b" strokeWidth="5" />
        <circle cx="30" cy="30" r="22" fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace"
      }}>{pct}%</span>
    </div>
  );
}

export default function HealthStatus({ healthStage, rul, confidence, maxCycles }) {
  const stage = STAGE_CONFIG[healthStage] || STAGE_CONFIG[0];
  const rulPct = maxCycles ? Math.max(0, (rul / maxCycles) * 100) : 0;
  const rulColor = rul > 100 ? '#10b981' : rul > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Stage Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: stage.bg, border: `1px solid ${stage.color}44` }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color, boxShadow: `0 0 8px ${stage.color}` }} />
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: stage.color, letterSpacing: '0.06em' }}>{stage.label}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>{stage.desc}</div>
        </div>
      </div>

      {/* RUL + Confidence */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* RUL Countdown */}
        <div style={{ flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>RUL Remaining</div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: rulColor, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>
            {rul ?? '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: 4 }}>cycles until maintenance</div>
          {/* RUL bar */}
          <div style={{ marginTop: 10, height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${rulPct}%`, height: '100%', background: rulColor, borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Confidence */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confidence</div>
          <ConfidenceRing confidence={confidence || 0} />
        </div>
      </div>
    </div>
  );
}
