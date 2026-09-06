import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const bags = await prisma.bag.findMany({
      include: {
        shipments: { select: { shipmentId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map DB shape to client shape: { shipmentIds: string[] }
    const mapped = bags.map(b => ({
      ...b,
      shipmentIds: b.shipments.map(s => s.shipmentId),
    }));

    return NextResponse.json({ success: true, bags: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      courierId,
      courierName,
      officeId,
      officeName,
      destinationOfficeId,
      destinationOfficeName,
      bagType = 'DELIVERY',
      shipmentIds = [],
      notes,
    } = body;

    const newBag = await prisma.bag.create({
      data: {
        courierId,
        courierName: courierName || '',
        officeId,
        officeName: officeName || '',
        destinationOfficeId: destinationOfficeId || null,
        destinationOfficeName: destinationOfficeName || null,
        bagType,
        notes: notes || null,
        status: 'PENDING_APPROVAL',
        shipments: {
          create: (shipmentIds as string[]).map((id: string) => ({
            shipmentId: id,
          })),
        },
      },
      include: {
        shipments: { select: { shipmentId: true } }
      },
    });

    return NextResponse.json({
      success: true,
      bag: {
        ...newBag,
        shipmentIds: newBag.shipments.map(s => s.shipmentId),
      }
    });
  } catch (error: any) {
    console.error('Error creating bag:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
