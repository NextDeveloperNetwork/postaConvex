import { z } from 'zod';

export const createShipmentSchema = z.object({
  senderName: z.string().min(2, 'Emri i dërguesit duhet të ketë të paktën 2 karaktere'),
  senderPhone: z.string().min(6, 'Numri i telefonit duhet të jetë i vlefshëm'),
  recipientName: z.string().min(2, 'Emri i marrësit duhet të ketë të paktën 2 karaktere'),
  recipientPhone: z.string().min(6, 'Numri i telefonit duhet të jetë i vlefshëm'),
  destinationAddress: z.string().min(3, 'Adresa e destinacionit është e domosdoshme'),
  destinationCity: z.string().min(2, 'Qyteti i destinacionit është i domosdoshëm'),
  codAmount: z.number().min(0, 'Sasia COD nuk mund të jetë negative'),
  packageType: z.enum(['COD', 'PREPAID']).optional().default('COD'),
  deliveryMode: z.enum(['DOOR_DELIVERY', 'OFFICE_PICKUP']).optional().default('DOOR_DELIVERY'),
  shippingFee: z.number().optional().default(300),
  courierFee: z.number().optional().default(150),
  originOfficeId: z.string().optional(),
  destinationOfficeId: z.string().optional(),
});

export const updateShipmentStatusSchema = z.object({
  shipmentId: z.string().min(1),
  status: z.enum([
    'CREATED',
    'PICKED_UP',
    'IN_TRANSIT',
    'AT_DESTINATION',
    'OUT_FOR_DELIVERY',
    'DELIVERED_PENDING_SETTLEMENT',
    'CLOSED',
    'CANCELLED'
  ]),
  notes: z.string().optional(),
  location: z.string().optional(),
  signatureUrl: z.string().optional(),
});
