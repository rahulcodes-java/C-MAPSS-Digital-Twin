import React from 'react';
import { STATIONS } from './EngineCrossSection';

/**
 * SensorInfoStrip.jsx
 * Sits directly below the CFM56 engine cross-section.
 * Shows real-time physical engineering readings (with units: °R, psia, rpm)
 * and threshold health indicators for each engine station.
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

  const getSensorDisplay = (sensorName) => {
    const diag = diagMap[sensorName];
    if (diag && diag.value !== undefined) {
      return {
        formatted: `${diag.value} ${diag.unit}`,
        status: diag.status,
        delta: diag.delta,
        explanation: diag.diagnosis,
        isPhysical: true,
      };
    }

    if (physicalSensors && physicalSensors[sensorName] !== undefined) {
      const val = physicalSensors[sensorName];
      return {
        formatted: `${val.toFixed(1)}`,
        status: 'NORMAL',
        delta: 0,
        explanation: '',
        isPhysical: true,
      };
    }

    if (sensorValues && sensorValues[sensorName] !== undefined) {
      return {
        formatted: `${(sensorValues[sensorName] * 100).toFixed(1)}%`,
        status: 'NORMAL',
        delta: 0,
        explanation: '',
        isPhysical: false,
      };
    }

    return { formatted: '--', status: 'NORMAL', delta: 0, explanation: '', isPhysical: false };
  };

  const getStationHealthColor = (station) => {
    // Check if any sensor in this station has breached redline or warning
    const hasRedline = station.sensors.some(s => diagMap[s.name]?.status === 'CRITICAL_REDLINE');
    if (hasRedline) return 'var(--critical)';

    const hasWarning = station.sensors.some(s => diagMap[s.name]?.status === 'WARNING');
    if (hasWarning) return 'var(--degrading)';

    const maxImp = station.sensors.reduce((m, s) => Math.max(m, s.importance), 0);
    const hs = prediction?.health_stage ?? 0;
    if (hs === 2 && maxImp > 8) return 'var(--critical)';
    if (hs === 1 && maxImp > 8) return 'var(--degrading)';

    return 'var(--healthy)';
  };

  return (
    <div className="sensor-info-strip">
      {STATIONS.map(station => {
        const healthColor = getStationHealthColor(station);
        const isActive = activeStation === station.id;

        return (
          <div
            key={station.id}
            className={`sensor-station ${isActive ? 'active' : ''}`}
            onClick={() => onStationClick(station.id)}
            style={{
              borderColor: isActive ? 'var(--accent)' : (healthColor !== 'var(--healthy)' ? healthColor : undefined)
            }}
          >
            <div className="station-label">
              <span className="indicator" style={{ background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
              <span className="station-title">{station.shortLabel}</span>
              <span className="station-sub">{station.label}</span>
            </div>

            <div className="station-sensors">
              {station.sensors.map(sensor => {
                const info = getSensorDisplay(sensor.name);
                const isAlert = info.status === 'CRITICAL_REDLINE';
                const isWarn = info.status === 'WARNING';

                return (
                  <div
                    key={sensor.name}
                    className={`sensor-row ${isAlert ? 'critical' : (isWarn ? 'warning' : '')}`}
                    title={`${sensor.fullName}${info.explanation ? '\nDiagnosis: ' + info.explanation : ''}`}
                  >
                    <div className="sensor-header-left">
                      <span className={`status-dot ${isAlert ? 'critical' : (isWarn ? 'warning' : 'healthy')}`} />
                      <span className="name">{sensor.name}</span>
                    </div>
                    <span className="value mono">
                      {info.formatted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
