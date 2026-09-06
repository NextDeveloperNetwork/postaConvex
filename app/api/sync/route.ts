import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const dbPrisma = prisma as any;

    const [
      offices,
      users,
      shipments,
      ledgers,
      rawBags,
      handovers,
      rawPayoutBatches,
      payoutProofs,
      rawCities,
    ] = await Promise.all([
      prisma.office.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.shipment.findMany({
        include: { logs: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.financeLedger.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.bag.findMany({
        include: { shipments: { select: { shipmentId: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.officeCashHandover.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.payoutDispatchBatch.findMany({ orderBy: { createdAt: 'desc' } }),
      dbPrisma.sellerPayoutProof
        ? dbPrisma.sellerPayoutProof.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => [])
        : Promise.resolve([]),
      dbPrisma.city
        ? dbPrisma.city.findMany({
            include: { office: { select: { id: true, name: true, city: true, status: true } } },
            orderBy: { name: 'asc' },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const payoutBatches = (rawPayoutBatches || []).map((b: any) => {
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

    const bags = (rawBags || []).map((b: any) => ({
      ...b,
      shipmentIds: b.shipments ? b.shipments.map((s: any) => s.shipmentId) : [],
    }));

    let cities = rawCities || [];
    if (cities.length === 0 && dbPrisma.city && offices.length > 0) {
      try {
        const defaultCityNames = ['Tirane', 'Durres', 'Kavaje', 'Rrogozhine', 'Vore'];
        await Promise.all(
          defaultCityNames.map(cityName => {
            const matchedOffice = offices.find(o => o.city.toLowerCase() === cityName.toLowerCase());
            return dbPrisma.city.create({
              data: {
                name: cityName,
                officeId: matchedOffice ? matchedOffice.id : null,
              },
            }).catch(() => null);
          })
        );
        cities = await dbPrisma.city.findMany({
          include: { office: { select: { id: true, name: true, city: true, status: true } } },
          orderBy: { name: 'asc' },
        });
      } catch (cErr) {
        console.warn('City table query fallback:', cErr);
      }
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
      payoutProofs: payoutProofs || [],
    });
  } catch (error: any) {
    console.error('Error fetching data from Neon DB:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
