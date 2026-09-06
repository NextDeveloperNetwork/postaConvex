'use client';

import React, { useState } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import {
  Truck,
  Package,
  CheckCircle2,
  DollarSign,
  ScanBarcode,
  Clock,
  Archive,
  ChevronRight,
  Banknote,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

export default function CourierPage() {
  const {
    shipments,
    bags,
    handovers,
    payoutBatches,
    approveBag,
    rejectBag,
    currentUser,
  } = useAuthenticatedState();
  const { formatALL } = useI18n();

  const [expanded, setExpanded] = useState<string | null>(null);

  // Local deliveries awaiting delivery action
  const myDeliveries = shipments.filter(
    s => s.courierId === currentUser.id && s.status === 'OUT_FOR_DELIVERY'
  );

  // In-transit bags (TRANSIT type already approved, moving)
  const myTransitBags = bags.filter(
    b => b.courierId === currentUser.id && b.status === 'APPROVED' && b.bagType === 'TRANSIT'
  );

  // Pending bags awaiting courier approval
  const myPendingBags = bags.filter(
    b => b.courierId === currentUser.id && b.status === 'PENDING_APPROVAL'
  );

  const pendingMoneyTransfersCount = (handovers || []).filter(
    h => (h.courierId === currentUser.id || h.courierName === currentUser.name) &&
      (h.status === 'PENDING_COURIER_PICKUP' || h.status === 'PENDING_APPROVAL')
  ).length + (payoutBatches || []).filter(
    b => (b.courierId === currentUser.id || b.courierName === currentUser.name) &&
      b.status === 'PENDING_COURIER_PICKUP'
  ).length;

  const inCustodyMoneyAmount = (handovers || []).filter(
    h => (h.courierId === currentUser.id || h.courierName === currentUser.name) && h.status === 'TRANSIT_TO_FINANCE'
  ).reduce((sum, h) => sum + h.amount, 0) + (payoutBatches || []).filter(
    b => (b.courierId === currentUser.id || b.courierName === currentUser.name) && b.status === 'IN_TRANSIT'
  ).reduce((sum, b) => sum + b.totalAmount, 0);

  const totalCOD = myDeliveries.reduce((sum, s) => sum + (s.codAmount || 0), 0);
  const doneBags = bags.filter(
    b => b.courierId === currentUser.id && (b.status === 'COMPLETED' || b.status === 'REJECTED')
  ).length;

  return (
    <main className="w-full space-y-5 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-3xl p-5 md:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 text-white">
              Paneli i Kurierit
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-2">Mirësevini, {currentUser.name.split(' ')[0]}!</h1>
            <p className="text-xs font-bold text-indigo-200">{currentUser.officeName || 'Kurier i Lirë'}</p>
          </div>
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-white border border-white/20">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-amber-300">{myPendingBags.length}</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase">Thasë me Aprovim</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-sky-300">{myTransitBags.length}</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase">Thasë në Tranzit</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-emerald-300">{doneBags}</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase">Thasë Kryer</p>
          </div>
        </div>
      </div>

      {/* Alert banner if money needs approval */}
      {pendingMoneyTransfersCount > 0 && (
        <Link
          href="/courier/money-transport"
          className="block bg-amber-500/15 border-2 border-amber-400 rounded-3xl p-4 text-amber-950 hover:bg-amber-500/25 transition shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm text-slate-950">
                  {pendingMoneyTransfersCount} Transfer(e) Parash në Pritje të Aprovimit Tuaj!
                </p>
                <p className="text-xs text-slate-700 font-semibold">
                  Zyra ose Financa ju kanë caktuar për transport cash. Klikoni këtu për të verifikuar e pranuar.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-800" />
          </div>
        </Link>
      )}

      {/* ── Quick Access Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Money Transport Card */}
        <Link href="/courier/money-transport"
          className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition group relative overflow-hidden ${
            pendingMoneyTransfersCount > 0
              ? 'border-amber-300 hover:border-amber-500'
              : inCustodyMoneyAmount > 0
              ? 'border-emerald-300 hover:border-emerald-500'
              : 'border-slate-200 hover:border-slate-300'
          }`}>
          <div className="absolute top-3 right-3">
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition" />
          </div>
          {pendingMoneyTransfersCount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white font-black text-[9px] rounded-full w-5 h-5 flex items-center justify-center">
              {pendingMoneyTransfersCount}
            </span>
          )}
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${
            pendingMoneyTransfersCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Banknote className="w-5 h-5" />
          </div>
          <p className="font-black text-slate-950 text-sm">Transporti i Parave</p>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Kujdestaria & Aprovimi</p>
          <div className="mt-3">
            {inCustodyMoneyAmount > 0 ? (
              <p className="text-base font-black text-emerald-700">{formatALL(inCustodyMoneyAmount)}</p>
            ) : pendingMoneyTransfersCount > 0 ? (
              <span className="text-xs font-black text-amber-600">{pendingMoneyTransfersCount} me aprovuar</span>
            ) : (
              <p className="text-[11px] text-slate-400 font-bold">0 ALL në ngarkim</p>
            )}
          </div>
        </Link>

        {/* Bags / Approval Card */}
        <Link href="/courier/bags"
          className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition group relative overflow-hidden ${
            myPendingBags.length > 0
              ? 'border-amber-200 hover:border-amber-400'
              : 'border-slate-200 hover:border-slate-300'
          }`}>
          <div className="absolute top-3 right-3">
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition" />
          </div>
          {myPendingBags.length > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white font-black text-[9px] rounded-full w-5 h-5 flex items-center justify-center">
              {myPendingBags.length}
            </span>
          )}
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${
            myPendingBags.length > 0 ? 'bg-amber-100' : 'bg-slate-100'
          }`}>
            <Archive className={`w-5 h-5 ${myPendingBags.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <p className="font-black text-slate-950 text-sm">Thasët e Caktuara</p>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Tranzit Ndërmjet Zyrave</p>
          {myPendingBags.length > 0 ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xl font-black text-amber-600">{myPendingBags.length}</span>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Me aprovuar</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-slate-400 font-bold">Nuk ka thasë në pritje</p>
          )}
        </Link>

        {/* History Card */}
        <Link href="/courier/history"
          className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition group relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition" />
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-black text-slate-950 text-sm">Historiku i Tranzitit</p>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Thasët e dorëzuara</p>
          <p className="mt-3 text-xl font-black text-emerald-600">{doneBags}</p>
        </Link>
      </div>

      {/* ── Pending Bags — Approve inline ──────────────────── */}
      {myPendingBags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-black text-slate-950">Thasët që presin aprovimin tënd</p>
          </div>

          {myPendingBags.map(bag => {
            const bagShipments = shipments.filter(s => bag.shipmentIds.includes(s.id));
            const totalCOD = bagShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);
            const isExpanded = expanded === bag.id;
            const isDelivery = bag.bagType !== 'TRANSIT';

            return (
              <div
                key={bag.id}
                className={`bg-white border rounded-3xl shadow-sm overflow-hidden ${
                  isDelivery ? 'border-amber-200' : 'border-indigo-200'
                }`}
              >
                {/* Bag header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : bag.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-black text-slate-950">{bag.id.replace('bag-', 'THES-')}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                          isDelivery
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                        }`}>
                          {isDelivery ? '🚚 Dorëzim Lokal' : `🔄 Tranzit → ${bag.destinationOfficeName || 'Zyrë Tjetër'}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold">
                        {bag.shipmentIds.length} pako &bull; Zyra: {bag.officeName}
                      </p>
                      {isDelivery && totalCOD > 0 && (
                        <p className="text-xs font-black text-amber-700 mt-0.5 flex items-center gap-1">
                          <Banknote className="w-3 h-3" /> {formatALL(totalCOD)} COD për mbledhur
                        </p>
                      )}
                      {!isDelivery && (
                        <p className="text-xs font-semibold text-indigo-700 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Destinacioni: {bag.destinationOfficeName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <ScanBarcode className="w-5 h-5 text-slate-300" />
                      <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className={`mt-3 rounded-xl px-3 py-2 text-[11px] font-semibold ${
                    isDelivery
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
                  }`}>
                    {isDelivery
                      ? `Me aprovimin, ${bag.shipmentIds.length} pakot i merr për dorëzim te klientët dhe mbledh COD-in.`
                      : `Me aprovimin, thesi kalon në transport drejt ${bag.destinationOfficeName || 'zyrës tjetër'}.`
                    }
                  </div>
                </div>

                {/* Expanded package list */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50">
                    <div className="divide-y divide-slate-100">
                      {bagShipments.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                          <span className="text-slate-400 font-black w-4">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-black text-slate-950">{s.trackingNumber}</span>
                            <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded border ${
                              s.codAmount > 0
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            }`}>
                              {s.codAmount > 0 ? 'COD' : 'JO COD'}
                            </span>
                            <p className="text-slate-500 font-semibold truncate mt-0.5">{s.recipientName} — {s.destinationCity}</p>
                          </div>
                          {s.codAmount > 0 && (
                            <span className="font-black text-slate-950 flex-shrink-0">{s.codAmount.toLocaleString()} ALL</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 p-4 border-t border-slate-100">
                  <button
                    onClick={() => approveBag(bag.id)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow border border-emerald-700 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isDelivery ? 'Aprovo & Merr Pakot' : 'Aprovo & Nis Transportin'}
                  </button>
                  <button
                    onClick={() => rejectBag(bag.id, 'Refuzuar nga kurieri')}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs rounded-2xl border border-red-200 transition active:scale-95"
                  >
                    Refuzoj
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Active Transit Bags ──────────────────────────────── */}
      {myTransitBags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Package className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-black text-slate-950">Thasët në Tranzit</p>
          </div>
          {myTransitBags.map(bag => (
            <div key={bag.id} className="bg-white border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-950 text-sm">{bag.id.replace('bag-', 'THES-')}</p>
                <p className="text-xs text-slate-500 font-semibold truncate">
                  {bag.shipmentIds.length} pako → {bag.destinationOfficeName || 'Zyrë Tjetër'}
                </p>
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 flex-shrink-0">
                Në Rrugë
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── No tasks at all ─────────────────────────────────── */}
      {myDeliveries.length === 0 && myPendingBags.length === 0 && myTransitBags.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="font-black text-slate-950 text-sm">Bravo! Nuk ke detyra aktive.</p>
          <p className="text-xs text-slate-400 font-semibold">Zyra do të caktojë thasë të reja kur të jenë gati.</p>
        </div>
      )}

      {/* ── History shortcut ─────────────────────────────────── */}
      <Link
        href="/courier/history"
        className="block text-center text-xs font-black text-indigo-500 hover:text-indigo-700 py-2 transition"
      >
        Shiko historikun e plotë →
      </Link>

    </main>
  );
}
