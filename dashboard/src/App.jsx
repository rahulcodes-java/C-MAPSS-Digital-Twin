import React, { useState, useEffect } from 'react';
import EngineCrossSection from './components/EngineCrossSection';
import SensorInfoStrip from './components/SensorInfoStrip';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import './App.css';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [engineId, setEngineId] = useState(1);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [engineData, setEngineData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [activeStation, setActiveStation] = useState('hpc');
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(false);

  // Check API health
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => setApiOk(d.status === 'ok'))
      .catch(() => setApiOk(false));
  }, []);

  // Load engine history
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/engine/${engineId}/history`)
      .then(r => r.json())
      .then(data => {
        setEngineData(data);
        setCurrentCycle(1);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load engine data:', e);
        setLoading(false);
      });
  }, [engineId]);

  // Predict for current cycle
  useEffect(() => {
    if (!engineData || currentCycle > engineData.history.length) return;
    const cycleData = engineData.history[currentCycle - 1];
    if (!cycleData) return;

    fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine_id: engineId,
        cycle: currentCycle
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error) setPrediction(data);
      })
      .catch(console.error);
  }, [engineId, currentCycle]);

  // Current sensor values
  const currentHistoryEntry = engineData?.history[currentCycle - 1] ?? null;
  const sensorValues = currentHistoryEntry?.sensors ?? null;
  const physicalSensors = currentHistoryEntry?.physical_sensors ?? null;
  const totalCycles = engineData?.total_cycles ?? engineData?.history?.length ?? 200;

  // Health status
  const healthStage = prediction?.health_stage ?? 0;
  const healthLabel = prediction?.health_label ?? 'Healthy';
  const healthClass = healthStage === 2 ? 'critical' : healthStage === 1 ? 'degrading' : 'healthy';

  const primaryDriver = prediction?.primary_driver;
  const hasThresholdAlert = Boolean(prediction?.has_active_breach && primaryDriver && primaryDriver.status !== 'NORMAL');

  if (loading) {
    return (
      <div className="app">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
          Loading real CFM56-5B4 telemetry from NASA C-MAPSS...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Dynamic Threshold & Anomaly Alert Banner - ONLY rendered on true alert/breach */}
      {hasThresholdAlert && (
        <div className={`anomaly-alert ${primaryDriver.status === 'CRITICAL_REDLINE' ? 'critical-banner' : 'warning-banner'}`}>
          <span className="alert-symbol">&#9888;</span>
          <div className="alert-text-group">
            <span className="alert-status-tag">
              {primaryDriver.status === 'CRITICAL_REDLINE' ? 'CRITICAL THRESHOLD BREACH' : 'ELEVATED THERMAL/PRESSURE WARNING'}
            </span>
            <span className="alert-msg">
              <strong>{primaryDriver.sensor} ({primaryDriver.full_name}):</strong> currently at <strong>{primaryDriver.value} {primaryDriver.unit}</strong> (Limit: {primaryDriver.crit_threshold} {primaryDriver.unit}).
              {' '}{primaryDriver.diagnosis}
            </span>
          </div>
          <button
            className="alert-action-btn"
            onClick={() => primaryDriver.station && setActiveStation(primaryDriver.station)}
          >
            Inspect {primaryDriver.station?.toUpperCase()}
          </button>
        </div>
      )}

      {/* ---- HEADER ---- */}
      <header className="header">
        <div className="header-brand">
          <div className="dot" style={{
            background: healthStage === 2 ? 'var(--critical)' :
                        healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)',
            boxShadow: `0 0 10px ${healthStage === 2 ? 'var(--critical)' : healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)'}`,
          }} />
          <div className="brand-titles">
            <h1>CFM56-5B4 Digital Twin</h1>
            <span className="brand-sub">Predictive Health Monitoring & Diagnostic Decision Support</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="control-group">
            <label>ENGINE TAIL #</label>
            <input
              type="number"
              value={engineId}
              onChange={e => setEngineId(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min="1" max="100"
            />
          </div>
          <div className="control-group">
            <label>FLIGHT CYCLE</label>
            <input
              type="number"
              value={currentCycle}
              onChange={e => setCurrentCycle(Math.max(1, Math.min(totalCycles, parseInt(e.target.value) || 1)))}
              min="1" max={totalCycles}
            />
          </div>
        </div>

        <div className="header-status">
          <div className={`status-chip ${healthClass}`}>
            <span style={{ fontSize: 8 }}>&#9679;</span>
            {healthLabel.toUpperCase()}
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            PREDICTED RUL: <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {Math.round(prediction?.rul ?? 0)} cycles
            </span>
          </span>
          <span style={{ color: apiOk ? 'var(--healthy)' : 'var(--critical)', fontSize: 10, fontFamily: 'monospace' }}>
            {apiOk ? '● LIVE C-MAPSS' : '○ API OFFLINE'}
          </span>
        </div>
      </header>

      {/* ---- MAIN WORKSPACE ---- */}
      <div className="workspace">
        <div className="workspace-left">
          {/* Engine cross-section SVG with physical station mapping */}
          <div className="engine-viewport">
            <EngineCrossSection
              activeStation={activeStation}
              onStationClick={setActiveStation}
              prediction={prediction}
              sensorValues={sensorValues}
            />
          </div>

          {/* Sensor strip below the engine with real engineering units and threshold flags */}
          <SensorInfoStrip
            activeStation={activeStation}
            onStationClick={setActiveStation}
            sensorValues={sensorValues}
            physicalSensors={physicalSensors}
            prediction={prediction}
          />
        </div>

        {/* Right diagnostics panel with physical root causes and threshold meters */}
        <DiagnosticsPanel
          prediction={prediction}
          historyData={engineData?.history ?? []}
          currentCycle={currentCycle}
          onSelectStation={setActiveStation}
        />
      </div>

      {/* ---- TIMELINE + FOOTER ---- */}
      <footer className="footer">
        <div className="timeline-row">
          <span className="cycle-indicator-badge">CYCLE {currentCycle}</span>
          <input
            type="range"
            min="1"
            max={totalCycles}
            value={currentCycle}
            onChange={e => setCurrentCycle(parseInt(e.target.value))}
            className="cycle-slider"
          />
          <span className="timeline-label">
            {currentCycle} / {totalCycles} max cycles before failure
          </span>
        </div>
        <div className="footer-meta">
          <span>LSTM Sequence + IForest + TreeSHAP | 21 Turbofan Sensors</span>
        </div>
      </footer>
    </div>
  );
}
