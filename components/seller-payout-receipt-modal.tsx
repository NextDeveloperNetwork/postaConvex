'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import {
  X,
  Printer,
  CheckCircle2,
  Building2,
  User,
  ShieldCheck,
  CreditCard,
  Banknote,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { SellerPayoutProof } from '@/lib/types';

interface SellerPayoutReceiptModalProps {
  proof: SellerPayoutProof | null;
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

export const SellerPayoutReceiptModal: React.FC<SellerPayoutReceiptModalProps> = ({
  proof,
  onClose,
}) => {
  const { formatALL } = useI18n();

  if (!proof) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto print:p-0 print:border-none print:shadow-none print:max-w-none">

        {/* Top Action Bar (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2 text-emerald-700">
            <FileCheck2 className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Dëshmi Zyrtare Likuidimi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Printo Faturën</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Receipt */}
        <div className="space-y-5 print:space-y-4 font-sans">

          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full bg-slate-950 text-[#f6d55c] inline-block mb-1">
              POSTA EXPRESS LOGISTICS &bull; ZYRA RAJONALE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
              Faturë / Dëshmi Likuidimi
            </h2>
            <p className="text-xs font-mono font-black text-emerald-700">
              VOUCHER NR: {proof.voucherNumber}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">
              Kryer më: {formatDate(proof.createdAt)} &bull; Zyra: <span className="font-bold text-slate-800">{proof.officeName}</span>
            </p>
          </div>

          {/* Beneficiary & Officer Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Shitësi / Klienti:</span>
              <span className="font-black text-slate-950">{proof.sellerName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Marrësi i Parave (ID):</span>
              <span className="font-bold text-slate-900">
                {proof.recipientName} {proof.recipientIdCard ? `(ID: ${proof.recipientIdCard})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Kodi i Dërgesës:</span>
              <span className="font-mono font-black text-slate-900">{proof.trackingNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Mënyra e Pagesës:</span>
              <span className="font-black text-emerald-800 uppercase text-[11px]">
                {proof.paymentMethod === 'CASH' ? '💵 Para Cash në Sportel' : '🏦 Transfertë Bankare (IBAN)'}
              </span>
            </div>
            {proof.bankReference && (
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Ref. Bankare:</span>
                <span className="font-mono font-bold text-slate-900">{proof.bankReference}</span>
              </div>
            )}
          </div>

          {/* Payout Financial Box */}
          <div className="bg-emerald-800 text-white rounded-2xl p-5 text-center space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200">
              Shuma Neto e Dorëzuar te Shitësi
            </span>
            <h3 className="text-3xl font-black text-white">{formatALL(proof.amount)}</h3>
            <p className="text-[11px] text-emerald-200 font-semibold">
              Likuidimi i plotë i parave COD pas zbritjes së tarifës së shërbimit
            </p>
          </div>

          {/* Verification Proof Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 block">
              Vërtetimi i Sigurisë & Kujdestarisë:
            </span>

            {proof.signatureUrl ? (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600">Nënshkrimi Dixhital i tërheqësit:</span>
                <div className="border border-slate-300 rounded-xl bg-white p-2 flex items-center justify-center">
                  <img
                    src={proof.signatureUrl}
                    alt="Nënshkrimi i Shitësit"
                    className="max-h-20 object-contain"
                  />
                </div>
              </div>
            ) : proof.verificationCode ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-100 rounded-xl border border-emerald-300 text-xs font-black text-emerald-950">
                <span>Kodi i Sigurisë PIN:</span>
                <span className="font-mono text-sm tracking-widest">{proof.verificationCode}</span>
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-600">Verifikuar me paraqitje të dokumentit të identifikimit.</p>
            )}
          </div>

          {/* Signatures & Stamps */}
          <div className="pt-6 grid grid-cols-2 gap-4 text-center border-t border-slate-200 text-xs font-bold text-slate-700">
            <div className="space-y-8">
              <span className="text-[10px] uppercase text-slate-400">Operatori i Zyrës</span>
              <div className="border-t border-dashed border-slate-300 pt-1">
                <p className="text-[11px] font-black text-slate-900">{proof.processedBy}</p>
                <p className="text-[9px] text-slate-400 font-normal">Vula e Zyrës</p>
              </div>
            </div>

            <div className="space-y-8">
              <span className="text-[10px] uppercase text-slate-400">Marrësi i Fondeve</span>
              <div className="border-t border-dashed border-slate-300 pt-1">
                <p className="text-[11px] font-black text-slate-900">{proof.recipientName}</p>
                <p className="text-[9px] text-slate-400 font-normal">Nënshkrimi i Marrësit</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
