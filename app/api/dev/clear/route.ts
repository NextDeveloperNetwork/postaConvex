import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Delete all operational transaction records from PostgreSQL DB
    await prisma.bagShipment.deleteMany({});
    await prisma.bag.deleteMany({});
    await prisma.trackingLog.deleteMany({});
    await prisma.financeLedger.deleteMany({});
    await prisma.officeCashHandover.deleteMany({});
    await prisma.payoutDispatchBatch.deleteMany({});
    await prisma.shipment.deleteMany({});

    // Reset office cash balances and earned commissions
    await prisma.office.updateMany({
      data: {
        cashBalance: 0,
        earnedCommission: 0,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Të gjitha të dhënat operacionale u fshinë me sukses nga baza e të dhënave PostgreSQL.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
