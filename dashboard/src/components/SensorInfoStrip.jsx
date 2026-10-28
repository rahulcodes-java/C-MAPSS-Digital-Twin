import React from 'react';
import { STATIONS } from './EngineCrossSection';

/**
 * SensorInfoStrip.jsx
 * Live sensor telemetry below the engine cross-section.
 * Pulls values from: prediction sensor_diagnostics → physicalSensors → hardcoded nominal.
 * Never shows "--" as long as physicalSensors or nominals are available.
 */

// Nominal/fallback sensor readings (from dashboard_api SENSOR_METADATA)
const SENSOR_NOMINALS = {
  Nf:   { val: 2388.1, unit: 'rpm'     },
  T2:   { val: 518.67, unit: '°R'      },
  P2:   { val: 14.62,  unit: 'psia'    },
  T24:  { val: 642.4,  unit: '°R'      },
  BPR:  { val: 8.42,   unit: 'ratio'   },
  Ps30: { val: 47.35,  unit: 'psia'    },
  Nc:   { val: 9056.0, unit: 'rpm'     },
  T30:  { val: 1586.8, unit: '°R'      },
  P30:  { val: 553.95, unit: 'psia'    },
  phi:  { val: 521.9,  unit: 'pps/psi' },
  farB: { val: 0.03,   unit: 'ratio'   },
  T50:  { val: 1402.8, unit: '°R'      },
  W31:  { val: 38.93,  unit: 'lbm/s'  },
  W32:  { val: 23.36,  unit: 'lbm/s'  },
};

export default function SensorInfoStrip({
  activeStation,
  onStationClick,
  sensorValues,
  physicalSensors,
  prediction
}) {
  // Build diagMap from prediction sensor_diagnostics
  const diagMap = {};
  if (prediction?.sensor_diagnostics) {
    prediction.sensor_diagnostics.forEach(d => {
      diagMap[d.sensor] = d;
    });
  }

  const getSensorValue = (sensor) => {
    const name = sensor.name;

    // Priority 1: prediction sensor_diagnostics (has physical real value + status)
    const diag = diagMap[name];
    if (diag && diag.value !== undefined && diag.value !== null) {
      return {
        val: typeof diag.value === 'number' ? diag.value.toFixed(2) : diag.value,
        unit: diag.unit || sensor.unit,
        status: diag.status || 'NORMAL',
      };
    }

    // Priority 2: physicalSensors from engine history (already inverse-transformed)
    if (physicalSensors && physicalSensors[name] !== undefined) {
      return {
        val: Number(physicalSensors[name]).toFixed(2),
        unit: sensor.unit,
        status: 'NORMAL',
      };
    }

    // Priority 3: nominal fallback (always shows a value, never --)
    const nom = SENSOR_NOMINALS[name];
    if (nom) {
      return {
        val: nom.val.toFixed(2),
        unit: nom.unit,
        status: 'NORMAL',
      };
    }

    // Last resort: sensorValues (normalized 0-1 from CSV) — not useful raw, skip
    return { val: 'N/A', unit: sensor.unit, status: 'NORMAL' };
  };

  return (
    <div className="simple-sensor-strip">
      <div className="strip-title-row">
        <span className="strip-header-title">Live Sensor Telemetry — by Engine Section</span>
        <span className="strip-header-sub">Click any section to highlight it on the engine view above</span>
      </div>

      <div className="stations-grid">
        {STATIONS.map(station => {
          const isActive = activeStation === station.id;
          const hasCrit = station.sensors.some(s => diagMap[s.name]?.status === 'CRITICAL_REDLINE');
          const hasWarn = station.sensors.some(s => diagMap[s.name]?.status === 'WARNING');
          const borderClass = hasCrit ? 'station-crit' : hasWarn ? 'station-warn' : '';

          return (
            <div
              key={station.id}
              className={`station-box ${isActive ? 'active-station' : ''} ${borderClass}`}
              onClick={() => onStationClick(station.id)}
            >
              <div className="station-box-header">
                <span className="station-box-name">{station.shortLabel}</span>
                <span className={`status-indicator ${hasCrit ? 'crit' : hasWarn ? 'warn' : 'norm'}`}>
                  {hasCrit ? '● CRITICAL' : hasWarn ? '● WARNING' : '● OK'}
                </span>
              </div>

              <div className="station-sensors-list">
                {station.sensors.map(sensor => {
                  const sInfo = getSensorValue(sensor);
                  const isCrit = sInfo.status === 'CRITICAL_REDLINE';
                  const isWarn = sInfo.status === 'WARNING';

                  return (
                    <div key={sensor.name} className={`sensor-item ${isCrit ? 'crit' : isWarn ? 'warn' : ''}`}>
                      <span className="s-name">{sensor.name}</span>
                      <span className={`s-val mono ${isCrit ? 'crit-val' : isWarn ? 'warn-val' : ''}`}>
                        {sInfo.val} <span className="s-unit">{sInfo.unit}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
