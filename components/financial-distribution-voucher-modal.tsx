'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import {
  X,
  Printer,
  ShieldCheck,
  Building2,
  Truck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Package,
  Award
} from 'lucide-react';
import { PayoutDispatchBatch } from '@/lib/types';

interface FinancialDistributionVoucherModalProps {
  batch: PayoutDispatchBatch | null;
  onClose: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('sq-AL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const FinancialDistributionVoucherModal: React.FC<FinancialDistributionVoucherModalProps> = ({
  batch,
  onClose,
}) => {
  const { formatALL } = useI18n();

  if (!batch) return null;

  const handlePrint = () => {
    window.print();
  };

  const sellerItems = batch.sellerPayouts || [];
  const sellersTotal = batch.totalAmount - (batch.officeCommissionAmount || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-none">

        {/* Top bar (hide in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center gap-2 text-indigo-700">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Dëshmi Zyrtare e Shpërndarjes Financiare</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Printo Dëshminë</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Voucher Content */}
        <div className="space-y-6 print:space-y-4">

          {/* Certificate Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full bg-slate-950 text-[#f6d55c]">
                POSTA LOGISTICS &bull; DEPARTAMENTI FINANCIAR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              DËSHMI PËR SHPËRNDARJEN E FONDEVE CASH
            </h2>
            <p className="text-xs font-mono font-black text-indigo-700">
              VOUCHER REF: {batch.batchCode || `BAT-${batch.id.slice(-8).toUpperCase()}`}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">
              Gjeneruar më: {formatDate(batch.createdAt)} &bull; Statusi: <span className="font-bold text-slate-900">{batch.status}</span>
            </p>
          </div>

          {/* Custody Chain Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">1. Nisur nga Financa</span>
              <p className="font-black text-slate-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kasaforta Qendrore</span>
              </p>
              <p className="text-[11px] text-slate-600">Autorizuesi: {batch.dispatchedByName || 'Financa Qendrore'}</p>
              <p className="text-[10px] text-slate-400 font-mono">{formatDate(batch.createdAt)}</p>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-3 pt-2 sm:pt-0">
              <span className="text-[10px] font-black uppercase text-slate-400">2. Kurieri i Transportit</span>
              <p className="font-black text-slate-900 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>{batch.courierName}</span>
              </p>
              <p className="text-[11px] text-slate-600">
                {batch.courierAcceptedAt ? '✓ Kujdestaria e pranuar' : 'Në pritje të pranimit'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">{formatDate(batch.courierAcceptedAt)}</p>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-3 pt-2 sm:pt-0">
              <span className="text-[10px] font-black uppercase text-slate-400">3. Zyra Destinacion</span>
              <p className="font-black text-slate-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{batch.officeName}</span>
              </p>
              <p className="text-[11px] text-slate-600">
                {batch.receivedAt ? `✓ Pranuar nga: ${batch.receivedByName || 'Stafi'}` : 'Në tranzit'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">{formatDate(batch.receivedAt)}</p>
            </div>
          </div>

          {/* Financial Summary Box */}
          <div className="bg-indigo-900 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-200">
                Shuma Totale e Zarfit Cash
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">{formatALL(batch.totalAmount)}</h3>
              <p className="text-xs text-indigo-200 font-semibold mt-0.5">
                Likuidim Shitësish: {formatALL(sellersTotal)} &bull; Komision Zyre: {formatALL(batch.officeCommissionAmount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Itemized Packages & Beneficiaries */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
              Pakot dhe Shitësit e Përfshirë ({sellerItems.length}):
            </h4>

            {sellerItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                Zarf shpërndarjeje e komisioneve të zyrës ose shlyerje e konsoliduar.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Tracking</th>
                      <th className="py-2.5 px-3">Shitësi</th>
                      <th className="py-2.5 px-3 text-right">Netto Likuidimi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {sellerItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.trackingNumber}</td>
                        <td className="py-2 px-3 text-slate-700">{item.sellerName}</td>
                        <td className="py-2 px-3 text-right font-black text-indigo-900">{formatALL(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Signature Slots */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-center border-t border-slate-200 text-xs font-bold text-slate-700">
            <div className="space-y-10">
              <span className="text-[10px] uppercase text-slate-400">Financa Qendrore</span>
              <div className="border-t border-dashed border-slate-300 pt-1">
                <p className="text-[11px] font-black text-slate-900">{batch.dispatchedByName || 'Departamenti Financiar'}</p>
                <p className="text-[9px] text-slate-400 font-normal">Nënshkrimi & Vula</p>
              </div>
            </div>

            <div className="space-y-10">
              <span className="text-[10px] uppercase text-slate-400">Kurieri i Kujdestarisë</span>
              <div className="border-t border-dashed border-slate-300 pt-1">
                <p className="text-[11px] font-black text-slate-900">{batch.courierName}</p>
                <p className="text-[9px] text-slate-400 font-normal">Nënshkrimi i Kurierit</p>
              </div>
            </div>

            <div className="space-y-10">
              <span className="text-[10px] uppercase text-slate-400">Pranuesi në Zyrë</span>
              <div className="border-t border-dashed border-slate-300 pt-1">
                <p className="text-[11px] font-black text-slate-900">{batch.receivedByName || batch.officeName}</p>
                <p className="text-[9px] text-slate-400 font-normal">Nënshkrimi & Vula e Zyrës</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
