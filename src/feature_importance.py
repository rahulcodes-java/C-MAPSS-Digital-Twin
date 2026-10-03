import pandas as pd
import pickle
import numpy as np

def compute_feature_importance(classifier_path='../models/classifier.pkl',
                                cleaned_csv='../data/processed/FD001_cleaned.csv'):
    df = pd.read_csv(cleaned_csv)
    sensor_cols = [c for c in df.columns if c.startswith('sensor')]
    op_cols = [c for c in df.columns if c.startswith('op_')]
    feature_names = sensor_cols + op_cols

    with open(classifier_path, 'rb') as f:
        classifier = pickle.load(f)

    importance = pd.DataFrame({
        'feature': feature_names,
        'importance': classifier.feature_importances_
    }).sort_values('importance', ascending=False)

    print("Top 10 Most Important Features (Decision Tree):")
    print(importance.head(10).to_string(index=False))
    importance.to_csv('../results/feature_importance.csv', index=False)
    return importance

if __name__ == "__main__":
    compute_feature_importance()
