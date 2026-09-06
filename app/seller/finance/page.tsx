'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { SellerPayoutReceiptModal } from '@/components/seller-payout-receipt-modal';
import { SellerPayoutProof } from '@/lib/types';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Wallet,
  CreditCard,
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  X,
  FileCheck2,
  Printer,
  KeyRound
} from 'lucide-react';

export default function SellerFinancePage() {
  const { t, formatALL } = useI18n();
  const { currentUser, shipments, payoutProofs } = useAuthenticatedState();

  const [selectedProof, setSelectedProof] = useState<SellerPayoutProof | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'SETTLED' | 'COD_COLLECTED' | 'UNPAID'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL');

  const sellerShipments = shipments.filter(s => s.sellerId === currentUser.id);

  // Apply Date Presets
  const handleDatePreset = (preset: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'THIS_WEEK') {
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      const firstStr = firstDayOfWeek.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(firstStr);
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstStr = firstDayOfMonth.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(firstStr);
      setEndDate(todayStr);
    }
  };

  // Filter Shipments Logic
  const filteredShipments = sellerShipments.filter(s => {
    // 1. Search term match
    const matchSearch =
      !searchTerm ||
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientPhone.includes(searchTerm) ||
      s.destinationCity.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Payment status match
    const matchPayment =
      paymentFilter === 'ALL' ||
      s.paymentStatus === paymentFilter;

    // 3. Date range match
    let matchDate = true;
    if (s.createdAt) {
      const shipmentDateStr = s.createdAt.split('T')[0];
      if (startDate && shipmentDateStr < startDate) matchDate = false;
      if (endDate && shipmentDateStr > endDate) matchDate = false;
    }

    return matchSearch && matchPayment && matchDate;
  });

  // Financial calculations based on filtered shipments
  const totalCodCollected = filteredShipments
    .filter(s => s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED')
    .reduce((sum, s) => sum + s.codAmount, 0);

  const totalNetSellerPayout = filteredShipments
    .filter(s => s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED')
    .reduce((sum, s) => sum + s.sellerNet, 0);

  const settledNet = filteredShipments
    .filter(s => s.paymentStatus === 'SETTLED')
    .reduce((sum, s) => sum + s.sellerNet, 0);

  const pendingSettlementNet = filteredShipments
    .filter(s => s.paymentStatus === 'COD_COLLECTED')
    .reduce((sum, s) => sum + s.sellerNet, 0);

  // Export Filtered Table to CSV
  const handleExportCSV = () => {
    const headers = ["Tracking", "Marrësi", "Telefon", "Qyteti", "COD Mbledhur", "Tarifa Postare", "Netto Shitësi", "Statusi i Pagesës", "Data"];
    const rows = filteredShipments.map(s => [
      s.trackingNumber,
      `"${s.recipientName}"`,
      `"${s.recipientPhone}"`,
      `"${s.destinationCity}"`,
      s.codAmount,
      s.shippingFee,
      s.sellerNet,
      s.paymentStatus,
      `"${s.createdAt.split('T')[0]}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POSTA_Shitesi_Likuidimet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPaymentFilter('ALL');
    setStartDate('');
    setEndDate('');
    setDatePreset('ALL');
  };

  const isFiltered = searchTerm || paymentFilter !== 'ALL' || startDate || endDate || datePreset !== 'ALL';

  return (
    <main className="w-full space-y-3.5">
      
      {/* Sleek Compact Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] via-amber-300 to-amber-200 border border-amber-300 rounded-2xl py-3 px-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center text-[#f6d55c] shadow-sm flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-950 leading-tight">Likuidimet & Bilanci COD</h1>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-950 text-[#f6d55c]">
                {t.nav.seller}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-800 hidden sm:block">Përmbledhja e Parave të Mbledhura, Zboret Postare dhe Likuidimet Netto</p>
          </div>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="py-2 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-[#f6d55c] font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 border border-slate-800 flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#f6d55c]" />
          <span className="hidden sm:inline">Eksporto CSV</span>
          <span className="sm:hidden">CSV</span>
        </button>
      </div>

      {/* Summary KPI Cards - Ultra Compact 1 Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Total Net Payout */}
        <div className="bg-white border border-[#f6d55c] rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between font-bold hover:shadow-sm transition">
          <div>
            <span className="text-[11px] text-slate-500 font-extrabold block">Total Netto te Shitësi</span>
            <p className="text-xl font-black text-slate-950 leading-snug">{formatALL(totalNetSellerPayout)}</p>
            <p className="text-[9px] text-slate-400 font-semibold">COD ({formatALL(totalCodCollected)}) - Tarifa</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 flex-shrink-0">
            <Wallet className="w-4 h-4 text-slate-950" />
          </div>
        </div>

        {/* Settled Net Payout */}
        <div className="bg-white border border-emerald-300 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between font-bold hover:shadow-sm transition">
          <div>
            <span className="text-[11px] text-emerald-800 font-extrabold block">Likuiduar (Paguar)</span>
            <p className="text-xl font-black text-emerald-700 leading-snug">{formatALL(settledNet)}</p>
            <p className="text-[9px] text-slate-400 font-semibold">Kaluar në IBAN ose Cash</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 border border-emerald-300 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
        </div>

        {/* Pending Settlement Net Payout */}
        <div className="bg-white border border-amber-300 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between font-bold hover:shadow-sm transition">
          <div>
            <span className="text-[11px] text-amber-900 font-extrabold block">Në Pritje të Likuidimit</span>
            <p className="text-xl font-black text-amber-900 leading-snug">{formatALL(pendingSettlementNet)}</p>
            <p className="text-[9px] text-slate-400 font-semibold">Gati për transferim mbrapsht</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
          </div>
        </div>

      </div>

      {/* ULTRA COMPACT SINGLE-ROW FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-black text-slate-950 text-xs uppercase tracking-wider">Filtrat e Kërkimit</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Presets */}
            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-[10px] font-black">
              {([['ALL', 'Gjitha'], ['TODAY', 'Sot'], ['THIS_WEEK', 'Javë'], ['THIS_MONTH', 'Muaj']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => handleDatePreset(val)}
                  className={`px-2.5 py-1 rounded-lg transition ${datePreset === val ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition border border-red-200 flex items-center gap-1"
                title="Pastro të gjithë filtrat"
              >
                <RefreshCw className="w-3 h-3" /> Pastro
              </button>
            )}
          </div>
        </div>

        {/* Compact Grid Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kërko kod, marrës, qytet..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">Të gjitha statuset</option>
              <option value="SETTLED">✓ Të Likuiduara</option>
              <option value="COD_COLLECTED">⏳ Në Pritje Likuidimi</option>
              <option value="UNPAID">📦 Në Dërgim (Pa Mbledhur)</option>
            </select>
          </div>

          {/* Nga Data */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Nga:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setDatePreset('ALL');
              }}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Deri Data */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Deri:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setDatePreset('ALL');
              }}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-amber-400"
            />
          </div>

        </div>
      </div>

      {/* High-Density Full-Width Payout Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="font-black text-slate-950 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>Tabela e Likuidimeve ({filteredShipments.length})</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-500">
            Shfaqen {filteredShipments.length} nga {sellerShipments.length} dërgesa
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-bold border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Tracking</th>
                <th className="py-2.5 px-3">Marrësi</th>
                <th className="py-2.5 px-3">Qyteti</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3 text-right">COD Total</th>
                <th className="py-2.5 px-3 text-right">Tarifa Postare</th>
                <th className="py-2.5 px-3 text-right">Netto Për Ju</th>
                <th className="py-2.5 px-3 text-center">Statusi i Pagesës</th>
                <th className="py-2.5 px-3 text-center">Dëshmia & Kodi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-semibold">
                    Nuk ka asnjë dërgesë që përputhet me filtrat e zgjedhur.
                  </td>
                </tr>
              ) : (
                filteredShipments.map(s => {
                  const matchedProof = (payoutProofs || []).find(p => p.shipmentId === s.id);
                  const withdrawalPin = `PIN-${s.trackingNumber.slice(-4)}`;

                  return (
                    <tr key={s.id} className="hover:bg-amber-50/50 transition">
                      <td className="py-2.5 px-3 font-black text-slate-950 font-mono text-[11px]">{s.trackingNumber}</td>
                      <td className="py-2.5 px-3 font-black text-slate-950">{s.recipientName}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-600">{s.destinationCity}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{s.createdAt ? s.createdAt.split('T')[0] : '—'}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-950">{formatALL(s.codAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-red-600 font-black">-{formatALL(s.shippingFee)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">{formatALL(s.sellerNet)}</td>
                      <td className="py-2.5 px-3 text-center">
                        {s.paymentStatus === 'SETTLED' ? (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                            ✓ LIKUIDUAR
                          </span>
                        ) : s.paymentStatus === 'COD_COLLECTED' ? (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 inline-block">
                            ⏳ NË PRITJE
                          </span>
                        ) : (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 inline-block">
                            NË DËRGIM
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {s.paymentStatus === 'SETTLED' ? (
                          matchedProof ? (
                            <button
                              onClick={() => setSelectedProof(matchedProof)}
                              className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black rounded-lg text-[10px] border border-emerald-300 transition active:scale-95 flex items-center gap-1 mx-auto"
                              title="Shiko & Printo Dëshminë e Pagesës"
                            >
                              <Printer className="w-3 h-3 text-emerald-600" />
                              <span>Faturë</span>
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">Likuiduar</span>
                          )
                        ) : s.paymentStatus === 'COD_COLLECTED' ? (
                          <div className="text-center" title="Paraqitni këtë kod në zyrë për tërheqjen e parave cash">
                            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                              <KeyRound className="w-2.5 h-2.5" />
                              <span>{withdrawalPin}</span>
                            </span>
                            <span className="block text-[8px] text-slate-400 font-semibold mt-0.5">Kodi i Tërheqjes</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller Payout Receipt / Voucher Viewer */}
      {selectedProof && (
        <SellerPayoutReceiptModal
          proof={selectedProof}
          onClose={() => setSelectedProof(null)}
        />
      )}

    </main>
  );
}
