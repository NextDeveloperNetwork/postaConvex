'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { Shipment } from '@/lib/types';
import { ALBANIAN_CITIES } from '@/lib/constants';
import { Package, PlusCircle, Printer, Store, DollarSign, XCircle, Trash2, AlertTriangle, CreditCard } from 'lucide-react';

export default function SellerDashboardPage() {

  const { shipments, createShipment, cancelShipment, deleteShipment, offices, cities: dbCities, currentUser } = useAuthenticatedState();
  const { t, formatALL } = useI18n();
  const cities = dbCities && dbCities.length > 0 ? dbCities.map(c => c.name) : ALBANIAN_CITIES;


  const [showCreateModal, setShowCreateModal] = useState(false);
  const [packageType, setPackageType] = useState<'COD' | 'PREPAID'>('COD');
  const [deliveryMode, setDeliveryMode] = useState<'DOOR_DELIVERY' | 'OFFICE_PICKUP'>('DOOR_DELIVERY');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [originOfficeId, setOriginOfficeId] = useState(currentUser.officeId || offices[0]?.id || 'off-1');
  const [destinationOfficeId, setDestinationOfficeId] = useState(offices[1]?.id || offices[0]?.id || 'off-1');
  const [codAmount, setCodAmount] = useState<number>(5000);
  const [createdBarcodeShipment, setCreatedBarcodeShipment] = useState<Shipment | null>(null);
  const [cancellingShipment, setCancellingShipment] = useState<Shipment | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);

  const [destinationCity, setDestinationCity] = useState('Tirane');

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

  // Filter seller shipments strictly by matching current seller's ID or sellerName, never walk-in customer packages
  const sellerShipments = shipments.filter(s => {
    if (s.sellerId === 'walk-in') return false;
    if (currentUser.role === 'SELLER') {
      return s.sellerId === currentUser.id || s.sellerName === currentUser.name;
    }
    return s.sellerId === currentUser.id || s.sellerName === currentUser.name;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !destinationAddress) return;

    const finalCod = packageType === 'PREPAID' ? 0 : Number(codAmount);

    const newShipment = await createShipment({
      senderName: currentUser.name,
      senderPhone: '+355 69 123 4567',
      recipientName,
      recipientPhone,
      destinationCity,
      destinationAddress,
      originOfficeId,
      destinationOfficeId,
      codAmount: finalCod,
      packageType,
      deliveryMode,
      initialStatus: 'CREATED',
    });

    setCreatedBarcodeShipment(newShipment);
    setShowCreateModal(false);
    
    // Reset Form
    setPackageType('COD');
    setRecipientName('');
    setRecipientPhone('');
    setDestinationAddress('');
    setCodAmount(5000);
  };

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

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 uppercase">
            KRIJUAR
          </span>
        );
      case 'PICKED_UP':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 uppercase">
            MARRË NGA KURIERI
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 uppercase">
            NË TRANSIT
          </span>
        );
      case 'AT_DESTINATION':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 uppercase">
            PRANUAR NË ZYRË
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 uppercase">
            NË DORËZIM
          </span>
        );
      case 'DELIVERED_PENDING_SETTLEMENT':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 uppercase">
            DORËZUAR (PENDING)
          </span>
        );
      case 'CLOSED':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-600 text-white border border-emerald-700 uppercase">
            PËRFUNDUAR
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-100 text-red-900 border border-red-300 uppercase">
            ANULLUAR
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.seller}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">{t.sellerView.title}</h1>
          <p className="text-xs font-bold text-slate-800">Menaxhimi i Pakove COD dhe të Parapaguara, Gjurmimi dhe Faturimi</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-slate-950 hover:bg-slate-800 text-[#f6d55c] font-black text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-md transition active:scale-95 flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{t.sellerView.newShipment}</span>
          <span className="sm:hidden">Krijo</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shipments */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{t.sellerView.totalShipments}</p>
            <p className="text-2xl font-black text-slate-950">{sellerShipments.length}</p>
          </div>
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-slate-950 border border-amber-300">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Active In-Transit */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Në Dërgesë / Transit</p>
            <p className="text-2xl font-black text-purple-700">
              {sellerShipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'PICKED_UP' || s.status === 'AT_DESTINATION').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-900 border border-purple-300">
            <Store className="w-5 h-5" />
          </div>
        </div>

        {/* Delivered / Pending Payout */}
        <div className="bg-white border border-purple-200 rounded-3xl p-4 sm:p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-purple-700 uppercase tracking-wider">COD i Mbledhur (Në Pritje)</p>
            <p className="text-xl font-black text-purple-950">
              {formatALL(sellerShipments.filter(s => s.paymentStatus === 'COD_COLLECTED').reduce((acc, s) => acc + s.sellerNet, 0))}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">{sellerShipments.filter(s => s.paymentStatus === 'COD_COLLECTED').length} porosi për likuidim</p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-900 border border-purple-300">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Net Value Settled */}
        <div className="bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Likuiduar Mbrapsht (Netto)</p>
            <p className="text-xl font-black text-emerald-800">
              {formatALL(sellerShipments.filter(s => s.paymentStatus === 'SETTLED').reduce((acc, s) => acc + s.sellerNet, 0))}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">{sellerShipments.filter(s => s.paymentStatus === 'SETTLED').length} porosi të likuiduara</p>
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-950 border border-emerald-300">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Packages Table View Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4 w-full">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>Tabela e Dërgesave ({sellerShipments.length})</span>
          </h2>
        </div>

        {sellerShipments.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-600 text-xs font-bold space-y-2">
            <p>Nuk keni krijuar ende asnjë pako.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2.5 px-4 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
            >
              Krijo Pakon e Parë
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (<768px) */}
            <div className="md:hidden space-y-3">
              {sellerShipments.map(s => {
                const isPrepaid = s.packageType === 'PREPAID';
                const canBeCancelled = s.status === 'CREATED';
                const canBeDeleted = s.status === 'CREATED' || s.status === 'CANCELLED';

                return (
                  <div
                    key={s.id}
                    className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3 font-bold text-xs shadow-sm hover:border-amber-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-950 text-sm">{s.trackingNumber}</span>
                          {isPrepaid ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                              JO COD
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              COD
                            </span>
                          )}
                          {s.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setCreatedBarcodeShipment(s)}
                              className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 hover:bg-[#f6d55c] transition shadow-xs"
                              title="Printo Barkodin"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] font-semibold mt-0.5">{s.recipientName} ({s.destinationCity})</p>
                      </div>

                      <div className="text-right">
                        {isPrepaid ? (
                          <>
                            <span className="text-xs font-black text-emerald-800 block">Tarifa: {formatALL(s.shippingFee)}</span>
                            <span className="text-[9px] text-slate-500 font-semibold">Parapaguar</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-black text-slate-950 block">{formatALL(s.codAmount)}</span>
                            <span className="text-[10px] text-emerald-700 font-black">Netto: {formatALL(s.sellerNet)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div>{renderStatusBadge(s.status)}</div>
                      
                      <div className="flex items-center gap-1.5">
                        {canBeCancelled && (
                          <button
                            onClick={() => setCancellingShipment(s)}
                            className="py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                          >
                            <XCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>Anullo</span>
                          </button>
                        )}

                        {canBeDeleted && (
                          <button
                            onClick={() => setDeletingShipment(s)}
                            className="py-1 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Fshi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP DATA TABLE VIEW (≥768px) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 w-full">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Barkodi / Tracking</th>
                    <th className="py-3.5 px-4">Lloji i Pagesës</th>
                    <th className="py-3.5 px-4">Marrësi & Destinacioni</th>
                    <th className="py-3.5 px-4">Vlera COD / Tarifa</th>
                    <th className="py-3.5 px-4">Netto Shitësi</th>
                    <th className="py-3.5 px-4">Statusi</th>
                    <th className="py-3.5 px-4 text-right">Veprime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sellerShipments.map(s => {
                    const isPrepaid = s.packageType === 'PREPAID';
                    const canBeCancelled = s.status === 'CREATED';
                    const canBeDeleted = s.status === 'CREATED' || s.status === 'CANCELLED';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-950">{s.trackingNumber}</span>
                            {s.status !== 'CANCELLED' && (
                              <button
                                onClick={() => setCreatedBarcodeShipment(s)}
                                className="p-1.5 bg-slate-100 hover:bg-[#f6d55c] border border-slate-300 rounded-lg text-slate-900 transition shadow-xs"
                                title="Printo Barkodin"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isPrepaid ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                              JO COD (PARAPAGUAR)
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              COD
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-950 font-black">{s.recipientName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{s.destinationCity} - {s.destinationAddress}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isPrepaid ? (
                            <div>
                              <span className="font-black text-emerald-800">{formatALL(s.shippingFee)}</span>
                              <span className="text-[10px] text-slate-500 font-semibold block">Tarifë postare</span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-black text-slate-950">{formatALL(s.codAmount)}</span>
                              <span className="text-[10px] text-slate-500 font-semibold block">COD Total</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isPrepaid ? (
                            <span className="text-slate-500 text-xs">-</span>
                          ) : (
                            <span className="font-black text-emerald-800">{formatALL(s.sellerNet)}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">{renderStatusBadge(s.status)}</td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canBeCancelled && (
                              <button
                                onClick={() => setCancellingShipment(s)}
                                className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                                title="Anullo dërgesën para nisjes"
                              >
                                <XCircle className="w-3.5 h-3.5 text-amber-700" />
                                <span>Anullo</span>
                              </button>
                            )}

                            {canBeDeleted && (
                              <button
                                onClick={() => setDeletingShipment(s)}
                                className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                                title="Fshi dërgesën nga sistemi"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>Fshi</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
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

      {/* CREATE PACKAGE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-black text-base text-slate-950">{t.sellerView.newShipment}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs font-bold">
              
              {/* Delivery Mode Selection */}
              <div className="space-y-1.5">
                <label className="block text-slate-950 font-black">Mënyra e Dorëzimit te Klienti</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('DOOR_DELIVERY')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-0.5 border transition ${
                      deliveryMode === 'DOOR_DELIVERY' 
                        ? 'bg-[#f6d55c] text-slate-950 border-amber-300 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-black text-xs">🚚 Dorëzim në Adresë</span>
                    <span className="text-[9px] opacity-80">Me Kurier te Marrësi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('OFFICE_PICKUP')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-0.5 border transition ${
                      deliveryMode === 'OFFICE_PICKUP' 
                        ? 'bg-blue-100 text-blue-950 border-blue-300 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-black text-xs">🏪 Tërheqje në Zyrë</span>
                    <span className="text-[9px] opacity-80">Pick Up ne Sportel</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {deliveryMode === 'DOOR_DELIVERY' 
                    ? '✓ Kurieri lokal i destinacionit do ta dorëzojë pakon te adresa e marrësit.'
                    : '✓ Marrësi do të shkojë vetë ta tërheqë pakon te zyra postare e destinacionit.'
                  }
                </p>
              </div>
              
              {/* Payment Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-slate-950 font-black">Lloji i Pagesës</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPackageType('COD')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${
                      packageType === 'COD' 
                        ? 'bg-amber-100 text-slate-950 border-amber-300 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>COD (Dorëzim)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPackageType('PREPAID')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${
                      packageType === 'PREPAID' 
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Jo COD (Parapaguar)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">{t.sellerView.recipientName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arben Hoxha"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">{t.sellerView.recipientPhone}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +355 69 987 6543"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>



              <div>
                <label className="block text-slate-950 mb-1 font-black">Zyra e Pranimit (Zyra e Origjinës ku dorëzohet pakoja)</label>
                <select
                  value={originOfficeId}
                  onChange={e => setOriginOfficeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                >
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Qyteti i Destinacionit</label>
                <select
                  value={destinationCity}
                  onChange={e => handleCityChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Zyra e Destinacionit (Zyra Postare e Destinacionit)</label>
                <select
                  value={destinationOfficeId}
                  onChange={e => handleOfficeChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                >
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">{t.sellerView.address}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagja 4, Rruga Ecuria, Nr. 12"
                  value={destinationAddress}
                  onChange={e => setDestinationAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>



              {packageType === 'COD' ? (
                <div>
                  <label className="block text-slate-950 mb-1 font-black">{t.sellerView.codAmount}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={codAmount}
                    onChange={e => setCodAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-emerald-700 font-black text-sm focus:outline-none focus:border-[#f6d55c]"
                  />
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-0.5">
                  <p className="font-black text-xs">Pako e Parapaguar (Jo COD):</p>
                  <p className="text-[11px] font-semibold text-emerald-800">
                    Vlera COD është 0 ALL. Tarifa postare prej <strong>300 ALL</strong> paguhet në momentin e dorëzimit në zyrën postare.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md border border-amber-300 transition active:scale-95 mt-2"
              >
                {t.sellerView.createBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE BARCODE MODAL */}
      {createdBarcodeShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-black text-xs text-slate-950">Etiketa me Barkod</span>
              <button onClick={() => setCreatedBarcodeShipment(null)} className="text-slate-500 font-black text-sm">✕</button>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 space-y-3">
              <p className="font-black text-xs text-slate-950 uppercase tracking-widest">POSTA SHQIPTARE</p>
              <div className="bg-slate-950 text-white font-mono tracking-[0.3em] font-black text-xl py-3 px-4 rounded-xl shadow-inner">
                {createdBarcodeShipment.barcode}
              </div>
              <p className="font-black text-sm text-slate-950">{createdBarcodeShipment.trackingNumber}</p>
              <div className="text-[11px] font-semibold text-slate-700 text-left space-y-1 pt-2 border-t border-slate-200">
                <p><span className="font-black">Lloji:</span> {createdBarcodeShipment.packageType === 'PREPAID' ? 'JO COD (Parapaguar)' : 'COD (Pagesë në Dorëzim)'}</p>
                <p><span className="font-black">Dërguesi:</span> {createdBarcodeShipment.sellerName}</p>
                <p><span className="font-black">Marrësi:</span> {createdBarcodeShipment.recipientName} ({createdBarcodeShipment.destinationCity})</p>
                <p><span className="font-black">{createdBarcodeShipment.packageType === 'PREPAID' ? 'Tarifa Postare:' : 'Vlera COD:'}</span> <span className="font-black text-emerald-700">{formatALL(createdBarcodeShipment.packageType === 'PREPAID' ? createdBarcodeShipment.shippingFee : createdBarcodeShipment.codAmount)}</span></p>
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
