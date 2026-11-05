import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sites } from '@/storage/database/shared/schema';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['admin']); if (auth instanceof NextResponse) return auth;
  const { id } = await params; const siteId = Number(id);
  if (!Number.isInteger(siteId)) return NextResponse.json({ error: 'Invalid site.' }, { status: 400 });
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site) return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
  const origin = request.nextUrl.origin;
  const target = `${origin}/public/site/${site.qrToken}`;
  const svg = await QRCode.toString(target, { type: 'svg', errorCorrectionLevel: 'H', margin: 2, color: { dark: '#060608', light: '#ffffff' } });
  return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Content-Disposition': `inline; filename="${site.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-qr.svg"`, 'Cache-Control': 'no-store' } });
}
