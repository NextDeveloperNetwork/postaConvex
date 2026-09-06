/**
 * Centralized Financial Utilities & Accounting Formulas for POSTA
 */

import { Office, Shipment, OfficeCashHandover, PayoutDispatchBatch, FinanceLedgerEntry } from './types';

/**
 * Robust, case-insensitive office matching helper
 */
export function isOfficeMatch(
  office?: Office | { id: string; name: string; city?: string } | null,
  targetId?: string | null,
  targetName?: string | null
): boolean {
  if (!office) return true; // If no office context, match all (e.g. for admin/finance broad views)
  if (!targetId && !targetName) return false;
  if (targetId && targetId === office.id) return true;

  const currentNameClean = (office.name || '').toLowerCase().trim();
  const currentCityClean = (office.city || '').toLowerCase().trim();
  const targetNameClean = (targetName || '').toLowerCase().trim();

  if (targetNameClean && currentNameClean && targetNameClean === currentNameClean) return true;
  if (targetNameClean && currentNameClean && currentNameClean.includes(targetNameClean)) return true;
  if (targetNameClean && currentNameClean && targetNameClean.includes(currentNameClean)) return true;
  if (targetNameClean && currentCityClean && targetNameClean.includes(currentCityClean)) return true;
  if (currentCityClean && targetNameClean && currentCityClean.includes(targetNameClean)) return true;

  return false;
}

/**
 * Calculates the revenue breakdown for a standard postal tariff (300 ALL default)
 */
export function calculatePackageFinancials(shippingFee = 300, intakePercentage = 20) {
  const intakeRate = intakePercentage ? intakePercentage / 100 : 0.20;
  const originCommission = Math.round(shippingFee * intakeRate);
  const destinationCommission = 100; // Fixed destination office fee
  const adminNetProfit = Math.max(0, shippingFee - originCommission - destinationCommission);

  return {
    shippingFee,
    originCommission,
    destinationCommission,
    adminNetProfit,
  };
}

/**
 * Calculates exact Central Vault Cash & Financial Metrics
 */
export function calculateCentralVaultState(
  handovers: OfficeCashHandover[],
  payoutBatches: PayoutDispatchBatch[],
  ledgers: FinanceLedgerEntry[]
) {
  // 1. Confirmed Handovers received into vault from Regional Offices
  const confirmedHandovers = handovers.filter(
    h => h.status === 'RECEIVED_BY_FINANCE' || h.status === 'APPROVED'
  );
  const totalHandoversReceived = confirmedHandovers.reduce((sum, h) => sum + h.amount, 0);

  // 2. Physical Cash Dispatched out of Central Vault via Payout Envelopes
  const activePayoutBatches = payoutBatches.filter(b => b.status !== 'REJECTED');
  const totalBatchesDispatched = activePayoutBatches.reduce((sum, b) => sum + b.totalAmount, 0);

  // 3. Direct Outflows recorded in Ledgers
  const totalAdminTransferred = ledgers
    .filter(l => l.type === 'ADMIN_PROFIT_TRANSFER' || (l.description && l.description.includes('Transferimi i fitimit')))
    .reduce((sum, l) => sum + l.amount, 0);

  const totalOfficeCommissionsPaid = ledgers
    .filter(l => l.type === 'OFFICE_COMMISSION_PAYOUT')
    .reduce((sum, l) => sum + l.amount, 0);

  const totalSellerSettlementsDirect = ledgers
    .filter(l => l.type === 'SELLER_SETTLEMENT' || l.type === 'SELLER_REVERSE_PAYOUT')
    .reduce((sum, l) => sum + l.amount, 0);

  // Vault Cash calculation: Received Handovers - Dispatched Batches - Direct Admin Transfers
  const centralVaultCash = Math.max(0, totalHandoversReceived - totalBatchesDispatched - totalAdminTransferred);

  return {
    totalHandoversReceived,
    totalBatchesDispatched,
    totalAdminTransferred,
    totalOfficeCommissionsPaid,
    totalSellerSettlementsDirect,
    centralVaultCash,
  };
}

/**
 * Calculates Regional Office Drawer Balance
 */
export function calculateOfficeCashBalance(
  office: Office,
  shipments: Shipment[],
  handovers: OfficeCashHandover[],
  payoutBatches: PayoutDispatchBatch[]
) {
  const isDest = (s: Shipment) => isOfficeMatch(office, s.destinationOfficeId, s.destinationOfficeName);
  const isOrig = (s: Shipment) => isOfficeMatch(office, s.originOfficeId, s.originOfficeName);

  // 1. COD cash collected at this office
  const codCollected = shipments
    .filter(s => isDest(s) && (s.paymentStatus === 'COD_COLLECTED' || s.status === 'CLOSED' || s.status === 'DELIVERED_PENDING_SETTLEMENT'))
    .reduce((sum, s) => sum + (s.packageType === 'PREPAID' ? 0 : s.codAmount), 0);

  // 2. Prepaid tariff cash (300 ALL) collected upfront at drop-off
  const prepaidTariff = shipments
    .filter(s => isOrig(s) && (s.packageType === 'PREPAID' || s.shippingFeePaidBySender || s.codAmount === 0))
    .reduce((sum, s) => sum + (s.shippingFee || 300), 0);

  // 3. Cash received in payout envelopes from Central Finance
  const receivedBatchesCash = payoutBatches
    .filter(b => isOfficeMatch(office, b.officeId, b.officeName) && (b.status === 'RECEIVED_BY_OFFICE' || b.status === 'COMPLETED'))
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // 4. Cash handovers submitted to Central Finance
  const officeHandoversAmount = handovers
    .filter(h => isOfficeMatch(office, h.officeId, h.officeName))
    .reduce((sum, h) => sum + h.amount, 0);

  // 5. Cash paid out to sellers at counter
  const settledSellersCash = shipments
    .filter(s => isOrig(s) && s.paymentStatus === 'SETTLED')
    .reduce((sum, s) => sum + s.sellerNet, 0);

  const totalInflows = codCollected + prepaidTariff + receivedBatchesCash;
  const totalOutflows = officeHandoversAmount + settledSellersCash;
  const calculatedDrawerBalance = Math.max(0, totalInflows - totalOutflows);

  // Use stored office.cashBalance if positive, otherwise calculated
  const finalBalance = office?.cashBalance && office.cashBalance > 0 ? office.cashBalance : calculatedDrawerBalance;

  return {
    codCollected,
    prepaidTariff,
    receivedBatchesCash,
    officeHandoversAmount,
    settledSellersCash,
    drawerBalance: finalBalance,
  };
}

/**
 * Returns only the shipments whose collected cash has actually been confirmed and accepted into Central Finance
 * (either prepaid at origin intake or COD cash confirmed via accepted OfficeCashHandover from destination office).
 */
export function getFinanceRecognizedShipments(
  shipments: Shipment[],
  handovers: OfficeCashHandover[],
  offices: Office[]
): Shipment[] {
  const delivered = shipments.filter(s =>
    s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' ||
    s.status === 'CLOSED' || s.status === 'DELIVERED_PENDING_SETTLEMENT'
  );

  // Confirmed cash received into Finance vault from each office
  const confirmedHandovers = handovers.filter(
    h => h.status === 'RECEIVED_BY_FINANCE' || h.status === 'APPROVED'
  );

  // Group confirmed cash by destination office
  const officeConfirmedCash: Record<string, number> = {};
  confirmedHandovers.forEach(h => {
    const key = (h.officeName || h.officeId || '').toLowerCase().trim();
    officeConfirmedCash[key] = (officeConfirmedCash[key] || 0) + h.amount;
  });

  // Track running consumed cash per office chronologically
  const officeConsumedCash: Record<string, number> = {};

  const sorted = [...delivered].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return sorted.filter(s => {
    // Prepaid shipments had their fee collected at origin intake
    if (s.packageType === 'PREPAID' || s.shippingFeePaidBySender || s.codAmount === 0) {
      return true;
    }

    // Settled shipments were already finalized in earlier cycles
    if (s.paymentStatus === 'SETTLED') {
      return true;
    }

    // For COD packages, check if destination office's confirmed cash in Finance covers this package
    const destOffice = offices.find(o => isOfficeMatch(o, s.destinationOfficeId, s.destinationOfficeName));
    const destKey = (destOffice?.name || s.destinationOfficeName || s.destinationOfficeId || '').toLowerCase().trim();

    let confirmed = officeConfirmedCash[destKey] || 0;
    if (!confirmed) {
      const match = Object.entries(officeConfirmedCash).find(([k]) =>
        destKey.includes(k) || k.includes(destKey)
      );
      if (match) confirmed = match[1];
    }

    const currentUsed = officeConsumedCash[destKey] || 0;
    const nextTotal = currentUsed + (s.codAmount || 0);

    if (nextTotal <= confirmed) {
      officeConsumedCash[destKey] = nextTotal;
      return true;
    }

    return false;
  });
}

