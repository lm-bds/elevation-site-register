import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sites } from '@/storage/database/shared/schema';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['admin']); if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await db.select().from(sites).orderBy(desc(sites.createdAt)));
}
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['admin']); if (auth instanceof NextResponse) return auth;
  const body = await request.json(); const name = String(body.name || '').trim().slice(0, 160); const address = String(body.address || '').trim().slice(0, 240);
  if (!name) return NextResponse.json({ error: 'Site name is required.' }, { status: 400 });
  const [site] = await db.insert(sites).values({ name, address: address || null, qrToken: crypto.randomBytes(18).toString('base64url') }).returning();
  return NextResponse.json(site, { status: 201 });
}
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request, ['admin']); if (auth instanceof NextResponse) return auth;
  const body = await request.json(); const id = Number(body.id); if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid site.' }, { status: 400 });
  const [site] = await db.update(sites).set({ active: Boolean(body.active) }).where(eq(sites.id, id)).returning();
  return site ? NextResponse.json(site) : NextResponse.json({ error: 'Site not found.' }, { status: 404 });
}
