"""
rul_predictor_lstm.py -- Person 1: LSTM-based Remaining Useful Life predictor.
Trains on FD001 sequences, evaluates on all 4 datasets.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, f1_score
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam

SENSOR_COLUMNS = [
    'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30',
    'Nf', 'Nc', 'epr', 'Ps30', 'phi',
    'NRf', 'NRc', 'BPR', 'farB',
    'htBleed', 'Nf_dmd', 'PCNfR_dmd',
    'W31', 'W32'
]

N_SENSORS = len(SENSOR_COLUMNS)  # 21


def create_sequences(X, y, seq_length=50):
    """Create sliding-window sequences for LSTM."""
    Xs, ys = [], []
    for i in range(len(X) - seq_length):
        Xs.append(X[i:i + seq_length])
        ys.append(y[i + seq_length])
    return np.array(Xs), np.array(ys)


def train_lstm_rul_predictor():
    """Train LSTM on FD001, evaluate on all 4 datasets."""
    print(f"\n{'='*80}")
    print("PERSON 1: LSTM RUL PREDICTOR")
    print(f"{'='*80}")

    # Load FD001 training data
    train_df = pd.read_csv('data/processed/FD001_train_cleaned.csv')

    # Prepare data per engine (preserves time-series continuity)
    X_list, y_list = [], []
    seq_length = 50

    for engine_id in sorted(train_df['engine_id'].unique()):
        engine_data = train_df[train_df['engine_id'] == engine_id][SENSOR_COLUMNS].values
        rul_data = train_df[train_df['engine_id'] == engine_id]['RUL'].values

        if len(engine_data) > seq_length:
            X_seq, y_seq = create_sequences(engine_data, rul_data, seq_length)
            X_list.append(X_seq)
            y_list.append(y_seq)

    X_train = np.vstack(X_list)
    y_train = np.hstack(y_list)

    print(f"Training sequences shape: {X_train.shape}")
    print(f"Target RUL shape: {y_train.shape}")
    print(f"Sequence length: {seq_length}, Sensors: {N_SENSORS}")

    # Build LSTM model
    model = Sequential([
        LSTM(128, activation='relu', input_shape=(seq_length, N_SENSORS), return_sequences=True),
        Dropout(0.2),
        LSTM(64, activation='relu'),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1)
    ])

    model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])

    # Train with early stopping
    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

    history = model.fit(
        X_train, y_train,
        epochs=30,
        batch_size=32,
        validation_split=0.2,
        callbacks=[early_stop],
        verbose=1
    )

    # Save model
    os.makedirs('models', exist_ok=True)
    model.save('models/lstm_rul_predictor.h5')
    print(f"\n  [OK] Model saved: models/lstm_rul_predictor.h5")

    # Evaluate on all 4 datasets
    results = {}
    datasets = ['FD001', 'FD002', 'FD003', 'FD004']

    for dataset in datasets:
        test_df = pd.read_csv(f'data/processed/{dataset}_test_cleaned.csv')

        X_test_list, y_test_list = [], []
        for engine_id in sorted(test_df['engine_id'].unique()):
            engine_data = test_df[test_df['engine_id'] == engine_id][SENSOR_COLUMNS].values
            rul_data = test_df[test_df['engine_id'] == engine_id]['RUL'].values

            if len(engine_data) > seq_length:
                X_seq, y_seq = create_sequences(engine_data, rul_data, seq_length)
                if len(X_seq) > 0:
                    X_test_list.append(X_seq)
                    y_test_list.append(y_seq)

        if X_test_list:
            X_test = np.vstack(X_test_list)
            y_test = np.hstack(y_test_list)

            y_pred = model.predict(X_test, verbose=0).flatten()

            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))

            # Binary classification: RUL > 30 = OK (1), RUL <= 30 = CRITICAL (0)
            y_test_binary = (y_test > 30).astype(int)
            y_pred_binary = (y_pred > 30).astype(int)
            f1 = f1_score(y_test_binary, y_pred_binary, zero_division=0)

            results[dataset] = {
                'MAE': float(mae),
                'RMSE': float(rmse),
                'F1': float(f1),
                'samples': int(len(y_test))
            }

            print(f"\n  {dataset}: MAE={mae:.4f}, RMSE={rmse:.4f}, F1={f1:.4f}")

    # Save metrics
    os.makedirs('results/metrics', exist_ok=True)
    with open('results/metrics/lstm_metrics.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n  [OK] Metrics saved: results/metrics/lstm_metrics.json")
    print(f"\n{'='*80}")
    print("[OK] PERSON 1 COMPLETE: LSTM RUL Predictor")
    print(f"{'='*80}")

    return results


if __name__ == '__main__':
    train_lstm_rul_predictor()
