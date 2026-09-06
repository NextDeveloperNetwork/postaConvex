import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const statusToSave = body.status;
    const dataToUpdate: any = {
      status: statusToSave,
    };

    if (statusToSave === 'IN_TRANSIT') {
      dataToUpdate.courierAcceptedAt = new Date();
      if (body.courierSignature) dataToUpdate.courierSignature = body.courierSignature;
    }

    if (statusToSave === 'RECEIVED_BY_OFFICE') {
      dataToUpdate.receivedAt = new Date();
      if (body.receivedByName) dataToUpdate.receivedByName = body.receivedByName;
    }

    if (statusToSave === 'REJECTED') {
      dataToUpdate.rejectionReason = body.rejectionReason || 'Refuzuar nga kurieri ose zyra';
    }

    const batch = await prisma.payoutDispatchBatch.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    let parsedSellerPayouts = [];
    if (batch.itemsJson) {
      try {
        parsedSellerPayouts = JSON.parse(batch.itemsJson);
      } catch {
        parsedSellerPayouts = [];
      }
    }

    return NextResponse.json({
      success: true,
      batch: {
        ...batch,
        sellerPayouts: parsedSellerPayouts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
