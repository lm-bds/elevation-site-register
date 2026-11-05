import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteAttendance, siteWorkers, sites } from '@/storage/database/shared/schema';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['admin']); if (auth instanceof NextResponse) return auth;
  const start = request.nextUrl.searchParams.get('start'); const end = request.nextUrl.searchParams.get('end');
  const conditions = [start ? gte(siteAttendance.signedOnAt, new Date(start)) : undefined, end ? lte(siteAttendance.signedOnAt, new Date(`${end}T23:59:59`)) : undefined].filter(Boolean) as ReturnType<typeof eq>[];
  const rows = await db.select({ id: siteAttendance.id, site: sites.name, worker: siteWorkers.fullName, phone: siteWorkers.phone, company: siteWorkers.company, signedOnAt: siteAttendance.signedOnAt, signedOffAt: siteAttendance.signedOffAt })
    .from(siteAttendance).innerJoin(sites, eq(siteAttendance.siteId, sites.id)).innerJoin(siteWorkers, eq(siteAttendance.workerId, siteWorkers.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(siteAttendance.signedOnAt));
  const data = rows.map((row) => ({ ...row, hours: row.signedOffAt ? Math.round(((row.signedOffAt.getTime() - row.signedOnAt.getTime()) / 3600000) * 100) / 100 : null }));
  return NextResponse.json(data);
}
