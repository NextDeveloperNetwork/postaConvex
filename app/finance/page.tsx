'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/toast-notification';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import {
  DollarSign, TrendingUp, Award, Building2, Wallet, ArrowRight, RefreshCw,
  History, CheckCircle2, ArrowDownLeft, ArrowUpRight, Clock, Check,
  AlertCircle, Package, Send, ChevronRight, BarChart2, PieChart as PieIcon,
  Truck, ShieldCheck, Eye, Activity
} from 'lucide-react';
import { isOfficeMatch, calculatePackageFinancials, calculateCentralVaultState, getFinanceRecognizedShipments } from '@/lib/finance-utils';

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('sq-AL', { day: '2-digit', month: '2-digit' });
}

const DONUT_COLORS = ['#6366f1', '#f59e0b', '#a78bfa'];

export default function FinanceOverviewPage() {
  const { shipments, ledgers, offices, handovers, payoutBatches, approveOfficeDailyHandover, syncFromDB } = useAuthenticatedState();
  const { formatALL } = useI18n();
  const { showSuccess, showError } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvingHandoverId, setApprovingHandoverId] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // ─── FINANCIAL CALCULATIONS ───────────────────────────────────────────────
  const vaultState = calculateCentralVaultState(handovers, payoutBatches, ledgers);
  const { centralVaultCash, totalHandoversReceived } = vaultState;

  const deliveredShipments = getFinanceRecognizedShipments(shipments, handovers, offices);

  const totalPostalTariffRevenue = deliveredShipments.reduce((sum, s) => sum + (s.shippingFee || 300), 0);

  let totalOfficeCommissions = 0;
  let adminNetProfit = 0;
  deliveredShipments.forEach(s => {
    const originOffice = offices.find(o => isOfficeMatch(o, s.originOfficeId, s.originOfficeName));
    const financials = calculatePackageFinancials(s.shippingFee || 300, originOffice?.intakePercentage || 20);
    totalOfficeCommissions += (financials.originCommission + financials.destinationCommission);
    adminNetProfit += financials.adminNetProfit;
  });

  const adminPendingProfit = Math.max(0, adminNetProfit - vaultState.totalAdminTransferred);

  // Pending seller payouts from recognized shipments:
  // Only packages that haven't been settled yet and haven't been dispatched in a batch
  const pendingSellerShipments = deliveredShipments.filter(s => {
    const isDispatched = payoutBatches.some(b =>
      b.status !== 'REJECTED' &&
      (b.sellerPayouts || []).some(p => p.shipmentId === s.id || (p.trackingNumber && p.trackingNumber.toUpperCase() === s.trackingNumber.toUpperCase()))
    );
    const isSettled = s.paymentStatus === 'SETTLED' || ledgers.some(l =>
      (l.type === 'SELLER_SETTLEMENT' || l.type === 'SELLER_REVERSE_PAYOUT') &&
      (l.shipmentId === s.id || (l.trackingNumber && l.trackingNumber.toUpperCase() === s.trackingNumber.toUpperCase()))
    );
    return !isDispatched && !isSettled;
  });
  const pendingSellerBalance = pendingSellerShipments.reduce((sum, s) => sum + s.sellerNet, 0);

  // ─── PENDING ACTIONS ─────────────────────────────────────────────────────
  const pendingHandovers = handovers.filter(h =>
    h.status === 'PENDING_COURIER_PICKUP' || h.status === 'TRANSIT_TO_FINANCE' || h.status === 'PENDING_APPROVAL'
  );
  const inTransitBatches = payoutBatches.filter(b => b.status === 'IN_TRANSIT' || b.status === 'PENDING_COURIER_PICKUP');
  const urgentActionsCount = pendingHandovers.length + (adminPendingProfit > 0 ? 1 : 0);

  // ─── WEEKLY BAR CHART DATA ─────────────────────────────────────────────
  const barChartData = useMemo(() => {
    const now = new Date();
    const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : 90;
    const buckets: Record<string, { label: string; tarifa: number; fitim: number; komisione: number }> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = chartPeriod === '7d'
        ? d.toLocaleDateString('sq-AL', { weekday: 'short' })
        : `${d.getDate()}/${d.getMonth() + 1}`;
      buckets[key] = { label, tarifa: 0, fitim: 0, komisione: 0 };
    }

    deliveredShipments.forEach(s => {
      const dateKey = (s.updatedAt || s.createdAt || '').slice(0, 10);
      if (!buckets[dateKey]) return;
      const originOffice = offices.find(o => isOfficeMatch(o, s.originOfficeId, s.originOfficeName));
      const fin = calculatePackageFinancials(s.shippingFee || 300, originOffice?.intakePercentage || 20);
      buckets[dateKey].tarifa += s.shippingFee || 300;
      buckets[dateKey].fitim += fin.adminNetProfit;
      buckets[dateKey].komisione += fin.originCommission + fin.destinationCommission;
    });

    return Object.values(buckets);
  }, [deliveredShipments, offices, chartPeriod]);

  // ─── DONUT CHART DATA ─────────────────────────────────────────────────
  const donutData = [
    { name: 'Fitim Admin', value: Math.round(adminNetProfit) },
    { name: 'Komisione Zyrave', value: Math.round(totalOfficeCommissions) },
    { name: 'Pagesa Shitësve', value: Math.round(pendingSellerBalance) },
  ].filter(d => d.value > 0);

  // ─── REGIONAL OFFICE TABLE DATA ────────────────────────────────────────
  const officeTableData = useMemo(() => {
    return offices.map(o => {
      const origCount = deliveredShipments.filter(s => s.originOfficeId === o.id).length;
      const destCount = deliveredShipments.filter(s => s.destinationOfficeId === o.id).length;
      const originCom = deliveredShipments
        .filter(s => s.originOfficeId === o.id)
        .reduce((sum, s) => sum + Math.round((s.shippingFee || 300) * ((o.intakePercentage || 20) / 100)), 0);
      const destCom = destCount * 100;
      const totalCom = originCom + destCom;
      const paidCom = ledgers
        .filter(l => (l.officeId === o.id || l.officeName === o.name) && l.type === 'OFFICE_COMMISSION_PAYOUT')
        .reduce((sum, l) => sum + l.amount, 0);
      const pendingCom = Math.max(0, totalCom - paidCom);
      return { id: o.id, name: o.name, city: o.city, origCount, destCount, totalPackages: origCount + destCount, totalCom, pendingCom };
    }).filter(o => o.totalPackages > 0).sort((a, b) => b.totalPackages - a.totalPackages);
  }, [offices, deliveredShipments, ledgers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncFromDB();
    setIsRefreshing(false);
    showSuccess('Të dhënat financiare u sinkronizuan!');
  };

  const handleConfirmHandover = async (handoverId: string, officeName: string, amount: number) => {
    setApprovingHandoverId(handoverId);
    try {
      await approveOfficeDailyHandover(handoverId);
      showSuccess(`Dorëzimi prej ${formatALL(amount)} nga "${officeName}" u konfirmua!`);
    } catch {
      showError('Ndodhi një gabim gjatë konfirmimit.');
    } finally {
      setApprovingHandoverId(null);
    }
  };

  return (
    <main className="w-full space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-3xl p-5 md:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">
              Financa Qendrore
            </span>
            {urgentActionsCount > 0 && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-500 text-white animate-pulse">
                {urgentActionsCount} Veprim Urgjent
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Pasqyra Financiare</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Arkë, tarifa, komisione, detyrime — pasqyra e plotë menaxheriale</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/finance/distributions" className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 border border-slate-700">
            <Truck className="w-3.5 h-3.5" />
            <span>Shpërndarjet</span>
          </Link>
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="py-2.5 px-4 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition active:scale-95 flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Rifresko</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase text-emerald-700">Arka Cash (Kasafortë)</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{formatALL(centralVaultCash)}</p>
          <div className="mt-2 text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            Hyrje: {formatALL(totalHandoversReceived)}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-indigo-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase text-indigo-700">Fitim Neto Admin</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-950">{formatALL(adminNetProfit)}</p>
          {adminPendingProfit > 0 ? (
            <div className="mt-2 text-[10px] font-bold text-amber-600 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Në pritje: {formatALL(adminPendingProfit)}
            </div>
          ) : (
            <div className="mt-2 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Transferuar plotësisht
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase text-amber-800">Komisione Zyrave</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900">{formatALL(totalOfficeCommissions)}</p>
          <div className="mt-2 text-[10px] font-semibold text-slate-400">
            Nga {deliveredShipments.length} paketa të dorëzuara
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase text-purple-800">Detyrime Shitësve</p>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-950">{formatALL(pendingSellerBalance)}</p>
          <div className="mt-2 text-[10px] font-semibold text-purple-600">
            COD i mbledhur, pa likuiduar
          </div>
        </div>
      </div>

      {/* ── Urgent Actions Panel ── */}
      {(pendingHandovers.length > 0 || adminPendingProfit > 0 || inTransitBatches.length > 0) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center animate-pulse">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-sm">Veprime Urgjente që Presin</h3>
              <p className="text-[10px] font-semibold text-slate-600">Kliko çdo item për të vepruar direkt</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {/* Pending Handovers */}
            {pendingHandovers.map(h => (
              <div key={h.id} className="bg-white border border-amber-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                      {h.transferCode || `TRF-${h.id.slice(-6).toUpperCase()}`}
                    </span>
                    <p className="font-black text-slate-950 text-sm mt-1.5">{h.officeName}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {h.status === 'TRANSIT_TO_FINANCE'
                        ? <span className="text-emerald-700">✓ Kurieri ka pranuar — në udhëtim</span>
                        : <span className="text-amber-700">⏳ Kurieri nuk ka pranuar ende</span>}
                    </p>
                  </div>
                  <p className="text-base font-black text-amber-700 flex-shrink-0">{formatALL(h.amount)}</p>
                </div>
                <button
                  onClick={() => handleConfirmHandover(h.id, h.officeName, h.amount)}
                  disabled={approvingHandoverId === h.id || h.status !== 'TRANSIT_TO_FINANCE'}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {approvingHandoverId === h.id ? 'Po konfirmohet...' : h.status === 'TRANSIT_TO_FINANCE' ? 'Konfirmo Pranim në Kasafortë' : 'Pret pranim nga kurieri'}
                </button>
              </div>
            ))}

            {/* Admin Profit Transfer */}
            {adminPendingProfit > 0 && (
              <div className="bg-white border border-indigo-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                      FITIM ADMIN
                    </span>
                    <p className="font-black text-slate-950 text-sm mt-1.5">Administratori Qendror</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Fitim neto akumuluar, i transferueshëm</p>
                  </div>
                  <p className="text-base font-black text-indigo-700 flex-shrink-0">{formatALL(adminPendingProfit)}</p>
                </div>
                <Link href="/finance/beneficiaries"
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-[#f6d55c] font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Hap Faqen e Transferimit
                </Link>
              </div>
            )}

            {/* In Transit Batches */}
            {inTransitBatches.length > 0 && (
              <div className="bg-white border border-blue-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                      ZARFE NË TRANZIT
                    </span>
                    <p className="font-black text-slate-950 text-sm mt-1.5">{inTransitBatches.length} zarf aktive</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {formatALL(inTransitBatches.reduce((s, b) => s + b.totalAmount, 0))} në rrugë
                    </p>
                  </div>
                  <Truck className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                </div>
                <Link href="/finance/distributions"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Monitoroni Shpërndarjet
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Bar Chart — Revenue Trend */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-slate-950 text-sm">Trendi i të Ardhurave</h2>
                <p className="text-[10px] text-slate-500 font-semibold">Tarifë Postare · Fitim Admin · Komisione</p>
              </div>
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

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} barSize={chartPeriod === '7d' ? 28 : chartPeriod === '30d' ? 8 : 4}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  tickLine={false} axisLine={false} interval={chartPeriod === '30d' ? 4 : 0} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  tickLine={false} axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                  formatter={(val: any, name: string) => [`${Number(val).toLocaleString('sq-AL')} L`, name === 'tarifa' ? 'Tarifa' : name === 'fitim' ? 'Fitim Admin' : 'Komisione']}
                />
                <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 8 }}
                  formatter={(v) => v === 'tarifa' ? 'Tarifa Postare' : v === 'fitim' ? 'Fitim Admin' : 'Komisione'} />
                <Bar dataKey="tarifa" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fitim" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="komisione" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart — Profit Split */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-950 text-sm">Ndarja e Fitimit</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Admin · Zyrat · Shitësit</p>
            </div>
          </div>

          {donutData.length > 0 ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={72}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {donutData.map((_, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11, fontWeight: 700 }}
                      formatter={(val: any, _: any, props: any) => [`${Number(val).toLocaleString('sq-AL')} L`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-black text-slate-950">{formatALL(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-slate-400">
              <PieIcon className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs font-semibold">Nuk ka të dhëna akoma</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Cash Flow Reconciliation ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-sm">Rakordimi i Kasafortës</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Hyrjet vs. Daljet</p>
            </div>
            <span className="ml-auto text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {formatALL(centralVaultCash)}
            </span>
          </div>
          <div className="space-y-2 text-xs font-bold">
            {[
              { icon: <ArrowDownLeft className="w-4 h-4 text-emerald-600" />, label: 'Hyrje nga Zyrat (Handovers)', value: formatALL(totalHandoversReceived), color: 'text-emerald-700' },
              { icon: <Building2 className="w-4 h-4 text-amber-600" />, label: 'Komisione të Paguara', value: `-${formatALL(vaultState.totalOfficeCommissionsPaid)}`, color: 'text-amber-700' },
              { icon: <Award className="w-4 h-4 text-indigo-600" />, label: 'Fitim Admin i Transferuar', value: `-${formatALL(vaultState.totalAdminTransferred)}`, color: 'text-indigo-700' },
              { icon: <Truck className="w-4 h-4 text-blue-600" />, label: 'Zarfe të Dërguara me Kurier', value: `-${formatALL(vaultState.totalBatchesDispatched)}`, color: 'text-blue-700' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                <span className="text-slate-600 flex items-center gap-2">{row.icon}{row.label}</span>
                <span className={`font-black ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tariff Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-sm">Shpërndarja e Tarifave</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">300 ALL / pako</p>
            </div>
            <span className="ml-auto text-sm font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {formatALL(totalPostalTariffRevenue)}
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Komisione Zyrave Rajonale', value: totalOfficeCommissions, total: totalPostalTariffRevenue, color: '#f59e0b', bg: 'bg-amber-500' },
              { label: 'Fitim Neto Administratori', value: adminNetProfit, total: totalPostalTariffRevenue, color: '#6366f1', bg: 'bg-indigo-500' },
            ].map((item, i) => {
              const pct = totalPostalTariffRevenue > 0 ? (item.value / totalPostalTariffRevenue) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-black text-slate-950">{formatALL(item.value)} <span className="text-slate-400 font-semibold">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.bg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {adminPendingProfit > 0 && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-bold">
                <span className="text-amber-900">Fitim i Mbetur (i Transferueshëm):</span>
                <span className="font-black text-amber-700">{formatALL(adminPendingProfit)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Regional Office Performance Table ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-950 text-sm">Performanca e Zyrave Rajonale</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Renditje sipas volumit — {officeTableData.length} zyra aktive</p>
            </div>
          </div>
          <Link href="/finance/beneficiaries" className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition">
            Menaxho Detyrimet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {officeTableData.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-semibold">Nuk ka zyra me aktivitet akoma.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Zyra</th>
                  <th className="py-3 px-4 text-center">Paketa Origjinë</th>
                  <th className="py-3 px-4 text-center">Paketa Destinacion</th>
                  <th className="py-3 px-4 text-right">Komisioni Total</th>
                  <th className="py-3 px-4 text-right">Komisioni i Mbetur</th>
                  <th className="py-3 px-4 text-center">Statusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officeTableData.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-black text-slate-950">{o.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{o.city}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-800">{o.origCount}</td>
                    <td className="py-3 px-4 text-center font-black text-slate-800">{o.destCount}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-950">{formatALL(o.totalCom)}</td>
                    <td className="py-3 px-4 text-right">
                      {o.pendingCom > 0
                        ? <span className="font-black text-amber-700">{formatALL(o.pendingCom)}</span>
                        : <span className="font-black text-emerald-600">✓ Shlyer</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-center">
                      {o.pendingCom > 0
                        ? <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">NË PRITJE</span>
                        : <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">SHLYER</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Module Quick Links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/finance/beneficiaries', label: 'Detyrimet & Beneficiarët', desc: 'Lista e detyrimeve aktive, transferimi i fitimit dhe shlyerjet', icon: TrendingUp, color: 'indigo', badge: undefined as string | undefined },
          { href: '/finance/transactions', label: 'Historiku i Transaksioneve', desc: 'Regjistri i të gjitha lëvizjeve cash me balancë progresive', icon: History, color: 'emerald', badge: undefined as string | undefined },
          { href: '/finance/distributions', label: 'Arkiva e Shpërndarjeve', desc: 'Zarfet e dërguara me kurier dhe vouchers zyrtare', icon: ShieldCheck, color: 'blue', badge: inTransitBatches.length > 0 ? `${inTransitBatches.length} aktive` : undefined },
        ].map(m => (
          <Link key={m.href} href={m.href}
            className={`group bg-white border border-slate-200 hover:border-${m.color}-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-2xl bg-${m.color}-100 text-${m.color}-700 flex items-center justify-center`}>
                  <m.icon className="w-5 h-5" />
                </div>
                {m.badge && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">{m.badge}</span>
                )}
              </div>
              <div>
                <h3 className={`font-black text-slate-950 text-sm group-hover:text-${m.color}-700 transition flex items-center gap-1`}>
                  {m.label}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">{m.desc}</p>
              </div>
            </div>
            <div className={`border-t border-slate-100 pt-3 text-xs font-black text-${m.color}-600 flex items-center gap-1`}>
              Hap Modulin <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

    </main>
  );
}
