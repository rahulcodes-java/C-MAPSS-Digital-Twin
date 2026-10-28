"""
shap_analysis.py -- A5: TreeExplainer on 5 random 1000-row subsamples + permutation importance.
Loads saved models/rf_classifier.pkl. No retraining.
Computes per-sensor mean +/- SD, per-engine-area totals +/- SD, and HPC share comparison.
Saves to results/metrics_v2/shap_and_permutation.json and console summary.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
import shap
from sklearn.inspection import permutation_importance

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


def run_shap_and_permutation():
    os.makedirs('results/metrics_v2', exist_ok=True)

    print("Loading saved Random Forest model...")
    with open('models/rf_classifier.pkl', 'rb') as f:
        rf = pickle.load(f)

    # Load FD001 train and test
    train_df = pd.read_csv('data/processed/FD001_train_cleaned.csv')
    test_df = pd.read_csv('data/processed/FD001_test_cleaned.csv')

    X_train = train_df[SENSOR_COLUMNS].values
    y_train = train_df['health_stage'].values

    X_test = test_df[SENSOR_COLUMNS].values
    y_test = test_df['health_stage'].values

    # -------------------------------------------------------------
    # 1. SHAP TreeExplainer over 5 random 1,000-row subsamples
    # -------------------------------------------------------------
    print("\nRunning SHAP TreeExplainer over 5 seeds...")
    explainer = shap.TreeExplainer(rf)
    seeds = [42, 101, 202, 303, 404]

    shap_runs = []
    shap_area_runs = []

    for s_idx, seed in enumerate(seeds):
        np.random.seed(seed)
        idx = np.random.choice(len(X_train), size=1000, replace=False)
        X_sub = X_train[idx]

        sv = explainer.shap_values(X_sub)
        if isinstance(sv, list):
            sv_mean = np.mean([np.abs(c_sv).mean(axis=0) for c_sv in sv], axis=0)
        elif len(sv.shape) == 3:
            sv_mean = np.abs(sv).mean(axis=0).mean(axis=1)
        else:
            sv_mean = np.abs(sv).mean(axis=0)

        # Normalize to 100%
        pct = (sv_mean / np.sum(sv_mean)) * 100.0
        shap_runs.append(pct)

        # Sum by engine area
        area_sums = {}
        for sensor, p_val in zip(SENSOR_COLUMNS, pct):
            area = ENGINE_AREAS.get(sensor, 'Unknown')
            area_sums[area] = area_sums.get(area, 0.0) + p_val
        shap_area_runs.append(area_sums)

    shap_matrix = np.array(shap_runs)  # (5, 21)
    sensor_shap_mean = np.mean(shap_matrix, axis=0)
    sensor_shap_sd = np.std(shap_matrix, axis=0, ddof=1)

    all_areas = sorted(list(set(ENGINE_AREAS.values())))
    area_shap_matrix = np.array([[run[a] for a in all_areas] for run in shap_area_runs])  # (5, n_areas)
    area_shap_mean = np.mean(area_shap_matrix, axis=0)
    area_shap_sd = np.std(area_shap_matrix, axis=0, ddof=1)

    sensor_shap_records = []
    for s_name, m, s in zip(SENSOR_COLUMNS, sensor_shap_mean, sensor_shap_sd):
        sensor_shap_records.append({
            'sensor': s_name,
            'area': ENGINE_AREAS.get(s_name, 'Unknown'),
            'mean_pct': round(float(m), 4),
            'sd_pct': round(float(s), 4)
        })

    area_shap_records = []
    for a_name, m, s in zip(all_areas, area_shap_mean, area_shap_sd):
        area_shap_records.append({
            'area': a_name,
            'mean_pct': round(float(m), 4),
            'sd_pct': round(float(s), 4)
        })

    # -------------------------------------------------------------
    # 2. Permutation Importance on FD001 test (5 repeats)
    # -------------------------------------------------------------
    print("\nRunning sklearn permutation_importance on FD001 test...")
    perm_res = permutation_importance(
        rf, X_test, y_test,
        n_repeats=5,
        random_state=42,
        scoring='f1_macro',
        n_jobs=-1
    )

    perm_raw_means = np.maximum(0, perm_res.importances_mean)
    perm_total = np.sum(perm_raw_means)
    if perm_total > 0:
        perm_pct_mean = (perm_raw_means / perm_total) * 100.0
        # Scale SD proportionally
        perm_pct_sd = (perm_res.importances_std / perm_total) * 100.0
    else:
        perm_pct_mean = np.zeros(len(SENSOR_COLUMNS))
        perm_pct_sd = np.zeros(len(SENSOR_COLUMNS))

    # Permutation importance by area
    perm_area_sums = {a: 0.0 for a in all_areas}
    for s_name, p_val in zip(SENSOR_COLUMNS, perm_pct_mean):
        area = ENGINE_AREAS.get(s_name, 'Unknown')
        perm_area_sums[area] += p_val

    sensor_perm_records = []
    for s_name, m, s in zip(SENSOR_COLUMNS, perm_pct_mean, perm_pct_sd):
        sensor_perm_records.append({
            'sensor': s_name,
            'area': ENGINE_AREAS.get(s_name, 'Unknown'),
            'mean_pct': round(float(m), 4),
            'sd_pct': round(float(s), 4)
        })

    # HPC Share Comparison
    hpc_shap_mean = float(dict(zip(all_areas, area_shap_mean))['HPC'])
    hpc_shap_sd = float(dict(zip(all_areas, area_shap_sd))['HPC'])
    hpc_perm_mean = float(perm_area_sums['HPC'])

    print("\n" + "=" * 80)
    print("SHAP & PERMUTATION IMPORTANCE SUMMARY")
    print("=" * 80)
    print(f"HPC Share from SHAP: {hpc_shap_mean:.2f}% +/- {hpc_shap_sd:.2f}%")
    print(f"HPC Share from Permutation Importance: {hpc_perm_mean:.2f}%")

    output_data = {
        'shap_sensor_5runs': sensor_shap_records,
        'shap_area_5runs': area_shap_records,
        'permutation_sensor_test': sensor_perm_records,
        'permutation_area_test': [{'area': a, 'mean_pct': round(float(perm_area_sums[a]), 4)} for a in all_areas],
        'hpc_comparison': {
            'shap_hpc_mean_pct': round(hpc_shap_mean, 2),
            'shap_hpc_sd_pct': round(hpc_shap_sd, 2),
            'permutation_hpc_pct': round(hpc_perm_mean, 2)
        }
    }

    with open('results/metrics_v2/shap_and_permutation.json', 'w') as f:
        json.dump(output_data, f, indent=2)
    print("Saved results/metrics_v2/shap_and_permutation.json")

    return output_data


if __name__ == '__main__':
    run_shap_and_permutation()
