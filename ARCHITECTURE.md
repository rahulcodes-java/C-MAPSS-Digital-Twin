# Digital Twin System Architecture

## High-Level Flow

REAL ENGINE (C-MAPSS Simulation)
↓ (21 sensors per cycle)
SENSOR INGESTION LAYER
↓
DATA PIPELINE
• Load & normalize
• Handle missing/noisy data
• Feature engineering
↓
INTELLIGENCE LAYER (The Twin's "Brain")
┌─────────────────────────────────────┐
│ • Classifier: Health Stage │
│ • Failure Mode Identifier: Clustering│
│ • Anomaly Detector: Unusual patterns │
│ • Feature Importance: Which sensors? │
│ • RUL Predictor: Cycles to failure │
│ • Scheduler: Maintenance windows │
└─────────────────────────────────────┘
↓
PREDICTION OUTPUT
• health_stage: {healthy, degrading, critical}
• failure_mode: {HPC degradation, fan degradation}
• rul: {12 cycles}
• top_sensors: {sensor_3, sensor_7, sensor_15}
• is_anomalous: {true/false}
• maintenance_window: {08:00-09:30 UTC}
↓
VISUALIZATION LAYER (The Twin's "Face")
┌─────────────────────────────────────┐
│ React Dashboard │
│ • Engine diagram (color-coded zones)│
│ • Sensor importance table │
│ • RUL countdown widget │
│ • Anomaly alert │
│ • Maintenance scheduler │
│ • Timeline replay (lifecycle view) │
└─────────────────────────────────────┘
↓
ACTIONABLE RECOMMENDATION
"Compressor degrading. RUL: 12 cycles.
Recommend maintenance 08:00-09:30 UTC.
High confidence (F1: 0.92)"


## Layer Breakdown

### 1. Data Pipeline
- **Input:** train_FD001.txt, test_FD001.txt, RUL_FD001.txt
- **Processing:** Load, normalize, drop flat sensors, handle class imbalance, create labels
- **Output:** Clean DataFrame ready for ML

### 2. Intelligence Layer (ML Models)
- **Classification:** Decision Tree + Naive Bayes → health_stage
- **Clustering:** K-means on engine profiles → failure_mode groups
- **Anomaly Detection:** Isolation Forest → unusual patterns
- **Feature Importance:** Tree importance + correlation → top sensors
- **RUL Prediction:** Regression (linear/ensemble) → cycles to failure
- **Scheduling:** Cost matrix + threshold logic → maintenance windows

### 3. Visualization Layer (React Dashboard)
- **Engine Diagram:** SVG with 4 zones (fan, compressor, turbine, nozzle), colors change as health degrades
- **Sensor Panel:** Table showing top 3 sensors + importance scores
- **Health Status:** RUL countdown, confidence level, health stage label
- **Anomaly Alert:** Red warning box if engine pattern is unusual
- **Maintenance Scheduler:** Recommended windows, cost analysis
- **Timeline Replay:** Scrub through engine's entire lifecycle
- **What-If Scenarios:** Test different scheduling policies

## Technology Stack

### Backend (Intelligence Layer)
- **Python 3.9+**
- **Data:** pandas, numpy
- **ML:** scikit-learn (decision tree, naive bayes, k-means, isolation forest, etc.)
- **Visualization (backend):** matplotlib, seaborn
- **Serialization:** pickle (save trained models)

### Frontend (Visualization Layer)
- **React** (component-based UI)
- **SVG** (engine diagram)
- **D3.js** (optional: advanced charts)
- **CSS:** Tailwind or Material-UI (styling)

### Orchestration
- **Python:** `digital_twin.py` class that ties all models together
- **Main:** `main.py` runs full pipeline end-to-end
- **Tests:** pytest for unit testing

## Data Flow (Real-Time Simulation)

1. **Load engine (e.g., engine #42)**
2. **For each cycle in engine's lifetime:**
   - Get 21 sensor readings for this cycle
   - Normalize using saved scaler
   - Pass through classifier → health_stage
   - Pass through anomaly detector → is_anomalous
   - Compute feature importance
   - Update dashboard
   - Step timeline forward
3. **At end of engine's lifetime:**
   - Compare predicted RUL to actual RUL
   - Evaluate accuracy, F1, silhouette, etc.
   - Store results

## Key Design Principles

**Modularity:** Each component (classifier, clusterer, anomaly detector) is independent, testable, swappable.

**Interpretability:** Every prediction has an explanation (top sensors, confidence level).

**Actionability:** Outputs are not abstract scores but concrete recommendations (maintenance times, cost estimates).

**Robustness:** Models handle noise, missing data, class imbalance.

**Real-Time Ready:** Architecture designed so it could ingest live sensor streams (future enhancement).
