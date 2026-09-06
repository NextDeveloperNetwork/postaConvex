'use client';

import React, { useState } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { Bag } from '@/lib/types';
import {
  Archive,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  Package,
  AlertCircle,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

const BAG_STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: 'Pret Aprovimin',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500 animate-pulse',
    icon: Clock,
  },
  APPROVED: {
    label: 'Aprovuar - Ne Transit',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
    icon: Truck,
  },
  REJECTED: {
    label: 'Refuzuar',
    color: 'bg-red-100 text-red-700 border-red-300',
    dot: 'bg-red-500',
    icon: XCircle,
  },
  IN_TRANSIT: {
    label: 'Ne Transit',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    dot: 'bg-indigo-500',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Kompletuar',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    dot: 'bg-emerald-500',
    icon: PackageCheck,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function BagCard({ bag, shipments }: {
  bag: Bag;
  shipments: ReturnType<typeof useAuthenticatedState>['shipments'];
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = BAG_STATUS_CONFIG[bag.status];
  const Icon = cfg.icon;
  const bagShipments = shipments.filter(s => bag.shipmentIds.includes(s.id));
  const totalCOD = bagShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);

  return (
    <div className={`bg-white border rounded-3xl shadow-md overflow-hidden transition-all ${bag.status === 'REJECTED' ? 'border-red-200 opacity-80' : 'border-slate-200'}`}>
      {/* Card Header */}
      <div className="p-5 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${cfg.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-slate-950 text-sm">{bag.id.replace('bag-', 'THES-')}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
              bag.bagType === 'TRANSIT' 
                ? 'bg-indigo-100 text-indigo-900 border-indigo-300' 
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {bag.bagType === 'TRANSIT' ? `Tranzit: ${bag.destinationOfficeName || 'Zyrë Tjetër'}` : 'Dorëzim Lokal'}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 font-semibold">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              Kurieri: <strong className="text-slate-950">{bag.courierName}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              {bag.shipmentIds.length} pako
            </span>
            {totalCOD > 0 && (
              <span className="flex items-center gap-1 font-black text-slate-950">
                COD: {totalCOD.toLocaleString()} ALL
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(bag.createdAt)}
            </span>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Status Info Banners (Courier operates approval on courier portal) */}
      <div className="px-5 pb-4">
        {bag.status === 'PENDING_APPROVAL' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2.5 text-xs text-amber-900 font-semibold">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
            <span>Në pritje që kurieri <strong>{bag.courierName}</strong> të aprovojë pranimin e thesit me {bag.shipmentIds.length} pako.</span>
          </div>
        )}

        {bag.status === 'APPROVED' && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-3.5 py-2.5 text-xs text-blue-900 font-semibold">
            <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Aprovuar nga kurieri <strong>{bag.courierName}</strong>. Thesi është në transit / dërgim.</span>
          </div>
        )}

        {bag.status === 'REJECTED' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-3.5 py-2.5 text-xs text-red-900 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Refuzuar nga kurieri <strong>{bag.courierName}</strong>.{bag.notes ? ` Arsyeja: "${bag.notes}"` : ''} Pakot janë kthyer në radhë.</span>
          </div>
        )}

        {bag.status === 'COMPLETED' && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-emerald-900 font-semibold">
            <PackageCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Të gjitha pakot e thesit u dorëzuan me sukses nga kurieri <strong>{bag.courierName}</strong>.</span>
          </div>
        )}
      </div>

      {/* Expanded package list */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {bagShipments.length === 0 ? (
            <p className="px-5 py-4 text-xs text-slate-400 font-bold">Pakot nuk gjenden.</p>
          ) : bagShipments.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3 text-xs hover:bg-slate-50 transition">
              <span className="text-slate-400 font-black w-5 text-center">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="font-black text-slate-950">{s.trackingNumber}</span>
                <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded border ${s.packageType === 'PREPAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                  {s.packageType === 'PREPAID' ? 'JO COD' : 'COD'}
                </span>
                <p className="text-slate-500 font-semibold truncate">{s.recipientName} — {s.destinationCity}</p>
              </div>
              {s.codAmount > 0 && (
                <span className="font-black text-slate-950 flex-shrink-0">{s.codAmount.toLocaleString()} ALL</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OfficeBagsPage() {
  const { bags, shipments } = useAuthenticatedState();
  const [filter, setFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('ALL');

  const filtered = filter === 'ALL' ? bags : bags.filter(b => b.status === filter);

  const pendingCount = bags.filter(b => b.status === 'PENDING_APPROVAL').length;
  const approvedCount = bags.filter(b => b.status === 'APPROVED').length;

  const FILTERS = [
    { key: 'ALL', label: 'Te Gjitha', count: bags.length },
    { key: 'PENDING_APPROVAL', label: 'Pret Aprovim', count: pendingCount },
    { key: 'APPROVED', label: 'Aprovuar', count: approvedCount },
    { key: 'REJECTED', label: 'Refuzuar', count: bags.filter(b => b.status === 'REJECTED').length },
    { key: 'COMPLETED', label: 'Kompletuar', count: bags.filter(b => b.status === 'COMPLETED').length },
  ] as const;

  return (
    <main className="w-full space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-800 border border-slate-700 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">Zyra Postare</span>
          <h1 className="text-lg sm:text-2xl font-black text-white mt-1.5">Thaset e Derguar</h1>
          <p className="text-xs font-bold text-slate-400">Menaxhimi i thesave dhe aprovimi i kurierit</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="w-9 h-9 bg-amber-400 border border-amber-300 rounded-2xl flex items-center justify-center text-slate-950 font-black text-sm shadow">
              {pendingCount}
            </span>
          )}
          <div className="w-11 h-11 bg-[#f6d55c] rounded-2xl flex items-center justify-center text-slate-950 shadow-md flex-shrink-0">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gjithsej Thasë', value: bags.length, color: 'text-slate-950' },
          { label: 'Pret Aprovim', value: pendingCount, color: 'text-amber-600' },
          { label: 'Ne Dergim', value: approvedCount, color: 'text-blue-600' },
          { label: 'Kompletuar', value: bags.filter(b => b.status === 'COMPLETED').length, color: 'text-emerald-600' },
        ].map(t => (
          <div key={t.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase">{t.label}</p>
            <p className={`text-2xl font-black ${t.color}`}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition ${filter === f.key ? 'bg-slate-950 text-[#f6d55c] border-slate-800 shadow' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
            {f.label}
            {f.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${filter === f.key ? 'bg-[#f6d55c] text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bag list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto">
            <Archive className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <p className="font-black text-slate-950 text-sm">Nuk ka thesa {filter !== 'ALL' ? `me status "${BAG_STATUS_CONFIG[filter as keyof typeof BAG_STATUS_CONFIG]?.label}"` : ''}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Krijo nje thes nga faqja e caktimit te kuriereve.</p>
          </div>
          <Link href="/office/assign"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl border border-amber-300 shadow transition active:scale-95">
            <Plus className="w-3.5 h-3.5" /> Shko te Caktimi i Kuriereve
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(bag => (
            <BagCard
              key={bag.id}
              bag={bag}
              shipments={shipments}
            />
          ))}
        </div>
      )}

    </main>
  );
}
