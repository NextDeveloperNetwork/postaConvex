'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { Shipment } from '@/lib/types';
import { ALBANIAN_CITIES } from '@/lib/constants';

import { WorkflowTracker } from '@/components/workflow-tracker';
import {
  PackagePlus,
  Package,
  Search,
  Filter,
  Printer,
  XCircle,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Store,
  UserCheck,
  X,
  Plus,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CREATED:                      { label: 'Krijuar',   color: 'bg-slate-100 text-slate-600 border-slate-300' },
  PICKED_UP:                    { label: 'Marrë',     color: 'bg-amber-100 text-amber-800 border-amber-300' },
  IN_TRANSIT:                   { label: 'Tranzit',   color: 'bg-blue-100 text-blue-800 border-blue-300' },
  AT_DESTINATION:               { label: 'Arritur',   color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  OUT_FOR_DELIVERY:             { label: 'Dërgim',    color: 'bg-purple-100 text-purple-800 border-purple-300' },
  DELIVERED_PENDING_SETTLEMENT: { label: 'Dorëzuar',  color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  CLOSED:                       { label: 'Mbyllur',   color: 'bg-slate-200 text-slate-700 border-slate-400' },
  CANCELLED:                    { label: 'Anulluar',  color: 'bg-red-100 text-red-700 border-red-300' },
};

export default function OfficeShipmentsPage() {

  const { t, formatALL } = useI18n();
  const { offices, users, createShipment, cancelShipment, deleteShipment, shipments, cities: dbCities, currentUser } = useAuthenticatedState();
  const cities = dbCities && dbCities.length > 0 ? dbCities.map(c => c.name) : ALBANIAN_CITIES;


  // ── Dialog state ──────────────────────────────────────────
  const [showDialog, setShowDialog] = useState(false);
  const [senderType, setSenderType] = useState<'REGISTERED' | 'WALKIN'>('REGISTERED');
  const [packageType, setPackageType] = useState<'COD' | 'PREPAID'>('COD');
  const [deliveryMode, setDeliveryMode] = useState<'DOOR_DELIVERY' | 'OFFICE_PICKUP'>('DOOR_DELIVERY');
  const [intakeType, setIntakeType] = useState<'PICKUP' | 'AT_DESTINATION'>('PICKUP');
  const sellers = users.filter(u => u.role === 'SELLER');
  const [selectedSellerId, setSelectedSellerId] = useState(sellers[0]?.id || '');
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [destinationCity, setDestinationCity] = useState('Tirane');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationOfficeId, setDestinationOfficeId] = useState(offices[0]?.id || '');
  const [originOfficeId, setOriginOfficeId] = useState(currentUser.officeId || offices[0]?.id || '');
  const [codAmount, setCodAmount] = useState<number>(5000);
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(null);

  const handleCityChange = (newCity: string) => {
    setDestinationCity(newCity);
    const matched = offices.find(o => o.city.toLowerCase() === newCity.toLowerCase());
    if (matched) {
      setDestinationOfficeId(matched.id);
    } else if (offices.length > 0) {
      setDestinationOfficeId(offices[0].id);
    }
  };

  const handleOfficeChange = (officeId: string) => {
    setDestinationOfficeId(officeId);
    const matched = offices.find(o => o.id === officeId);
    if (matched) {
      setDestinationCity(matched.city);
    }
  };

  // ── Table state ───────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingShipment, setCancellingShipment] = useState<Shipment | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);
  const [barcodeShipment, setBarcodeShipment] = useState<Shipment | null>(null);

  // ── Data (Packages originated at or handled by this office) ─────
  const officeShipments = shipments.filter(s =>
    s.originOfficeId === currentUser.officeId ||
    !currentUser.officeId ||
    currentUser.role === 'FINANCE_ADMIN' ||
    currentUser.role === 'ADMIN'
  );

  const filteredShipments = officeShipments.filter(s => {
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destinationCity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesPayment =
      paymentTypeFilter === 'ALL' ||
      (paymentTypeFilter === 'PREPAID' && s.packageType === 'PREPAID') ||
      (paymentTypeFilter === 'COD' && s.packageType !== 'PREPAID');
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // ── Handlers ─────────────────────────────────────────────
  const openDialog = () => {
    setWalkinName(''); setWalkinPhone('');
    setRecipientName(''); setRecipientPhone('');
    setDestinationAddress(''); setCodAmount(5000);
    setPackageType('COD'); setSenderType('REGISTERED');
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !destinationAddress) return;

    let sellerId: string | null = null; // null = walk-in client (no registered seller)
    let senderName = walkinName;
    let senderPhone = walkinPhone;

    if (senderType === 'REGISTERED') {
      const sellerObj = sellers.find(s => s.id === selectedSellerId);
      if (sellerObj) {
        sellerId = sellerObj.id;
        senderName = sellerObj.name;
        senderPhone = '+355 69 123 4567';
      } else {
        senderName = 'Shitës i Regjistruar';
        senderPhone = '+355 69 000 0000';
      }
    }

    const newShipment = await createShipment({
      senderName: senderName || 'Dërgues Zyre',
      senderPhone: senderPhone || '+355 69 000 0000',
      recipientName,
      recipientPhone,
      destinationCity,
      destinationAddress,
      originOfficeId,
      destinationOfficeId,
      codAmount: packageType === 'PREPAID' ? 0 : Number(codAmount),
      packageType,
      deliveryMode,
      sellerId: sellerId || undefined,
      initialStatus: 'CREATED',
    });

    setShowDialog(false);
    setCreatedShipment(newShipment);
  };

  const handleConfirmCancel = () => {
    if (!cancellingShipment) return;
    cancelShipment(cancellingShipment.id, 'Anulluar nga Zyra Postare e Origjinës');
    setCancellingShipment(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingShipment) return;
    deleteShipment(deletingShipment.id);
    setDeletingShipment(null);
  };

  return (
    <main className="w-full space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.office}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Dërgesat e Zyrës</h1>
          <p className="text-xs font-bold text-slate-700 mt-0.5">
            {currentUser.officeName || 'Zyra Qendrore'} — {officeShipments.length} dërgesa
          </p>
        </div>
        <button
          onClick={openDialog}
          className="flex items-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-[#f6d55c] font-black text-xs rounded-2xl shadow-lg border border-slate-800 transition active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Shto të Re</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Kërko tracking, marrës, dërgues, qytet..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={paymentTypeFilter}
            onChange={e => setPaymentTypeFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-950 font-bold focus:outline-none"
          >
            <option value="ALL">Të gjitha</option>
            <option value="COD">COD</option>
            <option value="PREPAID">Jo COD</option>
          </select>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-950 font-bold focus:outline-none"
            >
              <option value="ALL">Të gjitha Statuset</option>
              <option value="CREATED">Krijuar</option>
              <option value="PICKED_UP">Marrë në Zyrë</option>
              <option value="IN_TRANSIT">Tranzit</option>
              <option value="AT_DESTINATION">Arritur</option>
              <option value="OUT_FOR_DELIVERY">Dërgim</option>
              <option value="DELIVERED_PENDING_SETTLEMENT">Dorëzuar</option>
              <option value="CLOSED">Mbyllur</option>
              <option value="CANCELLED">Anulluar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {filteredShipments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-200" />
            <p className="font-black text-slate-400 text-sm">Nuk u gjet asnjë dërgesë.</p>
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow border border-amber-300 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Shto Dërgesë të Re
            </button>
          </div>
        ) : (
          <>
            {/* Table header - desktop */}
            <div className="hidden lg:grid grid-cols-[1.8fr_1.4fr_1.2fr_0.8fr_0.8fr_1fr_auto] border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>Tracking / Dërgues</span>
              <span>Marrësi</span>
              <span>Destinacioni</span>
              <span>Tipi</span>
              <span>Vlera</span>
              <span>Statusi</span>
              <span className="w-24" />
            </div>

            <div className="divide-y divide-slate-100">
              {filteredShipments.map(s => {
                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.CREATED;
                const isPrepaid = s.packageType === 'PREPAID';
                const isCancelled = s.status === 'CANCELLED';
                const canBeCancelled = s.status === 'CREATED';
                const canBeDeleted = s.status === 'CREATED' || s.status === 'CANCELLED';
                const isExpanded = expandedId === s.id;

                return (
                  <React.Fragment key={s.id}>
                    <div
                      className={`grid grid-cols-1 lg:grid-cols-[1.8fr_1.4fr_1.2fr_0.8fr_0.8fr_1fr_auto] px-4 py-3.5 items-center transition cursor-pointer select-none ${
                        isExpanded ? 'bg-amber-50/60' : isCancelled ? 'bg-red-50/20 opacity-75 hover:opacity-100' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      {/* Tracking + Sender */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-950">{s.trackingNumber}</span>
                          {!isCancelled && (
                            <button
                              onClick={e => { e.stopPropagation(); setBarcodeShipment(s); }}
                              className="py-0.5 px-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 hover:bg-[#f6d55c] hover:border-amber-300 transition flex items-center gap-1"
                            >
                              <Printer className="w-2.5 h-2.5" /> Barkodi
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{s.sellerName}</p>
                      </div>

                      {/* Recipient */}
                      <div className="min-w-0 mt-1.5 lg:mt-0">
                        <p className="font-black text-xs text-slate-950 truncate">{s.recipientName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{s.recipientPhone}</p>
                      </div>

                      {/* Destination */}
                      <div className="min-w-0 mt-1.5 lg:mt-0">
                        <p className="font-bold text-[11px] text-slate-700 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />{s.destinationCity}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate ml-4">{s.destinationOfficeName}</p>
                      </div>

                      {/* Type */}
                      <div className="mt-1 lg:mt-0">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${isPrepaid ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                          {isPrepaid ? 'JO COD' : 'COD'}
                        </span>
                      </div>

                      {/* Value */}
                      <div className="mt-1 lg:mt-0">
                        {isPrepaid
                          ? <p className="font-black text-xs text-emerald-700">{formatALL(s.shippingFee)}</p>
                          : <div>
                              <p className="font-black text-xs text-slate-950">{formatALL(s.codAmount)}</p>
                              <p className="text-[9px] text-emerald-600 font-bold">{formatALL(s.sellerNet)} net</p>
                            </div>
                        }
                      </div>

                      {/* Status */}
                      <div className="mt-1.5 lg:mt-0">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{s.createdAt.split('T')[0]}</p>
                      </div>

                      {/* Actions + Chevron */}
                      <div className="flex items-center gap-1.5 mt-2 lg:mt-0 justify-end">
                        {canBeCancelled && (
                          <button onClick={e => { e.stopPropagation(); setCancellingShipment(s); }}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition" title="Anullo">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canBeDeleted && (
                          <button onClick={e => { e.stopPropagation(); setDeletingShipment(s); }}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition" title="Fshi">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className={`w-7 h-7 flex items-center justify-center rounded-xl border transition ${isExpanded ? 'bg-amber-400 border-amber-500 text-slate-950' : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'}`}>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded — WorkflowTracker */}
                    {isExpanded && (
                      <div className="border-t border-amber-100 bg-amber-50/30 px-5 py-4">
                        <WorkflowTracker currentStatus={s.status} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CREATE SHIPMENT DIALOG (same style as seller)
      ═══════════════════════════════════════════════════════ */}
      {showDialog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">

            {/* Dialog header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-amber-600" />
                <h2 className="font-black text-slate-950 text-base">Krijo Dërgesë të Re</h2>
              </div>
              <button onClick={() => setShowDialog(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-bold">

              {/* Service Logistics Type: Pick Up vs At Destination */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-black uppercase text-[10px]">Lloji i Shërbimit (Logjistika)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setIntakeType('PICKUP')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${intakeType === 'PICKUP' ? 'bg-[#f6d55c] border-amber-300 text-slate-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    🚚 Pick Up (Origjinë)
                  </button>
                  <button type="button" onClick={() => setIntakeType('AT_DESTINATION')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${intakeType === 'AT_DESTINATION' ? 'bg-indigo-100 border-indigo-300 text-indigo-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    📍 At Destination
                  </button>
                </div>
              </div>

              {/* Sender Type */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-black uppercase text-[10px]">Lloji i Dërguesit</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSenderType('REGISTERED')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${senderType === 'REGISTERED' ? 'bg-[#f6d55c] border-amber-300 text-slate-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <Store className="w-3.5 h-3.5" /> Merchant
                  </button>
                  <button type="button" onClick={() => setSenderType('WALKIN')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${senderType === 'WALKIN' ? 'bg-[#f6d55c] border-amber-300 text-slate-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <UserCheck className="w-3.5 h-3.5" /> Walk-in
                  </button>
                </div>
              </div>

              {/* Sender fields */}
              {senderType === 'REGISTERED' ? (
                <div>
                  <label className="block text-slate-700 font-black mb-1.5">Shitësi (Merchant)</label>
                  <select value={selectedSellerId} onChange={e => setSelectedSellerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition">
                    {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-black mb-1.5">Emri Dërguesit</label>
                    <input type="text" required placeholder="Agim Krasniqi" value={walkinName} onChange={e => setWalkinName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-black mb-1.5">Telefon</label>
                    <input type="text" required placeholder="+355 69..." value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition" />
                  </div>
                </div>
              )}

              {/* Payment type */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-black uppercase text-[10px]">Lloji i Pagesës</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPackageType('COD')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${packageType === 'COD' ? 'bg-amber-50 border-amber-400 text-slate-950' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <DollarSign className="w-3.5 h-3.5" /> COD (Dorëzim)
                  </button>
                  <button type="button" onClick={() => setPackageType('PREPAID')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${packageType === 'PREPAID' ? 'bg-emerald-50 border-emerald-400 text-slate-950' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <CreditCard className="w-3.5 h-3.5" /> Jo COD (Parapaguar)
                  </button>
                </div>
              </div>

              {/* Recipient */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black mb-1.5">Emri i Marrësit</label>
                  <input type="text" required placeholder="Besnik Meta" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition" />
                </div>
                <div>
                  <label className="block text-slate-700 font-black mb-1.5">Numri i Telefonit</label>
                  <input type="text" required placeholder="+355 69 987 6543" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition" />
                </div>
              </div>

              {/* Origin Intake Office */}
              <div>
                <label className="block text-slate-700 font-black mb-1.5">Zyra e Pranimit (Origjina ku dorëzohet pakoja)</label>
                <select value={originOfficeId} onChange={e => setOriginOfficeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition">
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name} ({o.city})</option>)}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-slate-700 font-black mb-1.5">Qyteti i Destinacionit</label>
                <select value={destinationCity} onChange={e => handleCityChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition">
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-700 font-black mb-1.5">Adresa e Plotë</label>
                <input type="text" required placeholder="e.g. Lagja 4, Rruga Ecuria, Nr. 12" value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition" />
              </div>

              {/* Destination Office */}
              <div>
                <label className="block text-slate-700 font-black mb-1.5">Zyra e Destinacionit (Zyra Postare e Destinacionit)</label>
                <select value={destinationOfficeId} onChange={e => handleOfficeChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] transition">
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name} ({o.city})</option>)}
                </select>
              </div>


              {/* COD amount */}
              {packageType === 'COD' ? (
                <div>
                  <label className="block text-slate-700 font-black mb-1.5">Vlera COD (Para në dorë)</label>
                  <input type="number" required min="0" step="500" value={codAmount} onChange={e => setCodAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-emerald-700 font-black text-sm focus:outline-none focus:border-[#f6d55c] transition" />
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-[11px] font-semibold">
                  Pako parapaguar. Arkëtoni <strong>300 ALL tarifë postare</strong> nga dërguesi.
                </div>
              )}

              {/* Submit */}
              <button type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-sm shadow border border-amber-300 flex items-center justify-center gap-2 transition active:scale-95">
                <PackagePlus className="w-4 h-4" /> Regjistro Dërgesën
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Barcode Modal ───────────────────────────────── */}
      {(createdShipment || barcodeShipment) && (() => {
        const s = createdShipment || barcodeShipment!;
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-black text-sm text-slate-950 flex items-center gap-2">
                  {createdShipment && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {createdShipment ? 'Dërgesa u Krijua!' : 'Etiketa e Dërgesës'}
                </span>
                <button onClick={() => { setCreatedShipment(null); setBarcodeShipment(null); }}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">✕</button>
              </div>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 space-y-3 text-center">
                <p className="font-black text-xs text-slate-950 uppercase tracking-widest">POSTA SHQIPTARE</p>
                <div className="bg-slate-950 text-white font-mono tracking-[0.3em] font-black text-xl py-3 px-4 rounded-xl">{s.barcode}</div>
                <p className="font-black text-sm text-slate-950">{s.trackingNumber}</p>
                <div className="text-[11px] font-semibold text-slate-700 text-left space-y-1 pt-2 border-t border-slate-200">
                  <p><span className="font-black">Lloji:</span> {s.packageType === 'PREPAID' ? 'JO COD (Parapaguar)' : 'COD (Pagesë në Dorëzim)'}</p>
                  <p><span className="font-black">Dërguesi:</span> {s.sellerName}</p>
                  <p><span className="font-black">Marrësi:</span> {s.recipientName} ({s.destinationCity})</p>
                  <p><span className="font-black">{s.packageType === 'PREPAID' ? 'Tarifa:' : 'COD:'}</span> <span className="text-emerald-700 font-black">{formatALL(s.packageType === 'PREPAID' ? s.shippingFee : s.codAmount)}</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCreatedShipment(null); setBarcodeShipment(null); }}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs transition">Mbyll</button>
                <button onClick={() => window.print()}
                  className="flex-1 py-3 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs shadow border border-amber-300 flex items-center justify-center gap-1.5 transition">
                  <Printer className="w-4 h-4" /> Printo
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Cancel Modal ────────────────────────────────── */}
      {cancellingShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-amber-300 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-950">A jeni i sigurt?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po anulloni dërgesën <strong>{cancellingShipment.trackingNumber}</strong>.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCancellingShipment(null)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs transition">Kthehu</button>
              <button onClick={handleConfirmCancel} className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow transition active:scale-95">Po, Anulloje</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ────────────────────────────────── */}
      {deletingShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-950">Fshij Dërgesën?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po fshini përfundimisht <strong>{deletingShipment.trackingNumber}</strong>.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeletingShipment(null)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs transition">Kthehu</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow transition active:scale-95">Po, Fshije</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
