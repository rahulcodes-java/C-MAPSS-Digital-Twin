"""
run_all_models_v2.py -- Pipeline runner for all 5 steps.
Executes: Data Loader -> LSTM -> IForest -> RF+SHAP -> Ensemble Comparison
"""

import subprocess
import sys
import os


def run_pipeline():
    """Execute all 5 steps of the ML pipeline."""

    print("\n" + "=" * 80)
    print("C-MAPSS DIGITAL TWIN: COMPLETE PIPELINE V2")
    print("Data Loader + All 4 Models (LSTM, IForest, RF+SHAP, Ensemble)")
    print("=" * 80)

    steps = [
        ("data_loader_v2.py", "Data Loader (Keep All 21 Sensors)"),
        ("rul_predictor_lstm.py", "Person 1: LSTM RUL Predictor"),
        ("anomaly_detector_iforest.py", "Person 2: Isolation Forest Anomaly Detection"),
        ("feature_importance_shap.py", "Person 3: Random Forest + SHAP Explainability"),
        ("ensemble_comparator.py", "Person 4: Ensemble Comparison & Defense Summary"),
    ]

    failed = []

    for script, description in steps:
        print(f"\n{'='*80}")
        print(f"[STEP] {description}")
        print(f"{'='*80}")

        try:
            result = subprocess.run(
                [sys.executable, f"src/{script}"],
                cwd=os.getcwd(),
                capture_output=False,
                timeout=600
            )

            if result.returncode == 0:
                print(f"  [OK] COMPLETE: {description}")
            else:
                print(f"  [FAIL] FAILED: {description} (exit code {result.returncode})")
                failed.append(description)

        except subprocess.TimeoutExpired:
            print(f"  [FAIL] TIMEOUT: {description} (exceeded 10 minutes)")
            failed.append(description)
        except Exception as e:
            print(f"  [FAIL] ERROR: {description} ({str(e)})")
            failed.append(description)

    print(f"\n{'='*80}")
    if not failed:
        print("[OK] ALL MODELS COMPLETE")
        print(f"{'='*80}")
        print("\nCompleted steps:")
        for script, description in steps:
            print(f"  [OK] {description}")

        print(f"\nOutputs:")
        print(f"  data/processed/    <-- Cleaned datasets (all 21 sensors)")
        print(f"  models/            <-- All trained models")
        print(f"  results/metrics/   <-- All metrics JSON files")
        print(f"  results/model_comparison.csv  <-- Comparative table")
        print(f"  results/defense_summary.txt   <-- Exam defense notes")

        print(f"\n{'='*80}")
        print("NEXT STEPS:")
        print(f"{'='*80}")
        print(f"  1. Review outputs:")
        print(f"     type results\\model_comparison.csv")
        print(f"     type results\\defense_summary.txt")
        print(f"\n  2. Git commit:")
        print(f"     git add -A")
        print(f"     git commit -m \"feat: train all 4 models with 21-sensor dataset\"")
        print(f"     git push origin v2-development")
        print(f"\n  3. Request Stage 2: Dashboard backend + frontend")

    else:
        print(f"[FAIL] {len(failed)} step(s) failed:")
        for desc in failed:
            print(f"  [FAIL] {desc}")
        print(f"\nFix errors above and rerun: python src/run_all_models_v2.py")


if __name__ == '__main__':
    run_pipeline()
