'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { Shipment } from '@/lib/types';
import {
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
  Building2,
} from 'lucide-react';
import { WorkflowTracker } from '@/components/workflow-tracker';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CREATED:                      { label: 'Krijuar',           color: 'bg-slate-100 text-slate-600 border-slate-300' },
  PICKED_UP:                    { label: 'Marrë',             color: 'bg-amber-100 text-amber-800 border-amber-300' },
  IN_TRANSIT:                   { label: 'Tranzit',           color: 'bg-blue-100 text-blue-800 border-blue-300' },
  AT_DESTINATION:               { label: 'Arritur',           color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  OUT_FOR_DELIVERY:             { label: 'Dërgim',            color: 'bg-purple-100 text-purple-800 border-purple-300' },
  DELIVERED_PENDING_SETTLEMENT: { label: 'Dorëzuar',          color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  CLOSED:                       { label: 'Mbyllur',           color: 'bg-slate-200 text-slate-700 border-slate-400' },
  CANCELLED:                    { label: 'Anulluar',          color: 'bg-red-100 text-red-700 border-red-300' },
};

const STATUS_STEPS = [
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'AT_DESTINATION',
  'OUT_FOR_DELIVERY',
  'DELIVERED_PENDING_SETTLEMENT',
  'CLOSED',
];

export default function OfficeShipmentsListPage() {
  const { t, formatALL } = useI18n();
  const { currentUser, shipments, cancelShipment, deleteShipment } = useAuthenticatedState();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedBarcodeShipment, setSelectedBarcodeShipment] = useState<Shipment | null>(null);
  const [cancellingShipment, setCancellingShipment] = useState<Shipment | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);

  const officeShipments = shipments.filter(s =>
    s.originOfficeId === currentUser.officeId ||
    s.destinationOfficeId === currentUser.officeId ||
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

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

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
            {currentUser.officeName || 'Zyra Qendrore'} — {filteredShipments.length} dërgesa
          </p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <Package className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
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
          <div className="p-12 text-center">
            <Package className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="font-black text-slate-400 text-sm">Nuk u gjet asnjë dërgesë.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden lg:grid grid-cols-[1.8fr_1.4fr_1.2fr_0.8fr_0.8fr_1fr_auto] gap-0 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>Tracking / Dërgues</span>
              <span>Marrësi</span>
              <span>Destinacioni</span>
              <span>Tipi</span>
              <span>Vlera</span>
              <span>Statusi</span>
              <span className="w-8" />
            </div>

            <div className="divide-y divide-slate-100">
              {filteredShipments.map(s => {
                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.CREATED;
                const isPrepaid = s.packageType === 'PREPAID';
                const isCancelled = s.status === 'CANCELLED';
                const canBeCancelled = s.status === 'CREATED';
                const canBeDeleted = s.status === 'CREATED' || s.status === 'CANCELLED';
                const isExpanded = expandedId === s.id;
                const stepIdx = STATUS_STEPS.indexOf(s.status);

                return (
                  <React.Fragment key={s.id}>
                    {/* Main row */}
                    <div
                      className={`grid grid-cols-1 lg:grid-cols-[1.8fr_1.4fr_1.2fr_0.8fr_0.8fr_1fr_auto] gap-0 px-4 py-3.5 items-center transition cursor-pointer select-none ${
                        isExpanded
                          ? 'bg-amber-50/60'
                          : isCancelled
                          ? 'bg-red-50/30 opacity-75 hover:opacity-100'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => toggleExpand(s.id)}
                    >
                      {/* Col 1: Tracking + Sender */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-950">{s.trackingNumber}</span>
                          {!isCancelled && (
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedBarcodeShipment(s); }}
                              className="py-0.5 px-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 hover:bg-[#f6d55c] hover:border-amber-300 transition flex items-center gap-1"
                            >
                              <Printer className="w-2.5 h-2.5" /> Barkodi
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{s.sellerName}</p>
                      </div>

                      {/* Col 2: Recipient */}
                      <div className="min-w-0 mt-1.5 lg:mt-0">
                        <p className="font-black text-xs text-slate-950 truncate">{s.recipientName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{s.recipientPhone}</p>
                      </div>

                      {/* Col 3: Destination */}
                      <div className="min-w-0 mt-1.5 lg:mt-0">
                        <p className="font-bold text-[11px] text-slate-700 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                          {s.destinationCity}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate ml-4">{s.destinationOfficeName}</p>
                      </div>

                      {/* Col 4: Type */}
                      <div className="mt-1 lg:mt-0">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                          isPrepaid
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isPrepaid ? 'JO COD' : 'COD'}
                        </span>
                      </div>

                      {/* Col 5: Value */}
                      <div className="mt-1 lg:mt-0">
                        {isPrepaid ? (
                          <p className="font-black text-xs text-emerald-700">{formatALL(s.shippingFee)}</p>
                        ) : (
                          <div>
                            <p className="font-black text-xs text-slate-950">{formatALL(s.codAmount)}</p>
                            <p className="text-[9px] text-emerald-600 font-bold">{formatALL(s.sellerNet)} net</p>
                          </div>
                        )}
                      </div>

                      {/* Col 6: Status */}
                      <div className="mt-1.5 lg:mt-0">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{s.createdAt.split('T')[0]}</p>
                      </div>

                      {/* Col 7: Chevron + actions */}
                      <div className="flex items-center gap-1.5 mt-2 lg:mt-0 justify-end">
                        {canBeCancelled && (
                          <button
                            onClick={e => { e.stopPropagation(); setCancellingShipment(s); }}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition"
                            title="Anullo"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canBeDeleted && (
                          <button
                            onClick={e => { e.stopPropagation(); setDeletingShipment(s); }}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition"
                            title="Fshi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className={`w-7 h-7 flex items-center justify-center rounded-xl border transition ${
                          isExpanded
                            ? 'bg-amber-400 border-amber-500 text-slate-950'
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                        }`}>
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Expanded: Workflow Tracker */}
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

      {/* CANCEL MODAL */}
      {cancellingShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-300 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-950">A jeni i sigurt?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po anulloni dërgesën <span className="font-black text-slate-950">{cancellingShipment.trackingNumber}</span> për <span className="font-black">{cancellingShipment.recipientName}</span>.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCancellingShipment(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs transition">
                Kthehu
              </button>
              <button onClick={handleConfirmCancel}
                className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95">
                Po, Anulloje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-950">Fshij Dërgesën?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po fshini përfundimisht dërgesën <span className="font-black text-slate-950">{deletingShipment.trackingNumber}</span>.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeletingShipment(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs transition">
                Kthehu
              </button>
              <button onClick={handleConfirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition active:scale-95">
                Po, Fshije
              </button>
            </div>
          </div>
        </div>
      )}

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
