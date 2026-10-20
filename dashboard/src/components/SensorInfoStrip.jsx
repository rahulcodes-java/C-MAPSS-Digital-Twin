import React from 'react';
import { STATIONS } from './EngineCrossSection';

/**
 * SensorInfoStrip.jsx
 * Clean, readable sensor telemetry strip below the engine schematic.
 * Displays key sensors for each engine station with live values and status badges.
 */
export default function SensorInfoStrip({
  activeStation,
  onStationClick,
  sensorValues,
  physicalSensors,
  prediction
}) {
  const diagMap = {};
  if (prediction?.sensor_diagnostics) {
    prediction.sensor_diagnostics.forEach(d => {
      diagMap[d.sensor] = d;
    });
  }

  const getSensorValue = (sensor) => {
    const sName = sensor.name;
    const diag = diagMap[sName];
    if (diag && diag.value !== undefined) {
      return {
        val: diag.value,
        unit: diag.unit || sensor.unit,
        status: diag.status,
      };
    }
    if (physicalSensors && physicalSensors[sName] !== undefined) {
      return {
        val: physicalSensors[sName].toFixed(1),
        unit: sensor.unit,
        status: 'NORMAL',
      };
    }
    return { val: '--', unit: sensor.unit, status: 'NORMAL' };
  };

  return (
    <div className="simple-sensor-strip">
      <div className="strip-title-row">
        <span className="strip-header-title">Live Sensor Telemetry by Engine Section</span>
        <span className="strip-header-sub">Click any section to inspect</span>
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
                  {hasCrit ? 'CRITICAL' : hasWarn ? 'WARNING' : 'NORMAL'}
                </span>
              </div>

              <div className="station-sensors-list">
                {station.sensors.map(sensor => {
                  const sInfo = getSensorValue(sensor);
                  const isAbnormal = sInfo.status !== 'NORMAL';

                  return (
                    <div key={sensor.name} className={`sensor-item ${isAbnormal ? 'abnormal' : ''}`}>
                      <span className="s-name">{sensor.name}</span>
                      <span className="s-val mono">
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
