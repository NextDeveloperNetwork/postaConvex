'use client';

import React, { useState, useMemo } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { FinancialDistributionVoucherModal } from '@/components/financial-distribution-voucher-modal';
import {
  FileText, Search, Truck, Building2, CheckCircle2, Clock, Printer,
  ShieldCheck, DollarSign, AlertCircle, Package, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { PayoutDispatchBatch } from '@/lib/types';

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function getAgeHours(iso?: string): number {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function AgeBadge({ iso }: { iso?: string }) {
  const h = getAgeHours(iso);
  if (h < 4) return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">{h < 1 ? '< 1 orë' : `${Math.floor(h)} orë`}</span>;
  if (h < 24) return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">{Math.floor(h)} orë</span>;
  return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300">{Math.floor(h / 24)} ditë</span>;
}

const PAGE_SIZE = 20;

export default function FinanceDistributionsPage() {
  const { payoutBatches } = useAuthenticatedState();
  const { formatALL } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState<PayoutDispatchBatch | null>(null);
  const [page, setPage] = useState(1);

  // ─── Metrics ────────────────────────────────────────────────────────────
  const pendingPickup = payoutBatches.filter(b => b.status === 'PENDING_COURIER_PICKUP');
  const inTransit = payoutBatches.filter(b => b.status === 'IN_TRANSIT');
  const received = payoutBatches.filter(b => b.status === 'RECEIVED_BY_OFFICE' || b.status === 'COMPLETED');
  const rejected = payoutBatches.filter(b => b.status === 'REJECTED');
  const totalCash = payoutBatches.filter(b => b.status !== 'REJECTED').reduce((s, b) => s + b.totalAmount, 0);
  const inTransitCash = inTransit.reduce((s, b) => s + b.totalAmount, 0) + pendingPickup.reduce((s, b) => s + b.totalAmount, 0);

  // ─── Pipeline proportions ────────────────────────────────────────────────
  const total = payoutBatches.length || 1;
  const pipelineSteps = [
    { label: 'Në Pritje Kurier', count: pendingPickup.length, pct: (pendingPickup.length / total) * 100, color: 'bg-amber-400' },
    { label: 'Në Tranzit', count: inTransit.length, pct: (inTransit.length / total) * 100, color: 'bg-blue-500' },
    { label: 'Pranuar', count: received.length, pct: (received.length / total) * 100, color: 'bg-emerald-500' },
    { label: 'Refuzuar', count: rejected.length, pct: (rejected.length / total) * 100, color: 'bg-red-400' },
  ];

  // ─── Filter ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => payoutBatches.filter(b => {
    const matchSearch = !searchTerm ||
      (b.batchCode && b.batchCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.officeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.courierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  }), [payoutBatches, searchTerm, statusFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [filtered]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PENDING_COURIER_PICKUP': return { text: '⏳ Pritje Kurier', cls: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'IN_TRANSIT': return { text: '🚚 Në Tranzit', cls: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'RECEIVED_BY_OFFICE': return { text: '✓ Pranuar', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'COMPLETED': return { text: '✓ Kompletuar', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'REJECTED': return { text: '✗ Refuzuar', cls: 'bg-red-100 text-red-900 border-red-300' };
      default: return { text: s, cls: 'bg-slate-100 text-slate-900 border-slate-300' };
    }
  };

  return (
    <main className="w-full space-y-6 pb-8">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-3xl p-5 md:p-7 shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Financa · Dëshmi Historike
            </span>
            <h1 className="text-2xl font-black text-white mt-1.5">Arkiva e Shpërndarjeve & Vouchers</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Zinxhiri i verifikuar i kujdestarisë — {payoutBatches.length} zarfe gjithsej
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {inTransit.length > 0 && (
              <div className="bg-blue-600/30 border border-blue-500/40 rounded-2xl px-4 py-2 text-center">
                <p className="text-[10px] font-black text-blue-200 uppercase">Aktive në Tranzit</p>
                <p className="text-lg font-black text-white">{inTransit.length}</p>
              </div>
            )}
            <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase">Totali Cash</p>
              <p className="text-lg font-black text-[#f6d55c]">{formatALL(totalCash)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Në Pritje Kurier', count: pendingPickup.length, amount: pendingPickup.reduce((s, b) => s + b.totalAmount, 0), color: 'amber', icon: Clock },
          { label: 'Në Tranzit', count: inTransit.length, amount: inTransitCash, color: 'blue', icon: Truck },
          { label: 'Pranuar në Zyrë', count: received.length, amount: received.reduce((s, b) => s + b.totalAmount, 0), color: 'emerald', icon: CheckCircle2 },
          { label: 'Refuzuar', count: rejected.length, amount: rejected.reduce((s, b) => s + b.totalAmount, 0), color: 'red', icon: AlertCircle },
        ].map(k => (
          <div key={k.label} className={`bg-white rounded-3xl p-5 border border-${k.color}-200 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-black uppercase text-${k.color}-800`}>{k.label}</p>
              <div className={`w-8 h-8 rounded-xl bg-${k.color}-100 text-${k.color}-700 flex items-center justify-center`}>
                <k.icon className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-2xl font-black text-${k.color}-900`}>{k.count} <span className="text-sm font-bold text-slate-400">zarfe</span></p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">{formatALL(k.amount)}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-950 text-sm">Pipeline i Shpërndarjes</h2>
            <p className="text-[10px] text-slate-500 font-semibold">Shpërndarja e zarfeve sipas fazës aktuale</p>
          </div>
        </div>
        <div className="space-y-3">
          {pipelineSteps.map(s => (
            <div key={s.label}>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">{s.label}</span>
                <span className="font-black text-slate-950">{s.count} zarfe <span className="text-slate-400 font-semibold">({s.pct.toFixed(0)}%)</span></span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-black text-slate-950 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Zarfat e Shpërndarjes ({sorted.length})
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Klikoni "Voucher" për certifikatën zyrtare të shpërndarjes</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Kërko me kod, zyrë, kurier..."
                value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-400" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
              <option value="ALL">Të gjitha statuset</option>
              <option value="PENDING_COURIER_PICKUP">Pritje Kurier</option>
              <option value="IN_TRANSIT">Në Tranzit</option>
              <option value="RECEIVED_BY_OFFICE">Pranuar në Zyrë</option>
              <option value="REJECTED">Refuzuar</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs font-semibold">Nuk u gjet asnjë zarf me këto kritere.</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Kodi Voucher</th>
                    <th className="py-3 px-4">Zyra Marrëse</th>
                    <th className="py-3 px-4">Kurieri</th>
                    <th className="py-3 px-4 text-right">Shuma</th>
                    <th className="py-3 px-4">Data Nisjes</th>
                    <th className="py-3 px-4 text-center">Aging</th>
                    <th className="py-3 px-4 text-center">Statusi</th>
                    <th className="py-3 px-4 text-center">Dëshmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(b => {
                    const sl = statusLabel(b.status);
                    const isActive = b.status === 'IN_TRANSIT' || b.status === 'PENDING_COURIER_PICKUP';
                    return (
                      <tr key={b.id} className={`hover:bg-indigo-50/30 transition ${isActive ? 'bg-blue-50/20' : ''}`}>
                        <td className="py-3 px-4 font-mono font-black text-indigo-900">
                          {b.batchCode || `BAT-${b.id.slice(-6).toUpperCase()}`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-black text-slate-950">{b.officeName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-indigo-500" />
                            <div>
                              <p className="font-black text-slate-900">{b.courierName}</p>
                              {b.courierAcceptedAt
                                ? <p className="text-[9px] text-emerald-600 font-bold">✓ Aprovuar {formatDate(b.courierAcceptedAt)}</p>
                                : <p className="text-[9px] text-amber-600 font-bold">⏳ Pa aprovuar nga kurieri</p>
                              }
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-indigo-950 text-sm">{formatALL(b.totalAmount)}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{formatDate(b.createdAt)}</td>
                        <td className="py-3 px-4 text-center">
                          {isActive ? <AgeBadge iso={b.createdAt} /> : <span className="text-slate-300 text-[10px]">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border inline-block ${sl.cls}`}>{sl.text}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => setSelectedBatch(b)}
                            className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl text-[10px] border border-indigo-200 transition active:scale-95 inline-flex items-center gap-1">
                            <Printer className="w-3 h-3" /> Voucher
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] font-semibold text-slate-500">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} nga {sorted.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-slate-700 px-3">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedBatch && <FinancialDistributionVoucherModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />}
    </main>
  );
}
