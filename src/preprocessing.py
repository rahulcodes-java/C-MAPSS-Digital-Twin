import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split

def load_cleaned_data(filepath):
    return pd.read_csv(filepath)

def preprocess(df):
    print(f"Original shape: {df.shape}")
    
    # Feature selection: drop features with correlation > 0.95
    sensor_cols = [c for c in df.columns if c.startswith('sensor')]
    corr_matrix = df[sensor_cols].corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    to_drop = [column for column in upper.columns if any(upper[column] > 0.95)]
    
    print(f"Dropping {len(to_drop)} highly correlated sensors: {to_drop}")
    df = df.drop(columns=to_drop)
    
    remaining_sensors = [c for c in df.columns if c.startswith('sensor')]
    
    # Train/Val/Test Split based on engines
    train_engines = df[df['engine_id'] <= 80]
    val_engines = df[(df['engine_id'] > 80) & (df['engine_id'] <= 90)]
    test_engines = df[df['engine_id'] > 90]
    
    features = remaining_sensors + [c for c in df.columns if c.startswith('op_')]
    target = 'health_stage'
    
    X_train = train_engines[features]
    y_train = train_engines[target]
    
    X_val = val_engines[features]
    y_val = val_engines[target]
    
    X_test = test_engines[features]
    y_test = test_engines[target]
    
    print(f"Class distribution before SMOTE (Train):\n{y_train.value_counts()}")
    
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    
    print(f"Class distribution after SMOTE (Train):\n{pd.Series(y_train_res).value_counts()}")
    
    print(f"Train size: {X_train_res.shape[0]}, Val size: {X_val.shape[0]}, Test size: {X_test.shape[0]}")
    
    return X_train_res, X_val, X_test, y_train_res, y_val, y_test

if __name__ == "__main__":
    df = load_cleaned_data('../data/processed/FD001_cleaned.csv')
    X_train, X_val, X_test, y_train, y_val, y_test = preprocess(df)
