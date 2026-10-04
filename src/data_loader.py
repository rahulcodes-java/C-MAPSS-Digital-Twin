"""
data_loader.py — Loads and processes the real NASA C-MAPSS dataset (all 4 subsets).

Column layout (26 cols, 2 trailing empty cols from double-space delimiter):
  0: engine_id
  1: cycle
  2-4: op_1, op_2, op_3
  5-25: 21 sensor channels (named by turbofan station)
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler
import pickle


class CMAPSSDataLoader:
    """Load and preprocess all 4 NASA C-MAPSS datasets from /data/raw/"""

    SENSOR_NAMES = [
        'T2', 'T24', 'T30', 'T50',           # Temperatures
        'P2', 'P15', 'P30', 'Nf',             # Pressures & Fan speed
        'Nc', 'epr', 'Ps30', 'phi',           # Core speed, EPR, etc.
        'NRf', 'NRc', 'BPR', 'farB',          # Corrected speeds, bypass, fuel-air
        'htBleed', 'Nf_dmd', 'PCNfR_dmd',     # Bleed, demanded speeds
        'W31', 'W32'                           # Flow rates
    ]

    COLUMNS = (
        ['engine_id', 'cycle', 'op_1', 'op_2', 'op_3']
        + SENSOR_NAMES
    )

    def __init__(self, data_dir='data/raw'):
        self.data_dir = Path(data_dir)
        self.datasets = {}
        self.scalers = {}

    # ── Loading ──────────────────────────────────────────────────────────

    def load_dataset(self, subset_name='FD001'):
        """Load train, test, RUL for a single dataset subset."""
        print(f"\n{'='*60}")
        print(f"Loading {subset_name}...")
        print(f"{'='*60}")

        train_file = self.data_dir / f'train_{subset_name}.txt'
        test_file  = self.data_dir / f'test_{subset_name}.txt'
        rul_file   = self.data_dir / f'RUL_{subset_name}.txt'

        for f in [train_file, test_file, rul_file]:
            if not f.exists():
                raise FileNotFoundError(f"Missing: {f}")

        # Load training data (space-delimited, 2 trailing NaN cols)
        train_df = pd.read_csv(train_file, sep=r'\s+', header=None, engine='python')
        train_df = train_df.iloc[:, :26]
        train_df.columns = self.COLUMNS

        # Load test data
        test_df = pd.read_csv(test_file, sep=r'\s+', header=None, engine='python')
        test_df = test_df.iloc[:, :26]
        test_df.columns = self.COLUMNS

        # Load ground truth RUL
        rul_df = pd.read_csv(rul_file, sep=r'\s+', header=None, engine='python')
        rul_df.columns = ['RUL']

        print(f"  Train shape : {train_df.shape}  |  Engines: {train_df['engine_id'].nunique()}")
        print(f"  Test  shape : {test_df.shape}  |  Engines: {test_df['engine_id'].nunique()}")
        print(f"  RUL entries : {rul_df.shape[0]}")

        self.datasets[subset_name] = {
            'train': train_df,
            'test': test_df,
            'rul': rul_df,
        }
        return train_df, test_df, rul_df

    def load_all_datasets(self):
        """Load all 4 datasets (FD001–FD004)."""
        for subset in ['FD001', 'FD002', 'FD003', 'FD004']:
            self.load_dataset(subset)

    # ── Preprocessing ────────────────────────────────────────────────────

    def preprocess_dataset(self, subset_name='FD001', normalize=True, save=True):
        """
        Full pipeline for one subset:
          1. Compute RUL (training data)
          2. Attach ground-truth RUL (test data)
          3. Label health stages
          4. Drop flat (near-constant) sensors
          5. Normalize sensor channels
          6. Save to /data/processed/
        """
        print(f"\n-- Preprocessing {subset_name} --")

        ds = self.datasets[subset_name]
        train_df = ds['train'].copy()
        test_df  = ds['test'].copy()
        rul_df   = ds['rul'].copy()

        # 1. Compute RUL for training data
        train_df = compute_rul(train_df)

        # 2. Attach ground-truth RUL to test data (last cycle per engine)
        test_max_cycles = test_df.groupby('engine_id')['cycle'].max()
        test_rul_records = []
        for engine_id in test_df['engine_id'].unique():
            engine_max = test_max_cycles[engine_id]
            ground_truth_rul = rul_df.iloc[engine_id - 1, 0]
            engine_mask = test_df['engine_id'] == engine_id
            engine_cycles = test_df.loc[engine_mask, 'cycle']
            test_df.loc[engine_mask, 'RUL'] = ground_truth_rul + (engine_max - engine_cycles)

        test_df['RUL'] = test_df['RUL'].astype(int)

        # 3. Health stages
        train_df = label_health(train_df)
        test_df  = label_health(test_df)

        stage_counts = train_df['health_stage'].value_counts().sort_index()
        print(f"  Health stages (train): {stage_counts.to_dict()}")

        # 4. Drop flat sensors
        train_df, flat = drop_flat_sensors(train_df)
        if flat:
            test_df = test_df.drop(columns=flat, errors='ignore')

        # 5. Normalize
        if normalize:
            train_df, scaler = normalize_sensors(train_df, fit=True)
            test_df, _       = normalize_sensors(test_df, scaler=scaler, fit=False)
            self.scalers[subset_name] = scaler

        # 6. Save
        if save:
            output_dir = Path('data/processed')
            output_dir.mkdir(parents=True, exist_ok=True)

            train_out = output_dir / f'{subset_name}_train_cleaned.csv'
            test_out  = output_dir / f'{subset_name}_test_cleaned.csv'

            train_df.to_csv(train_out, index=False)
            test_df.to_csv(test_out,  index=False)

            print(f"  [OK] Saved: {train_out}")
            print(f"  [OK] Saved: {test_out}")

            # Save scaler
            if normalize:
                scaler_path = output_dir / f'{subset_name}_scaler.pkl'
                with open(scaler_path, 'wb') as f:
                    pickle.dump(scaler, f)
                print(f"  [OK] Saved: {scaler_path}")

        self.datasets[subset_name]['train_cleaned'] = train_df
        self.datasets[subset_name]['test_cleaned']  = test_df

        remaining = [c for c in train_df.columns if c in self.SENSOR_NAMES]
        print(f"  Final train shape: {train_df.shape}  |  Sensors kept: {len(remaining)}")
        print(f"  Final test  shape: {test_df.shape}")

        return train_df, test_df


# ==============================================================================
# Standalone helper functions (backward-compatible with existing pipeline)
# ==============================================================================

COLUMNS = CMAPSSDataLoader.COLUMNS


def load_c_mapss(filepath):
    """Load a raw C-MAPSS text file -> clean DataFrame (26 meaningful columns)."""
    df = pd.read_csv(filepath, sep=r'\s+', header=None, engine='python')
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
      1 = degrading (30 < RUL <= 100)
      2 = critical  (RUL <= 30)
    """
    lo, hi = rul_thresholds
    conditions = [df['RUL'] > hi, df['RUL'] <= lo]
    choices    = [0, 2]
    df['health_stage'] = np.select(conditions, choices, default=1)
    return df


def drop_flat_sensors(df, variance_threshold=0.01):
    """Drop sensors with near-zero variance (carry no information)."""
    sensor_cols = [c for c in df.columns if c in CMAPSSDataLoader.SENSOR_NAMES
                   or c.startswith('sensor_')]
    flat = [c for c in sensor_cols if df[c].std() < variance_threshold]
    if flat:
        print(f"  Dropped {len(flat)} flat sensors: {flat}")
    else:
        print(f"  No flat sensors found (all variances > {variance_threshold})")
    return df.drop(columns=flat), flat


def normalize_sensors(df, scaler=None, fit=True):
    """StandardScaler normalisation per sensor channel."""
    sensor_cols = [c for c in df.columns if c in CMAPSSDataLoader.SENSOR_NAMES
                   or c.startswith('sensor_')]
    if scaler is None:
        scaler = StandardScaler()
    if fit:
        df[sensor_cols] = scaler.fit_transform(df[sensor_cols])
    else:
        df[sensor_cols] = scaler.transform(df[sensor_cols])
    return df, scaler


def process_data(train_path, test_path, rul_path, output_path):
    """Legacy pipeline: load -> RUL -> labels -> drop flat -> normalize -> save."""
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

    # Save scaler
    models_dir = os.path.join(os.path.dirname(os.path.dirname(output_path)), 'models')
    os.makedirs(models_dir, exist_ok=True)
    scaler_path = os.path.join(models_dir, 'scaler.pkl')
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)

    print(f"\nSaved cleaned data --> {output_path}")
    print(f"Final shape: {df.shape}")
    remaining_sensors = [c for c in df.columns if c in CMAPSSDataLoader.SENSOR_NAMES
                         or c.startswith('sensor_')]
    print(f"Sensors remaining: {len(remaining_sensors)}")
    return df, scaler


# -- Main entry point ---------------------------------------------------------

if __name__ == '__main__':
    # Resolve project root relative to this script
    base = Path(__file__).resolve().parent.parent
    data_dir = base / 'data' / 'raw'

    loader = CMAPSSDataLoader(data_dir=str(data_dir))
    loader.load_all_datasets()

    for subset in ['FD001', 'FD002', 'FD003', 'FD004']:
        loader.preprocess_dataset(subset)

    print(f"\n{'='*60}")
    print("[OK] All 4 datasets loaded and preprocessed!")
    print(f"{'='*60}")

    # Summary table
    print(f"\n{'Subset':<8} {'Train rows':>12} {'Test rows':>12} {'Sensors':>10}")
    print("-" * 44)
    for subset in ['FD001', 'FD002', 'FD003', 'FD004']:
        ds = loader.datasets[subset]
        train_shape = ds['train_cleaned'].shape
        test_shape  = ds['test_cleaned'].shape
        n_sensors = len([c for c in ds['train_cleaned'].columns
                         if c in CMAPSSDataLoader.SENSOR_NAMES])
        print(f"{subset:<8} {train_shape[0]:>12,} {test_shape[0]:>12,} {n_sensors:>10}")
