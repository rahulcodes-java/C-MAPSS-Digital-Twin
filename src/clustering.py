import pickle
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.metrics import silhouette_score, adjusted_rand_score
from preprocessing import load_cleaned_data

def extract_engine_profiles(df):
    sensor_cols = [c for c in df.columns if c.startswith('sensor')]
    # Group by engine and extract mean and std for each sensor
    profiles = df.groupby('engine_id')[sensor_cols].agg(['mean', 'std']).reset_index()
    # Flatten multi-level columns
    profiles.columns = ['engine_id'] + [f"{col[0]}_{col[1]}" for col in profiles.columns[1:]]
    
    # Get the final health stage (or majority) as a proxy for true fault mode
    labels = df.groupby('engine_id')['health_stage'].agg(lambda x: x.mode()[0]).reset_index()
    
    return profiles, labels['health_stage']

def run_clustering():
    print("Loading data...")
    df = load_cleaned_data('../data/processed/FD001_cleaned.csv')
    
    train_engines = df[df['engine_id'] <= 80]
    X_profiles, y_true = extract_engine_profiles(train_engines)
    X = X_profiles.drop(columns=['engine_id'])
    
    best_k = 2
    best_silhouette = -1
    best_kmeans = None
    
    print("\n--- K-Means Clustering ---")
    for k in [2, 3, 4]:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        
        sil_score = silhouette_score(X, labels)
        ari = adjusted_rand_score(y_true, labels)
        
        print(f"K={k}: Silhouette={sil_score:.4f}, ARI={ari:.4f}")
        
        if sil_score > best_silhouette:
            best_silhouette = sil_score
            best_k = k
            best_kmeans = kmeans
            
    print(f"\nBest K is {best_k} with Silhouette={best_silhouette:.4f}")
    
    # Save best kmeans model
    with open('../models/kmeans_model.pkl', 'wb') as f:
        pickle.dump(best_kmeans, f)
        
    print("\n--- Hierarchical Clustering ---")
    # For jaccard, we would need binary data, we'll use euclidean or cosine for continuous features
    hierarchical = AgglomerativeClustering(n_clusters=best_k, metric='euclidean', linkage='ward')
    h_labels = hierarchical.fit_predict(X)
    h_sil = silhouette_score(X, h_labels)
    h_ari = adjusted_rand_score(y_true, h_labels)
    
    print(f"Hierarchical K={best_k}: Silhouette={h_sil:.4f}, ARI={h_ari:.4f}")

if __name__ == "__main__":
    run_clustering()
