import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const offices = await prisma.office.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const shipments = await prisma.shipment.findMany({
      include: {
        logs: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const ledgers = await prisma.financeLedger.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const rawBags = await prisma.bag.findMany({
      include: { shipments: { select: { shipmentId: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const handovers = await prisma.officeCashHandover.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const rawPayoutBatches = await prisma.payoutDispatchBatch.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const payoutBatches = rawPayoutBatches.map(b => {
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

    let payoutProofs = [];
    try {
      payoutProofs = await (prisma as any).sellerPayoutProof.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (pErr) {
      console.warn('Error fetching payoutProofs in sync:', pErr);
    }

    // Map DB BagShipment join rows → flat shipmentIds array for client store
    const bags = rawBags.map(b => ({
      ...b,
      shipmentIds: b.shipments.map(s => s.shipmentId),
    }));

    const dbPrisma = prisma as any;
    let cities = [];
    try {
      cities = await dbPrisma.city.findMany({
        include: { office: { select: { id: true, name: true, city: true, status: true } } },
        orderBy: { name: 'asc' }
      });

      // Seed default Albanian cities if DB is empty
      if (cities.length === 0) {
        const defaultCityNames = ['Tirane', 'Durres', 'Kavaje', 'Rrogozhine', 'Vore'];
        for (const cityName of defaultCityNames) {
          const matchedOffice = offices.find(o => o.city.toLowerCase() === cityName.toLowerCase());
          await dbPrisma.city.create({
            data: {
              name: cityName,
              officeId: matchedOffice ? matchedOffice.id : null
            }
          });
        }
        cities = await dbPrisma.city.findMany({
          include: { office: { select: { id: true, name: true, city: true, status: true } } },
          orderBy: { name: 'asc' }
        });
      }
    } catch (cErr) {
      console.warn('City table query fallback:', cErr);
    }

    return NextResponse.json({
      success: true,
      offices,
      cities,
      users,
      shipments,
      ledgers,
      bags,
      handovers,
      payoutBatches,
      payoutProofs,
    });
  } catch (error: any) {
    console.error('Error fetching data from Neon DB:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
