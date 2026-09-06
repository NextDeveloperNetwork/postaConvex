'use client';

import React, { useState } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { PackageCheck, Search, DollarSign, MapPin, CheckCircle2, Clock } from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CourierHistoryPage() {
  const { shipments, currentUser } = useAuthenticatedState();
  const { } = { } as any;
  const [search, setSearch] = useState('');

  const doneStatuses = ['DELIVERED_PENDING_SETTLEMENT', 'CLOSED', 'OUT_FOR_DELIVERY'];
  const myHistory = shipments.filter(s =>
    s.courierId === currentUser.id && doneStatuses.includes(s.status)
  ).filter(s =>
    !search ||
    s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.recipientName.toLowerCase().includes(search.toLowerCase()) ||
    s.destinationCity.toLowerCase().includes(search.toLowerCase())
  );

  const totalCOD = myHistory
    .filter(s => s.status === 'DELIVERED_PENDING_SETTLEMENT' || s.status === 'CLOSED')
    .reduce((sum, s) => sum + (s.codAmount || 0), 0);

  return (
    <main className="w-full space-y-5 max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 border border-emerald-700 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 text-white">Kurier</span>
          <h1 className="text-lg sm:text-2xl font-black text-white mt-1.5">Historiku i Dergimeve</h1>
          <p className="text-xs font-bold text-emerald-200">{currentUser.name}</p>
        </div>
        <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-md">
          <PackageCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase">Gjithsej</p>
          <p className="text-2xl font-black text-emerald-600">{myHistory.length}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase">COD i Mbledhur</p>
          <p className="text-lg font-black text-emerald-700">{totalCOD.toLocaleString()} ALL</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Kerko ne historik..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-950 font-bold focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-400 shadow-sm" />
      </div>

      {myHistory.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-black text-slate-950 text-sm">Nuk ke dorëzime te kryera ende.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myHistory.map(s => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-emerald-200 transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-black text-sm text-slate-950">{s.trackingNumber}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${s.packageType === 'PREPAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                      {s.packageType === 'PREPAID' ? 'JO COD' : 'COD'}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${s.status === 'OUT_FOR_DELIVERY' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
                      {s.status === 'OUT_FOR_DELIVERY' ? 'Ne Dergim' : 'Dorezuar'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(s.updatedAt)}
                  </p>
                </div>
                {s.codAmount > 0 ? (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold">COD</p>
                    <p className="font-black text-emerald-700 text-sm">{s.codAmount.toLocaleString()} ALL</p>
                  </div>
                ) : (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-1">JO COD</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  {s.recipientName}
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  {s.destinationCity} — {s.destinationAddress}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
