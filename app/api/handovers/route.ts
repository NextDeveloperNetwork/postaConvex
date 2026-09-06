import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const handovers = await prisma.officeCashHandover.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, handovers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transferCode = body.transferCode || `TRF-${Math.floor(100000 + Math.random() * 900000)}`;
    const defaultStatus = body.courierId ? 'PENDING_COURIER_PICKUP' : (body.status || 'PENDING_APPROVAL');

    const handover = await prisma.officeCashHandover.create({
      data: {
        transferCode,
        officeId: body.officeId,
        officeName: body.officeName,
        courierId: body.courierId || null,
        courierName: body.courierName || null,
        amount: Number(body.amount),
        shipmentCount: body.shipmentCount || 0,
        status: body.status || defaultStatus,
        submittedBy: body.submittedBy,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({ success: true, handover });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
