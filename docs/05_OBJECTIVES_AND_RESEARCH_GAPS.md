# 6 Objectives for the Digital Twin

Each objective is a layer of the twin's intelligence.

## Objective 1: Health Stage Classification (Twin's "Vital Signs Monitor")
**What:** Predict health_stage ∈ {healthy, degrading, critical} in real-time.
**Why:** The twin needs to know the engine's current state at every cycle.
**Algorithm:** Decision Tree (ID3), Naive Bayes
**DWM Concept:** Classification (Module 4)
**Research Backing:** Saxena et al., Özcan et al.
**Success Metric:** macro-F1 ≥ 0.75

---

## Objective 2: Explainability (Twin's "Doctor's Notes")
**What:** For each prediction, identify the top 3 sensors causing it.
**Why:** A maintenance engineer needs to know *why* the engine is degrading, not just that it is.
**Method:** Tree feature importance + correlation analysis
**DWM Concept:** Feature importance, interpretability
**Research Backing:** Shapley-based XAI paper
**Success Metric:** Top sensors are stable and interpretable

---

## Objective 3: Failure Mode Discovery (Twin's "Diagnosis")
**What:** Cluster engines into failure type groups (without labels initially).
**Why:** Different failure modes degrade differently. The twin learns these patterns.
**Algorithm:** K-means, Hierarchical clustering (semi-supervised with partial labels)
**DWM Concept:** Clustering (Module 5)
**Research Backing:** Shapley clustering paper
**Success Metric:** silhouette ≥ 0.5, ARI ≥ 0.6

---

## Objective 4: Robustness Under Noise (Twin's "Resilience")
**What:** Handle missing/noisy sensors gracefully.
**Why:** Real-world sensors glitch. The twin should still work.
**Method:** Feature selection, SMOTE, class weighting, noise injection testing
**DWM Concept:** Preprocessing, data reduction
**Research Backing:** Özcan et al. (future work item #3)
**Success Metric:** Model accuracy drops <10% under realistic noise

---

## Objective 5: Cost-Aware Scheduling (Twin's "Planner")
**What:** Recommend maintenance windows that balance cost and risk.
**Why:** False alarms (unnecessary early maintenance) and missed failures (safety risk) have different costs.
**Method:** Cost matrix + threshold tuning
**DWM Concept:** Association rules (if [conditions] then [schedule maintenance])
**Research Backing:** Özcan et al. (future work item #4 — explicitly their gap)
**Success Metric:** Cost-benefit ratio shows ≥20% savings vs. time-based maintenance

---

## Objective 6: Visualization & Actionability (Twin's "Interface")
**What:** Live dashboard showing engine health, sensors, RUL, recommendations.
**Why:** A maintenance team can't act on abstract model outputs. They need a clear, visual interface.
**Design:** 2D SVG engine diagram + sensor table + RUL countdown + anomaly alert + scheduler
**DWM Concept:** Data visualization, business intelligence
**Success Metric:** Non-technical person understands engine status in <30 seconds

---

## Mapping to Research Gaps

| Gap (from papers) | Objective | Your Solution |
|---|---|---|
| Robustness under noise (Özcan) | 4 | Test model accuracy under corrupted sensors |
| Cost-aware scheduling (Özcan) | 5 | Implement threshold tuning + cost matrix |
| Interpretability (Shapley/Özcan) | 2 | Feature importance + SHAP-style explainability |
| Semi-supervised clustering (Shapley) | 3 | Use partial labels to guide K-means |
| Class imbalance (imbalance paper) | 4 | SMOTE + class weighting |

**Your Pitch:**
"Papers identified 5 research gaps in predictive maintenance. We address all 5 in a scoped, 4-week project, implemented as a digital twin system."