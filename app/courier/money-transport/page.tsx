'use client';

import React, { useState } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/toast-notification';
import { SignaturePad } from '@/components/signature-pad';
import {
  Banknote,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  X,
  Package,
  Check,
  RefreshCw
} from 'lucide-react';

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('sq-AL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function CourierMoneyTransportPage() {
  const {
    currentUser,
    handovers,
    payoutBatches,
    shipments,
    approveCashHandoverByCourier,
    rejectCashHandoverByCourier,
    approvePayoutBatchByCourier,
    rejectPayoutBatchByCourier,
    syncFromDB,
  } = useAuthenticatedState();
  const { formatALL } = useI18n();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'IN_CUSTODY' | 'HISTORY'>('PENDING');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal states for Handover approval
  const [approvingHandover, setApprovingHandover] = useState<any | null>(null);
  const [handoverSignature, setHandoverSignature] = useState('');
  const [isProcessingHandover, setIsProcessingHandover] = useState(false);

  // Modal states for Handover rejection
  const [rejectingHandover, setRejectingHandover] = useState<any | null>(null);
  const [handoverRejectReason, setHandoverRejectReason] = useState('');

  // Modal states for Payout Batch approval
  const [approvingBatch, setApprovingBatch] = useState<any | null>(null);
  const [batchSignature, setBatchSignature] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Modal states for Payout Batch rejection
  const [rejectingBatch, setRejectingBatch] = useState<any | null>(null);
  const [batchRejectReason, setBatchRejectReason] = useState('');

  // Filter transfers assigned to this courier (or all for demo/admin)
  const isCourierMatch = (courierId?: string | null, courierName?: string | null) => {
    if (!currentUser) return false;
    if (courierId && courierId === currentUser.id) return true;
    if (courierName && currentUser.name && courierName.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) return true;
    return false;
  };

  // 1. Office Cash Handovers (Office -> Finance)
  const myPendingHandovers = handovers.filter(
    h => isCourierMatch(h.courierId, h.courierName) && (h.status === 'PENDING_COURIER_PICKUP' || h.status === 'PENDING_APPROVAL')
  );

  const myInTransitHandovers = handovers.filter(
    h => isCourierMatch(h.courierId, h.courierName) && h.status === 'TRANSIT_TO_FINANCE'
  );

  const myCompletedHandovers = handovers.filter(
    h => isCourierMatch(h.courierId, h.courierName) && (h.status === 'RECEIVED_BY_FINANCE' || h.status === 'APPROVED' || h.status === 'REJECTED')
  );

  // 2. Central Finance Payout Envelopes (Finance -> Office)
  const myPendingBatches = payoutBatches.filter(
    b => isCourierMatch(b.courierId, b.courierName) && b.status === 'PENDING_COURIER_PICKUP'
  );

  const myInTransitBatches = payoutBatches.filter(
    b => isCourierMatch(b.courierId, b.courierName) && b.status === 'IN_TRANSIT'
  );

  const myCompletedBatches = payoutBatches.filter(
    b => isCourierMatch(b.courierId, b.courierName) && (b.status === 'RECEIVED_BY_OFFICE' || b.status === 'COMPLETED' || b.status === 'REJECTED')
  );

  // Active Custody Totals
  const activeHandoverCash = myInTransitHandovers.reduce((sum, h) => sum + h.amount, 0);
  const activeBatchCash = myInTransitBatches.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalActiveCustodyCash = activeHandoverCash + activeBatchCash;

  const totalPendingApprovalsCount = myPendingHandovers.length + myPendingBatches.length;

  const handleRefresh = async () => {
    setIsSyncing(true);
    await syncFromDB();
    setIsSyncing(false);
    showSuccess('Të dhënat e transportit u sinkronizuan!');
  };

  // ── Handover Actions ──
  const handleConfirmHandoverAccept = async () => {
    if (!approvingHandover) return;
    setIsProcessingHandover(true);
    try {
      await approveCashHandoverByCourier(approvingHandover.id, handoverSignature || undefined);
      showSuccess(`Pranimi i arkës prej ${formatALL(approvingHandover.amount)} u konfirmua me sukses! Paratë janë tashmë në ngarkimin tuaj.`);
      setApprovingHandover(null);
      setHandoverSignature('');
      await syncFromDB();
    } catch (err) {
      showError('Ndodhi një gabim gjatë aprovimit të parave.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  const handleConfirmHandoverReject = async () => {
    if (!rejectingHandover) return;
    if (!handoverRejectReason.trim()) {
      showError('Ju lutem shënoni arsyen e refuzimit të parave.');
      return;
    }
    try {
      await rejectCashHandoverByCourier(rejectingHandover.id, handoverRejectReason);
      showSuccess(`Dorëzimi i arkës u refuzua dhe u kthye mbrapsht te zyra.`);
      setRejectingHandover(null);
      setHandoverRejectReason('');
      await syncFromDB();
    } catch (err) {
      showError('Ndodhi një gabim gjatë refuzimit të parave.');
    }
  };

  // ── Batch Actions ──
  const handleConfirmBatchAccept = async () => {
    if (!approvingBatch) return;
    setIsProcessingBatch(true);
    try {
      await approvePayoutBatchByCourier(approvingBatch.id, batchSignature || undefined);
      showSuccess(`Zarfi i pagesave prej ${formatALL(approvingBatch.totalAmount)} u pranua me sukses! Në tranzit për në ${approvingBatch.officeName}.`);
      setApprovingBatch(null);
      setBatchSignature('');
      await syncFromDB();
    } catch (err) {
      showError('Ndodhi një gabim gjatë aprovimit të zarfit.');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleConfirmBatchReject = async () => {
    if (!rejectingBatch) return;
    if (!batchRejectReason.trim()) {
      showError('Ju lutem shënoni arsyen e refuzimit të zarfit.');
      return;
    }
    try {
      await rejectPayoutBatchByCourier(rejectingBatch.id, batchRejectReason);
      showSuccess(`Zarfi i pagesave u refuzua dhe u kthye mbrapsht te Financa.`);
      setRejectingBatch(null);
      setBatchRejectReason('');
      await syncFromDB();
    } catch (err) {
      showError('Ndodhi një gabim gjatë refuzimit të zarfit.');
    }
  };

  return (
    <main className="w-full space-y-6 max-w-5xl mx-auto">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950 flex items-center gap-1.5 inline-flex">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kujdestaria e Sigurt &bull; Transporti i Parave</span>
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-2">Menaxhimi i Parave në Ngarkim</h1>
          <p className="text-xs font-bold text-slate-400">
            Aprovimi zyrtar i pranimit të parave nga zyrat dhe financa, dhe dëshmia e kujdestarisë
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isSyncing}
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs transition active:scale-95 flex items-center gap-2 border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Rifresko Gjendjen</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Active Cash in Custody */}
        <div className="bg-white border-2 border-emerald-300 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 uppercase">Para Fizike në Ngarkim</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">{formatALL(totalActiveCustodyCash)}</p>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span>Çanta në lëvizje: {myInTransitHandovers.length + myInTransitBatches.length}</span>
          </div>
        </div>

        {/* Pending Approvals Count */}
        <div className={`border-2 rounded-3xl p-5 shadow-sm space-y-2 transition ${
          totalPendingApprovalsCount > 0 ? 'bg-amber-500/10 border-amber-400' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 uppercase">Në Pritje Aprovimi</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-700">{totalPendingApprovalsCount}</p>
          <p className="text-[11px] font-bold text-slate-600">
            {totalPendingApprovalsCount > 0 ? 'Kërkohet pranimi juaj për të nisur udhëtimin' : 'Nuk keni kërkesa të reja'}
          </p>
        </div>

        {/* Completed Transports */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-600 uppercase">Transfere të Mbyllura</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{myCompletedHandovers.length + myCompletedBatches.length}</p>
          <p className="text-[11px] font-bold text-slate-500">Dorëzuar me sukses te Financa ose Zyrat</p>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-2 px-4 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Në Pritje Aprovimi ({totalPendingApprovalsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('IN_CUSTODY')}
          className={`py-2 px-4 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'IN_CUSTODY'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Në Ngarkim / Tranzit ({myInTransitHandovers.length + myInTransitBatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`py-2 px-4 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Historiku ({myCompletedHandovers.length + myCompletedBatches.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'PENDING' && (
        <div className="space-y-5">

          {totalPendingApprovalsCount === 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Nuk keni para në pritje për aprovim!</h3>
              <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                Kur një zyrë përgatit dorëzimin e arkës ose Financa përgatit zarfe pagesash për t'i transportuar, ato do të shfaqen këtu për konfirmimin tuaj.
              </p>
            </div>
          )}

          {/* Section A: Handover from Offices */}
          {myPendingHandovers.length > 0 && (
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 text-sm">Dorëzime Arkash nga Zyrat Rajonale</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Zyrat po ju dorëzojnë paratë cash për t'i çuar te Financa Qendrore</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                  {myPendingHandovers.length} Në Pritje
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myPendingHandovers.map(h => (
                  <div key={h.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                        {h.transferCode || `TRF-${h.id.slice(-6).toUpperCase()}`}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">{formatDate(h.submittedAt)}</span>
                    </div>

                    <div>
                      <p className="font-black text-slate-950 text-base flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>{h.officeName}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Dorëzuesi: {h.submittedBy || 'Stafi i Zyrës'}</p>
                      <p className="text-xl font-black text-amber-800 mt-2">{formatALL(h.amount)}</p>
                      {h.notes && <p className="text-[11px] text-slate-600 italic bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1.5">"{h.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setApprovingHandover(h);
                          setHandoverSignature('');
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovo & Prano Paratë</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectingHandover(h);
                          setHandoverRejectReason('');
                        }}
                        className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-black rounded-xl text-xs transition active:scale-95"
                      >
                        Refuzo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: Payout Batches from Finance */}
          {myPendingBatches.length > 0 && (
            <div className="bg-white border-2 border-indigo-300 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 text-sm">Zarfe Pagesash nga Financa Qendrore</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Financa po ju dorëzon zarfin e parave për t'ia çuar zyrës rajonale për likuidimin e shitësve</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 bg-indigo-100 text-indigo-900 rounded-full border border-indigo-300">
                  {myPendingBatches.length} Në Pritje
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myPendingBatches.map(b => (
                  <div key={b.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-900 text-white font-mono">
                        {b.batchCode || `BAT-${b.id.slice(-6).toUpperCase()}`}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">{formatDate(b.createdAt)}</span>
                    </div>

                    <div>
                      <p className="font-black text-slate-950 text-base flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Destinacioni: {b.officeName}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Dërguesi: {b.dispatchedByName || 'Financa Qendrore'}</p>
                      <p className="text-xl font-black text-indigo-900 mt-2">{formatALL(b.totalAmount)}</p>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Përfshin: {formatALL(b.totalAmount - (b.officeCommissionAmount || 0))} për Shitësit + {formatALL(b.officeCommissionAmount || 0)} Komision Zyre
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setApprovingBatch(b);
                          setBatchSignature('');
                        }}
                        className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovo & Prano Zarfin</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectingBatch(b);
                          setBatchRejectReason('');
                        }}
                        className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-black rounded-xl text-xs transition active:scale-95"
                      >
                        Refuzo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: IN CUSTODY (ACTIVE IN TRANSIT) */}
      {activeTab === 'IN_CUSTODY' && (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border-2 border-emerald-400 rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 text-base">Paratë Aktualisht në Kujdestarinë Tuaj</h3>
                <p className="text-xs font-semibold text-slate-700">Këto shuma janë aprovuar nga ju dhe po transportohen drejt destinacionit</p>
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-800">{formatALL(totalActiveCustodyCash)}</p>
          </div>

          {myInTransitHandovers.length === 0 && myInTransitBatches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-xs font-bold">
              Nuk keni ndonjë çantë ose zarf parash aktualisht në udhëtim.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myInTransitHandovers.map(h => (
                <div key={h.id} className="bg-white border-2 border-emerald-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      ARKË NË TRANZIT: {h.transferCode}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">{formatDate(h.courierAcceptedAt || h.submittedAt)}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-950 text-base">Origjina: {h.officeName} &rarr; Financa Qendrore</h4>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{formatALL(h.amount)}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Pranuar nga ju më: {formatDate(h.courierAcceptedAt)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Në udhëtim drejt Kasafortës së Financës Qendrore</span>
                  </div>
                </div>
              ))}

              {myInTransitBatches.map(b => (
                <div key={b.id} className="bg-white border-2 border-indigo-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                      ZARF NË TRANZIT: {b.batchCode}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">{formatDate(b.courierAcceptedAt || b.createdAt)}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-950 text-base">Financa Qendrore &rarr; {b.officeName}</h4>
                    <p className="text-2xl font-black text-indigo-900 mt-1">{formatALL(b.totalAmount)}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Pranuar nga ju më: {formatDate(b.courierAcceptedAt)}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-2.5 border border-indigo-200 text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-700" />
                    <span>Në udhëtim drejt sportelit të zyrës {b.officeName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Regjistri i Kujdestarisë së Parave të Përfunduara</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Kodi / Lloji</th>
                  <th className="py-3 px-4">Relacioni</th>
                  <th className="py-3 px-4 text-right">Shuma</th>
                  <th className="py-3 px-4">Data e Pranimit</th>
                  <th className="py-3 px-4 text-center">Statusi Përfundimtar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCompletedHandovers.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-black text-slate-950">
                      {h.transferCode || `ARK-${h.id.slice(-6)}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {h.officeName} &rarr; Financa
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      {formatALL(h.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(h.courierAcceptedAt || h.submittedAt)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {h.status === 'REJECTED' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-200">
                          Refuzuar
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                          ✓ Pranuar në Kasafortë
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {myCompletedBatches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-black text-slate-950">
                      {b.batchCode || `BAT-${b.id.slice(-6)}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Financa &rarr; {b.officeName}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-indigo-900">
                      {formatALL(b.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(b.courierAcceptedAt || b.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.status === 'REJECTED' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-200">
                          Refuzuar
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                          ✓ Dorëzuar te Zyra
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: APROVO DOREZIMIN E ARKES NGA ZYRA ── */}
      {approvingHandover && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base">Aprovimi i Kujdestarisë së Arkës</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{approvingHandover.transferCode}</p>
                </div>
              </div>
              <button onClick={() => setApprovingHandover(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-900 uppercase">Shuma Fizike për Pranim</span>
              <p className="text-3xl font-black text-emerald-700">{formatALL(approvingHandover.amount)}</p>
              <p className="text-xs text-slate-600 font-semibold">Nga Zyra: {approvingHandover.officeName} &bull; Dorëzuar nga: {approvingHandover.submittedBy}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700">Nënshkrimi juaj i pranimit (Opsionale me ekran):</label>
              <SignaturePad
                onSave={dataUrl => setHandoverSignature(dataUrl)}
                title="Nënshkrimi i Kurierit për Kujdestarinë"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] font-bold text-amber-900">
              ⚠️ Duke klikuar "Konfirmo Marrjen", ju merrni përgjegjësinë ligjore e financiare për këtë shumë deri te dorëzimi në kasafortën qendrore.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setApprovingHandover(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition"
              >
                Anulo
              </button>
              <button
                onClick={handleConfirmHandoverAccept}
                disabled={isProcessingHandover}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessingHandover ? 'Po konfirmohet...' : 'Konfirmo Marrjen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: REFUZO DOREZIMIN E ARKES ── */}
      {rejectingHandover && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <h3 className="font-black text-slate-950 text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Refuzimi i Pranimit të Arkës</span>
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              A jeni të sigurt që dëshironi të refuzoni marrjen e shumës prej {formatALL(rejectingHandover.amount)} nga {rejectingHandover.officeName}? Paratë do të kthehen në kasën e zyrës.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700">Arsyeja e Refuzimit (e detyrueshme):</label>
              <textarea
                value={handoverRejectReason}
                onChange={e => setHandoverRejectReason(e.target.value)}
                placeholder="P.sh. Shuma fizike nuk përputhet me faturën, çanta e dëmtuar, etj."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-400"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectingHandover(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition"
              >
                Kthehu
              </button>
              <button
                onClick={handleConfirmHandoverReject}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95"
              >
                Refuzo Zyrtarisht
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: APROVO ZARFIN NGA FINANCA ── */}
      {approvingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base">Aprovimi i Zarfit të Pagesave</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{approvingBatch.batchCode}</p>
                </div>
              </div>
              <button onClick={() => setApprovingBatch(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-bold text-indigo-900 uppercase">Shuma e Zarfit për Transport</span>
              <p className="text-3xl font-black text-indigo-900">{formatALL(approvingBatch.totalAmount)}</p>
              <p className="text-xs text-slate-600 font-semibold">Për Zyrën Destinacion: {approvingBatch.officeName}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700">Nënshkrimi juaj i pranimit (Opsionale me ekran):</label>
              <SignaturePad
                onSave={dataUrl => setBatchSignature(dataUrl)}
                title="Nënshkrimi i Kurierit për Zarf Pagesash"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] font-bold text-amber-900">
              ⚠️ Duke klikuar "Konfirmo Marrjen", ju merrni në ngarkim zarfin e sigurt të pagesave për ta dorëzuar te sporteli i zyrës {approvingBatch.officeName}.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setApprovingBatch(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition"
              >
                Anulo
              </button>
              <button
                onClick={handleConfirmBatchAccept}
                disabled={isProcessingBatch}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessingBatch ? 'Po konfirmohet...' : 'Konfirmo Marrjen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: REFUZO ZARFIN NGA FINANCA ── */}
      {rejectingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <h3 className="font-black text-slate-950 text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Refuzimi i Zarfit të Pagesave</span>
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              A jeni të sigurt që dëshironi të refuzoni zarfin prej {formatALL(rejectingBatch.totalAmount)} për zyrën {rejectingBatch.officeName}? Zarfi do të kthehet mbrapsht te Financa.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700">Arsyeja e Refuzimit (e detyrueshme):</label>
              <textarea
                value={batchRejectReason}
                onChange={e => setBatchRejectReason(e.target.value)}
                placeholder="P.sh. Zarfi i hapur, mungesë vule, pa autorizim etj."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-400"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectingBatch(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition"
              >
                Kthehu
              </button>
              <button
                onClick={handleConfirmBatchReject}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95"
              >
                Refuzo Zyrtarisht
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
