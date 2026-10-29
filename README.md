# C-MAPSS Digital Twin: Interpretable Turbofan Degradation & Health Monitoring

> **Data Warehousing & Mining (DWM) Coursework Mini-Project · NASA C-MAPSS Benchmark · Academic Year 2026**

A machine learning framework and interactive digital twin for commercial aircraft turbofan degradation monitoring. The system structures operational diagnostics primarily as a 3-stage degradation classification problem (Healthy, Degrading, Critical) using a Random Forest classifier interpreted via TreeSHAP. Snapshot classification is complemented by sequence-based Long Short-Term Memory (LSTM) Remaining Useful Life (RUL) regression and an Isolation Forest detector for unsupervised anomaly tracking across all 21 telemetry channels of the NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) benchmark.

---

## Key Verified Results (FD001 Benchmark)

Every metric reported below is derived strictly from verified evaluation scripts (`scripts/eval_v2.py`, `scripts/lead_time.py`, `scripts/shap_analysis.py`) without model retraining. See [`docs/submission/FACTS_v2.md`](docs/submission/FACTS_v2.md) for the single source of truth.

| Evaluation Task | Model Architecture | Metric / Measurement | Verified Value |
|---|---|---|---|
| **Health Classification (Primary)** | Random Forest (Single snapshot) | 3-Stage Macro-F1 | **0.7303** |
| **Health Classification (Sequence)** | LSTM-Derived Stage (50-cycle window) | 3-Stage Macro-F1 | **0.8197** |
| **Critical Stage Detection ($R \le 30$)** | LSTM Sequence Regression | Critical Class Binary F1 | **0.8158** (Recall 0.8404) |
| **Critical Stage Detection ($R \le 30$)** | Random Forest Snapshot | Critical Class Binary F1 | **0.6938** (Recall 0.5904) |
| **RUL Regression (Capped 125)** | LSTM Recurrent Network | Capped Test RMSE / NASA Score | **15.07 cycles** / **493.1** |
| **RUL Regression (Uncapped)** | LSTM Recurrent Network | Uncapped Test RMSE | **15.68 cycles** |
| **Degradation Lead Time** | Paired Advantage (RF Delay - LSTM Delay) | Median Lead-Time Advantage | **+21.0 cycles** (LSTM earlier in 80/100 engines) |
| **Thermodynamic Explainability** | TreeSHAP (5 random seeds) | High-Pressure Compressor (HPC) Share | **49.18% ± 0.12%** |
| **Attribution Cross-Check** | Permutation Feature Importance | High-Pressure Compressor (HPC) Share | **62.22%** |

---

## Architecture & Data Flow

```
[21-Sensor Telemetry Stream]
             │
             ├──► Min-Max Scaler (Fitted strictly on train sets)
             │        │
             │        ├──► Single-Cycle Vector (21)
             │        │         ├──► Random Forest (100 trees, depth 10) ──► 3-Stage Classification (0, 1, 2)
             │        │         └──► TreeSHAP Attribution ──────────────────► HPC vs LPT Subassembly %
             │        │
             │        ├──► 50-Cycle Sliding Window (50, 21)
             │        │         └──► 2-Layer LSTM (128 / 64 units) ────────► Continuous RUL Countdown
             │        │
             │        └──► Healthy Baseline Cycles (1 to 10)
             │                  └──► Isolation Forest (100 trees) ──────────► Anomaly Score s(x, n)
             │
             └──► REST API (/api/predict, /api/engine, /api/fleet) ────────► React Digital Twin Dashboard
```

---

## Quick Start Guide

### Prerequisites
- Python 3.10+ (tested on Windows 64-bit)
- Node.js 18+ and npm (for dashboard frontend)
- Git

### 1. Environment Setup
Clone the repository and install the Python dependencies:
```bash
git clone https://github.com/rahul-bansode/C-MAPSS-Digital-Twin.git
cd C-MAPSS-Digital-Twin

python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
```

### 2. NASA C-MAPSS Raw Dataset
The repository includes processed training and test telemetry in `data/raw/` and `data/processed/`.
Raw C-MAPSS data files (`train_FD001.txt` through `train_FD004.txt`, `test_FD001.txt` through `test_FD004.txt`, `RUL_FD001.txt` through `RUL_FD004.txt`) originate from the NASA Prognostics Center of Excellence (PCoE) Turbofan Engine Degradation Simulation Dataset:
- NASA PCoE Dataset Archive: [https://data.nasa.gov/](https://data.nasa.gov/)
- Place the raw text files in `data/raw/` if downloading from scratch.

### 3. Launching the System

#### Option A: One-Click Startup (Windows)
Run the automated batch runner:
```powershell
.\run_project.ps1
```
or double-click `run_project.bat`.

#### Option B: Manual Startup

**Terminal 1 — Flask REST API (Port 5000):**
```bash
python src/dashboard_api.py
```
*API endpoints will be live at `http://127.0.0.1:5000/api`.*

**Terminal 2 — React / Vite Dashboard (Port 5173):**
```bash
cd dashboard
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
*Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.*

---

## Submission Artifacts

All formal DWM submission documents are generated deterministically in [`docs/submission/`](docs/submission/):

| Deliverable | File Path | Format / Specification |
|---|---|---|
| **Project Report** | `docs/submission/Project_Report_2page.pdf` | Exactly 2 pages, professional layout |
| **Project Report (Word)** | `docs/submission/Project_Report_2page.docx` | Editable document |
| **Research Paper (PDF)** | `docs/submission/Research_Paper.pdf` | 5 pages, two-column IEEE format |
| **Research Paper (Word)** | `docs/submission/Research_Paper.docx` | Editable document |
| **LaTeX Source** | `docs/submission/paper.tex` | IEEEtran conference format for Overleaf |
| **Research Poster** | `docs/submission/Poster_A1.pptx` | A1 portrait (594x841 mm), 3 columns, >=60mm QR code |
| **Verification Suite** | `scripts/verify_docs.py` | Automated audit of all numbers, words, and pages |
| **Verified Facts** | `docs/submission/FACTS_v2.md` | Single source of truth for all quantitative claims |
| **Changes Log** | `docs/submission/CHANGES.md` | Reconciled discrepancies and audit trails |
| **Code Audit** | `docs/submission/CODE_AUDIT.md` | Verification of codebase line-by-line |

---

## Verifying All Deliverables

Run the automated verification suite to validate all generated documents against `FACTS_v2.md` and submission constraints:
```bash
python scripts/verify_docs.py
```

---

## License & Attribution
Academic evaluation use only. Developed for the Data Warehousing and Mining (DWM) coursework mini-project, Sem 5, Vidyalankar Institute of Technology (VIT), Mumbai.
