import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      status,
      paymentStatus,
      courierId,
      courierName,
      destinationOfficeId,
      destinationOfficeName,
      log,
    } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (paymentStatus !== undefined) dataToUpdate.paymentStatus = paymentStatus;
    if (courierId !== undefined) dataToUpdate.courierId = courierId;
    if (courierName !== undefined) dataToUpdate.courierName = courierName;
    if (destinationOfficeId !== undefined) dataToUpdate.destinationOfficeId = destinationOfficeId;
    if (destinationOfficeName !== undefined) dataToUpdate.destinationOfficeName = destinationOfficeName;

    if (log) {
      dataToUpdate.logs = {
        create: {
          status: log.status || status || 'UPDATED',
          notes: log.notes || '',
          location: log.location || '',
          createdBy: log.createdBy || 'System'
        }
      };
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: dataToUpdate,
      include: { logs: { orderBy: { createdAt: 'asc' } } }
    });

    return NextResponse.json({ success: true, shipment: updatedShipment });
  } catch (error: any) {
    console.error('Error updating shipment in DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.shipment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
