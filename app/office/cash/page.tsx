'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import {
  DollarSign,
  CheckCircle2,
  Wallet,
  Building2,
  ShieldCheck,
  Clock,
  TrendingUp,
  Receipt,
  Send,
  Lock,
  Truck,
  User,
  AlertCircle,
  Package,
  History,
  FileText,
  CreditCard,
  Check
} from 'lucide-react';

function formatDate(iso: string) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('sq-AL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function OfficeCashAuditPage() {
  const { t, formatALL } = useI18n();
  const {
    shipments,
    offices,
    ledgers,
    handovers,
    users,
    currentUser,
    closeAndAuditShipment,
    submitOfficeDailyHandoverWithCourier
  } = useAuthenticatedState();

  const [handoverSuccess, setHandoverSuccess] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [auditViewMode, setAuditViewMode] = useState<'PENDING' | 'AUDITED'>('PENDING');
  const [activeTab, setActiveTab] = useState<'SHIPMENTS' | 'AUDITED_PAYMENTS' | 'HANDOVERS' | 'LEDGERS'>('SHIPMENTS');

  // Match office flexibly by id, name, or city
  const currentOffice = offices.find(
    o => o.id === currentUser?.officeId ||
      (currentUser?.officeName && o.name.toLowerCase().includes(currentUser.officeName.toLowerCase())) ||
      (currentUser?.officeName && currentUser.officeName.toLowerCase().includes(o.city.toLowerCase()))
  ) || offices[0];

  const isOfficeMatch = (officeId?: string, officeName?: string) => {
    if (!currentOffice) return true;
    if (!officeId && !officeName) return true;
    if (officeId && officeId === currentOffice.id) return true;
    if (officeName && currentOffice.name && officeName.toLowerCase().trim() === currentOffice.name.toLowerCase().trim()) return true;
    if (officeName && currentOffice.name && currentOffice.name.toLowerCase().includes(officeName.toLowerCase().trim())) return true;
    if (officeName && currentOffice.city && officeName.toLowerCase().includes(currentOffice.city.toLowerCase())) return true;
    if (currentOffice.city && officeName && currentOffice.city.toLowerCase().includes(officeName.toLowerCase())) return true;
    return false;
  };

  // Couriers available for cash transport
  const availableCouriers = users.filter(
    u => u.role === 'COURIER_TRANSPORT' || u.role === 'COURIER' || u.role === 'COURIER_DELIVERY'
  );

  // 1. All shipments that brought cash into this office register
  const allCashShipments = shipments.filter(s => {
    const isDestOffice = isOfficeMatch(s.destinationOfficeId, s.destinationOfficeName);
    const isOrigOffice = isOfficeMatch(s.originOfficeId, s.originOfficeName);

    const isCodCollected = isDestOffice && (s.paymentStatus === 'COD_COLLECTED' || s.status === 'CLOSED' || s.status === 'DELIVERED_PENDING_SETTLEMENT');
    const isPrepaidCollected = isOrigOffice && (s.packageType === 'PREPAID' || s.shippingFeePaidBySender || s.codAmount === 0);

    return isCodCollected || isPrepaidCollected;
  });

  // 2. Packages delivered waiting for cashier audit & closure at this office
  const pendingAuditShipments = shipments.filter(
    s => s.status === 'DELIVERED_PENDING_SETTLEMENT' &&
      (!currentUser?.officeId || isOfficeMatch(s.destinationOfficeId, s.destinationOfficeName))
  );

  // 3. Audited & Closed Shipments (Audited Payments)
  const auditedShipments = shipments.filter(
    s => (s.status === 'CLOSED' || s.paymentStatus === 'SETTLED') &&
      (!currentUser?.officeId || isOfficeMatch(s.destinationOfficeId, s.destinationOfficeName) || isOfficeMatch(s.originOfficeId, s.originOfficeName))
  );

  // 4. Sent Payments / Daily Handovers submitted by this office
  const officeHandovers = handovers.filter(h => isOfficeMatch(h.officeId, h.officeName));

  // 5. Office specific ledgers (interests, COD collections, shipping fees)
  const officeLedgers = ledgers.filter(
    l => !currentUser?.officeId ||
      isOfficeMatch(l.officeId, l.officeName) ||
      (l.description && currentOffice && l.description.toLowerCase().includes(currentOffice.name.toLowerCase()))
  );

  const totalEarnedCommission = officeLedgers
    .filter(l => l.type === 'OFFICE_INTEREST_ORIGIN' || l.type === 'OFFICE_INTEREST_DESTINATION')
    .reduce((sum, l) => sum + l.amount, 0);

  const paidOfficeCommissions = officeLedgers
    .filter(l => l.type === 'OFFICE_COMMISSION_PAYOUT')
    .reduce((sum, l) => sum + l.amount, 0);

  const pendingOfficeCommissions = Math.max(0, totalEarnedCommission - paidOfficeCommissions);

  // Cash calculations
  const codCashCollected = allCashShipments
    .filter(s => isOfficeMatch(s.destinationOfficeId, s.destinationOfficeName) && (s.paymentStatus === 'COD_COLLECTED' || s.status === 'CLOSED' || s.status === 'DELIVERED_PENDING_SETTLEMENT'))
    .reduce((sum, s) => sum + (s.packageType === 'PREPAID' ? 0 : s.codAmount), 0);

  const prepaidTariffCollected = allCashShipments
    .filter(s => isOfficeMatch(s.originOfficeId, s.originOfficeName) && (s.packageType === 'PREPAID' || s.shippingFeePaidBySender || s.codAmount === 0))
    .reduce((sum, s) => sum + (s.shippingFee || 300), 0);

  const totalCashCollected = codCashCollected + prepaidTariffCollected;
  const totalHandoversAmount = officeHandovers.reduce((sum, h) => sum + h.amount, 0);
  
  // Calculate remaining cash in drawer
  const derivedCashBalance = Math.max(0, totalCashCollected - totalHandoversAmount);

  const handleCloseDailyRegister = async () => {
    if (derivedCashBalance <= 0) {
      alert('Arka cash nuk ka balancë pozitive për t\'u dorëzuar.');
      return;
    }
    if (!selectedCourierId) {
      alert('Ju lutem zgjidhni Kurierin që do të transportojë xhiron cash te Financa Qendrore.');
      return;
    }

    const courier = users.find(u => u.id === selectedCourierId);

    await submitOfficeDailyHandoverWithCourier(
      currentOffice.id,
      derivedCashBalance,
      courier?.id || selectedCourierId,
      courier?.name || 'Kurier Transporti',
      pendingAuditShipments.length,
      handoverNotes || `Mbyllja e arkës ditore me kurierin ${courier?.name}`
    );

    setShowHandoverModal(false);
    setHandoverSuccess(true);
    setTimeout(() => setHandoverSuccess(false), 5000);
  };

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.office} &bull; Arka Ditore
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">
            Arka Cash & Mbyllja Ditore ({currentOffice?.name || 'Zyra'})
          </h1>
          <p className="text-xs font-bold text-slate-800">
            Mbyllni arkën në fund të ditës, caktoni kurierin dhe dërgoni paratë cash te Financa Qendrore
          </p>
        </div>

        <button
          onClick={() => setShowHandoverModal(true)}
          disabled={derivedCashBalance <= 0}
          className="py-3 px-5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-[#f6d55c] font-black text-xs flex items-center gap-2 shadow-lg border border-slate-800 transition active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          <Lock className="w-4 h-4 text-[#f6d55c]" />
          <span>Mbyll Arkën & Cakto Kurierin</span>
        </button>
      </div>

      {/* Success Banner */}
      {handoverSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 text-emerald-950 text-xs font-black flex items-center gap-2 animate-bounce shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>Arka ditore u mbyll me sukses! Paratë cash i u dhanë kurierit të caktuar për dërgim te Financa Qendrore.</span>
        </div>
      )}

      {/* KPI Cards: Cash Balance, Earned Commission & Sent Payments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cash Balance in Drawer */}
        <div className="bg-white border border-amber-300 rounded-3xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-600 font-bold">{currentOffice?.name}</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Gjendja Cash në Zyrë</p>
            <h2 className="text-2xl font-black text-slate-950">
              <span className="text-emerald-700">{formatALL(derivedCashBalance)}</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold">Paratë fizike gjendje në arkë.</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-slate-950 shadow-sm flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Sent Payments to Central Finance */}
        <div className="bg-white border border-blue-200 rounded-3xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Send className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-800 font-bold">Dërguar te Financa</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Total Pará të Dërguara</p>
            <h2 className="text-2xl font-black text-blue-950">
              <span className="text-blue-700">{formatALL(totalHandoversAmount)}</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold">{officeHandovers.length} dorëzime me kurier.</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-sm flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Office Earned Commission Interest */}
        <div className="bg-white border border-indigo-200 rounded-3xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-xs text-indigo-700 font-bold">Komisioni i Zyrës ({currentOffice?.intakePercentage || 20}%)</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Komisionet e Ruajtura</p>
            <h2 className="text-2xl font-black text-indigo-950">
              <span className="text-indigo-600">{formatALL(totalEarnedCommission)}</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold">
              Të Shlyera: <strong className="text-emerald-700">{formatALL(paidOfficeCommissions)}</strong> | Në Pritje: <strong className="text-amber-700">{formatALL(pendingOfficeCommissions)}</strong>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Audited Packages Count */}
        <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-800 font-bold">Pagesat e Audituara</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Dërgesa të Audituara</p>
            <h2 className="text-2xl font-black text-slate-950">
              {auditedShipments.length} <span className="text-xs font-bold text-slate-500">pako</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold">Të verifikuara e mbyllura.</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Section 1: COD Audit Management (Toggle between Pending Audit and Audited Payments) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>Auditimi & Mbyllja e Pagesave COD</span>
          </h2>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setAuditViewMode('PENDING')}
              className={`py-1.5 px-3.5 rounded-xl font-black text-xs transition ${
                auditViewMode === 'PENDING'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              ⏳ Në Pritje Auditimi ({pendingAuditShipments.length})
            </button>

            <button
              onClick={() => setAuditViewMode('AUDITED')}
              className={`py-1.5 px-3.5 rounded-xl font-black text-xs transition ${
                auditViewMode === 'AUDITED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              ✓ Pagesat e Audituara ({auditedShipments.length})
            </button>
          </div>
        </div>

        {/* View Mode 1: Pending Audit */}
        {auditViewMode === 'PENDING' && (
          <div>
            {pendingAuditShipments.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-600 text-xs font-bold space-y-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 border border-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="font-black text-slate-950 text-xs">Gjithçka e Audituar!</p>
                <p className="text-slate-500 text-[11px]">Të gjitha paratë COD të mbledhura nga kurierët janë verifikuar dhe mbyllur.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Tracking</th>
                      <th className="py-3.5 px-4">Kurieri i Dorëzimit</th>
                      <th className="py-3.5 px-4">Marrësi</th>
                      <th className="py-3.5 px-4">Paratë COD të Mbledhura</th>
                      <th className="py-3.5 px-4">Statusi Auditit</th>
                      <th className="py-3.5 px-4 text-right">Veprim Arkë</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingAuditShipments.map(s => (
                      <tr key={s.id} className="hover:bg-amber-50/50 transition">
                        <td className="py-3.5 px-4 font-black text-slate-950 font-mono">{s.trackingNumber}</td>
                        <td className="py-3.5 px-4 font-black text-slate-800">{s.courierName || 'Kurieri'}</td>
                        <td className="py-3.5 px-4 text-slate-700">{s.recipientName} ({s.destinationCity})</td>
                        <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">{formatALL(s.codAmount)}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>NË PRITJE AUDITI</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => closeAndAuditShipment(s.id)}
                            className="py-2 px-3.5 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md border border-amber-300 transition active:scale-95"
                          >
                            Audito & Mbyll Dërgesën
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: Audited Payments List */}
        {auditViewMode === 'AUDITED' && (
          <div>
            {auditedShipments.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs font-semibold space-y-1">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-black text-slate-700">Nuk ka ende dërgesa të audituara te kjo zyrë.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Tracking / Barkodi</th>
                      <th className="py-3.5 px-4">Dërguesi / Marrësi</th>
                      <th className="py-3.5 px-4">Kurieri</th>
                      <th className="py-3.5 px-4 text-right">Shuma COD të Audituar</th>
                      <th className="py-3.5 px-4 text-center">Statusi i Auditimit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditedShipments.map(s => (
                      <tr key={s.id} className="hover:bg-emerald-50/30 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-950 font-mono text-xs block">{s.trackingNumber}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{formatDate(s.updatedAt || s.createdAt)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-950 font-black">{s.recipientName} ({s.destinationCity})</p>
                          <p className="text-[10px] text-slate-500 font-semibold">Dërguesi: {s.sellerName || s.senderName}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{s.courierName || 'Dorëzimi në Sportel'}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                          {formatALL(s.packageType === 'PREPAID' ? s.shippingFee : s.codAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>AUDITUAR & MBYLLUR</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Section 2: Financial Records Section Tabs: All Cash Shipments, Audited Payments, Sent Payments, Ledgers */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            
            <button
              onClick={() => setActiveTab('SHIPMENTS')}
              className={`py-2 px-4 rounded-xl font-black text-xs flex items-center gap-2 border transition ${
                activeTab === 'SHIPMENTS'
                  ? 'bg-slate-950 text-[#f6d55c] border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Dërgesat me Pará Cash ({allCashShipments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDITED_PAYMENTS')}
              className={`py-2 px-4 rounded-xl font-black text-xs flex items-center gap-2 border transition ${
                activeTab === 'AUDITED_PAYMENTS'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagesat e Audituara ({auditedShipments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('HANDOVERS')}
              className={`py-2 px-4 rounded-xl font-black text-xs flex items-center gap-2 border transition ${
                activeTab === 'HANDOVERS'
                  ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Paratë e Dërguara te Financa ({officeHandovers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('LEDGERS')}
              className={`py-2 px-4 rounded-xl font-black text-xs flex items-center gap-2 border transition ${
                activeTab === 'LEDGERS'
                  ? 'bg-slate-950 text-[#f6d55c] border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Libri i Komisioneve ({officeLedgers.length})</span>
            </button>

          </div>
        </div>

        {/* TAB 1: ALL CASH SHIPMENTS IN THIS OFFICE */}
        {activeTab === 'SHIPMENTS' && (
          <div>
            {allCashShipments.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-black text-slate-700">Nuk u gjet asnjë dërgesë me pará cash për këtë zyrë.</p>
                <p className="text-[11px] text-slate-400">Dërgesat COD të dorëzuara apo pakot e parapaguara në zyrë do të shfaqen automatikisht këtu.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Tracking / Barkodi</th>
                      <th className="py-3.5 px-4">Lloji i Parave</th>
                      <th className="py-3.5 px-4">Dërguesi / Marrësi</th>
                      <th className="py-3.5 px-4">Roli i Zyrës</th>
                      <th className="py-3.5 px-4 text-right">Shuma Cash (ALL)</th>
                      <th className="py-3.5 px-4 text-center">Statusi i Dërgesës</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allCashShipments.map(s => {
                      const isPrepaid = s.packageType === 'PREPAID' || s.shippingFeePaidBySender || s.codAmount === 0;
                      const isDest = isOfficeMatch(s.destinationOfficeId, s.destinationOfficeName);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-black text-slate-950 font-mono text-xs block">{s.trackingNumber}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{formatDate(s.createdAt)}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isPrepaid ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1 w-fit">
                                <CreditCard className="w-3 h-3 text-emerald-700" />
                                <span>TARIFË POSTARE (300 ALL)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 w-fit">
                                <DollarSign className="w-3 h-3 text-amber-700" />
                                <span>PARÁ COD NË DORËZIM</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-slate-950 font-black">{s.recipientName} ({s.destinationCity})</p>
                            <p className="text-[10px] text-slate-500 font-semibold">Dërguesi: {s.sellerName || s.senderName}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold text-slate-600">
                              {isDest ? 'Zyra e Destinacionit (Tërheqje COD)' : 'Zyra e Origjinës (Pranim Parapagesë)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                            {formatALL(isPrepaid ? (s.shippingFee || 300) : s.codAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 uppercase">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUDITED PAYMENTS RECORDS */}
        {activeTab === 'AUDITED_PAYMENTS' && (
          <div>
            {auditedShipments.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-black text-slate-700">Nuk ka ende dërgesa të audituara e të mbyllura te kjo zyrë.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Tracking / Barkodi</th>
                      <th className="py-3.5 px-4">Dërguesi / Marrësi</th>
                      <th className="py-3.5 px-4">Kurieri</th>
                      <th className="py-3.5 px-4 text-right">Shuma COD të Audituar</th>
                      <th className="py-3.5 px-4 text-center">Statusi i Auditimit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditedShipments.map(s => (
                      <tr key={s.id} className="hover:bg-emerald-50/30 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-950 font-mono text-xs block">{s.trackingNumber}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{formatDate(s.updatedAt || s.createdAt)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-950 font-black">{s.recipientName} ({s.destinationCity})</p>
                          <p className="text-[10px] text-slate-500 font-semibold">Dërguesi: {s.sellerName || s.senderName}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{s.courierName || 'Sportel Zyre'}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                          {formatALL(s.packageType === 'PREPAID' ? s.shippingFee : s.codAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>AUDITUAR & MBYLLUR</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SENT PAYMENTS / SUBMITTED DAILY HANDOVERS TO CENTRAL FINANCE */}
        {activeTab === 'HANDOVERS' && (
          <div>
            {officeHandovers.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold space-y-2">
                <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-black text-slate-700">Nuk keni bërë ende ndonjë dorëzim ditor të arkës te Financa Qendrore.</p>
                <p className="text-[11px] text-slate-400">Pasi të mbyllni arkën ditore dhe t'ia dorëzoni paratë kurierit, regjistrimi do të shfaqet këtu.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-200 text-blue-950 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Data e Dorëzimit</th>
                      <th className="py-3.5 px-4">Kurieri i Transportit</th>
                      <th className="py-3.5 px-4">Operator Zyre</th>
                      <th className="py-3.5 px-4 text-right">Shuma Cash e Dërguar (ALL)</th>
                      <th className="py-3.5 px-4 text-center">Statusi i Konfirmimit nga Financa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officeHandovers.map(h => (
                      <tr key={h.id} className="hover:bg-blue-50/30 transition">
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{formatDate(h.submittedAt)}</td>
                        <td className="py-3.5 px-4 font-black text-slate-950 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>{h.courierName || 'Kurier Transporti'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">{h.submittedBy}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">{formatALL(h.amount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          {h.status === 'RECEIVED_BY_FINANCE' || h.status === 'APPROVED' ? (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>MARRË & KONFIRMUAR NGA FINANCA</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                              <Truck className="w-3 h-3 text-amber-700" />
                              <span>NË UDHËTIM ME KURIER TE FINANCA</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OFFICE LEDGER & COMMISSION RECORDS */}
        {activeTab === 'LEDGERS' && (
          <div>
            {officeLedgers.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-black text-slate-700">Nuk u gjet asnjë regjistrim komisionesh apo llogarie për këtë zyrë.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Data & Koha</th>
                      <th className="py-3.5 px-4">Tracking</th>
                      <th className="py-3.5 px-4">Tipi i Transaksionit</th>
                      <th className="py-3.5 px-4">Përshkrimi</th>
                      <th className="py-3.5 px-4 text-right">Shuma (ALL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officeLedgers.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{formatDate(l.createdAt)}</td>
                        <td className="py-3.5 px-4 font-mono font-black text-slate-950">{l.trackingNumber || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                            l.type.includes('INTEREST')
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : l.type === 'SHIPPING_FEE'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {l.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">{l.description}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                          {formatALL(l.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* DAILY HANDOVER WITH COURIER DIALOG MODAL */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-300 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-slate-950 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="font-black text-base text-slate-950">Mbyllja e Arkës & Caktimi i Kurierit</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po dorëzoni xhiron prej <span className="font-black text-emerald-700 text-sm">{formatALL(derivedCashBalance)}</span> nga <span className="font-black text-slate-950">{currentOffice?.name}</span>.
              </p>
            </div>

            {/* Select Courier */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-700 uppercase block">
                Zgjidh Kurierin e Transportit të Xhiros
              </label>
              <select
                value={selectedCourierId}
                onChange={e => setSelectedCourierId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-950 focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Zgjidh Kurierin e Caktuar --</option>
                {availableCouriers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Shënime Shtesë (Opsionale)</label>
              <textarea
                value={handoverNotes}
                onChange={e => setHandoverNotes(e.target.value)}
                placeholder="P.sh. Çanta e parave fizike u sigurua me plumb..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-950 focus:outline-none focus:border-amber-400 h-16 resize-none"
              />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs"
              >
                Anullo
              </button>
              <button
                onClick={handleCloseDailyRegister}
                disabled={!selectedCourierId}
                className="w-1/2 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-[#f6d55c] font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Dorëzo me Kurier</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
