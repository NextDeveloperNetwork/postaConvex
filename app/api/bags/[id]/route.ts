import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, notes, approvedAt, shipmentIds } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (approvedAt !== undefined) dataToUpdate.approvedAt = approvedAt ? new Date(approvedAt) : null;

    // If shipmentIds provided, replace the join table entries
    if (Array.isArray(shipmentIds)) {
      dataToUpdate.shipments = {
        deleteMany: {},
        create: shipmentIds.map((sid: string) => ({ shipmentId: sid })),
      };
    }

    const updatedBag = await prisma.bag.update({
      where: { id },
      data: dataToUpdate,
      include: {
        shipments: { select: { shipmentId: true } }
      },
    });

    return NextResponse.json({
      success: true,
      bag: {
        ...updatedBag,
        shipmentIds: updatedBag.shipments.map(s => s.shipmentId),
      }
    });
  } catch (error: any) {
    console.error('Error updating bag:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.bag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
