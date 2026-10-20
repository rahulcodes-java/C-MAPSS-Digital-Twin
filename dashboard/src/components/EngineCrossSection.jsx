import React from 'react';

/**
 * EngineCrossSection.jsx
 * Simplified, Intuitive 2D Turbofan Engine Cross-Section
 * Cleanly highlights the 4 main engine zones:
 * 1. Fan & Air Inlet
 * 2. Low-Pressure Booster (LPC)
 * 3. High-Pressure Compressor (HPC) — Primary failure zone in FD001 dataset
 * 4. Combustor
 * 5. High & Low Pressure Turbines
 */

export const STATIONS = [
  {
    id: 'fan',
    label: 'Fan & Air Inlet',
    shortLabel: 'FAN / INLET',
    desc: 'Bypasses majority of air around engine core (5.7:1 Bypass Ratio)',
    sensors: [
      { name: 'Nf',  fullName: 'Fan Rotor Speed (N1)', unit: 'rpm', importance: 2.3 },
      { name: 'T2',  fullName: 'Inlet Total Temperature', unit: '°R', importance: 0 },
      { name: 'P2',  fullName: 'Inlet Total Pressure', unit: 'psia', importance: 0 },
    ],
  },
  {
    id: 'lpc',
    label: 'Low-Pressure Compressor',
    shortLabel: 'LPC BOOSTER',
    desc: 'Pre-compresses core airflow before High-Pressure Compressor',
    sensors: [
      { name: 'T24', fullName: 'LPC Exit Temperature', unit: '°R', importance: 4.0 },
      { name: 'BPR', fullName: 'Bypass Ratio', unit: 'ratio', importance: 7.6 },
    ],
  },
  {
    id: 'hpc',
    label: 'High-Pressure Compressor',
    shortLabel: 'COMPRESSOR (HPC)',
    desc: 'Primary degradation zone in C-MAPSS FD001 (Blade tip clearance erosion)',
    sensors: [
      { name: 'Ps30', fullName: 'HPC Static Pressure (Top Driver)', unit: 'psia', importance: 56.0 },
      { name: 'Nc',   fullName: 'Core Spool Speed (N2)', unit: 'rpm', importance: 16.6 },
      { name: 'T30',  fullName: 'HPC Outlet Temperature', unit: '°R', importance: 2.8 },
      { name: 'P30',  fullName: 'HPC Total Pressure', unit: 'psia', importance: 9.8 },
    ],
  },
  {
    id: 'combustor',
    label: 'Combustion Chamber',
    shortLabel: 'COMBUSTOR',
    desc: 'Mixes compressed air with fuel to generate high-energy gas stream',
    sensors: [
      { name: 'phi',  fullName: 'Fuel-to-Air Ratio', unit: 'ratio', importance: 5.2 },
      { name: 'farB', fullName: 'Burner Fuel Ratio', unit: 'ratio', importance: 0 },
    ],
  },
  {
    id: 'turbine',
    label: 'Turbine Stages (HPT / LPT)',
    shortLabel: 'TURBINES (EGT)',
    desc: 'Extracts energy to drive compressor; monitors Exhaust Gas Temp (EGT)',
    sensors: [
      { name: 'T50', fullName: 'Exhaust Gas Temp (EGT)', unit: '°R', importance: 6.0 },
      { name: 'W31', fullName: 'HPT Coolant Bleed Flow', unit: 'lbm/s', importance: 5.4 },
      { name: 'W32', fullName: 'LPT Coolant Bleed Flow', unit: 'lbm/s', importance: 6.1 },
    ],
  },
];

export default function EngineCrossSection({ activeStation, onStationClick, prediction, sensorValues }) {
  const healthStage = prediction?.health_stage ?? 0;

  // Colors based on stage
  const getStationColor = (stationId) => {
    const isDegradedZone = stationId === 'hpc';
    if (healthStage === 2) {
      return isDegradedZone ? '#ef4444' : '#64748b';
    }
    if (healthStage === 1) {
      return isDegradedZone ? '#f59e0b' : '#38bdf8';
    }
    return '#38bdf8';
  };

  const isStationActive = (id) => activeStation === id;

  const currentStationInfo = STATIONS.find(s => s.id === activeStation) || STATIONS[2];

  return (
    <div className="engine-schematic-wrapper">
      {/* Top Banner explaining degradation to examiners */}
      <div className="engine-status-header">
        <div className="engine-info-pill">
          <span className="dot" style={{
            background: healthStage === 2 ? 'var(--critical)' : healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)'
          }} />
          <span className="bold">Turbofan Cross-Section View</span>
          <span className="sub">— Click any section to inspect sensors</span>
        </div>
        <div className="engine-wear-alert">
          {healthStage === 2 ? (
            <span className="wear-crit">🔴 Critical Failure: High-Pressure Compressor (HPC) Blade Redline</span>
          ) : healthStage === 1 ? (
            <span className="wear-warn">⚠ Warning: High-Pressure Compressor (HPC) Blade Erosion Detected</span>
          ) : (
            <span className="wear-norm">✓ All Engine Sections Operating Within Normal Tolerances</span>
          )}
        </div>
      </div>

      {/* Clean 2D Vector Schematic */}
      <svg viewBox="0 0 900 240" className="engine-svg-simple" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="healthyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
            <stop offset="100%" stopColor="rgba(14, 165, 233, 0.25)" />
          </linearGradient>
          <linearGradient id="warnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.2)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0.35)" />
          </linearGradient>
          <linearGradient id="critGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.25)" />
            <stop offset="100%" stopColor="rgba(185, 28, 28, 0.45)" />
          </linearGradient>
        </defs>

        {/* Engine Rotational Centerline */}
        <line x1="30" y1="120" x2="870" y2="120" stroke="#334155" strokeWidth="1" strokeDasharray="8,4,2,4" />
        <text x="35" y="115" fill="#475569" fontSize="8" fontFamily="'JetBrains Mono', monospace">CENTERLINE [CL]</text>

        {/* Outer Engine Nacelle Contours */}
        <path d="M 60,70 Q 150,30 300,28 L 520,35 Q 700,50 840,90" fill="none" stroke="#334155" strokeWidth="2" />
        <path d="M 60,170 Q 150,210 300,212 L 520,205 Q 700,190 840,150" fill="none" stroke="#334155" strokeWidth="2" />

        {/* 1. FAN SECTION */}
        <g
          className={`engine-zone ${isStationActive('fan') ? 'active-zone' : ''}`}
          onClick={() => onStationClick('fan')}
          style={{ cursor: 'pointer' }}
        >
          <rect x="60" y="42" width="75" height="156" rx="4"
            fill={isStationActive('fan') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)'}
            stroke={isStationActive('fan') ? '#38bdf8' : '#1e293b'}
            strokeWidth={isStationActive('fan') ? 2 : 1}
          />
          {/* Fan Nose Cone */}
          <polygon points="45,120 60,105 60,135" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Fan Blades */}
          {[72, 85, 98, 112].map((x, i) => (
            <line key={`f-${i}`} x1={x} y1="46" x2={x} y2="194" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
          ))}
          <text x="97" y="32" textAnchor="middle" fill={isStationActive('fan') ? '#38bdf8' : '#94a3b8'}
            fontSize="10" fontWeight="bold">1. FAN</text>
        </g>

        {/* 2. LPC / BOOSTER */}
        <g
          className={`engine-zone ${isStationActive('lpc') ? 'active-zone' : ''}`}
          onClick={() => onStationClick('lpc')}
          style={{ cursor: 'pointer' }}
        >
          <rect x="145" y="58" width="75" height="124" rx="4"
            fill={isStationActive('lpc') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)'}
            stroke={isStationActive('lpc') ? '#38bdf8' : '#1e293b'}
            strokeWidth={isStationActive('lpc') ? 2 : 1}
          />
          {[160, 180, 200].map((x, i) => (
            <line key={`lpc-${i}`} x1={x} y1="62" x2={x} y2="178" stroke="#38bdf8" strokeWidth="1.5" opacity="0.5" />
          ))}
          <text x="182" y="32" textAnchor="middle" fill={isStationActive('lpc') ? '#38bdf8' : '#94a3b8'}
            fontSize="10" fontWeight="bold">2. LPC</text>
        </g>

        {/* 3. HIGH-PRESSURE COMPRESSOR (HPC) - PRIMARY WEAR ZONE */}
        <g
          className={`engine-zone ${isStationActive('hpc') ? 'active-zone' : ''}`}
          onClick={() => onStationClick('hpc')}
          style={{ cursor: 'pointer' }}
        >
          {/* Tapered compression casing */}
          <path
            d="M 230,62 L 430,78 L 430,162 L 230,178 Z"
            fill={
              healthStage === 2
                ? 'url(#critGrad)'
                : healthStage === 1
                ? 'url(#warnGrad)'
                : isStationActive('hpc')
                ? 'rgba(56, 189, 248, 0.25)'
                : 'rgba(15, 23, 42, 0.6)'
            }
            stroke={
              healthStage === 2
                ? '#ef4444'
                : healthStage === 1
                ? '#f59e0b'
                : isStationActive('hpc')
                ? '#38bdf8'
                : '#1e293b'
            }
            strokeWidth={isStationActive('hpc') || healthStage > 0 ? 2.5 : 1}
          />
          {/* Compressor blade stages */}
          {Array.from({length: 8}, (_, i) => {
            const x = 245 + i * 23;
            const shrink = i * 2.2;
            return (
              <line key={`hpc-${i}`}
                x1={x} y1={66 + shrink} x2={x} y2={174 - shrink}
                stroke={healthStage === 2 ? '#ef4444' : healthStage === 1 ? '#f59e0b' : '#38bdf8'}
                strokeWidth="1.8" opacity="0.7"
              />
            );
          })}
          <text x="330" y="32" textAnchor="middle"
            fill={healthStage === 2 ? '#ef4444' : healthStage === 1 ? '#f59e0b' : '#38bdf8'}
            fontSize="10" fontWeight="bold">
            3. COMPRESSOR (HPC) {healthStage > 0 ? '⚠ WEAR ZONE' : ''}
          </text>
        </g>

        {/* 4. COMBUSTOR */}
        <g
          className={`engine-zone ${isStationActive('combustor') ? 'active-zone' : ''}`}
          onClick={() => onStationClick('combustor')}
          style={{ cursor: 'pointer' }}
        >
          <rect x="440" y="78" width="85" height="84" rx="4"
            fill={isStationActive('combustor') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)'}
            stroke={isStationActive('combustor') ? '#38bdf8' : '#1e293b'}
            strokeWidth={isStationActive('combustor') ? 2 : 1}
          />
          {/* Flame burner nozzles */}
          <circle cx="470" cy="100" r="4" fill="#f59e0b" />
          <circle cx="470" cy="140" r="4" fill="#f59e0b" />
          <path d="M 474,100 Q 490,95 505,100" fill="none" stroke="#f97316" strokeWidth="1.5" />
          <path d="M 474,140 Q 490,135 505,140" fill="none" stroke="#f97316" strokeWidth="1.5" />
          <text x="482" y="32" textAnchor="middle" fill={isStationActive('combustor') ? '#38bdf8' : '#94a3b8'}
            fontSize="10" fontWeight="bold">4. COMBUSTOR</text>
        </g>

        {/* 5. TURBINES (HPT + LPT) */}
        <g
          className={`engine-zone ${isStationActive('turbine') ? 'active-zone' : ''}`}
          onClick={() => onStationClick('turbine')}
          style={{ cursor: 'pointer' }}
        >
          <path
            d="M 535,78 L 740,65 L 740,175 L 535,162 Z"
            fill={isStationActive('turbine') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)'}
            stroke={isStationActive('turbine') ? '#38bdf8' : '#1e293b'}
            strokeWidth={isStationActive('turbine') ? 2 : 1}
          />
          {[555, 595, 640, 685].map((x, i) => (
            <line key={`turb-${i}`} x1={x} y1="74" x2={x} y2="166" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />
          ))}
          <text x="635" y="32" textAnchor="middle" fill={isStationActive('turbine') ? '#38bdf8' : '#94a3b8'}
            fontSize="10" fontWeight="bold">5. TURBINES (EGT)</text>
        </g>

        {/* Core Exhaust Plug */}
        <polygon points="740,90 840,120 740,150" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
      </svg>

      {/* Selected Station Detail Bar */}
      <div className="selected-station-card">
        <div className="station-card-left">
          <span className="station-badge">SELECTED: {currentStationInfo.shortLabel}</span>
          <span className="station-desc">{currentStationInfo.desc}</span>
        </div>
        <div className="station-sensors-chips">
          {currentStationInfo.sensors.map(s => (
            <span key={s.name} className="sensor-chip">
              <b>{s.name}</b>: {s.fullName} ({s.unit})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
