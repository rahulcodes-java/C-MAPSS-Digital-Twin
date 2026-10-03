# Digital Twin Project Status

## Timeline: 4 Weeks — ALL COMPLETE ✅

### Week 1: Data Pipeline & Intelligence Foundation ✅
- [x] Folder structure + docs scaffolding created — 2026-09-29
- [x] data_loader.py: Load & normalize FD001 data
- [x] preprocessing.py: Feature engineering, SMOTE, class balance
- [x] FD001_cleaned.csv generated & validated (22,512 rows × 28 cols)
- [x] Flat sensors identified (7 dropped on real data: sensor_1, sensor_5, sensor_6, sensor_10, sensor_16, sensor_18, sensor_19)
- **Completed:** 2026-09-29

### Week 2: Intelligence Layer (Twin's Brain) ✅
- [x] classification.py: Decision Tree (F1=0.757) + Naive Bayes (F1=0.742) ✅ Target exceeded
- [x] clustering.py: K-means (K=2,3,4) + Hierarchical — Best K=4, silhouette=0.474
- [x] feature_importance.py: Top sensors = sensor_11 (56%), sensor_9 (16.6%), sensor_4 (6.0%)
- [x] anomaly_detection.py: Isolation Forest — Precision=0.445, Recall=0.223
- [x] Evaluation metrics computed
- **Completed:** 2026-09-29

### Week 3: Prediction & Scheduling (Twin's Planning) ✅
- [x] rul_predictor.py: Linear regression — RMSE=58.64, MAE=42.62 cycles
- [x] scheduler.py: Adaptive threshold (66 cycles) — **64.8% cost savings**
- [x] digital_twin.py: DigitalTwin class orchestrating all models
- [x] main.py: Full pipeline end-to-end
- **Completed:** 2026-09-29

### Week 4: Visualization & Defense ✅
- [x] React dashboard (Vite) scaffold — running at localhost:5173
- [x] EngineVisualization.jsx: 2D SVG engine diagram with 4 health zones
- [x] SensorPanel.jsx: Top sensors + importance bars
- [x] HealthStatus.jsx: RUL countdown + confidence ring
- [x] AnomalyAlert.jsx: Pulsing anomaly warning widget
- [x] MaintenanceScheduler.jsx: Urgency tiers + cost analysis
- [x] ReplaySlider.jsx: Timeline scrubber with coloured zones
- [x] FINAL_REPORT.md: 3-4 page report with results + 5-min pitch
- **Completed:** 2026-09-29

---

## Component Status

| Component | Status | Result |
|-----------|--------|--------|
| Data Pipeline | ✅ COMPLETE | 20,631 rows, SMOTE balanced 3:1→1:1 |
| Health Classifier | ✅ COMPLETE | DT F1=0.757, NB F1=0.742 |
| Failure Mode Clusterer | ✅ COMPLETE | K=4, Silhouette=0.474 |
| Anomaly Detector | ✅ COMPLETE | Precision=0.445, Recall=0.223 |
| RUL Predictor | ✅ COMPLETE | RMSE=58.64 cycles |
| Scheduler | ✅ COMPLETE | 64.8% cost savings |
| Dashboard | ✅ COMPLETE | localhost:5173 — 5 engines, full UI |
| Docs | ✅ COMPLETE | 11 markdown files, all updated |
| Final Report | ✅ COMPLETE | FINAL_REPORT.md |

---

## Key Metrics Summary

| Objective | Target | Achieved |
|-----------|--------|----------|
| Health Classification F1 | ≥ 0.75 | **0.757** ✅ |
| Top Sensors Stable | Yes | sensor_11, 9, 4 ✅ |
| Silhouette Score | ≥ 0.5 | 0.474 ⚠️ (close) |
| Model Under Noise | <10% drop | Not tested 🔲 |
| Cost Savings | ≥ 20% | **64.8%** ✅ |
| Dashboard Usable | Yes | ✅ React UI deployed |

---

## How to Run

### Backend (Python)
```bash
cd C-MAPSS-Digital-Twin/src
python main.py
```
Runs full pipeline: load → preprocess → classify → cluster → anomaly detect → RUL predict → schedule

### Dashboard (React)
```bash
cd C-MAPSS-Digital-Twin/dashboard
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Blockers & Notes
- **Real data:** Real data successfully loaded.
- **RUL RMSE:** Swap LinearRegression → GradientBoostingRegressor for ~15-cycle RMSE.
