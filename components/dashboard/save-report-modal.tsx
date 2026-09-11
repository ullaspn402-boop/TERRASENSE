import { FormEvent } from 'react'
import { Database, Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { RiskBadge } from './risk-badge'

interface SaveReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  locationName: string
  overallLevel: string
  overallScore: number
  decision: string
  dominantHazard: string
  title: string
  setTitle: (t: string) => void
  summary: string
  setSummary: (s: string) => void
  isSaving: boolean
  success: string
  error: string
}

export function SaveReportModal({
  isOpen,
  onClose,
  onSubmit,
  locationName,
  overallLevel,
  overallScore,
  decision,
  dominantHazard,
  title,
  setTitle,
  summary,
  setSummary,
  isSaving,
  success,
  error
}: SaveReportModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Commit Risk Audit to Database</h3>
              <p className="text-xs text-slate-400">Neon PostgreSQL Serverless Persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Telemetry Snapshot Pill */}
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Target Location:</span>
            <span className="font-bold text-slate-900 dark:text-white">{locationName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Assessed Risk:</span>
            <RiskBadge level={overallLevel} score={overallScore} size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Engine Decision:</span>
            <span className="font-bold text-slate-900 dark:text-white text-right max-w-[240px] truncate">{decision}</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Audit Report Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`${locationName} Environmental Risk Audit`}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Field Notes / Environmental Justification
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder={`Comprehensive environmental audit indicating ${overallLevel} risk. Recommended decision: ${decision}`}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Committing…</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>Commit to Neon DB</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
