import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { savedReports } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to view reports.' }, { status: 401 })
    }

    const reports = await db
      .select()
      .from(savedReports)
      .where(eq(savedReports.userId, session.user.id))
      .orderBy(desc(savedReports.createdAt))

    return NextResponse.json({ reports })
  } catch (error: any) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to retrieve saved reports.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to save reports.' }, { status: 401 })
    }

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
        userId: session.user.id,
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
