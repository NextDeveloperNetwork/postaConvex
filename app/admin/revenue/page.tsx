'use client';

import React from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { isOfficeMatch, calculateOfficeCashBalance, calculatePackageFinancials } from '@/lib/finance-utils';
import {
  TrendingUp,
  DollarSign,
  Building2,
  PieChart,
  ShieldCheck,
  Award,
  Wallet,
  Users,
  Receipt
} from 'lucide-react';

export default function AdminRevenuePage() {
  const { t, formatALL } = useI18n();
  const { shipments, offices, ledgers, handovers, payoutBatches } = useAuthenticatedState();

  // Total system metrics
  const totalGrossCOD = shipments
    .filter(s => s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED')
    .reduce((sum, s) => sum + s.codAmount, 0);

  // Delivered packages generating postal tariff
  const deliveredPackages = shipments.filter(
    s => s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED'
  );

  const totalTariffsCollected = deliveredPackages.reduce((sum, s) => sum + (s.shippingFee || 300), 0);

  // System-wide distribution calculation
  let totalOfficeCommissions = 0;
  let adminNetProfit = 0;

  deliveredPackages.forEach(s => {
    const originOffice = offices.find(o => isOfficeMatch(o, s.originOfficeId, s.originOfficeName));
    const financials = calculatePackageFinancials(s.shippingFee || 300, originOffice?.intakePercentage || 20);
    totalOfficeCommissions += (financials.originCommission + financials.destinationCommission);
    adminNetProfit += financials.adminNetProfit;
  });

  const totalSellerNetPaid = shipments
    .filter(s => s.paymentStatus === 'SETTLED')
    .reduce((sum, s) => sum + s.sellerNet, 0);

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border border-amber-500/40 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">
            Administrata Qendrore &bull; Përqindja e Fitimit
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5">Fitimi i Administratorit & Të Ardhurat</h1>
          <p className="text-xs font-bold text-amber-200">Gjurmimi i përqindjes së fitimit neto të administratorit, tarifave të kompanisë dhe shpërndarjes financiare</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-[#f6d55c] text-slate-950 flex items-center justify-center font-black shadow-md border border-amber-300">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Administrator Net Profit */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-[#f6d55c] rounded-3xl p-5 shadow-xl text-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#f6d55c] uppercase">Fitimi Neto i Administratorit</span>
            <Award className="w-5 h-5 text-[#f6d55c]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{formatALL(adminNetProfit)}</p>
          <p className="text-[10px] text-amber-200 font-semibold">Të ardhura neto postare të mbajtura nga Administrata</p>
        </div>

        {/* Total Tariffs Retained */}
        <div className="bg-white border border-indigo-200 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-700 uppercase">Tarifa Postare Totale</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-2">{formatALL(totalTariffsCollected)}</p>
          <p className="text-[10px] text-slate-500 font-semibold">300 ALL për pako nga klienti</p>
        </div>

        {/* Distributed to Offices */}
        <div className="bg-white border border-amber-300 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase">Komisionet e Zyrave</span>
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">{formatALL(totalOfficeCommissions)}</p>
          <p className="text-[10px] text-slate-500 font-semibold">Komisionet e zyrës së origjinës & destinacionit</p>
        </div>

        {/* Total Seller Net Paid */}
        <div className="bg-white border border-emerald-300 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase">Netto te Shitësit</span>
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{formatALL(totalSellerNetPaid)}</p>
          <p className="text-[10px] text-slate-500 font-semibold">Kaluar te shitësit e e-commerce</p>
        </div>

      </div>

      {/* Office Performance & Revenue Share Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-600" />
          <span>Analiza e Të Ardhurave dhe Përqindjeve sipas Zyrave Rajonale ({offices.length})</span>
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs font-bold border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Zyra Postare</th>
                <th className="py-3.5 px-4">Qyteti</th>
                <th className="py-3.5 px-4 text-center">Përqindja e Pranimit (%)</th>
                <th className="py-3.5 px-4 text-right">Interesi i Fituar nga Zyra</th>
                <th className="py-3.5 px-4 text-right">Arka Cash Aktuale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offices.map(o => {
                // Dynamically derive earned commission from DB ledgers & shipments
                const originPackages = shipments.filter(s => isOfficeMatch(o, s.originOfficeId, s.originOfficeName) && (s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED'));
                const destPackages = shipments.filter(s => isOfficeMatch(o, s.destinationOfficeId, s.destinationOfficeName) && (s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED'));

                const originComms = originPackages.reduce((sum, s) => sum + Math.round((s.shippingFee || 300) * ((o.intakePercentage || 20) / 100)), 0);
                const destComms = destPackages.length * 100;
                const officeEarnedComm = originComms + destComms;

                const drawer = calculateOfficeCashBalance(o, shipments, handovers, payoutBatches);

                return (
                  <tr key={o.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-3.5 px-4 font-black text-slate-950">{o.name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{o.city}</td>
                    <td className="py-3.5 px-4 text-center font-black text-indigo-700 font-mono">{o.intakePercentage || 20}%</td>
                    <td className="py-3.5 px-4 text-right font-black text-indigo-950 text-sm">{formatALL(officeEarnedComm)}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">{formatALL(drawer.drawerBalance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
