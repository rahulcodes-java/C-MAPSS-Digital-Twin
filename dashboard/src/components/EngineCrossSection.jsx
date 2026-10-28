import React, { useState } from 'react';

/**
 * EngineCrossSection.jsx
 * High-Fidelity Aerospace Digital Twin Cross-Section for CFM56-5B4 Turbofan.
 * Features:
 * - Precision dual-spool architectural cutaway (N1 LP shaft + N2 HP spool)
 * - Titanium aerodynamic curved fan blades + spinner with swirl line
 * - 3-stage LPC Booster and 9-stage tapered HPC compressor rotor/stators
 * - Annular combustion chamber with dual fuel swirler injectors & flame glow
 * - 1-stage HPT and 4-stage LPT expanding turbine stages
 * - Integrated mechanical bearings (#1, #2, #3, #4) & exhaust centerbody
 * - Dynamic sensor tap probes (T2, T24, Ps30, phi, T50) with live values
 * - Dynamic failure location detection (HPC, Combustor, Turbine, LPC)
 */

export const STATIONS = [
  {
    id: 'fan',
    label: 'Fan & Air Intake',
    shortLabel: 'FAN / INLET',
    stationCode: 'STA 1.0',
    desc: 'Wide-chord titanium fan generates 80%+ of total takeoff thrust through 5.7:1 cold bypass ratio.',
    sensors: [
      { name: 'Nf',  fullName: 'Fan Speed (N1)', unit: 'rpm', nominal: 2388.1 },
      { name: 'T2',  fullName: 'Inlet Total Temp', unit: '°R', nominal: 518.7 },
      { name: 'P2',  fullName: 'Inlet Total Pressure', unit: 'psia', nominal: 14.62 },
    ],
  },
  {
    id: 'lpc',
    label: 'Low-Pressure Booster (LPC)',
    shortLabel: 'LPC BOOSTER',
    stationCode: 'STA 2.5',
    desc: '3-stage booster pre-compresses core intake air before High-Pressure Compressor inlet.',
    sensors: [
      { name: 'T24', fullName: 'LPC Exit Temp', unit: '°R', nominal: 642.4 },
      { name: 'BPR', fullName: 'Bypass Ratio', unit: 'ratio', nominal: 8.42 },
    ],
  },
  {
    id: 'hpc',
    label: 'High-Pressure Compressor (HPC)',
    shortLabel: 'COMPRESSOR (HPC)',
    stationCode: 'STA 3.0',
    desc: '9-stage axial compressor drum. Primary wear zone for blade tip erosion and seal leakage in C-MAPSS.',
    sensors: [
      { name: 'Ps30', fullName: 'HPC Static Pressure (Top Driver)', unit: 'psia', nominal: 47.35 },
      { name: 'Nc',   fullName: 'Core Spool Speed (N2)', unit: 'rpm', nominal: 9056.0 },
      { name: 'T30',  fullName: 'HPC Discharge Temp', unit: '°R', nominal: 1586.8 },
      { name: 'P30',  fullName: 'HPC Total Pressure', unit: 'psia', nominal: 553.95 },
    ],
  },
  {
    id: 'combustor',
    label: 'Annular Combustion Chamber',
    shortLabel: 'COMBUSTOR',
    stationCode: 'STA 4.0',
    desc: 'Annular combustor mixing compressed core air with atomized Jet-A fuel at stoichiometric FAR ≈ 0.03.',
    sensors: [
      { name: 'phi',  fullName: 'Fuel-to-Pressure Ratio', unit: 'pps/psi', nominal: 521.9 },
      { name: 'farB', fullName: 'Burner Fuel-Air Ratio', unit: 'ratio', nominal: 0.03 },
      { name: 'htBleed', fullName: 'Bleed Enthalpy', unit: 'kJ/kg', nominal: 392.3 },
    ],
  },
  {
    id: 'turbine',
    label: 'Turbines (HPT / LPT Stages)',
    shortLabel: 'TURBINES (EGT)',
    stationCode: 'STA 5.0',
    desc: '1-stage HPT drives N2 core spool; 4-stage LPT drives N1 fan spool. EGT (T50) monitors thermal degradation.',
    sensors: [
      { name: 'T50', fullName: 'Exhaust Gas Temp (EGT)', unit: '°R', nominal: 1402.8 },
      { name: 'W31', fullName: 'HPT Coolant Bleed Flow', unit: 'lbm/s', nominal: 38.93 },
      { name: 'W32', fullName: 'LPT Coolant Bleed Flow', unit: 'lbm/s', nominal: 23.36 },
    ],
  },
];

export default function EngineCrossSection({ activeStation, onStationClick, prediction, physicalSensors }) {
  const healthStage = prediction?.health_stage ?? 0;
  const primaryDriver = prediction?.primary_driver;
  const [hoveredStation, setHoveredStation] = useState(null);

  // Map station name from prediction inspection_area or primary_driver
  const failingStation = (() => {
    const area = (prediction?.inspection_area || '').toLowerCase();
    const driverStation = (primaryDriver?.station || '').toLowerCase();
    if (area.includes('combustor') || driverStation.includes('combustor')) return 'combustor';
    if (area.includes('lpt') || area.includes('turbine') || driverStation.includes('lpt') || driverStation.includes('hpt')) return 'turbine';
    if (area.includes('lpc') || driverStation.includes('lpc')) return 'lpc';
    if (area.includes('fan') || driverStation.includes('fan')) return 'fan';
    if (area.includes('hpc') || driverStation.includes('hpc') || healthStage > 0) return 'hpc';
    return null;
  })();

  const isDegradedIn = (stationId) => healthStage > 0 && failingStation === stationId;

  // Helper for sensor live value
  const getSensorVal = (id, fallback) => {
    if (physicalSensors && physicalSensors[id] !== undefined) {
      return Number(physicalSensors[id]).toFixed(id === 'Ps30' || id === 'phi' ? 2 : 1);
    }
    return fallback;
  };

  const getStationColor = (stationId) => {
    if (isDegradedIn(stationId)) {
      return healthStage === 2 ? '#ef4444' : '#f59e0b';
    }
    if (activeStation === stationId || hoveredStation === stationId) {
      return '#38bdf8';
    }
    return '#22416a';
  };

  const getStationFill = (stationId) => {
    if (isDegradedIn(stationId)) {
      return healthStage === 2 ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.14)';
    }
    if (activeStation === stationId) {
      return 'rgba(56,189,248,0.16)';
    }
    if (hoveredStation === stationId) {
      return 'rgba(56,189,248,0.08)';
    }
    return 'rgba(10,18,34,0.65)';
  };

  return (
    <div className="engine-schematic-wrapper">
      {/* Top status bar */}
      <div className="engine-status-header">
        <div className="engine-info-pill">
          <span
            className="dot"
            style={{
              background: healthStage === 2 ? 'var(--critical)' : healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)',
              boxShadow: `0 0 8px ${healthStage === 2 ? 'var(--critical)' : healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)'}`,
            }}
          />
          <span className="bold">CFM56-5B4 Turbofan Cross-Section</span>
          <span className="sub"> — Interactive Subassembly Telemetry & Diagnostics</span>
        </div>
        <div className="engine-wear-alert">
          {healthStage === 2 ? (
            <span className="wear-crit">
              🔴 CRITICAL REDLINE — {primaryDriver?.full_name || 'Subassembly Failure'} Breach
            </span>
          ) : healthStage === 1 ? (
            <span className="wear-warn">
              ⚠ WARNING — {primaryDriver?.full_name || 'Thermal / Aerodynamic'} Degradation
            </span>
          ) : (
            <span className="wear-norm">✓ All 5 Subassemblies Operating Within Nominal Limits</span>
          )}
        </div>
      </div>

      {/* SVG Engineering Cross Section */}
      <svg
        viewBox="0 0 1000 280"
        className="engine-svg-simple"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.45))' }}
      >
        <defs>
          {/* Metallic Cowl Gradients */}
          <linearGradient id="cowlMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c3e5a" />
            <stop offset="15%" stopColor="#1e2c42" />
            <stop offset="50%" stopColor="#141f30" />
            <stop offset="85%" stopColor="#1e2c42" />
            <stop offset="100%" stopColor="#2c3e5a" />
          </linearGradient>

          <linearGradient id="intakeLipGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#1e3a5f" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f1b2d" stopOpacity="0.9" />
          </linearGradient>

          {/* Spinner Titanium Gradient */}
          <linearGradient id="spinnerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Shaft Titanium */}
          <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="40%" stopColor="#475569" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Flow gradients */}
          <linearGradient id="bypassStream" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.12)" />
            <stop offset="60%" stopColor="rgba(56, 189, 248, 0.05)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0.01)" />
          </linearGradient>

          <linearGradient id="coreThermodynamic" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.08)" />
            <stop offset="35%" stopColor="rgba(56, 189, 248, 0.14)" />
            <stop offset="55%" stopColor="rgba(245, 158, 11, 0.22)" />
            <stop offset="75%" stopColor="rgba(239, 68, 68, 0.24)" />
            <stop offset="100%" stopColor="rgba(249, 115, 22, 0.15)" />
          </linearGradient>

          {/* Flame gradient */}
          <radialGradient id="flameGlow" cx="45%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#ef4444" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter for active/warning parts */}
          <filter id="aeroglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ───────── BACKGROUND GRID / BLUEPRINT TICKS ───────── */}
        <g opacity="0.12">
          {Array.from({ length: 19 }, (_, i) => 50 + i * 50).map((x) => (
            <line key={`gx-${x}`} x1={x} y1="15" x2={x} y2="255" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2,4" />
          ))}
          {[50, 95, 140, 185, 230].map((y) => (
            <line key={`gy-${y}`} x1="30" y1={y} x2="960" y2={y} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2,4" />
          ))}
        </g>

        {/* ───────── OUTER NACELLE & INTAKE LIP ───────── */}
        {/* Top Nacelle Shell */}
        <path
          d="M 38,50 Q 80,24 160,22 L 440,32 Q 540,40 720,54 L 860,68 L 860,78 L 720,64 Q 540,50 440,44 L 160,34 Q 85,36 45,58 Z"
          fill="url(#cowlMetal)"
          stroke="#3b82f6"
          strokeWidth="1.2"
        />
        {/* Bottom Nacelle Shell */}
        <path
          d="M 38,230 Q 80,256 160,258 L 440,248 Q 540,240 720,226 L 860,212 L 860,202 L 720,216 Q 540,230 440,236 L 160,246 Q 85,244 45,222 Z"
          fill="url(#cowlMetal)"
          stroke="#3b82f6"
          strokeWidth="1.2"
        />

        {/* Intake Cowl Lip Highlights */}
        <path d="M 38,50 C 18,75 18,95 24,120 L 32,120 C 26,95 28,75 45,58 Z" fill="url(#intakeLipGrad)" />
        <path d="M 38,230 C 18,205 18,185 24,160 L 32,160 C 26,185 28,205 45,222 Z" fill="url(#intakeLipGrad)" />

        {/* Bypass Duct Airflow (Cold Stream) */}
        <path d="M 140,42 Q 260,36 440,48 L 440,82 Q 260,72 140,82 Z" fill="url(#bypassStream)" />
        <path d="M 140,238 Q 260,244 440,232 L 440,198 Q 260,208 140,198 Z" fill="url(#bypassStream)" />
        {/* Subtle bypass streamlines */}
        <path d="M 150,56 Q 300,50 435,62" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="8,6" opacity="0.35" />
        <path d="M 150,224 Q 300,230 435,218" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="8,6" opacity="0.35" />

        {/* Core Gas Path Background */}
        <path
          d="M 140,82 L 440,90 L 550,96 L 850,82 L 850,198 L 550,184 L 440,190 L 140,198 Z"
          fill="url(#coreThermodynamic)"
        />

        {/* ───────── CONCENTRIC DRIVE SHAFTS & BEARINGS ───────── */}
        {/* Centerline Datum */}
        <line x1="20" y1="140" x2="960" y2="140" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="14,4,2,4" opacity="0.5" />
        <text x="24" y="136" fill="#38bdf8" fontSize="7.5" fontFamily="'JetBrains Mono',monospace" opacity="0.6">CL ℄</text>

        {/* Inner N1 Low-Pressure Shaft (Fan ↔ LPT) */}
        <rect x="75" y="137" width="770" height="6" fill="url(#shaftGrad)" stroke="#475569" strokeWidth="0.8" rx="2" />
        {/* Outer N2 High-Pressure Spool (HPC ↔ HPT) */}
        <rect x="235" y="133" width="375" height="14" fill="url(#shaftGrad)" stroke="#64748b" strokeWidth="1" rx="2" opacity="0.9" />

        {/* Bearings Sump Housings */}
        {/* #1 Fan Thrust Bearing */}
        <rect x="80" y="128" width="10" height="24" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" rx="1" />
        <circle cx="85" cy="132" r="2.5" fill="#38bdf8" />
        <circle cx="85" cy="148" r="2.5" fill="#38bdf8" />
        <text x="85" y="123" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono',monospace">#1</text>

        {/* #2 Booster Roller Bearing */}
        <rect x="210" y="129" width="9" height="22" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" rx="1" />
        <circle cx="214.5" cy="133" r="2" fill="#94a3b8" />
        <circle cx="214.5" cy="147" r="2" fill="#94a3b8" />

        {/* #3 HPC Front Thrust Bearing */}
        <rect x="245" y="126" width="10" height="28" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" rx="1" />
        <circle cx="250" cy="130" r="2.5" fill="#f59e0b" />
        <circle cx="250" cy="150" r="2.5" fill="#f59e0b" />
        <text x="250" y="121" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono',monospace">#3</text>

        {/* #4 & #5 Turbine Bearings */}
        <rect x="615" y="128" width="9" height="24" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" rx="1" />
        <rect x="820" y="130" width="8" height="20" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" rx="1" />

        {/* ───────── TITANIUM SPINNER & FAN HUB ───────── */}
        <path
          d="M 32,140 C 32,118 56,108 76,106 L 76,174 C 56,172 32,162 32,140 Z"
          fill="url(#spinnerGrad)"
          stroke="#60a5fa"
          strokeWidth="1.5"
        />
        {/* Iconic White Aerodynamic Spiral Line */}
        <path
          d="M 35,140 Q 48,128 58,138 Q 66,146 75,138"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* ══════════════════════════════════════════════════════
            1. FAN & INLET SECTION (x: 45–140)
        ══════════════════════════════════════════════════════ */}
        <g
          onClick={() => onStationClick('fan')}
          onMouseEnter={() => setHoveredStation('fan')}
          onMouseLeave={() => setHoveredStation(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Fan casing zone */}
          <path
            d="M 50,30 L 140,38 L 140,82 L 76,106 L 76,174 L 140,198 L 140,242 L 50,250 Z"
            fill={getStationFill('fan')}
            stroke={getStationColor('fan')}
            strokeWidth={activeStation === 'fan' ? 2.5 : 1.2}
          />

          {/* Aerodynamic Wide-Chord Curved Fan Blades */}
          {[60, 72, 84, 96, 108, 120, 132].map((x, i) => (
            <g key={`fan-blade-${i}`}>
              {/* Upper blade aerofoil */}
              <path
                d={`M ${x},34 Q ${x + 9},65 ${x + 2},108`}
                fill="none"
                stroke={activeStation === 'fan' || isDegradedIn('fan') ? getStationColor('fan') : '#60a5fa'}
                strokeWidth="2.6"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Lower blade aerofoil */}
              <path
                d={`M ${x},246 Q ${x + 9},215 ${x + 2},172`}
                fill="none"
                stroke={activeStation === 'fan' || isDegradedIn('fan') ? getStationColor('fan') : '#60a5fa'}
                strokeWidth="2.6"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          ))}

          {/* Fan containment armor ring */}
          <rect x="52" y="26" width="86" height="4" fill="#3b82f6" opacity="0.6" rx="1" />
          <rect x="52" y="250" width="86" height="4" fill="#3b82f6" opacity="0.6" rx="1" />

          {/* Core Splitter Island */}
          <path d="M 134,80 L 144,82 L 140,85 Z" fill="#60a5fa" />
          <path d="M 134,200 L 144,198 L 140,195 Z" fill="#60a5fa" />

          <text
            x="95"
            y="20"
            textAnchor="middle"
            fill={getStationColor('fan')}
            fontSize="10"
            fontWeight="800"
            fontFamily="'JetBrains Mono',monospace"
          >
            1. FAN & INLET
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════
            2. LPC BOOSTER (x: 142–230)
        ══════════════════════════════════════════════════════ */}
        <g
          onClick={() => onStationClick('lpc')}
          onMouseEnter={() => setHoveredStation('lpc')}
          onMouseLeave={() => setHoveredStation(null)}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x="142"
            y="82"
            width="88"
            height="116"
            rx="4"
            fill={getStationFill('lpc')}
            stroke={getStationColor('lpc')}
            strokeWidth={activeStation === 'lpc' ? 2.5 : 1.2}
          />

          {/* 3 Booster Stages (Alternating Rotors & Stators) */}
          {[160, 185, 210].map((x, i) => (
            <g key={`lpc-${i}`}>
              {/* Rotor blade */}
              <line
                x1={x}
                y1="86"
                x2={x}
                y2="133"
                stroke={getStationColor('lpc')}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1={x}
                y1="147"
                x2={x}
                y2="194"
                stroke={getStationColor('lpc')}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Stator vane */}
              <line
                x1={x + 11}
                y1="88"
                x2={x + 13}
                y2="132"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="3,1"
              />
              <line
                x1={x + 11}
                y1="148"
                x2={x + 13}
                y2="192"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="3,1"
              />
            </g>
          ))}

          <text
            x="186"
            y="76"
            textAnchor="middle"
            fill={getStationColor('lpc')}
            fontSize="10"
            fontWeight="800"
            fontFamily="'JetBrains Mono',monospace"
          >
            2. LPC BOOSTER
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════
            3. HIGH-PRESSURE COMPRESSOR (HPC) (x: 232–440)
               Tapered 9-stage drum rotor
        ══════════════════════════════════════════════════════ */}
        <g
          onClick={() => onStationClick('hpc')}
          onMouseEnter={() => setHoveredStation('hpc')}
          onMouseLeave={() => setHoveredStation(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Tapered Casing */}
          <path
            d="M 232,82 L 440,90 L 440,190 L 232,198 Z"
            fill={getStationFill('hpc')}
            stroke={getStationColor('hpc')}
            strokeWidth={activeStation === 'hpc' || isDegradedIn('hpc') ? 2.5 : 1.2}
          />

          {/* 9 HPC Stages — Tapered blade height from stage 1 to 9 */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = 246 + i * 21;
            const taper = i * 2.8;
            return (
              <g key={`hpc-stage-${i}`}>
                {/* Upper Rotor Blade */}
                <line
                  x1={x}
                  y1={86 + taper}
                  x2={x}
                  y2="132"
                  stroke={isDegradedIn('hpc') ? getStationColor('hpc') : '#7dd3fc'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Lower Rotor Blade */}
                <line
                  x1={x}
                  y1="148"
                  x2={x}
                  y2={194 - taper}
                  stroke={isDegradedIn('hpc') ? getStationColor('hpc') : '#7dd3fc'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Variable Stator Vane (VSV) link pin */}
                <circle cx={x} cy={83 + taper} r="1.5" fill="#f59e0b" opacity="0.8" />
                <circle cx={x} cy={197 - taper} r="1.5" fill="#f59e0b" opacity="0.8" />
              </g>
            );
          })}

          {/* Wear Zone Visual Overlay if degraded in HPC */}
          {isDegradedIn('hpc') && (
            <g>
              <rect
                x="350"
                y="94"
                width="84"
                height="92"
                rx="4"
                fill={healthStage === 2 ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.14)'}
                stroke={healthStage === 2 ? '#ef4444' : '#f59e0b'}
                strokeWidth="1.8"
                strokeDasharray="4,3"
                filter="url(#aeroglow)"
              />
              <rect x="362" y="132" width="60" height="16" rx="2" fill="#0b1329" stroke={getStationColor('hpc')} strokeWidth="1" />
              <text
                x="392"
                y="144"
                textAnchor="middle"
                fill={getStationColor('hpc')}
                fontSize="8"
                fontWeight="800"
                fontFamily="'JetBrains Mono',monospace"
              >
                WEAR ZONE
              </text>
            </g>
          )}

          <text
            x="336"
            y="74"
            textAnchor="middle"
            fill={getStationColor('hpc')}
            fontSize="10"
            fontWeight="800"
            fontFamily="'JetBrains Mono',monospace"
          >
            3. COMPRESSOR (HPC) {isDegradedIn('hpc') ? '⚠' : ''}
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════
            4. COMBUSTOR SECTION (x: 442–550)
               Annular combustion chamber with flame swirlers
        ══════════════════════════════════════════════════════ */}
        <g
          onClick={() => onStationClick('combustor')}
          onMouseEnter={() => setHoveredStation('combustor')}
          onMouseLeave={() => setHoveredStation(null)}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x="442"
            y="90"
            width="106"
            height="100"
            rx="5"
            fill={getStationFill('combustor')}
            stroke={getStationColor('combustor')}
            strokeWidth={activeStation === 'combustor' || isDegradedIn('combustor') ? 2.5 : 1.2}
          />

          {/* Combustion Chamber Perforated Liner */}
          <rect
            x="455"
            y="102"
            width="82"
            height="76"
            rx="4"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4,2"
            opacity="0.6"
          />

          {/* Dual Fuel Nozzle Injectors */}
          <g>
            {/* Top Nozzle */}
            <rect x="446" y="112" width="12" height="8" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            <ellipse cx="468" cy="116" rx="14" ry="10" fill="url(#flameGlow)" />
            {/* Bottom Nozzle */}
            <rect x="446" y="160" width="12" height="8" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            <ellipse cx="468" cy="164" rx="14" ry="10" fill="url(#flameGlow)" />
          </g>

          {/* Wear Zone Visual Overlay if degraded in Combustor */}
          {isDegradedIn('combustor') && (
            <g>
              <rect
                x="446"
                y="94"
                width="98"
                height="92"
                rx="4"
                fill={healthStage === 2 ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.14)'}
                stroke={healthStage === 2 ? '#ef4444' : '#f59e0b'}
                strokeWidth="1.8"
                strokeDasharray="4,3"
                filter="url(#aeroglow)"
              />
              <rect x="460" y="132" width="70" height="16" rx="2" fill="#0b1329" stroke={getStationColor('combustor')} strokeWidth="1" />
              <text
                x="495"
                y="144"
                textAnchor="middle"
                fill={getStationColor('combustor')}
                fontSize="8"
                fontWeight="800"
                fontFamily="'JetBrains Mono',monospace"
              >
                PHI DRIFT
              </text>
            </g>
          )}

          <text
            x="495"
            y="76"
            textAnchor="middle"
            fill={getStationColor('combustor')}
            fontSize="10"
            fontWeight="800"
            fontFamily="'JetBrains Mono',monospace"
          >
            4. COMBUSTOR {isDegradedIn('combustor') ? '⚠' : ''}
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════
            5. TURBINES SECTION (x: 552–850)
               1 HPT Stage + 4 LPT Stages expanding
        ══════════════════════════════════════════════════════ */}
        <g
          onClick={() => onStationClick('turbine')}
          onMouseEnter={() => setHoveredStation('turbine')}
          onMouseLeave={() => setHoveredStation(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Expanding Casing */}
          <path
            d="M 552,90 L 850,78 L 850,202 L 552,190 Z"
            fill={getStationFill('turbine')}
            stroke={getStationColor('turbine')}
            strokeWidth={activeStation === 'turbine' || isDegradedIn('turbine') ? 2.5 : 1.2}
          />

          {/* HPT 1-Stage Blade (Single Crystal Superalloy) */}
          <line x1="575" y1="92" x2="575" y2="132" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
          <line x1="575" y1="148" x2="575" y2="188" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
          <text x="575" y="206" textAnchor="middle" fill="#f43f5e" fontSize="7.5" fontFamily="'JetBrains Mono',monospace">HPT</text>

          {/* Inter-Turbine Frame Strut Divider */}
          <line x1="610" y1="88" x2="610" y2="192" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,2" />

          {/* 4 LPT Stages (Expanding) */}
          {[640, 690, 745, 805].map((x, i) => {
            const spread = i * 4;
            return (
              <g key={`lpt-${i}`}>
                <line
                  x1={x}
                  y1={88 - spread}
                  x2={x}
                  y2="132"
                  stroke={isDegradedIn('turbine') ? getStationColor('turbine') : '#60a5fa'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1={x}
                  y1="148"
                  x2={x}
                  y2={192 + spread}
                  stroke={isDegradedIn('turbine') ? getStationColor('turbine') : '#60a5fa'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          <text x="725" y="210" textAnchor="middle" fill="#60a5fa" fontSize="7.5" fontFamily="'JetBrains Mono',monospace">LPT (4-STAGE)</text>

          {/* Wear Zone Visual Overlay if degraded in Turbine */}
          {isDegradedIn('turbine') && (
            <g>
              <rect
                x="560"
                y="86"
                width="280"
                height="108"
                rx="4"
                fill={healthStage === 2 ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.14)'}
                stroke={healthStage === 2 ? '#ef4444' : '#f59e0b'}
                strokeWidth="1.8"
                strokeDasharray="4,3"
                filter="url(#aeroglow)"
              />
              <rect x="670" y="132" width="70" height="16" rx="2" fill="#0b1329" stroke={getStationColor('turbine')} strokeWidth="1" />
              <text
                x="705"
                y="144"
                textAnchor="middle"
                fill={getStationColor('turbine')}
                fontSize="8"
                fontWeight="800"
                fontFamily="'JetBrains Mono',monospace"
              >
                EGT OVERHEAT
              </text>
            </g>
          )}

          <text
            x="700"
            y="64"
            textAnchor="middle"
            fill={getStationColor('turbine')}
            fontSize="10"
            fontWeight="800"
            fontFamily="'JetBrains Mono',monospace"
          >
            5. TURBINES (HPT / LPT) {isDegradedIn('turbine') ? '⚠' : ''}
          </text>
        </g>

        {/* ───────── EXHAUST TAILCONE & NOZZLE (x: 850–960) ───────── */}
        <polygon points="850,78 950,140 850,202" fill="#091322" stroke="#334155" strokeWidth="1.5" />
        {/* Exhaust thermal plume */}
        <ellipse cx="915" cy="140" rx="30" ry="34" fill="rgba(249,115,22,0.12)" stroke="rgba(249,115,22,0.3)" strokeWidth="1" />

        {/* ───────── PHYSICAL SENSOR TAP PROBES ───────── */}
        {/* T2 / P2 Fan Inlet Probe */}
        <g>
          <circle cx="95" cy="30" r="3.5" fill="#38bdf8" />
          <line x1="95" y1="30" x2="95" y2="12" stroke="#38bdf8" strokeWidth="1" />
          <rect x="74" y="0" width="42" height="12" rx="2" fill="#071120" stroke="#38bdf8" strokeWidth="0.8" />
          <text x="95" y="9" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="'JetBrains Mono',monospace">T2 {getSensorVal('T2', 518.7)}°</text>
        </g>

        {/* T24 LPC Exit Probe */}
        <g>
          <circle cx="200" cy="82" r="3" fill="#38bdf8" />
          <line x1="200" y1="82" x2="200" y2="60" stroke="#38bdf8" strokeWidth="1" />
          <rect x="178" y="48" width="44" height="12" rx="2" fill="#071120" stroke="#38bdf8" strokeWidth="0.8" />
          <text x="200" y="57" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="'JetBrains Mono',monospace">T24 {getSensorVal('T24', 642.4)}°</text>
        </g>

        {/* Ps30 HPC Static Pressure Tap */}
        <g>
          <circle cx="430" cy="90" r="3.5" fill={isDegradedIn('hpc') ? getStationColor('hpc') : '#38bdf8'} />
          <line x1="430" y1="90" x2="430" y2="48" stroke={isDegradedIn('hpc') ? getStationColor('hpc') : '#38bdf8'} strokeWidth="1.2" />
          <rect x="404" y="36" width="52" height="12" rx="2" fill="#071120" stroke={isDegradedIn('hpc') ? getStationColor('hpc') : '#38bdf8'} strokeWidth="0.8" />
          <text x="430" y="45" textAnchor="middle" fill={isDegradedIn('hpc') ? getStationColor('hpc') : '#38bdf8'} fontSize="7" fontWeight="700" fontFamily="'JetBrains Mono',monospace">
            Ps30 {getSensorVal('Ps30', 47.35)}
          </text>
        </g>

        {/* phi Combustor Fuel Metering */}
        <g>
          <circle cx="495" cy="90" r="3.5" fill={isDegradedIn('combustor') ? getStationColor('combustor') : '#f59e0b'} />
          <line x1="495" y1="90" x2="495" y2="52" stroke={isDegradedIn('combustor') ? getStationColor('combustor') : '#f59e0b'} strokeWidth="1" />
          <rect x="472" y="40" width="46" height="12" rx="2" fill="#071120" stroke={isDegradedIn('combustor') ? getStationColor('combustor') : '#f59e0b'} strokeWidth="0.8" />
          <text x="495" y="49" textAnchor="middle" fill={isDegradedIn('combustor') ? getStationColor('combustor') : '#f59e0b'} fontSize="7" fontFamily="'JetBrains Mono',monospace">
            phi {getSensorVal('phi', 520.5)}
          </text>
        </g>

        {/* T50 Turbine EGT Thermocouple Rake */}
        <g>
          <circle cx="830" cy="78" r="3.5" fill={isDegradedIn('turbine') ? getStationColor('turbine') : '#ef4444'} />
          <line x1="830" y1="78" x2="830" y2="46" stroke={isDegradedIn('turbine') ? getStationColor('turbine') : '#ef4444'} strokeWidth="1.2" />
          <rect x="806" y="34" width="48" height="12" rx="2" fill="#071120" stroke={isDegradedIn('turbine') ? getStationColor('turbine') : '#ef4444'} strokeWidth="0.8" />
          <text x="830" y="43" textAnchor="middle" fill={isDegradedIn('turbine') ? getStationColor('turbine') : '#ef4444'} fontSize="7" fontWeight="700" fontFamily="'JetBrains Mono',monospace">
            EGT {getSensorVal('T50', 1402.8)}°
          </text>
        </g>

        {/* ───────── STATION DATUM TICKS ───────── */}
        {[
          { x: 95, label: 'STA 1.0 (FAN)' },
          { x: 186, label: 'STA 2.5 (BOOSTER)' },
          { x: 336, label: 'STA 3.0 (HPC)' },
          { x: 495, label: 'STA 4.0 (BURNER)' },
          { x: 700, label: 'STA 5.0 (TURBINE)' },
        ].map(({ x, label }) => (
          <g key={label}>
            <line x1={x} y1="250" x2={x} y2="260" stroke="#334155" strokeWidth="1" />
            <text x={x} y="270" textAnchor="middle" fill="#64748b" fontSize="7.5" fontFamily="'JetBrains Mono',monospace">
              {label}
            </text>
          </g>
        ))}
      </svg>

      {/* Selected station detail bar */}
      <div className="selected-station-card">
        {(() => {
          const s = STATIONS.find((st) => st.id === activeStation) || STATIONS[2];
          return (
            <>
              <div className="station-card-left">
                <span className="station-badge">▶ {s.shortLabel}</span>
                <span className="station-code mono">{s.stationCode}</span>
                <span className="station-desc">{s.desc}</span>
              </div>
              <div className="station-sensors-chips">
                {s.sensors.map((sensor) => {
                  const live = getSensorVal(sensor.name, sensor.nominal);
                  return (
                    <span key={sensor.name} className="sensor-chip">
                      <b>{sensor.name}</b>: {live} {sensor.unit}
                      <em className="chip-imp"> (Nom: {sensor.nominal})</em>
                    </span>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
