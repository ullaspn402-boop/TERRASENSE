import os
import json
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.services.environmental_engine import (
    calculate_flood_current_risk,
    calculate_heat_stress,
    calculate_aqi,
    calculate_water_quality,
    calculate_soil_risk
)
from backend.services.decision_engine import (
    generate_decision,
    explain_prediction
)

app = FastAPI(
    title="TerraSense AI Environmental Decision API",
    description="Real-time multi-hazard environmental risk assessment, ML flood forecasting, and decision intelligence engine.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Trained Machine Learning Model & Metrics
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "flood_model.joblib")
METRICS_PATH = os.path.join(BASE_DIR, "models", "metrics.json")

ml_artifacts = None
ml_metrics = None

try:
    if os.path.exists(MODEL_PATH):
        ml_artifacts = joblib.load(MODEL_PATH)
        print(f"[ML] Successfully loaded trained model from {MODEL_PATH}")
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            ml_metrics = json.load(f)
        print(f"[ML] Loaded genuine model evaluation metrics.")
except Exception as e:
    print(f"[ML WARNING] Error loading ML model/metrics: {e}")

LOCATIONS = [
    {
        "id": "riverbend",
        "name": "Riverbend District",
        "region": "North Basin",
        "status": "active",
        "coordinates": {"lat": 42.3601, "lon": -71.0589},
        "elevation_m": 14.0,
        "slope_degrees": 2.5,
        "impervious_surface_pct": 68.0,
        "drainage_capacity_m3s": 42.0,
        "description": "Dense urban floodplain near river confluence. High runoff sensitivity."
    },
    {
        "id": "north-basin",
        "name": "North Basin",
        "region": "Upper Catchment",
        "status": "active",
        "coordinates": {"lat": 42.4200, "lon": -71.1200},
        "elevation_m": 72.0,
        "slope_degrees": 15.0,
        "impervious_surface_pct": 28.0,
        "drainage_capacity_m3s": 85.0,
        "description": "Steep headwater terrain with rapid stormwater routing and hillside soils."
    },
    {
        "id": "east-valley",
        "name": "East Valley",
        "region": "Lower Basin",
        "status": "active",
        "coordinates": {"lat": 42.3200, "lon": -71.0100},
        "elevation_m": 26.0,
        "slope_degrees": 4.0,
        "impervious_surface_pct": 74.0,
        "drainage_capacity_m3s": 55.0,
        "description": "Industrial and logistics zone with high thermal mass and vehicular emissions."
    },
    {
        "id": "harbor-coast",
        "name": "Harbor Coastline",
        "region": "Estuary Outflow",
        "status": "active",
        "coordinates": {"lat": 42.3400, "lon": -70.9800},
        "elevation_m": 6.5,
        "slope_degrees": 1.2,
        "impervious_surface_pct": 52.0,
        "drainage_capacity_m3s": 60.0,
        "description": "Coastal tidal interface sensitive to storm surges, salinity, and water quality."
    }
]

# Baseline simulated environmental sensor readings per location
LOCATION_BASELINES = {
    "riverbend": {
        "rainfall_24h_mm": 44.5,
        "rainfall_72h_mm": 92.0,
        "river_gauge_m": 4.15,
        "soil_saturation_pct": 84.0,
        "temperature_c": 28.5,
        "humidity_pct": 78.0,
        "pm25": 18.2,
        "pm10": 34.0,
        "no2": 32.0,
        "co": 1.4,
        "ph": 7.35,
        "turbidity_ntu": 4.8,
        "dissolved_oxygen_mg_l": 6.8,
        "conductivity_us_cm": 280.0,
        "tds_mg_l": 190.0,
        "vegetation_cover_pct": 32.0,
        "compaction_kpa": 160.0
    },
    "north-basin": {
        "rainfall_24h_mm": 58.0,
        "rainfall_72h_mm": 115.0,
        "river_gauge_m": 2.80,
        "soil_saturation_pct": 72.0,
        "temperature_c": 23.0,
        "humidity_pct": 82.0,
        "pm25": 9.4,
        "pm10": 16.0,
        "no2": 14.0,
        "co": 0.6,
        "ph": 7.1,
        "turbidity_ntu": 2.1,
        "dissolved_oxygen_mg_l": 8.4,
        "conductivity_us_cm": 140.0,
        "tds_mg_l": 95.0,
        "vegetation_cover_pct": 78.0,
        "compaction_kpa": 120.0
    },
    "east-valley": {
        "rainfall_24h_mm": 22.0,
        "rainfall_72h_mm": 45.0,
        "river_gauge_m": 2.40,
        "soil_saturation_pct": 54.0,
        "temperature_c": 34.2,
        "humidity_pct": 62.0,
        "pm25": 42.5,
        "pm10": 78.0,
        "no2": 58.0,
        "co": 2.8,
        "ph": 7.6,
        "turbidity_ntu": 3.4,
        "dissolved_oxygen_mg_l": 6.1,
        "conductivity_us_cm": 360.0,
        "tds_mg_l": 240.0,
        "vegetation_cover_pct": 24.0,
        "compaction_kpa": 210.0
    },
    "harbor-coast": {
        "rainfall_24h_mm": 31.0,
        "rainfall_72h_mm": 68.0,
        "river_gauge_m": 3.60,
        "soil_saturation_pct": 68.0,
        "temperature_c": 26.5,
        "humidity_pct": 88.0,
        "pm25": 14.0,
        "pm10": 28.0,
        "no2": 24.0,
        "co": 0.9,
        "ph": 8.1,
        "turbidity_ntu": 6.2,
        "dissolved_oxygen_mg_l": 5.4,
        "conductivity_us_cm": 850.0,
        "tds_mg_l": 620.0,
        "vegetation_cover_pct": 45.0,
        "compaction_kpa": 140.0
    }
}

class ScenarioRequest(BaseModel):
    rainfall_24h_mm: Optional[float] = Field(ge=0, le=300, default=None)
    rainfall_72h_mm: Optional[float] = Field(ge=0, le=600, default=None)
    river_gauge_m: Optional[float] = Field(ge=0.5, le=15.0, default=None)
    soil_saturation_pct: Optional[float] = Field(ge=0, le=100, default=None)
    temperature_c: Optional[float] = Field(ge=-20, le=55, default=None)
    humidity_pct: Optional[float] = Field(ge=0, le=100, default=None)

def run_ml_flood_prediction(features: Dict[str, float]) -> Dict[str, Any]:
    """
    Executes actual ML inference using the trained Random Forest model.
    """
    if not ml_artifacts:
        # Fallback if model not loaded
        raw_prob = min(0.99, max(0.01, (features.get("rainfall_24h_mm", 20) * 0.45 + features.get("soil_saturation_pct", 50) * 0.3) / 100))
        return {
            "flood_probability": round(float(raw_prob), 4),
            "predicted_flood": bool(raw_prob >= 0.5),
            "model_confidence": 0.82,
            "status": "Model fallback"
        }

    model = ml_artifacts["model"]
    scaler = ml_artifacts["scaler"]
    feature_cols = ml_artifacts["feature_cols"]

    # Assemble feature vector in exact training order
    vec = [features.get(col, 0.0) for col in feature_cols]
    vec_scaled = scaler.transform([vec])

    proba = float(model.predict_proba(vec_scaled)[0, 1])
    pred = bool(proba >= 0.5)

    # Estimate tree consensus confidence
    # (distance of individual tree predictions from 0.5)
    tree_preds = [tree.predict_proba(vec_scaled)[0, 1] for tree in model.estimators_]
    std_dev = float(np.std(tree_preds))
    confidence = round(max(0.65, min(0.98, 1.0 - std_dev * 1.2)), 3)

    return {
        "flood_probability": round(proba, 4),
        "predicted_flood": pred,
        "model_confidence": confidence,
        "status": "Trained RandomForestClassifier active"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "terrasense-ai-api",
        "ml_model_loaded": ml_artifacts is not None,
        "evaluation_metrics_available": ml_metrics is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/locations")
def get_locations():
    return {
        "items": LOCATIONS,
        "data_notice": "Demo / Sample Data (Simulated telemetry calibrated to realistic regional hydrology)"
    }

@app.get("/environmental/{location_id}")
def get_environmental_data(location_id: str):
    location = next((loc for loc in LOCATIONS if loc["id"] == location_id), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")
    
    raw = LOCATION_BASELINES.get(location_id, LOCATION_BASELINES["riverbend"]).copy()
    raw.update({
        "elevation_m": location["elevation_m"],
        "slope_degrees": location["slope_degrees"],
        "impervious_surface_pct": location["impervious_surface_pct"],
        "drainage_capacity_m3s": location["drainage_capacity_m3s"],
    })

    now = datetime.now(timezone.utc).isoformat()
    return {
        "location": location,
        "sensor_readings": raw,
        "data_notice": "Demo / Sample Data",
        "updated_at": now
    }

@app.get("/risk/{location_id}")
def get_risk_assessment(location_id: str):
    location = next((loc for loc in LOCATIONS if loc["id"] == location_id), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    raw = LOCATION_BASELINES.get(location_id, LOCATION_BASELINES["riverbend"]).copy()
    raw.update({
        "elevation_m": location["elevation_m"],
        "slope_degrees": location["slope_degrees"],
        "impervious_surface_pct": location["impervious_surface_pct"],
        "drainage_capacity_m3s": location["drainage_capacity_m3s"],
    })

    # 1. Current Flood Risk (Physical Hydrological Rules)
    current_flood = calculate_flood_current_risk(raw)

    # 2. Predicted Flood Risk (Real Trained ML Model)
    ml_flood = run_ml_flood_prediction(raw)

    # 3. Heat Stress Assessment (NOAA Formula)
    heat = calculate_heat_stress(raw["temperature_c"], raw["humidity_pct"])

    # 4. Air Quality Assessment (EPA AQI Breakpoints)
    air = calculate_aqi({
        "pm25": raw["pm25"],
        "pm10": raw["pm10"],
        "no2": raw["no2"],
        "co": raw["co"]
    })

    # 5. Water Quality Assessment (WQI Formula)
    water = calculate_water_quality({
        "ph": raw["ph"],
        "turbidity_ntu": raw["turbidity_ntu"],
        "dissolved_oxygen_mg_l": raw["dissolved_oxygen_mg_l"],
        "conductivity_us_cm": raw["conductivity_us_cm"],
        "tds_mg_l": raw["tds_mg_l"]
    })

    # 6. Soil Instability & Erosion Risk
    soil = calculate_soil_risk({
        "soil_moisture_pct": raw["soil_saturation_pct"],
        "slope_degrees": raw["slope_degrees"],
        "vegetation_cover_pct": raw["vegetation_cover_pct"],
        "compaction_kpa": raw["compaction_kpa"]
    })

    # 7. Decision Engine Synthesis
    decision_output = generate_decision(current_flood, ml_flood, heat, air, water, soil)

    # 8. Explainable AI Factor Breakdown
    importances = ml_metrics.get("feature_importances", []) if ml_metrics else []
    explanations = explain_prediction(raw, importances)

    now = datetime.now(timezone.utc).isoformat()
    return {
        "location": location,
        "sensor_readings": raw,
        "data_notice": "Demo / Sample Data (Simulated telemetry evaluated through live ML & scientific models)",
        "updated_at": now,
        "flood": {
            "current_risk": current_flood,
            "ml_prediction": ml_flood,
            "combined_score": decision_output["composite_scores"]["Flood"],
            "combined_level": "Critical" if decision_output["composite_scores"]["Flood"] >= 75 else "High" if decision_output["composite_scores"]["Flood"] >= 55 else "Moderate" if decision_output["composite_scores"]["Flood"] >= 35 else "Low"
        },
        "heat": heat,
        "air_quality": air,
        "water_quality": water,
        "soil": soil,
        "decision_engine": decision_output,
        "explainable_ai": {
            "factors": explanations[:5],
            "model_feature_importances": importances[:6]
        }
    }

@app.post("/risk/{location_id}/what-if")
def run_what_if_scenario(location_id: str, scenario: ScenarioRequest):
    location = next((loc for loc in LOCATIONS if loc["id"] == location_id), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    baseline = LOCATION_BASELINES.get(location_id, LOCATION_BASELINES["riverbend"]).copy()
    baseline.update({
        "elevation_m": location["elevation_m"],
        "slope_degrees": location["slope_degrees"],
        "impervious_surface_pct": location["impervious_surface_pct"],
        "drainage_capacity_m3s": location["drainage_capacity_m3s"],
    })

    # Prepare modified scenario parameters
    modified = baseline.copy()
    if scenario.rainfall_24h_mm is not None:
        modified["rainfall_24h_mm"] = scenario.rainfall_24h_mm
        # Recalculate 72h antecedent correlation if not provided
        if scenario.rainfall_72h_mm is None:
            modified["rainfall_72h_mm"] = scenario.rainfall_24h_mm * 2.1
    if scenario.rainfall_72h_mm is not None:
        modified["rainfall_72h_mm"] = scenario.rainfall_72h_mm
    if scenario.river_gauge_m is not None:
        modified["river_gauge_m"] = scenario.river_gauge_m
    if scenario.soil_saturation_pct is not None:
        modified["soil_saturation_pct"] = scenario.soil_saturation_pct
    if scenario.temperature_c is not None:
        modified["temperature_c"] = scenario.temperature_c
    if scenario.humidity_pct is not None:
        modified["humidity_pct"] = scenario.humidity_pct

    # Run engines on Baseline
    b_curr_flood = calculate_flood_current_risk(baseline)
    b_ml_flood = run_ml_flood_prediction(baseline)
    b_heat = calculate_heat_stress(baseline["temperature_c"], baseline["humidity_pct"])
    b_air = calculate_aqi({"pm25": baseline["pm25"], "pm10": baseline["pm10"], "no2": baseline["no2"], "co": baseline["co"]})
    b_water = calculate_water_quality({
        "ph": baseline["ph"], "turbidity_ntu": baseline["turbidity_ntu"],
        "dissolved_oxygen_mg_l": baseline["dissolved_oxygen_mg_l"],
        "conductivity_us_cm": baseline["conductivity_us_cm"], "tds_mg_l": baseline["tds_mg_l"]
    })
    b_soil = calculate_soil_risk({
        "soil_moisture_pct": baseline["soil_saturation_pct"],
        "slope_degrees": baseline["slope_degrees"],
        "vegetation_cover_pct": baseline["vegetation_cover_pct"],
        "compaction_kpa": baseline["compaction_kpa"]
    })
    b_decision = generate_decision(b_curr_flood, b_ml_flood, b_heat, b_air, b_water, b_soil)

    # Run engines on Scenario
    s_curr_flood = calculate_flood_current_risk(modified)
    s_ml_flood = run_ml_flood_prediction(modified)
    s_heat = calculate_heat_stress(modified["temperature_c"], modified["humidity_pct"])
    s_air = calculate_aqi({"pm25": modified["pm25"], "pm10": modified["pm10"], "no2": modified["no2"], "co": modified["co"]})
    s_water = calculate_water_quality({
        "ph": modified["ph"], "turbidity_ntu": modified["turbidity_ntu"],
        "dissolved_oxygen_mg_l": modified["dissolved_oxygen_mg_l"],
        "conductivity_us_cm": modified["conductivity_us_cm"], "tds_mg_l": modified["tds_mg_l"]
    })
    s_soil = calculate_soil_risk({
        "soil_moisture_pct": modified["soil_saturation_pct"],
        "slope_degrees": modified["slope_degrees"],
        "vegetation_cover_pct": modified["vegetation_cover_pct"],
        "compaction_kpa": modified["compaction_kpa"]
    })
    s_decision = generate_decision(s_curr_flood, s_ml_flood, s_heat, s_air, s_water, s_soil)

    # Calculate Deltas
    delta_flood_score = s_decision["composite_scores"]["Flood"] - b_decision["composite_scores"]["Flood"]
    delta_prob = s_ml_flood["flood_probability"] - b_ml_flood["flood_probability"]
    delta_heat = s_heat["score"] - b_heat["score"]

    return {
        "location_id": location_id,
        "location_name": location["name"],
        "data_notice": "Demo / Sample Data (What-If parameter perturbation evaluated dynamically)",
        "baseline": {
            "inputs": {
                "rainfall_24h_mm": baseline["rainfall_24h_mm"],
                "rainfall_72h_mm": baseline["rainfall_72h_mm"],
                "river_gauge_m": baseline["river_gauge_m"],
                "soil_saturation_pct": baseline["soil_saturation_pct"],
                "temperature_c": baseline["temperature_c"],
                "humidity_pct": baseline["humidity_pct"]
            },
            "flood_current_score": b_curr_flood["score"],
            "flood_ml_probability": b_ml_flood["flood_probability"],
            "composite_flood_score": b_decision["composite_scores"]["Flood"],
            "overall_level": b_decision["overall_level"],
            "decision": b_decision["decision"]
        },
        "scenario": {
            "inputs": {
                "rainfall_24h_mm": modified["rainfall_24h_mm"],
                "rainfall_72h_mm": modified["rainfall_72h_mm"],
                "river_gauge_m": modified["river_gauge_m"],
                "soil_saturation_pct": modified["soil_saturation_pct"],
                "temperature_c": modified["temperature_c"],
                "humidity_pct": modified["humidity_pct"]
            },
            "flood_current_score": s_curr_flood["score"],
            "flood_ml_probability": s_ml_flood["flood_probability"],
            "composite_flood_score": s_decision["composite_scores"]["Flood"],
            "overall_level": s_decision["overall_level"],
            "decision": s_decision["decision"],
            "recommendations": s_decision["recommendations"]
        },
        "deltas": {
            "delta_composite_flood_score": delta_flood_score,
            "delta_probability_pct": round(delta_prob * 100.0, 1),
            "delta_heat_score": delta_heat,
            "level_escalated": s_decision["overall_level"] != b_decision["overall_level"]
        }
    }

@app.get("/history/{location_id}")
def get_historical_trends(location_id: str, range_type: str = Query("24 hours")):
    location = next((loc for loc in LOCATIONS if loc["id"] == location_id), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    base = LOCATION_BASELINES.get(location_id, LOCATION_BASELINES["riverbend"])
    
    # Generate realistic chronological data points based on requested range
    now = datetime.now(timezone.utc)
    points = []

    if range_type == "7 days":
        count = 7
        for i in range(count):
            dt = now - timedelta(days=count - 1 - i)
            rain = max(0.0, round(base["rainfall_24h_mm"] * (0.4 + 0.9 * math.sin(i * 0.9)), 1))
            river = round(base["river_gauge_m"] - 0.6 + (rain / 50.0) * 0.8, 2)
            soil = min(100.0, max(20.0, round(base["soil_saturation_pct"] - 12.0 + (rain / 40.0) * 15.0, 1)))
            risk = min(100, max(15, int(20 + rain * 0.7 + river * 6 + soil * 0.2)))
            points.append({
                "timestamp": dt.strftime("%a %d"),
                "rainfall_mm": rain,
                "river_gauge_m": river,
                "soil_saturation_pct": soil,
                "risk": risk
            })
    elif range_type == "30 days":
        count = 10
        for i in range(count):
            dt = now - timedelta(days=(count - 1 - i) * 3)
            rain = max(0.0, round(base["rainfall_24h_mm"] * (0.3 + 0.8 * math.cos(i * 0.7)), 1))
            river = round(base["river_gauge_m"] - 0.4 + (rain / 60.0) * 0.9, 2)
            soil = min(100.0, max(25.0, round(base["soil_saturation_pct"] - 10.0 + (rain / 45.0) * 12.0, 1)))
            risk = min(100, max(12, int(18 + rain * 0.7 + river * 6 + soil * 0.2)))
            points.append({
                "timestamp": dt.strftime("%b %d"),
                "rainfall_mm": rain,
                "river_gauge_m": river,
                "soil_saturation_pct": soil,
                "risk": risk
            })
    else:  # 24 hours
        count = 8
        times = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
        for i in range(count):
            dt = now - timedelta(hours=(count - 1 - i) * 3)
            rain = max(2.0, round(base["rainfall_24h_mm"] * (0.2 + (i / count) * 0.8), 1))
            river = round(base["river_gauge_m"] - 0.5 + (i / count) * 0.6, 2)
            soil = min(98.0, round(base["soil_saturation_pct"] - 8.0 + (i / count) * 10.0, 1))
            risk = min(100, int(25 + rain * 0.6 + river * 5 + soil * 0.2))
            points.append({
                "timestamp": times[i],
                "rainfall_mm": rain,
                "river_gauge_m": river,
                "soil_saturation_pct": soil,
                "risk": risk
            })

    return {
        "location_id": location_id,
        "range": range_type,
        "data_notice": "Demo / Sample Data (Simulated temporal sensor feeds)",
        "points": points
    }

@app.get("/ml/metrics")
def get_ml_metrics():
    """
    Returns genuine evaluation metrics generated during model training.
    """
    if not ml_metrics:
        raise HTTPException(status_code=503, detail="ML evaluation metrics not loaded.")
    return ml_metrics

@app.get("/alerts/{location_id}")
def get_alerts(location_id: str):
    location = next((loc for loc in LOCATIONS if loc["id"] == location_id), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")

    base = LOCATION_BASELINES.get(location_id, LOCATION_BASELINES["riverbend"])
    now = datetime.now(timezone.utc)
    alerts = []

    if base["rainfall_24h_mm"] >= 40.0:
        alerts.append({
            "id": f"alt-{location_id}-1",
            "title": "Extreme Precipitation Threshold Exceeded",
            "category": "Flood Hazard",
            "severity": "Critical",
            "message": f"24-hour rainfall has reached {base['rainfall_24h_mm']} mm, exceeding the 40mm warning threshold.",
            "location": location["name"],
            "timestamp": (now - timedelta(minutes=24)).strftime("%H:%M UTC"),
            "read": False
        })

    if base["river_gauge_m"] >= 4.0:
        alerts.append({
            "id": f"alt-{location_id}-2",
            "title": "River Stage Near Bankfull Elevation",
            "category": "Hydrological Alert",
            "severity": "Warning",
            "message": f"Gauge stage recorded at {base['river_gauge_m']} m. Retention basins active.",
            "location": location["name"],
            "timestamp": (now - timedelta(hours=1, minutes=15)).strftime("%H:%M UTC"),
            "read": False
        })

    if base["pm25"] >= 35.0:
        alerts.append({
            "id": f"alt-{location_id}-3",
            "title": "Particulate Matter (PM2.5) Spike",
            "category": "Air Quality",
            "severity": "Warning",
            "message": f"PM2.5 concentration at {base['pm25']} µg/m³ exceeds healthy breathing guidelines.",
            "location": location["name"],
            "timestamp": (now - timedelta(hours=3)).strftime("%H:%M UTC"),
            "read": False
        })

    if base["temperature_c"] >= 33.0:
        alerts.append({
            "id": f"alt-{location_id}-4",
            "title": "Heat Stress Advisory",
            "category": "Thermal",
            "severity": "Warning",
            "message": f"Ambient temperature at {base['temperature_c']}°C with elevated relative humidity.",
            "location": location["name"],
            "timestamp": (now - timedelta(hours=4)).strftime("%H:%M UTC"),
            "read": True
        })

    # Add general info alert if few alerts
    alerts.append({
        "id": f"alt-{location_id}-info",
        "title": "Sensor Calibration & Telemetry Ingest Confirmed",
        "category": "System Telemetry",
        "severity": "Info",
        "message": "All edge sensor nodes reporting with 100% data transmission integrity.",
        "location": location["name"],
        "timestamp": (now - timedelta(hours=6)).strftime("%H:%M UTC"),
        "read": True
    })

    return {
        "location_id": location_id,
        "count": len(alerts),
        "alerts": alerts
    }
