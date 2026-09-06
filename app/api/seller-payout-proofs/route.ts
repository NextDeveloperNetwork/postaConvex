import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const proofs = await (prisma as any).sellerPayoutProof.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, proofs });
  } catch (error: any) {
    console.error('Error fetching seller payout proofs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const voucherNumber = body.voucherNumber || `SLP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const proof = await (prisma as any).sellerPayoutProof.create({
      data: {
        voucherNumber,
        shipmentId: body.shipmentId,
        trackingNumber: body.trackingNumber,
        sellerId: body.sellerId,
        sellerName: body.sellerName,
        amount: Number(body.amount),
        paymentMethod: body.paymentMethod || 'CASH',
        recipientName: body.recipientName,
        recipientIdCard: body.recipientIdCard || null,
        signatureUrl: body.signatureUrl || null,
        verificationCode: body.verificationCode || null,
        bankReference: body.bankReference || null,
        officeId: body.officeId,
        officeName: body.officeName,
        processedBy: body.processedBy,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, proof });
  } catch (error: any) {
    console.error('Error creating seller payout proof:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
