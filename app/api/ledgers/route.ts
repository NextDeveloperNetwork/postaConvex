import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// All valid ledger types as defined in the Prisma schema enum
const VALID_LEDGER_TYPES = [
  'COD_COLLECTION',
  'SHIPPING_FEE',
  'POSTAL_TARIFF',
  'OFFICE_INTEREST_ORIGIN',
  'OFFICE_INTEREST_DESTINATION',
  'COURIER_FEE',
  'SELLER_SETTLEMENT',
  'SELLER_REVERSE_PAYOUT',
  'ADMIN_PROFIT_TRANSFER',
  'OFFICE_COMMISSION_PAYOUT',
] as const;

export async function GET() {
  try {
    const ledgers = await prisma.financeLedger.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, ledgers });
  } catch (error: any) {
    console.error('Error fetching ledgers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both single entry and batch (array)
    const entries = Array.isArray(body) ? body : [body];

    // Validate all types before creating anything
    const invalidEntries = entries.filter((e: any) => !VALID_LEDGER_TYPES.includes(e.type));
    if (invalidEntries.length > 0) {
      const types = invalidEntries.map((e: any) => e.type).join(', ');
      return NextResponse.json(
        { success: false, error: `Invalid ledger type(s): ${types}. Valid types: ${VALID_LEDGER_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(
      entries.map((entry: any) =>
        prisma.financeLedger.create({
          data: {
            shipmentId: entry.shipmentId || null,
            trackingNumber: entry.trackingNumber || null,
            officeId: entry.officeId || null,
            officeName: entry.officeName || null,
            sellerId: entry.sellerId || null,
            sellerName: entry.sellerName || null,
            type: entry.type as any,
            amount: Number(entry.amount),
            description: entry.description || '',
          }
        })
      )
    );

    return NextResponse.json({ success: true, ledgers: created });
  } catch (error: any) {
    console.error('Error creating ledger entries:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
