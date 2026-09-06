import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Let client-side role guards and AppState handle real-time role isolation smoothly
  return NextResponse.next();
}

export const config = {
  matcher: ['/courier/:path*', '/seller/:path*', '/office/:path*', '/finance/:path*', '/admin/:path*', '/pending/:path*'],
};
