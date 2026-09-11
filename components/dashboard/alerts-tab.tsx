import { useState } from 'react'
import {
  Bell, AlertTriangle, ShieldAlert, Info, CheckCircle2, Clock, MapPin, Filter
} from 'lucide-react'
import { RiskBadge } from './risk-badge'

interface AlertsTabProps {
  location: any
  alerts: any[]
}

export function AlertsTab({ location, alerts }: AlertsTabProps) {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL')

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true
    return (a.severity || '').toUpperCase() === filter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Live Dispatch Feed
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">· {location.name}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Environmental Alerts & Incident Feed</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated sensor anomalies, threshold exceedances, and escalated emergency notifications.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-1 shadow-xs">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => {
            const count = sev === 'ALL' ? alerts.length : alerts.filter(a => (a.severity || '').toUpperCase() === sev).length
            return (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  filter === sev
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{sev}</span>
                <span className="font-mono text-[10px] opacity-75">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ALERTS CARDS LIST */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active Alerts</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All sensors and hydrodynamic models in {location.name} are reporting telemetry within nominal parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const sev = (alert.severity || 'INFO').toUpperCase()
            const isCritical = sev === 'CRITICAL'
            const isWarning = sev === 'WARNING'

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 transition shadow-xs ${
                  isCritical
                    ? 'border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      isCritical
                        ? 'bg-rose-500 text-white'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {isCritical ? <ShieldAlert size={18} /> : isWarning ? <AlertTriangle size={18} /> : <Info size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                            : isWarning
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {sev}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          <span>{alert.timestamp || 'Live Active'}</span>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{alert.title || alert.message}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{alert.description || alert.reason || 'Threshold exceedance detected by telemetry monitoring grid.'}</p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Trigger Threshold</span>
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{alert.metric || 'Telemetry Trigger'}</p>
                  </div>
                </div>

                {alert.action && (
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Recommended Field Response:</span>
                    <span className="text-slate-700 dark:text-slate-300">{alert.action}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
