import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const rawBatches = await prisma.payoutDispatchBatch.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const payoutBatches = rawBatches.map(b => {
      let parsedSellerPayouts = [];
      if (b.itemsJson) {
        try {
          parsedSellerPayouts = JSON.parse(b.itemsJson);
        } catch {
          parsedSellerPayouts = [];
        }
      }
      return {
        ...b,
        sellerPayouts: parsedSellerPayouts,
      };
    });
    return NextResponse.json({ success: true, payoutBatches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const batchCode = body.batchCode || `BAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const itemsJson = body.itemsJson || (body.sellerPayouts ? JSON.stringify(body.sellerPayouts) : null);

    const batch = await prisma.payoutDispatchBatch.create({
      data: {
        batchCode,
        officeId: body.officeId,
        officeName: body.officeName,
        courierId: body.courierId,
        courierName: body.courierName,
        totalAmount: Number(body.totalAmount),
        adminProfitAmount: Number(body.adminProfitAmount || 0),
        officeCommissionAmount: Number(body.officeCommissionAmount || 0),
        status: body.status || 'PENDING_COURIER_PICKUP',
        dispatchedByName: body.dispatchedByName || 'Financa Qendrore',
        itemsJson,
      },
    });

    return NextResponse.json({
      success: true,
      batch: {
        ...batch,
        sellerPayouts: body.sellerPayouts || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
