export type UserRole = 'ADMIN' | 'SELLER' | 'COURIER' | 'COURIER_TRANSPORT' | 'COURIER_DELIVERY' | 'OFFICE_STAFF' | 'FINANCE_ADMIN' | 'PENDING';

export type ShipmentStatus =
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_DESTINATION'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED_PENDING_SETTLEMENT'
  | 'CLOSED'
  | 'CANCELLED';

export type DeliveryMode = 'DOOR_DELIVERY' | 'OFFICE_PICKUP';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  officeId?: string;
  officeName?: string;
  isDemoUser?: boolean;
  createdAt: string;
}

export interface Office {
  id: string;
  name: string;
  city: string;
  cashBalance: number;
  earnedCommission?: number; // Accumulated office interest/commission earned
  intakePercentage?: number; // Custom Intake Office Fee percentage (%)
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface City {
  id: string;
  name: string;
  officeId?: string | null;
  office?: Office | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrackingLog {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  barcode: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destinationAddress: string;
  destinationCity: string;
  packageType?: 'COD' | 'PREPAID';
  deliveryMode?: DeliveryMode;
  shippingFeePaidBySender?: boolean;
  codAmount: number;
  shippingFee: number;
  courierFee: number;
  sellerNet: number;
  status: ShipmentStatus;
  paymentStatus: 'UNPAID' | 'COD_COLLECTED' | 'SETTLED';
  originOfficeId: string;
  originOfficeName: string;
  destinationOfficeId: string;
  destinationOfficeName: string;
  courierId?: string;
  courierName?: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
  logs: TrackingLog[];
}

export type BagStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_TRANSIT' | 'COMPLETED';
export type BagType = 'DELIVERY' | 'TRANSIT';

export interface Bag {
  id: string;
  courierId: string;
  courierName: string;
  officeId: string;
  officeName: string;
  destinationOfficeId?: string;
  destinationOfficeName?: string;
  bagType: BagType;
  /** Flat list of shipment IDs — mapped from BagShipment join table in API */
  shipmentIds: string[];
  status: BagStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  notes?: string;
}

export interface SystemSettings {
  shippingFee: number;
  deliveryOfficeFee: number;
  originOfficeFee: number;
}

export type LedgerType =
  | 'COD_COLLECTION'
  | 'SHIPPING_FEE'
  | 'POSTAL_TARIFF'
  | 'OFFICE_INTEREST_ORIGIN'
  | 'OFFICE_INTEREST_DESTINATION'
  | 'COURIER_FEE'
  | 'SELLER_SETTLEMENT'
  | 'SELLER_REVERSE_PAYOUT'
  | 'ADMIN_PROFIT_TRANSFER'
  | 'OFFICE_COMMISSION_PAYOUT';

export interface FinanceLedgerEntry {
  id: string;
  shipmentId?: string;
  trackingNumber?: string;
  officeId?: string;
  officeName?: string;
  sellerId?: string;
  sellerName?: string;
  type: LedgerType;
  amount: number;
  description: string;
  createdAt: string;
}

export type HandoverStatus = 'PENDING_COURIER_PICKUP' | 'TRANSIT_TO_FINANCE' | 'RECEIVED_BY_FINANCE' | 'DISTRIBUTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface OfficeCashHandover {
  id: string;
  transferCode?: string;
  officeId: string;
  officeName: string;
  courierId?: string;
  courierName?: string;
  amount: number;
  shipmentCount: number;
  status: HandoverStatus;
  submittedBy: string;
  submittedAt: string;
  courierAcceptedAt?: string;
  courierSignature?: string;
  receivedByFinanceAt?: string;
  financeRecipientName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface SellerPayoutItem {
  sellerId: string;
  sellerName: string;
  shipmentId: string;
  trackingNumber: string;
  amount: number;
  status: 'APPROVED' | 'PAID_TO_SELLER';
}

export type PayoutBatchStatus = 'PENDING_COURIER_PICKUP' | 'IN_TRANSIT' | 'RECEIVED_BY_OFFICE' | 'COMPLETED' | 'REJECTED';

export interface PayoutDispatchBatch {
  id: string;
  batchCode?: string;
  officeId: string;
  officeName: string;
  courierId: string;
  courierName: string;
  totalAmount: number;
  adminProfitAmount: number;
  officeCommissionAmount: number;
  sellerPayouts: SellerPayoutItem[];
  status: PayoutBatchStatus;
  dispatchedByName?: string;
  courierAcceptedAt?: string;
  courierSignature?: string;
  receivedByName?: string;
  rejectionReason?: string;
  itemsJson?: string;
  createdAt: string;
  receivedAt?: string;
}

export interface SellerPayoutProof {
  id: string;
  voucherNumber: string;
  shipmentId: string;
  trackingNumber: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  recipientName: string;
  recipientIdCard?: string;
  signatureUrl?: string;
  verificationCode?: string;
  bankReference?: string;
  officeId: string;
  officeName: string;
  processedBy: string;
  notes?: string;
  createdAt: string;
}
