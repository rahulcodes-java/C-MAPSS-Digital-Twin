// EngineVisualization.jsx
// 2D SVG turbofan engine diagram with 4 zones color-coded by health stage.

const ZONE_COLORS = {
  healthy:   { fill: '#10b981', glow: '#10b981', label: 'Healthy' },
  degrading: { fill: '#f59e0b', glow: '#f59e0b', label: 'Degrading' },
  critical:  { fill: '#ef4444', glow: '#ef4444', label: 'Critical' },
};

function ZoneBadge({ label, status }) {
  const colors = ZONE_COLORS[status] || ZONE_COLORS.healthy;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '20px',
      background: `${colors.fill}22`, border: `1px solid ${colors.fill}55`,
      fontSize: '11px', fontWeight: 600, color: colors.fill,
      textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.fill, display: 'inline-block' }} />
      {label}
    </div>
  );
}

export default function EngineVisualization({ zoneHealth, healthStage }) {
  const zh = zoneHealth || { fan: 'healthy', compressor: 'healthy', turbine: 'healthy', nozzle: 'healthy' };
  const fanColor      = ZONE_COLORS[zh.fan]?.fill      || '#10b981';
  const compColor     = ZONE_COLORS[zh.compressor]?.fill || '#10b981';
  const turbColor     = ZONE_COLORS[zh.turbine]?.fill    || '#10b981';
  const nozzleColor   = ZONE_COLORS[zh.nozzle]?.fill     || '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* SVG Engine Diagram */}
      <svg viewBox="0 0 540 180" style={{ width: '100%', filter: 'drop-shadow(0 4px 24px #0008)' }}>
        <defs>
          {['fan','comp','turb','nozzle'].map((id, i) => {
            const colors = [fanColor, compColor, turbColor, nozzleColor];
            return (
              <radialGradient key={id} id={`grad-${id}`} cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor={colors[i]} stopOpacity="0.5" />
                <stop offset="100%" stopColor={colors[i]} stopOpacity="0.08" />
              </radialGradient>
            );
          })}
        </defs>

        {/* Engine body outline */}
        <rect x="5" y="35" width="530" height="110" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

        {/* Fan (leftmost) */}
        <rect x="12" y="38" width="100" height="104" rx="8" fill={`url(#grad-fan)`} stroke={fanColor} strokeWidth="1.5" />
        <text x="62" y="91" textAnchor="middle" fill={fanColor} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">FAN</text>
        <text x="62" y="106" textAnchor="middle" fill={fanColor} fontSize="9" fontFamily="Inter,sans-serif" opacity="0.7">{zh.fan.toUpperCase()}</text>
        {/* Fan blades */}
        {[55, 70, 85, 100, 115, 130].map(y => (
          <line key={y} x1="30" y1={y} x2="105" y2={y} stroke={fanColor} strokeWidth="0.7" opacity="0.3" />
        ))}

        {/* Compressor */}
        <rect x="118" y="45" width="130" height="90" rx="6" fill={`url(#grad-comp)`} stroke={compColor} strokeWidth="1.5" />
        <text x="183" y="91" textAnchor="middle" fill={compColor} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">COMPRESSOR</text>
        <text x="183" y="106" textAnchor="middle" fill={compColor} fontSize="9" fontFamily="Inter,sans-serif" opacity="0.7">{zh.compressor.toUpperCase()}</text>
        {[60, 75, 90, 105, 120].map(y => (
          <line key={y} x1="122" y1={y} x2="245" y2={y} stroke={compColor} strokeWidth="0.7" opacity="0.3" />
        ))}

        {/* Turbine */}
        <rect x="254" y="45" width="150" height="90" rx="6" fill={`url(#grad-turb)`} stroke={turbColor} strokeWidth="1.5" />
        <text x="329" y="91" textAnchor="middle" fill={turbColor} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">TURBINE</text>
        <text x="329" y="106" textAnchor="middle" fill={turbColor} fontSize="9" fontFamily="Inter,sans-serif" opacity="0.7">{zh.turbine.toUpperCase()}</text>
        {[60, 75, 90, 105, 120].map(y => (
          <line key={y} x1="258" y1={y} x2="400" y2={y} stroke={turbColor} strokeWidth="0.7" opacity="0.3" />
        ))}

        {/* Nozzle */}
        <path d="M410,52 L525,68 L525,112 L410,128 Z" fill={`url(#grad-nozzle)`} stroke={nozzleColor} strokeWidth="1.5" />
        <text x="468" y="91" textAnchor="middle" fill={nozzleColor} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">NOZZLE</text>
        <text x="468" y="106" textAnchor="middle" fill={nozzleColor} fontSize="9" fontFamily="Inter,sans-serif" opacity="0.7">{zh.nozzle.toUpperCase()}</text>

        {/* Airflow arrow */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
          </marker>
        </defs>
        <line x1="2" y1="90" x2="10" y2="90" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

        {/* Labels */}
        <text x="270" y="172" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Inter,sans-serif">Air Flow Direction →</text>
      </svg>

      {/* Zone status badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <ZoneBadge label="Fan" status={zh.fan} />
        <ZoneBadge label="Compressor" status={zh.compressor} />
        <ZoneBadge label="Turbine" status={zh.turbine} />
        <ZoneBadge label="Nozzle" status={zh.nozzle} />
      </div>
    </div>
  );
}
