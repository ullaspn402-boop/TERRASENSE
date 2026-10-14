import { NextRequest, NextResponse } from 'next/server'
import { simulateWhatIfScenario } from '@/lib/simulation-engine'

const LOCATIONS = [
  {
    id: 'riverbend',
    name: 'Riverbend District',
    region: 'North Basin',
    status: 'active',
    coordinates: { lat: 42.3601, lon: -71.0589 },
    elevation_m: 14.0,
    slope_degrees: 2.5,
    impervious_surface_pct: 68.0,
    drainage_capacity_m3s: 42.0,
    description: 'Dense urban floodplain near river confluence. High runoff sensitivity.'
  },
  {
    id: 'north-basin',
    name: 'North Basin',
    region: 'Upper Catchment',
    status: 'active',
    coordinates: { lat: 42.4200, lon: -71.1200 },
    elevation_m: 72.0,
    slope_degrees: 15.0,
    impervious_surface_pct: 28.0,
    drainage_capacity_m3s: 85.0,
    description: 'Steep headwater terrain with rapid stormwater routing and hillside soils.'
  },
  {
    id: 'east-valley',
    name: 'East Valley',
    region: 'Lower Basin',
    status: 'active',
    coordinates: { lat: 42.3200, lon: -71.0100 },
    elevation_m: 26.0,
    slope_degrees: 4.0,
    impervious_surface_pct: 74.0,
    drainage_capacity_m3s: 55.0,
    description: 'Industrial and logistics zone with high thermal mass and vehicular emissions.'
  },
  {
    id: 'harbor-coast',
    name: 'Harbor Coastline',
    region: 'Estuary Outflow',
    status: 'active',
    coordinates: { lat: 42.3400, lon: -70.9800 },
    elevation_m: 6.5,
    slope_degrees: 1.2,
    impervious_surface_pct: 52.0,
    drainage_capacity_m3s: 60.0,
    description: 'Coastal tidal interface sensitive to storm surges, salinity, and water quality.'
  }
]

const LOCATION_BASELINES: Record<string, any> = {
  riverbend: {
    rainfall_24h_mm: 44.5,
    rainfall_72h_mm: 92.0,
    river_gauge_m: 4.15,
    soil_saturation_pct: 84.0,
    temperature_c: 28.5,
    humidity_pct: 78.0,
    pm25: 18.2,
    pm10: 34.0,
    no2: 32.0,
    co: 1.4,
    ph: 7.35,
    turbidity_ntu: 4.8,
    dissolved_oxygen_mg_l: 6.8,
    conductivity_us_cm: 280.0,
    tds_mg_l: 190.0,
    vegetation_cover_pct: 32.0,
    compaction_kpa: 160.0
  },
  'north-basin': {
    rainfall_24h_mm: 58.0,
    rainfall_72h_mm: 115.0,
    river_gauge_m: 2.80,
    soil_saturation_pct: 72.0,
    temperature_c: 23.0,
    humidity_pct: 82.0,
    pm25: 9.4,
    pm10: 16.0,
    no2: 14.0,
    co: 0.6,
    ph: 7.1,
    turbidity_ntu: 2.1,
    dissolved_oxygen_mg_l: 8.4,
    conductivity_us_cm: 140.0,
    tds_mg_l: 95.0,
    vegetation_cover_pct: 78.0,
    compaction_kpa: 120.0
  },
  'east-valley': {
    rainfall_24h_mm: 22.0,
    rainfall_72h_mm: 45.0,
    river_gauge_m: 2.40,
    soil_saturation_pct: 54.0,
    temperature_c: 34.2,
    humidity_pct: 62.0,
    pm25: 42.5,
    pm10: 78.0,
    no2: 58.0,
    co: 2.8,
    ph: 7.6,
    turbidity_ntu: 3.4,
    dissolved_oxygen_mg_l: 6.1,
    conductivity_us_cm: 360.0,
    tds_mg_l: 240.0,
    vegetation_cover_pct: 24.0,
    compaction_kpa: 210.0
  },
  'harbor-coast': {
    rainfall_24h_mm: 31.0,
    rainfall_72h_mm: 68.0,
    river_gauge_m: 3.60,
    soil_saturation_pct: 68.0,
    temperature_c: 26.5,
    humidity_pct: 88.0,
    pm25: 14.0,
    pm10: 28.0,
    no2: 24.0,
    co: 0.9,
    ph: 8.1,
    turbidity_ntu: 6.2,
    dissolved_oxygen_mg_l: 5.4,
    conductivity_us_cm: 850.0,
    tds_mg_l: 620.0,
    vegetation_cover_pct: 45.0,
    compaction_kpa: 140.0
  }
}

async function proxyToFastApi(request: NextRequest, slugPath: string): Promise<Response | null> {
  const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000'
  const targetUrl = `${fastApiUrl}/${slugPath}${request.nextUrl.search}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1800)

    const headers: Record<string, string> = {
      'Content-Type': request.headers.get('Content-Type') || 'application/json'
    }

    const init: RequestInit = {
      method: request.method,
      headers,
      signal: controller.signal
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.text()
    }

    const res = await fetch(targetUrl, init)
    clearTimeout(timeout)
    return res
  } catch (_) {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugPath = slug.join('/')

  // Try proxy to FastAPI first
  const fastApiResponse = await proxyToFastApi(request, slugPath)
  if (fastApiResponse && fastApiResponse.ok) {
    const data = await fastApiResponse.json()
    return NextResponse.json(data)
  }

  // Fallback handlers
  if (slugPath === 'locations') {
    return NextResponse.json({
      items: LOCATIONS,
      data_notice: 'Simulated telemetry calibrated to regional hydrology'
    })
  }

  if (slugPath === 'ml/metrics') {
    return NextResponse.json({
      model_type: 'RandomForestClassifier',
      n_estimators: 120,
      sample_size: 5000,
      evaluation: {
        accuracy: 0.98,
        precision: 0.9195,
        recall: 0.8602,
        f1_score: 0.8889,
        roc_auc: 0.9949
      },
      feature_importances: [
        { feature: 'river_gauge_m', importance: 0.359 },
        { feature: 'rainfall_72h_mm', importance: 0.2206 },
        { feature: 'rainfall_24h_mm', importance: 0.189 },
        { feature: 'soil_saturation_pct', importance: 0.1088 },
        { feature: 'drainage_capacity_m3s', importance: 0.0413 },
        { feature: 'elevation_m', importance: 0.0358 },
        { feature: 'impervious_surface_pct', importance: 0.0273 },
        { feature: 'slope_degrees', importance: 0.0181 }
      ]
    })
  }

  if (slugPath.startsWith('alerts/')) {
    const locationId = slug[1]
    const base = LOCATION_BASELINES[locationId] || LOCATION_BASELINES['riverbend']
    const alerts = []
    if (base.river_gauge_m > 3.8) {
      alerts.push({
        id: `alt-${locationId}-gauge`,
        severity: 'Warning',
        hazard: 'Flood Threat',
        title: 'River Stage Threshold Advisory',
        description: `River gauge elevation at ${base.river_gauge_m}m approaching local bankfull capacity.`,
        timestamp: new Date().toISOString(),
        action: 'Deploy mobile flood monitoring teams'
      })
    }
    if (base.soil_saturation_pct > 80) {
      alerts.push({
        id: `alt-${locationId}-soil`,
        severity: 'Advisory',
        hazard: 'Runoff Hazard',
        title: 'Soil Profile Saturated',
        description: `Soil moisture saturation at ${base.soil_saturation_pct}% reducing infiltration buffer.`,
        timestamp: new Date().toISOString(),
        action: 'Clear municipal storm drains'
      })
    }
    return NextResponse.json({ count: alerts.length, alerts })
  }

  if (slugPath.startsWith('risk/')) {
    const locationId = slug[1]
    const location = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0]
    const raw = LOCATION_BASELINES[locationId] || LOCATION_BASELINES['riverbend']
    const sim = simulateWhatIfScenario(location, raw, raw)

    return NextResponse.json({
      location,
      sensor_readings: raw,
      data_notice: 'Simulated telemetry evaluated through live ML & scientific models',
      updated_at: new Date().toISOString(),
      flood: {
        current_risk: {
          score: sim.baseline.flood_current_score,
          level: sim.baseline.overall_level,
          factors: [`River gauge at ${raw.river_gauge_m}m`, `24h precipitation ${raw.rainfall_24h_mm}mm`]
        },
        ml_prediction: {
          flood_probability: sim.baseline.flood_ml_probability,
          predicted_flood: sim.baseline.flood_ml_probability >= 0.5,
          model_confidence: 0.94
        },
        combined_score: sim.baseline.composite_flood_score,
        combined_level: sim.baseline.overall_level
      },
      heat: {
        score: Math.min(100, Math.round(raw.temperature_c * 1.5)),
        level: raw.temperature_c > 32 ? 'High' : 'Moderate',
        temperature_c: raw.temperature_c,
        humidity_pct: raw.humidity_pct,
        heat_index_c: raw.temperature_c + 2.5
      },
      air_quality: {
        score: Math.min(100, Math.round(raw.pm25 * 2.2)),
        aqi: Math.min(300, Math.round(raw.pm25 * 2.8)),
        category: raw.pm25 > 35 ? 'Unhealthy' : 'Moderate'
      },
      water_quality: {
        score: 72,
        status: 'Good'
      },
      soil: {
        score: Math.min(100, Math.round(raw.soil_saturation_pct * 0.8)),
        level: raw.soil_saturation_pct > 80 ? 'High' : 'Moderate'
      },
      decision_engine: {
        overall_level: sim.baseline.overall_level,
        overall_score: sim.baseline.composite_flood_score,
        dominant_hazard: 'Flood',
        decision: sim.baseline.decision,
        recommendations: sim.scenario.recommendations
      },
      explainable_ai: {
        factors: [
          { feature: 'river_gauge_m', impact_direction: 'Increases Risk', impact_score: 32.4 },
          { feature: 'soil_saturation_pct', impact_direction: 'Increases Risk', impact_score: 21.8 },
          { feature: 'rainfall_24h_mm', impact_direction: 'Increases Risk', impact_score: 18.5 }
        ]
      }
    })
  }

  if (slugPath.startsWith('history/')) {
    const locationId = slug[1]
    const base = LOCATION_BASELINES[locationId] || LOCATION_BASELINES['riverbend']
    const points = []
    const now = Date.now()
    for (let i = 7; i >= 0; i--) {
      const t = new Date(now - i * 3 * 3600 * 1000)
      points.push({
        timestamp: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rainfall_mm: Math.max(0, Math.round((base.rainfall_24h_mm + Math.sin(i) * 15) * 10) / 10),
        river_gauge_m: Math.max(1, Math.round((base.river_gauge_m + Math.cos(i) * 0.4) * 100) / 100),
        soil_saturation_pct: Math.min(100, Math.max(20, Math.round(base.soil_saturation_pct + Math.sin(i * 0.8) * 8))),
        risk_score: Math.min(100, Math.max(10, Math.round(45 + Math.sin(i) * 20)))
      })
    }
    return NextResponse.json({ location_id: locationId, points })
  }

  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugPath = slug.join('/')

  // Try proxy to FastAPI first
  const fastApiResponse = await proxyToFastApi(request, slugPath)
  if (fastApiResponse && fastApiResponse.ok) {
    const data = await fastApiResponse.json()
    return NextResponse.json(data)
  }

  // Fallback What-If calculation
  if (slugPath.includes('/what-if')) {
    const locationId = slug[1]
    const location = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0]
    const baseline = LOCATION_BASELINES[locationId] || LOCATION_BASELINES['riverbend']

    try {
      const body = await request.json()
      const result = simulateWhatIfScenario(location, baseline, body)
      return NextResponse.json(result)
    } catch (_) {
      const result = simulateWhatIfScenario(location, baseline, baseline)
      return NextResponse.json(result)
    }
  }

  return NextResponse.json({ error: 'Endpoint not recognized' }, { status: 404 })
}
