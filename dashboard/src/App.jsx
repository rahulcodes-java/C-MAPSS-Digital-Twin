import React, { useState, useEffect, useCallback } from 'react';
import EngineCrossSection from './components/EngineCrossSection';
import SensorInfoStrip from './components/SensorInfoStrip';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import WorkOrderModal from './components/WorkOrderModal';
import FleetMatrixView from './components/FleetMatrixView';
import './App.css';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [engineId, setEngineId]           = useState(1);
  const [currentCycle, setCurrentCycle]   = useState(1);
  const [engineData, setEngineData]       = useState(null);
  const [prediction, setPrediction]       = useState(null);
  const [activeStation, setActiveStation] = useState('hpc');
  const [loading, setLoading]             = useState(true);
  const [apiOk, setApiOk]                 = useState(false);
  const [isSimulating, setIsSimulating]   = useState(false);
  const [simSpeed, setSimSpeed]           = useState(1);
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [activeView, setActiveView]       = useState('twin');
  const [fleetData, setFleetData]         = useState(null);

  // ── Health check (poll every 10s) ──
  const checkHealth = useCallback(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => setApiOk(d.status === 'ok'))
      .catch(() => setApiOk(false));
  }, []);

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 10000);
    return () => clearInterval(id);
  }, [checkHealth]);

  // ── Fleet data (fetch once, retry if empty) ──
  const fetchFleet = useCallback(() => {
    fetch(`${API_URL}/fleet`)
      .then(r => r.json())
      .then(d => { if (!d.error) setFleetData(d); })
      .catch(() => {}); // FleetMatrixView handles missing data with synthetic fallback
  }, []);

  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  // ── Engine history load ──
  useEffect(() => {
    setLoading(true);
    setPrediction(null);
    fetch(`${API_URL}/engine/${engineId}/history`)
      .then(r => r.json())
      .then(data => {
        setEngineData(data);
        setCurrentCycle(1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [engineId]);

  // ── Predict for current cycle ──
  useEffect(() => {
    if (!engineData || currentCycle > (engineData.history?.length ?? 0)) return;
    fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine_id: engineId, cycle: currentCycle }),
    })
      .then(r => r.json())
      .then(data => { if (!data.error) setPrediction(data); })
      .catch(() => {});
  }, [engineId, currentCycle, engineData]);

  // ── Simulation ──
  const totalCycles         = engineData?.total_cycles ?? engineData?.history?.length ?? 200;
  const currentHistoryEntry = engineData?.history?.[currentCycle - 1] ?? null;
  const sensorValues        = currentHistoryEntry?.sensors ?? null;
  const physicalSensors     = currentHistoryEntry?.physical_sensors ?? null;

  useEffect(() => {
    if (!isSimulating) return;
    const ms = Math.max(80, Math.round(900 / simSpeed));
    const tid = setInterval(() => {
      setCurrentCycle(prev => {
        if (prev >= totalCycles) { setIsSimulating(false); return prev; }
        return prev + 1;
      });
    }, ms);
    return () => clearInterval(tid);
  }, [isSimulating, simSpeed, totalCycles]);

  // ── Derived health state ──
  const healthStage  = prediction?.health_stage ?? 0;
  const healthLabel  = prediction?.health_label ?? 'Healthy';
  const healthClass  = healthStage === 2 ? 'critical' : healthStage === 1 ? 'degrading' : 'healthy';
  const healthColor  = healthStage === 2 ? 'var(--critical)' : healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)';

  const primaryDriver     = prediction?.primary_driver;
  const hasThresholdAlert = Boolean(prediction?.has_active_breach && primaryDriver && primaryDriver.status !== 'NORMAL');

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <span>Loading NASA C-MAPSS FD001 telemetry for Engine #{engineId}…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ════════════════════ HEADER ════════════════════ */}
      <header className="header tactical-header">
        {/* Brand */}
        <div className="header-brand">
          <span className="dot" style={{ background: healthColor, boxShadow: `0 0 8px ${healthColor}` }} />
          <div className="brand-titles">
            <h1>JetTwin — CFM56-5B4 Digital Twin</h1>
            <span className="brand-sub mono">NASA C-MAPSS FD001 • LSTM + Decision Tree • TreeSHAP</span>
          </div>
        </div>

        {/* Engine / Cycle inputs */}
        <div className="header-controls">
          <div className="control-group">
            <label className="mono">ENGINE</label>
            <div className="input-with-total">
              <input
                type="number" value={engineId} min="1" max="100" className="mono"
                onChange={e => setEngineId(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              />
              <span className="total-cap mono">/ 100</span>
            </div>
          </div>
          <div className="control-group">
            <label className="mono">CYCLE</label>
            <div className="input-with-total">
              <input
                type="number" value={currentCycle} min="1" max={totalCycles} className="mono"
                onChange={e => setCurrentCycle(Math.max(1, Math.min(totalCycles, parseInt(e.target.value) || 1)))}
              />
              <span className="total-cap mono">/ {totalCycles}</span>
            </div>
          </div>
        </div>

        {/* View switcher */}
        <div className="view-mode-switcher">
          <button
            className={`view-toggle-btn mono ${activeView === 'twin' ? 'active' : ''}`}
            onClick={() => setActiveView('twin')}
          >⚙ Engine Twin</button>
          <button
            className={`view-toggle-btn mono ${activeView === 'fleet' ? 'active' : ''}`}
            onClick={() => { setActiveView('fleet'); fetchFleet(); }}
          >📋 Fleet (100)</button>
        </div>

        {/* Status strip */}
        <div className="header-status">
          <div className={`status-chip mono ${healthClass}`}>
            <span>●</span>{healthLabel.toUpperCase()}
          </div>
          <div className="header-rul-block">
            <span className="rul-small-label mono">RUL</span>
            <span className="rul-small-val mono" style={{ color: healthColor }}>
              {Math.round(prediction?.rul ?? 0)}
            </span>
            <span className="rul-small-unit mono">cyc</span>
          </div>
          <span className={`api-status mono ${apiOk ? 'ok' : 'offline'}`}>
            {apiOk ? '● Live' : '● Offline'}
          </span>
        </div>
      </header>

      {/* ════════════════════ MAIN WORKSPACE ════════════════════ */}
      {activeView === 'fleet' ? (
        <FleetMatrixView
          fleetData={fleetData}
          onSelectEngine={eid => { setEngineId(eid); setActiveView('twin'); }}
          onClose={() => setActiveView('twin')}
        />
      ) : (
        <div className="workspace">
          {/* ─── Left: Engine + Sensors ─── */}
          <div className="workspace-left">

            {/* Threshold alert banner */}
            {hasThresholdAlert && primaryDriver && (
              <div className={`anomaly-alert-card ${primaryDriver.status === 'CRITICAL_REDLINE' ? 'crit-alert' : 'warn-alert'}`}>
                <div className="alert-card-left">
                  <span className="alert-badge">
                    {primaryDriver.status === 'CRITICAL_REDLINE' ? '🔴 CRITICAL THRESHOLD BREACH' : '⚠️ WARNING DRIFT DETECTED'}
                  </span>
                  <span className="alert-details">
                    <b>{primaryDriver.sensor} ({primaryDriver.full_name}):</b>{' '}
                    {primaryDriver.value} {primaryDriver.unit}{' '}
                    <span style={{ color: 'var(--text-muted)' }}>(Nominal: {primaryDriver.baseline} {primaryDriver.unit})</span>
                  </span>
                </div>
                <button
                  className="alert-btn"
                  onClick={() => primaryDriver.station && setActiveStation(primaryDriver.station)}
                >Inspect →</button>
              </div>
            )}

            {/* Engine cross-section SVG */}
            <div className="engine-viewport">
              <EngineCrossSection
                activeStation={activeStation}
                onStationClick={setActiveStation}
                prediction={prediction}
                sensorValues={sensorValues}
                physicalSensors={physicalSensors}
              />
            </div>

            {/* Sensor telemetry strip */}
            <SensorInfoStrip
              activeStation={activeStation}
              onStationClick={setActiveStation}
              sensorValues={sensorValues}
              physicalSensors={physicalSensors}
              prediction={prediction}
            />
          </div>

          {/* ─── Right: Diagnostics panel ─── */}
          <DiagnosticsPanel
            prediction={prediction}
            physicalSensors={physicalSensors}
            historyRul={currentHistoryEntry?.rul ?? null}
            historyHealthStage={currentHistoryEntry?.health_stage ?? null}
            historyData={engineData?.history ?? []}
            currentCycle={currentCycle}
            onSelectStation={setActiveStation}
            onOpenWorkOrder={() => setIsWorkOrderOpen(true)}
          />
        </div>
      )}

      {/* ════════════════════ FOOTER / TIMELINE ════════════════════ */}
      <footer className="footer tactical-footer">
        <div className="timeline-row">
          <button
            className={`sim-play-btn mono ${isSimulating ? 'active' : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
          >
            {isSimulating ? '⏸ Pause' : '▶ Simulate'}
          </button>
          <div className="speed-pills">
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                className={`speed-pill mono ${simSpeed === s ? 'active' : ''}`}
                onClick={() => setSimSpeed(s)}
              >{s}×</button>
            ))}
          </div>
          <span className="cycle-indicator-badge mono">Cycle {currentCycle}</span>
          <input
            type="range" min="1" max={totalCycles} value={currentCycle}
            onChange={e => setCurrentCycle(parseInt(e.target.value))}
            className="cycle-slider"
          />
          <span className="timeline-label mono">{currentCycle} / {totalCycles}</span>
        </div>
        <div className="footer-meta mono">
          NASA C-MAPSS FD001 • LSTM RUL Predictor • Decision Tree Classifier (F1: 0.757) • TreeSHAP Explainability
        </div>
      </footer>

      {/* Work Order Modal */}
      <WorkOrderModal
        isOpen={isWorkOrderOpen}
        onClose={() => setIsWorkOrderOpen(false)}
        engineId={engineId}
        currentCycle={currentCycle}
        totalCycles={totalCycles}
        prediction={prediction}
      />
    </div>
  );
}
