import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const offices = await prisma.office.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json({ success: true, offices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, city, intakePercentage = 20, cashBalance = 0 } = body;

    const newOffice = await prisma.office.create({
      data: {
        name,
        city,
        intakePercentage: Number(intakePercentage),
        cashBalance: Number(cashBalance)
      }
    });
    return NextResponse.json({ success: true, office: newOffice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, city, intakePercentage, cashBalance, earnedCommission } = body;

    const updatedOffice = await prisma.office.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(city && { city }),
        ...(intakePercentage !== undefined && { intakePercentage: Number(intakePercentage) }),
        ...(cashBalance !== undefined && { cashBalance: Number(cashBalance) }),
        ...(earnedCommission !== undefined && { earnedCommission: Number(earnedCommission) })
      }
    });
    return NextResponse.json({ success: true, office: updatedOffice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
