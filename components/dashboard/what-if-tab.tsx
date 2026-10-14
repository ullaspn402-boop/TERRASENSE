import { useState, useEffect } from 'react'
import {
  SlidersHorizontal, RefreshCw, AlertTriangle, ShieldCheck, ArrowRight,
  TrendingUp, TrendingDown, Layers, Droplets, Thermometer, Wind, Zap,
  ShieldAlert, RotateCcw, Sparkles, CheckCircle2
} from 'lucide-react'
import { RiskBadge } from './risk-badge'

interface WhatIfTabProps {
  location: any
  riskData: any
  inputs: {
    rainfall_24h_mm: number
    river_gauge_m: number
    soil_saturation_pct: number
    temperature_c: number
    humidity_pct: number
  }
  onChangeInputs: (newInputs: any) => void
  onRunSimulation: (customInputs?: any) => void
  result: any
  loading: boolean
}

export function WhatIfTab({
  location,
  riskData,
  inputs,
  onChangeInputs,
  onRunSimulation,
  result,
  loading
}: WhatIfTabProps) {
  // Baseline values from live riskData (or sensible defaults)
  const baselineFloodScore = riskData?.flood?.combined_score ?? 43
  const baselineFloodLevel = riskData?.flood?.combined_level ?? 'Moderate'
  const baselineProb = Number(((riskData?.flood?.ml_prediction?.flood_probability || 0.15) * 100).toFixed(1))
  const baselineDecision = riskData?.decision_engine?.decision || 'MAINTAIN ROUTINE MONITORING & BASELINE PROTOCOLS'
  const baselineHeatScore = riskData?.heat?.score ?? 35

  // Simulated values from result (or fallback if not yet recalculated)
  const simFloodScore = result?.scenario?.composite_flood_score ?? result?.simulated_flood?.combined_score ?? baselineFloodScore
  const simFloodLevel = result?.scenario?.overall_level ?? result?.simulated_flood?.combined_level ?? baselineFloodLevel
  const simProb = result?.scenario?.flood_ml_probability !== undefined
    ? Number((result.scenario.flood_ml_probability * 100).toFixed(1))
    : result?.simulated_flood?.ml_prediction?.flood_probability !== undefined
    ? Number((result.simulated_flood.ml_prediction.flood_probability * 100).toFixed(1))
    : baselineProb
  const simDecision = result?.scenario?.decision ?? result?.simulated_decision?.decision ?? baselineDecision
  const scoreDelta = result?.deltas?.delta_composite_flood_score !== undefined
    ? result.deltas.delta_composite_flood_score
    : simFloodScore - baselineFloodScore
  const probDelta = result?.deltas?.delta_probability_pct !== undefined
    ? result.deltas.delta_probability_pct
    : Number((simProb - baselineProb).toFixed(1))
  const isEscalated = result?.deltas?.level_escalated ?? (scoreDelta > 15 || simFloodLevel === 'Critical' || simFloodLevel === 'High')

  // Derive genuine live baseline for this location
  const liveSensorReadings = riskData?.sensor_readings || {
    rainfall_24h_mm: 45,
    river_gauge_m: 4.15,
    soil_saturation_pct: 82,
    temperature_c: 28,
    humidity_pct: 75
  }

  const resetToBaseline = () => {
    const baselineTarget = {
      rainfall_24h_mm: Number(liveSensorReadings.rainfall_24h_mm ?? 40),
      river_gauge_m: Number(liveSensorReadings.river_gauge_m ?? 3.5),
      soil_saturation_pct: Number(liveSensorReadings.soil_saturation_pct ?? 70),
      temperature_c: Number(liveSensorReadings.temperature_c ?? 26),
      humidity_pct: Number(liveSensorReadings.humidity_pct ?? 70)
    }
    onChangeInputs(baselineTarget)
    onRunSimulation(baselineTarget)
  }

  // Pre-configured simulation presets
  const applyPreset = (presetName: string) => {
    let target = { ...inputs }
    if (presetName === 'monsoon') {
      target = {
        ...target,
        rainfall_24h_mm: 135,
        river_gauge_m: 6.2,
        soil_saturation_pct: 95,
        humidity_pct: 92
      }
    } else if (presetName === 'heatwave') {
      target = {
        ...target,
        temperature_c: 44,
        humidity_pct: 85,
        rainfall_24h_mm: 5,
        river_gauge_m: 2.1
      }
    } else if (presetName === 'flash_flood') {
      target = {
        ...target,
        rainfall_24h_mm: 175,
        river_gauge_m: 7.1,
        soil_saturation_pct: 98
      }
    } else if (presetName === 'arid') {
      target = {
        ...target,
        rainfall_24h_mm: 2,
        river_gauge_m: 1.8,
        soil_saturation_pct: 25,
        temperature_c: 33
      }
    }
    onChangeInputs(target)
    onRunSimulation(target)
  }

  const recommendations = result?.scenario?.recommendations || riskData?.decision_engine?.recommendations || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              Interactive Simulation Laboratory
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">· {location?.name || 'Selected Location'}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              <Zap size={11} /> Real-Time Live Inference Active
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Environmental What-If Scenario Modeling</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perturb environmental inputs to evaluate resilience thresholds. The AI decision engine dynamically recalculates hydrological and ML risks in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={resetToBaseline}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="Reset all sliders to current location live readings"
          >
            <RotateCcw size={14} />
            <span>Reset to Live</span>
          </button>
          <button
            onClick={() => onRunSimulation(inputs)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Simulating…' : 'Run Full Scenario'}</span>
          </button>
        </div>
      </div>

      {/* QUICK PRESET WEATHER EVENTS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Sparkles size={15} className="text-amber-500 shrink-0" />
          <span>Quick Scenario Presets:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => applyPreset('monsoon')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition whitespace-nowrap"
          >
            🌧️ Heavy Monsoon
          </button>
          <button
            onClick={() => applyPreset('flash_flood')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 transition whitespace-nowrap"
          >
            🌊 Flash Flood Breach
          </button>
          <button
            onClick={() => applyPreset('heatwave')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 transition whitespace-nowrap"
          >
            🔥 Severe Heatwave
          </button>
          <button
            onClick={() => applyPreset('arid')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition whitespace-nowrap"
          >
            ☀️ Dry Equilibrium
          </button>
        </div>
      </div>

      {/* DUAL COLUMN LABORATORY */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT: ADJUSTABLE ENVIRONMENTAL INPUTS (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Input Parameter Controls</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Boundary Test
            </span>
          </div>

          {/* Slider 1: 24h Rainfall */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Droplets size={14} className="text-cyan-500" />
                <span>24h Cumulative Rainfall</span>
              </label>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                {inputs.rainfall_24h_mm} mm
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={inputs.rainfall_24h_mm}
              onChange={e => {
                const updated = { ...inputs, rainfall_24h_mm: Number(e.target.value) }
                onChangeInputs(updated)
                onRunSimulation(updated)
              }}
              className="w-full accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 mm (Dry)</span>
              <span>75 mm (Heavy Rain)</span>
              <span>200 mm (Monsoon)</span>
            </div>
          </div>

          {/* Slider 2: River Gauge Level */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-500" />
                <span>River Gauge Water Level</span>
              </label>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                {inputs.river_gauge_m.toFixed(2)} m
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={8.0}
              step={0.05}
              value={inputs.river_gauge_m}
              onChange={e => {
                const updated = { ...inputs, river_gauge_m: parseFloat(e.target.value) }
                onChangeInputs(updated)
                onRunSimulation(updated)
              }}
              className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1.0 m (Normal)</span>
              <span>4.5 m (Flood Stage)</span>
              <span>8.0 m (Crest)</span>
            </div>
          </div>

          {/* Slider 3: Soil Moisture Saturation */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers size={14} className="text-amber-500" />
                <span>Soil Moisture Saturation</span>
              </label>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                {inputs.soil_saturation_pct}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={inputs.soil_saturation_pct}
              onChange={e => {
                const updated = { ...inputs, soil_saturation_pct: Number(e.target.value) }
                onChangeInputs(updated)
                onRunSimulation(updated)
              }}
              className="w-full accent-amber-600 dark:accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>10% (Dry Soil)</span>
              <span>60% (Optimum)</span>
              <span>100% (Super-Saturated)</span>
            </div>
          </div>

          {/* Slider 4: Ambient Temperature */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Thermometer size={14} className="text-orange-500" />
                <span>Ambient Air Temperature</span>
              </label>
              <span className="font-mono font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800">
                {inputs.temperature_c}°C
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={1}
              value={inputs.temperature_c}
              onChange={e => {
                const updated = { ...inputs, temperature_c: Number(e.target.value) }
                onChangeInputs(updated)
                onRunSimulation(updated)
              }}
              className="w-full accent-orange-600 dark:accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>10°C (Cool)</span>
              <span>32°C (Warm)</span>
              <span>50°C (Heatwave)</span>
            </div>
          </div>

          {/* Slider 5: Relative Humidity */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Wind size={14} className="text-teal-500" />
                <span>Relative Humidity</span>
              </label>
              <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                {inputs.humidity_pct}%
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={1}
              value={inputs.humidity_pct}
              onChange={e => {
                const updated = { ...inputs, humidity_pct: Number(e.target.value) }
                onChangeInputs(updated)
                onRunSimulation(updated)
              }}
              className="w-full accent-teal-600 dark:accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>20% (Arid)</span>
              <span>60% (Moderate)</span>
              <span>100% (Dense Fog/Rain)</span>
            </div>
          </div>
        </div>

        {/* RIGHT: COMPARATIVE OUTCOME & SCENARIO RESULTS (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Comparison Delta Cards (3 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Flood Hazard Score */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flood Hazard Score</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                  {simFloodScore}
                </span>
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  {baselineFloodScore}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                  scoreDelta > 0 ? 'text-rose-600 dark:text-rose-400' : scoreDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}>
                  {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts
                </span>
                <span className="text-[10px] text-slate-400">vs live baseline</span>
              </div>
            </div>

            {/* Metric 2: ML Flood Probability */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ML Event Likelihood</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                  {simProb.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  {baselineProb.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                  probDelta > 0 ? 'text-rose-600 dark:text-rose-400' : probDelta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}>
                  {probDelta > 0 ? `+${probDelta.toFixed(1)}%` : `${probDelta.toFixed(1)}%`}
                </span>
                <span className="text-[10px] text-slate-400">probability shift</span>
              </div>
            </div>

            {/* Metric 3: Threat Classification */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Threat Classification</span>
              <div className="mt-2">
                <RiskBadge level={simFloodLevel} score={simFloodScore} size="md" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Baseline was <span className="font-semibold text-slate-700 dark:text-slate-300">{baselineFloodLevel}</span>
              </p>
            </div>
          </div>

          {/* Visual Comparison Bars */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Live Baseline vs Simulated Scenario Index
            </h4>

            {/* Flood Risk Bar - Baseline */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">Live Baseline Index</span>
                <span className="font-mono">{baselineFloodScore}/100</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500" style={{ width: `${baselineFloodScore}%` }} />
              </div>
            </div>

            {/* Flood Risk Bar - Simulated */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-900 dark:text-white font-bold">Simulated Perturbation Index</span>
                <span className={`font-mono font-bold ${scoreDelta > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {simFloodScore}/100
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    simFloodLevel === 'Critical' ? 'bg-rose-500' : simFloodLevel === 'High' ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, simFloodScore))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Decision Escalation Comparison Card */}
          <div className={`rounded-2xl border-2 p-5 transition-all shadow-xs ${
            isEscalated
              ? 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/25'
              : 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/25'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${isEscalated ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {isEscalated ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isEscalated
                      ? 'bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                      : 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    {isEscalated ? '⚠️ ACTION PROTOCOL ESCALATED' : '✓ STABLE UNDER SIMULATION'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {simDecision}
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isEscalated
                    ? 'Simulated hydrological perturbation breached emergency threshold safety limits. The causal reasoning engine automatically escalated protocol from standard observation to targeted containment intervention.'
                    : 'Environmental parameters remain within manageable physical absorption buffers. Baseline monitoring protocols remain sufficient for this scenario.'}
                </p>

                {recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Simulated Response Directive:
                    </span>
                    <div className="space-y-1.5">
                      {recommendations.slice(0, 2).map((rec: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{rec.action}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{rec.rationale}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
