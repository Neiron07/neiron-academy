import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { COOKIE_TOKEN } from '@/lib/session';

async function handle(req: NextRequest, path: string[]) {
  const token = req.cookies.get(COOKIE_TOKEN)?.value;
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    headers['content-type'] = 'application/json';
    body = await req.text();
  }

  const upstream = await backendFetch(`/api/${path.join('/')}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path);
}
