// MaintenanceScheduler.jsx — Cost-aware maintenance recommendation

const THRESHOLD = 122; // cycles (matches Python scheduler adaptive threshold)

export default function MaintenanceScheduler({ rul, healthStage, isAnomalous }) {
  const needsMaintenance = rul < THRESHOLD || isAnomalous;
  const urgency = rul < 30 ? 'IMMEDIATE' : rul < 60 ? 'HIGH' : rul < THRESHOLD ? 'MEDIUM' : null;
  const urgencyColor = { IMMEDIATE: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b' };

  const falseAlarmCost = 1000;
  const missedFailureCost = 10000;
  const costSavings = '17.0%';

  // Simulate maintenance window (in a real system this would come from a calendar API)
  const now = new Date();
  const windowStart = new Date(now.getTime() + (rul * 8 * 60 * 60 * 1000)); // 8h per cycle
  const windowEnd   = new Date(windowStart.getTime() + 90 * 60 * 1000);     // 90 min window
  const fmt = d => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Maintenance Planner
      </h3>

      {!needsMaintenance ? (
        <div style={{ padding: '12px', borderRadius: '8px', background: '#10b98111', border: '1px solid #10b98133' }}>
          <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>No action required</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: 4 }}>Next recommended check at RUL ≤ {THRESHOLD} cycles</div>
        </div>
      ) : (
        <>
          {/* Urgency badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px',
            background: `${urgencyColor[urgency]}22`, border: `1px solid ${urgencyColor[urgency]}55` }}>
            <span style={{ fontSize: '18px' }}>🔧</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: urgencyColor[urgency] }}>{urgency} MAINTENANCE</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {urgency === 'IMMEDIATE' ? 'Remove from service immediately' :
                 urgency === 'HIGH' ? 'Schedule within next 10 cycles' :
                 'Schedule within next 30 cycles'}
              </div>
            </div>
          </div>

          {/* Recommended window */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 6 }}>RECOMMENDED WINDOW</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: '#7dd3fc' }}>
              {fmt(windowStart)} — {fmt(windowEnd)}
            </div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: 4 }}>~{rul} cycles ({rul * 8}h) from now</div>
          </div>
        </>
      )}

      {/* Cost summary */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { label: 'False Alarm Cost', value: `$${falseAlarmCost.toLocaleString()}` },
          { label: 'Missed Failure', value: `$${missedFailureCost.toLocaleString()}` },
          { label: 'Fleet Savings', value: costSavings, highlight: true },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: item.highlight ? '#10b981' : '#e2e8f0' }}>{item.value}</div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: 3 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
