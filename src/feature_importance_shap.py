"""
feature_importance_shap.py -- Person 3: Random Forest classifier + SHAP explainability.
Trains on health stages, computes per-sensor SHAP importance, maps to engine areas.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score
import shap
import pickle
import warnings
warnings.filterwarnings('ignore')

SENSOR_COLUMNS = [
    'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30',
    'Nf', 'Nc', 'epr', 'Ps30', 'phi',
    'NRf', 'NRc', 'BPR', 'farB',
    'htBleed', 'Nf_dmd', 'PCNfR_dmd',
    'W31', 'W32'
]

ENGINE_AREAS = {
    'T2': 'Fan/Inlet', 'P2': 'Fan/Inlet', 'Nf': 'Fan/Inlet', 'NRf': 'Fan/Inlet',
    'Nf_dmd': 'Fan/Inlet', 'PCNfR_dmd': 'Fan/Inlet',
    'T24': 'LPC', 'BPR': 'LPC',
    'T30': 'HPC', 'P30': 'HPC', 'Ps30': 'HPC', 'Nc': 'HPC', 'NRc': 'HPC',
    'phi': 'Combustor', 'farB': 'Combustor', 'htBleed': 'Combustor',
    'W31': 'HPT',
    'T50': 'LPT', 'W32': 'LPT', 'P15': 'LPT',
    'epr': 'Engine-Level',
}


def train_rf_with_shap():
    """Train Random Forest on health stages, compute SHAP importance."""
    print(f"\n{'='*80}")
    print("PERSON 3: RANDOM FOREST + SHAP EXPLAINABILITY")
    print(f"{'='*80}")

    # Load FD001 training data
    train_df = pd.read_csv('data/processed/FD001_train_cleaned.csv')

    # Prepare classification data: health_stage (0/1/2)
    X_train = train_df[SENSOR_COLUMNS].values
    y_train = train_df['health_stage'].values

    print(f"Training data prepared: {X_train.shape}")
    print(f"Classes: 0 (Healthy), 1 (Degrading), 2 (Critical)")
    print(f"Class distribution: {np.bincount(y_train.astype(int))}")

    # Train Random Forest
    rf_model = RandomForestClassifier(
        n_estimators=100, random_state=42, n_jobs=-1, max_depth=10
    )
    rf_model.fit(X_train, y_train)

    print(f"  [OK] Random Forest trained!")

    # Save model
    os.makedirs('models', exist_ok=True)
    with open('models/rf_classifier.pkl', 'wb') as f:
        pickle.dump(rf_model, f)

    print(f"  [OK] Model saved: models/rf_classifier.pkl")

    # Compute SHAP values (use a sample to prevent timeout)
    print(f"\n  Computing SHAP values (on 1000 samples)...")
    explainer = shap.TreeExplainer(rf_model)
    np.random.seed(42)
    sample_indices = np.random.choice(len(X_train), size=1000, replace=False)
    X_train_sample = X_train[sample_indices]
    shap_values = explainer.shap_values(X_train_sample)

    # For multi-class, handle either a list of arrays or a 3D array
    if isinstance(shap_values, list):
        shap_values_mean = np.mean([np.abs(sv).mean(axis=0) for sv in shap_values], axis=0)
    else:
        if len(shap_values.shape) == 3:
            # Shape is (samples, features, classes)
            shap_values_mean = np.abs(shap_values).mean(axis=0).mean(axis=1)
        else:
            shap_values_mean = np.abs(shap_values).mean(axis=0)

    # Normalize to percentage
    feature_importance = shap_values_mean / shap_values_mean.sum() * 100
    
    # Ensure it is a 1D array
    feature_importance = feature_importance.flatten()

    # Create feature importance dataframe
    importance_df = pd.DataFrame({
        'Sensor': SENSOR_COLUMNS,
        'Importance': feature_importance,
        'Importance_Percent': feature_importance,
        'Engine_Area': [ENGINE_AREAS.get(s, 'Unknown') for s in SENSOR_COLUMNS]
    }).sort_values('Importance', ascending=False)

    print(f"\n--- Feature Importance Ranking (All 21 Sensors) ---")
    for _, row in importance_df.iterrows():
        print(f"  {row['Sensor']:12} | {row['Importance_Percent']:6.2f}% | {row['Engine_Area']}")

    # Summary by engine area
    print(f"\n--- Importance by Engine Area ---")
    area_importance = importance_df.groupby('Engine_Area')['Importance_Percent'].sum()
    area_importance = area_importance.sort_values(ascending=False)
    for area, imp in area_importance.items():
        print(f"  {area:20} : {imp:6.2f}%")

    # Save feature importance
    os.makedirs('results', exist_ok=True)
    importance_df.to_csv('results/feature_importance.csv', index=False)
    print(f"\n  [OK] Feature importance saved: results/feature_importance.csv")

    # Evaluate on all 4 datasets
    results = {}
    datasets = ['FD001', 'FD002', 'FD003', 'FD004']

    for dataset in datasets:
        test_df = pd.read_csv(f'data/processed/{dataset}_test_cleaned.csv')

        X_test = test_df[SENSOR_COLUMNS].values
        y_test = test_df['health_stage'].values

        y_pred = rf_model.predict(X_test)

        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        results[dataset] = {
            'F1': float(f1),
            'samples': int(len(X_test))
        }

        print(f"\n  {dataset}: F1={f1:.4f}")

    # Save metrics
    os.makedirs('results/metrics', exist_ok=True)
    with open('results/metrics/shap_metrics.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n  [OK] Metrics saved: results/metrics/shap_metrics.json")
    print(f"\n{'='*80}")
    print("[OK] PERSON 3 COMPLETE: Random Forest + SHAP")
    print(f"{'='*80}")

    return results, importance_df


if __name__ == '__main__':
    train_rf_with_shap()
