import React, { useState, useEffect } from 'react';
import EngineCrossSection from './components/EngineCrossSection';
import SensorInfoStrip from './components/SensorInfoStrip';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import WorkOrderModal from './components/WorkOrderModal';
import FleetMatrixView from './components/FleetMatrixView';
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
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [activeView, setActiveView] = useState('twin'); // 'twin' | 'fleet'
  const [fleetData, setFleetData] = useState(null);

  // Check API health
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => setApiOk(d.status === 'ok'))
      .catch(() => setApiOk(false));
  }, []);

  // Fetch fleet matrix data across 100 engines
  useEffect(() => {
    fetch(`${API_URL}/fleet`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) setFleetData(d);
      })
      .catch(console.error);
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

  // Current engine and cycle limits
  const totalCycles = engineData?.total_cycles ?? engineData?.history?.length ?? 200;
  const currentHistoryEntry = engineData?.history[currentCycle - 1] ?? null;
  const sensorValues = currentHistoryEntry?.sensors ?? null;
  const physicalSensors = currentHistoryEntry?.physical_sensors ?? null;

  // Real-time Flight Simulation / Auto-play
  useEffect(() => {
    if (!isSimulating) return;
    const intervalTime = Math.max(80, Math.round(900 / simSpeed));
    const timer = setInterval(() => {
      setCurrentCycle(prev => {
        if (prev >= totalCycles) {
          setIsSimulating(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isSimulating, simSpeed, totalCycles]);

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
      {/* ---- HEADER ---- */}
      <header className="header tactical-header">
        <div className="header-brand">
          <div className="dot" style={{
            background: healthStage === 2 ? 'var(--critical)' :
                        healthStage === 1 ? 'var(--degrading)' : 'var(--healthy)',
          }} />
          <div className="brand-titles">
            <h1>JetTwin — Turbofan Digital Twin</h1>
            <span className="brand-sub mono">NASA C-MAPSS FD001 • Predictive Maintenance System</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="control-group">
            <label className="mono">ENGINE ID</label>
            <input
              type="number"
              value={engineId}
              onChange={e => setEngineId(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min="1" max="100"
              className="mono"
            />
          </div>
          <div className="control-group">
            <label className="mono">FLIGHT CYCLE</label>
            <input
              type="number"
              value={currentCycle}
              onChange={e => setCurrentCycle(Math.max(1, Math.min(totalCycles, parseInt(e.target.value) || 1)))}
              min="1" max={totalCycles}
              className="mono"
            />
          </div>
        </div>

        <div className="view-mode-switcher">
          <button
            className={`view-toggle-btn mono ${activeView === 'twin' ? 'active' : ''}`}
            onClick={() => setActiveView('twin')}
          >
            Engine Twin View
          </button>
          <button
            className={`view-toggle-btn mono ${activeView === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveView('fleet')}
          >
            100-Engine Fleet View
          </button>
        </div>

        <div className="header-status">
          <div className={`status-chip mono ${healthClass}`}>
            <span>●</span>
            {healthLabel.toUpperCase()}
          </div>
          <span className="header-rul-stat">
            RUL: <span className="mono tabular-num" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {Math.round(prediction?.rul ?? 0)} CYCLES
            </span>
          </span>
          <span className="mono" style={{ color: apiOk ? 'var(--healthy)' : 'var(--critical)', fontSize: 11 }}>
            {apiOk ? '● Backend Ready' : '● Offline'}
          </span>
        </div>
      </header>

      {/* ---- MAIN WORKSPACE (TWIN or FLEET MATRIX) ---- */}
      {activeView === 'fleet' ? (
        <FleetMatrixView
          fleetData={fleetData}
          onSelectEngine={(eid) => {
            setEngineId(eid);
            setActiveView('twin');
          }}
          onClose={() => setActiveView('twin')}
        />
      ) : (
        <div className="workspace">
          <div className="workspace-left">
            {/* Dynamic Threshold Alert Banner */}
            {hasThresholdAlert && primaryDriver && (
              <div className={`anomaly-alert-card ${primaryDriver.status === 'CRITICAL_REDLINE' ? 'crit-alert' : 'warn-alert'}`}>
                <div className="alert-card-left">
                  <span className="alert-badge">
                    {primaryDriver.status === 'CRITICAL_REDLINE' ? '🔴 CRITICAL THRESHOLD BREACH' : '⚠ WARNING DRIFT'}
                  </span>
                  <span className="alert-details">
                    <b>{primaryDriver.sensor} ({primaryDriver.full_name}):</b> recorded at <b>{primaryDriver.value} {primaryDriver.unit}</b> (Normal baseline: {primaryDriver.baseline} {primaryDriver.unit})
                  </span>
                </div>
                <button
                  className="alert-btn"
                  onClick={() => primaryDriver.station && setActiveStation(primaryDriver.station)}
                >
                  Inspect Section
                </button>
              </div>
            )}

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
            onOpenWorkOrder={() => setIsWorkOrderOpen(true)}
          />
        </div>
      )}

      {/* ---- TIMELINE + FOOTER ---- */}
      <footer className="footer tactical-footer">
        <div className="timeline-row">
          <button
            className={`sim-play-btn mono ${isSimulating ? 'active' : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
            title="Simulate engine cycle progression"
          >
            {isSimulating ? '⏸ Pause' : '▶ Run Simulation'}
          </button>
          <div className="speed-pills">
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                className={`speed-pill mono ${simSpeed === s ? 'active' : ''}`}
                onClick={() => setSimSpeed(s)}
              >
                {s}X
              </button>
            ))}
          </div>
          <span className="cycle-indicator-badge mono">Cycle {currentCycle}</span>
          <input
            type="range"
            min="1"
            max={totalCycles}
            value={currentCycle}
            onChange={e => setCurrentCycle(parseInt(e.target.value))}
            className="cycle-slider"
          />
          <span className="timeline-label mono tabular-num">
            {currentCycle} / {totalCycles} Cycles
          </span>
        </div>
        <div className="footer-meta mono">
          <span>NASA C-MAPSS FD001 • Decision Tree (F1: 0.757) • LSTM RUL • TreeSHAP Explainability</span>
        </div>
      </footer>

      {/* Official Maintenance Work Order Modal */}
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
