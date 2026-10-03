import { useState, useEffect, useCallback } from 'react';
import { SAMPLE_ENGINES } from './sampleData.js';
import EngineVisualization from './EngineVisualization.jsx';
import SensorPanel from './SensorPanel.jsx';
import HealthStatus from './HealthStatus.jsx';
import AnomalyAlert from './AnomalyAlert.jsx';
import ReplaySlider from './ReplaySlider.jsx';
import MaintenanceScheduler from './MaintenanceScheduler.jsx';

const STAGE_LABEL = { 0: 'Healthy', 1: 'Degrading', 2: 'Critical' };
const STAGE_COLOR = { 0: '#10b981', 1: '#f59e0b', 2: '#ef4444' };

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
      border: '1px solid #1e293b', borderRadius: '14px', padding: '20px',
      ...style
    }}>
      {children}
    </div>
  );
}

export default function App() {
  const [selectedEngineIdx, setSelectedEngineIdx] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const engine = SAMPLE_ENGINES[selectedEngineIdx];
  const frameData = engine.cycles[Math.min(cycle - 1, engine.cycles.length - 1)];

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setCycle(c => {
        if (c >= engine.maxCycles) { setIsPlaying(false); return c; }
        return c + 1;
      });
    }, 80);
    return () => clearInterval(t);
  }, [isPlaying, engine.maxCycles]);

  // Reset cycle when engine changes
  useEffect(() => { setCycle(1); setIsPlaying(false); }, [selectedEngineIdx]);

  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);

  const stageColor = STAGE_COLOR[frameData.health_stage] ?? '#10b981';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", padding: '0' }}>

      {/* ── Header ── */}
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✈️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>JetTwin</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>AI-Powered Jet Engine Digital Twin · NASA C-MAPSS FD001</div>
          </div>
        </div>

        {/* Live status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: `${stageColor}22`, border: `1px solid ${stageColor}55` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: stageColor, boxShadow: `0 0 6px ${stageColor}`, display: 'inline-block' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: stageColor }}>{STAGE_LABEL[frameData.health_stage]}</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>— {engine.name}</span>
        </div>
      </header>

      {/* ── Engine selector ── */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: '10px', overflowX: 'auto', borderBottom: '1px solid #1e293b' }}>
        {SAMPLE_ENGINES.map((e, i) => {
          const last = e.cycles[e.cycles.length - 1];
          const c = STAGE_COLOR[last.health_stage];
          return (
            <button key={e.id} onClick={() => setSelectedEngineIdx(i)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: `1px solid ${i === selectedEngineIdx ? c : '#1e293b'}`,
                background: i === selectedEngineIdx ? `${c}22` : '#0f172a',
                color: i === selectedEngineIdx ? c : '#94a3b8',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}>
              {e.name}
            </button>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <main style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Engine Visualization */}
          <Card>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
              Engine Diagram — {engine.name}
            </div>
            <EngineVisualization zoneHealth={frameData.zone_health} healthStage={frameData.health_stage} />
          </Card>

          {/* Timeline Scrubber */}
          <Card>
            <ReplaySlider
              cycle={cycle}
              maxCycles={engine.maxCycles}
              onChange={setCycle}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
            />
          </Card>

          {/* Anomaly Alert */}
          <Card>
            <AnomalyAlert isAnomalous={frameData.is_anomalous} rul={frameData.rul} />
          </Card>

          {/* Maintenance Scheduler */}
          <Card>
            <MaintenanceScheduler rul={frameData.rul} healthStage={frameData.health_stage} isAnomalous={frameData.is_anomalous} />
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Health Status */}
          <Card>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
              Health Status
            </div>
            <HealthStatus healthStage={frameData.health_stage} rul={frameData.rul} confidence={frameData.confidence} maxCycles={engine.maxCycles} />
          </Card>

          {/* Sensor Panel */}
          <Card>
            <SensorPanel topSensors={frameData.top_sensors} importanceScores={frameData.importance} sensorValues={frameData.sensors} />
          </Card>

          {/* Metrics summary */}
          <Card>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Model Metrics (FD001)
            </div>
            {[
              { label: 'Naive Bayes F1',       value: '0.872', color: '#10b981' },
              { label: 'Decision Tree F1',      value: '0.599', color: '#f59e0b' },
              { label: 'Best Silhouette (K=2)', value: '0.052', color: '#7dd3fc' },
              { label: 'Anomaly Precision',     value: '1.000', color: '#10b981' },
              { label: 'Anomaly Recall',        value: '0.148', color: '#f97316' },
              { label: 'RUL RMSE',              value: '81.2',  color: '#7dd3fc' },
              { label: 'Cost Savings',          value: '17.0%', color: '#10b981' },
            ].map(m => (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{m.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: 700, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </Card>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '11px', color: '#334155', borderTop: '1px solid #1e293b', marginTop: '10px' }}>
        JetTwin · AI-Powered Digital Twin · NASA C-MAPSS FD001 · DWM Mini-Project 2026 · Research: Saxena 2008, Özcan 2025
      </footer>
    </div>
  );
}
