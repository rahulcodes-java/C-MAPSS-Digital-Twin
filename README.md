# JetTwin — AI-Powered Digital Twin for Jet Engine Predictive Maintenance

> **DWM Lab Mini-Project · NASA C-MAPSS FD001 · September 2026**

An end-to-end Digital Twin system that monitors turbofan engine sensor data, predicts health stages, identifies failure modes, detects anomalies, forecasts remaining useful life, and recommends cost-aware maintenance windows — all visualized in a live React dashboard.

---

## Architecture

```
Sensors (21 channels) → Intelligence Layer (ML) → Prediction Layer → React Dashboard
                         • Health Classification        • RUL Forecast    • Engine Diagram
                         • Failure Mode Clustering      • Scheduler       • Sensor Panel
                         • Anomaly Detection                              • RUL Countdown
                         • Feature Importance                             • Maintenance Planner
```

---

## Key Results

| Metric | Value |
|---|---|
| Decision Tree F1 (Health Stage) | **0.757** |
| Naive Bayes F1 | 0.742 |
| Top Sensor | sensor_11 (56.0% importance) |
| Anomaly Precision | 0.445 |
| RUL RMSE | 58.64 cycles |
| Cost Savings vs Baseline | **64.8%** |

---

## Quick Start

### Option 1: One-Click Launch (Recommended)
Simply double-click [`run_project.bat`](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/run_project.bat) or run from PowerShell:
```powershell
.\run_project.ps1
```
This automatically starts both the Flask API server and Vite dashboard, then opens `http://127.0.0.1:5173` in your browser.

---

### Option 2: Manual Terminal Launch

**Terminal 1 — Python Flask API Backend (Port 5000):**
```bash
python src/dashboard_api.py
```
*Loads TensorFlow LSTM, Random Forest + TreeSHAP, and Isolation Forest models on port 5000.*

**Terminal 2 — React / Vite Dashboard (Port 5173):**
```bash
cd dashboard
npm install       # (Only needed once)
npm run dev -- --host 127.0.0.1 --port 5173
```
*Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.*

---

## Project Structure

| Folder | Contents |
|---|---|
| [`docs/`](docs/) | 11 markdown files — architecture, specs, research |
| [`src/`](src/) | 9 Python modules — data loader, ML models, orchestrator |
| [`dashboard/`](dashboard/) | React + Vite app — 7 components |
| [`data/`](data/) | Raw C-MAPSS files + processed CSV |
| [`models/`](models/) | Trained model pickles |
| [`results/`](results/) | Evaluation outputs, schedules, predictions |

---

## Research Papers

1. Saxena et al. (2008) — C-MAPSS dataset & baseline
2. Özcan et al. (2025) — Interpretable ensemble + cost scheduling *(gaps #4,#5 addressed)*
3. Shapley 2023 (arXiv:2303.14581) — Semi-supervised clustering XAI
4. Imbalance paper (2025) — SMOTE + feature selection on C-MAPSS

---

**Resume line:** *Built an AI-powered digital twin for jet engine predictive maintenance, integrating real-time health classification (F1=0.757), failure mode discovery, anomaly detection, and cost-aware scheduling into a React dashboard. Validated on NASA C-MAPSS dataset with 64.8% cost savings vs. baseline.*
