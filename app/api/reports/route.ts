import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { savedReports } from '@/lib/db/schema'
import { eq, desc, and, ilike } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    let session: any = null
    try {
      session = await auth.api.getSession({ headers: await headers() })
    } catch (_) {
      // Session retrieval fallback
    }

    const userId = session?.user?.id || 'guest-analyst'
    const { searchParams } = new URL(request.url)
    const locationParam = searchParams.get('location')

    const conditions = []
    if (userId && userId !== 'guest-analyst') {
      conditions.push(eq(savedReports.userId, userId))
    }

    if (locationParam && locationParam.toLowerCase() !== 'all' && locationParam.trim() !== '') {
      conditions.push(ilike(savedReports.location, `%${locationParam.trim()}%`))
    }

    let query = db.select().from(savedReports)
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    const reports = await query.orderBy(desc(savedReports.createdAt))

    return NextResponse.json({ reports: reports || [] })
  } catch (error: any) {
    console.warn('Failed to fetch reports from DB, returning empty list:', error)
    return NextResponse.json({ reports: [] })
  }
}

export async function POST(request: Request) {
  try {
    let session: any = null
    try {
      session = await auth.api.getSession({ headers: await headers() })
    } catch (_) {
      // Session retrieval fallback
    }

    const effectiveUserId = session?.user?.id || 'guest-analyst'

    const body = await request.json()
    const {
      title,
      location,
      summary,
      category = 'Multi-Hazard',
      riskLevel = 'Moderate',
      riskScore = 50,
      decision = 'Monitor conditions',
      recommendation = '',
      metricsJson = '{}',
      parametersJson = '{}',
    } = body

    if (!title || !location || !summary) {
      return NextResponse.json({ error: 'Missing required report fields (title, location, summary).' }, { status: 400 })
    }

    const [newReport] = await db
      .insert(savedReports)
      .values({
        userId: effectiveUserId,
        title: String(title).trim(),
        location: String(location).trim(),
        summary: String(summary).trim(),
        category: String(category),
        riskLevel: String(riskLevel),
        riskScore: Number(riskScore) || 50,
        decision: String(decision),
        recommendation: String(recommendation),
        metricsJson: typeof metricsJson === 'string' ? metricsJson : JSON.stringify(metricsJson),
        parametersJson: typeof parametersJson === 'string' ? parametersJson : JSON.stringify(parametersJson),
      })
      .returning()

    return NextResponse.json({ report: newReport }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create report:', error)
    return NextResponse.json({ error: 'Failed to save report to database.' }, { status: 500 })
  }
}

