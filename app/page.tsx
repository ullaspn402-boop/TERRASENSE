import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { IntelligenceDashboard } from '@/components/intelligence-dashboard'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const isGuest = resolvedParams?.guest === 'true'

  if (isGuest) {
    return (
      <IntelligenceDashboard
        user={{
          id: 'guest-analyst',
          name: 'Guest Analyst',
          email: 'guest@terrasense.ai',
        }}
      />
    )
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user) {
      return <IntelligenceDashboard user={session.user} />
    }
  } catch (error) {
    console.warn('Database auth session check failed, falling back to guest mode:', error)
    return (
      <IntelligenceDashboard
        user={{
          id: 'guest-analyst',
          name: 'Guest Analyst',
          email: 'guest@terrasense.ai',
        }}
      />
    )
  }

  redirect('/sign-in')
}
