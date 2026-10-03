# Prediction Layer

## RUL Prediction (Remaining Useful Life Forecaster)

### Model
`sklearn.linear_model.LinearRegression` — baseline regressor

### Input
- 21 normalized sensor readings + 3 operational settings per cycle row

### Results (Test Set — engines 91–100)

| Metric | Value |
|---|---|
| RMSE | 58.64 cycles |
| MAE | 42.62 cycles |

**Note:** High error is expected from a linear model on this data. The synthetic C-MAPSS data used for testing has engineered exponential degradation, which linear regression struggles to capture. On the real NASA dataset, using gradient boosting (as in Özcan et al. 2025) reduces RMSE to ~12 cycles.

### Output
`results/rul_predictions.csv` — contains engine_id, cycle, actual_RUL, predicted_RUL for all test engines.

### Next Steps (Bonus)
Swap LinearRegression for GradientBoostingRegressor or LightGBM for significantly better accuracy — this directly addresses the Özcan et al. benchmark.

---

## Failure Mode Identification

The Digital Twin maps each engine to a cluster (K=4, KMeans) representing its failure trajectory.

- **Cluster 0:** Rapid degradation profile (engines that fail in <180 cycles)
- **Cluster 1:** Gradual degradation profile (engines with longer life >200 cycles)

This clustering is done on engine-level aggregated profiles (mean/std per sensor over lifetime), not per-cycle predictions.

*Last updated: 2026-09-29*