'use client';

import React, { useState, useMemo } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/toast-notification';
import ConfirmModal from '@/components/confirm-modal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, Award, Building2, User, Search, CheckCircle2, Receipt,
  ChevronDown, ChevronRight, Send, Clock, Check, AlertCircle, Package,
  Truck, Download, BarChart2, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { isOfficeMatch, calculatePackageFinancials, getFinanceRecognizedShipments } from '@/lib/finance-utils';

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getDaysAgo(iso?: string): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function AgingBadge({ daysAgo }: { daysAgo: number }) {
  if (daysAgo === 0) return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">Sot</span>;
  if (daysAgo <= 3) return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">{daysAgo} ditë</span>;
  return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300">{daysAgo} ditë</span>;
}

const PAGE_SIZE = 20;
type TabId = 'pending' | 'history' | 'by_office';

export default function FinanceBeneficiariesPage() {
  const { shipments, ledgers, offices, payoutBatches, handovers, users, createPayoutDispatchBatch, syncFromDB } = useAuthenticatedState();
  const { formatALL } = useI18n();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // Confirm modals
  const [confirmAdminTransfer, setConfirmAdminTransfer] = useState(false);
  const [isAdminTransferring, setIsAdminTransferring] = useState(false);
  const [confirmOfficeId, setConfirmOfficeId] = useState<string | null>(null);
  const [confirmOfficeName, setConfirmOfficeName] = useState('');
  const [confirmOfficeAmount, setConfirmOfficeAmount] = useState(0);
  const [isPayingOffice, setIsPayingOffice] = useState(false);
  const [selectedSellerItem, setSelectedSellerItem] = useState<any | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [isDispatchingSeller, setIsDispatchingSeller] = useState(false);

  const availableCouriers = users.filter(u => ['COURIER_TRANSPORT', 'COURIER', 'COURIER_DELIVERY'].includes(u.role));

  // ─── CALCULATIONS ─────────────────────────────────────────────────────────
  // Use same filter as original code to capture all admin transfer entries
  const totalAdminTransferred = ledgers
    .filter(l => l.type === 'ADMIN_PROFIT_TRANSFER' || (l.description && l.description.includes('fitimit')))
    .reduce((s, l) => s + l.amount, 0);

  const deliveredShipments = useMemo(() =>
    getFinanceRecognizedShipments(shipments, handovers, offices),
    [shipments, handovers, offices]
  );

  // A. Sellers: correctly calculate active unpaid packages without double-deduction
  const sellerMap = useMemo(() => deliveredShipments.reduce((acc, s) => {
    const key = s.sellerId || s.sellerName || 'unassigned';
    const name = s.sellerName || 'Shitësi';
    if (!acc[key]) {
      acc[key] = {
        key: `seller-${key}`,
        type: 'SELLER' as const,
        name,
        subLabel: 'E-Commerce Seller',
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        packages: [],
      };
    }
    acc[key].totalAmount += s.sellerNet;

    // Check if this package has already been dispatched via a payout batch
    const isDispatched = payoutBatches.some(b =>
      b.status !== 'REJECTED' &&
      (b.sellerPayouts || []).some(p => p.shipmentId === s.id || (p.trackingNumber && p.trackingNumber.toUpperCase() === s.trackingNumber.toUpperCase()))
    );

    // Check if this package has been settled in office or ledger
    const isSettled = s.paymentStatus === 'SETTLED' || ledgers.some(l =>
      (l.type === 'SELLER_SETTLEMENT' || l.type === 'SELLER_REVERSE_PAYOUT') &&
      (l.shipmentId === s.id || (l.trackingNumber && l.trackingNumber.toUpperCase() === s.trackingNumber.toUpperCase()))
    );

    if (isSettled || isDispatched) {
      acc[key].paidAmount += s.sellerNet;
    } else {
      acc[key].pendingAmount += s.sellerNet;
      const oldestDate = s.updatedAt || s.createdAt;
      (acc[key] as any).oldestPending = (acc[key] as any).oldestPending || oldestDate;
      acc[key].packages.push({
        id: s.id,
        trackingNumber: s.trackingNumber,
        recipient: `${s.recipientName} (${s.destinationCity})`,
        detail: `COD: ${formatALL(s.codAmount)} | Tarifa: -${formatALL(s.shippingFee || 300)}`,
        amount: s.sellerNet,
        status: 'UNPAID',
      });
    }

    return acc;
  }, {} as Record<string, any>), [deliveredShipments, ledgers, payoutBatches]);

  // B. Offices: only display the UNPAID packages in the active liabilities list
  const officeMap = useMemo(() => offices.reduce((acc, o) => {
    const origPkgs = deliveredShipments.filter(s => isOfficeMatch(o, s.originOfficeId, s.originOfficeName));
    const destPkgs = deliveredShipments.filter(s => isOfficeMatch(o, s.destinationOfficeId, s.destinationOfficeName));

    const origCom = origPkgs.reduce((s, sh) => s + Math.round((sh.shippingFee || 300) * ((o.intakePercentage || 20) / 100)), 0);
    const destCom = destPkgs.length * 100;
    const totalCom = origCom + destCom;

    const paidCom = ledgers.filter(l => (l.officeId === o.id || l.officeName === o.name) && l.type === 'OFFICE_COMMISSION_PAYOUT').reduce((s, l) => s + l.amount, 0);
    const paidBatches = payoutBatches.filter(b => (b.officeId === o.id || b.officeName === o.name) && b.status !== 'REJECTED').reduce((s, b) => s + (b.officeCommissionAmount || 0), 0);
    const totalPaid = paidCom + paidBatches;
    const pending = Math.max(0, totalCom - totalPaid);

    if (totalCom > 0) {
      const allOfficeItems = [
        ...origPkgs.map(s => ({
          id: `${s.id}-o`,
          trackingNumber: s.trackingNumber,
          recipient: `${s.recipientName} (${s.destinationCity})`,
          detail: `Intake ${o.intakePercentage || 20}%`,
          amount: Math.round((s.shippingFee || 300) * ((o.intakePercentage || 20) / 100)),
          createdAt: s.createdAt,
        })),
        ...destPkgs.map(s => ({
          id: `${s.id}-d`,
          trackingNumber: s.trackingNumber,
          recipient: `${s.recipientName} (${s.destinationCity})`,
          detail: 'Dorëzim 100 ALL',
          amount: 100,
          createdAt: s.createdAt,
        })),
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Only display the UNPAID packages in the active liabilities list
      let runningPaid = totalPaid;
      const activeOfficePkgs: any[] = [];
      allOfficeItems.forEach(item => {
        if (runningPaid >= item.amount) {
          runningPaid -= item.amount;
        } else {
          const remainingAmount = item.amount - runningPaid;
          runningPaid = 0;
          activeOfficePkgs.push({
            ...item,
            amount: remainingAmount,
            status: 'UNPAID',
          });
        }
      });

      acc[o.id] = {
        key: `office-${o.id}`,
        type: 'OFFICE' as const,
        officeId: o.id,
        name: o.name,
        subLabel: `Zyra (${o.city})`,
        totalAmount: totalCom,
        pendingAmount: pending,
        packages: activeOfficePkgs,
      };
    }
    return acc;
  }, {} as Record<string, any>), [offices, deliveredShipments, ledgers, payoutBatches]);

  // C. Admin: only display the UNTRANSFERRED packages in the active liabilities list
  const adminAllPkgs = useMemo(() => deliveredShipments.map(s => {
    const o = offices.find(o => isOfficeMatch(o, s.originOfficeId, s.originOfficeName));
    const intakeRate = (o?.intakePercentage || 20) / 100;
    const profit = Math.max(0, (s.shippingFee || 300) - Math.round((s.shippingFee || 300) * intakeRate) - 100);
    return {
      id: s.id,
      trackingNumber: s.trackingNumber,
      recipient: `${s.recipientName} (${s.destinationCity})`,
      detail: `Tarifë ${formatALL(s.shippingFee || 300)}`,
      amount: profit,
      status: 'AVAILABLE',
      createdAt: s.createdAt
    };
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [deliveredShipments, offices]);

  const adminNetProfit = adminAllPkgs.reduce((s, p) => s + p.amount, 0);
  const adminPendingProfit = Math.max(0, adminNetProfit - totalAdminTransferred);

  const adminActivePkgs = useMemo(() => {
    let runningTransferred = totalAdminTransferred;
    const active: any[] = [];
    adminAllPkgs.forEach(p => {
      if (runningTransferred >= p.amount) {
        runningTransferred -= p.amount;
      } else {
        const remaining = p.amount - runningTransferred;
        runningTransferred = 0;
        active.push({ ...p, amount: remaining, status: 'AVAILABLE' });
      }
    });
    return active;
  }, [adminAllPkgs, totalAdminTransferred]);

  const adminBeneficiary = {
    key: 'admin-beneficiary',
    type: 'ADMIN' as const,
    name: 'Administratori Qendror',
    subLabel: 'Administrata Postare',
    totalAmount: adminNetProfit,
    pendingAmount: adminPendingProfit,
    packages: adminActivePkgs,
  };

  const masterList = [adminBeneficiary, ...Object.values(officeMap), ...Object.values(sellerMap)];
  const pendingList = masterList.filter((item: any) => item.pendingAmount > 0).filter((item: any) => {
    const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || item.type === categoryFilter;
    return matchSearch && matchCat;
  });

  // ─── BAR CHART DATA ───────────────────────────────────────────────────────
  const barData = useMemo(() => {
    return masterList
      .filter((item: any) => item.pendingAmount > 0)
      .sort((a: any, b: any) => b.pendingAmount - a.pendingAmount)
      .slice(0, 10)
      .map((item: any) => ({
        name: item.name.length > 16 ? item.name.slice(0, 14) + '…' : item.name,
        full: item.name,
        shuma: Math.round(item.pendingAmount),
        type: item.type,
      }));
  }, [masterList]);

  const barColor = (type: string) => type === 'ADMIN' ? '#6366f1' : type === 'OFFICE' ? '#f59e0b' : '#a78bfa';

  // ─── HISTORY ─────────────────────────────────────────────────────────────
  const seenKeys = new Set<string>();
  const historyLedgers = ledgers
    .filter(l => ['OFFICE_COMMISSION_PAYOUT', 'ADMIN_PROFIT_TRANSFER', 'SELLER_SETTLEMENT', 'SELLER_REVERSE_PAYOUT'].includes(l.type))
    .filter(l => {
      const k = `${l.type}-${l.officeName || l.sellerName}-${l.amount}-${(l.createdAt || '').slice(0, 16)}`;
      if (seenKeys.has(k)) return false;
      seenKeys.add(k); return true;
    })
    .filter(l => !historySearch || (l.officeName || l.sellerName || '').toLowerCase().includes(historySearch.toLowerCase()) || (l.description || '').toLowerCase().includes(historySearch.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const historyPages = Math.max(1, Math.ceil(historyLedgers.length / PAGE_SIZE));
  const historyPaginated = historyLedgers.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  // ─── By Office Tab ────────────────────────────────────────────────────────
  const officeStats = useMemo(() => Object.values(officeMap).sort((a: any, b: any) => b.totalAmount - a.totalAmount), [officeMap]);

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExportPending = () => {
    const headers = ['Beneficiari', 'Kategoria', 'Shuma Totale', 'Shuma e Mbetur', 'Paketa'];
    const rows = pendingList.map((item: any) => [
      `"${item.name}"`, item.type, item.totalAmount, item.pendingAmount, item.packages.filter((p: any) => p.status === 'UNPAID' || p.status === 'AVAILABLE').length
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const a = document.createElement('a'); a.href = encodeURI(csv); a.download = `detyrimet_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ─── Actions ─────────────────────────────────────────────────────────────
  const handleTransferAdmin = async () => {
    if (adminPendingProfit <= 0) return;
    setIsAdminTransferring(true);
    try {
      const res = await fetch('/api/ledgers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officeId: offices[0]?.id, officeName: 'Administrata Qendrore', type: 'ADMIN_PROFIT_TRANSFER', amount: adminPendingProfit, description: `Transferim fitimi neto ${adminPendingProfit} ALL te Administrata` }) });
      const d = await res.json();
      if (res.ok && d.success) { showSuccess(`Fitimi ${formatALL(adminPendingProfit)} u transferua!`); await syncFromDB(); }
      else showError(d.error || 'Gabim gjatë transferimit.');
    } catch { showError('Gabim i papritur.'); }
    finally { setIsAdminTransferring(false); setConfirmAdminTransfer(false); }
  };

  const handlePayOffice = async () => {
    if (!confirmOfficeId || confirmOfficeAmount <= 0) return;
    setIsPayingOffice(true);
    try {
      const res = await fetch('/api/ledgers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officeId: confirmOfficeId, officeName: confirmOfficeName, type: 'OFFICE_COMMISSION_PAYOUT', amount: confirmOfficeAmount, description: `Shlyerja e komisionit të zyrës ${confirmOfficeName}` }) });
      const d = await res.json();
      if (res.ok && d.success) { showSuccess(`Komisioni ${formatALL(confirmOfficeAmount)} u shlye!`); await syncFromDB(); }
      else showError(d.error || 'Gabim gjatë shlyerjes.');
    } catch { showError('Gabim i papritur.'); }
    finally { setIsPayingOffice(false); setConfirmOfficeId(null); }
  };

  const handleDispatchSeller = async () => {
    if (!selectedSellerItem || !selectedCourierId) { showError('Zgjidhni kurierin.'); return; }
    setIsDispatchingSeller(true);
    try {
      const courier = users.find(u => u.id === selectedCourierId);
      const unpaid = selectedSellerItem.packages.filter((p: any) => p.status === 'UNPAID' || p.status === 'AVAILABLE');
      const sample = shipments.find(s => unpaid.some((u: any) => u.trackingNumber === s.trackingNumber));
      const targetOfficeId = sample?.originOfficeId || offices[0]?.id || '';
      const items = unpaid.map((p: any) => ({ sellerId: selectedSellerItem.key.replace('seller-', ''), sellerName: selectedSellerItem.name, shipmentId: p.id, trackingNumber: p.trackingNumber, amount: p.amount, status: 'APPROVED' as const }));
      await createPayoutDispatchBatch(targetOfficeId, courier?.id || selectedCourierId, courier?.name || 'Kurier', items, 0, 0);
      showSuccess(`Zarfi i likuidimit të ${selectedSellerItem.name} u dërgua!`);
      setSelectedSellerItem(null); await syncFromDB();
    } catch { showError('Gabim gjatë dërgimit.'); }
    finally { setIsDispatchingSeller(false); }
  };

  const toggleExpand = (key: string) => setExpandedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'pending', label: 'Detyrimet Aktive', count: pendingList.length },
    { id: 'history', label: 'Historiku', count: historyLedgers.length },
    { id: 'by_office', label: 'Analiza sipas Zyrës' },
  ];

  return (
    <main className="w-full space-y-6 pb-8">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-3xl p-5 md:p-7 shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">Financa · Detyrimet</span>
            <h1 className="text-2xl font-black text-white mt-1.5">Detyrimet & Beneficiarët</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Administrata · Zyrat Rajonale · Shitësit</p>
          </div>
          {/* Quick Action Bar */}
          <div className="flex flex-wrap gap-2">
            {adminPendingProfit > 0 && (
              <button onClick={() => setConfirmAdminTransfer(true)}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs flex items-center gap-2 shadow-md transition active:scale-95">
                <Send className="w-3.5 h-3.5" />
                Transfero Fitimin ({formatALL(adminPendingProfit)})
              </button>
            )}
            <button onClick={handleExportPending}
              className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition active:scale-95">
              <Download className="w-3.5 h-3.5" /> Eksporto
            </button>
          </div>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-indigo-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-indigo-700 mb-2">Fitim Admin i Mbetur</p>
          <p className="text-2xl font-black text-indigo-950">{formatALL(adminPendingProfit)}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">nga {formatALL(adminNetProfit)} gjithsej</p>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-amber-800 mb-2">Komisione Zyrave</p>
          <p className="text-2xl font-black text-amber-900">{formatALL(Object.values(officeMap).reduce((s: number, o: any) => s + o.pendingAmount, 0))}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">{Object.values(officeMap).filter((o: any) => o.pendingAmount > 0).length} zyra me balancë</p>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-sm">
          <p className="text-[10px] font-black uppercase text-purple-800 mb-2">Detyrime Shitësve</p>
          <p className="text-2xl font-black text-purple-950">{formatALL(Object.values(sellerMap).reduce((s: number, sl: any) => s + sl.pendingAmount, 0))}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">{Object.values(sellerMap).filter((sl: any) => sl.pendingAmount > 0).length} shitës me balancë</p>
        </div>
      </div>

      {/* Bar Chart */}
      {barData.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-950 text-sm">Detyrimet sipas Beneficiarit</h2>
              <p className="text-[10px] text-slate-500 font-semibold">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Admin</span>
                {' · '}
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Zyra</span>
                {' · '}
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Shitës</span>
              </p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickLine={false} axisLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#374151' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                  formatter={(v: any, _: any, p: any) => [`${Number(v).toLocaleString('sq-AL')} L`, p.payload.full]} />
                <Bar dataKey="shuma" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 10, fontWeight: 700, fill: '#374151', formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k L` : `${v} L` }}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.type)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3.5 text-xs font-black whitespace-nowrap flex items-center gap-2 border-b-2 transition ${activeTab === t.id ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              {t.label}
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">

          {/* ── Tab: Pending ── */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-52">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Kërko beneficiar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-400" />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none">
                  <option value="ALL">Të gjitha</option>
                  <option value="ADMIN">Administratori</option>
                  <option value="OFFICE">Zyrat</option>
                  <option value="SELLER">Shitësit</option>
                </select>
              </div>

              {pendingList.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-black text-emerald-800 text-sm">Të gjitha detyrimet janë shlyer!</h3>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Nuk ka asnjë beneficiar me balancë aktive.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="py-3 px-4 w-8" />
                        <th className="py-3 px-4">Beneficiari</th>
                        <th className="py-3 px-4 text-center">Paketa</th>
                        <th className="py-3 px-4 text-center">Aging</th>
                        <th className="py-3 px-4 text-right text-amber-700">Shuma e Mbetur</th>
                        <th className="py-3 px-4 text-center">Veprimi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingList.map((item: any) => {
                        const isExp = expandedKeys.includes(item.key);
                        const unpaid = item.packages.filter((p: any) => p.status === 'UNPAID' || p.status === 'AVAILABLE');
                        const oldestDays = item.oldestPending ? getDaysAgo(item.oldestPending) : 0;
                        return (
                          <React.Fragment key={item.key}>
                            <tr onClick={() => toggleExpand(item.key)} className="hover:bg-amber-50/20 transition cursor-pointer">
                              <td className="py-3 px-4">
                                <button className="text-slate-400 hover:text-slate-700">
                                  {isExp ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${item.type === 'ADMIN' ? 'bg-slate-950 text-[#f6d55c]' : item.type === 'OFFICE' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-purple-100 text-purple-900 border border-purple-300'}`}>
                                    {item.type === 'ADMIN' ? <Award className="w-4 h-4" /> : item.type === 'OFFICE' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-950">{item.name}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold">{item.subLabel}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center font-black text-amber-800">{unpaid.length}</td>
                              <td className="py-3 px-4 text-center">
                                {item.type === 'SELLER' && item.oldestPending ? <AgingBadge daysAgo={oldestDays} /> : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="py-3 px-4 text-right font-black text-amber-700 text-sm">{formatALL(item.pendingAmount)}</td>
                              <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                                {item.type === 'ADMIN' && (
                                  <button onClick={() => setConfirmAdminTransfer(true)}
                                    className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-[#f6d55c] font-black rounded-xl text-[10px] flex items-center gap-1 mx-auto">
                                    <Send className="w-3 h-3" /> Transfero
                                  </button>
                                )}
                                {item.type === 'OFFICE' && (
                                  <button onClick={() => { setConfirmOfficeId(item.officeId); setConfirmOfficeName(item.name); setConfirmOfficeAmount(item.pendingAmount); }}
                                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] flex items-center gap-1 mx-auto">
                                    <CheckCircle2 className="w-3 h-3" /> Shlye
                                  </button>
                                )}
                                {item.type === 'SELLER' && (
                                  <button onClick={() => { setSelectedSellerItem(item); setSelectedCourierId(availableCouriers[0]?.id || ''); }}
                                    className="py-1.5 px-3 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] flex items-center gap-1 mx-auto border border-amber-300">
                                    <Send className="w-3 h-3" /> Dërgo te Zyra
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isExp && unpaid.length > 0 && (
                              <tr className="bg-amber-50/20">
                                <td colSpan={6} className="p-4">
                                  <div className="bg-white border border-amber-200 rounded-2xl p-3 space-y-2">
                                    <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                                      <Package className="w-4 h-4 text-amber-600" /> Pakot e Pashlyera ({unpaid.length}):
                                    </h4>
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                      <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                          <tr className="bg-slate-100 text-slate-600 uppercase text-[9px] border-b border-slate-200">
                                            <th className="py-2 px-3">Tracking</th>
                                            <th className="py-2 px-3">Marrësi</th>
                                            <th className="py-2 px-3">Detaje</th>
                                            <th className="py-2 px-3 text-right">Shumë</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {unpaid.map((pkg: any) => (
                                            <tr key={pkg.id} className="hover:bg-slate-50">
                                              <td className="py-2 px-3 font-mono font-black text-slate-950">{pkg.trackingNumber}</td>
                                              <td className="py-2 px-3 font-semibold text-slate-700">{pkg.recipient}</td>
                                              <td className="py-2 px-3 text-slate-500">{pkg.detail}</td>
                                              <td className="py-2 px-3 text-right font-black text-amber-700">{formatALL(pkg.amount)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: History ── */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Kërko me zyrë, tracking..." value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-400" />
                </div>
              </div>
              {historyLedgers.length === 0 ? (
                <p className="text-center text-slate-400 text-xs font-semibold py-8">Nuk ka ende asnjë transaksion të kryer.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs font-bold border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-3 px-4">Data/Ora</th>
                          <th className="py-3 px-4">Beneficiari</th>
                          <th className="py-3 px-4">Lloji</th>
                          <th className="py-3 px-4">Përshkrimi</th>
                          <th className="py-3 px-4 text-right text-emerald-700">Shumë</th>
                          <th className="py-3 px-4 text-center">Statusi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyPaginated.map(l => (
                          <tr key={l.id} className="hover:bg-emerald-50/20 transition">
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{formatDate(l.createdAt)}</td>
                            <td className="py-3 px-4 font-black text-slate-950 flex items-center gap-2">
                              {l.type === 'ADMIN_PROFIT_TRANSFER' ? <Award className="w-4 h-4 text-indigo-600" /> : <Building2 className="w-4 h-4 text-amber-600" />}
                              {l.officeName || l.sellerName || 'Administrata'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">{l.type.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-semibold max-w-xs truncate">{l.description}</td>
                            <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">{formatALL(l.amount)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> SHLYER
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {historyPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] font-semibold text-slate-500">{(historyPage - 1) * PAGE_SIZE + 1}–{Math.min(historyPage * PAGE_SIZE, historyLedgers.length)} nga {historyLedgers.length}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-xs font-black px-3">{historyPage}/{historyPages}</span>
                        <button onClick={() => setHistoryPage(p => Math.min(historyPages, p + 1))} disabled={historyPage === historyPages} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronRightIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab: By Office ── */}
          {activeTab === 'by_office' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Zyra</th>
                    <th className="py-3 px-4 text-right">Komisioni Total</th>
                    <th className="py-3 px-4 text-right">Komisioni i Mbetur</th>
                    <th className="py-3 px-4 text-center">% e Shlyer</th>
                    <th className="py-3 px-4 text-center">Statusi</th>
                    <th className="py-3 px-4 text-center">Veprimi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {officeStats.map((o: any, idx) => {
                    const pctPaid = o.totalAmount > 0 ? ((o.totalAmount - o.pendingAmount) / o.totalAmount) * 100 : 100;
                    return (
                      <tr key={o.key} className="hover:bg-amber-50/20 transition">
                        <td className="py-3 px-4 text-slate-400 font-mono">#{idx + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-black text-slate-950">{o.name}</p>
                          <p className="text-[10px] text-slate-400">{o.subLabel}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-950">{formatALL(o.totalAmount)}</td>
                        <td className="py-3 px-4 text-right">
                          {o.pendingAmount > 0
                            ? <span className="font-black text-amber-700">{formatALL(o.pendingAmount)}</span>
                            : <span className="font-black text-emerald-600">✓ 0 L</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-center text-[10px] font-black text-slate-700">{pctPaid.toFixed(0)}%</div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pctPaid >= 100 ? 'bg-emerald-500' : pctPaid >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pctPaid}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {o.pendingAmount > 0
                            ? <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">NË PRITJE</span>
                            : <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">✓ SHLYER</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {o.pendingAmount > 0 && (
                            <button onClick={() => { setConfirmOfficeId(o.officeId); setConfirmOfficeName(o.name); setConfirmOfficeAmount(o.pendingAmount); }}
                              className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-xl text-[10px] border border-amber-300 transition">
                              Shlye {formatALL(o.pendingAmount)}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal isOpen={confirmAdminTransfer} onClose={() => setConfirmAdminTransfer(false)} onConfirm={handleTransferAdmin}
        title="Transfero Fitimin te Administratori" variant="info" confirmLabel="Po, Transfero" isLoading={isAdminTransferring}
        description={<span>Po transferoni <span className="font-black text-slate-950">{formatALL(adminPendingProfit)}</span> te Administrata Qendrore.</span>} />

      <ConfirmModal isOpen={!!confirmOfficeId} onClose={() => setConfirmOfficeId(null)} onConfirm={handlePayOffice}
        title={`Shlye Komisionin e Zyrës "${confirmOfficeName}"`} variant="warning" confirmLabel="Po, Shlye" isLoading={isPayingOffice}
        description={<span>Po shlyeni <span className="font-black text-slate-950">{formatALL(confirmOfficeAmount)}</span> për Zyrën <span className="font-black">"{confirmOfficeName}"</span>.</span>} />

      {selectedSellerItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-amber-300 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-slate-950" />
              </div>
              <h3 className="font-black text-base text-slate-950">Aprovo & Dërgo Zarfin te Zyra</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Shitësi: <span className="font-black text-slate-950">{selectedSellerItem.name}</span> — <span className="text-emerald-700 font-black">{formatALL(selectedSellerItem.pendingAmount)}</span>
              </p>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">Kurieri i Caktuar</label>
              <select value={selectedCourierId} onChange={e => setSelectedCourierId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-950 focus:outline-none focus:border-amber-400">
                <option value="">-- Zgjidh Kurierin --</option>
                {availableCouriers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedSellerItem(null)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs">Anullo</button>
              <button onClick={handleDispatchSeller} disabled={!selectedCourierId || isDispatchingSeller}
                className="flex-1 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-[#f6d55c] font-black text-xs shadow-md flex items-center justify-center gap-1.5">
                <Send className="w-4 h-4" /> Dërgo Zarfin
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
