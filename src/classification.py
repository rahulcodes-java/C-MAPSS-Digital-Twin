import pickle
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import cross_val_score
import pandas as pd

from preprocessing import load_cleaned_data, preprocess

def train_and_evaluate():
    print("Loading and preprocessing data...")
    df = load_cleaned_data('../data/processed/FD001_cleaned.csv')
    X_train, X_val, X_test, y_train, y_val, y_test = preprocess(df)
    
    print("\n--- Decision Tree Classifier ---")
    dt = DecisionTreeClassifier(random_state=42, max_depth=10)
    dt.fit(X_train, y_train)
    dt_preds = dt.predict(X_test)
    
    print("Decision Tree Confusion Matrix:")
    print(confusion_matrix(y_test, dt_preds))
    print("Decision Tree F1-Score (Macro):", f1_score(y_test, dt_preds, average='macro'))
    
    print("\n--- Naive Bayes Classifier ---")
    nb = GaussianNB()
    nb.fit(X_train, y_train)
    nb_preds = nb.predict(X_test)
    
    print("Naive Bayes Confusion Matrix:")
    print(confusion_matrix(y_test, nb_preds))
    print("Naive Bayes F1-Score (Macro):", f1_score(y_test, nb_preds, average='macro'))
    
    # Save models
    with open('../models/classifier.pkl', 'wb') as f:
        pickle.dump(dt, f)
        
    print("\nExtracting Feature Importance from Decision Tree...")
    importance = pd.DataFrame({'feature': X_train.columns, 'importance': dt.feature_importances_})
    importance = importance.sort_values('importance', ascending=False)
    print("Top 10 Important Features:")
    print(importance.head(10))
    
    # Save feature importance
    importance.to_csv('../results/feature_importance.csv', index=False)

if __name__ == "__main__":
    train_and_evaluate()
