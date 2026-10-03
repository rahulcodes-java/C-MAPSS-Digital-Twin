# Scheduling Engine

## Overview

The Scheduling Engine is the "Planner" layer of the Digital Twin — it converts RUL predictions into concrete maintenance windows with cost-benefit analysis.

---

## Algorithm

### Step 1: Adaptive Threshold
Rather than a fixed 30-cycle threshold, the scheduler uses the **20th percentile of predicted RULs** as the trigger point. This is data-driven and adjusts automatically as the distribution shifts.

```
THRESHOLD = percentile_20(predicted_RUL) = 66 cycles
```

### Step 2: Alert Generation
```
TRIGGER MAINTENANCE if predicted_RUL < THRESHOLD
```

### Step 3: Cost Matrix

| Event | Cost |
|---|---|
| False Alarm (schedule when not needed) | $1,000 |
| Missed Failure (don't schedule when critical) | $10,000 |

The 10:1 ratio reflects real-world industry cost data — an unscheduled failure costs ~10x a planned maintenance visit.

---

## Results (FD001 Test Set)

| Metric | Value |
|---|---|
| Adaptive Threshold | 66 cycles |
| Correct Alerts | 433 |
| False Alarms | 11 (cost: $11,000) |
| Missed Failures | 227 (cost: $2,270,000) |
| **Total Twin Cost** | **$2,281,000** |
| **Baseline Cost** (time-based every 50 cycles) | **$6,476,000** |
| **Cost Savings** | **64.8%** |

**Key finding:** The Digital Twin saves 64.8% in maintenance costs vs. a naive time-based scheduling policy. Using a better RUL model (ensemble) would further improve savings.

---

## Research Gap Addressed

This directly implements **Özcan et al. (2025) Future Work Item #4**:
> *"Development of a dynamic scheduling algorithm with tunable thresholds and a cost-risk analysis framework..."*

Our scheduler implements:
- ✅ Adaptive threshold (percentile-based, not fixed)
- ✅ Cost matrix (false alarm vs. missed failure)
- ✅ Cost-benefit comparison vs. baseline
- ⬜ Multi-objective optimization (future work)

---

## Output Files

- `results/maintenance_schedule.csv` — 419 maintenance windows with timestamps and cost estimates
- `results/rul_predictions.csv` — per-cycle RUL predictions for all test engines

*Last updated: 2026-09-29*