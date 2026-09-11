import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AuthForm } from '@/components/auth-form'
import { Mountain, ShieldCheck, Activity, Globe } from 'lucide-react'

export default async function SignInPage() {
  if ((await auth.api.getSession({ headers: await headers() }))?.user) redirect('/')

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#090d16] p-6 transition-colors">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Mountain size={22} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              terra<span className="text-emerald-600 dark:text-emerald-400">sense</span>
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Environmental Intelligence
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-8 shadow-sm dark:shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign In to Platform</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Access real-time multi-hazard risk analytics & decision support.
            </p>
          </div>

          <AuthForm mode="sign-in" />

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Need an analyst workspace?{' '}
            <Link className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline" href="/sign-up">
              Create an account
            </Link>
          </div>
        </section>

        {/* Feature Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <Activity size={14} className="text-emerald-500" />
            <span>ML Random Forest (98% Acc)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-500" />
            <span>Multi-Hazard Decision Engine</span>
          </div>
        </div>
      </div>
    </main>
  )
}
