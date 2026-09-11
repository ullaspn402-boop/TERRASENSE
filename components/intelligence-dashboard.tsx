'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mountain, LayoutDashboard, MapPin, Globe2, ShieldAlert,
  Activity, SlidersHorizontal, Radio, Bell, FileText,
  Menu, X, LogOut, ChevronDown, RefreshCw, User as UserIcon,
  ShieldCheck, Plus, CheckCircle2
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ThemeToggle } from './dashboard/theme-toggle'
import { RiskBadge } from './dashboard/risk-badge'
import { OverviewTab } from './dashboard/overview-tab'
import { DecisionEngineTab } from './dashboard/decision-engine-tab'
import { WhatIfTab } from './dashboard/what-if-tab'
import { PredictionsTab } from './dashboard/predictions-tab'
import { EnvironmentTab } from './dashboard/environment-tab'
import { ReportsTab, SavedReportItem } from './dashboard/reports-tab'
import { AlertsTab } from './dashboard/alerts-tab'
import { HistoryTab } from './dashboard/history-tab'
import { LocationsTab } from './dashboard/locations-tab'
import { SaveReportModal } from './dashboard/save-report-modal'

interface UserSession {
  id: string
  name: string
  email: string
  image?: string | null
}

export function IntelligenceDashboard({ user }: { user: UserSession }) {
  const router = useRouter()
  const [active, setActive] = useState('Overview')
  const [locationId, setLocationId] = useState('riverbend')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [range, setRange] = useState('24 hours')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // API State
  const [loading, setLoading] = useState(true)
  const [locationsList, setLocationsList] = useState<any[]>([])
  const [riskData, setRiskData] = useState<any>(null)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [mlMetrics, setMlMetrics] = useState<any>(null)
  const [alertsList, setAlertsList] = useState<any[]>([])

  // What-If State
  const [whatIfInputs, setWhatIfInputs] = useState({
    rainfall_24h_mm: 50,
    river_gauge_m: 4.2,
    soil_saturation_pct: 85,
    temperature_c: 30,
    humidity_pct: 75
  })
  const [whatIfResult, setWhatIfResult] = useState<any>(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)

  // Reports State
  const [reports, setReports] = useState<SavedReportItem[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportSummary, setReportSummary] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Fetch Locations on mount
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch('/api/py/locations')
        if (res.ok) {
          const json = await res.json()
          setLocationsList(json.items || [])
        }
      } catch (err) {
        console.error('Failed to load locations:', err)
      }
    }
    loadLocations()
  }, [])

  // Fetch ML Metrics on mount
  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch('/api/py/ml/metrics')
        if (res.ok) {
          const json = await res.json()
          setMlMetrics(json)
        }
      } catch (err) {
        console.error('Failed to load ML metrics:', err)
      }
    }
    loadMetrics()
  }, [])

  // Fetch Risk & Alerts when location changes
  useEffect(() => {
    async function loadLocationData() {
      setLoading(true)
      try {
        const [riskRes, alertsRes] = await Promise.all([
          fetch(`/api/py/risk/${locationId}`),
          fetch(`/api/py/alerts/${locationId}`)
        ])

        if (riskRes.ok) {
          const rJson = await riskRes.json()
          setRiskData(rJson)
          if (rJson.location) {
            setWhatIfInputs({
              rainfall_24h_mm: rJson.flood?.current_risk?.components ? 45 : 35,
              river_gauge_m: 4.15,
              soil_saturation_pct: 82,
              temperature_c: rJson.heat?.temperature_c || 28,
              humidity_pct: rJson.heat?.humidity_pct || 75
            })
          }
        }

        if (alertsRes.ok) {
          const aJson = await alertsRes.json()
          setAlertsList(aJson.alerts || [])
        }
      } catch (err) {
        console.error('Failed to load location risk:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLocationData()
  }, [locationId])

  // Fetch History when location or range changes
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/py/history/${locationId}?range_type=${encodeURIComponent(range)}`)
        if (res.ok) {
          const json = await res.json()
          setHistoryData(json.points || [])
        }
      } catch (err) {
        console.error('Failed to load history:', err)
      }
    }
    loadHistory()
  }, [locationId, range])

  // Fetch Saved Reports from database
  async function loadReports() {
    setReportsLoading(true)
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const json = await res.json()
        setReports(json.reports || [])
      }
    } catch (err) {
      console.error('Failed to load saved reports:', err)
    } finally {
      setReportsLoading(false)
    }
  }

  useEffect(() => {
    if (active === 'Reports') {
      loadReports()
    }
  }, [active])

  // Run What-If Scenario Calculation
  async function runWhatIf() {
    setWhatIfLoading(true)
    try {
      const res = await fetch(`/api/py/risk/${locationId}/what-if`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatIfInputs)
      })
      if (res.ok) {
        const json = await res.json()
        setWhatIfResult(json)
      }
    } catch (err) {
      console.error('What-if scenario failed:', err)
    } finally {
      setWhatIfLoading(false)
    }
  }

  // Handle Save Report to Neon DB
  async function handleSaveReport(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const locationName = riskData?.location?.name || 'Selected District'
      const payload = {
        title: reportTitle.trim() || `${locationName} Environmental Risk Audit`,
        location: locationName,
        summary: reportSummary.trim() || `Comprehensive environmental audit indicating ${riskData?.decision_engine?.overall_level || 'Moderate'} risk. Decision: ${riskData?.decision_engine?.decision || 'Monitoring'}`,
        category: riskData?.decision_engine?.dominant_hazard || 'Multi-Hazard',
        riskLevel: riskData?.decision_engine?.overall_level || 'Moderate',
        riskScore: riskData?.decision_engine?.overall_score || 50,
        decision: riskData?.decision_engine?.decision || 'Monitor conditions',
        recommendation: riskData?.decision_engine?.recommendations?.[0]?.action || 'Routine monitoring',
        metricsJson: JSON.stringify({
          flood_score: riskData?.flood?.combined_score,
          ml_probability: riskData?.flood?.ml_prediction?.flood_probability,
          heat_index: riskData?.heat?.heat_index_c,
          aqi: riskData?.air_quality?.aqi,
          wqi_score: riskData?.water_quality?.score
        }),
        parametersJson: JSON.stringify(riskData?.explainable_ai?.factors || [])
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to save report')
      }

      setSaveSuccess('Report successfully committed to Neon PostgreSQL database!')
      setReportTitle('')
      setReportSummary('')
      loadReports()
      setTimeout(() => {
        setIsReportModalOpen(false)
        setSaveSuccess('')
      }, 1200)
    } catch (err: any) {
      setSaveError(err.message || 'Error saving report')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete Report from Neon DB
  async function handleDeleteReport(id: number) {
    if (!confirm('Are you sure you want to permanently delete this report from the database?')) return
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id))
      } else {
        const errJson = await res.json()
        alert(errJson.error || 'Failed to delete report.')
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // Handle Sign Out
  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const currentLocation = useMemo(() => {
    return locationsList.find(l => l.id === locationId) || {
      id: 'riverbend',
      name: 'Riverbend District',
      region: 'North Basin',
      elevation: '128m'
    }
  }, [locationsList, locationId])

  const overallScore = riskData?.decision_engine?.overall_score ?? 68
  const overallLevel = riskData?.decision_engine?.overall_level ?? 'Moderate'

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Decision Engine', icon: ShieldCheck, highlight: true },
    { label: 'What-if scenarios', icon: SlidersHorizontal },
    { label: 'Predictions & ML', icon: Activity },
    { label: 'Environment', icon: Globe2 },
    { label: 'Locations', icon: MapPin },
    { label: 'History', icon: Radio },
    { label: 'Alerts', icon: Bell, badge: alertsList.length ? String(alertsList.length) : undefined },
    { label: 'Reports', icon: FileText, badge: reports.length ? String(reports.length) : undefined },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="flex h-[72px] items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Mountain size={20} />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                terra<span className="text-emerald-600 dark:text-emerald-400">sense</span>
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Environmental Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Monitored Watershed Quick Switcher */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 px-2 block mb-1.5">
            Monitored Watershed
          </label>
          <div className="relative">
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 pr-8 transition"
            >
              {locationsList.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.region})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* Nav Links */}
        <div className="px-3 pt-3 flex-1 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.label
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActive(item.label)
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : item.highlight
                    ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* User Card at bottom of Sidebar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                {user.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name || 'Analyst'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition shrink-0"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-5 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-300 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentLocation.name}
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {currentLocation.region}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500">
                Continuous Autonomous Multi-Hazard Risk Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <button
              onClick={() => setActive('Alerts')}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="View Incident Alerts"
            >
              <Bell size={16} />
              {alertsList.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {alertsList.length}
                </span>
              )}
            </button>

            {/* Commit Audit Action CTA */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
            >
              <Plus size={14} />
              <span>Save Risk Audit</span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 pr-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </div>
                <span className="hidden md:inline-block text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {user.name || 'Analyst'}
                </span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50 space-y-1">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name || 'Analyst'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActive('Reports')
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    <FileText size={14} />
                    <span>View Saved Audits</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY VIEWPORT */}
        <main className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
              <p className="text-xs font-semibold text-slate-500">Connecting to telemetry network & running inference…</p>
            </div>
          ) : (
            <>
              {active === 'Overview' && (
                <OverviewTab
                  location={currentLocation}
                  riskData={riskData}
                  historyData={historyData}
                  range={range}
                  setRange={setRange}
                  onNavigateTab={setActive}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                />
              )}

              {active === 'Decision Engine' && (
                <DecisionEngineTab
                  riskData={riskData}
                  location={currentLocation}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                />
              )}

              {active === 'What-if scenarios' && (
                <WhatIfTab
                  location={currentLocation}
                  riskData={riskData}
                  inputs={whatIfInputs}
                  onChangeInputs={setWhatIfInputs}
                  onRunSimulation={runWhatIf}
                  result={whatIfResult}
                  loading={whatIfLoading}
                />
              )}

              {active === 'Predictions & ML' && (
                <PredictionsTab
                  location={currentLocation}
                  riskData={riskData}
                  mlMetrics={mlMetrics}
                />
              )}

              {active === 'Environment' && (
                <EnvironmentTab
                  location={currentLocation}
                  riskData={riskData}
                />
              )}

              {active === 'Locations' && (
                <LocationsTab
                  locations={locationsList}
                  currentLocationId={locationId}
                  onSelectLocation={setLocationId}
                />
              )}

              {active === 'History' && (
                <HistoryTab
                  location={currentLocation}
                  historyData={historyData}
                  range={range}
                  setRange={setRange}
                />
              )}

              {active === 'Alerts' && (
                <AlertsTab
                  location={currentLocation}
                  alerts={alertsList}
                />
              )}

              {active === 'Reports' && (
                <ReportsTab
                  reports={reports}
                  loading={reportsLoading}
                  onOpenCreateModal={() => setIsReportModalOpen(true)}
                  onDeleteReport={handleDeleteReport}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* COMMIT REPORT MODAL */}
      <SaveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleSaveReport}
        locationName={currentLocation.name}
        overallLevel={overallLevel}
        overallScore={overallScore}
        decision={riskData?.decision_engine?.decision || 'Monitor conditions'}
        dominantHazard={riskData?.decision_engine?.dominant_hazard || 'Multi-Hazard'}
        title={reportTitle}
        setTitle={setReportTitle}
        summary={reportSummary}
        setSummary={setReportSummary}
        isSaving={isSaving}
        success={saveSuccess}
        error={saveError}
      />
    </div>
  )
}
