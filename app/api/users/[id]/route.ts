import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, email, role, officeId, officeName, isDemoUser } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(officeId ? { officeId } : officeId === null ? { officeId: null } : {}),
        ...(officeName ? { officeName } : officeName === null ? { officeName: null } : {}),
        ...(isDemoUser !== undefined && { isDemoUser: Boolean(isDemoUser) })
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user in PUT /api/users/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    console.error('Error deleting user in DELETE /api/users/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
