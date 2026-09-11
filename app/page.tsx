import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { IntelligenceDashboard } from '@/components/intelligence-dashboard'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }
  return <IntelligenceDashboard user={session.user} />
}
