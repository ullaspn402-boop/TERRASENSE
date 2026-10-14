import { useState, useMemo, useEffect } from 'react'
import {
  FileText, Plus, Trash2, Eye, Calendar, MapPin, Download, CheckCircle,
  Database, Search, Filter, Globe, ChevronRight, AlertCircle, RefreshCw
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
  currentLocation?: { id: string; name: string }
  locationsList?: Array<{ id: string; name: string }>
  onOpenCreateModal: () => void
  onDeleteReport: (id: number) => void
  onSelectLocation?: (locationId: string) => void
}

export function ReportsTab({
  reports,
  loading,
  currentLocation,
  locationsList = [],
  onOpenCreateModal,
  onDeleteReport,
  onSelectLocation
}: ReportsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState<SavedReportItem | null>(null)
  
  // Default filter to current location so reports from other locations don't bleed in!
  const [locationFilter, setLocationFilter] = useState<string>(currentLocation?.name || 'All')

  // Automatically sync when user changes location in the dashboard header
  useEffect(() => {
    if (currentLocation?.name) {
      setLocationFilter(currentLocation.name)
    }
  }, [currentLocation?.name])

  // Count reports strictly per location without double-counting
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = { All: reports.length }
    for (const l of locationsList) {
      counts[l.name] = 0
    }
    for (const r of reports) {
      const rLoc = (r.location || '').toLowerCase().trim()
      let matched = false
      for (const l of locationsList) {
        const target = l.name.toLowerCase().trim()
        if (rLoc === target || rLoc.includes(target) || target.includes(rLoc)) {
          counts[l.name] = (counts[l.name] || 0) + 1
          matched = true
          break
        }
      }
      if (!matched && r.location) {
        counts[r.location] = (counts[r.location] || 0) + 1
      }
    }
    return counts
  }, [reports, locationsList])

  // 1. Filter strictly by location first
  const locationFilteredReports = useMemo(() => {
    if (locationFilter === 'All') return reports
    return reports.filter(r => {
      const reportLoc = (r.location || '').toLowerCase().trim()
      const filterLoc = locationFilter.toLowerCase().trim()
      return reportLoc === filterLoc || reportLoc.includes(filterLoc) || filterLoc.includes(reportLoc)
    })
  }, [reports, locationFilter])

  // 2. Filter by search term within the location-filtered subset
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return locationFilteredReports
    const term = searchTerm.toLowerCase()
    return locationFilteredReports.filter(r =>
      r.title?.toLowerCase().includes(term) ||
      r.location?.toLowerCase().includes(term) ||
      r.category?.toLowerCase().includes(term) ||
      r.decision?.toLowerCase().includes(term) ||
      r.summary?.toLowerCase().includes(term)
    )
  }, [locationFilteredReports, searchTerm])

  const handlePrint = () => {
    window.print()
  }

  const isFilteredToCurrent = currentLocation?.name && locationFilter === currentLocation.name

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              PostgreSQL Persistence
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · Location-Isolated Audits ({filteredReports.length} {locationFilter !== 'All' ? `for ${locationFilter}` : 'total'})
            </span>
            {isFilteredToCurrent && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <MapPin size={11} /> Scoped to Active Location
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Environmental Audit Reports & Archival</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically timestamped audits stored in Neon PostgreSQL database with strict per-location isolation and full parameter telemetry.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shrink-0"
        >
          <Plus size={15} />
          <span>Commit New Audit for {currentLocation?.name || 'Location'}</span>
        </button>
      </div>

      {/* LOCATION FILTER PILLS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <Filter size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Scope by Location:</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {locationFilter !== 'All' ? `Showing audits strictly for ${locationFilter}` : 'Viewing all audit records across all zones'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Active Location Button (Quick Focus) */}
          {currentLocation?.name && (
            <button
              onClick={() => setLocationFilter(currentLocation.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                locationFilter === currentLocation.name
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <MapPin size={12} />
              <span>Current: {currentLocation.name}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                locationFilter === currentLocation.name ? 'bg-emerald-800 text-white' : 'bg-emerald-200/80 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}>
                {locationCounts[currentLocation.name] || 0}
              </span>
            </button>
          )}

          {/* All Locations Button */}
          <button
            onClick={() => setLocationFilter('All')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              locationFilter === 'All'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Globe size={12} />
            <span>All Locations</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {reports.length}
            </span>
          </button>

          {/* Individual Location Pills */}
          {locationsList.map((loc) => {
            if (loc.name === currentLocation?.name) return null // Already shown as active
            const count = locationCounts[loc.name] || 0
            const isSelected = locationFilter === loc.name
            return (
              <button
                key={loc.id}
                onClick={() => setLocationFilter(loc.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <span>{loc.name}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Search audits within ${locationFilter !== 'All' ? locationFilter : 'all locations'} by title, decision, or category…`}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 shrink-0">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredReports.length}</span> of {locationFilteredReports.length} audits
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
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {locationFilter !== 'All'
                ? `No Audits Found for ${locationFilter}`
                : 'No Audit Reports Found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm ? (
                'No reports matched your search query in this location.'
              ) : locationFilter !== 'All' ? (
                <>
                  No audit reports have been saved specifically for <span className="font-bold text-slate-700 dark:text-slate-300">{locationFilter}</span> yet.
                  Reports from other locations are isolated so you only see audits relevant to this location.
                </>
              ) : (
                'No audit reports have been saved in the database yet. Click "Commit New Audit" above to record current conditions.'
              )}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-bold hover:bg-emerald-700 transition"
              >
                <Plus size={14} />
                <span>Commit Audit for {locationFilter !== 'All' ? locationFilter : (currentLocation?.name || 'Current Location')}</span>
              </button>
              {locationFilter !== 'All' && reports.length > 0 && (
                <button
                  onClick={() => setLocationFilter('All')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <Globe size={14} />
                  <span>View All Locations ({reports.length})</span>
                </button>
              )}
            </div>
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
                        <span className="font-medium text-slate-600 dark:text-slate-400">{report.location}</span>
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
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin size={12} className="text-emerald-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedReport.location}</span>
                  <span>·</span>
                  <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
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
                    {(() => {
                      try {
                        return JSON.stringify(typeof selectedReport.metricsJson === 'string' ? JSON.parse(selectedReport.metricsJson) : selectedReport.metricsJson, null, 2)
                      } catch (_) {
                        return String(selectedReport.metricsJson)
                      }
                    })()}
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
