import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const dbPrisma = prisma as any;

export async function GET() {
  try {
    const cities = await dbPrisma.city.findMany({
      include: {
        office: {
          select: { id: true, name: true, city: true, status: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, cities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, officeId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Emri i qytetit është i detyrueshëm.' }, { status: 400 });
    }

    const formattedName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);

    const newCity = await dbPrisma.city.create({
      data: {
        name: formattedName,
        officeId: officeId || null
      },
      include: {
        office: {
          select: { id: true, name: true, city: true, status: true }
        }
      }
    });

    return NextResponse.json({ success: true, city: newCity });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, officeId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID-ja e qytetit mungon.' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (name && name.trim()) {
      dataToUpdate.name = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
    }
    if (officeId !== undefined) {
      dataToUpdate.officeId = officeId || null;
    }

    const updatedCity = await dbPrisma.city.update({
      where: { id },
      data: dataToUpdate,
      include: {
        office: {
          select: { id: true, name: true, city: true, status: true }
        }
      }
    });

    return NextResponse.json({ success: true, city: updatedCity });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID-ja e qytetit mungon.' }, { status: 400 });
    }

    await dbPrisma.city.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Qyteti u fshi me sukses.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
