'use client';

import React, { useState } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { Archive, CheckCircle2, XCircle, Clock, Package, Truck, DollarSign, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

const STATUS_CFG = {
  PENDING_APPROVAL: { label: 'Pret Aprovimin', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  APPROVED: { label: 'Aprovuar', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Truck },
  REJECTED: { label: 'Refuzuar', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
  IN_TRANSIT: { label: 'Ne Transit', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Truck },
  COMPLETED: { label: 'Kompletuar', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CourierBagsPage() {
  const { bags, shipments, approveBag, rejectBag, currentUser } = useAuthenticatedState();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');

  const myBags = bags.filter(b => b.courierId === currentUser.id || currentUser.role === 'FINANCE_ADMIN');
  const filtered = filter === 'ALL' ? myBags : myBags.filter(b => b.status === filter);

  return (
    <main className="w-full space-y-5 max-w-3xl mx-auto">

      <div className="bg-gradient-to-r from-amber-400 to-amber-300 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">Kurier</span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Thaset e Mia</h1>
          <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
        </div>
        <div className="w-11 h-11 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md">
          <Archive className="w-5 h-5" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => {
          const count = myBags.filter(b => b.status === key).length;
          return (
            <button key={key} onClick={() => setFilter(filter === key ? 'ALL' : key)}
              className={`rounded-2xl p-3 text-center border transition ${filter === key ? 'ring-2 ring-indigo-400' : ''} ${cfg.color}`}>
              <p className="text-lg font-black">{count}</p>
              <p className="text-[9px] font-bold leading-tight">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <Archive className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-black text-slate-950 text-sm">Nuk ka thasa per te shfaqur.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(bag => {
            const cfg = STATUS_CFG[bag.status];
            const Icon = cfg.icon;
            const bagShipments = shipments.filter(s => bag.shipmentIds.includes(s.id));
            const totalCOD = bagShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);
            const isExpanded = expanded === bag.id;

            return (
              <div key={bag.id} className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-slate-950 text-sm">{bag.id.replace('bag-', 'THES-')}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                        bag.bagType === 'TRANSIT'
                          ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {bag.bagType === 'TRANSIT' ? `Tranzit: ${bag.destinationOfficeName || 'Zyrë Tjetër'}` : 'Dorëzim Lokal'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {bag.shipmentIds.length} pako</span>
                      {totalCOD > 0 && <span className="font-black text-slate-950 flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-600" />{totalCOD.toLocaleString()} ALL</span>}
                      <span className="flex items-center gap-1 text-slate-400"><Calendar className="w-3 h-3" />{formatDate(bag.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(isExpanded ? null : bag.id)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {bag.status === 'PENDING_APPROVAL' && (
                  <div className="px-5 pb-4 flex gap-3">
                    <button onClick={() => approveBag(bag.id)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl border border-emerald-700 transition active:scale-95 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprovo Thesin
                    </button>
                    <button onClick={() => rejectBag(bag.id, 'Refuzuar nga kurieri')}
                      className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs rounded-2xl border border-red-200 transition active:scale-95">
                      Refuzoj
                    </button>
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {bagShipments.map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-3 px-5 py-3 text-xs hover:bg-slate-50">
                        <span className="text-slate-400 font-black w-4">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-black text-slate-950">{s.trackingNumber}</span>
                          <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded border ${s.packageType === 'PREPAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                            {s.packageType === 'PREPAID' ? 'JO COD' : 'COD'}
                          </span>
                          <p className="text-slate-500 font-semibold truncate">{s.recipientName} — {s.destinationCity}</p>
                        </div>
                        {s.codAmount > 0 && <span className="font-black text-slate-950">{s.codAmount.toLocaleString()} ALL</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
