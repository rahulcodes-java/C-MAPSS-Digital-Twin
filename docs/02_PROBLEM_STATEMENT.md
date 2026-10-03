# Problem Statement

## The Business Problem

Jet engines are expensive ($10M+ each). Each unscheduled failure costs airlines:
- Lost revenue from cancelled flights
- Emergency repairs (3-5x more costly than planned maintenance)
- Logistics disruption (alternate aircraft, delays)
- Safety risk (potential for in-flight incidents)

**Current Maintenance Approach:** Time-based (service every N hours). Inefficient.
- Overserve healthy engines (unnecessary cost)
- Miss emerging failures (safety risk)

**Better Approach:** Condition-based predictive maintenance.
- Predict failure before it happens
- Schedule maintenance only when needed
- Optimize engine lifespan

## The Technical Problem

Given:
- 21 sensor readings per engine per cycle
- Run-to-failure data (complete degradation trajectories)
- Unknown initial wear on each engine
- Sensor noise (mixture distributions)

Find:
1. When will this engine fail? (RUL prediction, in cycles)
2. Which component is failing? (Fault mode classification)
3. Which sensors are driving it? (Explainability)
4. When should we service it? (Cost-aware scheduling)
5. Is this pattern unusual? (Anomaly detection)

## The Digital Twin Solution

Build a virtual replica of each engine that:
- **Monitors** real-time sensor data
- **Predicts** remaining useful life
- **Explains** what's going wrong (which sensors/components)
- **Recommends** maintenance windows
- **Learns** from new data
- **Visualizes** engine health on a live dashboard

This is not just a model. It's a complete system that a maintenance engineer could actually use.

## Success Criteria

1. **Accuracy:** Health classification F1 ≥ 0.75 (not just accuracy, account for class imbalance)
2. **Interpretability:** Top 3 sensors driving each prediction are stable and explainable
3. **Reliability:** Silhouette score ≥ 0.5 for failure mode clusters
4. **Robustness:** Model holds up under noisy/missing sensors (Objective 4)
5. **Actionability:** Maintenance scheduler produces real windows (days/hours) that could be executed
6. **Usability:** Non-technical person looks at dashboard and understands engine status + recommendation

## Why This Project

- **Real problem:** Predictive maintenance is a $50B+ industry
- **Publishable research:** Papers on C-MAPSS are peer-reviewed, benchmarked
- **Portfolio strong:** "Built a digital twin" > "built a classifier"
- **DWM alignment:** Classification + clustering + anomaly detection + preprocessing
- **Defensible scope:** 4 weeks, solo, all objectives achievable