'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { isOfficeMatch, calculatePackageFinancials } from '@/lib/finance-utils';
import {
  TrendingUp,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  Truck,
  Receipt,
  Search,
  Package,
  Award,
  Wallet,
  ArrowDownLeft,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OfficeRevenuePage() {
  const { t, formatALL } = useI18n();
  const { shipments, offices, ledgers, payoutBatches, currentUser } = useAuthenticatedState();

  const [activeTab, setActiveTab] = useState<'EARNED' | 'RECEIVED'>('EARNED');
  const [searchTerm, setSearchTerm] = useState('');

  const currentOffice = offices.find(
    o => o.id === currentUser?.officeId ||
      (currentUser?.officeName && o.name.toLowerCase().includes(currentUser.officeName.toLowerCase())) ||
      (currentUser?.officeName && currentUser.officeName.toLowerCase().includes(o.city.toLowerCase()))
  ) || offices[0];

  // 1. Packages processed by this office (Origin Intake OR Destination Delivery)
  const originPackages = shipments.filter(s =>
    isOfficeMatch(currentOffice, s.originOfficeId, s.originOfficeName) &&
    (s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED')
  );

  const destPackages = shipments.filter(s =>
    isOfficeMatch(currentOffice, s.destinationOfficeId, s.destinationOfficeName) &&
    (s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED')
  );

  // Calculate detailed office commission items
  const originRevenueItems = originPackages.map(s => {
    const financials = calculatePackageFinancials(s.shippingFee || 300, currentOffice.intakePercentage || 20);
    return {
      id: `${s.id}-origin`,
      trackingNumber: s.trackingNumber,
      createdAt: s.createdAt,
      type: 'PRANIM_ORIGJINE' as const,
      description: `Pranim Pakoje në Zyrën e Origjinës (${currentOffice.intakePercentage || 20}% Intake)`,
      grossTariff: s.shippingFee || 300,
      officeCommission: financials.originCommission,
      recipient: `${s.recipientName} (${s.destinationCity})`
    };
  });

  const destRevenueItems = destPackages.map(s => ({
    id: `${s.id}-dest`,
    trackingNumber: s.trackingNumber,
    createdAt: s.createdAt,
    type: 'DORËZIM_DESTINACIONI' as const,
    description: 'Dorëzim Pakoje / Pranim në Sportel te Zyra e Destinacionit (100 ALL)',
    grossTariff: s.shippingFee || 300,
    officeCommission: 100,
    recipient: `${s.recipientName} (${s.destinationCity})`
  }));

  const allEarnedItems = [...originRevenueItems, ...destRevenueItems];
  const totalEarnedCommission = allEarnedItems.reduce((sum, item) => sum + item.officeCommission, 0);

  // 2. Payments Received from Central Finance
  // A. Direct Commission Payout Ledgers
  const officeLedgers = ledgers.filter(l =>
    isOfficeMatch(currentOffice, l.officeId, l.officeName) ||
    (l.description && l.description.toLowerCase().includes(currentOffice.name.toLowerCase()))
  );

  const commissionPayoutLedgers = officeLedgers.filter(l => l.type === 'OFFICE_COMMISSION_PAYOUT');
  const paidOfficeCommissions = commissionPayoutLedgers.reduce((sum, l) => sum + l.amount, 0);
  const pendingOfficeCommissions = Math.max(0, totalEarnedCommission - paidOfficeCommissions);

  // B. Physical Cash Envelopes Received for Seller Payouts
  const receivedPayoutBatches = payoutBatches.filter(
    b => isOfficeMatch(currentOffice, b.officeId, b.officeName) &&
      (b.status === 'RECEIVED_BY_OFFICE' || b.status === 'COMPLETED')
  );

  const totalReceivedEnvelopesCash = receivedPayoutBatches.reduce(
    (sum, b) => sum + b.totalAmount, 0
  );

  // Combined list of payments & envelopes received from Central Finance
  const receivedFinanceItems = [
    ...commissionPayoutLedgers.map(l => ({
      id: l.id,
      date: l.createdAt,
      category: 'KOMISION_ZYRE' as const,
      title: 'Shlyerje Komisioni nga Financa Qendrore',
      description: l.description || 'Kalimi i komisionit të zyrës në llogari',
      amount: l.amount,
      method: 'Transfertë Llogarie / Cash',
      status: '✓ PRANUAR ME SUKSES'
    })),
    ...receivedPayoutBatches.map(b => ({
      id: b.id,
      date: b.createdAt,
      category: 'ZARF_LIKUIDIMI' as const,
      title: `Zarf Parash për Likuidim Shitësish (${b.sellerPayouts?.length || 0} pako)`,
      description: `Zarf fizikisht i transportuar nga kurieri ${b.courierName}`,
      amount: b.totalAmount,
      method: `Kurieri ${b.courierName}`,
      status: '✓ PRANUAR NGA ZYRA (NË KASAFORTË)'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtered Earned Items
  const filteredEarned = allEarnedItems.filter(item =>
    !searchTerm ||
    item.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered Received Items
  const filteredReceived = receivedFinanceItems.filter(item =>
    !searchTerm ||
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">
            {t.nav.office} &bull; Financat & Të Ardhurat
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5">
            Të Ardhurat & Pagesat e Pranuara ({currentOffice?.name})
          </h1>
          <p className="text-xs font-bold text-slate-400">
            Gjurmimi i komisioneve të fituara nga zyra dhe të gjitha pagesave të pranuara nga Financa Qendrore
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#f6d55c] text-slate-950 flex items-center justify-center font-black shadow-md border border-amber-300 flex-shrink-0">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        
        {/* Total Earned Commission Revenue */}
        <div className="bg-white border border-indigo-200 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-700 uppercase">Të Ardhurat Fituara Totale</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-indigo-950 mt-1.5">{formatALL(totalEarnedCommission)}</h2>
          <p className="text-[10px] text-slate-500 font-semibold">Komisionet nga pranimet ({currentOffice.intakePercentage || 20}%) & dorëzimet</p>
        </div>

        {/* Paid Commission by Finance */}
        <div className="bg-white border border-emerald-300 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase">Shlyer nga Financa</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-700 mt-1.5">{formatALL(paidOfficeCommissions)}</h2>
          <p className="text-[10px] text-slate-500 font-semibold">Komisione të kaluara me sukses nga Financa Qendrore</p>
        </div>

        {/* Pending Unpaid Commission */}
        <div className="bg-white border border-amber-300 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase">Komisione në Pritje</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-amber-900 mt-1.5">{formatALL(pendingOfficeCommissions)}</h2>
          <p className="text-[10px] text-slate-500 font-semibold">Balancë e mbetur për t'u shlyer nga Financa</p>
        </div>

        {/* Received Cash Envelopes */}
        <div className="bg-white border border-purple-200 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-purple-800 uppercase">Zarfe me Pará të Pranuara</span>
            <Wallet className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-2xl font-black text-purple-950 mt-1.5">{formatALL(totalReceivedEnvelopesCash)}</h2>
          <p className="text-[10px] text-slate-500 font-semibold">Pará cash me kurier nga Financa për likuidime</p>
        </div>

      </div>

      {/* Main Content Card with Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-5 w-full">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('EARNED')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'EARNED'
                  ? 'bg-slate-950 text-[#f6d55c] shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>1. Të Ardhurat e Fituara sipas Pakove ({allEarnedItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('RECEIVED')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'RECEIVED'
                  ? 'bg-slate-950 text-[#f6d55c] shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>2. Pagesat e Pranuara nga Financa ({receivedFinanceItems.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kërko me tracking, kurier, përshkrim..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* TAB 1: EARNED COMMISSIONS PER PACKAGE */}
        {activeTab === 'EARNED' && (
          <div className="space-y-3">
            {filteredEarned.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold">
                Nuk u gjet asnjë komision i fituar sipas kërkimit tuaj.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Tracking Number</th>
                      <th className="py-3.5 px-4">Data / Ora</th>
                      <th className="py-3.5 px-4">Marrësi & Qyteti</th>
                      <th className="py-3.5 px-4">Roli i Zyrës & Shërbimi</th>
                      <th className="py-3.5 px-4 text-right">Tarifa Bruto</th>
                      <th className="py-3.5 px-4 text-right text-indigo-900">Komisioni i Zyrës (ALL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEarned.map(item => (
                      <tr key={item.id} className="hover:bg-indigo-50/30 transition">
                        <td className="py-3.5 px-4 font-mono font-black text-slate-950">{item.trackingNumber}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{formatDate(item.createdAt)}</td>
                        <td className="py-3.5 px-4 text-slate-800">{item.recipient}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase border ${
                            item.type === 'PRANIM_ORIGJINE'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                          }`}>
                            {item.description}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600">{formatALL(item.grossTariff)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-indigo-700 text-sm">
                          +{formatALL(item.officeCommission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENTS & ENVELOPES RECEIVED FROM CENTRAL FINANCE */}
        {activeTab === 'RECEIVED' && (
          <div className="space-y-3">
            {filteredReceived.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold">
                Nuk ka ende asnjë pagesë ose zarf parash të marrë nga financa qendrore.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-bold border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Data / Ora</th>
                      <th className="py-3.5 px-4">Titulli i Transaksionit</th>
                      <th className="py-3.5 px-4">Metoda / Kurieri</th>
                      <th className="py-3.5 px-4">Përshkrimi</th>
                      <th className="py-3.5 px-4 text-right text-emerald-900">Shuma e Pranuar (ALL)</th>
                      <th className="py-3.5 px-4 text-center">Statusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceived.map(item => (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3.5 px-4 font-black text-slate-950 flex items-center gap-2">
                          {item.category === 'KOMISION_ZYRE' ? (
                            <Award className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          ) : (
                            <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                          <span>{item.title}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">{item.method}</td>
                        <td className="py-3.5 px-4 text-slate-600">{item.description}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                          {formatALL(item.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

    </main>
  );
}
