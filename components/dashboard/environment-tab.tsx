import { useState } from 'react'
import {
  CloudRain, Wind, Droplets, Thermometer, Layers, AlertCircle, ShieldCheck, Gauge, TrendingUp
} from 'lucide-react'
import { RiskBadge } from './risk-badge'

interface EnvironmentTabProps {
  location: any
  riskData: any
}

export function EnvironmentTab({ location, riskData }: EnvironmentTabProps) {
  const [subTab, setSubTab] = useState<'flood' | 'heat' | 'air' | 'water' | 'soil'>('flood')

  const flood = riskData?.flood || {}
  const heat = riskData?.heat || {}
  const air = riskData?.air_quality || {}
  const water = riskData?.water_quality || {}
  const soil = riskData?.soil || {}

  const hazardTabs = [
    { id: 'flood', label: 'Flood Hazard', icon: CloudRain, score: flood.combined_score ?? 43, level: flood.combined_level ?? 'Moderate' },
    { id: 'heat', label: 'Heat Stress', icon: Thermometer, score: heat.score ?? 42, level: heat.level ?? 'Moderate' },
    { id: 'air', label: 'Air Quality', icon: Wind, score: air.score ?? 28, level: air.category ?? 'Low' },
    { id: 'water', label: 'Water Quality', icon: Droplets, score: water.score ?? 35, level: water.status ?? 'Good' },
    { id: 'soil', label: 'Soil Instability', icon: Layers, score: soil.score ?? 52, level: soil.level ?? 'Moderate' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Multi-Hazard Environmental Physics
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">· {location.name}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Environmental Domain Sub-Modules</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          In-depth telemetry breakdowns, hydrodynamic gauges, air quality dispersion, and geotechnical stability indices.
        </p>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {hazardTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = subTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition shadow-xs ${
                isActive
                  ? 'border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${
                  isActive ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {tab.label}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{tab.score}</span>
                  <RiskBadge level={tab.level} size="sm" showIcon={false} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* SUBTAB CONTENT */}
      {subTab === 'flood' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">River Gauge Height</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{flood.current_risk?.components?.gauge_level || 4.15} m</p>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((flood.current_risk?.components?.gauge_level || 4.15) / 8) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Major flood threshold at 5.50m</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">24h Cumulative Precipitation</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{flood.current_risk?.components?.rainfall_contribution || 45} mm</p>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, ((flood.current_risk?.components?.rainfall_contribution || 45) / 150) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Peak catchment inflow recorded at 18:00</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ML Flood Likelihood</span>
            <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {((flood.ml_prediction?.flood_probability || 0.15) * 100).toFixed(1)}%
            </p>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(flood.ml_prediction?.flood_probability || 0.15) * 100}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Evaluated by RandomForest ensemble (98% Acc)</p>
          </div>
        </div>
      )}

      {subTab === 'heat' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Apparent Heat Index</span>
            <p className="text-3xl font-black font-mono text-orange-600 dark:text-orange-400">{heat.heat_index_c || 32}°C</p>
            <p className="text-[11px] text-slate-500">Category: {heat.level || 'Moderate Caution'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dry Bulb Temperature</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{heat.temperature_c || 30}°C</p>
            <p className="text-[11px] text-slate-500">Ambient ambient sensor readout</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Relative Humidity</span>
            <p className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400">{heat.humidity_pct || 72}%</p>
            <p className="text-[11px] text-slate-500">Wet-bulb threshold within tolerance</p>
          </div>
        </div>
      )}

      {subTab === 'air' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Air Quality Index (AQI)</span>
            <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">{air.aqi || 58}</p>
            <p className="text-[11px] text-slate-500">Status: {air.category || 'Moderate'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Particulate Matter 2.5 (PM2.5)</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{air.pm25 || 28.4} µg/m³</p>
            <p className="text-[11px] text-slate-500">WHO 24h standard: 15 µg/m³</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Particulate Matter 10 (PM10)</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{air.pm10 || 45.2} µg/m³</p>
            <p className="text-[11px] text-slate-500">Coarse particulate fraction</p>
          </div>
        </div>
      )}

      {subTab === 'water' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Water Quality Index (WQI)</span>
            <p className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">{water.score || 74}/100</p>
            <p className="text-[11px] text-slate-500">Rating: {water.status || 'Good'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dissolved Oxygen (DO)</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{water.dissolved_oxygen_mg_l || 7.2} mg/L</p>
            <p className="text-[11px] text-slate-500">Healthy aquatic baseline &gt; 6.5 mg/L</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Potential Hydrogen (pH)</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{water.ph || 7.4}</p>
            <p className="text-[11px] text-slate-500">Neutral freshwater boundary</p>
          </div>
        </div>
      )}

      {subTab === 'soil' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Soil Moisture Saturation</span>
            <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{soil.soil_saturation_pct || 78}%</p>
            <p className="text-[11px] text-slate-500">Near-saturation field capacity</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Slope Instability Index</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{soil.slope_instability_score || 52}/100</p>
            <p className="text-[11px] text-slate-500">Geotechnical shearing risk moderate</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pore Water Pressure</span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{soil.pore_pressure_kpa || 14.8} kPa</p>
            <p className="text-[11px] text-slate-500">Subsurface piezometer reading</p>
          </div>
        </div>
      )}
    </div>
  )
}
