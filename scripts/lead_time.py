"""
lead_time.py -- A4: Lead-time analysis across all FD001 train engines.
Evaluates detection_cycle vs true_cycle for:
  - Degrading stage (RUL <= 100, stage >= 1 persisting 3 consecutive cycles)
  - Critical stage (RUL <= 30, stage == 2 persisting 3 consecutive cycles, plus first IForest trigger)
Evaluates ALL 100 engines, in-sample engines (1-82), and held-out validation tail (83-100).
Produces Engine 1 full trajectory plot and metrics JSON in results/metrics_v2/.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model

SENSOR_COLUMNS = [
    'T2', 'T24', 'T30', 'T50', 'P2', 'P15', 'P30',
    'Nf', 'Nc', 'epr', 'Ps30', 'phi',
    'NRf', 'NRc', 'BPR', 'farB',
    'htBleed', 'Nf_dmd', 'PCNfR_dmd',
    'W31', 'W32'
]


def iqr(arr):
    if len(arr) == 0:
        return 0.0
    return float(np.percentile(arr, 75) - np.percentile(arr, 25))


def find_persisting_cycle(predictions, target_condition, persist_len=3):
    """Return first cycle (1-indexed) where target_condition holds for persist_len consecutive cycles."""
    n = len(predictions)
    for c in range(n - persist_len + 1):
        if all(target_condition(predictions[c + offset]) for offset in range(persist_len)):
            return c + 1  # 1-indexed cycle
    return None


def run_lead_time_analysis():
    os.makedirs('results/metrics_v2', exist_ok=True)
    os.makedirs('docs/submission/figures', exist_ok=True)

    print("Loading models...")
    lstm = load_model('models/lstm_rul_predictor.h5', compile=False)
    with open('models/rf_classifier.pkl', 'rb') as f:
        rf = pickle.load(f)
    with open('models/iforest_anomaly.pkl', 'rb') as f:
        iforest = pickle.load(f)

    train_df = pd.read_csv('data/processed/FD001_train_cleaned.csv')
    engine_ids = sorted(train_df['engine_id'].unique())
    seq_length = 50

    # Collect per-engine records
    engine_results = []
    engine_1_data = None

    for eid in engine_ids:
        edf = train_df[train_df['engine_id'] == eid].sort_values('cycle')
        cycles = edf['cycle'].values
        n_cycles = len(cycles)
        # Ground truth RUL: at last cycle n, RUL is 0; at cycle k (1-indexed), RUL = n_cycles - k
        true_ruls = np.array([n_cycles - c for c in cycles])

        # Prepare batch windows and single vectors
        sensor_matrix = edf[SENSOR_COLUMNS].values
        windows = []
        for c_idx in range(1, n_cycles + 1):
            hist = sensor_matrix[:c_idx]
            if len(hist) < seq_length:
                pad = np.repeat(hist[0:1], seq_length - len(hist), axis=0)
                w = np.vstack([pad, hist])
            else:
                w = hist[-seq_length:]
            windows.append(w)

        X_windows = np.array(windows)
        X_singles = sensor_matrix

        # Predictions
        lstm_preds_raw = lstm.predict(X_windows, batch_size=256, verbose=0).flatten()
        lstm_preds_clip = np.clip(lstm_preds_raw, 0, 125.0)

        rf_preds = rf.predict(X_singles)
        iforest_preds = iforest.predict(X_singles)  # -1 anomaly, 1 normal

        # LSTM derived stage
        lstm_stages = []
        for p in lstm_preds_clip:
            if p > 100:
                lstm_stages.append(0)
            elif p > 30:
                lstm_stages.append(1)
            else:
                lstm_stages.append(2)
        lstm_stages = np.array(lstm_stages)

        if eid == 1:
            engine_1_data = {
                'cycles': cycles,
                'true_ruls': true_ruls,
                'lstm_preds': lstm_preds_clip,
                'rf_stages': rf_preds,
                'iforest_anomalies': (iforest_preds == -1).astype(int),
                'total_cycles': n_cycles
            }

        # True transition cycles (1-indexed cycle number)
        # Degrading: true RUL <= 100
        deg_true_idx = np.where(true_ruls <= 100)[0]
        deg_true_cycle = int(cycles[deg_true_idx[0]]) if len(deg_true_idx) > 0 else None

        # Critical: true RUL <= 30
        crit_true_idx = np.where(true_ruls <= 30)[0]
        crit_true_cycle = int(cycles[crit_true_idx[0]]) if len(crit_true_idx) > 0 else None

        # Detection cycles: persisting 3 consecutive cycles
        rf_deg_cycle = find_persisting_cycle(rf_preds, lambda st: st >= 1, persist_len=3)
        lstm_deg_cycle = find_persisting_cycle(lstm_stages, lambda st: st >= 1, persist_len=3)

        rf_crit_cycle = find_persisting_cycle(rf_preds, lambda st: st == 2, persist_len=3)
        lstm_crit_cycle = find_persisting_cycle(lstm_stages, lambda st: st == 2, persist_len=3)

        # First IForest anomaly trigger
        if_anom_indices = np.where(iforest_preds == -1)[0]
        iforest_first_cycle = int(cycles[if_anom_indices[0]]) if len(if_anom_indices) > 0 else None

        is_val_tail = (eid >= 83)
        is_strictly_held_out = (eid >= 84)

        engine_results.append({
            'engine_id': eid,
            'total_cycles': n_cycles,
            'is_in_sample': (eid <= 82),
            'is_val_tail': is_val_tail,
            'deg_true_cycle': deg_true_cycle,
            'rf_deg_cycle': rf_deg_cycle,
            'lstm_deg_cycle': lstm_deg_cycle,
            'rf_deg_delay': (rf_deg_cycle - deg_true_cycle) if rf_deg_cycle is not None and deg_true_cycle is not None else None,
            'lstm_deg_delay': (lstm_deg_cycle - deg_true_cycle) if lstm_deg_cycle is not None and deg_true_cycle is not None else None,
            'crit_true_cycle': crit_true_cycle,
            'rf_crit_cycle': rf_crit_cycle,
            'lstm_crit_cycle': lstm_crit_cycle,
            'iforest_first_cycle': iforest_first_cycle,
            'rf_crit_delay': (rf_crit_cycle - crit_true_cycle) if rf_crit_cycle is not None and crit_true_cycle is not None else None,
            'lstm_crit_delay': (lstm_crit_cycle - crit_true_cycle) if lstm_crit_cycle is not None and crit_true_cycle is not None else None,
            'iforest_crit_delay': (iforest_first_cycle - crit_true_cycle) if iforest_first_cycle is not None and crit_true_cycle is not None else None,
            'paired_diff_deg_rf_minus_lstm': (rf_deg_cycle - lstm_deg_cycle) if rf_deg_cycle is not None and lstm_deg_cycle is not None else None,
            'paired_diff_crit_rf_minus_lstm': (rf_crit_cycle - lstm_crit_cycle) if rf_crit_cycle is not None and lstm_crit_cycle is not None else None
        })

    edf = pd.DataFrame(engine_results)

    # Cohort analysis function
    def summarize_cohort(sub_df, name):
        summary = {'cohort_name': name, 'engine_count': len(sub_df)}

        for task, delay_col, never_col in [
            ('degrading_rf', 'rf_deg_delay', 'rf_deg_cycle'),
            ('degrading_lstm', 'lstm_deg_delay', 'lstm_deg_cycle'),
            ('critical_rf', 'rf_crit_delay', 'rf_crit_cycle'),
            ('critical_lstm', 'lstm_crit_delay', 'lstm_crit_cycle'),
            ('critical_iforest', 'iforest_crit_delay', 'iforest_first_cycle'),
        ]:
            valid_delays = sub_df[delay_col].dropna().values
            never_count = int(sub_df[never_col].isna().sum())
            summary[task] = {
                'count_evaluated': len(valid_delays),
                'never_detected_count': never_count,
                'mean_delay': round(float(np.mean(valid_delays)), 2) if len(valid_delays) > 0 else None,
                'median_delay': round(float(np.median(valid_delays)), 2) if len(valid_delays) > 0 else None,
                'iqr_delay': round(iqr(valid_delays), 2) if len(valid_delays) > 0 else None,
            }

        # Paired difference (RF - LSTM) for degrading
        paired_deg = sub_df['paired_diff_deg_rf_minus_lstm'].dropna().values
        lstm_earlier_count = int(np.sum(paired_deg > 0))
        rf_earlier_count = int(np.sum(paired_deg < 0))
        equal_count = int(np.sum(paired_deg == 0))
        share_lstm_first = round(float(lstm_earlier_count / len(paired_deg)), 4) if len(paired_deg) > 0 else 0.0

        summary['paired_degrading_rf_minus_lstm'] = {
            'count': len(paired_deg),
            'mean': round(float(np.mean(paired_deg)), 2) if len(paired_deg) > 0 else None,
            'median': round(float(np.median(paired_deg)), 2) if len(paired_deg) > 0 else None,
            'iqr': round(iqr(paired_deg), 2) if len(paired_deg) > 0 else None,
            'lstm_flags_first_count': lstm_earlier_count,
            'rf_flags_first_count': rf_earlier_count,
            'same_cycle_count': equal_count,
            'share_lstm_flags_first': share_lstm_first
        }

        return summary

    all_summary = summarize_cohort(edf, 'ALL_ENGINES (1-100)')
    in_sample_summary = summarize_cohort(edf[edf['is_in_sample']], 'IN_SAMPLE_TRAIN (1-82)')
    val_tail_summary = summarize_cohort(edf[edf['is_val_tail']], 'HELD_OUT_VAL_TAIL (83-100)')

    lead_time_output = {
        'cohort_all': all_summary,
        'cohort_in_sample': in_sample_summary,
        'cohort_val_tail': val_tail_summary,
        'engine_1_summary': {
            'total_cycles': int(engine_1_data['total_cycles']),
            'deg_true_cycle': int(edf[edf['engine_id'] == 1]['deg_true_cycle'].values[0]),
            'crit_true_cycle': int(edf[edf['engine_id'] == 1]['crit_true_cycle'].values[0]),
            'rf_deg_cycle': int(edf[edf['engine_id'] == 1]['rf_deg_cycle'].values[0]),
            'lstm_deg_cycle': int(edf[edf['engine_id'] == 1]['lstm_deg_cycle'].values[0]),
            'rf_crit_cycle': int(edf[edf['engine_id'] == 1]['rf_crit_cycle'].values[0]),
            'lstm_crit_cycle': int(edf[edf['engine_id'] == 1]['lstm_crit_cycle'].values[0]),
            'iforest_first_cycle': int(edf[edf['engine_id'] == 1]['iforest_first_cycle'].values[0]),
            'paired_diff_deg_rf_minus_lstm': int(edf[edf['engine_id'] == 1]['paired_diff_deg_rf_minus_lstm'].values[0])
        }
    }

    with open('results/metrics_v2/lead_time.json', 'w') as f:
        json.dump(lead_time_output, f, indent=2)
    print("Saved results/metrics_v2/lead_time.json")

    # Generate Engine 1 plot (light and dark)
    def plot_engine_1(dark=False):
        plt.style.use('default')
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), sharex=True, gridspec_kw={'height_ratios': [2, 1]})

        bg_color = '#0f172a' if dark else '#ffffff'
        text_color = '#f8fafc' if dark else '#0f172a'
        grid_color = '#334155' if dark else '#e2e8f0'

        fig.patch.set_facecolor(bg_color)
        ax1.set_facecolor(bg_color)
        ax2.set_facecolor(bg_color)

        c = engine_1_data['cycles']
        true_rul = engine_1_data['true_ruls']
        lstm_pred = engine_1_data['lstm_preds']
        rf_st = engine_1_data['rf_stages']
        anom = engine_1_data['iforest_anomalies']

        # True boundaries
        t_deg = int(edf[edf['engine_id'] == 1]['deg_true_cycle'].values[0])
        t_crit = int(edf[edf['engine_id'] == 1]['crit_true_cycle'].values[0])

        # Top panel: RUL
        ax1.plot(c, true_rul, label='True RUL (Ground Truth)', color='#2563eb' if not dark else '#38bdf8', linewidth=2.0)
        ax1.plot(c, lstm_pred, label='LSTM Predicted RUL (Clipped 125)', color='#ea580c' if not dark else '#fb923c', linewidth=2.0, linestyle='--')
        ax1.axvline(x=t_deg, color='#eab308', linestyle=':', linewidth=1.5, label=f'True Degrading Boundary (Cycle {t_deg})')
        ax1.axvline(x=t_crit, color='#dc2626', linestyle=':', linewidth=1.5, label=f'True Critical Boundary (Cycle {t_crit})')

        ax1.set_ylabel('Remaining Useful Life (Cycles)', fontsize=10, color=text_color)
        ax1.legend(loc='upper right', framealpha=0.9, fontsize=9)
        ax1.grid(True, linestyle='--', alpha=0.5, color=grid_color)
        ax1.tick_params(colors=text_color)
        for spine in ax1.spines.values():
            spine.set_color(grid_color)

        # Bottom panel: RF stage step line and IForest triggers
        ax2.step(c, rf_st, where='mid', label='Random Forest Health Stage (0:H, 1:D, 2:C)', color='#059669' if not dark else '#34d399', linewidth=2.0)
        
        # Plot IForest triggers
        anom_cycles = c[anom == 1]
        if len(anom_cycles) > 0:
            ax2.scatter(anom_cycles, np.full_like(anom_cycles, 2.15), marker='v', color='#dc2626', s=45, label='Isolation Forest Anomaly Trigger', zorder=5)

        ax2.axvline(x=t_deg, color='#eab308', linestyle=':', linewidth=1.5)
        ax2.axvline(x=t_crit, color='#dc2626', linestyle=':', linewidth=1.5)

        ax2.set_xlabel('Flight Cycle', fontsize=10, color=text_color)
        ax2.set_ylabel('Health Stage', fontsize=10, color=text_color)
        ax2.set_yticks([0, 1, 2])
        ax2.set_yticklabels(['Healthy (0)', 'Degrading (1)', 'Critical (2)'], color=text_color)
        ax2.set_ylim(-0.2, 2.4)
        ax2.legend(loc='upper left', framealpha=0.9, fontsize=9)
        ax2.grid(True, linestyle='--', alpha=0.5, color=grid_color)
        ax2.tick_params(colors=text_color)
        for spine in ax2.spines.values():
            spine.set_color(grid_color)

        suffix = '_dark' if dark else '_light'
        out_png = f'docs/submission/figures/engine_1_trajectory{suffix}.png'
        plt.tight_layout()
        plt.savefig(out_png, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
        plt.close()
        print(f"Saved {out_png}")

    plot_engine_1(dark=False)
    plot_engine_1(dark=True)
    print("Lead time analysis complete.")


if __name__ == '__main__':
    run_lead_time_analysis()
