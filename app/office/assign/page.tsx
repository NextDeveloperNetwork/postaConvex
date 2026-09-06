'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { Shipment } from '@/lib/types';
import Link from 'next/link';
import {
  Archive,
  PackageSearch,
  ScanBarcode,
  UserCheck,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Package,
  X,
  Send,
  Search,
  ArrowRightLeft,
  MapPin,
  RefreshCw,
  Building,
  Clock,
} from 'lucide-react';

const MAX_BAG = 50;

const PKG_BADGE: Record<string, string> = {
  COD: 'bg-amber-100 text-amber-800 border-amber-300',
  PREPAID: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

const STATUS_BADGE: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-700 border-slate-300',
  PICKED_UP: 'bg-amber-100 text-amber-800 border-amber-300',
  AT_DESTINATION: 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

export default function OfficeAssignCourierPage() {
  const { shipments, users, offices, currentUser, createBag, getShipmentByTracking, bags } = useAuthenticatedState();

  const couriers = users.filter(u => u.role === 'COURIER_TRANSPORT' || u.role === 'COURIER');
  const otherOffices = offices.filter(o => o.id !== currentUser.officeId);

  const [selectedCourierId, setSelectedCourierId] = useState<string>(couriers[0]?.id || '');
  const [destinationOfficeId, setDestinationOfficeId] = useState<string>(otherOffices[0]?.id || offices[0]?.id || '');
  const [bagIds, setBagIds] = useState<string[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [searchAvail, setSearchAvail] = useState('');
  const [searchBag, setSearchBag] = useState('');
  const [dispatched, setDispatched] = useState(false);
  const [lastBagInfo, setLastBagInfo] = useState<{ count: number; courier: string; dest: string } | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  // Pending bags created at this office waiting for courier approval
  const pendingOfficeBags = bags.filter(b => 
    (b.officeId === currentUser.officeId || !currentUser.officeId) && 
    b.status === 'PENDING_APPROVAL'
  );

  // Set of all shipment IDs already packed in pending bags
  const pendingBaggedShipmentIds = new Set(
    pendingOfficeBags.flatMap(b => b.shipmentIds)
  );

  // All active packages available for bagging at origin office (MUST BE ACCEPTED: PICKED_UP & NOT ALREADY IN A PENDING BAG)
  const availableShipments = shipments.filter(s => {
    if (s.status !== 'PICKED_UP') return false;
    if (currentUser.officeId && s.originOfficeId !== currentUser.officeId) return false;
    if (pendingBaggedShipmentIds.has(s.id)) return false; // Exclude packages already assigned to a pending bag!
    return true;
  });

  const selectedCourier = couriers.find(c => c.id === selectedCourierId);
  const destinationOffice = offices.find(o => o.id === destinationOfficeId);
  const bagShipments = shipments.filter(s => bagIds.includes(s.id));
  const totalCOD = bagShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);

  const filteredAvailable = availableShipments
    .filter(s => !bagIds.includes(s.id))
    .filter(s => {
      const q = searchAvail.toLowerCase();
      return !q || s.trackingNumber.toLowerCase().includes(q) ||
        s.recipientName.toLowerCase().includes(q) ||
        s.destinationCity.toLowerCase().includes(q) ||
        s.sellerName.toLowerCase().includes(q);
    });

  const filteredBag = bagShipments.filter(s => {
    const q = searchBag.toLowerCase();
    return !q || s.trackingNumber.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.destinationCity.toLowerCase().includes(q);
  });

  const addToBag = useCallback((shipment: Shipment) => {
    if (bagIds.length >= MAX_BAG) {
      setScanError(`Thesi ka arritur maksimumin (${MAX_BAG} pako).`);
      setTimeout(() => setScanError(''), 3000);
      return;
    }
    if (bagIds.includes(shipment.id)) {
      setScanError(`${shipment.trackingNumber} është tashmë në thes!`);
      setTimeout(() => setScanError(''), 2000);
      return;
    }
    setBagIds(prev => [...prev, shipment.id]);
    setScanSuccess(`✓ ${shipment.trackingNumber} u shtua në thes`);
    setTimeout(() => setScanSuccess(''), 2000);
    setScanError('');
  }, [bagIds]);

  const removeFromBag = (id: string) => setBagIds(prev => prev.filter(x => x !== id));
  const clearBag = () => { setBagIds([]); setScanError(''); setScanSuccess(''); };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim();
    if (!code) return;
    const found = getShipmentByTracking(code);
    if (!found) {
      setScanError(`"${code}" nuk u gjet. Kontrolloni barkodin.`);
      setTimeout(() => setScanError(''), 3000);
      setScanInput('');
      return;
    }
    if (found.status !== 'PICKED_UP' && found.status !== 'AT_DESTINATION' && found.status !== 'CREATED') {
      setScanError(`${found.trackingNumber} ka statusin '${found.status}' dhe nuk mund të futet në thes.`);
      setTimeout(() => setScanError(''), 3500);
      setScanInput('');
      return;
    }
    addToBag(found);
    setScanInput('');
    scanRef.current?.focus();
  };

  const handleDispatch = () => {
    if (bagIds.length === 0 || !selectedCourierId || !destinationOfficeId) return;

    setLastBagInfo({
      count: bagIds.length,
      courier: selectedCourier?.name || '—',
      dest: destinationOffice?.name || 'Zyrë Tjetër',
    });

    createBag(
      bagIds,
      selectedCourierId,
      'TRANSIT',
      destinationOfficeId
    );

    clearBag();
    setDispatched(true);
  };

  const handleNewBag = () => {
    setDispatched(false);
    setLastBagInfo(null);
    setTimeout(() => scanRef.current?.focus(), 100);
  };

  return (
    <main className="w-full space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">Zyra Postare</span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Ndërtimi i Thasëve Transit</h1>
          <p className="text-xs font-bold text-slate-700 mt-0.5">
            {currentUser.officeName || 'Zyra Qendrore'} — Manifestimi i pakove për transport ({availableShipments.length} pako të disponueshme)
          </p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <Archive className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Success banner (after dispatch) */}
      {dispatched && lastBagInfo && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-emerald-900">Thesi Transit u Krijua dhe u Dërgua për Aprovim!</p>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              {lastBagInfo.count} pako &bull; Destinacioni: {lastBagInfo.dest} &bull; Kurieri: {lastBagInfo.courier}
            </p>
          </div>
          <button
            onClick={handleNewBag}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl border border-emerald-700 shadow transition active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thes i Ri
          </button>
        </div>
      )}

      {/* Config Panel: Courier + Destination Office + Scan */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md space-y-4">

        {/* Courier + Destination Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Courier selector */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              Kurieri i Transportit (Tranzit)
            </label>
            {couriers.length === 0 ? (
              <div className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                Nuk ka kurierë aktivë në sistem.
              </div>
            ) : (
              <select
                value={selectedCourierId}
                onChange={e => setSelectedCourierId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-3 text-sm text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-amber-200 transition"
              >
                {couriers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.officeName ? `(${c.officeName})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Destination office selector */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              Zyra e Destinacionit (Tranziti)
            </label>
            <select
              value={destinationOfficeId}
              onChange={e => setDestinationOfficeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-3 text-sm text-slate-950 font-bold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition"
            >
              {offices.map(o => (
                <option key={o.id} value={o.id}>
                  {o.city} — {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transit summary badge */}
        {selectedCourier && destinationOffice && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 text-xs">
            <ArrowRightLeft className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="font-semibold text-indigo-900">
              <strong>{currentUser.officeName || 'Kjo Zyrë'}</strong>
              <span className="mx-2 text-indigo-400">→</span>
              <strong>{destinationOffice.name}, {destinationOffice.city}</strong>
              <span className="mx-2 text-indigo-400">•</span>
              Kurieri: <strong>{selectedCourier.name}</strong>
            </span>
            <span className={`ml-auto font-black text-base ${bagIds.length >= MAX_BAG ? 'text-red-600' : 'text-indigo-700'}`}>
              {bagIds.length}<span className="text-indigo-400 font-bold text-sm">/{MAX_BAG}</span>
            </span>
          </div>
        )}

        {/* Scan Bar */}
        <div className="border-t border-slate-100 pt-4">
          <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <ScanBarcode className="w-3.5 h-3.5" /> Skano Barkod / Shkruaj Kodin Tracking
          </label>
          <form onSubmit={handleScan} className="flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={scanRef}
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder="Skano ose shkruaj AL-XXXXXX për ta shtuar në thes..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-amber-200 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-[#f6d55c] font-black rounded-2xl text-sm shadow border border-slate-800 transition active:scale-95 flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4" /> Shto në Thes
            </button>
          </form>

          {scanError && (
            <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{scanError}
            </div>
          )}
          {scanSuccess && (
            <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{scanSuccess}
            </div>
          )}
        </div>
      </div>

      {/* Two-panel: Available Packages | Current Bag */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT — Available packages */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-amber-600" />
              <h2 className="font-black text-slate-950 text-sm flex items-center gap-2">
                <span>Pakot e Disponueshme në Zyrë</span>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {filteredAvailable.length}
                </span>
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchAvail}
                onChange={e => setSearchAvail(e.target.value)}
                placeholder="Kërko..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-amber-300 w-32 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50" style={{ maxHeight: 480 }}>
            {filteredAvailable.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-bold space-y-3">
                <Package className="w-10 h-10 mx-auto text-slate-200" />
                <p>Nuk ka asnjë pako të disponueshme në këtë zyrë.</p>
                <button
                  onClick={() => {
                    ['posta_shipments', 'posta_users', 'posta_offices', 'posta_ledgers', 'posta_bags', 'posta_current_user'].forEach(k => localStorage.removeItem(k));
                    window.location.reload();
                  }}
                  className="mx-auto flex items-center gap-1.5 text-[11px] font-black text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-100 transition"
                >
                  Pastro Cache dhe Rifresko Demo Data
                </button>
              </div>
            ) : filteredAvailable.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/70 transition group cursor-pointer"
                onClick={() => addToBag(s)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-black text-slate-950">{s.trackingNumber}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${PKG_BADGE[s.packageType || 'COD']}`}>
                      {s.packageType === 'PREPAID' ? 'JO COD' : 'COD'}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${STATUS_BADGE[s.status] || 'bg-slate-100'}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold truncate">{s.recipientName} — {s.destinationCity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {s.codAmount > 0 && <p className="text-[11px] font-black text-slate-950 mb-0.5">{s.codAmount.toLocaleString()} L</p>}
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                    <ArrowRightLeft className="w-2.5 h-2.5" /> Shto në Thes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Current bag */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Archive className="w-4 h-4 text-slate-600" />
              <h2 className="font-black text-slate-950 text-sm">
                Thesi Transit <span className="text-xs text-slate-400 font-bold">({bagIds.length}/{MAX_BAG})</span>
              </h2>
              {destinationOffice && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-indigo-100 text-indigo-900 border-indigo-300">
                  → {destinationOffice.city}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchBag}
                  onChange={e => setSearchBag(e.target.value)}
                  placeholder="Kërko..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-amber-300 w-24 transition"
                />
              </div>
              {bagIds.length > 0 && (
                <button
                  onClick={clearBag}
                  className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5 hover:bg-red-100 transition flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Pastro
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50" style={{ maxHeight: 380 }}>
            {filteredBag.length === 0 ? (
              <div className="p-10 text-center text-slate-300 text-xs font-bold space-y-2">
                <Archive className="w-10 h-10 mx-auto text-slate-200" />
                <p className="text-slate-400">Skano ose kliko një pako nga lista majtas.</p>
              </div>
            ) : filteredBag.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition group">
                <span className="text-[10px] font-black text-slate-300 w-5 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-black text-slate-950">{s.trackingNumber}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${PKG_BADGE[s.packageType || 'COD']}`}>
                      {s.packageType === 'PREPAID' ? 'JO COD' : 'COD'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold truncate">{s.recipientName} — {s.destinationCity}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.codAmount > 0 && <span className="text-[11px] font-black text-slate-900">{s.codAmount.toLocaleString()} L</span>}
                  <button
                    onClick={() => removeFromBag(s.id)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: summary + dispatch */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl space-y-3">
            {bagIds.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-center">
                  <p className="text-slate-400 font-bold text-[10px] uppercase">Pakot</p>
                  <p className="font-black text-slate-950 text-base">{bagIds.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-center">
                  <p className="text-slate-400 font-bold text-[10px] uppercase">COD</p>
                  <p className="font-black text-amber-700 text-base">{bagShipments.filter(s => s.packageType !== 'PREPAID').length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-center">
                  <p className="text-slate-400 font-bold text-[10px] uppercase">Shuma</p>
                  <p className="font-black text-slate-950 text-sm leading-tight">{totalCOD > 0 ? `${(totalCOD / 1000).toFixed(1)}K` : '—'}</p>
                </div>
              </div>
            )}

            <button
              disabled={bagIds.length === 0 || !selectedCourierId || !destinationOfficeId}
              onClick={handleDispatch}
              className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-[#f6d55c] font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow border border-slate-800 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              Nis Transit ({bagIds.length} pako) → {destinationOffice?.city || ''}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: PACKAGES ALREADY IN PENDING BAGS AWAITING COURIER PICKUP */}
      {pendingOfficeBags.length > 0 && (
        <div className="bg-white border border-amber-300 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                <span>Pakot e Caktuara në Thasë (Në Pritje Aprovimi nga Kurieri)</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Këto pako janë vendosur në thes dhe janë hequr nga stoku i disponueshëm. Pasi kurieri ta aprovojë thesin, ato zhduken plotësisht nga ky panel.
              </p>
            </div>
            <Link
              href="/office/bags"
              className="py-2 px-3.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition self-start md:self-auto"
            >
              <Archive className="w-4 h-4 text-slate-950" />
              <span>Shiko te Thasët e Dërguar</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOfficeBags.map(bag => {
              const bagShipmentList = shipments.filter(s => bag.shipmentIds.includes(s.id));

              return (
                <div key={bag.id} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3 font-bold text-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
                    <span className="font-black text-slate-950 text-xs">Thesi ID: {bag.id}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      NË PRITJE TË APROVIMIT NGA KURIERI
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-700">
                    <p>🚚 <strong>Kurieri i Caktuar:</strong> {bag.courierName}</p>
                    <p>🏁 <strong>Zyra e Destinacionit:</strong> {bag.destinationOfficeName || 'Tranzit'}</p>
                  </div>

                  <div className="pt-2 border-t border-amber-200/70 space-y-1.5">
                    <p className="text-[10px] uppercase font-black text-slate-500">Pakot brenda këtij thesi ({bagShipmentList.length}):</p>
                    {bagShipmentList.map(s => (
                      <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-black text-slate-950">{s.trackingNumber}</span>
                          <span className="text-slate-500 text-[11px] font-semibold block">Marrësi: {s.recipientName} ({s.destinationCity})</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          TRANSFERUAR NË THES (PENDING)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </main>
  );
}
