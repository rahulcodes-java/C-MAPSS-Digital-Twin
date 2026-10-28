# C-MAPSS Digital Twin: Verified Project Facts

This document lists all verified quantitative facts, model configurations, and data characteristics used across the DWM mini-project submission deliverables. Every number cited in the project report, research paper, poster, and presentation is sourced directly from codebase inspection and persisted result files.

---

## 1. Team & Academic Context
- **Institution:** Vidyalankar Institute of Technology (VIT), Mumbai
- **Course:** Data Warehousing and Mining (DWM), Semester 5
- **Project Track:** Classification (Primary: 3-Stage Engine Health Classification using Random Forest + SHAP)
- **Secondary Tasks:** RUL Regression (LSTM), Unsupervised Anomaly Detection (Isolation Forest)
- **Team Members:**
  1. Rahul Bansode
  2. Shubham Vaidya
  3. Gaurav Yadav
  4. Mufeed Rajapkar
- **Repository:** https://github.com/rahulcodes-java/C-MAPSS-Digital-Twin

---

## 2. Dataset Specifications (NASA C-MAPSS)
Source: `src/data_loader_v2.py`, `data/raw/`, `data/processed/`

| Dataset | Operating Conditions | Fault Modes | Train Engines | Train Cycles (Rows) | Test Engines | Test Cycles (Rows) |
|---|---|---|---|---|---|---|
| **FD001** | 1 (Sea Level) | 1 (HPC Degradation) | 100 | 20,631 | 100 | 13,096 |
| **FD002** | 6 | 1 (HPC Degradation) | 260 | 53,759 | 259 | 33,991 |
| **FD003** | 1 (Sea Level) | 2 (HPC + Fan Degradation) | 100 | 24,720 | 100 | 16,596 |
| **FD004** | 6 | 2 (HPC + Fan Degradation) | 249 | 61,249 | 248 | 41,214 |
| **Total** | — | — | **709** | **160,359** | **707** | **104,897** |

### Sensor Retention & Operating Conditions
- **Total Sensors Retained:** All 21 sensors preserved across all datasets.
- **Flat Sensors in FD001:** `T2`, `P2`, `epr`, `farB`, `Nf_dmd`, `PCNfR_dmd` show zero/near-zero variance under FD001's single sea-level operating condition.
- **Justification for Full Retention:** Under FD002 and FD004 (6 operating conditions), none of these sensors are flat (`[]` in `data/processed/sensor_consistency_analysis.json`). Retaining all 21 sensors maintains an identical schema for cross-dataset evaluation and avoids manual cherry-picking.

---

## 3. Preprocessing & Labeling Rules
Source: `src/data_loader_v2.py`
- **Scaler:** `MinMaxScaler(feature_range=(0, 1))` fitted strictly on each dataset's training set sensors (`train_df[SENSOR_COLUMNS]`) and applied to the test set (`test_df[SENSOR_COLUMNS]`).
- **Health Stage Bins (Multi-Class Target):**
  - **Stage 0 (Healthy):** $\text{RUL} > 100$ flight cycles
  - **Stage 1 (Degrading):** $30 < \text{RUL} \le 100$ flight cycles
  - **Stage 2 (Critical):** $\text{RUL} \le 30$ flight cycles
- **Sliding Window:** Sequence length of $W = 50$ cycles per engine.

---

## 4. Model Architectures & Experimental Hyperparameters

### Model 1: LSTM RUL Predictor
Source: `src/rul_predictor_lstm.py`
- **Architecture:** Sequential LSTM
  - Layer 1: LSTM (128 units, activation='relu', `return_sequences=True`, input shape=(50, 21))
  - Dropout: 0.2
  - Layer 2: LSTM (64 units, activation='relu')
  - Dropout: 0.2
  - Dense: 32 units, activation='relu'
  - Output: Dense (1 unit, linear activation for continuous RUL)
- **Optimizer:** Adam (learning rate = 0.001)
- **Loss:** Mean Squared Error (`mse`)
- **Training Setup:** `epochs=30`, `batch_size=32`, `validation_split=0.2`, EarlyStopping (`patience=5`, `restore_best_weights=True`).
- **Inference RUL Cap:** Clipped to $[0, 125]$ cycles to reflect linear piece-wise operational limits.
- **Classification Conversion:** $\text{RUL} > 30 \implies \text{Normal (1)}$, $\text{RUL} \le 30 \implies \text{Critical (0)}$ for binary F1 score evaluation.

### Model 2: Isolation Forest Anomaly Detection
Source: `src/anomaly_detector_iforest.py`
- **Algorithm:** `sklearn.ensemble.IsolationForest`
- **Contamination:** 0.10 (10%)
- **Random State:** 42, `n_jobs=-1`
- **Training Data:** Healthy baseline formed strictly by cycles 1 to 10 of FD001 engines (`train_df['cycle'] <= 10`).
- **Evaluation Target:** Critical health stage ($\text{RUL} \le 30$) treated as anomaly ground truth.
- **Operational Nature:** Triggers near the critical stage; does not provide early degradation warning.

### Model 3: Random Forest Classifier + TreeSHAP
Source: `src/feature_importance_shap.py`
- **Algorithm:** `sklearn.ensemble.RandomForestClassifier`
- **Trees (`n_estimators`):** 100
- **Max Depth:** 10
- **Random State:** 42, `n_jobs=-1`
- **Target:** 3-class health stage (0: Healthy, 1: Degrading, 2: Critical)
- **SHAP Explainer:** `shap.TreeExplainer(rf_model)`
- **SHAP Sample Size:** 1,000 instances randomly sampled from `X_train` (`random_state=42`) to compute mean absolute SHAP values across classes.

### Model 4: Comparative Ensemble Analysis
Source: `src/ensemble_comparator.py`
- **Nature:** Comparative benchmark across the three models, with an averaged macro/weighted F1 score:
  $$\text{Ensemble\_F1} = \frac{\text{LSTM\_F1} + \text{IForest\_F1} + \text{SHAP\_F1}}{3}$$
- **Explicit Framing:** This is an analytical comparative analysis, **not** a trained voting classifier or stacking model.

---

## 5. Quantitative Results

### A. Model Performance Across All 4 Datasets
Source: `results/model_comparison.csv`, `results/metrics/lstm_metrics.json`, `results/metrics/iforest_metrics.json`, `results/metrics/shap_metrics.json`

| Dataset | LSTM F1 | IForest F1 | RF + SHAP F1 | Comparative Avg F1 | LSTM MAE | LSTM RMSE | IForest Precision | IForest Recall |
|---|---|---|---|---|---|---|---|---|
| **FD001** | **0.9920** | 0.2413 | 0.8353 | **0.6895** | 23.59 | 34.05 | 0.1372 | 0.9970 |
| **FD002** | 0.0686 | 0.0620 | 0.0758 | 0.0688 | 104.70 | 118.76 | 0.0320 | 1.0000 |
| **FD003** | 0.8649 | 0.0345 | 0.4071 | 0.4355 | 86.01 | 107.18 | 0.0175 | 1.0000 |
| **FD004** | 0.0637 | 0.0411 | 0.0432 | 0.0493 | 149.13 | 172.60 | 0.0210 | 1.0000 |
| **Average** | **0.4973** | **0.0947** | **0.3403** | **0.3108** | **90.86** | **108.15** | **0.0519** | **0.9992** |

*Note on NASA Score:* The specific asymmetric exponential NASA PHM08 score was not computed in the pipeline scripts. In accordance with honesty rules, this metric is logged as `[TODO: run and fill]` if required by evaluators.

---

### B. TreeSHAP Feature Importance & Engine Section Attribution
Source: `results/feature_importance.csv`

| Rank | Sensor | Full Name | Station / Area | Importance % |
|---|---|---|---|---|
| 1 | `Ps30` | Static Pressure at HPC Outlet | HPC | 14.19% |
| 2 | `Nc` | Physical Core Speed | HPC | 13.07% |
| 3 | `T50` | Total Temperature at LPT Outlet (EGT) | LPT | 11.57% |
| 4 | `P30` | Total Pressure at HPC Outlet | HPC | 9.81% |
| 5 | `NRc` | Corrected Core Speed | HPC | 9.36% |
| 6 | `phi` | Fuel-to-Pressure Ratio | Combustor | 9.30% |
| 7 | `BPR` | Bypass Ratio | LPC Booster | 7.62% |
| 8 | `W32` | LPT Coolant Bleed Flow | LPT | 6.11% |
| 9 | `W31` | HPT Coolant Bleed Flow | HPT | 5.43% |
| 10 | `T24` | Total Temperature at LPC Outlet | LPC Booster | 3.99% |
| 11 | `T30` | Total Temperature at HPC Outlet | HPC | 2.80% |
| 12 | `htBleed` | Bleed Enthalpy | Combustor | 2.73% |
| 13 | `NRf` | Corrected Fan Speed | Fan/Inlet | 2.30% |
| 14 | `Nf` | Physical Fan Speed | Fan/Inlet | 1.71% |
| 15 | `P15` | Total Pressure in Bypass Duct | LPT | 0.02% |
| 16–21 | `P2`, `T2`, `epr`, `farB`, `PCNfR_dmd`, `Nf_dmd` | Flat Sensors (Sea Level) | Various | 0.00% |

#### Aggregated Importance by Engine Subassembly
- **High-Pressure Compressor (HPC):** **49.21%** (`Ps30`, `Nc`, `P30`, `NRc`, `T30`)
- **Low-Pressure Turbine (LPT):** **17.69%** (`T50`, `W32`, `P15`)
- **Combustion Chamber:** **12.04%** (`phi`, `htBleed`, `farB`)
- **Low-Pressure Compressor (LPC Booster):** **11.61%** (`BPR`, `T24`)
- **High-Pressure Turbine (HPT):** **5.43%** (`W31`)
- **Fan & Inlet:** **4.01%** (`NRf`, `Nf`, `T2`, `P2`, `PCNfR_dmd`, `Nf_dmd`)
- **Engine-Level:** **0.00%** (`epr`)

*Physical Validation:* NASA C-MAPSS FD001 simulates High-Pressure Compressor (HPC) degradation. The fact that HPC sensors account for 49.21% of the total SHAP contribution validates that the machine learning pipeline captures real thermodynamic fault physics rather than spurious noise.

---

### C. Sequence Model vs. Single-Snapshot Classifier Consistency
Source: `scripts/check_rul_consistency.py` output on Engine 1 (192 total cycles)

| Flight Cycle | True RUL | Predicted RUL | Abs Error | RF Stage (Snapshot) | RUL Stage (Sequence) | IForest Anomaly | Observation |
|---|---|---|---|---|---|---|---|
| 1 | 191.0 | 125.0 (clipped) | 66.0 | 0 (Healthy) | 0 (Healthy) | 0 | Baseline flight envelope |
| 25 | 167.0 | 125.0 (clipped) | 42.0 | 0 (Healthy) | 0 (Healthy) | 0 | Baseline flight envelope |
| 50 | 142.0 | 125.0 (clipped) | 17.0 | 0 (Healthy) | 0 (Healthy) | 0 | Baseline flight envelope |
| **100** | **92.0** | **95.6** | **3.6** | **0 (Healthy)** | **1 (Degrading)** | **0** | **Sequence model flags degradation 44 cycles earlier than RF** |
| 144 | 48.0 | 60.2 | 12.2 | 1 (Degrading) | 1 (Degrading) | 0 | Snapshot classifier transitions to Degrading |
| 170 | 22.0 | 19.1 | 2.9 | 2 (Critical) | 2 (Critical) | 1 | IForest triggers anomaly near critical threshold |
| 192 | 0.0 | 4.5 | 4.5 | 2 (Critical) | 2 (Critical) | 1 | Terminal failure cycle |

---

## 6. Project Limitations & Honesty Disclosures
1. **Simulated Data:** C-MAPSS is a numerical simulation produced by NASA's Numerical Propulsion System Simulation (NPSS); no real airline operational flight records were utilized.
2. **Dashboard Demo Dataset:** In `src/dashboard_api.py`, the interactive digital twin simulation loads `FD001_train_cleaned.csv` so users can observe full run-to-failure cycles (e.g., 192 cycles for Engine 1). Test engines are truncated before failure.
3. **Cross-Condition Generalization Collapse:** Models trained on single-condition FD001 experience sharp performance drops on FD002 and FD004 (F1 ~0.04 to 0.07) because operating conditions were not normalized per flight regime (cluster-based or regime-wise normalization was not implemented).
4. **Isolation Forest Timing:** Isolation Forest achieves near 100% recall on critical cycles but has low precision (0.137 on FD001) because it flags anomalies late in the engine lifecycle ($\text{RUL} \le 30$); it is not an early warning indicator.
5. **Ensemble Framing:** The ensemble metric is an arithmetic average of individual model F1 scores; it is a comparative benchmark, not an independently trained meta-classifier.

---

## 7. Approved Real References (IEEE Style Only)
1. A. Saxena, K. Goebel, D. Simon, and N. Eklund, "Damage propagation modeling for aircraft engine run-to-failure simulation," in *Proc. 2008 Int. Conf. Prognostics and Health Management (PHM08)*, Denver, CO, USA, 2008, pp. 1–9.
2. S. Hochreiter and J. Schmidhuber, "Long short-term memory," *Neural Computation*, vol. 9, no. 8, pp. 1735–1780, 1997.
3. F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation forest," in *Proc. 2008 Eighth IEEE Int. Conf. Data Mining (ICDM)*, Pisa, Italy, 2008, pp. 413–422.
4. L. Breiman, "Random forests," *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.
5. S. M. Lundberg and S.-I. Lee, "A unified approach to interpreting model predictions," in *Advances in Neural Information Processing Systems (NeurIPS 30)*, Long Beach, CA, USA, 2017, pp. 4765–4774.
