"""
anomaly_detector_iforest.py -- Person 2: Isolation Forest anomaly detection.
Trains on healthy baseline (first 10 cycles of FD001), evaluates on all 4 datasets.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score
import pickle

SENSOR_COLUMNS = [
    'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30',
    'Nf', 'Nc', 'epr', 'Ps30', 'phi',
    'NRf', 'NRc', 'BPR', 'farB',
    'htBleed', 'Nf_dmd', 'PCNfR_dmd',
    'W31', 'W32'
]


def train_isolation_forest():
    """Train Isolation Forest on healthy baseline, evaluate on all datasets."""
    print(f"\n{'='*80}")
    print("PERSON 2: ISOLATION FOREST ANOMALY DETECTION")
    print(f"{'='*80}")

    # Load FD001 training data
    train_df = pd.read_csv('data/processed/FD001_train_cleaned.csv')

    # Baseline: first 10 cycles per engine (healthy state)
    baseline_df = train_df[train_df['cycle'] <= 10]
    X_baseline = baseline_df[SENSOR_COLUMNS].values

    print(f"Baseline samples (healthy, cycles 1-10): {len(X_baseline)}")

    # Train Isolation Forest
    iso_forest = IsolationForest(contamination=0.1, random_state=42, n_jobs=-1)
    iso_forest.fit(X_baseline)

    print(f"  [OK] Isolation Forest trained!")

    # Save model
    os.makedirs('models', exist_ok=True)
    with open('models/iforest_anomaly.pkl', 'wb') as f:
        pickle.dump(iso_forest, f)

    print(f"  [OK] Model saved: models/iforest_anomaly.pkl")

    # Evaluate on all 4 datasets
    results = {}
    datasets = ['FD001', 'FD002', 'FD003', 'FD004']

    for dataset in datasets:
        test_df = pd.read_csv(f'data/processed/{dataset}_test_cleaned.csv')

        # Label: critical health stage (RUL <= 30) = anomaly
        X_test = test_df[SENSOR_COLUMNS].values
        y_test_anomaly = (test_df['RUL'] <= 30).astype(int)  # 1 = anomaly/critical

        # Predict
        y_pred_raw = iso_forest.predict(X_test)  # -1 = anomaly, 1 = normal
        y_pred_anomaly = (y_pred_raw == -1).astype(int)  # Convert to 0/1

        # Metrics
        precision = precision_score(y_test_anomaly, y_pred_anomaly, zero_division=0)
        recall = recall_score(y_test_anomaly, y_pred_anomaly, zero_division=0)
        f1 = f1_score(y_test_anomaly, y_pred_anomaly, zero_division=0)

        results[dataset] = {
            'Precision': float(precision),
            'Recall': float(recall),
            'F1': float(f1),
            'samples': int(len(X_test))
        }

        print(f"\n  {dataset}: Precision={precision:.4f}, Recall={recall:.4f}, F1={f1:.4f}")

    # Save metrics
    os.makedirs('results/metrics', exist_ok=True)
    with open('results/metrics/iforest_metrics.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n  [OK] Metrics saved: results/metrics/iforest_metrics.json")
    print(f"\n{'='*80}")
    print("[OK] PERSON 2 COMPLETE: Isolation Forest Anomaly Detection")
    print(f"{'='*80}")

    return results


if __name__ == '__main__':
    train_isolation_forest()
