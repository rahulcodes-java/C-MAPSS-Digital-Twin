"""
sensor_variance.py -- A2: Compute per-sensor nunique, std, CV across FD001..FD004 raw train sets.
Definition: Flat := CV < 1e-4.
Output: results/metrics_v2/sensor_variance.csv and console table.
"""

import os
import pandas as pd
import numpy as np

SENSOR_COLUMNS = [
    'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30',
    'Nf', 'Nc', 'epr', 'Ps30', 'phi',
    'NRf', 'NRc', 'BPR', 'farB',
    'htBleed', 'Nf_dmd', 'PCNfR_dmd',
    'W31', 'W32'
]

ALL_COLUMNS = ['engine_id', 'cycle', 'op_1', 'op_2', 'op_3'] + SENSOR_COLUMNS


def compute_variance_table():
    os.makedirs('results/metrics_v2', exist_ok=True)
    datasets = ['FD001', 'FD002', 'FD003', 'FD004']
    records = []

    flat_summary = {}

    for ds in datasets:
        raw_path = f'data/raw/train_{ds}.txt'
        df = pd.read_csv(raw_path, sep=r'\s+', header=None, engine='python').iloc[:, :26]
        df.columns = ALL_COLUMNS

        flat_sensors = []
        for s in SENSOR_COLUMNS:
            vals = df[s].values
            nunique = int(len(np.unique(vals)))
            std = float(np.std(vals, ddof=1))
            mean = float(np.mean(vals))
            cv = float(std / abs(mean)) if abs(mean) > 1e-12 else (0.0 if std == 0.0 else float('inf'))
            is_flat = bool(cv < 1e-4)
            if is_flat:
                flat_sensors.append(s)

            records.append({
                'dataset': ds,
                'sensor': s,
                'nunique': nunique,
                'mean': round(mean, 6),
                'std': round(std, 6),
                'cv': round(cv, 8),
                'is_flat': is_flat
            })

        flat_summary[ds] = flat_sensors

    res_df = pd.DataFrame(records)
    res_df.to_csv('results/metrics_v2/sensor_variance.csv', index=False)
    print("Saved results/metrics_v2/sensor_variance.csv")

    print("\n" + "=" * 90)
    print("SENSOR VARIANCE & FLAT SENSOR SUMMARY (Threshold: CV < 1e-4)")
    print("=" * 90)
    for ds in datasets:
        print(f"Dataset {ds}: Flat sensors ({len(flat_summary[ds])}/21): {flat_summary[ds]}")

    # Build wide pivot table for markdown presentation
    piv = res_df.pivot(index='sensor', columns='dataset', values=['std', 'cv', 'is_flat'])
    print("\nWide summary table (std and CV):")
    for s in SENSOR_COLUMNS:
        line = f"{s:10} | "
        for ds in datasets:
            std_val = res_df[(res_df['dataset'] == ds) & (res_df['sensor'] == s)]['std'].values[0]
            cv_val = res_df[(res_df['dataset'] == ds) & (res_df['sensor'] == s)]['cv'].values[0]
            flat = res_df[(res_df['dataset'] == ds) & (res_df['sensor'] == s)]['is_flat'].values[0]
            flag = "[FLAT]" if flat else "      "
            line += f"{ds}: std={std_val:8.4f}, CV={cv_val:.2e} {flag} | "
        print(line)

    return res_df, flat_summary


if __name__ == '__main__':
    compute_variance_table()
