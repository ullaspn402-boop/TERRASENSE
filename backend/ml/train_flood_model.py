import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix, roc_curve
)

def generate_environmental_dataset(n_samples=5000, random_seed=42):
    np.random.seed(random_seed)
    
    # Generate realistic hydrological & environmental time-series simulation
    # 1. 24h Rainfall (mm): log-normal with zero-inflation
    rainfall_raw = np.random.exponential(scale=22.0, size=n_samples)
    rainfall_24h_mm = np.clip(rainfall_raw * (np.random.rand(n_samples) > 0.2), 0, 220.0)
    
    # 2. 72h Antecedent Rainfall (mm) correlated with 24h
    rainfall_72h_mm = np.clip(rainfall_24h_mm * np.random.uniform(1.4, 2.8, size=n_samples) + np.random.exponential(scale=18.0, size=n_samples), 0, 420.0)
    
    # 3. Soil Saturation (%): high baseline after rain
    soil_saturation_pct = np.clip(30.0 + (rainfall_72h_mm / 420.0) * 65.0 + np.random.normal(0, 7.0, size=n_samples), 15.0, 100.0)
    
    # 4. River Gauge Level (meters): baseline 2.5m, swells with rainfall and saturation
    river_gauge_m = np.clip(2.0 + (rainfall_24h_mm * 0.04) + (rainfall_72h_mm * 0.02) * (soil_saturation_pct / 100.0) + np.random.normal(0, 0.4, size=n_samples), 0.8, 14.5)
    
    # 5. Geographic terrain: Elevation (meters above datum)
    elevation_m = np.random.uniform(6.0, 110.0, size=n_samples)
    
    # 6. Slope (degrees)
    slope_degrees = np.random.uniform(0.5, 28.0, size=n_samples)
    
    # 7. Impervious surface fraction (%)
    impervious_surface_pct = np.random.uniform(10.0, 92.0, size=n_samples)
    
    # 8. Drainage capacity (m^3/s)
    drainage_capacity_m3s = np.random.uniform(15.0, 110.0, size=n_samples)
    
    # Hydrological flood potential equation based on water balance mechanics
    # Inflow pressure: surface runoff from recent precipitation, enhanced by saturation & urban imperviousness
    runoff_potential = (rainfall_24h_mm * 0.50 + rainfall_72h_mm * 0.20) * (soil_saturation_pct / 100.0) * (0.6 + impervious_surface_pct / 150.0)
    
    # Outflow resistance: drainage throughput and elevation gradient relief
    channel_stress = (river_gauge_m / 4.0) * 20.0
    drainage_relief = (drainage_capacity_m3s / 100.0) * 22.0 + (elevation_m / 100.0) * 15.0
    
    latent_hazard = runoff_potential + channel_stress - drainage_relief + np.random.normal(0, 4.5, size=n_samples)
    
    # Binary flood occurrence: threshold at ~75th percentile of extreme events
    flood_threshold = 28.0
    flood_occurred = (latent_hazard > flood_threshold).astype(int)
    
    df = pd.DataFrame({
        'rainfall_24h_mm': np.round(rainfall_24h_mm, 2),
        'rainfall_72h_mm': np.round(rainfall_72h_mm, 2),
        'river_gauge_m': np.round(river_gauge_m, 2),
        'soil_saturation_pct': np.round(soil_saturation_pct, 1),
        'elevation_m': np.round(elevation_m, 1),
        'slope_degrees': np.round(slope_degrees, 1),
        'impervious_surface_pct': np.round(impervious_surface_pct, 1),
        'drainage_capacity_m3s': np.round(drainage_capacity_m3s, 1),
        'flood_occurred': flood_occurred
    })
    return df

def train_and_evaluate():
    print("Generating synthetic hydrological & environmental training dataset...")
    df = generate_environmental_dataset(n_samples=5000)
    print(f"Dataset generated: {len(df)} records. Flood positive class rate: {df['flood_occurred'].mean():.2%}")
    
    feature_cols = [
        'rainfall_24h_mm', 'rainfall_72h_mm', 'river_gauge_m',
        'soil_saturation_pct', 'elevation_m', 'slope_degrees',
        'impervious_surface_pct', 'drainage_capacity_m3s'
    ]
    
    # Time-ordered sequential split (first 80% train, last 20% test) to prevent temporal leakage
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    X_train = train_df[feature_cols].values
    y_train = train_df['flood_occurred'].values
    
    X_test = test_df[feature_cols].values
    y_test = test_df['flood_occurred'].values
    
    print(f"Training set: {len(X_train)} samples. Test set: {len(X_test)} samples.")
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training Random Forest Classifier model...")
    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=10,
        min_samples_split=6,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate on held-out test split
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_proba))
    pr_auc = float(average_precision_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    # ROC curve sampling (downsampled for lightweight API reporting)
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_points = []
    step = max(1, len(fpr) // 25)
    for i in range(0, len(fpr), step):
        roc_points.append({"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)})
    if roc_points[-1]["fpr"] != 1.0:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})
        
    # Feature importances
    importances = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(zip(feature_cols, model.feature_importances_), key=lambda x: x[1], reverse=True)
    ]
    
    metrics = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 120,
        "features": feature_cols,
        "sample_size": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "positive_rate": round(float(df['flood_occurred'].mean()), 4),
        "evaluation": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "confusion_matrix": cm,
            "roc_curve": roc_points
        },
        "feature_importances": importances,
        "trained_at": pd.Timestamp.now().isoformat()
    }
    
    # Save artifacts
    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)
    
    model_path = os.path.join(out_dir, "flood_model.joblib")
    joblib.dump({
        "model": model,
        "scaler": scaler,
        "feature_cols": feature_cols
    }, model_path)
    
    metrics_path = os.path.join(out_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    dataset_path = os.path.join(out_dir, "environmental_train_sample.csv")
    df.head(500).to_csv(dataset_path, index=False)
    
    print("\n=== Model Training and Evaluation Complete ===")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    print(f"Model saved to: {model_path}")
    print(f"Metrics saved to: {metrics_path}")

if __name__ == "__main__":
    train_and_evaluate()
