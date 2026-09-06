'use client';

import React, { useState, useRef } from 'react';
import { useAuthenticatedState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { Shipment } from '@/lib/types';
import {
  PackageCheck,
  CheckCircle2,
  DollarSign,
  ScanBarcode,
  Search,
  User,
  Phone,
  MapPin,
  Printer,
  X,
  Check,
  AlertCircle,
  Clock,
  Truck,
  UserCheck,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Building,
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OfficeFinalDeliveryPage() {
  const { shipments, users, deliverShipmentAndCollectCOD, assignDeliveryCourier, currentUser } = useAuthenticatedState();
  const { formatALL } = useI18n();

  const [activeTab, setActiveTab] = useState<'READY' | 'OUT_DELIVERY' | 'COMPLETED' | 'ALL'>('READY');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COD' | 'PREPAID'>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [lastDelivered, setLastDelivered] = useState<Shipment | null>(null);
  const [assigningShipment, setAssigningShipment] = useState<Shipment | null>(null);

  const deliveryCouriers = users.filter(u => u.role === 'COURIER_DELIVERY' || u.role === 'COURIER');
  const [selectedCourierId, setSelectedCourierId] = useState<string>(deliveryCouriers[0]?.id || '');
  const scanRef = useRef<HTMLInputElement>(null);

  // All office destination shipments
  const officeDestinationShipments = shipments.filter(s => {
    if (!currentUser.officeId) return true;
    return s.destinationOfficeId === currentUser.officeId;
  });

  // Ready shipments at destination
  const readyShipments = officeDestinationShipments.filter(s => s.status === 'AT_DESTINATION');
  // Out for local delivery
  const outForDeliveryShipments = officeDestinationShipments.filter(s => s.status === 'OUT_FOR_DELIVERY');
  // Completed shipments
  const completedShipments = officeDestinationShipments.filter(s => s.status === 'DELIVERED_PENDING_SETTLEMENT' || s.status === 'CLOSED');

  // Filter list based on Tab, Payment, Courier & Search
  const filteredShipments = officeDestinationShipments.filter((s: Shipment) => {
    // Tab Status Filter
    if (activeTab === 'READY' && s.status !== 'AT_DESTINATION') return false;
    if (activeTab === 'OUT_DELIVERY' && s.status !== 'OUT_FOR_DELIVERY') return false;
    if (activeTab === 'COMPLETED' && (s.status !== 'DELIVERED_PENDING_SETTLEMENT' && s.status !== 'CLOSED')) return false;

    // Payment Filter
    if (paymentFilter === 'COD' && (s.packageType === 'PREPAID' || s.codAmount === 0)) return false;
    if (paymentFilter === 'PREPAID' && s.packageType !== 'PREPAID' && s.codAmount > 0) return false;

    // Courier Filter
    if (courierFilter !== 'ALL' && s.courierId !== courierFilter) return false;

    // Search Query
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        s.trackingNumber.toLowerCase().includes(q) ||
        s.recipientName.toLowerCase().includes(q) ||
        s.recipientPhone.toLowerCase().includes(q) ||
        s.sellerName.toLowerCase().includes(q) ||
        s.destinationCity.toLowerCase().includes(q) ||
        (s.destinationAddress || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    return true;
  });

  const totalCODCollectedToday = completedShipments.reduce((sum: number, s: Shipment) => sum + (s.codAmount || 0), 0);
  const totalCODReady = readyShipments.reduce((sum: number, s: Shipment) => sum + (s.codAmount || 0), 0);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim().replace(/\*/g, '').toUpperCase();
    if (!code) return;

    const found = readyShipments.find((s: Shipment) => s.trackingNumber.toUpperCase() === code) ||
                  outForDeliveryShipments.find((s: Shipment) => s.trackingNumber.toUpperCase() === code);
    if (!found) {
      setScanError(`Dërgesa "${code}" nuk u gjet te dërgesat e zyrës suaj.`);
      setTimeout(() => setScanError(''), 3500);
      setScanInput('');
      return;
    }

    deliverShipmentAndCollectCOD(found.id);
    setLastDelivered(found);
    setScanInput('');
    setScanError('');
    scanRef.current?.focus();
  };

  const executeDelivery = (shipment: Shipment) => {
    deliverShipmentAndCollectCOD(shipment.id);
    setLastDelivered(shipment);
  };

  const handleAssignCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningShipment || !selectedCourierId) return;
    assignDeliveryCourier(assigningShipment.id, selectedCourierId);
    setAssigningShipment(null);
  };

  return (
    <main className="w-full space-y-6">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f6d55c] text-slate-950">
            Zyra Postare & Sporteli
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-white mt-1.5">Dorëzimi Përfundimtar & Caktimi i Kurierit</h1>
          <p className="text-xs font-bold text-slate-400">Tabela e menaxhimit të dorëzimeve në sportel dhe caktimit te kurierët lokalë ({currentUser.officeName || 'Zyrë Destinacioni'})</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-md flex-shrink-0">
          <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase">Gati në Zyrë</p>
          <p className="text-2xl font-black text-indigo-700">{readyShipments.length}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatALL(totalCODReady)} COD</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase">Tek Kurieri Lokal</p>
          <p className="text-2xl font-black text-purple-700">{outForDeliveryShipments.length}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Në Dërgim Adrese</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase">Të Dorëzuara Sot</p>
          <p className="text-2xl font-black text-emerald-600">{completedShipments.length}</p>
          <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Dorëzuar me sukses</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase">COD i Mbledhur</p>
          <p className="text-lg sm:text-xl font-black text-emerald-700">{formatALL(totalCODCollectedToday)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Arkëtuar në zyrë/kurier</p>
        </div>
      </div>

      {/* Barcode Scanner & Direct Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md space-y-3">
        <form onSubmit={handleScanSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
            <input
              ref={scanRef}
              type="text"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              placeholder="Skano barkodin ose shkruaj AL-XXXXXX për dorëzim të menjëhershëm në sportel..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-[#f6d55c] font-black rounded-2xl text-xs shadow-md border border-slate-800 transition active:scale-95 flex items-center gap-1.5 flex-shrink-0"
          >
            <Check className="w-4 h-4" /> Dorëzo
          </button>
        </form>

        {scanError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2 text-xs font-bold text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {scanError}
          </div>
        )}
      </div>

      {/* ── Filters Toolbar ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-4">
        
        {/* Status Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('READY')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition ${
                activeTab === 'READY'
                  ? 'bg-slate-950 text-[#f6d55c] border-slate-800 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Gati në Zyrë
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'READY' ? 'bg-[#f6d55c] text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                {readyShipments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('OUT_DELIVERY')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition ${
                activeTab === 'OUT_DELIVERY'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Tek Kurieri Lokal
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'OUT_DELIVERY' ? 'bg-white text-purple-900' : 'bg-slate-200 text-slate-700'}`}>
                {outForDeliveryShipments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition ${
                activeTab === 'COMPLETED'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Të Dorëzuara & Arkëtuara
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'COMPLETED' ? 'bg-white text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                {completedShipments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Të Gjitha</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'ALL' ? 'bg-white text-indigo-900' : 'bg-slate-200 text-slate-700'}`}>
                {officeDestinationShipments.length}
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns & Live Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Live Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Kërko me kod, marrës, telefon..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition"
            />
          </div>

          {/* Payment Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black text-slate-500 flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5" /> Pagesa:
            </label>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-400"
            >
              <option value="ALL">Të gjitha Llojet</option>
              <option value="COD">Vetëm COD</option>
              <option value="PREPAID">Vetëm Parapaguar (JO COD)</option>
            </select>
          </div>

          {/* Courier Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black text-slate-500 flex items-center gap-1 flex-shrink-0">
              <Truck className="w-3.5 h-3.5" /> Kurieri:
            </label>
            <select
              value={courierFilter}
              onChange={e => setCourierFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-400"
            >
              <option value="ALL">Të gjithë Kurierët</option>
              {deliveryCouriers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ── DATA TABLE ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
        {filteredShipments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto">
              <PackageCheck className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-black text-slate-950 text-sm">Nuk ka dërgesa në tabelë për këtë filtër.</p>
            <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto">
              Provo të zgjedhësh një tab ose filtër tjetër për të parë pakot e zyrës.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4"># Kode & Lloji</th>
                  <th className="py-3.5 px-4">Marrësi & Telefoni</th>
                  <th className="py-3.5 px-4">Adresa / Qyteti</th>
                  <th className="py-3.5 px-4">Shitësi / Dërguesi</th>
                  <th className="py-3.5 px-4 text-right">Vlera COD</th>
                  <th className="py-3.5 px-4">Statusi</th>
                  <th className="py-3.5 px-4 text-center">Veprimet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {filteredShipments.map((s: Shipment, idx: number) => {
                  const isCOD = s.packageType !== 'PREPAID' && s.codAmount > 0;
                  const isDone = s.status === 'DELIVERED_PENDING_SETTLEMENT' || s.status === 'CLOSED';
                  const isOut = s.status === 'OUT_FOR_DELIVERY';

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isDone
                          ? 'bg-emerald-50/20'
                          : isOut
                          ? 'bg-purple-50/20'
                          : ''
                      }`}
                    >
                      {/* Tracking & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-black text-xs w-4 text-center">{idx + 1}</span>
                          <div>
                            <span className="font-mono font-black text-slate-950 text-xs tracking-wider block">
                              {s.trackingNumber}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border inline-block mt-0.5 ${
                              isCOD
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            }`}>
                              {isCOD ? 'COD' : 'PARAPAGUAR'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-black text-slate-950">{s.recipientName}</p>
                          <a href={`tel:${s.recipientPhone}`} className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline text-[11px]">
                            <Phone className="w-3 h-3" /> {s.recipientPhone}
                          </a>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="space-y-0.5">
                          <p className="text-slate-900 font-bold truncate">{s.destinationAddress || '—'}</p>
                          <span className="inline-block text-[9px] uppercase font-black text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {s.destinationCity}
                          </span>
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{s.sellerName}</span>
                      </td>

                      {/* COD Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-black text-xs sm:text-sm ${isCOD ? 'text-amber-600' : 'text-slate-400'}`}>
                          {isCOD ? formatALL(s.codAmount) : '0 ALL'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isDone ? (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dorëzuar
                          </span>
                        ) : isOut ? (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 w-fit">
                            <Truck className="w-3 h-3 text-purple-700" /> {s.courierName || 'Kurier Lokal'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-indigo-600" /> Gati në Zyrë
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {!isDone ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => setAssigningShipment(s)}
                              className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-xl text-[11px] font-black border border-indigo-200 transition flex items-center gap-1 shadow-xs"
                              title="Cakto Kurierin Lokal"
                            >
                              <Truck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Cakto Kurierin</span>
                            </button>

                            <button
                              onClick={() => executeDelivery(s)}
                              className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black shadow-xs transition active:scale-95 flex items-center gap-1 border ${
                                isCOD
                                  ? 'bg-[#f6d55c] hover:bg-amber-400 text-slate-950 border-amber-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                              }`}
                              title="Dorëzo në Sportel"
                            >
                              {isCOD ? <DollarSign className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              <span>Sportel</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setLastDelivered(s)}
                            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold border border-slate-200 transition inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Mandati</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500 font-bold">
          <span>Duke shfaqur {filteredShipments.length} nga {officeDestinationShipments.length} dërgesa gjithsej në këtë zyrë</span>
          <span>COD Gjithsej në Tabelë: {formatALL(filteredShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0))}</span>
        </div>
      </div>

      {/* MODAL: ASSIGN LOCAL DELIVERY COURIER */}
      {assigningShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-black text-sm text-slate-950 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Cakto Kurierin e Dorëzimit Lokal</span>
              </span>
              <button onClick={() => setAssigningShipment(null)} className="text-slate-400 hover:text-slate-950 font-black text-sm">✕</button>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs space-y-1 text-indigo-950 font-semibold">
              <p><strong className="font-black">Dërgesa:</strong> {assigningShipment.trackingNumber}</p>
              <p><strong className="font-black">Marrësi:</strong> {assigningShipment.recipientName} ({assigningShipment.destinationCity})</p>
              <p><strong className="font-black">COD:</strong> {formatALL(assigningShipment.codAmount)}</p>
            </div>

            <form onSubmit={handleAssignCourier} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 font-black mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Zgjidh Kurierin e Dorëzimit Lokal
                </label>
                {deliveryCouriers.length === 0 ? (
                  <p className="text-red-600 text-xs">Nuk ka kurierë lokalë aktivë.</p>
                ) : (
                  <select
                    value={selectedCourierId}
                    onChange={e => setSelectedCourierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-3 text-sm text-slate-950 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {deliveryCouriers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.role === 'COURIER_DELIVERY' ? '(Kurier Dorëzimi Lokal)' : '(Kurier)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningShipment(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs"
                >
                  Anullo
                </button>
                <button
                  type="submit"
                  disabled={!selectedCourierId}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md border border-indigo-700 transition active:scale-95 disabled:opacity-50"
                >
                  Cakto Kurierin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL & RECEIPT PRINT */}
      {lastDelivered && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-black text-xs text-slate-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Dorëzimi u Krye me Sukses!</span>
              </span>
              <button onClick={() => setLastDelivered(null)} className="text-slate-400 hover:text-slate-950 font-black text-sm">✕</button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
              <p className="font-black text-slate-950 text-sm border-b border-slate-200 pb-1">
                Kodi: {lastDelivered.trackingNumber}
              </p>
              <p><strong className="text-slate-950">Marrësi:</strong> {lastDelivered.recipientName}</p>
              <p><strong className="text-slate-950">Telefon:</strong> {lastDelivered.recipientPhone}</p>
              <p><strong className="text-slate-950">Shitësi:</strong> {lastDelivered.sellerName}</p>
              <p className="pt-1 border-t border-slate-200">
                <strong className="text-slate-950">Vlera e Mbledhur:</strong>{' '}
                <span className="font-black text-emerald-700 text-sm">
                  {lastDelivered.packageType === 'PREPAID' ? 'JO COD (0 ALL)' : formatALL(lastDelivered.codAmount)}
                </span>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setLastDelivered(null)}
                className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs"
              >
                Mbyll
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 py-3 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md border border-amber-300 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Printo Mandatin</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
