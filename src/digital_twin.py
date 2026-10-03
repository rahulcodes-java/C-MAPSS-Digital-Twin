import pickle
import pandas as pd
import numpy as np
import os

class DigitalTwin:
    def __init__(self, models_dir='../models'):
        self.models_dir = models_dir
        self.classifier = self._load_model('classifier.pkl')
        self.clusterer = self._load_model('kmeans_model.pkl')
        self.anomaly_detector = self._load_model('isolation_forest.pkl')
        self.feature_importance = self._load_feature_importance()
    
    def _load_model(self, filename):
        path = os.path.join(self.models_dir, filename)
        if os.path.exists(path):
            with open(path, 'rb') as f:
                return pickle.load(f)
        return None
        
    def _load_feature_importance(self):
        path = '../results/feature_importance.csv'
        if os.path.exists(path):
            df = pd.read_csv(path)
            return df['feature'].head(3).tolist()
        return ['sensor_1', 'sensor_2', 'sensor_3'] # Fallback
    
    def predict(self, sensor_readings):
        """Given sensor values (as 2D array/DataFrame), return twin's assessment"""
        if self.classifier is None or self.anomaly_detector is None:
            return {"error": "Models not loaded"}
            
        health_stage = self.classifier.predict(sensor_readings)[0]
        
        # Predict Probabilities
        if hasattr(self.classifier, 'predict_proba'):
            conf = self.classifier.predict_proba(sensor_readings).max()
        else:
            conf = 1.0
            
        iso_pred = self.anomaly_detector.predict(sensor_readings)[0]
        is_anomalous = True if iso_pred == -1 else False
        
        return {
            'health_stage': int(health_stage),
            'is_anomalous': is_anomalous,
            'top_sensors': self.feature_importance,
            'confidence': float(conf)
        }

if __name__ == "__main__":
    print("Initializing Digital Twin...")
    twin = DigitalTwin()
    print("Digital Twin loaded successfully.")
