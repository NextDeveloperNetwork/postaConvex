'use client';

import React, { useState } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import {
  PackageCheck,
  Search,
  DollarSign,
  MapPin,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Banknote,
  Calendar,
  Filter,
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DeliveryCourierHistoryPage() {
  const { shipments, currentUser } = useAuthenticatedState();
  const { formatALL } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'cod' | 'prepaid'>('all');

  const doneStatuses = ['DELIVERED_PENDING_SETTLEMENT', 'CLOSED'];

  // Deliveries completed by this courier (or all for admin demo)
  const myDoneShipments = shipments.filter(s =>
    (s.courierId === currentUser.id || !s.courierId || currentUser.role === 'FINANCE_ADMIN') &&
    doneStatuses.includes(s.status)
  );

  const filtered = myDoneShipments.filter(s => {
    const matchSearch =
      !searchTerm ||
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientPhone.includes(searchTerm) ||
      s.destinationCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      (filter === 'cod' && s.codAmount > 0) ||
      (filter === 'prepaid' && !s.codAmount);

    return matchSearch && matchFilter;
  });

  const totalCODCollected = myDoneShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);
  const codCount = myDoneShipments.filter(s => s.codAmount > 0).length;
  const prepaidCount = myDoneShipments.filter(s => !s.codAmount).length;

  return (
    <main className="w-full space-y-5 max-w-3xl mx-auto">

      {/* Top Banner */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 rounded-3xl p-5 md:p-6 shadow-xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 text-white">
              Historiku i Dorëzimeve
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-2">Dorëzimet e Kryera</h1>
            <p className="text-xs font-bold text-emerald-200">{currentUser.name} &bull; {currentUser.officeName || 'Zyrë Destinacioni'}</p>
          </div>
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-white">{myDoneShipments.length}</p>
            <p className="text-[10px] font-black text-emerald-200 uppercase">Gjithsej të Kryera</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-amber-300">{codCount}</p>
            <p className="text-[10px] font-black text-emerald-200 uppercase">Dorëzime me COD</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-base font-black text-emerald-300">{formatALL(totalCODCollected)}</p>
            <p className="text-[10px] font-black text-emerald-200 uppercase">COD i Mbledhur</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Kërko me kod, marrës, telefon..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-950 font-bold focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-[11px] font-black">
          {([['all', 'Të Gjitha'], ['cod', 'COD'], ['prepaid', 'Prepaid']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-2 transition ${filter === val ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List of Completed Deliveries */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
            <PackageCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="font-black text-slate-950 text-sm">Nuk ka dorëzime të kryera në historik.</p>
          <p className="text-xs text-slate-400 font-semibold">
            Pakot e dorëzuara me sukses do të regjistrohen automatikisht këtu me datë e orë.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const hasCOD = s.codAmount > 0;
            const isClosed = s.status === 'CLOSED';

            return (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-emerald-300 transition space-y-3"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-950 tracking-wider">{s.trackingNumber}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        hasCOD
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      }`}>
                        {hasCOD ? 'COD' : 'JO COD (PARAPAGUAR)'}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        isClosed
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {isClosed ? 'MBYLLUR & LIKUIDUAR' : 'DORËZUAR & COD I MBLEDHUR'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Kryer më: {formatDate(s.updatedAt)}
                    </p>
                  </div>

                  {hasCOD && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-bold text-slate-400">COD i Mbledhur</p>
                      <p className="font-black text-base text-emerald-600">{formatALL(s.codAmount)}</p>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-950">{s.recipientName}</span>
                    <span className="text-slate-400">({s.recipientPhone})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-semibold text-slate-700 truncate">{s.destinationAddress || s.destinationCity}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}
