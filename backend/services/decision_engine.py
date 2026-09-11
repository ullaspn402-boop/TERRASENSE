from typing import Dict, Any, List

def generate_decision(
    current_flood: Dict[str, Any],
    ml_flood: Dict[str, Any],
    heat: Dict[str, Any],
    air: Dict[str, Any],
    water: Dict[str, Any],
    soil: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates multi-hazard inputs, separates current risk from ML prediction,
    and produces actionable decisions with explicit causal reasons.
    """
    current_score = current_flood["score"]
    predicted_prob = ml_flood.get("flood_probability", 0.1)
    predicted_score = int(round(predicted_prob * 100))

    # Combined composite risk index (40% current conditions + 60% predictive horizon)
    composite_flood = int(round(current_score * 0.4 + predicted_score * 0.6))
    
    # Check max severity across all environmental hazards
    max_hazard_score = max(composite_flood, heat["score"], air["score"], water["score"], soil["score"])
    
    # Determine dominant risk domain
    domain_scores = {
        "Flood": composite_flood,
        "Heat Stress": heat["score"],
        "Air Quality": air["score"],
        "Water Quality": water["score"],
        "Soil Instability": soil["score"]
    }
    dominant_domain = max(domain_scores.items(), key=lambda x: x[1])[0]

    # Operational status & decision classification
    if max_hazard_score >= 75 or predicted_prob >= 0.70:
        overall_level = "Critical"
        decision = "ACTIVATE EMERGENCY RESPONSE & PREVENTIVE BARRIERS"
    elif max_hazard_score >= 55 or predicted_prob >= 0.45:
        overall_level = "High"
        decision = "DEPLOY PREVENTIVE MEASURES & MOBILIZE FIELD CREWS"
    elif max_hazard_score >= 35:
        overall_level = "Moderate"
        decision = "SCHEDULE TARGETED INSPECTIONS & HEIGHTEN MONITORING"
    else:
        overall_level = "Low"
        decision = "MAINTAIN ROUTINE MONITORING & BASELINE PROTOCOLS"

    # Construct explicit causal reasoning
    reasons = []
    if composite_flood >= 55 or predicted_prob >= 0.45:
        reasons.append(
            f"Hydrological convergence: current flood index ({current_score}/100) and ML predicted probability ({predicted_prob:.1%}) driven by {', '.join(current_flood['factors'][:2])}"
        )
    if heat["score"] >= 50:
        reasons.append(f"Thermal hazard: Apparent heat index at {heat['heat_index_c']}°C exceeds safety thresholds")
    if air["score"] >= 50:
        reasons.append(f"Atmospheric hazard: Elevated AQI ({air['aqi']}) dominated by {air['dominant_pollutant']}")
    if water["score"] >= 50:
        reasons.append(f"Hydraulic water quality alert: {water['status']} with elevated turbidity/dissolved oxygen deficit")
    if soil["score"] >= 50:
        reasons.append(f"Geotechnical hazard: Runoff coefficient at {soil['runoff_coefficient']} indicating high erosion potential")

    if not reasons:
        reasons.append("All measured parameters reside within normal operating parameters.")

    # Actionable recommendations
    recommendations = []
    if composite_flood >= 55 or predicted_prob >= 0.45:
        recommendations.append({
            "priority": "Immediate" if composite_flood >= 75 else "High",
            "action": "Inspect low-lying drainage channels & clear culvert obstructions",
            "rationale": f"Flood probability is projected at {predicted_prob:.1%} over the next forecast horizon."
        })
        recommendations.append({
            "priority": "High",
            "action": "Pre-stage mobile pump units at low-elevation containment zones",
            "rationale": "High soil saturation impedes natural groundwater infiltration."
        })

    if heat["score"] >= 50:
        recommendations.append({
            "priority": "High" if heat["score"] >= 70 else "Medium",
            "action": "Enforce outdoor worker hydration intervals and shade rotations",
            "rationale": heat["advisory"]
        })

    if air["score"] >= 50:
        recommendations.append({
            "priority": "Medium",
            "action": "Issue air quality advisories for sensitive demographics and recommend HEPA filtration",
            "rationale": f"Dominant pollutant {air['dominant_pollutant']} is above healthy exposure thresholds."
        })

    if water["score"] >= 50:
        recommendations.append({
            "priority": "Medium",
            "action": "Collect grab samples at intake stations and review coagulation dosage",
            "rationale": water["status"]
        })

    if not recommendations:
        recommendations.append({
            "priority": "Routine",
            "action": "Continue automated sensor telemetry ingest and routine telemetry checks",
            "rationale": "All environmental indicators remain within equilibrium baselines."
        })

    return {
        "overall_level": overall_level,
        "overall_score": max_hazard_score,
        "dominant_hazard": dominant_domain,
        "decision": decision,
        "causal_reasons": reasons,
        "recommendations": recommendations,
        "composite_scores": domain_scores
    }

def explain_prediction(features: Dict[str, float], model_importances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Computes explainable AI factor contributions relative to nominal baseline conditions.
    """
    baselines = {
        "rainfall_24h_mm": 15.0,
        "rainfall_72h_mm": 35.0,
        "river_gauge_m": 2.5,
        "soil_saturation_pct": 50.0,
        "elevation_m": 35.0,
        "slope_degrees": 6.0,
        "impervious_surface_pct": 35.0,
        "drainage_capacity_m3s": 65.0
    }

    imp_dict = {item["feature"]: item["importance"] for item in model_importances}
    explanations = []

    for feat, current_val in features.items():
        base_val = baselines.get(feat, current_val)
        imp = imp_dict.get(feat, 0.1)
        
        # Calculate standardized directional delta
        if base_val != 0:
            pct_diff = (current_val - base_val) / base_val
        else:
            pct_diff = current_val

        # Features where higher is safer (e.g. elevation, drainage)
        if feat in ["elevation_m", "drainage_capacity_m3s"]:
            pct_diff = -pct_diff

        impact_weight = pct_diff * imp * 100.0
        
        if abs(impact_weight) > 1.5:
            explanations.append({
                "feature": feat,
                "current_value": current_val,
                "baseline_value": base_val,
                "impact_direction": "Increases Risk" if impact_weight > 0 else "Mitigates Risk",
                "impact_score": round(impact_weight, 1),
                "importance_weight": round(imp, 3)
            })

    # Sort by absolute impact magnitude
    explanations.sort(key=lambda x: abs(x["impact_score"]), reverse=True)
    return explanations
