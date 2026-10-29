# C-MAPSS Digital Twin: DWM Mini-Project Submission Checklist

**Course:** Data Warehousing and Mining (DWM), Semester 5  
**Institution:** Vidyalankar Institute of Technology (VIT), Mumbai  
**Team Members:**
1. Rahul Bansode
2. Shubham Vaidya
3. Gaurav Yadav
4. Mufeed Rajapkar  
**Repository:** [https://github.com/rahulcodes-java/C-MAPSS-Digital-Twin](https://github.com/rahulcodes-java/C-MAPSS-Digital-Twin)

---

## 1. Automated Deliverables Created & Verified

| Deliverable | File Path | Status | Verification Details |
|---|---|---|---|
| **Quantitative Ground Truth** | `docs/submission/FACTS.md` | COMPLETE | Sourced from `results/`, `src/`, and test run logs. Lists every hyperparameter, dataset row count, and metric. |
| **High-Res Figures** | `docs/submission/figures/` | COMPLETE | 9 high-res figures generated directly from raw metrics (`shap_importance_bar.png`, `shap_by_engine_section.png`, `model_comparison_bar.png`, `rul_trajectory_consistency.png`, `pipeline_diagram.png`, 4 UI screenshots). |
| **2-Page Project Report (DOCX)** | `docs/submission/Project_Report_2page.docx` | COMPLETE | Formatted with title, authors, abstract, methodology, results table, SHAP bar chart, future work, and GitHub URL. |
| **2-Page Project Report (PDF)** | `docs/submission/Project_Report_2page.pdf` | COMPLETE | **Strictly 2 pages** verified via PyPDF (`len(pages) == 2`). |
| **Research Paper (DOCX)** | `docs/submission/Research_Paper.docx` | COMPLETE | IEEE conference style, 2-column body, full mathematical formulation, 4 detailed tables, and 7 figures. |
| **Research Paper (PDF)** | `docs/submission/Research_Paper.pdf` | COMPLETE | **Exactly 5 pages** (satisfying 5–7 page requirement) verified via PyPDF (`len(pages) == 5`). |
| **Poster Presentation (PPTX)** | `docs/submission/Poster_A1.pptx` | COMPLETE | A1 portrait (594 × 841 mm), dark navy engineering aesthetic, 3-column layout, body $\ge 28\text{ pt}$, editable vector shapes. |
| **Poster Presentation (PDF)** | `docs/submission/Poster_A1.pdf` | COMPLETE | Exact A1 vector canvas (1683.78 × 2383.94 pt) generated via ReportLab. |
| **Poster Presentation (PNG)** | `docs/submission/Poster_A1.png` | COMPLETE | High-resolution raster render ($4717 \times 6662\text{ px}$ at 200 DPI), crystal-clear typography and non-overlapping panels. |
| **Submission Checklist** | `docs/submission/CHECKLIST.md` | COMPLETE | Complete tracking of completed items and required manual actions. |

---

## 2. Mandatory Manual Action Items for the Team

Before final submission to the portal or presenting to the viva committee, the team must complete the following manual steps:

- [ ] **Author Names & Roll Numbers:**
  - Verify that student roll numbers, division, and official email addresses match college submission requirements across `Project_Report_2page.docx`, `Research_Paper.docx`, and `Poster_A1.pptx`.
  - The documents already incorporate: **Rahul Bansode, Shubham Vaidya, Gaurav Yadav, Mufeed Rajapkar**.

- [ ] **QR Code Replacement:**
  - The documents currently contain a text placeholder `[ QR CODE BOX ]` linking to `https://github.com/rahulcodes-java/C-MAPSS-Digital-Twin`.
  - Generate a square QR code image pointing to the repository and paste it into the placeholder frames in `Poster_A1.pptx` and `Project_Report_2page.docx` if physical scanning is required during the viva.

- [ ] **Verify Against FACTS.md:**
  - Check that no stray numbers were altered. All metrics cited in reports and presentation slides must match `docs/submission/FACTS.md` exactly:
    - FD001 LSTM F1: **0.9920** (MAE: 23.59, RMSE: 34.05)
    - FD001 Random Forest + TreeSHAP F1: **0.8353**
    - FD001 Isolation Forest F1: **0.2413** (Precision: 0.1372, Recall: 0.9970)
    - FD001 Comparative Benchmark Average: **0.6895**
    - HPC Subassembly SHAP Attribution: **49.21%** (`Ps30`: 14.19%, `Nc`: 13.07%, `P30`: 9.81%, `NRc`: 9.36%, `T30`: 2.80%)
    - Diagnostic Lead Time: Sequence LSTM flags wear at **Cycle 100**, snapshot RF flags wear at **Cycle 144** (**44-cycle lead time**).

- [ ] **Plagiarism & AI-Detection Checks:**
  - Run `Research_Paper.docx` and `Project_Report_2page.docx` through the institutional plagiarism detection portal (e.g., Turnitin / Urkund) and AI detection tool.
  - Ensure the similarity index is strictly below your department's threshold (typically $< 15\%$).
  - *Note: External online detection services cannot be invoked locally inside the IDE; this must be executed manually.*

- [ ] **Unresolved `[TODO]` Flags:**
  - **NASA PHM08 Score:** In accordance with the prompt's strict honesty rules, the specific asymmetric exponential NASA scoring metric ($s = \sum e^{-d/13}-1$ or $e^{d/10}-1$) was not present in the pre-computed evaluation files and is logged as `[TODO: run and fill]` in `FACTS.md` if an examiner requests this specific metric.
  - All other metrics are 100% computed, verified, and logged from real project results.

---

## 3. Viva Defense Quick Reference & Key Talking Points

When presenting before the examiner:

1. **Why Classification instead of Regression as Primary?**
   - *Answer:* Continuous RUL regression estimates are noisy in early flight cycles. Civil airline flight operations require discrete, deterministic dispatch queues: **Stage 0 (Line Cleared)**, **Stage 1 (Borescope Inspection Due)**, and **Stage 2 (AOG Unscheduled Grounding)**.
2. **Why Are All 21 Telemetry Channels Retained?**
   - *Answer:* Standard pipelines often drop sensors with zero variance in FD001 (`P2`, `T2`, `epr`, `farB`, `dmd`). However, under multi-regime datasets (FD002 and FD004), these sensors become actively diagnostic. Dropping them causes schema incompatibility across flight conditions.
3. **How Does TreeSHAP Validate Physical Engine Thermodynamics?**
   - *Answer:* NASA C-MAPSS FD001 simulates High-Pressure Compressor (HPC) wear. TreeSHAP allocates **49.21%** of decision weight directly to HPC sensors (`Ps30`, `Nc`, `P30`, `NRc`, `T30`). Downstream thermal effects are captured by Low-Pressure Turbine EGT (`T50`, 11.57%). This proves the model learns genuine thermodynamic degradation patterns rather than statistical noise.
4. **What Is the Key Empirical Discovery Regarding Lead Time?**
   - *Answer:* Temporal sequence modeling (LSTM) integrates cumulative micro-degradations over a 50-cycle window and flags Degrading health (Stage 1) at **Cycle 100** (Pred RUL = 95.6 vs True = 92.0). The instantaneous Random Forest snapshot classifier flags wear only at **Cycle 144**, giving the sequence model a **44-cycle early diagnostic lead time**.
5. **Why Does the Isolation Forest Have a Low F1 Score (0.2413)?**
   - *Answer:* Isolation Forest was trained strictly on cycles 1–10 (healthy baseline). Because wear develops gradually, the model triggers anomalies only when the engine enters terminal deterioration (Cycle 170 on Engine 1, $\text{RUL} \le 30$). Thus, Isolation Forest functions as a **terminal safety barrier** rather than an early warning prognostic indicator.
6. **What Are the Major Scientific Limitations?**
   - *Answer:* 
     1. Synthetic NPSS simulation data (lacks real-world atmospheric turbulence and transducer drift).
     2. Models trained on single-condition FD001 experience cross-condition collapse on FD002/FD004 without flight-regime normalization.
     3. The dashboard demo executes playback on training engines because test sequences are truncated prior to failure.
     4. The ensemble is an arithmetic comparative average across 3 models, not a voting classifier.
