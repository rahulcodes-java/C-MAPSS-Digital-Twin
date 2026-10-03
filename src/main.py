"""
main.py — Digital Twin Orchestrator
Runs the full pipeline end-to-end:
  load → preprocess → classify → cluster → anomaly detect → RUL predict → schedule
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from data_loader import process_data
from preprocessing import load_cleaned_data, preprocess
from classification import train_and_evaluate
from clustering import run_clustering
from anomaly_detection import run_anomaly_detection
from rul_predictor import run_rul_prediction
from scheduler import run_scheduler
from digital_twin import DigitalTwin

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'results')

def run_pipeline():
    print("=" * 60)
    print("  AI-Powered Digital Twin — Jet Engine Predictive Maintenance")
    print("  NASA C-MAPSS FD001 Dataset")
    print("=" * 60)

    # Step 1: Data Pipeline
    print("\n[1/6] Running Data Pipeline...")
    process_data(
        train_path=os.path.join(DATA_DIR, 'raw', 'train_FD001.txt'),
        test_path=os.path.join(DATA_DIR, 'raw', 'test_FD001.txt'),
        rul_path=os.path.join(DATA_DIR, 'raw', 'RUL_FD001.txt'),
        output_path=os.path.join(DATA_DIR, 'processed', 'FD001_cleaned.csv')
    )

    # Step 2: Classification
    print("\n[2/6] Training Health Stage Classifier...")
    train_and_evaluate()

    # Step 3: Clustering
    print("\n[3/6] Running Failure Mode Clustering...")
    run_clustering()

    # Step 4: Anomaly Detection
    print("\n[4/6] Training Anomaly Detector...")
    run_anomaly_detection()

    # Step 5: RUL Prediction
    print("\n[5/6] Fitting RUL Predictor...")
    run_rul_prediction()

    # Step 6: Scheduling
    print("\n[6/6] Running Cost-Aware Scheduler...")
    stats = run_scheduler()

    # Summarize
    print("\n" + "=" * 60)
    print("  DIGITAL TWIN PIPELINE COMPLETE")
    print("=" * 60)
    print(f"  Cost Savings vs baseline: {stats['savings_pct']:.1f}%")
    print(f"  False Alarms: {stats['false_alarms']} | Missed Failures: {stats['missed_failures']}")
    print(f"  Models saved to /models/")
    print(f"  Results saved to /results/")
    print("=" * 60)

    # Test the Digital Twin on a sample row
    print("\n[DEMO] Testing Digital Twin predict()...")
    import pandas as pd
    df = load_cleaned_data(os.path.join(DATA_DIR, 'processed', 'FD001_cleaned.csv'))
    _, _, X_test, _, _, _ = preprocess(df)
    sample = X_test.head(1)
    twin = DigitalTwin(models_dir=os.path.join(os.path.dirname(__file__), '..', 'models'))
    result = twin.predict(sample)
    stage_map = {0: 'HEALTHY', 1: 'DEGRADING', 2: 'CRITICAL'}
    print(f"  Health Stage: {stage_map.get(result['health_stage'], '?')}")
    print(f"  Anomalous:    {result['is_anomalous']}")
    print(f"  Confidence:   {result['confidence']:.2%}")
    print(f"  Top Sensors:  {result['top_sensors']}")
    print("\nDigital Twin ready.")

if __name__ == "__main__":
    run_pipeline()
