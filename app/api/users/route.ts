import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, officeId, officeName, isDemoUser } = body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'PENDING',
        ...(officeId && { officeId }),
        ...(officeName && { officeName }),
        isDemoUser: Boolean(isDemoUser),
      }
    });
    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Error creating user in POST /api/users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, role, officeId, officeName, name, email, isDemoUser } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(officeId ? { officeId } : officeId === null ? { officeId: null } : {}),
        ...(officeName ? { officeName } : officeName === null ? { officeName: null } : {}),
        ...(name && { name }),
        ...(email && { email }),
        ...(isDemoUser !== undefined && { isDemoUser: Boolean(isDemoUser) })
      }
    });
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user in PUT /api/users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
