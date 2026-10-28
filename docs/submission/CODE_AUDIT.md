# Codebase Audit: C-MAPSS Digital Twin Architecture

This document answers the Part A1 code audit questions with exact file and line references from inspecting the active codebase.

---

### Question a: LSTM RUL Target Capping
**Question:** Is RUL capped at 125 in the LSTM TRAINING targets, or only clipped at inference?

**Inspection & Findings:**
- File: [src/data_loader_v2.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/data_loader_v2.py#L54-L60)
  ```python
  56: engine_cycles = train_df[train_df['engine_id'] == engine]['cycle'].max()
  57: rul_vals = list(range(engine_cycles - 1, -1, -1))  # max-1 down to 0
  58: train_rul.extend(rul_vals)
  ```
- File: [src/rul_predictor_lstm.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/rul_predictor_lstm.py#L51-L60)
  ```python
  52: rul_data = train_df[train_df['engine_id'] == engine_id]['RUL'].values
  ...
  57: y_list.append(y_seq)
  ...
  60: y_train = np.hstack(y_list)
  ```
  The training targets `y_train` are loaded directly from the processed dataset without any capping at 125. Targets range up to the maximum run-to-failure cycle length (e.g., 361 cycles).
- File: [src/dashboard_api.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/dashboard_api.py#L442-L444)
  ```python
  442: # LSTM prediction clipped to [0, 125] to match training cap
  443: raw_pred = float(lstm_model.predict(X_seq, verbose=0)[0][0])
  444: predicted_rul = float(np.clip(raw_pred, 0, 125))
  ```
**Conclusion:** RUL is **NOT** capped at 125 in the LSTM training targets. The training loss was evaluated on uncapped linear run-to-failure targets. Clipping to $[0, 125]$ occurs strictly at inference time in `dashboard_api.py`. The comment on line 442 claiming it "matches training cap" is factually incorrect.

---

### Question b: Random Forest Class Weight & SHAP Configuration
**Question:** Does the RandomForest use `class_weight`? What exactly is passed to `shap_values` (rows, any background data)?

**Inspection & Findings:**
- File: [src/feature_importance_shap.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/feature_importance_shap.py#L55-L58)
  ```python
  55: rf_model = RandomForestClassifier(
  56:     n_estimators=100, random_state=42, n_jobs=-1, max_depth=10
  57: )
  58: rf_model.fit(X_train, y_train)
  ```
  `class_weight` is omitted, so it defaults to `None`. No class reweighting is applied despite class imbalance across Healthy (0), Degrading (1), and Critical (2).
- File: [src/feature_importance_shap.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/feature_importance_shap.py#L71-L75)
  ```python
  71: explainer = shap.TreeExplainer(rf_model)
  72: np.random.seed(42)
  73: sample_indices = np.random.choice(len(X_train), size=1000, replace=False)
  74: X_train_sample = X_train[sample_indices]
  75: shap_values = explainer.shap_values(X_train_sample)
  ```
**Conclusion:** 
1. `class_weight` is `None` (unweighted).
2. `shap.TreeExplainer(rf_model)` is constructed without background data, using path-dependent tree feature perturbation.
3. Exactly 1,000 rows randomly sampled without replacement from `X_train` (`X_train_sample`, random seed 42) are passed to `shap_values`.

---

### Question c: RUL Labelling and Ground Truth Derivation
**Question:** RUL labelling in `data_loader_v2.py`: RUL at the last train cycle (0 or 1)? How test RUL is derived from `RUL_FD00X.txt`. Fix any off-by-one in evaluation scripts.

**Inspection & Findings:**
- File: [src/data_loader_v2.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/data_loader_v2.py#L54-L60)
  ```python
  56: engine_cycles = train_df[train_df['engine_id'] == engine]['cycle'].max()
  57: rul_vals = list(range(engine_cycles - 1, -1, -1))  # max-1 down to 0
  58: train_rul.extend(rul_vals)
  ```
  At the final training cycle (index `engine_cycles - 1`), the RUL value is **0**.
- File: [src/data_loader_v2.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/data_loader_v2.py#L63-L72)
  ```python
  67: rul_at_last = rul_df.iloc[i, 0]
  68: # First cycle RUL = rul_at_last + test_cycles - 1, last cycle RUL = rul_at_last
  69: rul_vals = list(range(rul_at_last + test_cycles - 1, rul_at_last - 1, -1))
  70: test_rul.extend(rul_vals[:test_cycles])
  ```
  For test engines, each engine has $n = \text{test\_cycles}$ cycles. For cycle $k \in [1, n]$, the formula yields:
  $$\text{true\_rul}(k) = \text{RUL\_file} + (n - k)$$
  At the final test observation ($k = n$), $\text{true\_rul}(n) = \text{RUL\_file}$.
**Conclusion:**
- Train RUL at final cycle is **0**.
- Test RUL at final observed cycle is $\text{RUL\_file}$, and cycle $k$ has $\text{true\_rul}(k) = \text{RUL\_file} + (n - k)$.
- In all evaluation scripts (`scripts/eval_v2.py`, `scripts/lead_time.py`), we use exact cycle-indexed arithmetic without off-by-one offsets.

---

### Question d: LSTM Validation Split Engines
**Question:** LSTM `validation_split=0.2` without shuffle holds out the LAST 20% of the stacked sequences. Identify which FD001 train engines that is.

**Inspection & Findings:**
- File: [src/rul_predictor_lstm.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/rul_predictor_lstm.py#L50-L60)
  Engines are iterated in ascending order `sorted(train_df['engine_id'].unique())` (1 to 100).
  Total sequences created: 15,631 sequences (each of length 50).
  Training slice (first 80%): 12,505 sequences.
  Validation slice (last 20%): 3,126 sequences.
- Sequential boundary calculation:
  - Engines 1 to 82: 12,492 sequences (all in training split).
  - Engine 83: 243 sequences total. First 13 sequences fall in training split; remaining 230 sequences fall in validation split.
  - Engines 84 to 100: 2,896 sequences total (100% in validation split).
**Conclusion:**
The held-out validation tail consists of **18 engines (Engines 83 to 100)**:
- Engines 84–100 are completely held out from training gradient steps.
- Engine 83 is split (first 13 sequences in train, remaining 230 in val).
- Engines 1–82 are strictly in-sample training engines.

---

### Question e: Dashboard API and Frontend Data Sources
**Question:** Does `dashboard_api.py` read train or test CSVs? Where does `/api/fleet` get its numbers: real model calls or a synthetic fallback? Does the frontend show "Demo data" text when the API is offline?

**Inspection & Findings:**
- File: [src/dashboard_api.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/dashboard_api.py#L29-L37)
  Both `FD001_train_cleaned.csv` and `FD001_test_cleaned.csv` are loaded.
  - `/api/engine/<id>/history` (line 582) reads `df_raw_train` (`FD001_train_cleaned.csv`) to show full run-to-failure curves.
  - `/api/predict` (lines 406-413) checks `df_raw_train` first, then falls back to `df_raw_test`.
  - `/api/fleet` (line 678) uses `source_df = df_raw_test if df_raw_test is not None else df_raw_train` to get current cycle counts.
- File: [src/dashboard_api.py](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/src/dashboard_api.py#L671-L721)
  `/api/fleet` does **NOT** call LSTM, Random Forest, or Isolation Forest. It loads ground truth directly from `data/raw/RUL_FD001.txt`, assigns health stages via thresholds on `true_rul`, and assigns primary station (`HPC`, `LPT`, `Combustor`) using synthetic modulo arithmetic: `eid % 3`.
- File: [dashboard/src/components/FleetMatrixView.jsx](file:///c:/College/SEM-5/dwm-project/C-MAPSS-Digital-Twin/dashboard/src/components/FleetMatrixView.jsx#L59-L97)
  ```javascript
  59: const isDemo = !fleetData?.fleet?.length;
  ...
  97: {isDemo && <span className="demo-tag"> (Demo data — API offline)</span>}
  ```
**Conclusion:**
1. `dashboard_api.py` reads both CSVs: `train_cleaned.csv` for single-engine run-to-failure simulation and `test_cleaned.csv` for fleet operational cycle counts.
2. `/api/fleet` does **NOT** run real model inference; it uses a synthetic deterministic mapping over ground truth RUL values and modulo station assignments.
3. The frontend **DOES** display `(Demo data — API offline)` when the backend API is disconnected or returns an empty fleet.
