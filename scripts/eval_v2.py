"""
eval_v2.py -- Standardized evaluation protocol for C-MAPSS models.
No retraining. Loads saved models from models/.
Outputs: results/metrics_v2/eval_v2.json and results/eval_v2_tables.md.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, precision_recall_fscore_support, confusion_matrix, f1_score
from tensorflow.keras.models import load_model

SENSOR_COLUMNS = [
    'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30',
    'Nf', 'Nc', 'epr', 'Ps30', 'phi',
    'NRf', 'NRc', 'BPR', 'farB',
    'htBleed', 'Nf_dmd', 'PCNfR_dmd',
    'W31', 'W32'
]

ALL_COLUMNS = ['engine_id', 'cycle', 'op_1', 'op_2', 'op_3'] + SENSOR_COLUMNS


def nasa_score(d):
    """
    NASA PHM08 scoring function.
    d = y_pred - y_true
    s = sum(exp(-d/13)-1 if d < 0 else exp(d/10)-1)
    """
    s = 0.0
    for diff in d:
        if diff < 0:
            s += np.exp(-diff / 13.0) - 1.0
        else:
            s += np.exp(diff / 10.0) - 1.0
    return float(s)


def run_evaluation():
    os.makedirs('results/metrics_v2', exist_ok=True)
    os.makedirs('results', exist_ok=True)

    print("Loading saved models...")
    lstm = load_model('models/lstm_rul_predictor.h5', compile=False)
    with open('models/rf_classifier.pkl', 'rb') as f:
        rf = pickle.load(f)
    with open('models/iforest_anomaly.pkl', 'rb') as f:
        iforest = pickle.load(f)

    datasets = ['FD001', 'FD002', 'FD003', 'FD004']
    all_metrics = {
        'regression_lstm': {},
        'classification_3stage': {},
        'classification_critical_binary': {}
    }

    seq_length = 50

    for ds in datasets:
        print(f"\n==================== Evaluating {ds} ====================")
        # Load test cleaned data and raw RUL ground truth
        test_df = pd.read_csv(f'data/processed/{ds}_test_cleaned.csv')
        rul_file = f'data/raw/RUL_{ds}.txt'
        with open(rul_file, 'r') as f:
            rul_at_last_list = [float(line.strip()) for line in f if line.strip()]

        engine_ids = sorted(test_df['engine_id'].unique())
        assert len(engine_ids) == len(rul_at_last_list), f"Mismatch in engine count for {ds}"

        # ---------------------------------------------------------
        # Part 1: Regression (LSTM) on LAST 50-cycle window per engine
        # ---------------------------------------------------------
        last_windows = []
        true_ruls_uncapped = []

        for i, eid in enumerate(engine_ids):
            e_df = test_df[test_df['engine_id'] == eid].sort_values('cycle')
            sensor_vals = e_df[SENSOR_COLUMNS].values
            true_last_rul = rul_at_last_list[i]
            true_ruls_uncapped.append(true_last_rul)

            if len(sensor_vals) < seq_length:
                pad_len = seq_length - len(sensor_vals)
                pad = np.repeat(sensor_vals[0:1], pad_len, axis=0)
                window = np.vstack([pad, sensor_vals])
            else:
                window = sensor_vals[-seq_length:]
            last_windows.append(window)

        X_last = np.array(last_windows)  # (N_engines, 50, 21)
        y_true_uncapped = np.array(true_ruls_uncapped)
        y_true_capped = np.minimum(y_true_uncapped, 125.0)

        preds_raw = lstm.predict(X_last, verbose=0).flatten()
        preds_clipped = np.clip(preds_raw, 0, 125.0)

        # Metrics against UNCAPPED true RUL
        # (A) Raw pred vs Uncapped true
        diff_raw_uncapped = preds_raw - y_true_uncapped
        mae_raw_uncapped = float(mean_absolute_error(y_true_uncapped, preds_raw))
        rmse_raw_uncapped = float(np.sqrt(mean_squared_error(y_true_uncapped, preds_raw)))
        nasa_raw_uncapped = nasa_score(diff_raw_uncapped)

        # (B) Clipped pred vs Uncapped true
        diff_clipped_uncapped = preds_clipped - y_true_uncapped
        mae_clipped_uncapped = float(mean_absolute_error(y_true_uncapped, preds_clipped))
        rmse_clipped_uncapped = float(np.sqrt(mean_squared_error(y_true_uncapped, preds_clipped)))
        nasa_clipped_uncapped = nasa_score(diff_clipped_uncapped)

        # Metrics against CAPPED true RUL (min(true, 125))
        # (C) Clipped pred vs Capped true
        diff_clipped_capped = preds_clipped - y_true_capped
        mae_clipped_capped = float(mean_absolute_error(y_true_capped, preds_clipped))
        rmse_clipped_capped = float(np.sqrt(mean_squared_error(y_true_capped, preds_clipped)))
        nasa_clipped_capped = nasa_score(diff_clipped_capped)

        # (D) Raw pred vs Capped true
        diff_raw_capped = preds_raw - y_true_capped
        mae_raw_capped = float(mean_absolute_error(y_true_capped, preds_raw))
        rmse_raw_capped = float(np.sqrt(mean_squared_error(y_true_capped, preds_raw)))
        nasa_raw_capped = nasa_score(diff_raw_capped)

        all_metrics['regression_lstm'][ds] = {
            'n_engines': len(engine_ids),
            'vs_uncapped_true': {
                'pred_clipped': {
                    'mae': round(mae_clipped_uncapped, 4),
                    'rmse': round(rmse_clipped_uncapped, 4),
                    'nasa_score': round(nasa_clipped_uncapped, 2)
                },
                'pred_raw': {
                    'mae': round(mae_raw_uncapped, 4),
                    'rmse': round(rmse_raw_uncapped, 4),
                    'nasa_score': round(nasa_raw_uncapped, 2)
                }
            },
            'vs_capped_true_125': {
                'pred_clipped': {
                    'mae': round(mae_clipped_capped, 4),
                    'rmse': round(rmse_clipped_capped, 4),
                    'nasa_score': round(nasa_clipped_capped, 2)
                },
                'pred_raw': {
                    'mae': round(mae_raw_capped, 4),
                    'rmse': round(rmse_raw_capped, 4),
                    'nasa_score': round(nasa_raw_capped, 2)
                }
            }
        }

        print(f"Regression ({ds}):")
        print(f"  vs Uncapped True: [Clipped Pred] RMSE={rmse_clipped_uncapped:.2f}, MAE={mae_clipped_uncapped:.2f}, NASA={nasa_clipped_uncapped:.1f}")
        print(f"  vs Capped True 125: [Clipped Pred] RMSE={rmse_clipped_capped:.2f}, MAE={mae_clipped_capped:.2f}, NASA={nasa_clipped_capped:.1f}")

        # ---------------------------------------------------------
        # Part 2: Classification on EVERY test cycle
        # ---------------------------------------------------------
        # Build ground truth and inputs for all cycles across all test engines
        all_cycles_true_stage = []
        all_cycles_rf_inputs = []
        all_cycles_lstm_windows = []

        for i, eid in enumerate(engine_ids):
            e_df = test_df[test_df['engine_id'] == eid].sort_values('cycle')
            n_cycles = len(e_df)
            rul_last = rul_at_last_list[i]
            s_vals = e_df[SENSOR_COLUMNS].values

            for k in range(1, n_cycles + 1):
                # true_rul(k) = RUL_file + (n - k)
                k_rul = rul_last + (n_cycles - k)
                if k_rul > 100:
                    stage = 0  # Healthy
                elif k_rul > 30:
                    stage = 1  # Degrading
                else:
                    stage = 2  # Critical
                all_cycles_true_stage.append(stage)

                # RF input: single cycle vector at index k-1
                all_cycles_rf_inputs.append(s_vals[k - 1])

                # LSTM window ending at cycle k (index k-1)
                hist = s_vals[:k]
                if len(hist) < seq_length:
                    pad = np.repeat(hist[0:1], seq_length - len(hist), axis=0)
                    w = np.vstack([pad, hist])
                else:
                    w = hist[-seq_length:]
                all_cycles_lstm_windows.append(w)

        y_true_stages = np.array(all_cycles_true_stage)
        X_rf_all = np.array(all_cycles_rf_inputs)
        X_lstm_all = np.array(all_cycles_lstm_windows)

        n_total_cycles = len(y_true_stages)

        # Batch predict RF
        rf_pred_stages = rf.predict(X_rf_all)

        # Batch predict LSTM
        lstm_preds_raw = lstm.predict(X_lstm_all, batch_size=512, verbose=0).flatten()
        lstm_preds_clip = np.clip(lstm_preds_raw, 0, 125.0)

        lstm_pred_stages = np.zeros(n_total_cycles, dtype=int)
        for idx, p in enumerate(lstm_preds_clip):
            if p > 100:
                lstm_pred_stages[idx] = 0
            elif p > 30:
                lstm_pred_stages[idx] = 1
            else:
                lstm_pred_stages[idx] = 2

        # Batch predict IForest (anomaly = -1, normal = 1)
        iforest_preds = iforest.predict(X_rf_all)
        iforest_is_anomaly = (iforest_preds == -1).astype(int)

        # 3-Stage Classification Metrics (Macro-F1, per-class P/R/F1, Confusion Matrix)
        labels = [0, 1, 2]
        # RF
        rf_macro_f1 = float(f1_score(y_true_stages, rf_pred_stages, average='macro', zero_division=0))
        rf_p, rf_r, rf_f1, rf_supp = precision_recall_fscore_support(y_true_stages, rf_pred_stages, labels=labels, zero_division=0)
        rf_cm = confusion_matrix(y_true_stages, rf_pred_stages, labels=labels).tolist()

        # LSTM
        lstm_macro_f1 = float(f1_score(y_true_stages, lstm_pred_stages, average='macro', zero_division=0))
        lstm_p, lstm_r, lstm_f1, lstm_supp = precision_recall_fscore_support(y_true_stages, lstm_pred_stages, labels=labels, zero_division=0)
        lstm_cm = confusion_matrix(y_true_stages, lstm_pred_stages, labels=labels).tolist()

        all_metrics['classification_3stage'][ds] = {
            'total_test_cycles': n_total_cycles,
            'class_support': [int(s) for s in rf_supp],
            'rf': {
                'macro_f1': round(rf_macro_f1, 4),
                'precision': [round(float(x), 4) for x in rf_p],
                'recall': [round(float(x), 4) for x in rf_r],
                'f1': [round(float(x), 4) for x in rf_f1],
                'confusion_matrix': rf_cm
            },
            'lstm_derived': {
                'macro_f1': round(lstm_macro_f1, 4),
                'precision': [round(float(x), 4) for x in lstm_p],
                'recall': [round(float(x), 4) for x in lstm_r],
                'f1': [round(float(x), 4) for x in lstm_f1],
                'confusion_matrix': lstm_cm
            }
        }

        # Binary Critical (RUL <= 30, stage == 2) vs rest
        y_true_crit = (y_true_stages == 2).astype(int)
        rf_crit_pred = (rf_pred_stages == 2).astype(int)
        lstm_crit_pred = (lstm_pred_stages == 2).astype(int)
        iforest_crit_pred = iforest_is_anomaly

        def get_binary_crit_metrics(y_true, y_pred):
            p, r, f, _ = precision_recall_fscore_support(y_true, y_pred, average='binary', pos_label=1, zero_division=0)
            return {'precision': round(float(p), 4), 'recall': round(float(r), 4), 'f1': round(float(f), 4)}

        rf_crit_metrics = get_binary_crit_metrics(y_true_crit, rf_crit_pred)
        lstm_crit_metrics = get_binary_crit_metrics(y_true_crit, lstm_crit_pred)
        iforest_crit_metrics = get_binary_crit_metrics(y_true_crit, iforest_crit_pred)

        all_metrics['classification_critical_binary'][ds] = {
            'critical_cycles_count': int(np.sum(y_true_crit)),
            'rf': rf_crit_metrics,
            'lstm_derived': lstm_crit_metrics,
            'iforest': iforest_crit_metrics
        }

        print(f"3-Stage Macro F1 ({ds}): RF={rf_macro_f1:.4f}, LSTM-derived={lstm_macro_f1:.4f}")
        print(f"Critical-class F1 ({ds}): RF={rf_crit_metrics['f1']:.4f}, LSTM={lstm_crit_metrics['f1']:.4f}, IForest={iforest_crit_metrics['f1']:.4f}")

    # Save metrics JSON
    with open('results/metrics_v2/eval_v2.json', 'w') as f:
        json.dump(all_metrics, f, indent=2)
    print("\nSaved results/metrics_v2/eval_v2.json")

    # Generate Markdown Tables
    md_lines = []
    md_lines.append("# C-MAPSS Evaluation v2 Tables (Standard Protocol)\n")
    md_lines.append("Generated by `scripts/eval_v2.py`. Models evaluated without retraining.\n")

    md_lines.append("## Table 1: LSTM RUL Regression Performance (Last 50-Cycle Window)")
    md_lines.append("| Dataset | Test Engines | vs Capped True (125) RMSE | vs Capped True (125) MAE | vs Capped True (125) NASA Score | vs Uncapped True RMSE | vs Uncapped True MAE | vs Uncapped True NASA Score |")
    md_lines.append("|---|---|---|---|---|---|---|---|")
    for ds in datasets:
        reg = all_metrics['regression_lstm'][ds]
        n_eng = reg['n_engines']
        c_p = reg['vs_capped_true_125']['pred_clipped']
        u_p = reg['vs_uncapped_true']['pred_clipped']
        md_lines.append(f"| **{ds}** | {n_eng} | {c_p['rmse']:.2f} | {c_p['mae']:.2f} | {c_p['nasa_score']:.1f} | {u_p['rmse']:.2f} | {u_p['mae']:.2f} | {u_p['nasa_score']:.1f} |")

    md_lines.append("\n## Table 2: 3-Stage Classification Performance Across All Test Cycles")
    md_lines.append("| Dataset | Total Cycles | Class Counts (H/D/C) | RF Macro-F1 | LSTM Macro-F1 | RF Class F1 (H / D / C) | LSTM Class F1 (H / D / C) |")
    md_lines.append("|---|---|---|---|---|---|---|")
    for ds in datasets:
        c3 = all_metrics['classification_3stage'][ds]
        tot = c3['total_test_cycles']
        supp = "/".join(str(x) for x in c3['class_support'])
        rf_f1 = f"{c3['rf']['f1'][0]:.3f} / {c3['rf']['f1'][1]:.3f} / {c3['rf']['f1'][2]:.3f}"
        lstm_f1 = f"{c3['lstm_derived']['f1'][0]:.3f} / {c3['lstm_derived']['f1'][1]:.3f} / {c3['lstm_derived']['f1'][2]:.3f}"
        md_lines.append(f"| **{ds}** | {tot} | {supp} | **{c3['rf']['macro_f1']:.4f}** | **{c3['lstm_derived']['macro_f1']:.4f}** | {rf_f1} | {lstm_f1} |")

    md_lines.append("\n## Table 3: Binary Critical Class Detection (RUL <= 30 vs Rest)")
    md_lines.append("| Dataset | Critical Cycles | Model | Critical Precision | Critical Recall | Critical F1 |")
    md_lines.append("|---|---|---|---|---|---|")
    for ds in datasets:
        crit = all_metrics['classification_critical_binary'][ds]
        n_c = crit['critical_cycles_count']
        for m_name, m_key in [('Random Forest (Snapshot)', 'rf'), ('LSTM (Sequence)', 'lstm_derived'), ('Isolation Forest (Unsupervised)', 'iforest')]:
            m = crit[m_key]
            md_lines.append(f"| **{ds}** | {n_c} | {m_name} | {m['precision']:.4f} | {m['recall']:.4f} | **{m['f1']:.4f}** |")

    md_lines.append("\n## Table 4: Confusion Matrices (FD001 Test Cycles)")
    c3_fd1 = all_metrics['classification_3stage']['FD001']
    md_lines.append("### Random Forest (FD001)")
    md_lines.append("| True \\ Pred | Healthy (0) | Degrading (1) | Critical (2) |")
    md_lines.append("|---|---|---|---|")
    cm_rf = c3_fd1['rf']['confusion_matrix']
    stage_names = ['Healthy (0)', 'Degrading (1)', 'Critical (2)']
    for i, row in enumerate(cm_rf):
        md_lines.append(f"| **{stage_names[i]}** | {row[0]} | {row[1]} | {row[2]} |")

    md_lines.append("\n### LSTM-Derived Stage (FD001)")
    md_lines.append("| True \\ Pred | Healthy (0) | Degrading (1) | Critical (2) |")
    md_lines.append("|---|---|---|---|")
    cm_lstm = c3_fd1['lstm_derived']['confusion_matrix']
    for i, row in enumerate(cm_lstm):
        md_lines.append(f"| **{stage_names[i]}** | {row[0]} | {row[1]} | {row[2]} |")

    with open('results/eval_v2_tables.md', 'w') as f:
        f.write("\n".join(md_lines))
    print("Saved results/eval_v2_tables.md")


if __name__ == '__main__':
    run_evaluation()
