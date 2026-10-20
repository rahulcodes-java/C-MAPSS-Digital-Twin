import React, { useState } from 'react';

/**
 * FleetMatrixView.jsx
 * Airline Fleet Health & Propulsion MRO Command Matrix
 * Active airworthiness tracking across 100 commercial CFM56-5B4 turbofans.
 */
export default function FleetMatrixView({ fleetData, onSelectEngine, onClose }) {
  const [filterStage, setFilterStage] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('RUL_ASC');

  const fleet = fleetData?.fleet ?? [];
  const healthyCount = fleetData?.healthy_count ?? 0;
  const degradingCount = fleetData?.degrading_count ?? 0;
  const criticalCount = fleetData?.critical_count ?? 0;
  const avgRul = fleetData?.avg_fleet_rul ?? 0;

  // Filter engines
  const filteredFleet = fleet.filter(engine => {
    if (filterStage === 'HEALTHY' && engine.health_stage !== 0) return false;
    if (filterStage === 'DEGRADING' && engine.health_stage !== 1) return false;
    if (filterStage === 'CRITICAL' && engine.health_stage !== 2) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = String(engine.engine_id).includes(term);
      const matchTail = engine.tail_number.toLowerCase().includes(term);
      const matchStation = engine.primary_station.toLowerCase().includes(term);
      if (!matchId && !matchTail && !matchStation) return false;
    }
    return true;
  });

  // Sort engines
  const sortedFleet = [...filteredFleet].sort((a, b) => {
    if (sortBy === 'RUL_ASC') return a.rul - b.rul;
    if (sortBy === 'RUL_DESC') return b.rul - a.rul;
    if (sortBy === 'CYCLES_DESC') return b.cycles_flown - a.cycles_flown;
    return a.engine_id - b.engine_id;
  });

  return (
    <div className="fleet-matrix-container tactical-fleet">
      {/* Fleet Command Header Summary */}
      <div className="fleet-header-panel">
        <div className="fleet-title-group">
          <div className="fleet-badge mono">AIRLINE MRO FLEET OPERATIONS COMMAND MATRIX</div>
          <h2>Commercial Propulsion Health & Dispatch Queue</h2>
          <p className="fleet-desc mono">
            Active monitoring across 100 CFM56-5B4/P powerplants (Airbus A320 Fleet). Prioritized by Remaining Useful Life (RUL) and shop visit urgency.
          </p>
        </div>

        <div className="fleet-metrics-strip">
          <div className="fleet-metric-card total">
            <span className="fm-label mono">TOTAL POWERPLANTS</span>
            <span className="fm-val mono tabular-num">100</span>
            <span className="fm-sub mono">A320-214 Fleet</span>
          </div>

          <div
            className={`fleet-metric-card healthy ${filterStage === 'HEALTHY' ? 'active' : ''}`}
            onClick={() => setFilterStage(filterStage === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
            title="Filter airworthy engines"
          >
            <span className="fm-label mono">LINE CLEARED</span>
            <span className="fm-val mono tabular-num">{healthyCount}</span>
            <span className="fm-sub mono">RUL &gt; 100 cycles</span>
          </div>

          <div
            className={`fleet-metric-card degrading ${filterStage === 'DEGRADING' ? 'active' : ''}`}
            onClick={() => setFilterStage(filterStage === 'DEGRADING' ? 'ALL' : 'DEGRADING')}
            title="Filter scheduled borescope queue"
          >
            <span className="fm-label mono">BORESCOPE QUEUE</span>
            <span className="fm-val mono tabular-num">{degradingCount}</span>
            <span className="fm-sub mono">30 &lt; RUL &le; 100c</span>
          </div>

          <div
            className={`fleet-metric-card critical ${filterStage === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setFilterStage(filterStage === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            title="Filter critical AOG grounding queue"
          >
            <span className="fm-label mono">CRITICAL AOG ALERT</span>
            <span className="fm-val mono tabular-num">{criticalCount}</span>
            <span className="fm-sub mono">RUL &le; 30 cycles</span>
          </div>

          <div className="fleet-metric-card avg">
            <span className="fm-label mono">FLEET MEAN RUL</span>
            <span className="fm-val mono tabular-num">{avgRul}</span>
            <span className="fm-sub mono">Flight Cycles</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="fleet-toolbar">
        <div className="fleet-tabs">
          <button
            className={`f-tab mono ${filterStage === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStage('ALL')}
          >
            ALL POWERPLANTS (100)
          </button>
          <button
            className={`f-tab crit mono ${filterStage === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setFilterStage('CRITICAL')}
          >
            [AOG ALERT: {criticalCount}]
          </button>
          <button
            className={`f-tab warn mono ${filterStage === 'DEGRADING' ? 'active' : ''}`}
            onClick={() => setFilterStage('DEGRADING')}
          >
            [BORESCOPE DUE: {degradingCount}]
          </button>
          <button
            className={`f-tab nom mono ${filterStage === 'HEALTHY' ? 'active' : ''}`}
            onClick={() => setFilterStage('HEALTHY')}
          >
            [LINE CLEARED: {healthyCount}]
          </button>
        </div>

        <div className="fleet-search-group">
          <input
            type="text"
            placeholder="Search Serial, Station (e.g. SN1034, HPC)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="fleet-search-input mono"
          />
          <div className="fleet-sort-box mono">
            <label>SORT PRIORITY:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="fleet-sort-select mono">
              <option value="RUL_ASC">Lowest RUL (Urgency First)</option>
              <option value="RUL_DESC">Highest RUL First</option>
              <option value="CYCLES_DESC">Highest Accumulated Cycles</option>
              <option value="ID_ASC">Engine Index (1 - 100)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 100-Engine Cards Grid */}
      <div className="fleet-grid">
        {sortedFleet.map(engine => {
          const isCrit = engine.health_stage === 2;
          const isWarn = engine.health_stage === 1;
          const statusClass = isCrit ? 'critical' : isWarn ? 'degrading' : 'healthy';

          return (
            <div
              key={engine.engine_id}
              className={`fleet-engine-card ${statusClass}`}
              onClick={() => onSelectEngine(engine.engine_id)}
            >
              <div className="fcard-header">
                <div className="fcard-tail">
                  <span className="fcard-id mono">ENGINE #{String(engine.engine_id).padStart(3, '0')}</span>
                  <span className="fcard-sn mono">{engine.tail_number}</span>
                </div>
                <span className={`fcard-status-badge mono ${statusClass}`}>
                  [{engine.dispatch_status}]
                </span>
              </div>

              <div className="fcard-body">
                <div className="fcard-rul-box">
                  <span className="fcard-rul-num mono tabular-num">{engine.rul}</span>
                  <span className="fcard-rul-label mono">RUL CYCLES</span>
                </div>

                <div className="fcard-details mono">
                  <div className="fcard-detail-row">
                    <span>Cycles Flown:</span>
                    <strong className="tabular-num">{engine.cycles_flown} flights</strong>
                  </div>
                  <div className="fcard-detail-row">
                    <span>Critical Station:</span>
                    <strong>{engine.primary_station}</strong>
                  </div>
                  <div className="fcard-detail-row">
                    <span>Wear Vector:</span>
                    <strong style={{ fontSize: 9.5 }}>{engine.wear_driver}</strong>
                  </div>
                </div>
              </div>

              {/* Risk Meter Bar */}
              <div className="fcard-risk-bar">
                <div
                  className={`fcard-risk-fill ${statusClass}`}
                  style={{ width: `${engine.risk_score}%` }}
                />
              </div>

              <div className="fcard-footer mono">
                <span className="fcard-risk-txt">RISK ENVELOPE: {engine.risk_score}%</span>
                <span className="fcard-inspect-btn">
                  [INSPECT TWIN →]
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
