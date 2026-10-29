import os
import pickle
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model

def run_consistency_check():
    # Load models
    lstm_model = load_model('models/lstm_rul_predictor.h5', compile=False)
    with open('models/rf_classifier.pkl', 'rb') as f:
        rf_model = pickle.load(f)
    with open('models/iforest_anomaly.pkl', 'rb') as f:
        iforest_model = pickle.load(f)
    with open('data/processed/FD001_scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)

    sensor_cols = list(scaler.feature_names_in_)

    # Load data for Engine 1 (192 cycles)
    train_path = 'data/processed/FD001_train_cleaned.csv'
    test_path = 'data/processed/FD001_test_cleaned.csv'
    
    df_train = pd.read_csv(train_path) if os.path.exists(train_path) else None
    df_test = pd.read_csv(test_path) if os.path.exists(test_path) else None

    # Resolve Engine 1
    # Check test first, then train if cycles exceed test length
    cycles_to_check = [1, 25, 50, 100, 144, 170, 192]

    print("=" * 85)
    print("RUL & HEALTH STAGE CONSISTENCY VERIFICATION (ENGINE 1)")
    print("=" * 85)
    print(f"{'cycle':^7} | {'true_rul':^8} | {'predicted_rul':^13} | {'abs_error':^9} | {'rf_stage':^8} | {'rul_stage':^9} | {'iforest_anomaly':^15}")
    print("-" * 85)

    for cycle in cycles_to_check:
        # Engine 1 runs 192 cycles to failure in train_cleaned.csv
        source_df = None
        if df_train is not None:
            sub = df_train[(df_train['engine_id'] == 1) & (df_train['cycle'] == cycle)]
            if not sub.empty:
                source_df = df_train
        if source_df is None and df_test is not None:
            sub = df_test[(df_test['engine_id'] == 1) & (df_test['cycle'] == cycle)]
            if not sub.empty:
                source_df = df_test

        if source_df is None:
            print(f"Cycle {cycle} not found for Engine 1")
            continue

        engine_data = source_df[source_df['engine_id'] == 1].sort_values('cycle')
        true_rul = float(engine_data[engine_data['cycle'] == cycle]['RUL'].values[0])

        # Windowing [cycle-50 : cycle]
        history = engine_data[engine_data['cycle'] <= cycle]
        window = history.tail(50)
        window_vals = window[sensor_cols].values

        if len(window_vals) < 50:
            pad_count = 50 - len(window_vals)
            pad = np.repeat(window_vals[0:1], pad_count, axis=0)
            window_vals = np.vstack([pad, window_vals])

        X_seq = window_vals.reshape(1, 50, len(sensor_cols))
        last_row = window_vals[-1:].reshape(1, len(sensor_cols))

        # Predictions
        raw_pred = float(lstm_model.predict(X_seq, verbose=0)[0][0])
        pred_rul = float(np.clip(raw_pred, 0, 125))
        abs_error = abs(pred_rul - true_rul)

        rf_stage = int(rf_model.predict(last_row)[0])
        if pred_rul > 100:
            rul_stage = 0
        elif pred_rul > 30:
            rul_stage = 1
        else:
            rul_stage = 2

        iforest_anomaly = int(iforest_model.predict(last_row)[0] == -1)

        print(f"{cycle:7d} | {true_rul:8.1f} | {pred_rul:13.1f} | {abs_error:9.1f} | {rf_stage:8d} | {rul_stage:9d} | {iforest_anomaly:15d}")

    print("=" * 85)

if __name__ == '__main__':
    run_consistency_check()
