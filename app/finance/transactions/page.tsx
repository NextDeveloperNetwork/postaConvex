'use client';

import React, { useState, useMemo } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Receipt, Search, Download, AlertCircle, ArrowDownLeft, ArrowUpRight,
  DollarSign, Wallet, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react';

type SortField = 'createdAt' | 'amount' | 'category' | 'partyName';
type SortDir = 'asc' | 'desc';

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('sq-AL', { day: '2-digit', month: '2-digit' });
}

const PAGE_SIZE = 25;

export default function FinanceTransactionsPage() {
  const { ledgers, handovers } = useAuthenticatedState();
  const { formatALL } = useI18n();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // ─── Build unified transaction list ─────────────────────────────────────
  const allTransactions = useMemo(() => {
    const handoverIntakes = handovers
      .filter(h => h.status === 'RECEIVED_BY_FINANCE' || h.status === 'APPROVED')
      .map(h => ({
        id: `handover-${h.id}`,
        createdAt: h.submittedAt || new Date().toISOString(),
        trackingNumber: `ARK-${h.id.slice(-6).toUpperCase()}`,
        type: 'CASH_HANDOVER_INTAKE',
        category: 'DEBIT' as const,
        partyName: h.officeName,
        description: `Depozitim cash nga Zyra "${h.officeName}"`,
        amount: h.amount,
      }));

    const seenKeys = new Set<string>();
    const outflows = ledgers
      .filter(l => ['OFFICE_COMMISSION_PAYOUT', 'ADMIN_PROFIT_TRANSFER', 'SELLER_SETTLEMENT', 'SELLER_REVERSE_PAYOUT'].includes(l.type))
      .filter(l => {
        const key = `${l.type}-${l.officeName || l.sellerName}-${l.amount}-${(l.createdAt || '').slice(0, 16)}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      })
      .map(l => ({
        id: `outflow-${l.id}`,
        createdAt: l.createdAt,
        trackingNumber: l.trackingNumber || 'REF-TRANSFER',
        type: l.type,
        category: 'CREDIT' as const,
        partyName: l.officeName || l.sellerName || 'Administrata',
        description: l.description,
        amount: l.amount,
      }));

    return [...handoverIntakes, ...outflows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [handovers, ledgers]);

  // Add running balance to each row
  const withBalance = useMemo(() => {
    let runningBalance = 0;
    return allTransactions.map(t => {
      runningBalance += t.category === 'DEBIT' ? t.amount : -t.amount;
      return { ...t, balance: runningBalance };
    });
  }, [allTransactions]);

  // ─── Area chart data ─────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();
    const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : 90;
    const buckets: Record<string, { date: string; label: string; hyrje: number; dalje: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, label: `${d.getDate()}/${d.getMonth() + 1}`, hyrje: 0, dalje: 0 };
    }
    withBalance.forEach(t => {
      const key = (t.createdAt || '').slice(0, 10);
      if (!buckets[key]) return;
      if (t.category === 'DEBIT') buckets[key].hyrje += t.amount;
      else buckets[key].dalje += t.amount;
    });
    return Object.values(buckets);
  }, [withBalance, chartPeriod]);

  // ─── Filter + sort ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return withBalance.filter(t => {
      const itemDate = (t.createdAt || '').slice(0, 10);
      const matchSearch = !search ||
        (t.trackingNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.partyName || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'ALL' ? true :
        filter === 'DEBIT_ONLY' ? t.category === 'DEBIT' :
        filter === 'CREDIT_ONLY' ? t.category === 'CREDIT' :
        t.type === filter;
      const matchStart = !startDate || itemDate >= startDate;
      const matchEnd = !endDate || itemDate <= endDate;
      return matchSearch && matchFilter && matchStart && matchEnd;
    });
  }, [withBalance, search, filter, startDate, endDate]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'partyName') cmp = (a.partyName || '').localeCompare(b.partyName || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalIn = filtered.filter(t => t.category === 'DEBIT').reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.category === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const netFlow = totalIn - totalOut;

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-slate-300 text-[10px]">⇅</span>;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-indigo-600" /> : <ChevronUp className="w-3 h-3 text-indigo-600" />;
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Ora', 'Tracking', 'Tipi', 'Kategoria', 'Beneficiari', 'DEBIT +', 'CREDIT -', 'Balanca', 'Përshkrimi'];
    const rows = sorted.map(t => [
      t.id, t.createdAt, t.trackingNumber, t.type, t.category,
      `"${t.partyName}"`,
      t.category === 'DEBIT' ? t.amount : 0,
      t.category === 'CREDIT' ? t.amount : 0,
      t.balance.toFixed(0),
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `regjistri_cash_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <main className="w-full space-y-6 pb-8">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-3xl p-5 md:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">
            Financa · Lëvizjet e Arkës Cash
          </span>
          <h1 className="text-2xl font-black text-white mt-1.5">Historiku i Transaksioneve</h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Regjistri me balancë progresive — {allTransactions.length} lëvizje gjithsej</p>
        </div>
        <button onClick={handleExportCSV}
          className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md transition active:scale-95 flex items-center gap-2">
          <Download className="w-4 h-4" /> Eksporto CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-emerald-800 uppercase">Hyrjet Cash (DEBIT +)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{formatALL(totalIn)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Depozitim fizik në kasafortë</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-purple-800 uppercase">Daljet Cash (CREDIT -)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-900">{formatALL(totalOut)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Shlyerje dhe zarfe të dërguara</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-700 uppercase">Fluksi Neto Cash</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black ${netFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatALL(netFlow)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Hyrjet minus daljet (filtrat aktuale)</p>
        </div>
      </div>

      {/* Area Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-slate-950 text-sm">Trendi i Fluksit Cash</h2>
            <p className="text-[10px] text-slate-500 font-semibold">Hyrjet (DEBIT) vs Daljet (CREDIT) sipas ditës</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['7d', '30d', 'all'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${chartPeriod === p ? 'bg-white shadow text-slate-950' : 'text-slate-500'}`}>
                {p === '7d' ? '7 Ditë' : p === '30d' ? '30 Ditë' : 'Gjithë'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradHyrje" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDalje" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickLine={false} axisLine={false}
                interval={chartPeriod === '30d' ? 4 : 0} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickLine={false} axisLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                formatter={(val: any, name: string) => [`${Number(val).toLocaleString('sq-AL')} L`, name === 'hyrje' ? 'Hyrje +' : 'Dalje -']} />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
                formatter={v => v === 'hyrje' ? 'Hyrje Cash (+)' : 'Dalje Cash (-)'} />
              <Area type="monotone" dataKey="hyrje" stroke="#10b981" strokeWidth={2} fill="url(#gradHyrje)" />
              <Area type="monotone" dataKey="dalje" stroke="#a855f7" strokeWidth={2} fill="url(#gradDalje)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-black text-slate-950 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              Regjistri i Transaksioneve ({sorted.length} lëvizje)
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Faqja {page} nga {totalPages} · {PAGE_SIZE} rreshta/faqe</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Kërko tracking, zyrë..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-400" />
            </div>
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none">
              <option value="ALL">Të gjitha</option>
              <option value="DEBIT_ONLY">Vetëm Hyrjet (+)</option>
              <option value="CREDIT_ONLY">Vetëm Daljet (-)</option>
              <option value="CASH_HANDOVER_INTAKE">Pranim Arke</option>
              <option value="OFFICE_COMMISSION_PAYOUT">Shlyerje Komisioni</option>
              <option value="ADMIN_PROFIT_TRANSFER">Transferim Fitimi</option>
              <option value="SELLER_SETTLEMENT">Likuidim Shitësi</option>
            </select>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none" />
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none" />
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="py-10 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-xs font-semibold">Nuk u gjet asnjë transaksion me filtrat e zgjedhur.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4 cursor-pointer hover:text-indigo-700" onClick={() => handleSort('createdAt')}>
                      <span className="flex items-center gap-1">Data/Ora <SortIcon field="createdAt" /></span>
                    </th>
                    <th className="py-3 px-4">Tracking / Ref</th>
                    <th className="py-3 px-4">Lloji</th>
                    <th className="py-3 px-4 cursor-pointer hover:text-indigo-700" onClick={() => handleSort('partyName')}>
                      <span className="flex items-center gap-1">Beneficiari <SortIcon field="partyName" /></span>
                    </th>
                    <th className="py-3 px-4 text-right text-emerald-700 cursor-pointer hover:text-emerald-900" onClick={() => handleSort('amount')}>
                      <span className="flex items-center justify-end gap-1">DEBIT + <SortIcon field="amount" /></span>
                    </th>
                    <th className="py-3 px-4 text-right text-purple-700">CREDIT -</th>
                    <th className="py-3 px-4 text-right text-slate-700">Balanca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(t => {
                    const isDebit = t.category === 'DEBIT';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{formatDate(t.createdAt)}</td>
                        <td className="py-3 px-4 font-mono font-black text-slate-950">{t.trackingNumber}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${isDebit ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-purple-100 text-purple-900 border border-purple-300'}`}>
                            {t.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-950">{t.partyName}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">{isDebit ? formatALL(t.amount) : '—'}</td>
                        <td className="py-3 px-4 text-right font-black text-purple-700">{!isDebit ? formatALL(t.amount) : '—'}</td>
                        <td className={`py-3 px-4 text-right font-black text-sm ${t.balance >= 0 ? 'text-slate-950' : 'text-red-600'}`}>
                          {formatALL(t.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] font-semibold text-slate-500">
                Duke treguar {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} nga {sorted.length} lëvizje
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition ${page === pageNum ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
