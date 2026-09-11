import math
from typing import Dict, Any, List

def calculate_flood_current_risk(data: Dict[str, float]) -> Dict[str, Any]:
    """
    Evaluates real-time rule-based hydrological flood hazard.
    Separated from ML prediction.
    """
    rain_24h = data.get("rainfall_24h_mm", 0.0)
    rain_72h = data.get("rainfall_72h_mm", 0.0)
    river_gauge = data.get("river_gauge_m", 2.0)
    soil_sat = data.get("soil_saturation_pct", 50.0)
    elevation = data.get("elevation_m", 30.0)
    slope = data.get("slope_degrees", 5.0)
    impervious = data.get("impervious_surface_pct", 40.0)
    drainage = data.get("drainage_capacity_m3s", 50.0)

    # Hydrological runoff volume index
    saturation_multiplier = (soil_sat / 100.0) ** 1.3
    impervious_factor = 1.0 + (impervious / 100.0) * 0.8
    effective_precipitation = (rain_24h * 0.65 + rain_72h * 0.25) * saturation_multiplier * impervious_factor

    # Hydraulic head stress (river stage relative to typical 5m channel bankfull capacity)
    stage_ratio = max(0.0, (river_gauge - 2.0) / 4.0)
    channel_stress = min(40.0, stage_ratio * 35.0)

    # Relief factors: elevation gradient relief & pump/channel drainage throughput
    drainage_relief = min(30.0, (drainage / 80.0) * 20.0 + (elevation / 100.0) * 10.0)

    raw_score = 15.0 + effective_precipitation * 0.55 + channel_stress - drainage_relief
    score = int(max(5, min(100, round(raw_score))))

    if score >= 75:
        level = "Critical"
    elif score >= 55:
        level = "High"
    elif score >= 35:
        level = "Moderate"
    else:
        level = "Low"

    # Identify driving physical factors
    factors = []
    if rain_24h > 40.0:
        factors.append(f"Heavy 24h precipitation ({rain_24h:.1f} mm)")
    elif rain_24h > 20.0:
        factors.append(f"Moderate rainfall ({rain_24h:.1f} mm)")
        
    if soil_sat > 80.0:
        factors.append(f"Near-saturated soil profile ({soil_sat:.1f}%)")
    elif soil_sat > 65.0:
        factors.append(f"Elevated soil moisture ({soil_sat:.1f}%)")
        
    if river_gauge > 4.5:
        factors.append(f"River stage near bankfull threshold ({river_gauge:.2f} m)")
    elif river_gauge > 3.5:
        factors.append(f"Elevated river stage ({river_gauge:.2f} m)")
        
    if impervious > 60.0:
        factors.append(f"High impervious surface fraction ({impervious:.0f}%) accelerating runoff")
        
    if not factors:
        factors.append("Normal hydrological equilibrium")

    return {
        "score": score,
        "level": level,
        "factors": factors,
        "components": {
            "effective_precipitation": round(effective_precipitation, 2),
            "channel_stress": round(channel_stress, 2),
            "drainage_relief": round(drainage_relief, 2)
        }
    }

def calculate_heat_stress(temp_c: float, humidity_pct: float, solar_wm2: float = 600.0) -> Dict[str, Any]:
    """
    Computes NOAA Steadman Heat Index equation & apparent thermal stress.
    """
    # Convert Celsius to Fahrenheit
    T = temp_c * 9.0 / 5.0 + 32.0
    R = max(0.0, min(100.0, humidity_pct))

    # Simple formula first
    hi_simple = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094))

    if hi_simple >= 80.0:
        # Full Rothfusz regression equation
        hi = (-42.379 + 2.04901523 * T + 10.14333127 * R
              - 0.22475541 * T * R - 0.00683783 * (T ** 2)
              - 0.05481717 * (R ** 2) + 0.00122874 * (T ** 2) * R
              + 0.00085282 * T * (R ** 2) - 0.00000199 * (T ** 2) * (R ** 2))

        # Adjustments
        if R < 13.0 and 80.0 <= T <= 112.0:
            hi -= ((13.0 - R) / 4.0) * math.sqrt((17.0 - abs(T - 95.0)) / 17.0)
        elif R > 85.0 and 80.0 <= T <= 87.0:
            hi += ((R - 85.0) / 10.0) * ((87.0 - T) / 5.0)
    else:
        hi = hi_simple

    heat_index_c = round((hi - 32.0) * 5.0 / 9.0, 1)

    # Risk scoring (0-100)
    if heat_index_c >= 45.0:
        score = min(100, int(85 + (heat_index_c - 45.0) * 2.5))
        level = "Critical"
        advisory = "Extreme Danger: Heat stroke imminent with continued exposure."
    elif heat_index_c >= 38.0:
        score = int(70 + (heat_index_c - 38.0) * 2.1)
        level = "High"
        advisory = "Danger: Heat cramps and heat exhaustion likely; heat stroke possible."
    elif heat_index_c >= 32.0:
        score = int(45 + (heat_index_c - 32.0) * 4.1)
        level = "Moderate"
        advisory = "Extreme Caution: Heat cramps and exhaustion possible with prolonged activity."
    elif heat_index_c >= 27.0:
        score = int(25 + (heat_index_c - 27.0) * 4.0)
        level = "Low"
        advisory = "Caution: Fatigue possible with prolonged exposure and activity."
    else:
        score = max(5, int(temp_c * 0.8))
        level = "Low"
        advisory = "Comfortable thermal conditions."

    return {
        "score": score,
        "level": level,
        "temperature_c": temp_c,
        "humidity_pct": humidity_pct,
        "heat_index_c": heat_index_c,
        "advisory": advisory
    }

def calculate_aqi(pollutants: Dict[str, float]) -> Dict[str, Any]:
    """
    Standard EPA AQI Piecewise Linear Breakpoint calculation.
    """
    # EPA Breakpoint Tables: (C_low, C_high, I_low, I_high)
    BREAKPOINTS = {
        "pm25": [
            (0.0, 12.0, 0, 50),
            (12.1, 35.4, 51, 100),
            (35.5, 55.4, 101, 150),
            (55.5, 150.4, 151, 200),
            (150.5, 250.4, 201, 300),
            (250.5, 500.4, 301, 500),
        ],
        "pm10": [
            (0, 54, 0, 50),
            (55, 154, 51, 100),
            (155, 254, 101, 150),
            (255, 354, 151, 200),
            (355, 424, 201, 300),
            (425, 604, 301, 500),
        ],
        "no2": [
            (0, 53, 0, 50),
            (54, 100, 51, 100),
            (101, 360, 101, 150),
            (361, 649, 151, 200),
            (650, 1249, 201, 300),
            (1250, 2049, 301, 500),
        ],
        "co": [
            (0.0, 4.4, 0, 50),
            (4.5, 9.4, 51, 100),
            (9.5, 12.4, 101, 150),
            (12.5, 15.4, 151, 200),
            (15.5, 30.4, 201, 300),
            (30.5, 50.4, 301, 500),
        ]
    }

    sub_indices = {}
    for pol, value in pollutants.items():
        if pol not in BREAKPOINTS:
            continue
        bps = BREAKPOINTS[pol]
        sub_i = 0
        for c_low, c_high, i_low, i_high in bps:
            if c_low <= value <= c_high:
                sub_i = int(round(((i_high - i_low) / (c_high - c_low)) * (value - c_low) + i_low))
                break
        else:
            if value > bps[-1][1]:
                sub_i = 500
        sub_indices[pol] = sub_i

    overall_aqi = max(sub_indices.values()) if sub_indices else 25
    dominant = max(sub_indices.items(), key=lambda x: x[1])[0] if sub_indices else "pm25"

    if overall_aqi >= 301:
        category = "Hazardous"
        level = "Critical"
    elif overall_aqi >= 201:
        category = "Very Unhealthy"
        level = "High"
    elif overall_aqi >= 151:
        category = "Unhealthy"
        level = "High"
    elif overall_aqi >= 101:
        category = "Unhealthy for Sensitive Groups"
        level = "Moderate"
    elif overall_aqi >= 51:
        category = "Moderate"
        level = "Moderate"
    else:
        category = "Good"
        level = "Low"

    # Normalize AQI to a 0-100 risk score
    normalized_score = min(100, max(5, int(overall_aqi / 2.5)))

    return {
        "score": normalized_score,
        "aqi": overall_aqi,
        "category": category,
        "level": level,
        "dominant_pollutant": dominant.upper(),
        "sub_indices": sub_indices,
        "raw_pollutants": pollutants
    }

def calculate_water_quality(data: Dict[str, float]) -> Dict[str, Any]:
    """
    Weighted Arithmetic Water Quality Index (WQI).
    Evaluates: pH, Turbidity, Dissolved Oxygen (DO), Conductivity, TDS.
    """
    ph = data.get("ph", 7.2)
    turbidity = data.get("turbidity_ntu", 2.5)
    do = data.get("dissolved_oxygen_mg_l", 7.5)
    cond = data.get("conductivity_us_cm", 220.0)
    tds = data.get("tds_mg_l", 150.0)

    # Standard permissible limits
    # pH ideal 7.0, limits 6.5 - 8.5
    ph_dev = abs(ph - 7.0) / 1.5 * 100.0

    # Turbidity limit 5 NTU
    turb_penalty = max(0.0, (turbidity / 5.0) * 100.0)

    # DO ideal >= 8 mg/L, critical below 4.0 mg/L
    do_deficit = max(0.0, (8.0 - do) / 4.0 * 100.0) if do < 8.0 else 0.0

    # Conductivity limit 300 uS/cm
    cond_penalty = (cond / 400.0) * 100.0

    # TDS limit 500 mg/L
    tds_penalty = (tds / 500.0) * 100.0

    # Weighted composite index
    wqi_raw = 0.25 * ph_dev + 0.25 * turb_penalty + 0.30 * do_deficit + 0.10 * cond_penalty + 0.10 * tds_penalty
    score = min(100, max(5, int(round(wqi_raw))))

    if score >= 75:
        level = "Critical"
        status = "Unsuitable / Severe Degradation"
    elif score >= 50:
        level = "High"
        status = "Poor Quality / High Risk"
    elif score >= 25:
        level = "Moderate"
        status = "Moderate / Marginal Quality"
    else:
        level = "Low"
        status = "Good / Low Hazard"

    return {
        "score": score,
        "level": level,
        "status": status,
        "parameters": {
            "ph": ph,
            "turbidity_ntu": turbidity,
            "dissolved_oxygen_mg_l": do,
            "conductivity_us_cm": cond,
            "tds_mg_l": tds
        }
    }

def calculate_soil_risk(data: Dict[str, float]) -> Dict[str, Any]:
    """
    Evaluates soil saturation, runoff potential, and slope erosion risk.
    """
    sat = data.get("soil_moisture_pct", 60.0)
    slope = data.get("slope_degrees", 6.0)
    veg = data.get("vegetation_cover_pct", 70.0)
    compaction = data.get("compaction_kpa", 150.0)

    # Runoff coefficient estimate (C: 0.1 to 0.9)
    runoff_coef = (sat / 100.0) * 0.5 + (slope / 30.0) * 0.3 + (1.0 - veg / 100.0) * 0.2
    runoff_coef = round(min(0.95, max(0.1, runoff_coef)), 2)

    # Erosion vulnerability score (0-100)
    erosion_raw = (slope / 20.0) * 45.0 + (sat / 100.0) * 35.0 - (veg / 100.0) * 30.0 + 15.0
    score = min(100, max(5, int(round(erosion_raw))))

    if score >= 75:
        level = "Critical"
        advisory = "Extreme soil erosion and saturation instability risk."
    elif score >= 55:
        level = "High"
        advisory = "High slope erosion risk; saturated subsurface layer."
    elif score >= 35:
        level = "Moderate"
        advisory = "Moderate soil moisture with localized runoff potential."
    else:
        level = "Low"
        advisory = "Stable soil matrix and adequate infiltration capacity."

    return {
        "score": score,
        "level": level,
        "runoff_coefficient": runoff_coef,
        "erosion_risk_score": score,
        "advisory": advisory,
        "moisture_pct": sat,
        "slope_degrees": slope
    }
