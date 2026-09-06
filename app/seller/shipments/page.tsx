'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { WorkflowTracker } from '@/components/workflow-tracker';
import { Shipment } from '@/lib/types';
import { Package, Search, Filter, Printer, Clock, Building2, MapPin, XCircle, Trash2, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';

export default function SellerShipmentsPage() {
  const { t, formatALL } = useI18n();
  const { currentUser, shipments, cancelShipment, deleteShipment } = useAuthenticatedState();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('ALL');
  const [selectedBarcodeShipment, setSelectedBarcodeShipment] = useState<Shipment | null>(null);
  const [cancellingShipment, setCancellingShipment] = useState<Shipment | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);

  // Filter seller shipments strictly by matching current seller's ID or sellerName, never walk-in customer packages
  const sellerShipments = shipments.filter(s => {
    if (s.sellerId === 'walk-in') return false;
    if (currentUser.role === 'SELLER') {
      return s.sellerId === currentUser.id || s.sellerName === currentUser.name;
    }
    return s.sellerId === currentUser.id || s.sellerName === currentUser.name;
  });

  const filteredShipments = sellerShipments.filter(s => {
    const matchesSearch = 
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destinationCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesPayment = paymentTypeFilter === 'ALL' || 
      (paymentTypeFilter === 'PREPAID' && s.packageType === 'PREPAID') ||
      (paymentTypeFilter === 'COD' && s.packageType !== 'PREPAID');

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleConfirmCancel = () => {
    if (!cancellingShipment) return;
    cancelShipment(cancellingShipment.id);
    setCancellingShipment(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingShipment) return;
    deleteShipment(deletingShipment.id);
    setDeletingShipment(null);
  };

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.seller}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Dërgesat e Mia Postare</h1>
          <p className="text-xs font-bold text-slate-800">Gjurmimi në Kohë Reale, Filtrimi sipas Llojit të Pagesës dhe Menaxhimi i Pakove</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <Package className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Controls Header: Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>Lista e Pakove ({filteredShipments.length})</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Kërko me nr. tracking, marrës..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
              />
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <select
                value={paymentTypeFilter}
                onChange={e => setPaymentTypeFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-xs text-slate-950 font-bold focus:outline-none"
              >
                <option value="ALL">Të gjitha Pagesat</option>
                <option value="COD">COD (Pagesë në Dorëzim)</option>
                <option value="PREPAID">Jo COD (Parapaguar)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-xs text-slate-950 font-bold focus:outline-none"
              >
                <option value="ALL">Të gjitha Statuset</option>
                <option value="CREATED">Krijuar (Created)</option>
                <option value="PICKED_UP">Marrë nga Kurieri</option>
                <option value="IN_TRANSIT">Në Transit (In Transit)</option>
                <option value="AT_DESTINATION">Pranuar në Zyrën e Destinacionit</option>
                <option value="OUT_FOR_DELIVERY">Në Dorëzim (Out for Delivery)</option>
                <option value="DELIVERED_PENDING_SETTLEMENT">Dorëzuar (Pending Settlement)</option>
                <option value="CLOSED">Mbyllur (Closed)</option>
                <option value="CANCELLED">Anulluar (Cancelled)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments Cards */}
        <div className="space-y-4">
          {filteredShipments.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-600 text-xs font-bold">
              Nuk u gjet asnjë dërgesë sipas kritereve të zgjedhura.
            </div>
          ) : (
            filteredShipments.map(s => {
              const isPrepaid = s.packageType === 'PREPAID';
              const canBeCancelled = s.status === 'CREATED';
              const canBeDeleted = s.status === 'CREATED' || s.status === 'CANCELLED';
              const isCancelled = s.status === 'CANCELLED';

              return (
                <div key={s.id} className={`bg-slate-50 border rounded-3xl p-5 shadow-sm space-y-4 font-bold text-xs transition ${
                  isCancelled ? 'border-red-200 opacity-80' : 'border-slate-200 hover:border-amber-300'
                }`}>
                  
                  {/* Top Row: Tracking & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
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

                        {!isCancelled && (
                          <button
                            onClick={() => setSelectedBarcodeShipment(s)}
                            className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-[10px] font-black text-slate-900 hover:bg-[#f6d55c] transition flex items-center gap-1 shadow-xs"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Barkodi</span>
                          </button>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] font-semibold mt-0.5">Marrësi: {s.recipientName} ({s.recipientPhone})</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left sm:text-right">
                        {isPrepaid ? (
                          <>
                            <p className="text-slate-500 text-[10px]">Tarifa Postare:</p>
                            <p className="text-sm font-black text-emerald-800">{formatALL(s.shippingFee)} (Parapaguar)</p>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-500 text-[10px]">Vlera COD Total:</p>
                            <p className="text-sm font-black text-slate-950">{formatALL(s.codAmount)}</p>
                            <p className="text-[10px] text-emerald-700 font-black">Netto për Ju: {formatALL(s.sellerNet)}</p>
                          </>
                        )}
                      </div>

                      {/* Cancel & Delete Buttons */}
                      <div className="flex items-center gap-1.5 ml-2">
                        {canBeCancelled && (
                          <button
                            onClick={() => setCancellingShipment(s)}
                            className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                            title="Anullo dërgesën para marrjes nga kurieri"
                          >
                            <XCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>Anullo</span>
                          </button>
                        )}

                        {canBeDeleted && (
                          <button
                            onClick={() => setDeletingShipment(s)}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                            title="Fshi dërgesën e pa-nisur"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Fshi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tracking Stepper */}
                  <div className="py-2">
                    <WorkflowTracker currentStatus={s.status} />
                  </div>

                  {/* Footer Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-700 font-semibold">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Zyra: {s.destinationOfficeName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span>{s.destinationAddress} ({s.destinationCity})</span>
                      </span>
                    </div>
                    
                    <span className="text-slate-500">{s.createdAt.split('T')[0]}</span>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {cancellingShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-300 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-black text-base text-slate-950">A jeni i sigurt?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po anulloni dërgesën <span className="font-black text-slate-950">{cancellingShipment.trackingNumber}</span> për <span className="font-black text-slate-950">{cancellingShipment.recipientName}</span>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCancellingShipment(null)}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs"
              >
                Kthehu
              </button>
              <button
                onClick={handleConfirmCancel}
                className="w-1/2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
              >
                Po, Anulloje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-black text-base text-slate-950">Fshij Dërgesën e Pa-nisur</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po fshini përfundimisht nga sistemi dërgesën <span className="font-black text-slate-950">{deletingShipment.trackingNumber}</span> për <span className="font-black text-slate-950">{deletingShipment.recipientName}</span>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingShipment(null)}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs"
              >
                Kthehu
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition active:scale-95"
              >
                Po, Fshije
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE BARCODE MODAL */}
      {selectedBarcodeShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-black text-xs text-slate-950">Etiketa me Barkod</span>
              <button onClick={() => setSelectedBarcodeShipment(null)} className="text-slate-500 font-black text-sm">✕</button>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 space-y-3">
              <p className="font-black text-xs text-slate-950 uppercase tracking-widest">POSTA SHQIPTARE</p>
              <div className="bg-slate-950 text-white font-mono tracking-[0.3em] font-black text-xl py-3 px-4 rounded-xl shadow-inner">
                {selectedBarcodeShipment.barcode}
              </div>
              <p className="font-black text-sm text-slate-950">{selectedBarcodeShipment.trackingNumber}</p>
              <div className="text-[11px] font-semibold text-slate-700 text-left space-y-1 pt-2 border-t border-slate-200">
                <p><span className="font-black">Lloji:</span> {selectedBarcodeShipment.packageType === 'PREPAID' ? 'JO COD (Parapaguar)' : 'COD (Pagesë në Dorëzim)'}</p>
                <p><span className="font-black">Dërguesi:</span> {selectedBarcodeShipment.sellerName}</p>
                <p><span className="font-black">Marrësi:</span> {selectedBarcodeShipment.recipientName} ({selectedBarcodeShipment.destinationCity})</p>
                <p><span className="font-black">{selectedBarcodeShipment.packageType === 'PREPAID' ? 'Tarifa Postare:' : 'Vlera COD:'}</span> <span className="font-black text-emerald-700">{formatALL(selectedBarcodeShipment.packageType === 'PREPAID' ? selectedBarcodeShipment.shippingFee : selectedBarcodeShipment.codAmount)}</span></p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md border border-amber-300 flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Printo Etiketën</span>
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
