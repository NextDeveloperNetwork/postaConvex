import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const shipments = await prisma.shipment.findMany({
      include: { logs: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, shipments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      trackingNumber,
      barcode,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      destinationAddress,
      destinationCity,
      codAmount,
      shippingFee = 300,
      courierFee = 0,
      sellerNet,
      packageType = 'COD',
      shippingFeePaidBySender = false,
      originOfficeId,
      originOfficeName,
      destinationOfficeId,
      destinationOfficeName,
      sellerId,
      sellerName,
      status = 'CREATED',
      paymentStatus = 'UNPAID',
      logs = []
    } = body;

    // Check if sellerId actually exists in User table
    let validSellerId: string | null = null;
    if (sellerId && sellerId !== 'walk-in') {
      const existingUser = await prisma.user.findUnique({ where: { id: sellerId } });
      if (existingUser) {
        validSellerId = existingUser.id;
      }
    }

    const newShipment = await prisma.shipment.create({
      data: {
        trackingNumber,
        barcode,
        senderName,
        senderPhone,
        recipientName,
        recipientPhone,
        destinationAddress,
        destinationCity,
        codAmount: Number(codAmount),
        shippingFee: Number(shippingFee),
        courierFee: Number(courierFee),
        sellerNet: Number(sellerNet),
        packageType,
        shippingFeePaidBySender,
        originOfficeId,
        originOfficeName: originOfficeName || '',
        destinationOfficeId,
        destinationOfficeName: destinationOfficeName || '',
        sellerId: validSellerId,
        sellerName: sellerName || '',
        status,
        paymentStatus,
        logs: {
          create: logs.map((log: any) => ({
            status: log.status || 'CREATED',
            notes: log.notes || '',
            location: log.location || '',
            createdBy: log.createdBy || sellerName || 'System'
          }))
        }
      },
      include: { logs: true }
    });

    return NextResponse.json({ success: true, shipment: newShipment });
  } catch (error: any) {
    console.error('Error creating shipment in DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
