import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updateData: any = {
      status: body.status,
    };

    if (body.status === 'TRANSIT_TO_FINANCE') {
      updateData.courierAcceptedAt = new Date();
      if (body.courierSignature) updateData.courierSignature = body.courierSignature;
    }

    if (body.status === 'REJECTED') {
      updateData.rejectionReason = body.rejectionReason || 'Refuzuar nga kurieri ose financa';
    }

    if (body.status === 'APPROVED' || body.status === 'RECEIVED_BY_FINANCE') {
      updateData.approvedAt = new Date();
      updateData.receivedByFinanceAt = new Date();
      if (body.financeRecipientName) updateData.financeRecipientName = body.financeRecipientName;
    }

    const handover = await prisma.officeCashHandover.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json({ success: true, handover });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
