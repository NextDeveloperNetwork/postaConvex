'use client';

import React, { useState, useEffect } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/toast-notification';
import { SignaturePad } from '@/components/signature-pad';
import {
  X,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  User,
  CreditCard,
  Banknote,
  FileCheck2,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { Shipment, SellerPayoutProof } from '@/lib/types';

interface SellerPayoutProofModalProps {
  shipment: Shipment | null;
  onClose: () => void;
  onSuccess: (proof: SellerPayoutProof) => void;
}

export const SellerPayoutProofModal: React.FC<SellerPayoutProofModalProps> = ({
  shipment,
  onClose,
  onSuccess,
}) => {
  const { completeSellerPayoutWithProof } = useAuthenticatedState();
  const { formatALL } = useI18n();
  const { showError, showSuccess } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [recipientName, setRecipientName] = useState('');
  const [recipientIdCard, setRecipientIdCard] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shipment) {
      setRecipientName(shipment.sellerName || '');
      setRecipientIdCard('');
      setSignatureUrl('');
      setVerificationCode('');
      setBankReference('');
      setNotes('');
    }
  }, [shipment]);

  if (!shipment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      showError('Ju lutem vendosni emrin e personit që tërheq paratë.');
      return;
    }

    if (paymentMethod === 'BANK_TRANSFER' && !bankReference.trim()) {
      showError('Ju lutem shënoni numrin e referencës ose faturës bankare.');
      return;
    }

    setIsSubmitting(true);
    try {
      const proof = await completeSellerPayoutWithProof({
        shipmentId: shipment.id,
        paymentMethod,
        recipientName: recipientName.trim(),
        recipientIdCard: recipientIdCard.trim() || undefined,
        signatureUrl: signatureUrl || undefined,
        verificationCode: verificationCode.trim() || undefined,
        bankReference: bankReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (proof) {
        showSuccess(`Likuidimi prej ${formatALL(shipment.sellerNet)} u krye me dëshmi zyrtare!`);
        onSuccess(proof);
      } else {
        showError('Ndodhi një gabim gjatë regjistrimit të likuidimit.');
      }
    } catch (err) {
      console.error('Error completing seller payout with proof:', err);
      showError('Ndodhi një problem i papritur gjatë likuidimit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
            <div>
              <h3 className="font-black text-slate-950 text-base">Likuidimi me Dëshmi për Shitësin</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Tracking: {shipment.trackingNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-900">
              Shuma Neto për Kalim
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700">{formatALL(shipment.sellerNet)}</p>
            <p className="text-[11px] text-slate-600 font-semibold">
              COD: {formatALL(shipment.codAmount)} &bull; Tarifa Postare: -{formatALL(shipment.shippingFee)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <label className="text-slate-700">Mënyra e Dorëzimit të Parave:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Para Cash në Sportel</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Transfertë Bankare</span>
              </button>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700">Emri i Marrësit të Parave *</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="Emri i plotë"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700">Nr. Kartë Identiteti / Pasaportë</label>
              <input
                type="text"
                value={recipientIdCard}
                onChange={e => setRecipientIdCard(e.target.value)}
                placeholder="P.sh. I30812044F"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Bank Reference if transfer */}
          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="space-y-1">
              <label className="text-slate-700">Numri i Referencës Bankare *</label>
              <input
                type="text"
                required
                value={bankReference}
                onChange={e => setBankReference(e.target.value)}
                placeholder="P.sh. FT-BKT-948120492"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Verification Code PIN if available */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kodi PIN i Sigurisë (nga Portali i Shitësit)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Opsionale</span>
            </div>
            <input
              type="text"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder="Vendos kodin PIN 6-shifror të shitësit"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Digital Signature Pad */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-1">
              <label className="text-slate-700">Nënshkrimi Dixhital i Shitësit / Përfaqësuesit:</label>
              <SignaturePad
                onSave={dataUrl => setSignatureUrl(dataUrl)}
                title="Nënshkrimi i Shitësit në Sportel"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-slate-700">Shënime Zyre (Opsionale):</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Shënime mbi likuidimin..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition"
            >
              Anulo
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Po kryhet likuidimi...' : 'Kryej Likuidimin & Gjenero Faturën'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
