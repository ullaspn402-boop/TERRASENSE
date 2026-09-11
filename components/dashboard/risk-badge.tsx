import { ShieldCheck, AlertTriangle, ShieldAlert, Zap } from 'lucide-react'

export type RiskLevelType = 'Low' | 'Moderate' | 'High' | 'Critical' | string

interface RiskBadgeProps {
  level: RiskLevelType
  score?: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function RiskBadge({ level, score, size = 'sm', showIcon = true }: RiskBadgeProps) {
  const normLevel = (level || 'Moderate').toLowerCase()

  let colorClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
  let Icon = AlertTriangle

  if (normLevel.includes('low')) {
    colorClasses = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    Icon = ShieldCheck
  } else if (normLevel.includes('crit')) {
    colorClasses = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
    Icon = Zap
  } else if (normLevel.includes('high')) {
    colorClasses = 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
    Icon = ShieldAlert
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold',
    lg: 'px-3 py-1.5 text-sm font-bold',
  }[size]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses} tracking-tight`}
      role="status"
      aria-label={`Risk Level: ${level}${score !== undefined ? `, Score ${score}` : ''}`}
    >
      {showIcon && <Icon size={size === 'lg' ? 15 : size === 'md' ? 13 : 11} className="shrink-0" />}
      <span className="capitalize">{level}</span>
      {score !== undefined && (
        <span className="opacity-80 tabular-nums">({score})</span>
      )}
    </span>
  )
}
