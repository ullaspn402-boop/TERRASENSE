import { MapPin, ArrowRight, ShieldCheck, CheckCircle2, Activity } from 'lucide-react'

interface LocationsTabProps {
  locations: any[]
  currentLocationId: string
  onSelectLocation: (id: string) => void
}

export function LocationsTab({ locations, currentLocationId, onSelectLocation }: LocationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Jurisdiction Network
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">· {locations.length} Telemetered Watersheds</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Monitored Geographical Zones</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Select any zone to load active physical hydrographs, weather feeds, and custom AI risk classification models.
        </p>
      </div>

      {/* LOCATION CARDS GRID */}
      <div className="grid gap-5 md:grid-cols-2">
        {locations.map((loc) => {
          const isCurrent = loc.id === currentLocationId
          return (
            <div
              key={loc.id}
              className={`rounded-2xl border p-6 transition-all shadow-xs ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {loc.region || 'Catchment Zone'}
                  </span>
                  <h3 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white">{loc.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {loc.description || 'Continuous river gauge monitoring with integrated geotechnical slope sensors.'}
                  </p>
                </div>

                <div className={`p-2.5 rounded-xl ${isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <MapPin size={20} />
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {loc.id}
                </span>

                {isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={15} />
                    <span>Active Telemetry Zone</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectLocation(loc.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>Switch to this zone</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
