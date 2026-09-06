'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { Bag, Shipment } from '@/lib/types';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  ChevronRight,
  UserCheck,
  Calendar,
  Package,
  ArrowDownLeft,
  ScanBarcode,
  Search,
  Building2,
  AlertCircle,
  X,
  ArrowRightLeft,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OfficeIncomingBagsPage() {
  const { bags, shipments, receiveBagAtOffice, rejectBag, currentUser } = useAuthenticatedState();

  // Bags coming INTO this office (destinationOfficeId === currentUser.officeId)
  const incomingBags = bags.filter(b => {
    const isValidStatus = b.status === 'APPROVED' || b.status === 'IN_TRANSIT' || b.status === 'PENDING_APPROVAL' || b.status === 'COMPLETED';
    if (!isValidStatus) return false;
    if (!currentUser.officeId) return true; // Admin sees all
    return b.destinationOfficeId === currentUser.officeId;
  });

  // Currently selected bag for scanning/audit
  const [selectedBagId, setSelectedBagId] = useState<string>(
    incomingBags.find(b => b.status !== 'COMPLETED')?.id || incomingBags[0]?.id || ''
  );

  const selectedBag = bags.find(b => b.id === selectedBagId);

  // Scanned shipment IDs inside the selected bag
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const scanRef = useRef<HTMLInputElement>(null);

  // Shipments belonging to selected bag
  const bagShipments = selectedBag ? shipments.filter(s => selectedBag.shipmentIds.includes(s.id)) : [];

  // Expected vs Verified
  const expectedShipments = bagShipments.filter(s => !verifiedIds.includes(s.id));
  const verifiedShipments = bagShipments.filter(s => verifiedIds.includes(s.id));

  // Handle Scan barcode
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim().replace(/\*/g, '').toUpperCase();
    if (!code) return;

    const found = bagShipments.find(s => s.trackingNumber.toUpperCase() === code);
    if (!found) {
      setScanError(`Pakoja "${code}" nuk i përket këtij thesi (${selectedBag?.id.replace('bag-', 'THES-')})!`);
      setTimeout(() => setScanError(''), 3500);
      setScanInput('');
      return;
    }

    if (verifiedIds.includes(found.id)) {
      setScanError(`Pakoja "${found.trackingNumber}" është verifikuar më parë!`);
      setTimeout(() => setScanError(''), 2500);
      setScanInput('');
      return;
    }

    setVerifiedIds(prev => [...prev, found.id]);
    setScanSuccess(`✓ ${found.trackingNumber} u verifikua me sukses!`);
    setTimeout(() => setScanSuccess(''), 2500);
    setScanError('');
    setScanInput('');
    scanRef.current?.focus();
  };

  const verifySingle = (id: string) => {
    if (!verifiedIds.includes(id)) {
      setVerifiedIds(prev => [...prev, id]);
    }
  };

  const unverifySingle = (id: string) => {
    setVerifiedIds(prev => prev.filter(x => x !== id));
  };

  const verifyAll = () => {
    setVerifiedIds(bagShipments.map(s => s.id));
  };

  const resetAudit = () => {
    setVerifiedIds([]);
    setScanError('');
    setScanSuccess('');
  };

  const handleCompleteReceive = () => {
    if (!selectedBag) return;
    receiveBagAtOffice(selectedBag.id);
    setVerifiedIds([]);
  };

  const handleConfirmReject = () => {
    if (!selectedBag) return;
    const reason = rejectReason.trim() || `Mungojnë ${expectedShipments.length} pako gjatë skanimit te sporteli.`;
    rejectBag(selectedBag.id, reason);
    setShowRejectModal(false);
    setRejectReason('');
    setVerifiedIds([]);
  };

  const filteredBagsList = incomingBags.filter(b => {
    if (filter === 'PENDING') return b.status !== 'COMPLETED' && b.status !== 'REJECTED';
    if (filter === 'COMPLETED') return b.status === 'COMPLETED';
    return true;
  });

  return (
    <main className="w-full space-y-6">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">
            Zyra Postare
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-white mt-1.5">Skanimi & Pranimi i Thasëve në Ardhje</h1>
          <p className="text-xs font-bold text-slate-400">Verifikimi me skanim i çdo pakoje përpara pranimit përfundimtar në zyrë</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#f6d55c] rounded-2xl flex items-center justify-center text-slate-950 shadow-md flex-shrink-0">
          <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Bag Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <ScanBarcode className="w-4 h-4 text-indigo-600" />
              Zgjidh Thesin për Kontroll me Skanim
            </label>

            {incomingBags.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 font-bold">
                Nuk ka thasë në ardhje për kontroll.
              </div>
            ) : (
              <select
                value={selectedBagId}
                onChange={e => {
                  setSelectedBagId(e.target.value);
                  setVerifiedIds([]);
                  setScanError('');
                  setScanSuccess('');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-black text-slate-950 focus:outline-none focus:border-indigo-400 transition"
              >
                {incomingBags.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.id.replace('bag-', 'THES-')} ({b.shipmentIds.length} pako) — Kurieri: {b.courierName} [{b.status === 'COMPLETED' ? '✓ PRANUAR' : b.status === 'REJECTED' ? '✕ REFUZUAR' : '⏳ PËR KONTROLL'}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedBag && selectedBag.status !== 'COMPLETED' && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={verifyAll}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-2xl border border-slate-300 transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Skano të Gjitha
              </button>
              <button
                onClick={resetAudit}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Ristarto
              </button>
            </div>
          )}
        </div>

        {/* Selected Bag Overview */}
        {selectedBag && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-black text-slate-950 text-sm">{selectedBag.id.replace('bag-', 'THES-')}</span>
              <span className="flex items-center gap-1 text-slate-700 font-bold">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Origjina: <strong>{selectedBag.officeName}</strong>
              </span>
              <span className="flex items-center gap-1 text-slate-700 font-bold">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Kurieri: <strong>{selectedBag.courierName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 font-black">
              <span className="text-slate-950 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-xs">
                Skanuar: <span className="text-indigo-700 text-sm font-black">{verifiedShipments.length}</span> / {bagShipments.length}
              </span>
              {expectedShipments.length === 0 ? (
                <span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Gati për Pranim
                </span>
              ) : (
                <span className="text-amber-800 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                  Mungojnë: {expectedShipments.length} pako
                </span>
              )}
            </div>
          </div>
        )}

        {/* Scanner Bar */}
        {selectedBag && selectedBag.status !== 'COMPLETED' && selectedBag.status !== 'REJECTED' && (
          <form onSubmit={handleScan} className="flex gap-2 pt-1">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
              <input
                ref={scanRef}
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder="Skano barkodin e pakos (p.sh. AL-984205)..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-md border border-indigo-700 transition active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Skano
            </button>
          </form>
        )}

        {scanError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {scanError}
          </div>
        )}

        {scanSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {scanSuccess}
          </div>
        )}
      </div>

      {/* DUAL TABLES VIEW — The Counterpart of assign page */}
      {selectedBag && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* LEFT TABLE: Expected Packages (Pritura në Thes) */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-amber-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h2 className="font-black text-slate-950 text-sm">
                  Pakot e Pritura në Thes <span className="text-xs text-amber-800 font-bold">({expectedShipments.length})</span>
                </h2>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Për Skanim
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100" style={{ maxHeight: 440 }}>
              {expectedShipments.length === 0 ? (
                <div className="p-10 text-center text-emerald-600 text-xs font-bold space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                  <p>Të gjitha pakot e këtij thesi u skanuan me sukses!</p>
                </div>
              ) : (
                expectedShipments.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/60 transition group cursor-pointer"
                    onClick={() => verifySingle(s.id)}
                  >
                    <span className="text-slate-400 font-black text-xs w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-950">{s.trackingNumber}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${s.packageType === 'PREPAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                          {s.packageType === 'PREPAID' ? 'JO COD' : 'COD'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                        {s.recipientName} — {s.destinationCity}
                      </p>
                    </div>
                    {s.codAmount > 0 && (
                      <span className="text-xs font-black text-slate-950 flex-shrink-0">{s.codAmount.toLocaleString()} ALL</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); verifySingle(s.id); }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-600 font-bold transition flex items-center gap-1 text-[11px]"
                    >
                      <Check className="w-3.5 h-3.5" /> Verifiko
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT TABLE: Verified & Scanned Packages (Skanuara & Shkarkuara) */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="font-black text-slate-950 text-sm">
                  Pakot e Verifikuara & Skanuara <span className="text-xs text-emerald-800 font-bold">({verifiedShipments.length})</span>
                </h2>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Gati Për Shkarkim
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100" style={{ maxHeight: 440 }}>
              {verifiedShipments.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs font-bold space-y-2">
                  <ScanBarcode className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Asnjë pako nuk është verifikuar ende.</p>
                  <p className="text-[10px] text-slate-400">Skanoni barkodin ose klikoni "Verifiko" në tabelën majtas.</p>
                </div>
              ) : (
                verifiedShipments.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/40 transition group">
                    <span className="text-emerald-600 font-black text-xs w-4">✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-950">{s.trackingNumber}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${s.packageType === 'PREPAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                          {s.packageType === 'PREPAID' ? 'JO COD' : 'COD'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                        {s.recipientName} — {s.destinationCity}
                      </p>
                    </div>
                    {s.codAmount > 0 && (
                      <span className="text-xs font-black text-slate-950 flex-shrink-0">{s.codAmount.toLocaleString()} ALL</span>
                    )}
                    {selectedBag.status !== 'COMPLETED' && (
                      <button
                        onClick={() => unverifySingle(s.id)}
                        className="p-1.5 rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-600 transition opacity-60 group-hover:opacity-100"
                        title="Hiq nga të skanuarat"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Bottom Action Footer */}
            {selectedBag.status !== 'COMPLETED' && selectedBag.status !== 'REJECTED' && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCompleteReceive}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md border border-emerald-700 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Prano & Shkarko Pakot e Verifikuara</span>
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs rounded-2xl border border-red-200 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Refuzo (Mungojnë Pako)</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {showRejectModal && selectedBag && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Refuzimi i Thesit {selectedBag.id.replace('bag-', 'THES-')}
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-950 font-black">✕</button>
            </div>

            <p className="text-xs text-slate-600 font-semibold">
              Shkruani arsyen e refuzimit sepse pakot e këtij thesi nuk përputhen ose mungojnë gjatë kontrollit:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={`e.g. Mungojnë ${expectedShipments.length} pako gjatë skanimit te sporteli: ${expectedShipments.map(s => s.trackingNumber).slice(0, 3).join(', ')}...`}
              className="w-full p-3 bg-red-50/50 border border-red-200 rounded-2xl text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-red-400"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Anulo
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl border border-red-700 transition"
              >
                Konfirmo Refuzimin
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
