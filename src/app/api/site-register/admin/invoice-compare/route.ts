import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteAttendance, siteWorkers, sites } from '@/storage/database/shared/schema';
import { requireAuth } from '@/lib/auth';

type InvoiceLine = { company: string; worker: string; site: string; date: string; hours: number };
function value(line: string): string[] { return line.split(',').map(x => x.trim().replace(/^"|"$/g, '')); }
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['admin']); if (auth instanceof NextResponse) return auth;
  const csv = String((await request.json()).csv || '').trim();
  const [header, ...raw] = csv.split(/\r?\n/).filter(Boolean); const columns = value(header).map(x => x.toLowerCase());
  const need = ['company', 'worker', 'site', 'date', 'hours']; if (!need.every(x => columns.includes(x))) return NextResponse.json({ error: 'CSV needs headers: company,worker,site,date,hours' }, { status: 400 });
  const lines: InvoiceLine[] = raw.map(value).map(row => Object.fromEntries(columns.map((key, i) => [key, row[i] || ''])) as unknown as InvoiceLine).map(x => ({ ...x, hours: Number(x.hours) })).filter(x => x.company && x.worker && x.site && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && Number.isFinite(x.hours));
  const results = await Promise.all(lines.map(async line => {
    const from = new Date(`${line.date}T00:00:00`), to = new Date(`${line.date}T23:59:59.999`);
    const sessions = await db.select({ signedOnAt: siteAttendance.signedOnAt, signedOffAt: siteAttendance.signedOffAt }).from(siteAttendance).innerJoin(siteWorkers, eq(siteAttendance.workerId, siteWorkers.id)).innerJoin(sites, eq(siteAttendance.siteId, sites.id)).where(and(eq(siteWorkers.company, line.company), eq(siteWorkers.fullName, line.worker), eq(sites.name, line.site), gte(siteAttendance.signedOnAt, from), lte(siteAttendance.signedOnAt, to)));
    const recordedHours = sessions.reduce((n, s) => n + (s.signedOffAt ? (s.signedOffAt.getTime() - s.signedOnAt.getTime()) / 3600000 : 0), 0);
    return { ...line, recordedHours: Math.round(recordedHours * 100) / 100, varianceHours: Math.round((line.hours - recordedHours) * 100) / 100, status: sessions.some(s => !s.signedOffAt) ? 'OPEN_SESSION' : sessions.length === 0 ? 'NO_ATTENDANCE' : Math.abs(line.hours - recordedHours) < 0.01 ? 'MATCH' : 'VARIANCE' };
  }));
  return NextResponse.json(results);
}
