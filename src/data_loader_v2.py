"""
data_loader_v2.py -- Load C-MAPSS datasets, keep ALL 21 sensors.
Ma'am's feedback: Flat sensors in FD001 but active in FD002-004 = diagnostic info.
Let models (SHAP, IF, LSTM) decide importance, not preprocessing.
"""

import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import json
import pickle

# All 21 sensor columns in C-MAPSS column order (cols 5-25)
SENSOR_COLUMNS = [
    'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30',
    'Nf', 'Nc', 'epr', 'Ps30', 'phi',
    'NRf', 'NRc', 'BPR', 'farB',
    'htBleed', 'Nf_dmd', 'PCNfR_dmd',
    'W31', 'W32'
]

ALL_COLUMNS = ['engine_id', 'cycle', 'op_1', 'op_2', 'op_3'] + SENSOR_COLUMNS


def load_and_clean_dataset(dataset_name):
    """Load raw data, add RUL, compute health stages, keep ALL 21 sensors."""
    print(f"\n{'='*80}")
    print(f"Loading {dataset_name}...")
    print(f"{'='*80}")

    # Load raw files (actual C-MAPSS naming: train_FD001.txt, test_FD001.txt, RUL_FD001.txt)
    train_file = f'data/raw/train_{dataset_name}.txt'
    test_file = f'data/raw/test_{dataset_name}.txt'
    rul_file = f'data/raw/RUL_{dataset_name}.txt'

    # Read with whitespace-separated format (gives 26 clean columns with \s+)
    train_df = pd.read_csv(train_file, sep=r'\s+', header=None, engine='python')
    test_df = pd.read_csv(test_file, sep=r'\s+', header=None, engine='python')

    # Trim to 26 columns (some files have trailing NaN columns)
    train_df = train_df.iloc[:, :26]
    test_df = test_df.iloc[:, :26]

    # Assign column names: engine_id, cycle, 3 op settings, 21 sensors = 26
    train_df.columns = ALL_COLUMNS
    test_df.columns = ALL_COLUMNS

    # Load RUL values
    rul_df = pd.read_csv(rul_file, sep=r'\s+', header=None, engine='python')
    rul_df.columns = ['RUL']

    # Compute RUL for train set (cycles remaining until failure)
    train_rul = []
    for engine in sorted(train_df['engine_id'].unique()):
        engine_cycles = train_df[train_df['engine_id'] == engine]['cycle'].max()
        rul_vals = list(range(engine_cycles - 1, -1, -1))  # max-1 down to 0
        train_rul.extend(rul_vals)

    train_df['RUL'] = train_rul

    # Assign RUL for test set (ground truth gives RUL at LAST cycle)
    test_rul = []
    for i, engine in enumerate(sorted(test_df['engine_id'].unique())):
        engine_test = test_df[test_df['engine_id'] == engine]
        test_cycles = len(engine_test)
        rul_at_last = rul_df.iloc[i, 0]
        # First cycle RUL = rul_at_last + test_cycles - 1, last cycle RUL = rul_at_last
        rul_vals = list(range(rul_at_last + test_cycles - 1, rul_at_last - 1, -1))
        test_rul.extend(rul_vals[:test_cycles])

    test_df['RUL'] = test_rul[:len(test_df)]

    # Compute health stages
    def compute_health_stage(rul):
        if rul > 100:
            return 0  # Healthy
        elif rul > 30:
            return 1  # Degrading
        else:
            return 2  # Critical

    train_df['health_stage'] = train_df['RUL'].apply(compute_health_stage)
    test_df['health_stage'] = test_df['RUL'].apply(compute_health_stage)

    print(f"{dataset_name} Train shape: {train_df.shape}")
    print(f"{dataset_name} Test shape: {test_df.shape}")
    print(f"\nHealth Stage Distribution (Train):")
    print(train_df['health_stage'].value_counts().sort_index())
    print(f"\nHealth Stage Distribution (Test):")
    print(test_df['health_stage'].value_counts().sort_index())

    # Sensor consistency analysis
    print(f"\n--- Sensor Variance Analysis ---")
    flat_sensors_train = []
    flat_sensors_test = []

    for sensor in SENSOR_COLUMNS:
        train_var = train_df[sensor].var()
        test_var = test_df[sensor].var()
        is_flat_train = train_var < 0.01
        is_flat_test = test_var < 0.01

        if is_flat_train or is_flat_test:
            status = []
            if is_flat_train:
                status.append("FLAT in TRAIN")
                flat_sensors_train.append(sensor)
            if is_flat_test:
                status.append("FLAT in TEST")
                flat_sensors_test.append(sensor)
            print(f"  {sensor:12} | Train var: {train_var:10.6f} | Test var: {test_var:10.6f} | {', '.join(status)}")

    all_flat = flat_sensors_train + list(set(flat_sensors_test) - set(flat_sensors_train))
    print(f"\n  Flat sensors (KEPT for cross-dataset consistency): {all_flat}")

    # Normalize sensors using MinMaxScaler
    scaler = MinMaxScaler(feature_range=(0, 1))
    train_df[SENSOR_COLUMNS] = scaler.fit_transform(train_df[SENSOR_COLUMNS])
    test_df[SENSOR_COLUMNS] = scaler.transform(test_df[SENSOR_COLUMNS])

    # Save processed data
    os.makedirs('data/processed', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    os.makedirs('results/metrics', exist_ok=True)
    os.makedirs('results', exist_ok=True)

    train_df.to_csv(f'data/processed/{dataset_name}_train_cleaned.csv', index=False)
    test_df.to_csv(f'data/processed/{dataset_name}_test_cleaned.csv', index=False)

    with open(f'data/processed/{dataset_name}_scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)

    print(f"  [OK] Saved: data/processed/{dataset_name}_train_cleaned.csv")
    print(f"  [OK] Saved: data/processed/{dataset_name}_test_cleaned.csv")
    print(f"  [OK] Saved: data/processed/{dataset_name}_scaler.pkl")

    return train_df, test_df, scaler


def analyze_sensor_consistency():
    """Check which sensors are flat across multiple datasets."""
    print(f"\n{'='*80}")
    print("CROSS-DATASET SENSOR CONSISTENCY ANALYSIS")
    print(f"{'='*80}")

    analysis = {}

    for dataset in ['FD001', 'FD002', 'FD003', 'FD004']:
        train_df = pd.read_csv(f'data/processed/{dataset}_train_cleaned.csv')
        flat_in_this = []

        for sensor in SENSOR_COLUMNS:
            if train_df[sensor].var() < 0.01:
                flat_in_this.append(sensor)

        analysis[dataset] = flat_in_this

    print("\nFlat sensors per dataset:")
    for dataset, sensors in analysis.items():
        print(f"  {dataset}: {sensors if sensors else 'NONE'}")

    # Find sensors flat in some but not all
    flat_somewhere = set()
    for sensors in analysis.values():
        flat_somewhere.update(sensors)

    print(f"\nSensors flat in at least one dataset: {flat_somewhere}")
    print(f"These are kept because they're active in other datasets.")

    with open('data/processed/sensor_consistency_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2)

    return analysis


if __name__ == '__main__':
    datasets = ['FD001', 'FD002', 'FD003', 'FD004']
    all_data = {}

    for dataset in datasets:
        train, test, scaler = load_and_clean_dataset(dataset)
        all_data[dataset] = {'train': train, 'test': test, 'scaler': scaler}

    analyze_sensor_consistency()

    print(f"\n{'='*80}")
    print("[OK] DATA LOADER V2 COMPLETE -- All 21 sensors preserved")
    print(f"{'='*80}")
