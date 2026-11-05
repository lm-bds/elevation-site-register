import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteAttendance, siteWorkers, sites } from '@/storage/database/shared/schema';

export const dynamic = 'force-dynamic';

function clean(value: unknown, maximum: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maximum) : '';
}

// The QR token identifies the site; the worker identity is supplied by the phone.
// Explicit action avoids accidental sign-off merely from opening the QR link.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = clean(body.token, 96);
  const action = clean(body.action, 8);
  const fullName = clean(body.fullName, 120);
  const phone = clean(body.phone, 40);
  const company = clean(body.company, 120);
  if (!token || !['on', 'off'].includes(action) || !fullName || !phone || !company) {
    return NextResponse.json({ error: 'Site, action, name, mobile number and company are required.' }, { status: 400 });
  }

  const [site] = await db.select().from(sites).where(and(eq(sites.qrToken, token), eq(sites.active, true))).limit(1);
  if (!site) return NextResponse.json({ error: 'This site QR code is not active.' }, { status: 404 });

  let [worker] = await db.select().from(siteWorkers).where(eq(siteWorkers.phone, phone)).limit(1);
  if (!worker) {
    [worker] = await db.insert(siteWorkers).values({ fullName, phone, company }).returning();
  } else if (worker.fullName !== fullName || worker.company !== company) {
    [worker] = await db.update(siteWorkers).set({ fullName, company, updatedAt: new Date() }).where(eq(siteWorkers.id, worker.id)).returning();
  }

  const [open] = await db.select().from(siteAttendance)
    .where(and(eq(siteAttendance.siteId, site.id), eq(siteAttendance.workerId, worker.id), isNull(siteAttendance.signedOffAt)))
    .orderBy(desc(siteAttendance.signedOnAt)).limit(1);

  if (action === 'on') {
    if (open) return NextResponse.json({ error: 'You are already signed on at this site.', session: open }, { status: 409 });
    const [session] = await db.insert(siteAttendance).values({ siteId: site.id, workerId: worker.id }).returning();
    return NextResponse.json({ message: `Signed on to ${site.name}.`, site: site.name, session }, { status: 201 });
  }

  if (!open) return NextResponse.json({ error: 'No open sign-on was found for this site.' }, { status: 404 });
  const [session] = await db.update(siteAttendance).set({ signedOffAt: new Date() }).where(eq(siteAttendance.id, open.id)).returning();
  return NextResponse.json({ message: `Signed off from ${site.name}.`, site: site.name, session });
}
