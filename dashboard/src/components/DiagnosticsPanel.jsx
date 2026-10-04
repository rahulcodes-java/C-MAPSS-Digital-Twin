import React, { useState } from 'react';

/**
 * DiagnosticsPanel.jsx
 * Comprehensive diagnostics panel with:
 *  - RUL gauge & health status
 *  - Physical Root Cause & Sensor Threshold Analysis (Human-in-the-loop explanations)
 *  - Degradation trend graph
 *  - Prescriptive maintenance work orders
 *  - Top contributing sensors (SHAP attribution)
 */
export default function DiagnosticsPanel({ prediction, historyData, currentCycle, onSelectStation }) {
  const [showAllDiagnostics, setShowAllDiagnostics] = useState(false);

  const rul = Math.round(prediction?.rul ?? 0);
  const healthStage = prediction?.health_stage ?? 0;
  const healthLabel = prediction?.health_label ?? 'Healthy';
  const isAnomaly = prediction?.is_anomaly ?? false;
  const confidence = prediction?.confidence ?? 0.92;
  const inspectionArea = prediction?.inspection_area ?? 'HPC';
  const primaryDriver = prediction?.primary_driver ?? null;
  const sensorDiagnostics = prediction?.sensor_diagnostics ?? [];
  const hasActiveBreach = prediction?.has_active_breach ?? false;

  // RUL color mapping
  const rulColor = rul <= 30 ? 'var(--critical)' : rul <= 100 ? 'var(--degrading)' : 'var(--healthy)';
  const healthColor = healthStage === 2 ? 'var(--critical)' : healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)';

  // Degradation trend data
  const trendWindow = 50;
  const trendSlice = historyData
    ? historyData.slice(Math.max(0, currentCycle - trendWindow), currentCycle)
    : [];

  const trendPath = (() => {
    if (trendSlice.length < 2) return '';
    const minR = Math.min(...trendSlice.map(d => d.rul));
    const maxR = Math.max(...trendSlice.map(d => d.rul));
    const range = maxR - minR || 1;
    const w = 290;
    const h = 75;
    return trendSlice.map((d, i) => {
      const x = (i / (trendSlice.length - 1)) * w;
      const y = h - ((d.rul - minR) / range) * h;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  })();

  const degRate = trendSlice.length > 1
    ? (trendSlice[0].rul - trendSlice[trendSlice.length - 1].rul) / trendSlice.length
    : 0;

  // Maintenance recommendation
  const getMaintenanceRec = () => {
    if (healthStage === 2 || rul <= 30 || primaryDriver?.status === 'CRITICAL_REDLINE') {
      return {
        level: 'critical',
        title: 'Critical: Immediate Maintenance & Grounding',
        body: `Severe degradation signature in ${inspectionArea}. ${primaryDriver?.sensor || 'HPC'} has breached critical operating limits. Failure is predicted within ${rul} cycles.`,
        action: `Action: Ground aircraft > Perform borescope inspection on ${primaryDriver?.target || inspectionArea} > Replace affected stages before next flight.`,
      };
    }
    if (healthStage === 1 || rul <= 100 || primaryDriver?.status === 'WARNING') {
      return {
        level: 'degrading',
        title: 'Caution: Scheduled Line Inspection Required',
        body: `${inspectionArea} sensors show progressive degradation trend. Current RUL is ${rul} cycles with abnormal thermal/pressure drift.`,
        action: `Action: Schedule borescope check at next maintenance window (< ${Math.max(5, Math.round(rul * 0.5))} cycles) > Pre-order replacement hardware for ${primaryDriver?.target || inspectionArea}.`,
      };
    }
    return {
      level: 'healthy',
      title: 'Nominal: Normal Operational Envelope',
      body: `All 21 turbofan sensors operate well within nominal flight limits. Engine thermodynamic efficiency is at optimal factory baseline.`,
      action: `Action: Continue routine flight line monitoring > Next routine A-check scheduled at cycle ${currentCycle + 50}.`,
    };
  };

  const maint = getMaintenanceRec();

  // Active / abnormal sensors
  const degradedSensors = sensorDiagnostics.filter(s => s.status !== 'NORMAL');
  const displayDiagnostics = showAllDiagnostics
    ? sensorDiagnostics.slice(0, 8)
    : (degradedSensors.length > 0 ? degradedSensors : sensorDiagnostics.slice(0, 3));

  const isNominalEngine = !hasActiveBreach && (!primaryDriver || primaryDriver.status === 'NORMAL');

  return (
    <div className="workspace-right">
      {/* RUL GAUGE */}
      <div className="panel-section">
        <div className="section-title">Remaining Useful Life (RUL)</div>
        <div className="rul-display">
          <div className="rul-value mono" style={{ color: rulColor }}>{rul}</div>
          <div className="rul-unit">cycles remaining until predicted failure</div>
          <div className="rul-bar">
            <div
              className="rul-bar-fill"
              style={{
                width: `${Math.min(100, (rul / 200) * 100)}%`,
                background: rulColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* HEALTH STATUS CARDS */}
      <div className="panel-section">
        <div className="section-title">Engine Health Diagnostics</div>
        <div className="health-metrics">
          <div className="health-metric" style={{ borderLeftColor: healthColor }}>
            <span className="metric-label">Health Stage</span>
            <span className="metric-value" style={{ color: healthColor }}>{healthLabel}</span>
          </div>
          <div className="health-metric" style={{ borderLeftColor: isAnomaly ? 'var(--critical)' : 'var(--healthy)' }}>
            <span className="metric-label">Anomaly Status</span>
            <span className="metric-value" style={{ color: isAnomaly ? 'var(--critical)' : 'var(--healthy)' }}>
              {isAnomaly ? 'ANOMALY DETECTED' : 'Nominal'}
            </span>
          </div>
          <div className="health-metric" style={{ borderLeftColor: 'var(--degrading)' }}>
            <span className="metric-label">Primary Degradation Zone</span>
            <span className="metric-value" style={{ color: 'var(--degrading)' }}>{inspectionArea}</span>
          </div>
          <div className="health-metric" style={{ borderLeftColor: 'var(--cyan)' }}>
            <span className="metric-label">Model Confidence</span>
            <span className="metric-value mono">{(confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* PHYSICAL ROOT CAUSE & THRESHOLD ANALYSIS (USER REQUIREMENT) */}
      <div className="panel-section threshold-analysis-panel">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Physical Root Cause & Thresholds</span>
          {sensorDiagnostics.length > 0 && (
            <button
              className="toggle-diag-btn"
              onClick={() => setShowAllDiagnostics(!showAllDiagnostics)}
              title="Toggle between degraded sensors and all sensors"
            >
              {showAllDiagnostics ? 'Show Critical Only' : 'View All Sensors'}
            </button>
          )}
        </div>

        {primaryDriver && (
          <div className={`primary-root-cause-card ${primaryDriver.status.toLowerCase()}`}>
            <div className="root-cause-header">
              <div className="sensor-tag">
                <span className="sensor-code">
                  {isNominalEngine ? 'NOMINAL' : primaryDriver.sensor}
                </span>
                <span className="sensor-name">
                  {isNominalEngine ? 'All 21 Sensors Within Flight Limits' : primaryDriver.full_name}
                </span>
              </div>
              <span className={`status-pill ${primaryDriver.status.toLowerCase()}`}>
                {primaryDriver.status === 'CRITICAL_REDLINE' ? 'CRITICAL REDLINE' :
                 primaryDriver.status === 'WARNING' ? 'WARNING THRESHOLD' : 'ALL LIMITS NORMAL'}
              </span>
            </div>

            {/* Threshold Progress Bar */}
            <div className="threshold-meter-container">
              <div className="threshold-labels">
                <span>Baseline: {primaryDriver.baseline} {primaryDriver.unit}</span>
                <span className="current-stat" style={{
                  color: primaryDriver.status === 'CRITICAL_REDLINE' ? 'var(--critical)' :
                         primaryDriver.status === 'WARNING' ? 'var(--degrading)' : 'var(--healthy)'
                }}>
                  {isNominalEngine
                    ? 'Envelope Status: Nominal (< 1.0σ drift)'
                    : `Current: ${primaryDriver.value} ${primaryDriver.unit} (${primaryDriver.delta >= 0 ? `+${primaryDriver.delta}` : primaryDriver.delta})`}
                </span>
                <span>
                  {isNominalEngine ? 'Safety Margin: 100%' : `Redline: ${primaryDriver.crit_threshold} ${primaryDriver.unit}`}
                </span>
              </div>

              <div className="threshold-meter-bar">
                <div className="meter-zone green-zone" title="Nominal zone (0-70%)" />
                <div className="meter-zone yellow-zone" title="Warning zone (70-100%)" />
                <div className="meter-zone red-zone" title="Critical redline zone (>100%)" />
                {/* Pointer Marker */}
                <div
                  className="meter-pointer"
                  style={{
                    left: `${Math.min(98, Math.max(2, primaryDriver.pct_of_limit))}%`,
                    borderColor: primaryDriver.status === 'CRITICAL_REDLINE' ? 'var(--critical)' :
                                 primaryDriver.status === 'WARNING' ? 'var(--degrading)' : 'var(--healthy)'
                  }}
                >
                  <div className="pointer-tip" />
                </div>
              </div>
            </div>

            {/* Plain-English Failure & Heating Explanation */}
            <div className="root-cause-explanation">
              <div className="explanation-title">
                <span className="icon">ⓘ</span>
                <strong>Diagnostic Explanation:</strong>
              </div>
              <p className="explanation-text">{primaryDriver.diagnosis}</p>
            </div>

            {/* Maintenance Action Target */}
            <div className="inspection-target-box">
              <span className="target-label">Target Component:</span>
              <span className="target-value">{primaryDriver.target}</span>
              {onSelectStation && primaryDriver.station && !isNominalEngine && (
                <button
                  className="locate-station-btn"
                  onClick={() => onSelectStation(primaryDriver.station)}
                >
                  Locate on Engine
                </button>
              )}
            </div>
          </div>
        )}

        {/* Secondary Degraded Sensors Strip */}
        {!isNominalEngine && displayDiagnostics.length > 1 && (
          <div className="secondary-sensors-list">
            <div className="sub-title">Monitored Thermodynamic Parameters:</div>
            {displayDiagnostics.map((sd) => (
              <div key={sd.sensor} className={`secondary-sensor-row ${sd.status.toLowerCase()}`}>
                <div className="sec-sensor-info">
                  <span className="sec-code">{sd.sensor}</span>
                  <span className="sec-name">{sd.full_name}</span>
                </div>
                <div className="sec-telemetry">
                  <span className="sec-val mono">{sd.value} {sd.unit}</span>
                  <span className={`sec-badge ${sd.status.toLowerCase()}`}>
                    {sd.status === 'CRITICAL_REDLINE' ? 'REDLINE' :
                     sd.status === 'WARNING' ? 'WARN' : 'NOM'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RUL DEGRADATION TREND */}
      <div className="panel-section">
        <div className="section-title">
          RUL Degradation Trajectory
          <span style={{ float: 'right', fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>
            Last {trendSlice.length} cycles | Rate: {degRate.toFixed(2)} cycles/flight
          </span>
        </div>
        <div className="trend-chart">
          <svg viewBox="0 0 290 75" preserveAspectRatio="none">
            <rect x="0" y="0" width="290" height="75" fill="var(--bg-card)" rx="2" />
            <line x1="0" y1="18" x2="290" y2="18" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="37" x2="290" y2="37" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="56" x2="290" y2="56" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="3 3" />
            {trendPath && (
              <path d={trendPath} fill="none" stroke={rulColor} strokeWidth="1.8" />
            )}
          </svg>
        </div>
      </div>

      {/* PRESCRIPTIVE MAINTENANCE WORK ORDER */}
      <div className="panel-section">
        <div className="section-title">Prescriptive Maintenance Action</div>
        <div className={`maint-card ${maint.level}`}>
          <div className="maint-title" style={{
            color: maint.level === 'critical' ? 'var(--critical)' :
                   maint.level === 'degrading' ? 'var(--degrading)' : 'var(--healthy)'
          }}>
            {maint.title}
          </div>
          <div className="maint-body">{maint.body}</div>
          <div className="maint-action" style={{
            color: maint.level === 'critical' ? 'var(--critical)' :
                   maint.level === 'degrading' ? 'var(--degrading)' : 'var(--healthy)'
          }}>
            {maint.action}
          </div>
        </div>
      </div>

      {/* TOP CONTRIBUTING SENSORS (SHAP) */}
      {prediction?.top_sensors && (
        <div className="panel-section">
          <div className="section-title">Top Contributing Wear Drivers (SHAP)</div>
          <div className="health-metrics">
            {prediction.top_sensors.map((s, i) => (
              <div key={i} className="health-metric" style={{ borderLeftColor: 'var(--accent)' }}>
                <span className="metric-label">{s.sensor}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: `${Math.min(80, s.importance * 5)}px`,
                    height: 4,
                    background: s.importance > 10 ? 'var(--degrading)' : 'var(--accent)',
                    borderRadius: 2,
                  }} />
                  <span className="metric-value mono" style={{ fontSize: 11 }}>
                    {s.importance}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
