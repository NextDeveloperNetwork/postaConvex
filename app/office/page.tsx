'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { WorkflowTracker } from '@/components/workflow-tracker';
import { isOfficeMatch, calculateOfficeCashBalance } from '@/lib/finance-utils';
import {
  Building2,
  ScanLine,
  Search,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  PackagePlus,
  ArrowRight,
  Truck,
  X,
  Printer,
  Archive,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Shipment } from '@/lib/types';
import Link from 'next/link';

export default function OfficeStaffDashboardPage() {
  const { shipments, offices, handovers, payoutBatches, pickupShipment, receiveShipmentAtOffice, currentUser, getShipmentByTracking } = useAuthenticatedState();
  const { t, formatALL } = useI18n();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedMessage, setScannedMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedBarcodeShipment, setSelectedBarcodeShipment] = useState<Shipment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Active office ID of current logged in staff user
  const userOfficeId = currentUser.officeId || 'off-1';
  const currentOffice = offices.find(o => isOfficeMatch(o, userOfficeId, currentUser.officeName)) || offices[0];

  // Actual Earned Revenue of this office
  const originPackages = shipments.filter(s => isOfficeMatch(currentOffice, s.originOfficeId, s.originOfficeName) && (s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED'));
  const destPackages = shipments.filter(s => isOfficeMatch(currentOffice, s.destinationOfficeId, s.destinationOfficeName) && (s.paymentStatus === 'COD_COLLECTED' || s.paymentStatus === 'SETTLED' || s.status === 'CLOSED'));

  const originComms = originPackages.reduce((sum, s) => sum + Math.round((s.shippingFee || 300) * ((currentOffice?.intakePercentage || 20) / 100)), 0);
  const destComms = destPackages.length * 100;
  const totalActualOfficeRevenue = originComms + destComms;

  const drawer = calculateOfficeCashBalance(currentOffice, shipments, handovers, payoutBatches);

  // 1. Newly Created Packages awaiting Office Intake (STRICTLY originOfficeId === userOfficeId)
  const newlyCreatedShipments = shipments.filter(s =>
    s.status === 'CREATED' && (s.originOfficeId === userOfficeId || currentUser.role === 'FINANCE_ADMIN')
  );

  // 2. Packages already ACCEPTED / IN STOK at this office
  const acceptedOfficeShipments = shipments.filter(s =>
    (s.status === 'PICKED_UP' && (s.originOfficeId === userOfficeId || currentUser.role === 'FINANCE_ADMIN')) ||
    (s.status === 'AT_DESTINATION' && (s.destinationOfficeId === userOfficeId || currentUser.role === 'FINANCE_ADMIN'))
  );

  // Filter based on search query
  const query = barcodeInput.trim().toLowerCase();

  const filteredNewlyCreated = newlyCreatedShipments.filter(s => {
    if (!query) return true;
    return (
      s.trackingNumber.toLowerCase().includes(query) ||
      (s.barcode && s.barcode.toLowerCase().includes(query)) ||
      s.recipientName.toLowerCase().includes(query) ||
      s.sellerName.toLowerCase().includes(query) ||
      s.destinationCity.toLowerCase().includes(query)
    );
  });

  const filteredAccepted = acceptedOfficeShipments.filter(s => {
    if (!query) return true;
    return (
      s.trackingNumber.toLowerCase().includes(query) ||
      (s.barcode && s.barcode.toLowerCase().includes(query)) ||
      s.recipientName.toLowerCase().includes(query) ||
      s.sellerName.toLowerCase().includes(query) ||
      s.destinationCity.toLowerCase().includes(query)
    );
  });

  // Barcode scanner / search submit handler
  const handleScanOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const found = getShipmentByTracking(barcodeInput.trim());
    if (!found) {
      setScannedMessage({ type: 'error', text: `Dërgesa me kod '${barcodeInput}' nuk u gjet në sistem.` });
      return;
    }

    if (found.status === 'CREATED') {
      pickupShipment(found.id);
      setScannedMessage({ type: 'success', text: `Skanim i Suksesshëm! Dërgesa '${found.trackingNumber}' u pranua me sukses në Zyrë!` });
      setBarcodeInput('');
      return;
    }

    if (found.status === 'IN_TRANSIT' || found.status === 'PICKED_UP') {
      receiveShipmentAtOffice(found.id);
      setScannedMessage({ type: 'success', text: `Skanim i Suksesshëm! Dërgesa '${found.trackingNumber}' u pranua me sukses në Zyrë.` });
      setBarcodeInput('');
      return;
    }

    setScannedMessage({ type: 'error', text: `Dërgesa '${found.trackingNumber}' ka statusin '${found.status}' dhe nuk mund të pranohet me skanim.` });
  };

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.office}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">{t.officeView.title}</h1>
          <p className="text-xs font-bold text-slate-800">
            Pranimi & Skanimi i Pakove — {currentUser.officeName || 'Zyra Juve'}
          </p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <ScanLine className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Office KPI Overview: Actual Earned Revenue, Cash Balance, Active Stok */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Actual Earned Revenue */}
        <div className="bg-white border border-indigo-200 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-700 uppercase">Të Ardhurat Neto të Zyrës</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-1.5">{formatALL(totalActualOfficeRevenue)}</p>
          <p className="text-[10px] text-slate-500 font-semibold">Komisionet e fituara nga pranimet ({currentOffice?.intakePercentage || 20}%) & dorëzimet (100 ALL)</p>
        </div>

        {/* Drawer Cash Balance */}
        <div className="bg-white border border-emerald-300 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 uppercase">Gjendja Cash në Zyrë</span>
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1.5">{formatALL(drawer.drawerBalance)}</p>
          <p className="text-[10px] text-slate-500 font-semibold">Paratë fizike gjendje në arkën cash të zyrës</p>
        </div>

        {/* Pending Intake Packages */}
        <div className="bg-white border border-amber-300 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase">Pakot për Pranim</span>
            <PackagePlus className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-1.5">{newlyCreatedShipments.length} pako</p>
          <p className="text-[10px] text-slate-500 font-semibold">Dërgesa të krijuara në pritje skanimi</p>
        </div>

        {/* Packages in Stok */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 uppercase">Pakot në Stok</span>
            <Archive className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-950 mt-1.5">{acceptedOfficeShipments.length} pako</p>
          <p className="text-[10px] text-slate-500 font-semibold">Dërgesa aktuale fizikisht në magazinë</p>
        </div>
      </div>

      {/* Search & Barcode Scanner Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
        <h2 className="font-black text-slate-950 text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-600" />
            <span>Kërko Porosinë ose Skano Barkodin</span>
          </span>
          {barcodeInput && (
            <button
              onClick={() => setBarcodeInput('')}
              className="text-xs text-slate-500 hover:text-slate-950 font-bold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Pastro kërkimin
            </button>
          )}
        </h2>

        <form onSubmit={handleScanOrSubmit} className="w-full">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Shkruaj për të kërkuar (emër, tracking, qytet) ose skano barkodin..."
              value={barcodeInput}
              onChange={e => {
                setBarcodeInput(e.target.value);
                if (scannedMessage) setScannedMessage(null);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-950 font-black focus:outline-none focus:border-[#f6d55c] transition"
            />
          </div>
        </form>

        {scannedMessage && (
          <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-2 border ${
            scannedMessage.type === 'success' ? 'bg-emerald-100 border-emerald-300 text-emerald-950' : 'bg-red-100 border-red-300 text-red-950'
          }`}>
            {scannedMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
            )}
            <span>{scannedMessage.text}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: NEWLY CREATED SHIPMENTS FROM SELLERS (Strictly for THIS office) */}
      <div className="bg-white border border-amber-300 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-amber-600" />
            <span>Pakot e Reja për Pranim në {currentUser.officeName || 'Zyrë'} ({filteredNewlyCreated.length})</span>
          </h2>
          {filteredNewlyCreated.length > 0 && (
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
              NË PRITJE TË PRANIMIT
            </span>
          )}
        </div>

        {filteredNewlyCreated.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-600 text-xs font-bold">
            {query 
              ? `Nuk u gjet asnjë dërgesë e re me kërkimin "${barcodeInput}".` 
              : `Nuk ka asnjë dërgesë të re në pritje të pranimit për ${currentUser.officeName || 'këtë zyrë'}.`
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNewlyCreated.map(s => {
              const isPrepaid = s.packageType === 'PREPAID';

              return (
                <div key={s.id} className={`bg-slate-50 border rounded-3xl p-5 shadow-sm space-y-3 font-bold text-xs transition ${
                  isPrepaid ? 'border-emerald-300 hover:border-emerald-400' : 'border-amber-300 hover:border-amber-400'
                }`}>
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-950 text-base">{s.trackingNumber}</span>
                        {isPrepaid ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                            JO COD (PARAPAGUAR)
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            COD
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] font-semibold mt-1">Dërguesi: {s.sellerName}</p>
                      <p className="text-slate-600 text-[11px] font-semibold">Marrësi: {s.recipientName} ({s.destinationCity})</p>
                    </div>

                    <div className="text-right">
                      {isPrepaid ? (
                        <>
                          <span className="text-xs font-black text-emerald-800 block">Tarifa: {formatALL(s.shippingFee)}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">Arkëtohet në sportel</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-black text-slate-950 block">COD: {formatALL(s.codAmount)}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                            KRIJUAR
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span>Destinacioni: <strong className="text-slate-950">{s.destinationOfficeName}</strong></span>
                    <span>{s.createdAt.split('T')[0]}</span>
                  </div>

                  <button
                    onClick={() => {
                      pickupShipment(s.id);
                      setScannedMessage({ type: 'success', text: `Dërgesa '${s.trackingNumber}' u pranua me sukses në Zyrë!` });
                    }}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md border transition active:scale-95 mt-2 ${
                      isPrepaid
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                        : 'bg-[#f6d55c] hover:bg-amber-400 text-slate-950 border-amber-300'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 text-slate-950" />
                    <span>
                      {isPrepaid 
                        ? `Prano & Arkëto Tarifën Postare (${formatALL(s.shippingFee)}) në Zyrë`
                        : 'Prano Dërgesën në Zyrën Postare'
                      }
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: ACCEPTED PACKAGES IN THIS OFFICE INVENTORY */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Pakot e Pranuara & Në Stok të Zyrës ({filteredAccepted.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Dërgesat e pranuara në këtë zyrë që janë gati për krijimin e thesit ose caktimin te kurieri lokal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/office/bags"
              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition"
            >
              <Archive className="w-4 h-4 text-indigo-600" />
              <span>Cakto në Thes</span>
            </Link>
            <Link
              href="/office/assign"
              className="py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition"
            >
              <Truck className="w-4 h-4 text-purple-600" />
              <span>Cakto te Kurieri</span>
            </Link>
          </div>
        </div>

        {filteredAccepted.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs font-bold">
            {query ? `Nuk u gjet asnjë dërgesë e pranuar me kërkimin "${barcodeInput}".` : `Nuk ka asnjë dërgesë të pranuar aktualisht në stokun e zyrës ${currentUser.officeName || ''}.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAccepted.map(s => {
              const isPrepaid = s.packageType === 'PREPAID';
              const isExpanded = expandedId === s.id;

              return (
                <div key={s.id} className="bg-emerald-50/40 border border-emerald-200 rounded-3xl p-5 shadow-sm space-y-3 font-bold text-xs">
                  <div className="flex items-start justify-between border-b border-emerald-200/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-950 text-base">{s.trackingNumber}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                          {s.status === 'PICKED_UP' ? 'MARRË NË ZYRË' : 'ARRITUR NË DESTINACION'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-semibold mt-1">Dërguesi: {s.sellerName}</p>
                      <p className="text-slate-600 text-[11px] font-semibold">Marrësi: {s.recipientName} ({s.destinationCity})</p>
                    </div>

                    <div className="text-right">
                      {isPrepaid ? (
                        <span className="text-xs font-black text-emerald-800 block">Tarifa: {formatALL(s.shippingFee)}</span>
                      ) : (
                        <span className="text-xs font-black text-slate-950 block">COD: {formatALL(s.codAmount)}</span>
                      )}
                      <button
                        onClick={() => setSelectedBarcodeShipment(s)}
                        className="py-1 px-2.5 bg-white border border-slate-300 rounded-xl text-[10px] font-black text-slate-800 hover:bg-[#f6d55c] transition flex items-center gap-1 mt-1 ml-auto"
                      >
                        <Printer className="w-3 h-3 text-slate-700" />
                        <span>Barkodi</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span>Destinacioni: <strong className="text-slate-950">{s.destinationOfficeName}</strong></span>
                    <button
                      onClick={() => toggleExpand(s.id)}
                      className="text-slate-700 hover:text-slate-950 font-black flex items-center gap-1 text-[11px]"
                    >
                      <span>{isExpanded ? 'Fshih Rrjedhën' : 'Shiko Rrjedhën'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-emerald-200">
                      <WorkflowTracker currentStatus={s.status} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BARCODE MODAL */}
      {selectedBarcodeShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-black text-sm text-slate-950">Etiketa e Dërgesës</span>
              <button onClick={() => setSelectedBarcodeShipment(null)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm transition">✕</button>
            </div>
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 space-y-3 text-center">
              <p className="font-black text-xs text-slate-950 uppercase tracking-widest">POSTA SHQIPTARE</p>
              <div className="bg-slate-950 text-white font-mono tracking-[0.3em] font-black text-xl py-3 px-4 rounded-xl">
                {selectedBarcodeShipment.barcode}
              </div>
              <p className="font-black text-sm text-slate-950">{selectedBarcodeShipment.trackingNumber}</p>
              <div className="text-[11px] font-semibold text-slate-700 text-left space-y-1 pt-2 border-t border-slate-200">
                <p><span className="font-black">Lloji:</span> {selectedBarcodeShipment.packageType === 'PREPAID' ? 'JO COD (Parapaguar)' : 'COD (Pagesë në Dorëzim)'}</p>
                <p><span className="font-black">Dërguesi:</span> {selectedBarcodeShipment.sellerName}</p>
                <p><span className="font-black">Marrësi:</span> {selectedBarcodeShipment.recipientName} ({selectedBarcodeShipment.destinationCity})</p>
                <p><span className="font-black">{selectedBarcodeShipment.packageType === 'PREPAID' ? 'Tarifa:' : 'COD:'}</span> <span className="text-emerald-700 font-black">{formatALL(selectedBarcodeShipment.packageType === 'PREPAID' ? selectedBarcodeShipment.shippingFee : selectedBarcodeShipment.codAmount)}</span></p>
              </div>
            </div>
            <button onClick={() => window.print()}
              className="w-full py-3 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md border border-amber-300 flex items-center justify-center gap-2 transition">
              <Printer className="w-4 h-4" /> Printo Etiketën
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
