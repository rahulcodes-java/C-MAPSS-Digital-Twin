# C-MAPSS Digital Twin: Reconciliation of Changes (CHANGES.md)

This document tracks all previously published quantitative claims, architectural assertions, and marketing figures, contrasting them with new experimental measurements verified directly against codebase execution.

---

| # | Item / Metric | Earlier Claim | New Measured Value / Status | Source / Rationale |
|---|---|---|---|---|
| 1 | **LSTM Classification F1 (FD001)** | 0.9920 | **0.8197** (3-stage macro-F1) / **0.8158** (Critical binary F1) | Earlier script computed binary F1 for class "OK" ($RUL > 30$), reflecting class imbalance (99% normal). Replaced by standardized 3-stage macro-F1 and critical-class F1 (`scripts/eval_v2.py`). |
| 2 | **Comparative Avg F1** | 0.6895 (FD001), 0.3108 (Mean across datasets) | **Removed** | Averaged non-comparable tasks (multi-class RF, binary LSTM majority class, unsupervised IForest). Replaced with task-specific standardized metrics (`scripts/eval_v2.py`). |
| 3 | **NASA PHM08 Score** | Not computed (`[TODO: run and fill]`) | **493.1** (vs capped true 125), **510.5** (vs uncapped true) on FD001 | Computed with asymmetric exponential loss function on test engine final windows (`scripts/eval_v2.py`). |
| 4 | **Degradation Lead Time (Engine 1)** | 44 cycles earlier than RF | **51 cycles earlier** | Measured with formal 3-consecutive-cycle persistence rule: RF detects Degrading at cycle 149; LSTM detects at cycle 98 ($149 - 98 = 51$ cycles) (`scripts/lead_time.py`). |
| 5 | **Fleet-Wide Lead Time Advantage** | Unreported across fleet | **Median 21.0 cycles** (Mean 27.69, IQR 32.5); LSTM flags first in **80.0%** of engines | Full 100-engine cohort evaluation across FD001 training engines (`scripts/lead_time.py`). |
| 6 | **Held-Out Validation Tail Lead Time** | Unreported | **Median 26.5 cycles** (Mean 31.11, IQR 25.0); LSTM flags first in **94.44%** of engines | Evaluated on the 18 engines (83–100) held out during validation split (`scripts/lead_time.py`). |
| 7 | **FD001 Flat Sensors** | 6 sensors (`T2`, `P2`, `epr`, `farB`, `Nf_dmd`, `PCNfR_dmd`) | **9 sensors** (`T2`, `P2`, `P15`, `Nf`, `epr`, `NRf`, `farB`, `Nf_dmd`, `PCNfR_dmd`) | Evaluated with formal coefficient of variation threshold $\text{CV} < 10^{-4}$. `P15`, `Nf`, `NRf` also exhibit near-zero variance at sea level (`scripts/sensor_variance.py`). |
| 8 | **FD003 Flat Sensors** | Unreported or claimed 0 | **7 sensors** (`T2`, `P2`, `Nf`, `NRf`, `farB`, `Nf_dmd`, `PCNfR_dmd`) | Evaluated under $\text{CV} < 10^{-4}$. `P15` and `epr` are active under fan degradation (`scripts/sensor_variance.py`). |
| 9 | **TreeSHAP HPC Attribution** | 49.21% (single seed) | **49.18% $\pm$ 0.12%** | Measured over 5 random 1,000-row seeds (`scripts/shap_analysis.py`). |
| 10 | **HPC Permutation Importance** | Unreported | **62.22%** | Independent cross-check on FD001 test set (`scripts/shap_analysis.py`). |
| 11 | **Financial / Cost Savings Figures** | "$4,195,000 saved across fleet (64.8% reduction)" | **Removed** | All dollar, cost avoidance, and financial estimates removed per Rule R2. |
| 12 | **LSTM Training Target Cap** | Claimed RUL capped at 125 during training | **Uncapped training targets** | Code audit confirmed training targets are raw countdowns up to 361 cycles. Clipping to 125 occurs only at inference time (`docs/submission/CODE_AUDIT.md`). |
| 13 | **Fleet API Model Inference** | Claimed real model inference on 100 engines | **Synthetic deterministic fallback** | Code audit revealed `/api/fleet` assigns stages via ground truth thresholds and stations via modulo arithmetic (`eid % 3`) without invoking models (`docs/submission/CODE_AUDIT.md`). |
| 14 | **Offline Demo Indicator** | Unreported | **Confirmed present** | Dashboard frontend displays `(Demo data — API offline)` when API is unreachable (`docs/submission/CODE_AUDIT.md`). |
| 15 | **Banned Promotional Adjectives** | Used words like "robust", "exceptional", "catastrophic", "landmark" | **Removed** | Replaced with plain technical descriptions of observed metrics per Rule R2. |
