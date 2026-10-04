import React from 'react';

/**
 * CFM56-5B4 Turbofan Engine — Detailed SVG Cross-Section
 * Based on the technical drawing (designrefrence/techdraw-file.pdf):
 *   - Overall length: 3620.4mm
 *   - Fan diameter: ~Ø307.3mm reference
 *   - Stages: Fan → LPC (3 stages) → HPC (9 stages) → Combustor → HPT (1 stage) → LPT (4 stages) → Exhaust
 *
 * Each sensor station is positioned at its real physical location on the engine.
 * Clicking a zone highlights it and shows its sensor data in the strip below.
 */

// Station sensor mapping (matches C-MAPSS + feature_importance.csv)
const STATIONS = [
  {
    id: 'fan',
    label: 'Fan / Inlet',
    shortLabel: 'FAN',
    sensors: [
      { name: 'T2',  fullName: 'Total temp at fan inlet',    importance: 0 },
      { name: 'P2',  fullName: 'Total pressure at fan inlet', importance: 0 },
      { name: 'Nf',  fullName: 'Physical fan speed (rpm)',    importance: 1.71 },
      { name: 'NRf', fullName: 'Corrected fan speed',         importance: 2.30 },
      { name: 'Nf_dmd',    fullName: 'Demanded fan speed',    importance: 0 },
      { name: 'PCNfR_dmd', fullName: 'Demanded corrected fan speed', importance: 0 },
    ],
  },
  {
    id: 'lpc',
    label: 'Low-Pressure Compressor',
    shortLabel: 'LPC',
    sensors: [
      { name: 'T24', fullName: 'Total temp at LPC outlet',    importance: 3.99 },
      { name: 'BPR', fullName: 'Bypass ratio',                importance: 7.62 },
    ],
  },
  {
    id: 'hpc',
    label: 'High-Pressure Compressor',
    shortLabel: 'HPC',
    sensors: [
      { name: 'T30',  fullName: 'Total temp at HPC outlet',       importance: 2.80 },
      { name: 'P30',  fullName: 'Total pressure at HPC outlet',   importance: 9.81 },
      { name: 'Ps30', fullName: 'Static pressure at HPC outlet',  importance: 14.19 },
      { name: 'Nc',   fullName: 'Physical core speed (rpm)',       importance: 13.07 },
      { name: 'NRc',  fullName: 'Corrected core speed',            importance: 9.36 },
    ],
  },
  {
    id: 'combustor',
    label: 'Combustion Chamber',
    shortLabel: 'COMB',
    sensors: [
      { name: 'phi',     fullName: 'Fuel-air ratio',           importance: 9.30 },
      { name: 'farB',    fullName: 'Burner fuel-air ratio',    importance: 0 },
      { name: 'htBleed', fullName: 'Bleed enthalpy',           importance: 2.73 },
    ],
  },
  {
    id: 'hpt',
    label: 'High-Pressure Turbine',
    shortLabel: 'HPT',
    sensors: [
      { name: 'W31', fullName: 'HPT coolant bleed',            importance: 5.43 },
    ],
  },
  {
    id: 'lpt',
    label: 'Low-Pressure Turbine',
    shortLabel: 'LPT',
    sensors: [
      { name: 'T50', fullName: 'Total temp at LPT outlet',     importance: 11.57 },
      { name: 'W32', fullName: 'LPT coolant bleed',            importance: 6.11 },
      { name: 'P15', fullName: 'Total pressure in bypass duct', importance: 0.02 },
      { name: 'epr', fullName: 'Engine pressure ratio',         importance: 0 },
    ],
  },
];

export default function EngineCrossSection({ activeStation, onStationClick, prediction, sensorValues }) {
  const healthStage = prediction?.health_stage ?? 0;

  // Color by health for a given station
  const getStationFill = (stationId) => {
    const maxImp = STATIONS.find(s => s.id === stationId)
      ?.sensors.reduce((max, s) => Math.max(max, s.importance), 0) ?? 0;

    if (healthStage === 2) return maxImp > 8 ? '#ef4444' : '#f87171';
    if (healthStage === 1) return maxImp > 8 ? '#f59e0b' : '#fbbf24';
    return maxImp > 8 ? '#3b82f6' : '#06b6d4';
  };

  const getStationOpacity = (stationId) => activeStation === stationId ? 0.35 : 0.12;
  const getStrokeOpacity = (stationId) => activeStation === stationId ? 0.9 : 0.5;

  return (
    <svg viewBox="0 0 920 320" className="engine-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradient for the engine casing */}
        <linearGradient id="casingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.2" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Airflow arrow marker */}
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>

      {/* ======= BACKGROUND: Centerline + airflow ======= */}
      <line x1="30" y1="160" x2="890" y2="160" stroke="#334155" strokeWidth="0.5" strokeDasharray="6,4" opacity="0.4" />
      <line x1="40" y1="160" x2="880" y2="160" stroke="#475569" strokeWidth="0.8" opacity="0.2" markerEnd="url(#arrow)" />

      {/* ======= ENGINE OUTER CASING ======= */}
      {/* Upper nacelle contour */}
      <path
        d="M 60,85 C 80,60  120,42  160,38 L 310,35 C 360,34 400,40 440,48 L 530,60 C 560,65 590,70 620,75 L 690,80 C 740,83 800,88 840,95 L 870,105"
        fill="none" stroke="#475569" strokeWidth="1.5" opacity="0.5"
      />
      {/* Lower nacelle contour */}
      <path
        d="M 60,235 C 80,260  120,278  160,282 L 310,285 C 360,286 400,280 440,272 L 530,260 C 560,255 590,250 620,245 L 690,240 C 740,237 800,232 840,225 L 870,215"
        fill="none" stroke="#475569" strokeWidth="1.5" opacity="0.5"
      />

      {/* ======= FAN SECTION (Station 2) ======= */}
      <g
        className="engine-zone"
        onClick={() => onStationClick('fan')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="55" y="50" width="75" height="220" rx="4"
          fill={getStationFill('fan')} opacity={getStationOpacity('fan')}
        />
        <rect x="55" y="50" width="75" height="220" rx="4"
          fill="none" stroke={getStationFill('fan')} strokeWidth="1.2" opacity={getStrokeOpacity('fan')}
        />
        {/* Spinner / nose cone */}
        <path d="M 45,160 L 65,140 L 65,180 Z" fill="#334155" opacity="0.6" />
        {/* Fan blades (simplified) */}
        {[70, 80, 90, 100, 108, 116].map((x, i) => (
          <line key={`fb-${i}`} x1={x} y1="55" x2={x} y2="265"
            stroke={getStationFill('fan')} strokeWidth="1" opacity="0.35"
          />
        ))}
        {/* Label */}
        <text x="92" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">FAN</text>
        {/* Sensor dot */}
        <circle cx="92" cy="42" r="3" fill={getStationFill('fan')} filter="url(#glow)" />
      </g>

      {/* ======= LPC SECTION (Station 24) — 3 Booster stages ======= */}
      <g
        className="engine-zone"
        onClick={() => onStationClick('lpc')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="140" y="72" width="80" height="176" rx="4"
          fill={getStationFill('lpc')} opacity={getStationOpacity('lpc')}
        />
        <rect x="140" y="72" width="80" height="176" rx="4"
          fill="none" stroke={getStationFill('lpc')} strokeWidth="1.2" opacity={getStrokeOpacity('lpc')}
        />
        {/* 3 compressor stage lines */}
        {[155, 170, 185].map((x, i) => (
          <line key={`lpc-${i}`} x1={x} y1="78" x2={x} y2="242"
            stroke={getStationFill('lpc')} strokeWidth="1.5" opacity="0.3"
          />
        ))}
        {/* Tapering stator vanes */}
        {[155, 170, 185].map((x, i) => (
          <React.Fragment key={`lpcv-${i}`}>
            <line x1={x} y1={80 + i*3} x2={x+10} y2={82 + i*3}
              stroke={getStationFill('lpc')} strokeWidth="0.8" opacity="0.5" />
            <line x1={x} y1={240 - i*3} x2={x+10} y2={238 - i*3}
              stroke={getStationFill('lpc')} strokeWidth="0.8" opacity="0.5" />
          </React.Fragment>
        ))}
        <text x="180" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">LPC</text>
        <circle cx="180" cy="42" r="3" fill={getStationFill('lpc')} filter="url(#glow)" />
      </g>

      {/* ======= HPC SECTION (Station 30) — 9 stages, tapered annulus ======= */}
      <g
        className="engine-zone"
        onClick={() => onStationClick('hpc')}
        style={{ cursor: 'pointer' }}
      >
        {/* Tapered casing shape */}
        <path
          d="M 230,72 L 420,95 L 420,225 L 230,248 Z"
          fill={getStationFill('hpc')} opacity={getStationOpacity('hpc')}
        />
        <path
          d="M 230,72 L 420,95 L 420,225 L 230,248 Z"
          fill="none" stroke={getStationFill('hpc')} strokeWidth="1.2" opacity={getStrokeOpacity('hpc')}
        />
        {/* 9 compressor stage lines within tapered casing */}
        {Array.from({length: 9}, (_, i) => {
          const x = 240 + i * 20;
          const shrink = i * 2.5;
          return (
            <line key={`hpc-${i}`}
              x1={x} y1={76 + shrink} x2={x} y2={244 - shrink}
              stroke={getStationFill('hpc')} strokeWidth="1.2" opacity="0.25"
            />
          );
        })}
        <text x="325" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">HPC</text>
        <circle cx="325" cy="42" r="3" fill={getStationFill('hpc')} filter="url(#glow)" />
        {/* Importance highlight — HPC is most critical */}
        <text x="325" y="305" textAnchor="middle" fill={getStationFill('hpc')} fontSize="9" fontWeight="500" opacity="0.7">
          46.4% importance
        </text>
      </g>

      {/* ======= COMBUSTOR (Station 31) — Annular chamber ======= */}
      <g
        className="engine-zone"
        onClick={() => onStationClick('combustor')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="430" y="100" width="70" height="120" rx="6"
          fill={getStationFill('combustor')} opacity={getStationOpacity('combustor')}
        />
        <rect x="430" y="100" width="70" height="120" rx="6"
          fill="none" stroke={getStationFill('combustor')} strokeWidth="1.2" opacity={getStrokeOpacity('combustor')}
        />
        {/* Flame indicators */}
        <path d="M 455,140 Q 460,130 465,140 Q 460,145 455,140" fill="#f59e0b" opacity="0.4" />
        <path d="M 470,150 Q 475,138 480,150 Q 475,156 470,150" fill="#f59e0b" opacity="0.3" />
        <path d="M 448,155 Q 453,143 458,155 Q 453,161 448,155" fill="#f59e0b" opacity="0.35" />
        {/* Fuel injector dots */}
        {[110, 130, 150, 170, 190, 210].map((y, i) => (
          <circle key={`inj-${i}`} cx="432" cy={y} r="2" fill="#f59e0b" opacity="0.5" />
        ))}
        <text x="465" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">COMB</text>
        <circle cx="465" cy="42" r="3" fill={getStationFill('combustor')} filter="url(#glow)" />
      </g>

      {/* ======= HPT SECTION (Station 41) — 1 stage ======= */}
      <g
        className="engine-zone"
        onClick={() => onStationClick('hpt')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="510" y="95" width="55" height="130" rx="4"
          fill={getStationFill('hpt')} opacity={getStationOpacity('hpt')}
        />
        <rect x="510" y="95" width="55" height="130" rx="4"
          fill="none" stroke={getStationFill('hpt')} strokeWidth="1.2" opacity={getStrokeOpacity('hpt')}
        />
        {/* Single turbine stage */}
        <line x1="535" y1="100" x2="535" y2="220" stroke={getStationFill('hpt')} strokeWidth="2" opacity="0.35" />
        <text x="537" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">HPT</text>
        <circle cx="537" cy="42" r="3" fill={getStationFill('hpt')} filter="url(#glow)" />
      </g>

      {/* ======= LPT SECTION (Station 50) — 4 stages expanding ======= */}
      <g
        className="engine-zone"
        onClick={() => onStationClick('lpt')}
        style={{ cursor: 'pointer' }}
      >
        <path
          d="M 575,90 L 740,75 L 740,245 L 575,230 Z"
          fill={getStationFill('lpt')} opacity={getStationOpacity('lpt')}
        />
        <path
          d="M 575,90 L 740,75 L 740,245 L 575,230 Z"
          fill="none" stroke={getStationFill('lpt')} strokeWidth="1.2" opacity={getStrokeOpacity('lpt')}
        />
        {/* 4 turbine stage blades — expanding annulus */}
        {Array.from({length: 4}, (_, i) => {
          const x = 590 + i * 36;
          const expand = i * 3;
          return (
            <line key={`lpt-${i}`}
              x1={x} y1={92 - expand} x2={x} y2={228 + expand}
              stroke={getStationFill('lpt')} strokeWidth="2" opacity="0.3"
            />
          );
        })}
        <text x="657" y="30" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">LPT</text>
        <circle cx="657" cy="42" r="3" fill={getStationFill('lpt')} filter="url(#glow)" />
      </g>

      {/* ======= EXHAUST NOZZLE ======= */}
      <path d="M 745,75 L 790,90 L 790,230 L 745,245" fill="none" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <path d="M 790,100 L 820,115 L 820,205 L 790,220" fill="none" stroke="#475569" strokeWidth="1" opacity="0.3" />
      {/* Exhaust plume */}
      <path d="M 820,130 Q 870,160 820,190" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.15" />
      <path d="M 820,140 Q 860,160 820,180" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.1" />

      {/* ======= DUAL SHAFTS ======= */}
      {/* LP shaft (inner, runs from fan to LPT) */}
      <line x1="92" y1="160" x2="720" y2="160"
        stroke="#64748b" strokeWidth="2" opacity="0.25" />
      {/* HP shaft (outer, runs from HPC to HPT) */}
      <line x1="230" y1="155" x2="560" y2="155"
        stroke="#94a3b8" strokeWidth="3" opacity="0.15" />
      <line x1="230" y1="165" x2="560" y2="165"
        stroke="#94a3b8" strokeWidth="3" opacity="0.15" />

      {/* ======= DIMENSION LINE (from tech drawing: 3620.4mm) ======= */}
      <line x1="55" y1="15" x2="790" y2="15" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" />
      <line x1="55" y1="10" x2="55" y2="20" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" />
      <line x1="790" y1="10" x2="790" y2="20" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" />
      <text x="422" y="12" textAnchor="middle" fill="#3b82f6" fontSize="9" opacity="0.6"
        fontFamily="'JetBrains Mono', monospace">3620.4 mm</text>
    </svg>
  );
}

export { STATIONS };
