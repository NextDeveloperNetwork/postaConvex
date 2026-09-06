'use client';

import React, { useState } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { SignaturePad } from '@/components/signature-pad';
import { BarcodeScannerModal } from '@/components/barcode-scanner-modal';
import { ShippingLabel } from '@/components/shipping-label';
import { Shipment } from '@/lib/types';
import {
  Truck,
  MapPin,
  User,
  CheckCircle2,
  DollarSign,
  Search,
  Phone,
  ArrowRight,
  Banknote,
  Filter,
  ClipboardCheck,
  Building,
  Scan,
  Printer,
  PenTool,
  X
} from 'lucide-react';

export default function DeliveryCourierWorkspacePage() {
  const { shipments, deliverShipmentAndCollectCOD, currentUser } = useAuthenticatedState();
  const { formatALL } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'cod' | 'prepaid'>('all');
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  
  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeShipmentForSignature, setActiveShipmentForSignature] = useState<Shipment | null>(null);
  const [activeShipmentForPrint, setActiveShipmentForPrint] = useState<Shipment | null>(null);

  // Only OUT_FOR_DELIVERY (local deliveries assigned to this destination courier)
  const myDeliveries = shipments.filter(s =>
    (s.courierId === currentUser.id || !s.courierId || currentUser.role === 'FINANCE_ADMIN') &&
    s.status === 'OUT_FOR_DELIVERY'
  );

  const filtered = myDeliveries.filter(s => {
    const matchSearch =
      !searchTerm ||
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientPhone.includes(searchTerm) ||
      s.destinationCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.destinationAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      (filter === 'cod' && s.codAmount > 0) ||
      (filter === 'prepaid' && !s.codAmount);

    return matchSearch && matchFilter;
  });

  const totalCOD = myDeliveries.reduce((sum, s) => sum + (s.codAmount || 0), 0);
  const codCount = myDeliveries.filter(s => s.codAmount > 0).length;
  const prepaidCount = myDeliveries.filter(s => !s.codAmount).length;

  const handleOpenSignatureModal = (shipment: Shipment) => {
    setActiveShipmentForSignature(shipment);
  };

  const handleSaveSignature = async (signatureDataUrl: string) => {
    if (!activeShipmentForSignature) return;
    const shipmentId = activeShipmentForSignature.id;
    
    await deliverShipmentAndCollectCOD(shipmentId);
    setConfirmedIds(prev => [...prev, shipmentId]);
    setActiveShipmentForSignature(null);
  };

  const handleScanSuccess = (code: string) => {
    setSearchTerm(code);
  };

  return (
    <main className="w-full space-y-5 max-w-3xl mx-auto">

      {/* ── Top Header Banner ───────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 rounded-3xl p-5 md:p-6 shadow-xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 text-white">
              Kurier Dorëzimi Lokal (Destination Courier)
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-2">Dorëzimet te Klienti</h1>
            <p className="text-xs font-bold text-indigo-200">{currentUser.name} &bull; {currentUser.officeName || 'Zyrë Destinacioni'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 rounded-2xl flex items-center gap-1.5 text-xs font-extrabold border border-white/20 shadow-sm transition"
            >
              <Scan className="w-4 h-4 text-amber-300" /> Skano
            </button>
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-white">{myDeliveries.length}</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase">Paketa Në Dërgim</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-amber-300">{codCount}</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase">Paketa me COD</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-base font-black text-emerald-300">{totalCOD > 0 ? formatALL(totalCOD) : '0 ALL'}</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase">COD Për Mbledhur</p>
          </div>
        </div>
      </div>

      {/* COD Summary Banner */}
      {totalCOD > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-950 text-sm">Mblidh gjithsej: {formatALL(totalCOD)}</p>
            <p className="text-xs text-amber-800 font-semibold truncate">
              Nga {codCount} paketa me COD &bull; {prepaidCount} parapaguar
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-500">Mbledhur</p>
            <p className="font-black text-emerald-700 text-sm">
              {formatALL(shipments.filter(s => confirmedIds.includes(s.id)).reduce((sum, s) => sum + (s.codAmount || 0), 0))}
            </p>
          </div>
        </div>
      )}

      {/* ── Search & Filter ─────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Kërko me kod, marrës, telefon, adresë..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-950 font-bold focus:outline-none focus:border-indigo-400 transition placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-[11px] font-black">
          {([['all', 'Të Gjitha'], ['cod', 'COD'], ['prepaid', 'Prepaid']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-2 transition ${filter === val ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Delivery Cards ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto">
            {myDeliveries.length === 0
              ? <CheckCircle2 className="w-8 h-8 text-indigo-400" />
              : <Filter className="w-8 h-8 text-slate-400" />
            }
          </div>
          <p className="font-black text-slate-950 text-sm">
            {myDeliveries.length === 0
              ? 'Nuk ke dërgese aktive për dorëzim lokal.'
              : 'Nuk gjenden rezultate për filtrin/kërkimin e zgjedhur.'}
          </p>
          <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
            {myDeliveries.length === 0
              ? 'Zyra e destinacionit do t\'ju caktojë pakota me status OUT_FOR_DELIVERY kur të jenë gati.'
              : 'Provo të kërkosh me terma të tjerë.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-black text-slate-600">
              {filtered.length} paketa lokale për dorëzim
            </p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <ClipboardCheck className="w-3.5 h-3.5" />
              {confirmedIds.length}/{myDeliveries.length} të dorëzuara
            </div>
          </div>

          {filtered.map((s, idx) => {
            const isConfirmed = confirmedIds.includes(s.id);
            const hasCOD = s.codAmount > 0;

            return (
              <div
                key={s.id}
                className={`bg-white border rounded-3xl p-5 shadow-sm transition space-y-4 ${
                  isConfirmed
                    ? 'border-emerald-300 bg-emerald-50/30 opacity-70'
                    : hasCOD
                    ? 'border-amber-200 hover:border-amber-400'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Top Bar */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-slate-400 font-black text-xs w-5 text-center">{idx + 1}.</span>
                      <span className="font-mono font-black text-sm text-slate-950 tracking-wider">{s.trackingNumber}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        hasCOD
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      }`}>
                        {hasCOD ? 'COD' : 'JO COD (PARAPAGUAR)'}
                      </span>
                      <button
                        onClick={() => setActiveShipmentForPrint(s)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
                      >
                        <Printer className="w-3 h-3 text-slate-500" /> Printo Etiketën
                      </button>
                      {isConfirmed && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-emerald-100 text-emerald-700 border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Dorëzuar
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 ml-7">
                      Nga: {s.originOfficeName} &bull; Dërguesi: {s.sellerName}
                    </p>
                  </div>
                  {hasCOD && (
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-[10px] font-bold text-slate-400">Mblidh COD</p>
                      <p className="font-black text-base text-amber-600">{formatALL(s.codAmount)}</p>
                    </div>
                  )}
                </div>

                {/* Recipient Details & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Marrësi</p>
                      <p className="font-black text-slate-950 text-sm">{s.recipientName}</p>
                      <a
                        href={`tel:${s.recipientPhone}`}
                        className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:underline mt-1 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 text-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> {s.recipientPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 text-red-500 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Adresa e Dorëzimit</p>
                      <p className="font-bold text-slate-950 leading-snug">{s.destinationAddress || '—'}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {s.destinationCity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Action Button */}
                {!isConfirmed && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenSignatureModal(s)}
                      className={`w-full py-3.5 px-4 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 border ${
                        hasCOD
                          ? 'bg-[#f6d55c] hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      }`}
                    >
                      <PenTool className="w-4 h-4" />
                      {hasCOD ? (
                        <>Marr Nënshkrimin & Mblidh {formatALL(s.codAmount)}</>
                      ) : (
                        <>Marr Nënshkrimin & Dorëzo Dërgesën</>
                      )}
                    </button>
                  </div>
                )}

                {/* Confirmed Banner */}
                {isConfirmed && (
                  <div className="pt-1 border-t border-emerald-200">
                    <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-sm font-black text-emerald-700 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Dorëzuar me sukses (Me Nënshkrim)
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Signature Modal */}
      {activeShipmentForSignature && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full relative">
            <button
              onClick={() => setActiveShipmentForSignature(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200 p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <SignaturePad
              title={`Proof of Delivery - ${activeShipmentForSignature.trackingNumber}`}
              onSave={handleSaveSignature}
            />
          </div>
        </div>
      )}

      {/* Shipping Label Modal */}
      {activeShipmentForPrint && (
        <ShippingLabel
          shipment={activeShipmentForPrint}
          onClose={() => setActiveShipmentForPrint(null)}
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* All Done Banner */}
      {myDeliveries.length > 0 && confirmedIds.length === myDeliveries.length && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="font-black text-emerald-900 text-sm">Të gjitha pakot e dorëzimit u kryen me sukses!</p>
          <p className="text-xs text-emerald-700 font-semibold">
            Mblodhët gjithsej {formatALL(totalCOD)} COD.
          </p>
        </div>
      )}

    </main>
  );
}
