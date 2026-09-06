import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, city, intakePercentage, cashBalance, earnedCommission, status } = body;

    const updatedOffice = await prisma.office.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(city && { city }),
        ...(intakePercentage !== undefined && { intakePercentage: Number(intakePercentage) }),
        ...(cashBalance !== undefined && { cashBalance: Number(cashBalance) }),
        ...(earnedCommission !== undefined && { earnedCommission: Number(earnedCommission) }),
        ...(status !== undefined && { status }),
      }
    });

    return NextResponse.json({ success: true, office: updatedOffice });
  } catch (error: any) {
    console.error('Error updating office:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.office.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
