# JetTwin: C-MAPSS Digital Twin — End-to-End Project Guide & 4-Person Viva Split

> **Course:** Data Warehousing and Mining (DWM) — Semester 5  
> **Institution:** Vidyalankar Institute of Technology (VIT), Mumbai  
> **Benchmark Dataset:** NASA C-MAPSS Turbofan Engine Degradation Simulation (FD001–FD004)  
> **Single Source of Truth for Numbers:** [`docs/submission/FACTS_v2.md`](submission/FACTS_v2.md)  
> **Automated Verification Script:** `python scripts/verify_docs.py`

---

## 1. Executive Summary & 30-Second Elevator Pitch

### What is this project?
This project is an **AI-powered Digital Twin** for predictive maintenance of commercial aircraft turbofan engines. It continuously ingests 21 channels of in-flight aerodynamic and thermodynamic sensor telemetry, predicts the engine's operational health stage, forecasts its Remaining Useful Life (RUL), detects abnormal sensor behavior, and attributes degradation to specific engine subassemblies (e.g., High-Pressure Compressor blade erosion).

### The 30-Second Viva Pitch (Memorize this!):
> *"In commercial aviation, scheduled periodic inspections are either too conservative—wasting maintenance cycles—or fail to catch accelerated thermodynamic wear before severe damage occurs. We built an interpretable Digital Twin on NASA's C-MAPSS benchmark. Our primary DWM task is a **3-stage degradation classification** (Healthy, Degrading, Critical) using Random Forest interpreted via TreeSHAP. To complement snapshot classification, we implement a sequence-based **LSTM RUL regression network** that captures temporal drift, providing a **median lead-time advantage of 21.0 flight cycles** over single-snapshot models. TreeSHAP attributes **49.18% of wear directly to the High-Pressure Compressor**, matching simulated thermodynamic physics. Everything is visualized on a real-time React dashboard with an interactive CFM56 turbofan cross-section."*

---

## 2. Team Split: 4-Person Responsibility & Viva Defense Matrix

To defend this project convincingly in a team of 4, each member owns a distinct quadrant of the system. If an examiner asks *"What did YOU specifically do?"*, each person has a definitive, deep answer.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TEAM DIVISION OF RESPONSIBILITIES               │
├───────────────────────────┬────────────────────────────────────────────┤
│ MEMBER 1: DATA & SENSORS  │ MEMBER 2: CLASSIFICATION & XAI (PRIMARY)   │
│ • Telemetry Ingestion     │ • Random Forest 3-Stage Classifier         │
│ • Sensor Variance Analysis│ • Ground Truth Stage Formulation           │
│ • Min-Max Normalization   │ • TreeSHAP & Permutation Attribution       │
├───────────────────────────┼────────────────────────────────────────────┤
│ MEMBER 3: SEQUENCE & AD   │ MEMBER 4: FULL-STACK DIGITAL TWIN & INTEGR.│
│ • 2-Layer LSTM RUL Network│ • Python Flask REST Microservices          │
│ • 50-Cycle Sliding Windows│ • React / Vite Turbofan SVG Dashboard      │
│ • Isolation Forest Anomaly│ • Fleet Dispatch Matrix & Redline Alerts   │
└───────────────────────────┴────────────────────────────────────────────┘
```

---

### Member 1: Data Preprocessing, Telemetry Stations & Variance Analysis
- **Core Role:** Data Engineering, Station Mapping & Telemetry Quality Assurance.
- **Components Owned:**
  - `src/data_loader_v2.py`
  - `scripts/sensor_variance.py` -> `results/metrics_v2/sensor_variance.csv`
- **What You Must Know Cold:**
  - **Dataset Statistics:** 4 sub-datasets: FD001 (100 train engines, 20,631 rows; 100 test engines, 13,096 rows, 1 regime, 1 fault mode). Total across FD001-FD004 is 709 train engines (160,359 rows) and 707 test engines (104,897 rows).
  - **Sensor Flatness Rule:** Evaluated Coefficient of Variation ($\text{CV} = \sigma / |\mu|$). Flat sensor defined as $\text{CV} < 10^{-4}$.
    - **FD001:** Exactly 9 sensors are flat (`T2`, `P2`, `P15`, `Nf`, `epr`, `NRf`, `farB`, `Nf_dmd`, `PCNfR_dmd`).
    - **FD003:** Exactly 7 sensors are flat (`T2`, `P2`, `Nf`, `NRf`, `farB`, `Nf_dmd`, `PCNfR_dmd`).
    - **FD002 and FD004:** **Zero flat sensors** because 6 operating regimes cause all channels to fluctuate.
  - **Why We Retained All 21 Sensors:** Earlier literature dropped the 9 flat sensors based only on FD001. That breaks cross-dataset evaluation because FD002 and FD004 need those sensors. We kept all 21 to maintain an identical schema.
  - **Scaling Rule:** Fitted `MinMaxScaler` strictly on training data bounds $[x_{\min}, x_{\max}]$ to prevent data leakage into evaluation test sets.
- **Top Viva Questions for Member 1:**
  1. *Q: "Why didn't you drop flat sensors with zero variance in FD001?"*  
     **A:** *"In single-condition FD001, 9 sensors appear stationary at sea-level. However, across multi-regime datasets like FD002 and FD004, ambient altitude and Mach number variations activate all 21 channels. Pruning them creates incompatible input vectors across engine fleets. Keeping all 21 maintains universal schema compatibility."*
  2. *Q: "How did you prevent data leakage during normalization?"*  
     **A:** *"The Min-Max scaler is fitted strictly on training observations (`fit_transform` on train data only). Test telemetry is scaled using the stored training bounds (`transform` only). Test labels and test max values are never seen during preprocessing."*

---

### Member 2: Primary DWM Task — 3-Stage Classification & TreeSHAP Explainability
- **Core Role:** Multi-Class Health Triage, Stage Mapping & Subassembly Attribution.
- **Components Owned:**
  - `src/classifier_rf.py`
  - `src/feature_importance_shap.py`
  - `scripts/shap_analysis.py` -> `results/metrics_v2/shap_and_permutation.json`
- **What You Must Know Cold:**
  - **The Primary DWM Task:** 3-stage degradation classification (Healthy, Degrading, Critical).
  - **Ground Truth Stage Thresholds:**
    - **Stage 0 (Healthy):** $\text{RUL} > 100$ cycles. Normal flight; no action required.
    - **Stage 1 (Degrading):** $30 < \text{RUL} \le 100$ cycles. Active thermodynamic drift; schedule depot borescope inspection.
    - **Stage 2 (Critical):** $\text{RUL} \le 30$ cycles. Immediate risk; ground aircraft and overhaul engine.
  - **Model Architecture:** Random Forest with 100 decision trees, max depth 10, random state 42, unweighted classes (`class_weight=None`), operating on instantaneous 21-dimensional single-cycle vectors.
  - **Key Metrics on FD001 Test Set (13,096 cycles):**
    - **3-Stage Macro-F1:** `0.7303` (Healthy F1: `0.912`, Degrading F1: `0.585`, Critical F1: `0.694`).
    - **Critical Stage Binary F1 ($R \le 30$):** `0.6938` (Precision: `0.8412`, Recall: `0.5904`).
  - **Explainability (TreeSHAP vs Permutation):**
    - **High-Pressure Compressor (HPC) share:** `49.18% ± 0.12%` via TreeSHAP (averaged over 5 random seeds).
    - Permutation importance on test set yields **`62.22%` HPC share**.
    - Top individual sensors: `Ps30` (14.25%), `Nc` (13.01%), `T50` (11.77%), `P30` (9.71%), `NRc` (9.41%).
- **Top Viva Questions for Member 2:**
  1. *Q: "Why did you choose 3 stages instead of just predicting a single continuous RUL number?"*  
     **A:** *"A continuous scalar like 'RUL = 47.3 cycles' does not tell maintenance dispatch what protocol to trigger. Airline line engineers operate on discrete tiered workflows: normal turnaround, scheduling depot shop visits (Degrading), and mandatory grounding (Critical). Classification directly maps telemetry to engineering action."*
  2. *Q: "How does TreeSHAP explain engine degradation?"*  
     **A:** *"TreeSHAP computes exact Shapley values using game theory across all 100 decision trees in polynomial time. For every prediction, it calculates the marginal contribution of each sensor. In FD001, HPC sensors (Ps30, Nc, P30, NRc, T30) account for 49.18% of total importance, proving that the model learns authentic physical compressor degradation rather than spurious background noise."*

---

### Member 3: Temporal Regression (LSTM), Lead-Time Analysis & Anomaly Detection
- **Core Role:** Deep Sequence Modeling, Early Warning Quantification & Unsupervised Detection.
- **Components Owned:**
  - `src/rul_predictor_lstm.py`
  - `src/anomaly_detector_iforest.py`
  - `scripts/eval_v2.py` & `scripts/lead_time.py` -> `results/metrics_v2/lead_time.json`
- **What You Must Know Cold:**
  - **LSTM Architecture:** 2-layer recurrent network:
    - Input: Sliding temporal window of shape `(50, 21)` (50 cycles history).
    - Layer 1: LSTM (128 units, ReLU activation, `return_sequences=True`) + Dropout (0.20).
    - Layer 2: LSTM (64 units, ReLU activation) + Dropout (0.20).
    - Dense layer: 32 units (ReLU) + Linear output unit.
    - Optimizer: Adam (learning rate 0.001, batch size 32, validation split 0.20, early stopping patience 5).
  - **RUL Regression Performance on FD001 Final Windows (100 test engines):**
    - Capped ground truth $\min(\text{True RUL}, 125)$: **RMSE = 15.07 cycles**, **MAE = 10.68 cycles**, **NASA PHM08 Score = 493.1**.
    - Uncapped ground truth: **RMSE = 15.68 cycles**, **MAE = 11.75 cycles**, **NASA Score = 510.5**.
  - **Lead-Time Advantage (LSTM vs Random Forest):**
    - Persistence rule: Model must flag stage $\ge 1$ for **3 consecutive flight cycles**.
    - Across all 100 training engines: Random Forest median delay is **+15.5 cycles** (late detection), whereas LSTM median delay is **-2.0 cycles** (early detection).
    - **Paired Lead-Time Difference:** **Median advantage = 21.0 flight cycles** (mean 27.69, IQR 32.5 cycles).
    - **LSTM alerts earlier in 80 out of 100 engines (80.0%)**.
    - On held-out validation engines (Engines 83 to 100): Median advantage is **26.5 cycles** (LSTM earlier in 94.44% of engines).
    - On Engine 1: Paired lead-time advantage is **51 flight cycles** (LSTM flags at cycle 98 vs. RF at cycle 149; true onset is cycle 92).
  - **Isolation Forest Role & Trade-off:**
    - 100 isolation trees, contamination 0.10, trained on initial healthy cycles (1 to 10).
    - High recall (`0.9970`), but low precision (`0.1372`) due to early false alarms (median trigger delay -155 cycles). Used as a secondary novelty alert, NOT standalone triage.
- **Top Viva Questions for Member 3:**
  1. *Q: "Why does LSTM detect degradation 21 cycles earlier than Random Forest?"*  
     **A:** *"Random Forest evaluates only a single instantaneous snapshot without memory. Early thermodynamic wear drifts slowly within nominal sensor noise bands, so single-cycle trees don't trigger until drift is large. LSTM looks at a 50-cycle moving window, capturing multi-cycle slope and cumulative trajectory shifts, allowing it to detect persistent wear 21 cycles earlier."*
  2. *Q: "What is the NASA PHM08 scoring function and why use it instead of just RMSE?"*  
     **A:** *"RMSE treats early and late predictions symmetrically. In aviation, an early prediction ($d_i < 0$) causes slightly premature maintenance, but a late prediction ($d_i > 0$) risks structural failure. The NASA score applies asymmetric exponential penalties: late predictions are penalized up to 10 times more heavily ($e^{d/10}-1$ for early vs $e^{d/13}-1$ for late)."*

---

### Member 4: Full-Stack Digital Twin Dashboard & System Integration
- **Core Role:** REST Architecture, Dynamic UI/UX, SVG Telemetry Probes & Production Verification.
- **Components Owned:**
  - `src/dashboard_api.py` (Flask backend microservices)
  - `dashboard/src/App.jsx`, `App.css`
  - `dashboard/src/components/EngineCrossSection.jsx`, `FleetMatrixView.jsx`, `DiagnosticsPanel.jsx`, `SensorInfoStrip.jsx`
  - `scripts/verify_docs.py` (Automated verification suite)
- **What You Must Know Cold:**
  - **Backend Microservices (`src/dashboard_api.py` on port 5000):**
    - `GET /api/engine/<id>/history`: Streams run-to-failure cycle data for any selected engine.
    - `POST /api/predict`: Ingests sensor window and returns LSTM RUL, Random Forest stage probabilities, Isolation Forest anomaly score, and active redline breaches.
    - `GET /api/sensor-importance`: Serves verified TreeSHAP global feature importance rankings.
    - `GET /api/fleet`: Aggregates fleet status across monitored engines.
  - **Frontend Architecture (`dashboard/` using React + Vite on port 5173):**
    - **Realistic CFM56-5B4 Turbofan Cross-Section:** 2D interactive SVG rendering aerodynamic stations: Fan Inlet (T2, P2), LPC Booster (T24, BPR), HPC Core (T30, P30, Ps30, Nc, NRc), Combustor (phi, htBleed), HPT (W31), and LPT Exhaust (T50, W32, P15).
    - **Dynamic Redline Alert Logic:** Telemetry pins transition dynamically in real time:
      - **Cyan/Normal:** Within baseline $\pm 2.5\sigma$.
      - **Amber/Warning:** Exceeding $2.5\sigma$.
      - **Red/Critical:** Exceeding $3.8\sigma$ threshold limit.
    - **Cycle Scrubber:** Allows line engineers to scrub from cycle 1 to failure (cycle 192 on Engine 1) to watch degradation unfold.
  - **Automated Verification Suite (`scripts/verify_docs.py`):**
    - Runs 5 rigorous automated checks validating page counts, zero banned words, zero dollar figures, sequential numbering, and exact numerical alignment with `FACTS_v2.md`.
- **Top Viva Questions for Member 4:**
  1. *Q: "How does the Digital Twin interface communicate between models and UI?"*  
     **A:** *"The React frontend interfaces with our Python Flask REST API via asynchronous JSON polling. When an operator selects an engine or moves the cycle scrubber, the client dispatches the 50-cycle sensor buffer to `/api/predict`. Flask runs forward inference through the pre-loaded LSTM, Random Forest, and Isolation Forest models in under 15ms, returning health stages, RUL, and sensor redline flags."*
  2. *Q: "What makes your visualization an authentic digital twin rather than just a static dashboard?"*  
     **A:** *"A true digital twin must couple physical geometry with dynamic operational physics. Our SVG maps each of the 21 telemetry channels directly to its exact thermodynamic station on the CFM56 turbofan cross-section. Sensor pins change color based on real-time sigma breaches, allowing maintenance technicians to physically locate the failing subassembly (e.g. flashing red on HPC station Ps30)."*

---

## 3. The Physical Turbofan Problem Explained Simply

### Why do Jet Engines Fail?
Commercial high-bypass turbofans (such as the CFM56-5B4 powering the Airbus A320 and Boeing 737) operate in punishing thermodynamic environments:
- Compressor discharge pressures exceed **500 psia**.
- Turbine inlet temperatures exceed **1400°R**.
- High-pressure spools rotate at over **9,000 rpm**.

Over hundreds of flight cycles, tiny amounts of sand, dust, and atmospheric moisture cause **blade tip erosion** and **aerodynamic fouling** on High-Pressure Compressor (HPC) rotor blades. As blade tip clearances widen:
1. High-pressure static pressure (`Ps30`) and total pressure (`P30`) drop.
2. The engine fuel-air control system injects more fuel (`phi`) to maintain demanded thrust.
3. High-pressure core speed (`Nc`) and Low-Pressure Turbine exhaust gas temperature (`T50`) rise to compensate.
4. If unchecked, compressor efficiency drops until aerodynamic stall or complete combustor flameout occurs.

### The 7 Aerodynamic Engine Stations

```
INLET / FAN ──► LPC BOOSTER ──► HPC CORE ──► COMBUSTOR ──► HPT ──► LPT ──► EXHAUST
(T2, P2, Nf)    (T24, BPR)      (Ps30, Nc,   (phi, farB,   (W31)  (T50,    (epr)
                                 P30, NRc)    htBleed)             W32)
```

---

## 4. The Machine Learning Framework: Step-by-Step

Our digital twin uses three distinct, complementary paradigms. We do **NOT** use a naive voting ensemble; instead, each model handles a specific operational question:

```
Telemetry Stream (21 Sensors)
       │
       ├──► Random Forest (Single-Cycle Snapshot) ────────► "What is the health stage RIGHT NOW?"
       │                                                    (Healthy, Degrading, Critical)
       │
       ├──► 2-Layer LSTM (50-Cycle Sliding Window) ───────► "How many flight cycles until failure?"
       │                                                    (Continuous Remaining Useful Life)
       │
       └──► Isolation Forest (Baseline Trained) ──────────► "Is sensor behavior unprecedented?"
                                                            (Unsupervised Novelty Detection)
```

### Model 1: Random Forest Classifier (Primary DWM Task)
- **Input:** Single-cycle 21-dimensional normalized vector $[x_1, x_2, \dots, x_{21}]$.
- **Why Random Forest:** Fast ($<2\text{ms}$ inference), immune to monotonic feature scaling, natively evaluates non-linear decision boundaries, and enables exact game-theoretic interpretation via TreeSHAP.
- **Configuration:** 100 decision trees, maximum tree depth 10, random seed 42.
- **Output:** Discrete probability distribution across Stage 0, Stage 1, Stage 2.

### Model 2: Long Short-Term Memory (LSTM) RUL Regressor
- **Input:** Temporal matrix of shape `(50, 21)` representing the last 50 consecutive flight cycles.
- **Why LSTM:** Recurrent memory cells and gating vectors (forget gate $f_t$, input gate $i_t$, output gate $o_t$) preserve gradient flow over long temporal trajectories, filtering high-frequency noise and capturing slow thermodynamic drift.
- **Output:** Continuous predicted remaining useful life $R$ in flight cycles.

### Model 3: Isolation Forest Novelty Detector
- **Input:** Single-cycle 21-dimensional vector.
- **Training Strategy:** Fitted exclusively on initial healthy baseline cycles (cycles 1 to 10 of FD001 engines).
- **How it Works:** Isolates outliers by randomly selecting a feature and randomly selecting a split value. Anomalous points require fewer recursive splits to isolate (shorter average tree path length $E(h(x))$).
- **Anomaly Score:**
  $$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
  Where instances with $s(x, n) > 0.50$ represent statistical anomalies.

---

## 5. Master Benchmark Results Table (From FACTS_v2.md)

Every number here has been tested and verified. Use these exact numbers in viva:

| Metric Category | Specific Measurement | Random Forest | LSTM Network | Isolation Forest |
|---|---|---|---|---|
| **Primary 3-Stage Classification** | FD001 Test Macro-F1 (13,096 cycles) | **0.7303** | **0.8197** | — |
| | Healthy Class F1 ($R > 100$) | 0.912 | 0.927 | — |
| | Degrading Class F1 ($30 < R \le 100$) | 0.585 | 0.717 | — |
| | Critical Class F1 ($R \le 30$) | 0.694 | 0.816 | — |
| **Critical Stage Detection ($R \le 30$)** | Precision | **0.8412** | 0.7926 | 0.1372 |
| | Recall | 0.5904 | **0.8404** | **0.9970** |
| | Critical F1 Score | 0.6938 | **0.8158** | 0.2413 |
| **RUL Regression (Final 50 Cycles)** | FD001 Capped RMSE ($R \le 125$) | — | **15.07 cycles** | — |
| | FD001 Capped MAE | — | **10.68 cycles** | — |
| | FD001 Asymmetric NASA Score | — | **493.1** | — |
| | FD001 Uncapped RMSE | — | **15.68 cycles** | — |
| **Degradation Lead-Time Delay** | 100 Engines Mean Delay | +17.12 cycles (late) | **-10.57 cycles (early)** | -152.98 cycles |
| | 100 Engines Median Delay | +15.5 cycles (late) | **-2.0 cycles (early)** | -155.0 cycles |
| | **Paired Advantage (RF - LSTM)** | **Median: +21.0 cycles** (LSTM earlier in 80/100 engines = **80.0%**) |
| **Thermodynamic Explainability** | High-Pressure Compressor (HPC) Share | **49.18% ± 0.12%** (TreeSHAP) / **62.22%** (Permutation) |

---

## 6. What to Say vs. What NEVER to Say (Crucial Viva Rules)

Examiners love catching students who copy unverified marketing claims or fake metrics. Follow these strict rules:

| ❌ NEVER SAY THIS (Disaster) | ✅ ALWAYS SAY THIS (Full Marks) |
|---|---|
| *"Our project achieved 64.8% cost savings and saved $4.19 million."* | *"We evaluate models using engineering metrics: 3-stage macro-F1, critical class recall, and RUL RMSE. We do not make unsubstantiated dollar claims."* |
| *"Our LSTM achieved 99.2% classification accuracy."* | *"In FD001 test data, 75.6% of cycles belong to the Healthy majority class. Raw accuracy is misleading. Our true 3-stage macro-F1 is **0.8197** for LSTM and **0.7303** for Random Forest."* |
| *"We used a voting ensemble of RF, LSTM, and Isolation Forest."* | *"We do NOT use a voting ensemble. The three models serve complementary purposes: Random Forest provides snapshot health triage, LSTM predicts continuous RUL, and Isolation Forest tracks unsupervised anomalies."* |
| *"Our model is flawless and has no limits."* (Unsubstantiated claims) | *"Our model demonstrates a verified median lead-time advantage of 21.0 flight cycles on FD001, but exhibits domain transfer limitations when evaluated across multi-regime datasets without flight condition clustering."* |
| *"We dropped 9 useless sensors."* | *"We analyzed sensor variance under CV < 1e-4. While 9 channels show zero variance at constant sea-level in FD001, all 21 channels are active in FD002 and FD004. We preserved all 21 sensors to maintain universal schema compatibility."* |

---

## 7. Top 10 Toughest Viva Questions & Model Answers

### Q1: "Why did your model fail on FD002 and FD004 (Macro-F1 ~ 0.10)?"
**Answer:**  
*"FD001 operates under a single sea-level regime, whereas FD002 and FD004 operate across 6 altitude and Mach number conditions. Because our model was trained on unnormalized telemetry without flight regime clustering, ambient atmospheric variations overshadow subtle degradation drift. In our Future Work section, we propose k-means flight condition partitioning prior to sensor scaling to resolve this regime shift."*

### Q2: "Why does TreeSHAP give 49.18% HPC attribution while Permutation Importance gives 62.22%?"
**Answer:**  
*"TreeSHAP calculates marginal contributions across tree paths, distributing credit among correlated features (such as Ps30, P30, and Nc). Permutation importance randomly shuffles one feature at a time; because thermodynamic features are collinear, breaking the physical correlation of any single HPC sensor degrades tree performance disproportionately, concentrating a higher aggregate share (62.22%) on the compressor subassembly."*

### Q3: "What is the difference between capped and uncapped RUL?"
**Answer:**  
*"In initial cycles, turbofan components show zero measurable degradation; wear only begins after initial break-in. NASA literature standardizes a piecewise linear target capping RUL at 125 cycles during healthy operation. On FD001 test engines, our LSTM achieves a capped RMSE of 15.07 cycles versus an uncapped RMSE of 15.68 cycles."*

### Q4: "Why is Isolation Forest precision so low (0.1372) on Critical stages?"
**Answer:**  
*"Isolation Forest is an unsupervised detector trained on healthy cycles 1 to 10. As soon as thermodynamic parameters drift slightly from pristine baseline, isolation trees flag anomalies early (median delay -155 cycles). While this gives near-perfect recall (0.9970), it generates false early alarms on non-stationary degradation curves, which is why it cannot be used as standalone triage."*

### Q5: "How does your lead-time persistence rule work?"
**Answer:**  
*"To prevent single-cycle sensor noise from triggering premature maintenance alerts, we enforce a formal 3-cycle persistence rule: a model must flag Stage $\ge 1$ (Degrading or Critical) for 3 consecutive flight cycles. On Engine 1, LSTM triggers at cycle 98 (delay +6 from true onset at cycle 92), whereas Random Forest snapshot doesn't persist until cycle 149 (delay +57), yielding a 51-cycle lead-time advantage on that engine."*

### Q6: "Why didn't you use SMOTE to balance the classes?"
**Answer:**  
*"In operational prognostics, generating synthetic interpolated vectors via SMOTE risks violating thermodynamic laws (e.g., generating high compressor discharge pressure with low core speed). Instead, we preserve real physical telemetry distributions and evaluate macro-averaged F1 and critical-class precision/recall to account for class imbalance."*

### Q7: "What is the difference between physical core speed ($N_c$) and corrected core speed ($NR_c$)?"
**Answer:**  
*"$N_c$ is the mechanical shaft rotational speed measured by tachometer in rpm. $NR_c$ is corrected for ambient temperature and pressure ($\theta$ and $\delta$ thermodynamic ratios) to reflect the aerodynamic operating point regardless of atmospheric conditions."*

### Q8: "How does your Flask API handle model inference in real time?"
**Answer:**  
*"The models (`rf_classifier.pkl`, `lstm_rul_predictor.h5`, `iforest_anomaly.pkl`, and `scaler.pkl`) are loaded into memory once when the Flask app starts. Incoming JSON telemetry is converted to numpy arrays, scaled via the stored training bounds, and passed through vectorized forward passes, executing in under 15 milliseconds."*

### Q9: "What are the limitations of your work?"
**Answer:**  
*"We document four explicit limitations: (1) Telemetry is simulated by NASA's NPSS engine code rather than airline flight recorders; (2) Single-regime models collapse on multi-regime datasets without flight condition clustering; (3) Unsupervised Isolation Forest generates high false alarm rates on continuous drift; and (4) Temporal windowing requires buffering 50 cycles of telemetry history."*

### Q10: "If the airline gave you real CFM56 flight data tomorrow, what would you change?"
**Answer:**  
*"First, we would implement altitude-Mach number flight phase segmentation (takeoff, climb, cruise). Second, we would calibrate baseline normalization per individual engine serial number to account for manufacturing tolerances. Third, we would incorporate physics-informed loss functions enforcing thermodynamic work balances across turbine stages."*

---

## 8. How to Launch and Demo the Project Live

### Step 1: Verify the Entire Deliverable Package
Open PowerShell and run the automated verification suite:
```powershell
python scripts/verify_docs.py
```
*Expected Output:* `ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (100% COMPLIANT)`.

### Step 2: Launch the Flask Backend API (Port 5000)
```powershell
python src/dashboard_api.py
```
*Loads models in memory and starts REST services on `http://127.0.0.1:5000`.*

### Step 3: Launch the React Digital Twin Dashboard (Port 5173)
In a second terminal:
```powershell
cd dashboard
npm run dev -- --host 127.0.0.1 --port 5173
```
*Open `http://127.0.0.1:5173` in your browser.*

### Live Demo Flow for Examiner:
1. **Show Engine 1 at Cycle 20 (Healthy):** All telemetry pins on the turbofan SVG are cyan; RUL countdown displays `> 125`; Health Stage displays `Healthy` (green).
2. **Scrub to Cycle 100 (Degrading):** LSTM detects degradation; Stage shifts to `Degrading` (amber); pins on HPC station (`Ps30`, `Nc`) begin drifting.
3. **Scrub to Cycle 165 (Critical):** RUL drops below 30; Stage turns `Critical` (red); pins flash red exceeding $3.8\sigma$; explain that Random Forest now confirms mandatory aircraft grounding.
4. **Show TreeSHAP Attribution Panel:** Point out that `Ps30` and `Nc` dominate the bar chart, proving that High-Pressure Compressor degradation is the root cause.
5. **Show Fleet Matrix View:** Demonstrate simulated fleet-wide monitoring across active engines.

---

## 9. Deliverables Inventory Checklist

Before viva, verify that all files exist in your local workspace:

- [x] **Project Report (2 Pages):** [`docs/submission/Project_Report_2page.pdf`](submission/Project_Report_2page.pdf) & [`.docx`](submission/Project_Report_2page.docx)
- [x] **Research Paper (5 Pages, IEEE):** [`docs/submission/Research_Paper.pdf`](submission/Research_Paper.pdf) & [`.docx`](submission/Research_Paper.docx)
- [x] **LaTeX Paper Source:** [`docs/submission/paper.tex`](submission/paper.tex) & [`references.bib`](submission/references.bib)
- [x] **A1 Research Poster:** [`docs/submission/Poster_A1.pptx`](submission/Poster_A1.pptx) (A1 portrait, 3-column, QR code $\ge 60$ mm)
- [x] **Verified Facts Document:** [`docs/submission/FACTS_v2.md`](submission/FACTS_v2.md) (Single source of truth)
- [x] **Discrepancy Audit Log:** [`docs/submission/CHANGES.md`](submission/CHANGES.md)
- [x] **Code Inspection Audit:** [`docs/submission/CODE_AUDIT.md`](submission/CODE_AUDIT.md)
- [x] **Verification Script:** [`scripts/verify_docs.py`](../scripts/verify_docs.py)
- [x] **Live Digital Twin Dashboard:** `src/dashboard_api.py` + `dashboard/`
