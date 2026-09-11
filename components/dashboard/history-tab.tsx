import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Radio, Calendar, TrendingUp, Droplets, CloudRain, AlertTriangle } from 'lucide-react'

interface HistoryTabProps {
  location: any
  historyData: any[]
  range: string
  setRange: (r: string) => void
}

export function HistoryTab({ location, historyData, range, setRange }: HistoryTabProps) {
  // Compute basic statistical summaries from historyData
  const riskScores = historyData.map(d => d.risk || 0)
  const maxRisk = riskScores.length ? Math.max(...riskScores) : 0
  const avgRisk = riskScores.length ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length) : 0
  const totalRainfall = historyData.reduce((acc, d) => acc + (d.rainfall_mm || 0), 0).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Longitudinal Telemetry
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">· {location.name}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historical Telemetry & Risk Retrospective</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Temporal analysis of multi-hazard vulnerability trends, sensor spikes, and correlation patterns.
          </p>
        </div>

        {/* Range Selector */}
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-1 shadow-xs">
          {['24 hours', '7 days', '30 days'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                range === r
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* STATISTICAL SUMMARY CARDS (4 Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peak Risk Index</span>
          <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">{maxRisk}/100</p>
          <span className="text-[10px] text-slate-400">Recorded during surge</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean Composite Risk</span>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">{avgRisk}/100</p>
          <span className="text-[10px] text-slate-400">Rolling window average</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative Rainfall</span>
          <p className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1">{totalRainfall} mm</p>
          <span className="text-[10px] text-slate-400">Catchment precipitation</span>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telemetry Data Points</span>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{historyData.length}</p>
          <span className="text-[10px] text-slate-400">Continuous sampling</span>
        </div>
      </div>

      {/* COMPOSITE RISK & RAINFALL OVER TIME */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Variable Temporal Telemetry</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Synchronized progression of composite risk score and precipitation volume
          </p>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="histRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="histRain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="risk" name="Composite Risk Index" stroke="#059669" strokeWidth={2.5} fill="url(#histRisk)" />
              <Area type="monotone" dataKey="rainfall_mm" name="Rainfall Volume (mm)" stroke="#0284c7" strokeWidth={2} fill="url(#histRain)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
