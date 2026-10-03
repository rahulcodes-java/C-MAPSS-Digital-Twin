import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error
from preprocessing import load_cleaned_data

def run_rul_prediction():
    print("Loading data for RUL prediction...")
    df = load_cleaned_data('../data/processed/FD001_cleaned.csv')
    
    # Train/Val/Test Split based on engines
    train_engines = df[df['engine_id'] <= 80]
    test_engines = df[df['engine_id'] > 90]
    
    sensor_cols = [c for c in df.columns if c.startswith('sensor')]
    features = sensor_cols + [c for c in df.columns if c.startswith('op_')]
    target = 'RUL'
    
    X_train = train_engines[features]
    y_train = train_engines[target]
    
    X_test = test_engines[features]
    y_test = test_engines[target]
    
    print("\n--- Training RUL Regressor ---")
    regressor = LinearRegression()
    regressor.fit(X_train, y_train)
    
    preds = regressor.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    
    print(f"RUL Prediction Results:")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    
    with open('../models/rul_regressor.pkl', 'wb') as f:
        pickle.dump(regressor, f)
        
    print("RUL Regressor saved.")
    
    # Save a few predictions for dashboard evaluation
    predictions_df = pd.DataFrame({
        'engine_id': test_engines['engine_id'],
        'cycle': test_engines['cycle'],
        'actual_RUL': y_test,
        'predicted_RUL': preds
    })
    predictions_df.to_csv('../results/rul_predictions.csv', index=False)

if __name__ == "__main__":
    run_rul_prediction()
