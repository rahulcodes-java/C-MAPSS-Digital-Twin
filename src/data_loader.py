"""
data_loader.py — Loads and processes the real NASA C-MAPSS dataset.

Column layout (26 cols, 2 trailing empty cols from double-space delimiter):
  0: engine_id
  1: cycle
  2-4: op_1, op_2, op_3
  5-25: sensor_1 ... sensor_21
"""

import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import pickle

COLUMNS = (
    ['engine_id', 'cycle']
    + [f'op_{i}' for i in range(1, 4)]
    + [f'sensor_{i}' for i in range(1, 22)]
)


def load_c_mapss(filepath):
    """Load a raw C-MAPSS text file → clean DataFrame (26 meaningful columns)."""
    df = pd.read_csv(filepath, sep=r'\s+', header=None)
    # Real files have 28 cols (26 + 2 trailing NaNs); synthetic may have exactly 26
    df = df.iloc[:, :26]
    df.columns = COLUMNS
    return df


def compute_rul(df):
    """Add RUL column: max_cycle(engine) - current_cycle."""
    max_cycles = df.groupby('engine_id')['cycle'].max()
    df['RUL'] = df.apply(lambda r: max_cycles[r['engine_id']] - r['cycle'], axis=1)
    return df


def label_health(df, rul_thresholds=(30, 100)):
    """
    Discretise RUL into 3 health stages:
      0 = healthy  (RUL > 100)
      1 = degrading (30 <= RUL <= 100)
      2 = critical  (RUL < 30)
    """
    lo, hi = rul_thresholds
    conditions = [df['RUL'] > hi, df['RUL'] <= lo]
    choices    = [0, 2]
    df['health_stage'] = np.select(conditions, choices, default=1)
    return df


def drop_flat_sensors(df, variance_threshold=0.01):
    """Drop sensors with near-zero variance (carry no information)."""
    sensor_cols = [c for c in df.columns if c.startswith('sensor_')]
    flat = [c for c in sensor_cols if df[c].std() < variance_threshold]
    if flat:
        print(f"  Dropped {len(flat)} flat sensors: {flat}")
    else:
        print(f"  No flat sensors found (all variances > {variance_threshold})")
    return df.drop(columns=flat), flat


def normalize_sensors(df, scaler=None, fit=True):
    """StandardScaler normalisation per sensor channel."""
    sensor_cols = [c for c in df.columns if c.startswith('sensor_')]
    if scaler is None:
        scaler = StandardScaler()
    if fit:
        df[sensor_cols] = scaler.fit_transform(df[sensor_cols])
    else:
        df[sensor_cols] = scaler.transform(df[sensor_cols])
    return df, scaler


def process_data(train_path, test_path, rul_path, output_path):
    """Full pipeline: load → RUL → labels → drop flat → normalize → save."""
    print("Loading training data...")
    df = load_c_mapss(train_path)
    print(f"  Raw shape: {df.shape}")

    print("Computing RUL...")
    df = compute_rul(df)

    print("Labeling health stages...")
    df = label_health(df)
    stage_counts = df['health_stage'].value_counts().sort_index()
    print(f"  Class distribution: {stage_counts.to_dict()}")

    print("Dropping flat sensors...")
    df, flat_sensors = drop_flat_sensors(df)

    print("Normalizing sensor channels...")
    df, scaler = normalize_sensors(df, fit=True)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    # Save scaler for later use by dashboard / inference
    scaler_path = output_path.replace('FD001_cleaned.csv', 'scaler.pkl')
    with open(os.path.join(os.path.dirname(output_path).replace('processed', '..') , 'models', 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)

    print(f"\nSaved cleaned data -> {output_path}")
    print(f"Final shape: {df.shape}")
    remaining_sensors = [c for c in df.columns if c.startswith('sensor_')]
    print(f"Sensors remaining: {len(remaining_sensors)}")
    return df, scaler


if __name__ == "__main__":
    base = os.path.join(os.path.dirname(__file__), '..')
    process_data(
        train_path=os.path.join(base, 'data', 'raw', 'train_FD001.txt'),
        test_path=os.path.join(base,  'data', 'raw', 'test_FD001.txt'),
        rul_path=os.path.join(base,   'data', 'raw', 'RUL_FD001.txt'),
        output_path=os.path.join(base, 'data', 'processed', 'FD001_cleaned.csv'),
    )
