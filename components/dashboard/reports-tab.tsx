import { useState } from 'react'
import {
  FileText, Plus, Trash2, Eye, Calendar, MapPin, Download, CheckCircle, Database, Search
} from 'lucide-react'
import { RiskBadge } from './risk-badge'

export interface SavedReportItem {
  id: number
  userId: string
  title: string
  location: string
  summary: string
  category: string
  riskLevel: string
  riskScore: number
  decision: string
  recommendation: string
  metricsJson?: string | null
  parametersJson?: string | null
  createdAt: string
}

interface ReportsTabProps {
  reports: SavedReportItem[]
  loading: boolean
  onOpenCreateModal: () => void
  onDeleteReport: (id: number) => void
}

export function ReportsTab({ reports, loading, onOpenCreateModal, onDeleteReport }: ReportsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState<SavedReportItem | null>(null)

  const filteredReports = reports.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.decision?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              PostgreSQL Persistence
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">· {reports.length} Commits Stored</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Environmental Audit Reports & Archival</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically timestamped audits stored in Neon PostgreSQL database with per-user ownership and full parameter telemetry.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
        >
          <Plus size={15} />
          <span>Commit New Risk Audit</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search reports by title, location, decision, or category…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 shrink-0">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredReports.length}</span> of {reports.length}
        </div>
      </div>

      {/* REPORTS TABLE / LIST */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent mb-2" />
            <p>Loading reports from Neon PostgreSQL database…</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
              <FileText size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Audits Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm ? 'No reports matched your search query.' : 'No audit reports have been saved yet. Click "Commit New Risk Audit" above to save the current telemetry state.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-3.5 px-4">Audit Title & Location</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Risk Evaluation</th>
                  <th className="py-3.5 px-4">Engine Decision</th>
                  <th className="py-3.5 px-4">Committed On</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{report.title}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-emerald-500" />
                        <span>{report.location}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {report.category || 'Multi-Hazard'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={report.riskLevel} score={report.riskScore} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{report.decision}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                        title="View Full Audit"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteReport(report.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        title="Delete from Database"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW REPORT DETAILS MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    AUDIT RECORD #{selectedReport.id}
                  </span>
                  <RiskBadge level={selectedReport.riskLevel} score={selectedReport.riskScore} size="sm" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedReport.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Location: {selectedReport.location} · {new Date(selectedReport.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold uppercase text-slate-400 text-[10px]">Executive Summary</span>
                <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedReport.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <span className="font-bold uppercase text-slate-400 text-[10px]">Decision Directive</span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">{selectedReport.decision}</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <span className="font-bold uppercase text-slate-400 text-[10px]">Action Recommendation</span>
                  <p className="mt-1 font-bold text-emerald-700 dark:text-emerald-400">{selectedReport.recommendation}</p>
                </div>
              </div>

              {selectedReport.metricsJson && (
                <div>
                  <span className="font-bold uppercase text-slate-400 text-[10px]">Telemetry Metrics Payload</span>
                  <pre className="mt-1 bg-slate-950 text-slate-200 p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedReport.metricsJson), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline"
              >
                <Download size={14} />
                <span>Print / Export PDF</span>
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-xs font-bold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
