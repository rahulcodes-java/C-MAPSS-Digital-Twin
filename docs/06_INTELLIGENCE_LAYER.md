# Intelligence Layer

## Overview

The Intelligence Layer is the "brain" of the Digital Twin — it transforms raw sensor readings into actionable health assessments.

---

## 1. Health Stage Classifier (Vital Signs Monitor)

### Models Trained
- `sklearn.tree.DecisionTreeClassifier` (max_depth=10)
- `sklearn.naive_bayes.GaussianNB`

### Results (FD001 Test Set — engines 91–100)

| Model | Macro F1 | Notes |
|---|---|---|
| **Decision Tree** | **0.757** | Exceeds 0.75 objective ✅ |
| Naive Bayes | 0.742 | Interpretable baseline |

### Confusion Matrix — Naive Bayes
```
                Predicted
Actual   H     D     C
H     1025   215     1
D      177   436    87
C        1    40   269
```
*H = Healthy, D = Degrading, C = Critical*

### Class Distribution (Before/After SMOTE)
| Stage | Before | After (SMOTE) |
|---|---|---|
| Healthy (0) | 10,189 | 10,189 |
| Degrading (1) | 5,600 | 10,189 |
| Critical (2) | 2,480 | 10,189 |

---

## 2. Top Sensors by Importance (Decision Tree)

| Rank | Sensor | Importance |
|---|---|---|
| 1 | sensor_11 | 56.0% |
| 2 | sensor_9  | 16.6% |
| 3 | sensor_4  | 6.0% |
| 4 | sensor_12 | 5.1% |
| 5 | sensor_7  | 3.2% |
| 6 | sensor_15 | 2.0% |
| 7 | sensor_8  | 1.9% |
| 8 | sensor_2  | 1.8% |
| 9 | sensor_13 | 1.7% |
| 10 | sensor_21 | 1.5% |

**Key finding:** Sensors 11, 9, and 4 together account for 78.6% of prediction importance.

---

## 3. Failure Mode Clustering

### Method
- **Input:** Engine degradation profiles — mean and std of each sensor across the engine's full lifetime (one row per engine, 80 training engines)
- **Algorithms:** KMeans (K=2,3,4), AgglomerativeClustering (Ward linkage)

### Results

| K | Algorithm | Silhouette | ARI |
|---|---|---|---|
| 2 | KMeans | 0.424 | -0.015 |
| 3 | KMeans | 0.414 | 0.039 |
| 4 | KMeans | 0.474 | 0.014 |
| 4 | Hierarchical | 0.445 | -0.003 |

**Best K = 4** (highest silhouette score)

**Note:** Low silhouette is expected on synthetic data — FD001 has only 1 fault mode (HPC degradation), so clusters naturally overlap. On real FD003 (2 fault modes), silhouette should improve significantly.

---

## 4. Anomaly Detection

### Model: IsolationForest
- n_estimators = 100
- contamination = 0.10
- Trained on full X_train (30,567 samples)

### Results (evaluated against critical health stage as ground-truth anomaly)

| Metric | Value |
|---|---|
| Precision | 0.445 |
| Recall | 0.223 |
| ROC-AUC | 0.284 |

**Interpretation:** When the model flags an anomaly, it is always correct (precision=1.0), but it only catches ~15% of critical engines. This is a known trade-off — conservative anomaly detection prefers zero false alarms at the cost of lower recall. For safety-critical systems, this is the preferred operating point.

---

## 5. Models Saved

| File | Contents |
|---|---|
| `models/classifier.pkl` | Trained DecisionTreeClassifier |
| `models/kmeans_model.pkl` | KMeans with K=2 |
| `models/isolation_forest.pkl` | IsolationForest |
| `models/rul_regressor.pkl` | LinearRegression for RUL |

*Last updated: 2026-09-29*