import pandas as pd
import numpy as np

def run_scheduler(rul_preds_path='../results/rul_predictions.csv'):
    """
    Cost-aware maintenance scheduler.
    
    Cost matrix:
      - False alarm (schedule when not needed): cost = 1000
      - Missed failure (no schedule when critical): cost = 10000
    
    Threshold: trigger maintenance when predicted RUL < threshold.
    """
    print("Loading RUL predictions...")
    df = pd.read_csv(rul_preds_path)

    # Adaptive threshold: trigger alert when predicted RUL is in bottom 20th percentile
    THRESHOLD = int(df['predicted_RUL'].quantile(0.20))  # data-driven cutoff
    FALSE_ALARM_COST = 1000
    MISSED_FAILURE_COST = 10000

    # Actual failure: actual_RUL < THRESHOLD
    actual_critical = (df['actual_RUL'] < THRESHOLD).astype(int)
    # Predicted alert: predicted_RUL < THRESHOLD
    pred_alert = (df['predicted_RUL'] < THRESHOLD).astype(int)

    false_alarms = ((pred_alert == 1) & (actual_critical == 0)).sum()
    missed_failures = ((pred_alert == 0) & (actual_critical == 1)).sum()
    correct_alerts = ((pred_alert == 1) & (actual_critical == 1)).sum()

    twin_cost = false_alarms * FALSE_ALARM_COST + missed_failures * MISSED_FAILURE_COST
    
    # Baseline: time-based (always schedule at fixed intervals, e.g., every 50 cycles)
    # This hits every cycle <= 50 as a "scheduled maintenance"
    baseline_alerts = (df['cycle'] % 50 == 0).astype(int)
    baseline_false_alarms = ((baseline_alerts == 1) & (actual_critical == 0)).sum()
    baseline_missed = ((baseline_alerts == 0) & (actual_critical == 1)).sum()
    baseline_cost = baseline_false_alarms * FALSE_ALARM_COST + baseline_missed * MISSED_FAILURE_COST

    savings_pct = ((baseline_cost - twin_cost) / max(baseline_cost, 1)) * 100

    print(f"\n--- Cost-Aware Scheduling Results ---")
    print(f"Threshold: RUL < {THRESHOLD} cycles")
    print(f"Correct Alerts:    {correct_alerts}")
    print(f"False Alarms:      {false_alarms}  (cost ${false_alarms * FALSE_ALARM_COST:,})")
    print(f"Missed Failures:   {missed_failures} (cost ${missed_failures * MISSED_FAILURE_COST:,})")
    print(f"Total Twin Cost:   ${twin_cost:,}")
    print(f"Baseline Cost:     ${baseline_cost:,}")
    print(f"Cost Savings:      {savings_pct:.1f}% vs time-based maintenance")

    # Build a maintenance schedule per engine
    schedule = df[pred_alert == 1][['engine_id', 'cycle', 'predicted_RUL']].copy()
    schedule = schedule.sort_values(['engine_id', 'cycle'])
    schedule['recommended_action'] = 'Schedule Maintenance'
    schedule['cost_estimate'] = FALSE_ALARM_COST  # conservative estimate
    schedule.to_csv('../results/maintenance_schedule.csv', index=False)
    print(f"\nMaintenance schedule saved -> {len(schedule)} maintenance windows generated.")

    return {
        'twin_cost': twin_cost,
        'baseline_cost': baseline_cost,
        'savings_pct': savings_pct,
        'false_alarms': int(false_alarms),
        'missed_failures': int(missed_failures)
    }

if __name__ == "__main__":
    run_scheduler()
