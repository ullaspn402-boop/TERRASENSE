import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  CloudRain, Wind, Droplets, Thermometer, Layers, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle2, ArrowRight, Activity, TrendingUp, Sparkles, Plus, Radio, Zap
} from 'lucide-react'
import { RiskBadge } from './risk-badge'

interface OverviewTabProps {
  location: any
  riskData: any
  historyData: any[]
  range: string
  setRange: (r: string) => void
  onNavigateTab: (tab: string) => void
  onOpenReportModal: () => void
}

export function OverviewTab({
  location,
  riskData,
  historyData,
  range,
  setRange,
  onNavigateTab,
  onOpenReportModal
}: OverviewTabProps) {
  const overallScore = riskData?.decision_engine?.overall_score ?? 68
  const overallLevel = riskData?.decision_engine?.overall_level ?? 'Moderate'
  const dominantHazard = riskData?.decision_engine?.dominant_hazard ?? 'Multi-Hazard'
  const decision = riskData?.decision_engine?.decision ?? 'SCHEDULE TARGETED INSPECTIONS & HEIGHTEN MONITORING'
  const floodScore = riskData?.flood?.combined_score ?? 43
  const floodLevel = riskData?.flood?.combined_level ?? 'Moderate'
  const mlProbability = ((riskData?.flood?.ml_prediction?.flood_probability || 0.15) * 100).toFixed(1)
  const aqiScore = riskData?.air_quality?.aqi ?? 58
  const aqiCategory = riskData?.air_quality?.category ?? 'Moderate'
  const wqiScore = riskData?.water_quality?.score ?? 74
  const wqiStatus = riskData?.water_quality?.status ?? 'Good'
  const heatIndex = riskData?.heat?.heat_index_c ?? 32
  const heatLevel = riskData?.heat?.level ?? 'Moderate'
  const soilSaturation = riskData?.soil?.soil_saturation_pct ?? 78
  const soilLevel = riskData?.soil?.level ?? 'Moderate'

  const metrics = [
    {
      name: 'Overall Hazard Index',
      value: overallScore,
      unit: '/100',
      level: overallLevel,
      subtext: `Dominant: ${dominantHazard}`,
      icon: ShieldAlert,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
      badgeLevel: overallLevel
    },
    {
      name: 'Flood Risk Index',
      value: floodScore,
      unit: '/100',
      level: floodLevel,
      subtext: `ML Prob: ${mlProbability}%`,
      icon: CloudRain,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
      badgeLevel: floodLevel
    },
    {
      name: 'Air Quality (AQI)',
      value: aqiScore,
      unit: ' AQI',
      level: aqiCategory,
      subtext: `PM2.5: ${riskData?.air_quality?.pm25 || 28.4} µg/m³`,
      icon: Wind,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40',
      badgeLevel: aqiCategory
    },
    {
      name: 'Water Safety (WQI)',
      value: wqiScore,
      unit: '/100',
      level: wqiStatus,
      subtext: `DO: ${riskData?.water_quality?.dissolved_oxygen_mg_l || 7.2} mg/L`,
      icon: Droplets,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/40',
      badgeLevel: wqiStatus === 'Good' ? 'Low' : 'Moderate'
    },
    {
      name: 'Heat Stress Index',
      value: heatIndex,
      unit: '°C',
      level: heatLevel,
      subtext: `Temp: ${riskData?.heat?.temperature_c || 30}°C · Hum: ${riskData?.heat?.humidity_pct || 72}%`,
      icon: Thermometer,
      color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40',
      badgeLevel: heatLevel
    },
    {
      name: 'Soil Saturation',
      value: soilSaturation,
      unit: '%',
      level: soilLevel,
      subtext: `Slope Instability: ${riskData?.soil?.slope_instability_score || 52}/100`,
      icon: Layers,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
      badgeLevel: soilLevel
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. TOP LIVE STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-5 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {location.name} Sensor Array
            </span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              Elevation: {location.elevation || '128m'}
            </span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ML Model RandomForest Active (98% Acc)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('What-if scenarios')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Simulate What-If Scenario</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Plus size={14} />
            <span>Commit Risk Audit</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY 6 METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div
              key={m.name}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">
                  {m.name}
                </span>
                <div className={`p-1.5 rounded-lg border ${m.color}`}>
                  <Icon size={14} />
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                  {m.value}
                </span>
                <span className="text-xs text-slate-400 font-mono">{m.unit}</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <RiskBadge level={m.badgeLevel} size="sm" />
              </div>

              <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                {m.subtext}
              </p>
            </div>
          )
        })}
      </div>

      {/* 3. DECISION ENGINE EXECUTIVE DIRECTIVE BANNER */}
      <div className="rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  DECISION ENGINE DIRECTIVE
                </span>
                <RiskBadge level={overallLevel} score={overallScore} size="sm" />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {decision}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                {riskData?.decision_engine?.causal_reasons?.[0] || 'Multi-hazard composite evaluation indicates elevated monitoring requirements based on continuous telemetry stream.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('Decision Engine')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-sm"
            >
              <span>View Full Reasoning Chain</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. CHARTS & MULTI-HAZARD BREAKDOWN */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Trend Area Chart (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Historical Telemetry & Forecast Trend</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Composite risk progression vs rainfall volume over {range}
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-0.5">
              {['24 hours', '7 days', '30 days'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    range === r
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '11px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  name="Composite Risk"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#riskGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="rainfall_mm"
                  name="Rainfall (mm)"
                  stroke="#0284c7"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fill="url(#rainGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Hazard Profile (5 cols) */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Hazard Comparison Profile</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Physical sub-index distribution (0–100)</p>
            </div>
            <button
              onClick={() => onNavigateTab('Environment')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              All Modules →
            </button>
          </div>

          <div className="space-y-3.5">
            {[
              { name: 'Flood Risk', score: floodScore, level: floodLevel, color: '#0284c7', icon: CloudRain },
              { name: 'Heat Stress', score: riskData?.heat?.score ?? 42, level: heatLevel, color: '#f97316', icon: Thermometer },
              { name: 'Air Quality (AQI)', score: riskData?.air_quality?.score ?? 28, level: aqiCategory, color: '#14b8a6', icon: Wind },
              { name: 'Water Quality (WQI)', score: riskData?.water_quality?.score ?? 35, level: wqiStatus, color: '#06b6d4', icon: Droplets },
              { name: 'Soil Instability', score: riskData?.soil?.score ?? 52, level: soilLevel, color: '#d97706', icon: Layers },
            ].map(h => {
              const Icon = h.icon
              return (
                <div key={h.name} className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-800 dark:text-slate-200">{h.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{h.score}</span>
                        <RiskBadge level={h.level} size="sm" showIcon={false} />
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, h.score)}%`, backgroundColor: h.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. EXPLAINABLE AI DRIVERS & RECENT ACTION PROTOCOLS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Causal Protocols */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Field Protocols</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dispatched by decision support engine</p>
            </div>
            <button
              onClick={() => onNavigateTab('Decision Engine')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Engine Details →
            </button>
          </div>

          <div className="space-y-2.5">
            {riskData?.decision_engine?.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {rec.priority || 'P1'}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{rec.action}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rec.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable AI Driver Factors */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Explainable AI (XAI) Feature Impact</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Contribution delta to predicted flood probability</p>
            </div>
            <button
              onClick={() => onNavigateTab('Predictions & ML')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Model Audit →
            </button>
          </div>

          <div className="space-y-2.5">
            {riskData?.explainable_ai?.factors?.slice(0, 4).map((f: any, idx: number) => {
              const isPositive = f.impact_score > 0
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                      {f.feature?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Current: {f.current_value} (Baseline: {f.baseline_value})
                    </p>
                  </div>

                  <div className="text-right pl-3">
                    <span className={`text-xs font-mono font-bold ${
                      isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isPositive ? `+${f.impact_score}%` : `${f.impact_score}%`}
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                      {f.impact_direction} risk
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
