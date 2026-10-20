import React from 'react';

export default function WorkOrderModal({ isOpen, onClose, engineId, currentCycle, totalCycles, prediction }) {
  if (!isOpen) return null;

  const rul = Math.round(prediction?.rul ?? 0);
  const healthLabel = prediction?.health_label ?? 'Healthy';
  const healthStage = prediction?.health_stage ?? 0;
  const primaryDriver = prediction?.primary_driver;
  const topSensors = prediction?.top_sensors ?? [];
  const confidence = Math.round((prediction?.confidence ?? 0.92) * 100);

  const workOrderNo = `FAA-8130-CFM56-SN${1000 + engineId}-CYC${String(currentCycle).padStart(4, '0')}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="work-order-modal airworthiness-directive" onClick={e => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="modal-top-bar">
          <div className="doc-badge mono">FAA FORM 8130-3 / EASA FORM 1 • AIRWORTHINESS RELEASE CERTIFICATE</div>
          <div className="modal-actions">
            <button className="print-btn mono" onClick={handlePrint}>[PRINT / EXPORT PDF]</button>
            <button className="close-btn mono" onClick={onClose}>[DISMISS]</button>
          </div>
        </div>

        {/* Work Order Content */}
        <div className="work-order-document">
          <div className="wo-header">
            <div className="wo-title-group">
              <span className="wo-gov-tag mono">CIVIL AVIATION AIRWORTHINESS DIRECTIVE • AMM CHAPTER 72</span>
              <h2>POWERPLANT MAINTENANCE DISPATCH WORK ORDER</h2>
              <p className="wo-subtitle mono">CFM INTERNATIONAL CFM56-5B4/P DUAL-SPOOL TURBOFAN ENGINE</p>
            </div>
            <div className="wo-meta-box mono">
              <div><strong>TRACKING DIRECTIVE:</strong> <span>{workOrderNo}</span></div>
              <div><strong>ISSUE DATE / UTC:</strong> <span>{todayStr} 00:00Z</span></div>
              <div><strong>DISPATCH STATUS:</strong> <span className={`status-tag-text ${healthLabel.toLowerCase()}`}>{healthLabel.toUpperCase()}</span></div>
            </div>
          </div>

          <hr className="wo-divider" />

          {/* Aircraft & Engine Identification */}
          <div className="wo-grid">
            <div className="wo-grid-item">
              <span className="wo-label">ENGINE SERIAL NUMBER:</span>
              <span className="wo-val mono">CFM56-5B4-SN{1000 + engineId}</span>
            </div>
            <div className="wo-grid-item">
              <span className="wo-label">AIRCRAFT TAIL / REG:</span>
              <span className="wo-val mono">AIRBUS A320-214 (VT-IFH)</span>
            </div>
            <div className="wo-grid-item">
              <span className="wo-label">ACCUMULATED TIME (CYCLES):</span>
              <span className="wo-val mono tabular-num">{currentCycle} OF {totalCycles} FLIGHT CYCLES</span>
            </div>
            <div className="wo-grid-item">
              <span className="wo-label">PREDICTED RUL:</span>
              <span className="wo-val mono highlight-rul tabular-num">{rul} FLIGHT CYCLES REMAINING</span>
            </div>
            <div className="wo-grid-item">
              <span className="wo-label">DIAGNOSTIC CONFIDENCE:</span>
              <span className="wo-val mono tabular-num">{confidence}% (MULTI-MODEL ENSEMBLE)</span>
            </div>
            <div className="wo-grid-item">
              <span className="wo-label">PRIMARY WEAR ASSEMBLY:</span>
              <span className="wo-val mono">{prediction?.inspection_area ?? 'HPC'} (ATA 72-30)</span>
            </div>
          </div>

          {/* Diagnostic Root Cause */}
          <div className="wo-section">
            <h3 className="wo-section-title mono">1. THERMODYNAMIC ROOT CAUSE & EXCURSION DIAGNOSIS</h3>
            <div className="wo-callout">
              <p><strong>Primary Wear Driver:</strong> {primaryDriver ? `${primaryDriver.sensor} — ${primaryDriver.full_name}` : 'All 21 Channels Operating Within Standard Sea-Level Baseline'}</p>
              <p><strong>Mechanical Failure Mode:</strong> {primaryDriver?.diagnosis || 'Thermodynamic efficiency baseline intact. No abnormal boundary layer separation detected.'}</p>
              <p><strong>Target Hardware:</strong> {primaryDriver?.target || 'Standard flight-line walkaround visual inspection.'}</p>
            </div>
          </div>

          {/* Telemetry Snapshot Table */}
          {primaryDriver && primaryDriver.status !== 'NORMAL' && (
            <div className="wo-section">
              <h3 className="wo-section-title mono">2. CALIBRATED TELEMETRY CHANNELS AT EXCURSION</h3>
              <table className="wo-table">
                <thead>
                  <tr className="mono">
                    <th>Channel</th>
                    <th>Station</th>
                    <th>Live Reading</th>
                    <th>Baseline</th>
                    <th>Certified Limit</th>
                    <th>Drift (Δ)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="mono">
                    <td><strong>{primaryDriver.sensor}</strong> ({primaryDriver.full_name})</td>
                    <td>{primaryDriver.station?.toUpperCase()}</td>
                    <td className="tabular-num">{primaryDriver.value} {primaryDriver.unit}</td>
                    <td className="tabular-num">{primaryDriver.baseline} {primaryDriver.unit}</td>
                    <td className="tabular-num">{primaryDriver.crit_threshold} {primaryDriver.unit}</td>
                    <td className="tabular-num">{primaryDriver.delta >= 0 ? `+${primaryDriver.delta}` : primaryDriver.delta}</td>
                    <td><span className={`status-pill mono ${primaryDriver.status.toLowerCase()}`}>{primaryDriver.status}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* SHAP Attribution */}
          {topSensors.length > 0 && (
            <div className="wo-section">
              <h3 className="wo-section-title mono">3. EXPLAINABILITY WEAR ATTRIBUTION (TREESHAP COEFFICIENTS)</h3>
              <div className="wo-shap-grid">
                {topSensors.map((s, idx) => (
                  <div key={idx} className="wo-shap-item mono">
                    <span><strong>{s.sensor}:</strong> {s.importance}% wear contribution</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptive Engineering Action */}
          <div className="wo-section">
            <h3 className="wo-section-title mono">4. MANDATORY MAINTENANCE ACTIONS PER AMM CHAPTER 72</h3>
            <div className={`wo-action-box ${healthStage === 2 ? 'crit' : healthStage === 1 ? 'warn' : 'nom'}`}>
              {healthStage === 2 ? (
                <div>
                  <p><strong>MANDATORY GROUNDING ORDER:</strong> Powerplant entered critical failure envelope (&le; 30 cycles remaining).</p>
                  <p>1. De-mate engine CFM56-5B4-SN{1000 + engineId} immediately and transfer to base overhaul facility.</p>
                  <p>2. Perform non-destructive eddy-current and ultrasonic inspection on {primaryDriver?.target || 'HPC Rotor Assemblies'}.</p>
                  <p>3. Do NOT release for revenue flight without full powerplant shop overhaul sign-off.</p>
                </div>
              ) : healthStage === 1 ? (
                <div>
                  <p><strong>SCHEDULED LINE BORESCOPE REQUIRED:</strong> Progressive degradation signature detected. Current RUL is {rul} cycles.</p>
                  <p>1. Schedule overnight borescope inspection of {primaryDriver?.target || 'HPC Interstage Air Seals'} within 15 flight cycles.</p>
                  <p>2. Pre-stage replacement hardware and consumable O-rings at designated line station.</p>
                  <p>3. Verify post-inspection EGT margin and bleed air enthalpy prior to extended operations (ETOPS).</p>
                </div>
              ) : (
                <div>
                  <p><strong>AIRWORTHINESS RELEASE AUTHORIZED:</strong> Powerplant operates within certified airworthiness envelope.</p>
                  <p>1. Continue routine pre-flight and transit flight-line monitoring per standard maintenance manual.</p>
                  <p>2. Next scheduled A-Check inspection at flight cycle {currentCycle + 50}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="wo-signatures mono">
            <div className="sig-box">
              <div className="sig-line"></div>
              <span>DIGITAL TWIN PROGNOSTICS CERTIFICATION (SYSTEM VERIFIED)</span>
            </div>
            <div className="sig-box">
              <div className="sig-line"></div>
              <span>LICENSED AIRCRAFT MAINTENANCE ENGINEER (LAME / A&P SIGN-OFF)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
