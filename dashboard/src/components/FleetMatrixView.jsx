import React, { useState } from 'react';

/**
 * FleetMatrixView.jsx
 * 100-Engine Fleet Health Matrix for CFM56-5B4 Turbofan Fleet.
 * Works even when API is offline — generates a synthetic fleet for demo.
 */

// Generate a deterministic synthetic fleet when API data is unavailable
function getSyntheticFleet() {
  const fleet = [];
  const seeds = [
    112,45,78,23,167,89,34,201,55,98,
    143,66,190,37,82,155,28,101,73,188,
    44,130,17,95,162,51,119,86,174,39,
    107,63,180,26,141,58,123,88,197,32,
    115,70,185,41,100,77,152,19,135,93,
    168,48,113,81,196,35,102,69,146,24,
    137,84,173,50,118,75,160,30,148,87,
    195,42,109,66,182,53,126,91,169,38,
    111,79,154,22,140,67,183,46,124,85,
    198,31,104,71,144,57,121,80,166,29,
  ];
  for (let i = 0; i < 100; i++) {
    const rul = seeds[i] ?? Math.max(5, 200 - i * 2);
    const stage = rul > 100 ? 0 : rul > 30 ? 1 : 2;
    const dispatch = stage === 0 ? 'CLEARED' : stage === 1 ? 'BORESCOPE DUE' : 'AOG GROUND';
    const stations = ['HPC', 'LPT', 'Combustor'];
    const wears    = ['Ps30 drop', 'T50 rise', 'phi drift'];
    const si = i % 3;
    fleet.push({
      engine_id: i + 1,
      tail_number: `CFM56-SN${1001 + i}`,
      cycles_flown: 200 - Math.round(rul * 0.6),
      rul,
      health_stage: stage,
      health_label: ['Healthy','Degrading','Critical'][stage],
      dispatch_status: dispatch,
      primary_station: stations[si],
      wear_driver: wears[si],
      risk_score: Math.max(4, Math.min(98, Math.round((1 - Math.min(rul, 125) / 125) * 100))),
    });
  }
  return fleet;
}

export default function FleetMatrixView({ fleetData, onSelectEngine, onClose }) {
  const [filterStage, setFilterStage] = useState('ALL');
  const [searchTerm, setSearchTerm]   = useState('');
  const [sortBy, setSortBy]           = useState('RUL_ASC');

  // Use API data if available, else synthetic
  const rawFleet        = fleetData?.fleet?.length > 0 ? fleetData.fleet : getSyntheticFleet();
  const healthyCount    = rawFleet.filter(e => e.health_stage === 0).length;
  const degradingCount  = rawFleet.filter(e => e.health_stage === 1).length;
  const criticalCount   = rawFleet.filter(e => e.health_stage === 2).length;
  const avgRul          = fleetData?.avg_fleet_rul
    ?? Math.round(rawFleet.reduce((a, e) => a + e.rul, 0) / rawFleet.length);
  const isDemo          = !fleetData?.fleet?.length;

  // Filter
  const filtered = rawFleet.filter(engine => {
    if (filterStage === 'HEALTHY'  && engine.health_stage !== 0) return false;
    if (filterStage === 'DEGRADING'&& engine.health_stage !== 1) return false;
    if (filterStage === 'CRITICAL' && engine.health_stage !== 2) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      return (
        String(engine.engine_id).includes(t) ||
        engine.tail_number.toLowerCase().includes(t) ||
        engine.primary_station.toLowerCase().includes(t)
      );
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'RUL_ASC')     return a.rul - b.rul;
    if (sortBy === 'RUL_DESC')    return b.rul - a.rul;
    if (sortBy === 'CYCLES_DESC') return b.cycles_flown - a.cycles_flown;
    return a.engine_id - b.engine_id;
  });

  const stageLabel = { 0: 'HEALTHY', 1: 'DEGRADING', 2: 'CRITICAL' };
  const stageClass = { 0: 'healthy', 1: 'degrading', 2: 'critical' };

  return (
    <div className="fleet-matrix-container tactical-fleet">
      {/* ── Header ── */}
      <div className="fleet-header-panel">
        <div className="fleet-title-group">
          <div className="fleet-badge mono">AIRLINE MRO FLEET — PROPULSION HEALTH MATRIX</div>
          <h2>100-Engine Fleet Status Dashboard</h2>
          <p className="fleet-desc">
            CFM56-5B4 / A320 Fleet — Real NASA C-MAPSS FD001 engine health predictions.
            {isDemo && <span className="demo-tag"> (Demo data — API offline)</span>}
          </p>
        </div>

        <div className="fleet-metrics-strip">
          <div className="fleet-metric-card total">
            <span className="fm-num mono">{rawFleet.length}</span>
            <span className="fm-label">TOTAL ENGINES</span>
            <span className="fm-sub">CFM56-5B4 Fleet</span>
          </div>
          <div
            className={`fleet-metric-card healthy ${filterStage === 'HEALTHY' ? 'active' : ''}`}
            onClick={() => setFilterStage(filterStage === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
          >
            <span className="fm-num mono healthy-txt">{healthyCount}</span>
            <span className="fm-label">LINE CLEARED</span>
            <span className="fm-sub">RUL &gt; 100 cycles</span>
          </div>
          <div
            className={`fleet-metric-card degrading ${filterStage === 'DEGRADING' ? 'active' : ''}`}
            onClick={() => setFilterStage(filterStage === 'DEGRADING' ? 'ALL' : 'DEGRADING')}
          >
            <span className="fm-num mono warn-txt">{degradingCount}</span>
            <span className="fm-label">BORESCOPE DUE</span>
            <span className="fm-sub">30 &lt; RUL ≤ 100</span>
          </div>
          <div
            className={`fleet-metric-card critical ${filterStage === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setFilterStage(filterStage === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          >
            <span className="fm-num mono crit-txt">{criticalCount}</span>
            <span className="fm-label">AOG CRITICAL</span>
            <span className="fm-sub">RUL ≤ 30 cycles</span>
          </div>
          <div className="fleet-metric-card avg">
            <span className="fm-num mono accent-txt">{avgRul}</span>
            <span className="fm-label">FLEET AVG RUL</span>
            <span className="fm-sub">Flight Cycles</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="fleet-toolbar">
        <div className="fleet-tabs">
          {[
            { key: 'ALL',       label: `All (${rawFleet.length})`, cls: '' },
            { key: 'CRITICAL',  label: `AOG Alert (${criticalCount})`, cls: 'crit' },
            { key: 'DEGRADING', label: `Borescope Due (${degradingCount})`, cls: 'warn' },
            { key: 'HEALTHY',   label: `Cleared (${healthyCount})`, cls: 'nom' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`f-tab ${tab.cls} mono ${filterStage === tab.key ? 'active' : ''}`}
              onClick={() => setFilterStage(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="fleet-search-group">
          <input
            type="text"
            placeholder="Search engine # or station…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="fleet-search-input mono"
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="fleet-sort-select mono">
            <option value="RUL_ASC">Urgency First (Lowest RUL)</option>
            <option value="RUL_DESC">Healthiest First</option>
            <option value="CYCLES_DESC">Most Flight Cycles</option>
            <option value="ID_ASC">Engine ID Order</option>
          </select>
        </div>
      </div>

      {/* ── Engine Cards Grid ── */}
      {sorted.length === 0 ? (
        <div className="fleet-empty">No engines match the current filter.</div>
      ) : (
        <div className="fleet-grid">
          {sorted.map(engine => {
            const cls = stageClass[engine.health_stage] ?? 'healthy';
            const lbl = stageLabel[engine.health_stage] ?? 'HEALTHY';
            const barPct = Math.min(100, engine.risk_score);

            return (
              <div
                key={engine.engine_id}
                className={`fleet-engine-card ${cls}`}
                onClick={() => onSelectEngine(engine.engine_id)}
                title="Click to open Engine Twin View"
              >
                {/* Card header */}
                <div className="fcard-header">
                  <div>
                    <div className="fcard-id mono">ENG #{String(engine.engine_id).padStart(3, '0')}</div>
                    <div className="fcard-sn mono">{engine.tail_number}</div>
                  </div>
                  <span className={`fcard-status-badge ${cls}`}>{lbl}</span>
                </div>

                {/* RUL big number */}
                <div className="fcard-rul-box">
                  <span className={`fcard-rul-num mono ${cls}-txt`}>{engine.rul}</span>
                  <span className="fcard-rul-label">cycles RUL</span>
                </div>

                {/* Details */}
                <div className="fcard-details mono">
                  <div className="fcard-detail-row">
                    <span>Cycles flown</span>
                    <strong>{engine.cycles_flown}</strong>
                  </div>
                  <div className="fcard-detail-row">
                    <span>Wear zone</span>
                    <strong>{engine.primary_station}</strong>
                  </div>
                  <div className="fcard-detail-row">
                    <span>Driver</span>
                    <strong style={{fontSize:'9.5px'}}>{engine.wear_driver}</strong>
                  </div>
                </div>

                {/* Risk bar */}
                <div className="fcard-risk-bar">
                  <div className={`fcard-risk-fill ${cls}`} style={{ width: `${barPct}%` }} />
                </div>
                <div className="fcard-footer mono">
                  <span>Risk: {engine.risk_score}%</span>
                  <span className="fcard-action">{engine.dispatch_status} →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
