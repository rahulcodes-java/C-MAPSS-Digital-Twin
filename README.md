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

### Python Pipeline
```bash
pip install -r requirements.txt
# Add real data: data/raw/train_FD001.txt, test_FD001.txt, RUL_FD001.txt
cd src
python main.py
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:5173
```

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
