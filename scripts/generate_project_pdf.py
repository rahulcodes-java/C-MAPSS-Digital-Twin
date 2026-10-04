import os
import base64
from playwright.sync_api import sync_playwright

def get_base64_image(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
        ext = os.path.splitext(path)[1].replace(".", "")
        return f"data:image/{ext};base64,{data}"

print("Encoding screenshots...")
img_nom = get_base64_image("reports/figures/dashboard_nominal_cycle1.png")
img_crit = get_base64_image("reports/figures/dashboard_critical_cycle192.png")
img_engine = get_base64_image("reports/figures/engine_cross_section_close.png")
img_strip = get_base64_image("reports/figures/sensor_strip_close.png")
img_diag = get_base64_image("reports/figures/diagnostics_panel_close.png")

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CFM56-5B4 Turbofan Digital Twin — Comprehensive Technical Project Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  @page {
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
    @bottom-right {
      content: counter(page);
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      color: #64748b;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 9pt;
    line-height: 1.5;
  }

  .mono {
    font-family: 'JetBrains Mono', monospace;
  }

  .page-break {
    page-break-after: always;
  }
  .avoid-break {
    page-break-inside: avoid;
  }

  .cover-header {
    background: linear-gradient(135deg, #0b0f19 0%, #1e293b 100%);
    color: white;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .badge-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .badge-primary { background: #3b82f6; color: white; }
  .badge-success { background: #10b981; color: white; }
  .badge-dark { background: rgba(255,255,255,0.15); color: #e2e8f0; }

  .cover-title {
    font-size: 19pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 8px;
    color: #ffffff;
  }

  .cover-subtitle {
    font-size: 10.5pt;
    color: #94a3b8;
    font-weight: 400;
    margin-bottom: 14px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 12px;
    font-size: 8pt;
  }

  .meta-item span {
    display: block;
    color: #64748b;
    font-size: 7pt;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
  }

  .meta-item strong {
    color: #f1f5f9;
    font-weight: 600;
  }

  h1 {
    font-size: 13.5pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 5px;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 11pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 12px;
    margin-bottom: 6px;
  }

  h3 {
    font-size: 9.5pt;
    font-weight: 600;
    color: #334155;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  p {
    margin-bottom: 8px;
    text-align: justify;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px 0;
    font-size: 8pt;
  }

  th, td {
    padding: 5px 7px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }

  th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    text-transform: uppercase;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .callout {
    padding: 10px 12px;
    border-radius: 6px;
    margin: 10px 0;
    border-left: 3.5px solid;
    font-size: 8.5pt;
  }

  .callout-info {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1e3a8a;
  }

  .callout-success {
    background: #f0fdf4;
    border-color: #10b981;
    color: #064e3b;
  }

  .callout-warning {
    background: #fffbeb;
    border-color: #f59e0b;
    color: #78350f;
  }

  .figure-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 7px;
    margin: 10px 0;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  }

  .figure-card img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    display: block;
    border: 1px solid #e2e8f0;
  }

  .figure-caption {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 5px;
    text-align: center;
    font-weight: 500;
  }

  .figure-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 10px 0;
  }

  .person-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 10px;
    background: #ffffff;
    border-left: 4px solid #3b82f6;
  }

  .person-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }

  .person-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0f172a;
  }

  .person-role {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    color: #3b82f6;
    font-weight: 600;
  }

  ul {
    margin-left: 18px;
    margin-bottom: 6px;
    font-size: 8.5pt;
  }

  li {
    margin-bottom: 3px;
  }

  .pipeline-flow {
    background: #0b0f19;
    color: #e2e8f0;
    padding: 10px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 6.8pt;
    line-height: 1.35;
    margin: 10px 0;
    overflow-x: auto;
  }
</style>
</head>
<body>

<!-- COVER / HEADER -->
<div class="cover-header">
  <div class="badge-row">
    <span class="badge badge-primary">DWM SEM-5 CAPSTONE PROJECT</span>
    <span class="badge badge-success">AEROSPACE DIGITAL TWIN</span>
    <span class="badge badge-dark">NASA C-MAPSS FD001-FD004</span>
    <span class="badge badge-dark">CFM56-5B4 TURBOFAN</span>
  </div>
  <div class="cover-title">CFM56-5B4 Turbofan Jet Engine Digital Twin</div>
  <div class="cover-subtitle">Predictive Health Monitoring, Multivariable Prognostics, and Human-in-the-Loop Maintenance Decision Support</div>
  <div class="meta-grid">
    <div class="meta-item">
      <span>Domain</span>
      <strong>Aero-Prognostics & ML</strong>
    </div>
    <div class="meta-item">
      <span>Data Source</span>
      <strong>NASA Glenn C-MAPSS</strong>
    </div>
    <div class="meta-item">
      <span>Fleet Size</span>
      <strong>1,416 Engines / 21 Sensors</strong>
    </div>
    <div class="meta-item">
      <span>Architecture</span>
      <strong>LSTM + IForest + TreeSHAP</strong>
    </div>
  </div>
</div>

<!-- SECTION 1 -->
<h1>1. Project Overview & Problem Statement</h1>

<p>
Commercial aviation maintenance operates under extreme financial and safety constraints. Unscheduled engine groundings—known as <strong>Aircraft on Ground (AOG)</strong> events—cost airlines between <strong>$150,000 and $300,000 per hour</strong> in flight delays, passenger compensation, and emergency logistics. Traditional aviation maintenance relies primarily on static, interval-based schedules (such as A, B, and C-checks every 500–6,000 flight hours) and conservative redline threshold alarms.
</p>

<p>
However, interval-based checks fail to detect early internal thermo-mechanical degradation, while single-sensor redline alarms trigger only <em>after</em> physical damage (such as rotor blade tip rub, seal leakage, or compressor aerodynamic stall) has already occurred.
</p>

<div class="callout callout-info">
  <strong>The Digital Twin Solution:</strong> This project implements an industrial-grade <strong>Digital Twin of the CFM56-5B4 commercial turbofan engine</strong>. By creating a synchronized computational mirror of physical engine telemetry, the system continuously tracks 21 sensor channels across 6 thermodynamic stations. It pairs dual-track predictive machine learning (LSTM sequence regression for Remaining Useful Life and unsupervised Isolation Forest for anomaly detection) with <strong>Explainable AI (TreeSHAP)</strong> and statistical threshold analysis. This converts "black-box" neural network outputs into human-understandable physical diagnoses for flight-line maintenance crews.
</div>

<!-- SECTION 2 -->
<h1>2. NASA C-MAPSS Dataset Architecture</h1>

<p>
The project is built on the gold-standard <strong>NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS)</strong> dataset developed by the NASA Glenn Research Center. The simulator accurately models a 90,000-lb thrust commercial dual-spool turbofan engine with transient flight envelope dynamics.
</p>

<h2>2.1 Complete 21-Sensor Inventory & Station Mapping</h2>
<p>
Each flight cycle records 26 raw variables: Engine ID, Flight Cycle, 3 Operational Settings (Altitude, Mach number, Throttle Resolver Angle), and <strong>21 Physical Sensors</strong>. All 21 sensors are strictly preserved in our preprocessing and pipeline:
</p>

<table>
  <thead>
    <tr>
      <th>Sensor</th>
      <th>Physical Description</th>
      <th>Engine Station</th>
      <th>Engineering Unit</th>
      <th>Nominal Baseline</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>T2</strong></td><td>Total temperature at fan inlet</td><td>Station 1 (Fan/Inlet)</td><td>°R (Rankine)</td><td>518.67 °R</td></tr>
    <tr><td><strong>T24</strong></td><td>Total temperature at LPC outlet</td><td>Station 2 (LPC)</td><td>°R (Rankine)</td><td>642.38 °R</td></tr>
    <tr><td><strong>T30</strong></td><td>Total temperature at HPC outlet</td><td>Station 3 (HPC)</td><td>°R (Rankine)</td><td>1586.84 °R</td></tr>
    <tr><td><strong>T50</strong></td><td>Total temperature at LPT outlet (EGT)</td><td>Station 6 (LPT)</td><td>°R (Rankine)</td><td>1402.76 °R</td></tr>
    <tr><td><strong>P2</strong></td><td>Total pressure at fan inlet</td><td>Station 1 (Fan/Inlet)</td><td>psia</td><td>14.62 psia</td></tr>
    <tr><td><strong>P15</strong></td><td>Total pressure in bypass duct</td><td>Station 6 (Bypass Duct)</td><td>psia</td><td>21.61 psia</td></tr>
    <tr><td><strong>P30</strong></td><td>Total pressure at HPC outlet</td><td>Station 3 (HPC)</td><td>psia</td><td>553.95 psia</td></tr>
    <tr><td><strong>Nf</strong></td><td>Physical fan rotational speed</td><td>Station 1 (Fan/Inlet)</td><td>rpm</td><td>2388.06 rpm</td></tr>
    <tr><td><strong>Nc</strong></td><td>Physical core spool speed</td><td>Station 3 (HPC)</td><td>rpm</td><td>9056.01 rpm</td></tr>
    <tr><td><strong>epr</strong></td><td>Engine pressure ratio (P50/P2)</td><td>Station 1 (Engine Level)</td><td>ratio</td><td>1.30</td></tr>
    <tr><td><strong>Ps30</strong></td><td>Static pressure at HPC outlet</td><td>Station 3 (HPC)</td><td>psia</td><td>47.35 psia</td></tr>
    <tr><td><strong>phi</strong></td><td>Fuel-to-static-pressure ratio (Wf/Ps30)</td><td>Station 4 (Combustor)</td><td>pps/psi</td><td>521.91</td></tr>
    <tr><td><strong>NRf</strong></td><td>Corrected fan rotational speed</td><td>Station 1 (Fan/Inlet)</td><td>rpm</td><td>2388.06 rpm</td></tr>
    <tr><td><strong>NRc</strong></td><td>Corrected core spool speed</td><td>Station 3 (HPC)</td><td>rpm</td><td>8137.37 rpm</td></tr>
    <tr><td><strong>BPR</strong></td><td>Bypass ratio (Outer / Core flow)</td><td>Station 2 (LPC)</td><td>ratio</td><td>8.42</td></tr>
    <tr><td><strong>farB</strong></td><td>Burner fuel-air ratio</td><td>Station 4 (Combustor)</td><td>ratio</td><td>0.03</td></tr>
    <tr><td><strong>htBleed</strong></td><td>Parasitic bleed enthalpy</td><td>Station 4 (Combustor)</td><td>kJ/kg</td><td>392.26 kJ/kg</td></tr>
    <tr><td><strong>Nf_dmd</strong></td><td>Demanded fan rotational speed</td><td>Station 1 (Fan/Inlet)</td><td>rpm</td><td>2388.00 rpm</td></tr>
    <tr><td><strong>PCNfR_dmd</strong></td><td>Demanded corrected fan speed</td><td>Station 1 (Fan/Inlet)</td><td>%</td><td>100.00 %</td></tr>
    <tr><td><strong>W31</strong></td><td>HPT coolant bleed air flow</td><td>Station 5 (HPT)</td><td>lbm/s</td><td>38.93 lbm/s</td></tr>
    <tr><td><strong>W32</strong></td><td>LPT coolant bleed air flow</td><td>Station 6 (LPT)</td><td>lbm/s</td><td>23.36 lbm/s</td></tr>
  </tbody>
</table>

<h2>2.2 Multi-Dataset Fleet Specification</h2>
<p>
The C-MAPSS corpus includes 4 subsets covering single/multi-condition operating regimes and single/dual fault injection modes:
</p>

<table>
  <thead>
    <tr>
      <th>Subset</th>
      <th>Operating Regimes</th>
      <th>Simulated Fault Modes</th>
      <th>Train Engines</th>
      <th>Test Engines</th>
      <th>Total Engines</th>
      <th>Flight Cycles</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>FD001</strong></td><td>1 (Sea Level Static)</td><td>High-Pressure Compressor (HPC) Degradation</td><td>100</td><td>100</td><td>200</td><td>33,727</td></tr>
    <tr><td><strong>FD002</strong></td><td>6 (Full Flight Envelope)</td><td>HPC Degradation</td><td>260</td><td>259</td><td>519</td><td>87,750</td></tr>
    <tr><td><strong>FD003</strong></td><td>1 (Sea Level Static)</td><td>HPC Degradation + Fan Degradation</td><td>100</td><td>100</td><td>200</td><td>41,316</td></tr>
    <tr><td><strong>FD004</strong></td><td>6 (Full Flight Envelope)</td><td>HPC Degradation + Fan Degradation</td><td>249</td><td>248</td><td>497</td><td>102,463</td></tr>
    <tr><td><strong>TOTAL</strong></td><td>—</td><td>—</td><td><strong>709</strong></td><td><strong>707</strong></td><td><strong>1,416</strong></td><td><strong>265,256</strong></td></tr>
  </tbody>
</table>

<div class="callout callout-warning">
  <strong>Why Keeping All 21 Sensors Matters (Professor / Viva Defense):</strong> In FD001, 7 sensors (T2, P2, farB, epr, Nf_dmd, PCNfR_dmd, P15) have near-zero variance due to constant sea-level operation. Naive pipelines drop them. However, in FD002 and FD004, these sensors vary significantly with altitude and Mach number. We retain all 21 sensors across all datasets so our models remain generalizable across flight envelopes. TreeSHAP mathematically weights inactive sensors to ~0% in FD001 without manual feature pruning.
</div>

<div class="page-break"></div>

<!-- SECTION 3 -->
<h1>3. End-to-End System Architecture</h1>

<p>
The system follows a modular, 4-tier cyber-physical architecture connecting raw aviation telemetry to real-time interactive decision support:
</p>

<div class="pipeline-flow">
+---------------------------------------------------------------------------------------------------+
|                                 TIER 1: TELEMETRY INGESTION & DATA LAKE                           |
|  NASA C-MAPSS Raw Logs [26 columns] ---&gt; Engine Isolation ---&gt; NaN Filtering ---&gt; Temporal Window  |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                               TIER 2: PREPROCESSING & SLIDING BUFFER                              |
|  MinMaxScaler Scaling ---&gt; 50-Cycle Temporal Sliding Window Buffer: Tensor [Batch, 50, 21]        |
+-----------------------------------+-----------------------------------+---------------------------+
                                    |                                   |
                                    v                                   v
+--------------------------------------------------+ +----------------------------------------------+
|        TRACK A: PROGNOSTIC DEEP LEARNING         | |         TRACK B: STATISTICAL & ML            |
|  2-Layer Recurrent LSTM (100+50 units) + Dropout | |  Unsupervised Isolation Forest (Anomalies)   |
|  Target: Exact Remaining Useful Life (RUL)       | |  Random Forest Classifier (3 Health Stages)  |
+-------------------------+------------------------+ +----------------------+-----------------------+
                          |                                                 |
                          +------------------------+------------------------+
                                                   |
                                                   v
+---------------------------------------------------------------------------------------------------+
|                             TIER 3: EXPLAINABILITY & STATION ATTRIBUTION                          |
|  TreeSHAP Shapley Attribution ---&gt; 6 CFM56 Engine Stations ---&gt; Statistical Threshold Evaluation   |
+--------------------------------------------------+------------------------------------------------+
                                                   |
                                                   v
+---------------------------------------------------------------------------------------------------+
|                             TIER 4: DIGITAL TWIN INTERACTIVE HMI (REACT)                          |
|  CFM56 SVG Cutaway Schematic ---&gt; Threshold Meter ---&gt; Plain-English Diagnostics ---&gt; Work Orders |
+---------------------------------------------------------------------------------------------------+
</div>

<!-- SECTION 4 -->
<h1>4. Deep-Dive Work Division for 4 Team Members</h1>

<p>
To ensure an equitable and technically rigorous workload distribution suitable for university assessment, the project is divided into four distinct specialization leads:
</p>

<!-- PERSON 1 -->
<div class="person-card">
  <div class="person-header">
    <span class="person-title">Person 1: Data Engineering & Preprocessing Lead</span>
    <span class="person-role">Pipeline & Ingestion Architecture</span>
  </div>
  <p><strong>Primary Implementation Script:</strong> <span class="mono">src/data_loader_v2.py</span></p>
  <ul>
    <li><strong>Data Lake Ingestion:</strong> Built the whitespace-separated regex parser for all 26 C-MAPSS columns across 1,416 engines, stripping trailing null tokens.</li>
    <li><strong>Temporal Sequence Buffering:</strong> Formulated the sliding-window sequence generator with shape (Batch, 50 cycles, 21 sensors), strictly isolating engine boundaries to eliminate temporal data leakage between distinct engine IDs.</li>
    <li><strong>Piecewise Linear RUL Target Generation:</strong> Created ground-truth RUL curves capped at 125 cycles (representing the initial stable operation phase where degradation has not yet begun).</li>
    <li><strong>Fleet Normalization:</strong> Implemented <span class="mono">MinMaxScaler</span> fitted solely on healthy initial cycles (cycles 1 to 20) and exported parameter scalers for real-time inverse transforms.</li>
  </ul>
  <div class="callout callout-info">
    <strong>Viva Defense Question:</strong> <em>"Why use a 50-cycle sliding window instead of single-cycle snapshot rows?"</em><br>
    <strong>Answer:</strong> <em>"Turbofan degradation is a dynamic non-linear rate of change. Single sensor snapshots contain sensor noise and flight turbulence. A 50-cycle trajectory provides the LSTM recurrent gates with temporal derivatives (dT/dt, dP/dt) necessary to capture thermodynamic divergence."</em>
  </div>
</div>

<!-- PERSON 2 -->
<div class="person-card">
  <div class="person-header">
    <span class="person-title">Person 2: Deep Learning & Prognostics Lead</span>
    <span class="person-role">Recurrent Neural Network Architecture</span>
  </div>
  <p><strong>Primary Implementation Script:</strong> <span class="mono">src/rul_predictor_lstm.py</span></p>
  <ul>
    <li><strong>LSTM Architecture Design:</strong> Built a 2-layer Long Short-Term Memory network (Layer 1: 100 units, return_sequences=True; Layer 2: 50 units) with 20% Dropout regularization and Dense linear regression head.</li>
    <li><strong>NASA Asymmetric Loss Scoring:</strong> Implemented the official NASA evaluation metric, penalizing late predictions (predicting engine is healthy when it is near failure) exponentially more severely than early predictions.</li>
    <li><strong>Model Training & Validation:</strong> Trained with Adam optimizer (learning rate 0.001), EarlyStopping on validation loss, achieving RMSE of 14.8 cycles across the 100 test engines.</li>
  </ul>
  <div class="callout callout-info">
    <strong>Viva Defense Question:</strong> <em>"Why is the NASA asymmetric scoring metric preferred over standard RMSE?"</em><br>
    <strong>Answer:</strong> <em>"In aviation, predicting an engine has 30 cycles remaining when it only has 5 leads to catastrophic in-flight failure. Predicting 5 cycles when it has 30 only causes an early scheduled inspection. Asymmetric scoring mathematically enforces flight safety."</em>
  </div>
</div>

<div class="page-break"></div>

<!-- PERSON 3 -->
<div class="person-card">
  <div class="person-header">
    <span class="person-title">Person 3: Anomaly Detection & Health Classification Lead</span>
    <span class="person-role">Statistical Machine Learning & Health Staging</span>
  </div>
  <p><strong>Primary Implementation Scripts:</strong> <span class="mono">src/anomaly_detector_iforest.py</span>, <span class="mono">src/classification.py</span></p>
  <ul>
    <li><strong>Unsupervised Isolation Forest:</strong> Trained Isolation Forest on nominal baseline cycles (cycles 1-10) across all engines with contamination factor 0.10. Computes real-time anomaly scores via recursive binary space partitioning.</li>
    <li><strong>Multi-Class Health Stage Classifier:</strong> Trained a 100-tree Random Forest classifier categorizing engine states into:
      <ul>
        <li><strong>Stage 0 (Healthy):</strong> RUL &gt; 100 cycles. All sensors within 2.5-sigma envelope.</li>
        <li><strong>Stage 1 (Degrading):</strong> 30 &lt; RUL &lt;= 100 cycles. Sub-threshold thermodynamic drift.</li>
        <li><strong>Stage 2 (Critical):</strong> RUL &lt;= 30 cycles. Redline thresholds breached, immediate action.</li>
      </ul>
    </li>
    <li><strong>Fleet Threshold Calibration:</strong> Statistically derived 2.5-sigma warning and 3.8-sigma redline limits across healthy fleet distributions, achieving <strong>0% false alarms on Cycle 1</strong>.</li>
  </ul>
  <div class="callout callout-info">
    <strong>Viva Defense Question:</strong> <em>"Why combine unsupervised Isolation Forest with supervised Random Forest?"</em><br>
    <strong>Answer:</strong> <em>"Isolation Forest detects novel, zero-day anomalous patterns without needing ground-truth failure labels, while Random Forest provides deterministic operational health stages for maintenance planning."</em>
  </div>
</div>

<!-- PERSON 4 -->
<div class="person-card">
  <div class="person-header">
    <span class="person-title">Person 4: Explainable AI & Digital Twin Dashboard Lead</span>
    <span class="person-role">Explainability, API & Full-Stack Interface</span>
  </div>
  <p><strong>Primary Implementation Scripts:</strong> <span class="mono">src/feature_importance_shap.py</span>, <span class="mono">src/dashboard_api.py</span>, <span class="mono">dashboard/src/</span></p>
  <ul>
    <li><strong>Explainable AI (TreeSHAP):</strong> Implemented Shapley Additive Explanations computing exact marginal feature contributions. Identified Ps30 (14.2%), Nc (13.1%), P30 (9.8%), NRc (9.4%), and phi (9.3%) as primary HPC failure drivers.</li>
    <li><strong>CFM56-5B4 Vector Cutaway Schematic:</strong> Recreated the exact physical engine cross-section in responsive SVG from technical drawing <span class="mono">designrefrence/techdraw-file.pdf</span>, mapping 6 stations to real mechanical coordinates.</li>
    <li><strong>Human-in-the-Loop Diagnostic Translation:</strong> Built the threshold analysis meter, plain-English mechanical root cause explanations, and prescriptive maintenance work orders.</li>
    <li><strong>Full-Stack Architecture:</strong> Developed Flask REST API backend (<span class="mono">localhost:5000</span>) and React + Vite frontend (<span class="mono">localhost:5173</span>).</li>
  </ul>
  <div class="callout callout-info">
    <strong>Viva Defense Question:</strong> <em>"Why is Explainable AI necessary if the LSTM already predicts RUL accurately?"</em><br>
    <strong>Answer:</strong> <em>"A maintenance technician cannot disassemble a $15 million jet engine based on an opaque RUL number. SHAP explains which specific component (e.g. HPC rotor vs Combustor) caused the deterioration, pinpointing exactly where to insert the borescope."</em>
  </div>
</div>

<!-- SECTION 5 -->
<h1>5. The Prediction Pipeline: What Goes In, What Comes Out</h1>

<table>
  <thead>
    <tr>
      <th>Pipeline Stage</th>
      <th>Data Input Format & Shape</th>
      <th>Transformation / Processing</th>
      <th>Output Format & Shape</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Telemetry Ingestion</strong></td>
      <td>Raw C-MAPSS logs: 26 whitespace columns (EngineID, Cycle, Op_1..3, s_1..21)</td>
      <td>Regex tokenization, trailing null stripping, engine continuity check</td>
      <td>Cleaned Pandas DataFrame: Shape (N, 26)</td>
    </tr>
    <tr>
      <td><strong>2. Scaling & Windowing</strong></td>
      <td>Sensor matrix: Shape (N, 21) in standard engineering units</td>
      <td>MinMaxScaler normalization, 50-step sliding window buffer per engine</td>
      <td>Tensor: Shape (Batch, 50, 21)</td>
    </tr>
    <tr>
      <td><strong>3. LSTM RUL Prediction</strong></td>
      <td>Tensor: (1, 50, 21)</td>
      <td>2-layer LSTM recurrent forward pass + dropout + linear activation</td>
      <td>Scalar: RUL in remaining cycles (e.g. 191 cycles)</td>
    </tr>
    <tr>
      <td><strong>4. Anomaly Detection</strong></td>
      <td>Single-cycle vector: (1, 21)</td>
      <td>Isolation Forest ensemble path-length evaluation against baseline</td>
      <td>Boolean (is_anomaly) + Score (s in [-1, 1])</td>
    </tr>
    <tr>
      <td><strong>5. Health Classification</strong></td>
      <td>Single-cycle vector: (1, 21)</td>
      <td>Random Forest 100-tree Gini impurity voting</td>
      <td>Discrete Stage: 0 (Healthy), 1 (Degrading), 2 (Critical)</td>
    </tr>
    <tr>
      <td><strong>6. SHAP Attribution</strong></td>
      <td>Single-cycle vector: (1, 21)</td>
      <td>TreeSHAP marginal contribution computation across feature trees</td>
      <td>Dictionary of 21 sensor weights summing to 100%</td>
    </tr>
    <tr>
      <td><strong>7. Physical Translation</strong></td>
      <td>Normalized vector + Scaler parameters + Sensor Metadata</td>
      <td>Inverse scaling to physical units, 2.5-sigma warning / 3.8-sigma redline evaluation</td>
      <td>Station health badges, needle meter position, plain-English diagnosis</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<!-- SECTION 6 -->
<h1>6. Detailed Breakdown of Dashboard Visual Components</h1>

<p>
The Digital Twin interface is engineered specifically as an operational decision-support tool for flight-line aircraft maintenance engineers. Below is an exhaustive breakdown of every visual component:
</p>

<!-- FIGURE 1: NOMINAL DASHBOARD -->
<div class="figure-card avoid-break">
  <img src="__IMG_NOM__" alt="Nominal Digital Twin Dashboard at Cycle 1">
  <div class="figure-caption">Figure 6.1: Digital Twin Interface at Flight Cycle 1 — Nominal Healthy Baseline (RUL: 191 cycles, 0 false alarms, green envelope limits).</div>
</div>

<h2>6.1 Header Bar & Tail Controls</h2>
<ul>
  <li><strong>Engine Tail # Selector:</strong> Numerical input allowing maintenance personnel to switch between any of the 100 test engines in the fleet.</li>
  <li><strong>Flight Cycle Counter:</strong> Tracks operational sorties from factory delivery (Cycle = 1) to end-of-life retirement.</li>
  <li><strong>Health Status Chip:</strong> Tri-state color-coded indicator (<span class="mono" style="color:#10b981">HEALTHY</span>, <span class="mono" style="color:#f59e0b">DEGRADING</span>, <span class="mono" style="color:#ef4444">CRITICAL</span>).</li>
  <li><strong>Predicted RUL Summary:</strong> Displays instantaneous remaining flight cycles calculated by the LSTM model.</li>
  <li><strong>API Connectivity Heartbeat:</strong> Real-time REST polling indicator verifying backend connectivity.</li>
</ul>

<!-- FIGURE 2: ENGINE CROSS SECTION CLOSE UP -->
<div class="figure-card avoid-break">
  <img src="__IMG_ENGINE__" alt="CFM56 Turbofan Engine Vector Cross Section">
  <div class="figure-caption">Figure 6.2: CFM56-5B4 Vector Cross-Section Schematic with 6 Thermodynamic Stations mapped to real physical coordinates.</div>
</div>

<h2>6.2 CFM56-5B4 Interactive Engine Cross-Section</h2>
<p>
Modeled directly from the CFM56-5B4 engineering technical drawing (<span class="mono">designrefrence/techdraw-file.pdf</span>), representing an overall engine length of <strong>3620.4 mm</strong>. The diagram maps 6 thermodynamic stations:
</p>
<ol>
  <li><strong>Station 1 (FAN / Inlet):</strong> Fan spinner, composite titanium fan blades, inlet cowl acoustic liner. Houses sensors T2, P2, Nf, NRf, Nf_dmd, PCNfR_dmd.</li>
  <li><strong>Station 2 (LPC - Low-Pressure Compressor):</strong> 3-stage axial booster compressor and bypass duct split. Houses sensors T24, BPR.</li>
  <li><strong>Station 3 (HPC - High-Pressure Compressor):</strong> 9-stage axial compressor with dual concentric high-pressure shaft. Primary wear zone in FD001. Houses sensors T30, P30, Ps30, Nc, NRc.</li>
  <li><strong>Station 4 (COMB - Combustion Chamber):</strong> Annular combustor liner with 20 dual-fuel nozzles and swirlers. Houses sensors phi, farB, htBleed.</li>
  <li><strong>Station 5 (HPT - High-Pressure Turbine):</strong> Single-stage cooled turbine driving the N2 high-pressure spool. Houses sensor W31.</li>
  <li><strong>Station 6 (LPT - Low-Pressure Turbine):</strong> 4-stage uncooled turbine driving the N1 fan spool and exhaust cone. Houses sensors T50, W32, P15, epr.</li>
</ol>

<div class="page-break"></div>

<!-- FIGURE 3: CRITICAL DASHBOARD AT CYCLE 192 -->
<div class="figure-card avoid-break">
  <img src="__IMG_CRIT__" alt="Critical Digital Twin Dashboard at Cycle 192">
  <div class="figure-caption">Figure 6.3: Digital Twin Interface at Flight Cycle 192 — Critical Threshold Breach (RUL: 0 cycles, redline alarm banner, HPC thermal runaway).</div>
</div>

<h2>6.3 Dynamic Threshold Breach Alert Banner</h2>
<p>
In nominal health (Figure 6.1), the banner remains completely hidden. When sensor drift exceeds safety thresholds (Figure 6.3), the banner activates across the top of the interface:
</p>
<ul>
  <li><strong>Warning Banner (Amber):</strong> Signals early degradation (2.5-sigma drift). Informs crew of scheduled inspection requirements.</li>
  <li><strong>Critical Redline Banner (Red):</strong> Signals immediate flight-safety hazard (3.8-sigma breach). Recommends grounding the aircraft and displays a direct shortcut button (<span class="mono">Inspect HPC</span>) to focus on the affected engine station.</li>
</ul>

<!-- FIGURE 4: DIAGNOSTICS & SENSORS CLOSE UP -->
<div class="figure-grid avoid-break">
  <div class="figure-card">
    <img src="__IMG_DIAG__" alt="Diagnostics Panel Close-Up">
    <div class="figure-caption">Figure 6.4: Diagnostics Panel with Tri-Color Meter & Action Target.</div>
  </div>
  <div class="figure-card">
    <img src="__IMG_STRIP__" alt="Sensor Info Strip Close-Up">
    <div class="figure-caption">Figure 6.5: Sensor Info Strip with real engineering units.</div>
  </div>
</div>

<h2>6.4 Lower Sensor Telemetry Strip (Figure 6.5)</h2>
<p>
Arranged into 6 station cards beneath the engine cross-section:
</p>
<ul>
  <li>Displays <strong>true engineering units</strong>: Temperatures in <strong>°R</strong> (Rankine), Pressures in <strong>psia</strong>, Spool speeds in <strong>rpm</strong>, Bleed flows in <strong>lbm/s</strong>.</li>
  <li>Features color-coded status micro-indicators: Green (Normal), Yellow (Warning), Red (Critical Redline).</li>
  <li>Interactive cross-filtering: Clicking any station card immediately highlights its mechanical zone on the SVG diagram above.</li>
</ul>

<h2>6.5 Physical Root Cause & Sensor Threshold Analysis Panel (Figure 6.4)</h2>
<p>
The core innovation requested by maintenance teams to eliminate black-box uncertainty:
</p>
<ul>
  <li><strong>Primary Driver Identification:</strong> Automatically isolates the specific sensor experiencing the most severe thermodynamic anomaly (e.g. T30 or Ps30).</li>
  <li><strong>Tri-Color Threshold Indicator Bar:</strong> Visualizes nominal zone (0-70%, green), caution zone (70-100%, amber), and critical redline (&gt;100%, red) with an active pointer displaying real reading vs. redline limit.</li>
  <li><strong>Plain-English Diagnostic Explanation:</strong> Explains the thermodynamic mechanism (e.g. <em>"HPC exit temperature elevation indicates aerodynamic boundary layer separation, blade tip rubbing, and stage compressor degradation."</em>).</li>
  <li><strong>Target Component for Borescope Inspection:</strong> Directly names the aircraft hardware part to inspect (e.g. <em>"HPC Stages 7-9 Rotor Blades & Casing Honeycomb Shroud"</em>) with a <span class="mono">Locate on Engine</span> button.</li>
</ul>

<h2>6.6 Prescriptive Maintenance Work Orders</h2>
<ul>
  <li><strong>Nominal (RUL &gt; 100):</strong> Recommends continuing standard flight operations; next scheduled A-check in 50 cycles.</li>
  <li><strong>Caution (30 &lt; RUL &lt;= 100):</strong> Recommends pre-ordering replacement compressor rotor kits and scheduling borescope inspection at the next overnight layover.</li>
  <li><strong>Critical (RUL &lt;= 30):</strong> Generates an immediate grounding recommendation, directing aircraft maintenance technicians to remove the engine for shop-level overhaul.</li>
</ul>

<h2>6.7 RUL Trajectory Trend & Timeline Slider</h2>
<ul>
  <li><strong>SVG Trajectory Sparkline:</strong> Graphs the rolling 50-cycle degradation trajectory and calculates instantaneous decay rate (e.g. -1.15 cycles/flight).</li>
  <li><strong>Timeline Scrubbing Bar:</strong> Located in the footer, allows flight planners to scrub across past sorties to replay the historical progression of engine wear.</li>
</ul>

<!-- CONCLUSION -->
<h1>7. Summary & Project Deliverables</h1>

<p>
The C-MAPSS CFM56-5B4 Digital Twin bridges advanced data warehousing, deep learning, and practical aeronautical engineering. By combining 21-sensor sequence modeling, statistical anomaly detection, TreeSHAP explainability, and interactive physical cross-section visualization, the project delivers an end-to-end predictive maintenance platform capable of preventing unplanned in-flight shutdowns while eliminating false alarms.
</p>

<table>
  <thead>
    <tr>
      <th>Module</th>
      <th>Script / File Location</th>
      <th>Key Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>Data Engineering</strong></td><td><span class="mono">src/data_loader_v2.py</span></td><td>21-sensor extraction, 50-cycle windowing, scaling</td></tr>
    <tr><td><strong>Deep Learning RUL</strong></td><td><span class="mono">src/rul_predictor_lstm.py</span></td><td>2-layer LSTM sequence regressor, NASA scoring</td></tr>
    <tr><td><strong>Anomaly & Staging</strong></td><td><span class="mono">src/anomaly_detector_iforest.py</span></td><td>Isolation Forest anomaly detector, Random Forest classifier</td></tr>
    <tr><td><strong>Explainability</strong></td><td><span class="mono">src/feature_importance_shap.py</span></td><td>TreeSHAP marginal feature attribution</td></tr>
    <tr><td><strong>REST Backend</strong></td><td><span class="mono">src/dashboard_api.py</span></td><td>Flask REST API with physical thresholds & diagnostics</td></tr>
    <tr><td><strong>Digital Twin UI</strong></td><td><span class="mono">dashboard/src/components/</span></td><td>React + Vite + SVG Engine Cross-Section interface</td></tr>
  </tbody>
</table>

</body>
</html>
"""

html_content = html_template.replace("__IMG_NOM__", img_nom)
html_content = html_content.replace("__IMG_CRIT__", img_crit)
html_content = html_content.replace("__IMG_ENGINE__", img_engine)
html_content = html_template.replace("__IMG_NOM__", img_nom).replace("__IMG_CRIT__", img_crit).replace("__IMG_ENGINE__", img_engine).replace("__IMG_STRIP__", img_strip).replace("__IMG_DIAG__", img_diag)

html_path = "reports/technical_report.html"
pdf_path = "reports/CFM56_Turbofan_Digital_Twin_Technical_Report.pdf"

os.makedirs("reports", exist_ok=True)
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"HTML written to {html_path}")

print("Rendering PDF via Playwright...")
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"file:///{os.path.abspath(html_path)}")
    page.wait_for_timeout(2000)
    page.pdf(
        path=pdf_path,
        format="A4",
        print_background=True,
        margin={"top": "14mm", "bottom": "14mm", "left": "14mm", "right": "14mm"}
    )
    browser.close()

print(f"SUCCESS: High-quality PDF generated at {pdf_path}!")
print(f"File size: {os.path.getsize(pdf_path) / (1024*1024):.2f} MB")
