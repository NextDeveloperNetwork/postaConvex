'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { isOfficeMatch, calculateOfficeCashBalance } from '@/lib/finance-utils';
import { SellerPayoutProofModal } from '@/components/seller-payout-proof-modal';
import { SellerPayoutReceiptModal } from '@/components/seller-payout-receipt-modal';
import { Shipment, SellerPayoutProof, SellerPayoutItem } from '@/lib/types';
import {
  UserCheck,
  CheckCircle2,
  DollarSign,
  Building2,
  Search,
  Send,
  Phone,
  Wallet,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  FileCheck2,
  Printer,
  History,
  FileText
} from 'lucide-react';

export default function OfficeSellerPayoutsPage() {
  const { t, formatALL } = useI18n();
  const {
    shipments,
    offices,
    payoutBatches,
    payoutProofs,
    handovers,
    currentUser,
    receivePayoutBatchAtOffice,
    rejectPayoutBatchFromOffice,
    completeSellerPayoutFromOffice,
  } = useAuthenticatedState();

  const [searchTerm, setSearchTerm] = useState('');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);
  const [payingShipment, setPayingShipment] = useState<Shipment | null>(null);
  const [viewingProof, setViewingProof] = useState<SellerPayoutProof | null>(null);
  const [payoutTab, setPayoutTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const currentOffice = offices.find(
    o => o.id === currentUser?.officeId ||
      (currentUser?.officeName && o.name.toLowerCase().includes(currentUser.officeName.toLowerCase())) ||
      (currentUser?.officeName && currentUser.officeName.toLowerCase().includes(o.city.toLowerCase()))
  ) || offices[0];

  // Payout batches dispatched to this office by central finance
  const officeBatches = payoutBatches.filter(
    b => isOfficeMatch(currentOffice, b.officeId, b.officeName)
  );

  // Total cash received in payout envelopes specifically for seller payouts
  const totalReceivedForSellers = officeBatches
    .filter(b => b.status === 'RECEIVED_BY_OFFICE' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.totalAmount - (b.officeCommissionAmount || 0)), 0);

  // Total cash paid out to sellers at counter for packages originating at this office
  const totalPaidOutToSellers = shipments
    .filter(s => isOfficeMatch(currentOffice, s.originOfficeId, s.originOfficeName) && (s.paymentStatus === 'SETTLED' || completedIds.includes(s.id)))
    .reduce((sum, s) => sum + s.sellerNet, 0);

  // Net remaining cash held in office drawer dedicated for pending seller payouts
  const cashAtHandFromBatches = Math.max(0, totalReceivedForSellers - totalPaidOutToSellers);

  // Helper to extract items from a batch (handles parsed sellerPayouts or raw itemsJson)
  const getBatchItems = (b: any): SellerPayoutItem[] => {
    if (Array.isArray(b.sellerPayouts) && b.sellerPayouts.length > 0) return b.sellerPayouts;
    if (b.itemsJson) {
      try {
        const parsed = JSON.parse(b.itemsJson);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Determine whether a specific shipment is ready for payout or still frozen/in-transit
  const getShipmentPayoutStatus = (s: Shipment) => {
    // 1. Check if there is any batch for this office that explicitly contains this shipment
    const matchingBatch = officeBatches.find(b => {
      const items = getBatchItems(b);
      return items.some((p: any) =>
        (p.shipmentId && p.shipmentId === s.id) ||
        (p.trackingNumber && p.trackingNumber.trim().toUpperCase() === s.trackingNumber.trim().toUpperCase())
      );
    });

    if (matchingBatch) {
      if (matchingBatch.status === 'RECEIVED_BY_OFFICE' || matchingBatch.status === 'COMPLETED') {
        return {
          isReady: true,
          statusLabel: '✓ GATI PËR LIKUIDIM',
          statusClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          badgeIcon: 'CHECK',
          reasonText: 'Zarfi me paratë u pranua në zyrë (Paratë në kasafortë)',
        };
      }
      if (matchingBatch.status === 'IN_TRANSIT') {
        return {
          isReady: false,
          statusLabel: '🚚 ZARF NË TRANZIT',
          statusClass: 'bg-blue-100 text-blue-900 border-blue-300',
          badgeIcon: 'TRUCK',
          reasonText: 'Zarf në tranzit me kurier — prano zarfin fillimisht',
        };
      }
      if (matchingBatch.status === 'PENDING_COURIER_PICKUP') {
        return {
          isReady: false,
          statusLabel: '⏳ PRITJE KURIERI',
          statusClass: 'bg-amber-100 text-amber-900 border-amber-300',
          badgeIcon: 'CLOCK',
          reasonText: 'Zarf në pritje të marrjes nga kurieri',
        };
      }
      return {
        isReady: false,
        statusLabel: '✗ ZARF I REFUZUAR',
        statusClass: 'bg-red-100 text-red-900 border-red-300',
        badgeIcon: 'ALERT',
        reasonText: 'Zarfi i financës u refuzua nga zyra',
      };
    }

    // 2. If no batch explicitly lists this shipment, check if office has sufficient unallocated cash received
    if (cashAtHandFromBatches >= s.sellerNet) {
      return {
        isReady: true,
        statusLabel: '✓ CASH NË DISPOZICION',
        statusClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        badgeIcon: 'CHECK',
        reasonText: 'Paratë janë të pranuara në kasafortën e zyrës',
      };
    }

    return {
      isReady: false,
      statusLabel: 'PA ZARF TË PRANUAR',
      statusClass: 'bg-slate-100 text-slate-700 border-slate-300',
      badgeIcon: 'ALERT',
      reasonText: 'Mungon zarfi i parave nga Financa — e ngrirë',
    };
  };

  // Shipments originated at this office that are eligible for seller payout
  const approvedPayoutShipments = shipments.filter(s => {
    const isOriginOfficeMatch = isOfficeMatch(currentOffice, s.originOfficeId, s.originOfficeName);
    const isDeliveredOrCollected = s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED' || s.status === 'DELIVERED_PENDING_SETTLEMENT';
    return isOriginOfficeMatch && isDeliveredOrCollected && s.sellerNet > 0;
  });

  const filtered = approvedPayoutShipments.filter(s => {
    return (
      !searchTerm ||
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const pendingPayoutShipments = filtered.filter(s => s.paymentStatus !== 'SETTLED' && !completedIds.includes(s.id));
  const completedPayoutShipments = filtered.filter(s => s.paymentStatus === 'SETTLED' || completedIds.includes(s.id));
  const totalApprovedAmount = pendingPayoutShipments.reduce((sum, s) => sum + s.sellerNet, 0);
  const totalCompletedAmount = completedPayoutShipments.reduce((sum, s) => sum + s.sellerNet, 0);

  const handleReceiveBatch = async (batchId: string) => {
    await receivePayoutBatchAtOffice(batchId);
    setBatchSuccessMsg('Zarfi i parave u konfirmua me sukses! Paratë cash u futën në kasafortë për likuidimin e shitësve.');
    setTimeout(() => setBatchSuccessMsg(null), 4000);
  };

  const handleCompletePayout = async (id: string) => {
    await completeSellerPayoutFromOffice(id);
    setCompletedIds(prev => [...prev, id]);
  };

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner - FULL WIDTH */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.office} &bull; Financa Zyra
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">
            Pagesat e Aprovuara për Shitësit ({currentOffice?.name})
          </h1>
          <p className="text-xs font-bold text-slate-800">
            Likuidimi i shitësve bëhet te Zyra e Origjinës ku pakoja është pranuar pasi Financa ka dorëzuar zarfin me kurier.
          </p>
        </div>
        
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Success Banner */}
      {batchSuccessMsg && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 text-emerald-950 text-xs font-black flex items-center gap-2 animate-bounce shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>{batchSuccessMsg}</span>
        </div>
      )}

      {/* KPI Cards: Cash at Hand & Pending Seller Liabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        
        {/* Cash at Hand in Office */}
        <div className="bg-white border border-emerald-300 rounded-3xl p-6 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-bold">Gjendja Cash në Zyrë për Likuidim</span>
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase">Paratë e Pranuara me Zarfe nga Financa</p>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-700">
              {formatALL(cashAtHandFromBatches)}
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold">Gati fizikisht në kasafortën e zyrës për kalim te Shitësit</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-sm flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Payout Liabilities */}
        <div className="bg-white border border-purple-200 rounded-3xl p-6 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700 font-bold">Likuidime në Pritje për Shitësit</span>
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase">Totali Netto për Kalim te Shitësit</p>
            <h2 className="text-2xl sm:text-3xl font-black text-purple-950">
              {formatALL(totalApprovedAmount)}
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold">Balanca e aprovuar që pret kalim me IBAN / Cash te Shitësi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-800 shadow-sm flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* INCOMING PAYOUT BATCHES FROM COURIER SECTION */}
      <div className="bg-white border border-indigo-200 rounded-3xl p-5 shadow-md space-y-4">
        <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-600" />
          <span>Dërgesat e Pagesave të Ardhura me Kurier nga Financa ({officeBatches.length})</span>
        </h2>

        {officeBatches.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs font-semibold">
            Nuk ka ende ndonjë zarf pagesash në udhëtim nga financa qendrore.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Kurieri i Transportit</th>
                  <th className="py-3.5 px-4">Data e Nisjes</th>
                  <th className="py-3.5 px-4 text-right">Netto Për Shitësit</th>
                  <th className="py-3.5 px-4 text-center">Statusi i Zarf-it</th>
                  <th className="py-3.5 px-4 text-center">Veprim Zyre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officeBatches.map(b => (
                  <tr key={b.id} className="hover:bg-indigo-50/40 transition">
                    <td className="py-3.5 px-4 font-black text-slate-950 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span>{b.courierName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{b.createdAt.split('T')[0]}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                      {formatALL(b.totalAmount - b.officeCommissionAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.status === 'RECEIVED_BY_OFFICE' || b.status === 'COMPLETED' ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                          ✓ PRANUAR NGA ZYRA (CASH NË KASAFORTË)
                        </span>
                      ) : b.status === 'REJECTED' ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-950 border border-red-300 inline-block">
                          ❌ REFUZUAR & KTHYER MBRAMPSHT
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleReceiveBatch(b.id)}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-sm transition active:scale-95 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Prano Zarfin</span>
                          </button>

                          <button
                            onClick={async () => {
                              const reason = prompt('Arsyeja e refuzimit te zarfit nga financa:');
                              if (reason !== null) {
                                await rejectPayoutBatchFromOffice(b.id, reason);
                                setBatchSuccessMsg('Zarfi u refuzua me sukses dhe u kthye mbrapsht te Financa Qendrore.');
                                setTimeout(() => setBatchSuccessMsg(null), 5000);
                              }
                            }}
                            className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-sm transition active:scale-95 flex items-center gap-1"
                          >
                            <span>Refuzo (Kthe Mbrapsht)</span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-semibold text-[11px]">
                      {b.status === 'RECEIVED_BY_OFFICE' ? 'Gati për Likuidim' : 'Tranzit'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVED SELLER PAYOUTS LIST & HISTORY */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Likuidimet e Shitësve ({currentOffice?.name})</span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Kryeni dorëzimin e parave me dëshmi zyrtare ose konsultoni historikun e faturave të printuara</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kërko me shitës, kod tracking ose marrës..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 font-bold focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setPayoutTab('PENDING')}
            className={`pb-2.5 px-4 font-black text-xs transition border-b-2 flex items-center gap-2 ${
              payoutTab === 'PENDING'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Në Pritje të Likuidimit</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              payoutTab === 'PENDING' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {pendingPayoutShipments.length}
            </span>
          </button>

          <button
            onClick={() => setPayoutTab('COMPLETED')}
            className={`pb-2.5 px-4 font-black text-xs transition border-b-2 flex items-center gap-2 ${
              payoutTab === 'COMPLETED'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historiku i Pagesave të Kryera</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              payoutTab === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {completedPayoutShipments.length}
            </span>
          </button>
        </div>

        {/* TAB 1: PENDING PAYOUTS */}
        {payoutTab === 'PENDING' && (
          pendingPayoutShipments.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-600 text-xs font-bold space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 border border-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-black text-slate-950 text-sm">Nuk ka pagesa në pritje — të gjitha pakot janë likuiduar!</p>
              <p className="text-[11px] text-slate-500 font-semibold">Mund të klikoni te skeda &quot;Historiku i Pagesave të Kryera&quot; për të parë faturat e lëshuara.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Tracking</th>
                    <th className="py-3.5 px-4">Emri i Shitësit</th>
                    <th className="py-3.5 px-4">Marrësi</th>
                    <th className="py-3.5 px-4 text-right">COD Mbledhur</th>
                    <th className="py-3.5 px-4 text-right">Tarifa Postare</th>
                    <th className="py-3.5 px-4 text-right">Netto Aprovuar për Shitësin</th>
                    <th className="py-3.5 px-4 text-center">Statusi i Aprovimit</th>
                    <th className="py-3.5 px-4 text-center">Veprim Zyre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingPayoutShipments.map(s => {
                    const isDone = completedIds.includes(s.id) || s.paymentStatus === 'SETTLED';
                    const matchedProof = payoutProofs.find(p => p.shipmentId === s.id);
                    const payoutStatus = getShipmentPayoutStatus(s);

                    return (
                      <tr key={s.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3.5 px-4 font-mono font-black text-slate-950">{s.trackingNumber}</td>
                        <td className="py-3.5 px-4 font-black text-slate-950">{s.sellerName}</td>
                        <td className="py-3.5 px-4 text-slate-700">{s.recipientName} ({s.destinationCity})</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-950">{formatALL(s.codAmount)}</td>
                        <td className="py-3.5 px-4 text-right text-red-600">-{formatALL(s.shippingFee)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">{formatALL(s.sellerNet)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${payoutStatus.statusClass}`}>
                            {payoutStatus.badgeIcon === 'CHECK' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {payoutStatus.badgeIcon === 'TRUCK' && <Truck className="w-3 h-3 text-blue-600" />}
                            {payoutStatus.badgeIcon === 'CLOCK' && <Clock className="w-3 h-3 text-amber-600" />}
                            {payoutStatus.badgeIcon === 'ALERT' && <AlertCircle className="w-3 h-3 text-slate-500" />}
                            {payoutStatus.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isDone ? (
                            matchedProof ? (
                              <button
                                onClick={() => setViewingProof(matchedProof)}
                                className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black rounded-xl text-xs border border-emerald-300 transition active:scale-95 flex items-center gap-1.5 mx-auto"
                              >
                                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Faturë / Dëshmi</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 inline-block">
                                ✓ LIKUIDUAR
                              </span>
                            )
                          ) : payoutStatus.isReady ? (
                            <button
                              onClick={() => setPayingShipment(s)}
                              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 mx-auto"
                            >
                              <FileCheck2 className="w-4 h-4" />
                              <span>Kryej Likuidimin me Dëshmi</span>
                            </button>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 mx-auto">
                              {/* Visible but frozen/disabled button */}
                              <button
                                disabled
                                aria-disabled="true"
                                title={payoutStatus.reasonText}
                                className="py-1.5 px-3.5 bg-slate-200 text-slate-400 font-black rounded-xl text-xs cursor-not-allowed pointer-events-none flex items-center gap-1.5 mx-auto select-none border border-slate-300 shadow-none opacity-80"
                              >
                                <FileCheck2 className="w-4 h-4 text-slate-400" />
                                <span>Kryej Likuidimin me Dëshmi</span>
                              </button>
                              {/* Lock reason label */}
                              <span className="text-[9px] font-black text-amber-800 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 whitespace-nowrap">
                                {payoutStatus.badgeIcon === 'TRUCK' ? (
                                  <Truck className="w-2.5 h-2.5 flex-shrink-0 text-blue-600" />
                                ) : payoutStatus.badgeIcon === 'CLOCK' ? (
                                  <Clock className="w-2.5 h-2.5 flex-shrink-0 text-amber-600" />
                                ) : (
                                  <AlertCircle className="w-2.5 h-2.5 flex-shrink-0 text-slate-500" />
                                )}
                                {payoutStatus.reasonText}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* TAB 2: COMPLETED PAYOUTS HISTORY */}
        {payoutTab === 'COMPLETED' && (
          completedPayoutShipments.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-black text-slate-700">Nuk ka ende pagesa të kryera nga kjo zyrë.</p>
              <p className="text-[11px] text-slate-400">Pasi të kryeni likuidimin e një shitësi dhe të plotësohet dëshmia, ajo do të shfaqet këtu me faturën e printueshme.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Tracking</th>
                    <th className="py-3.5 px-4">Emri i Shitësit</th>
                    <th className="py-3.5 px-4 text-right">Netto e Likuiduar</th>
                    <th className="py-3.5 px-4">Marrësi / Personi i Autorizuar</th>
                    <th className="py-3.5 px-4">Kodi i Dëshmisë</th>
                    <th className="py-3.5 px-4 text-center">Statusi</th>
                    <th className="py-3.5 px-4 text-center">Faturë / Dëshmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedPayoutShipments.map(s => {
                    const matchedProof = payoutProofs.find(p => p.shipmentId === s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-black text-slate-950">{s.trackingNumber}</td>
                        <td className="py-3.5 px-4 font-black text-slate-950">{s.sellerName}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                          {formatALL(s.sellerNet)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {matchedProof ? (
                            <div>
                              <p className="font-bold text-slate-950">{matchedProof.recipientName}</p>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                {matchedProof.paymentMethod === 'BANK_TRANSFER' ? '🏦 Transfertë Bankare' : '💵 Cash me Nënshkrim'}
                                {matchedProof.recipientIdCard && ` · ID: ${matchedProof.recipientIdCard}`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">Shlyer në sportel</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {matchedProof?.voucherNumber || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            LIKUIDUAR ME DËSHMI
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {matchedProof ? (
                            <button
                              onClick={() => setViewingProof(matchedProof)}
                              className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black rounded-xl text-xs border border-emerald-300 transition active:scale-95 flex items-center gap-1.5 mx-auto"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Printo Faturën</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Seller Payout Modal with Signature / PIN */}
      {payingShipment && (
        <SellerPayoutProofModal
          shipment={payingShipment}
          onClose={() => setPayingShipment(null)}
          onSuccess={(proof) => {
            setCompletedIds(prev => [...prev, payingShipment.id]);
            setPayingShipment(null);
            setViewingProof(proof);
          }}
        />
      )}

      {/* Seller Payout Receipt / Voucher Viewer */}
      {viewingProof && (
        <SellerPayoutReceiptModal
          proof={viewingProof}
          onClose={() => setViewingProof(null)}
        />
      )}

    </main>
  );
}
