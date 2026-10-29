# C-MAPSS Digital Twin: Verified Project Facts (v2)

This document contains the single source of truth for all quantitative measurements cited across the C-MAPSS project deliverables. Every number listed below is derived from scripts executed in the active environment without model retraining.

---

## 1. Dataset Specifications
Source: `data/raw/`, `data/processed/`, verified by `scripts/sensor_variance.py` and `scripts/eval_v2.py`.

| Dataset | Operating Conditions | Fault Modes | Train Engines | Train Cycles (Rows) | Test Engines | Test Cycles (Rows) |
|---|---|---|---|---|---|---|
| **FD001** | 1 | 1 | 100 | 20631 | 100 | 13096 |
| **FD002** | 6 | 1 | 260 | 53759 | 259 | 33991 |
| **FD003** | 1 | 2 | 100 | 24720 | 100 | 16596 |
| **FD004** | 6 | 2 | 249 | 61249 | 248 | 41214 |
| **Total** | — | — | 709 | 160359 | 707 | 104897 |

- Total sensors retained: 21
- Sequence sliding window length: 50 cycles

---

## 2. Sensor Variance & Flatness Analysis
Source: `scripts/sensor_variance.py` (Flat defined as Coefficient of Variation $\text{CV} < 10^{-4}$ or $0.0001$).

- **FD001 Flat Sensors (9 of 21):** `T2`, `P2`, `P15`, `Nf`, `epr`, `NRf`, `farB`, `Nf_dmd`, `PCNfR_dmd`
- **FD002 Flat Sensors (0 of 21):** None
- **FD003 Flat Sensors (7 of 21):** `T2`, `P2`, `Nf`, `NRf`, `farB`, `Nf_dmd`, `PCNfR_dmd` (`P15` and `epr` show non-zero variance)
- **FD004 Flat Sensors (0 of 21):** None

---

## 3. Remaining Useful Life (RUL) Regression Performance (LSTM)
Source: `scripts/eval_v2.py` (Evaluated on the final 50-cycle window per test engine, front-padded if length < 50).

### A. Evaluated Against Capped Ground Truth: $\min(\text{True RUL}, 125)$
- **FD001 (100 engines):** RMSE = 15.07, MAE = 10.68, NASA PHM08 Score = 493.1
- **FD002 (259 engines):** RMSE = 74.86, MAE = 62.78, NASA PHM08 Score = 468759.9
- **FD003 (100 engines):** RMSE = 47.85, MAE = 39.00, NASA PHM08 Score = 22149.4
- **FD004 (248 engines):** RMSE = 77.51, MAE = 65.50, NASA PHM08 Score = 509085.7

### B. Evaluated Against Uncapped Ground Truth
- **FD001 (100 engines):** RMSE = 15.68, MAE = 11.75, NASA PHM08 Score = 510.5
- **FD002 (259 engines):** RMSE = 87.33, MAE = 70.27, NASA PHM08 Score = 14969663.0
- **FD003 (100 engines):** RMSE = 49.96, MAE = 40.56, NASA PHM08 Score = 42643.6
- **FD004 (248 engines):** RMSE = 91.04, MAE = 74.19, NASA PHM08 Score = 12645436.0

---

## 4. Multi-Class 3-Stage Engine Health Classification
Source: `scripts/eval_v2.py` (Evaluated across every test cycle; Health stages: Healthy $\text{RUL} > 100$, Degrading $30 < \text{RUL} \le 100$, Critical $\text{RUL} \le 30$).

### A. Performance Across Datasets
- **FD001 (13096 cycles; 9902 Healthy, 2862 Degrading, 332 Critical):**
  - Random Forest Macro-F1 = 0.7303 (Class F1: Healthy 0.912, Degrading 0.585, Critical 0.694)
  - LSTM-derived Macro-F1 = 0.8197 (Class F1: Healthy 0.927, Degrading 0.717, Critical 0.816)
- **FD002 (33991 cycles; 25160 Healthy, 7744 Degrading, 1087 Critical):**
  - Random Forest Macro-F1 = 0.1283 (Class F1: Healthy 0.000, Degrading 0.324, Critical 0.061)
  - LSTM-derived Macro-F1 = 0.0378 (Class F1: Healthy 0.000, Degrading 0.048, Critical 0.066)
- **FD003 (16596 cycles; 13289 Healthy, 3016 Degrading, 291 Critical):**
  - Random Forest Macro-F1 = 0.2785 (Class F1: Healthy 0.438, Degrading 0.300, Critical 0.097)
  - LSTM-derived Macro-F1 = 0.2410 (Class F1: Healthy 0.355, Degrading 0.267, Critical 0.101)
- **FD004 (41214 cycles; 33484 Healthy, 6866 Degrading, 864 Critical):**
  - Random Forest Macro-F1 = 0.1004 (Class F1: Healthy 0.000, Degrading 0.253, Critical 0.048)
  - LSTM-derived Macro-F1 = 0.0264 (Class F1: Healthy 0.000, Degrading 0.036, Critical 0.043)

### B. Confusion Matrices on FD001 Test Cycles
- **Random Forest (Rows: True, Cols: Pred [Healthy, Degrading, Critical]):**
  - True Healthy (0): 9502, 400, 0
  - True Degrading (1): 1422, 1403, 37
  - True Critical (2): 3, 133, 196
- **LSTM-Derived Stage (Rows: True, Cols: Pred [Healthy, Degrading, Critical]):**
  - True Healthy (0): 9224, 678, 0
  - True Degrading (1): 782, 2007, 73
  - True Critical (2): 0, 53, 279

---

## 5. Binary Critical Class Detection ($\text{RUL} \le 30$ vs Rest)
Source: `scripts/eval_v2.py` (Positive class: Critical stage).

- **FD001 (332 Critical cycles out of 13096):**
  - Random Forest (Single snapshot): Precision = 0.8412, Recall = 0.5904, F1 = 0.6938
  - LSTM (Sequence window): Precision = 0.7926, Recall = 0.8404, F1 = 0.8158
  - Isolation Forest (Unsupervised): Precision = 0.1372, Recall = 0.9970, F1 = 0.2413
- **FD002 (1087 Critical cycles out of 33991):**
  - Random Forest: Precision = 0.0325, Recall = 0.4581, F1 = 0.0607
  - LSTM: Precision = 0.0341, Recall = 0.9917, F1 = 0.0659
  - Isolation Forest: Precision = 0.0320, Recall = 1.0000, F1 = 0.0620
- **FD003 (291 Critical cycles out of 16596):**
  - Random Forest: Precision = 0.0568, Recall = 0.3436, F1 = 0.0974
  - LSTM: Precision = 0.0543, Recall = 0.7148, F1 = 0.1009
  - Isolation Forest: Precision = 0.0175, Recall = 1.0000, F1 = 0.0345
- **FD004 (864 Critical cycles out of 41214):**
  - Random Forest: Precision = 0.0251, Recall = 0.5405, F1 = 0.0479
  - LSTM: Precision = 0.0220, Recall = 0.9907, F1 = 0.0431
  - Isolation Forest: Precision = 0.0210, Recall = 1.0000, F1 = 0.0411

---

## 6. Lead-Time & Degradation Transition Timing
Source: `scripts/lead_time.py` (Evaluated on FD001 training engines; detection defined as $\ge 1$ persisting 3 consecutive cycles).

### A. All Engines Cohort (100 Engines)
- **Degrading Stage Delay ($\text{Detection Cycle} - \text{True Cycle}$):**
  - Random Forest: Mean delay = 17.12 cycles, Median delay = 15.5 cycles, IQR = 35.25 cycles, Never detected count = 0
  - LSTM: Mean delay = -10.57 cycles, Median delay = -2.0 cycles, IQR = 41.5 cycles, Never detected count = 0
- **Paired Difference ($\text{RF Delay} - \text{LSTM Delay}$):**
  - Mean paired difference = 27.69 cycles
  - Median paired difference = 21.0 cycles
  - IQR = 32.5 cycles
  - LSTM flags first count = 80 engines
  - RF flags first count = 19 engines
  - Same cycle count = 1 engine
  - Share of engines where LSTM flags first = 0.8 (80.0%)
- **Critical Stage Delay:**
  - Random Forest: Mean delay = 3.28 cycles, Median delay = 1.0 cycles, IQR = 6.25 cycles
  - LSTM: Mean delay = -3.61 cycles, Median delay = -3.0 cycles, IQR = 9.0 cycles
  - Isolation Forest (First trigger): Mean delay = -152.98 cycles, Median delay = -155.0 cycles, IQR = 68.25 cycles

### B. In-Sample Training Engines Cohort (Engines 1 to 82)
- Degrading RF: Mean delay = 17.26 cycles, Median delay = 15.5 cycles, IQR = 33.5 cycles
- Degrading LSTM: Mean delay = -9.68 cycles, Median delay = 0.0 cycles, IQR = 38.25 cycles
- Critical RF: Mean delay = 3.3 cycles, Median delay = 1.0 cycles, IQR = 6.75 cycles
- Critical LSTM: Mean delay = -3.45 cycles, Median delay = -3.0 cycles, IQR = 7.75 cycles
- Paired Difference (RF - LSTM): Mean = 26.94 cycles, Median = 21.0 cycles, IQR = 35.0 cycles, Share LSTM flags first = 0.7683 (76.83%)

### C. Held-Out Validation Tail Cohort (Engines 83 to 100, 18 Engines)
- Degrading RF: Mean delay = 16.5 cycles, Median delay = 12.0 cycles, IQR = 45.75 cycles
- Degrading LSTM: Mean delay = -14.61 cycles, Median delay = -10.0 cycles, IQR = 49.0 cycles
- Critical RF: Mean delay = 3.17 cycles, Median delay = 1.5 cycles, IQR = 5.5 cycles
- Critical LSTM: Mean delay = -4.33 cycles, Median delay = -3.0 cycles, IQR = 11.25 cycles
- Paired Difference (RF - LSTM): Mean = 31.11 cycles, Median = 26.5 cycles, IQR = 25.0 cycles, Share LSTM flags first = 0.9444 (94.44%)

### D. Single-Engine Trajectory (Engine 1, 192 Total Cycles)
- True Degrading boundary ($\text{RUL} \le 100$): Cycle 92
- True Critical boundary ($\text{RUL} \le 30$): Cycle 162
- Random Forest Degrading detection: Cycle 149 (Delay = +57 cycles)
- LSTM Degrading detection: Cycle 98 (Delay = +6 cycles)
- Random Forest Critical detection: Cycle 162 (Delay = 0 cycles)
- LSTM Critical detection: Cycle 163 (Delay = +1 cycle)
- Isolation Forest first trigger: Cycle 132
- Paired lead-time difference on Engine 1 ($\text{RF} - \text{LSTM}$): 51 cycles

---

## 7. Feature Importance & Engine Subassembly Attribution
Source: `scripts/shap_analysis.py` (Evaluated with saved Random Forest over 5 random 1000-row seeds [42, 101, 202, 303, 404] and 5-repeat permutation importance on FD001 test).

### A. Per-Sensor SHAP Importance (Mean % $\pm$ SD %)
1. `Ps30` (HPC Static Pressure): 14.25% $\pm$ 0.23%
2. `Nc` (HPC Physical Core Speed): 13.01% $\pm$ 0.24%
3. `T50` (LPT Total Temperature / EGT): 11.77% $\pm$ 0.17%
4. `P30` (HPC Total Pressure): 9.71% $\pm$ 0.12%
5. `NRc` (HPC Corrected Core Speed): 9.41% $\pm$ 0.16%
6. `phi` (Combustor Fuel Ratio): 9.29% $\pm$ 0.09%
7. `BPR` (LPC Bypass Ratio): 7.57% $\pm$ 0.06%
8. `W32` (LPT Coolant Bleed Flow): 6.07% $\pm$ 0.06%
9. `W31` (HPT Coolant Bleed Flow): 5.36% $\pm$ 0.07%
10. `T24` (LPC Total Temperature): 3.99% $\pm$ 0.06%
11. `T30` (HPC Total Temperature): 2.78% $\pm$ 0.06%
12. `htBleed` (Combustor Bleed Enthalpy): 2.66% $\pm$ 0.05%
13. `NRf` (Fan Corrected Speed): 2.33% $\pm$ 0.06%
14. `Nf` (Fan Physical Speed): 1.77% $\pm$ 0.04%
15. `P15` (LPT Bypass Pressure): 0.01% $\pm$ 0.00%
16–21. `T2`, `P2`, `epr`, `farB`, `Nf_dmd`, `PCNfR_dmd`: 0.00% $\pm$ 0.00%

### B. Subassembly Attribution Comparison
- **High-Pressure Compressor (HPC):**
  - TreeSHAP Share: 49.18% $\pm$ 0.12%
  - Permutation Importance Share: 62.22%
- **Low-Pressure Turbine (LPT):**
  - TreeSHAP Share: 17.86% $\pm$ 0.13%
  - Permutation Importance Share: 13.67%
- **Combustion Chamber:**
  - TreeSHAP Share: 11.95% $\pm$ 0.08%
  - Permutation Importance Share: 11.54%
- **Low-Pressure Compressor (LPC Booster):**
  - TreeSHAP Share: 11.56% $\pm$ 0.05%
  - Permutation Importance Share: 7.08%
- **High-Pressure Turbine (HPT):**
  - TreeSHAP Share: 5.36% $\pm$ 0.07%
  - Permutation Importance Share: 2.74%
- **Fan & Inlet:**
  - TreeSHAP Share: 4.09% $\pm$ 0.10%
  - Permutation Importance Share: 2.75%
- **Engine-Level (`epr`):**
  - TreeSHAP Share: 0.00% $\pm$ 0.00%
  - Permutation Importance Share: 0.00%
