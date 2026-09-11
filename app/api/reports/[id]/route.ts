import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { savedReports } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { id } = await params
    const reportId = parseInt(id, 10)
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID.' }, { status: 400 })
    }

    const [report] = await db
      .select()
      .from(savedReports)
      .where(and(eq(savedReports.id, reportId), eq(savedReports.userId, session.user.id)))

    if (!report) {
      return NextResponse.json({ error: 'Report not found or access denied.' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('Failed to get report:', error)
    return NextResponse.json({ error: 'Failed to retrieve report.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { id } = await params
    const reportId = parseInt(id, 10)
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID.' }, { status: 400 })
    }

    const [deleted] = await db
      .delete(savedReports)
      .where(and(eq(savedReports.id, reportId), eq(savedReports.userId, session.user.id)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Report not found or not owned by user.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Report deleted successfully.', deletedId: deleted.id })
  } catch (error: any) {
    console.error('Failed to delete report:', error)
    return NextResponse.json({ error: 'Failed to delete report.' }, { status: 500 })
  }
}
