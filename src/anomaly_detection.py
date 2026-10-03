import pickle
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, roc_auc_score
from preprocessing import load_cleaned_data, preprocess

def run_anomaly_detection():
    print("Loading data...")
    df = load_cleaned_data('../data/processed/FD001_cleaned.csv')
    X_train, X_val, X_test, y_train, y_val, y_test = preprocess(df)
    
    # We will train isolation forest on train data
    print("\n--- Training Isolation Forest ---")
    # For anomaly detection, contamination refers to expected proportion of outliers.
    # In C-MAPSS, late stages of engine degradation could be seen as "anomalous" wrt healthy operation.
    iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    
    # Train on just normal/healthy data if we wanted pure anomaly detection,
    # but here we'll fit on X_train directly as requested.
    iso_forest.fit(X_train)
    
    # Predict anomalies (-1 for anomaly, 1 for normal)
    preds = iso_forest.predict(X_test)
    
    # For evaluation, let's say critical stage (label 2) are true anomalies
    true_anomalies = (y_test == 2).astype(int)
    pred_anomalies = (preds == -1).astype(int)
    
    precision = precision_score(true_anomalies, pred_anomalies)
    recall = recall_score(true_anomalies, pred_anomalies)
    roc_auc = roc_auc_score(true_anomalies, iso_forest.decision_function(X_test))
    
    print("Anomaly Detection Results (against critical health stage):")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"ROC-AUC: {roc_auc:.4f}")
    
    # Save model
    with open('../models/isolation_forest.pkl', 'wb') as f:
        pickle.dump(iso_forest, f)
    
    print("Isolation Forest saved.")

if __name__ == "__main__":
    run_anomaly_detection()
