'use client';

import React from 'react';
import { Shipment } from '@/lib/types';
import { Printer, Package, MapPin, Phone, User, Building2 } from 'lucide-react';

interface ShippingLabelProps {
  shipment: Shipment;
  onClose?: () => void;
}

export const ShippingLabel: React.FC<ShippingLabelProps> = ({ shipment, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6 print:shadow-none print:p-0 print:max-w-none print:w-full">
        {/* Actions bar - hidden during print */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Etiketa e Dërgesës</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" /> Printo (10x15cm)
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Mbyll
              </button>
            )}
          </div>
        </div>

        {/* Printable Label Container (Thermal Label 100mm x 150mm) */}
        <div className="print-label-area border-2 border-slate-900 rounded-xl p-5 bg-white text-slate-900 font-sans space-y-4 max-w-[420px] mx-auto shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg tracking-tighter">
                P
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">POSTA EXPRESS</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Kuriere & Shërbime Logjistike</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded">
                {shipment.packageType === 'COD' ? 'COD - ME VLERË' : 'PREPAID'}
              </span>
            </div>
          </div>

          {/* Route Badges */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-100 rounded-lg p-2 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Origjina</span>
              <span className="text-sm font-black text-slate-900 truncate block">{shipment.originOfficeName || 'Zyra Qendrore'}</span>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-600 block">Destinacioni</span>
              <span className="text-sm font-black text-blue-900 truncate block">{shipment.destinationCity || shipment.destinationOfficeName}</span>
            </div>
          </div>

          {/* Barcode & Tracking */}
          <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">Tracking Number</div>
            <div className="text-2xl font-black text-slate-900 tracking-wider font-mono">{shipment.trackingNumber}</div>
            
            {/* Visual Barcode Representation */}
            <div className="flex justify-center items-center h-12 gap-0.5 px-6 my-1">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4].map((width, idx) => (
                <div key={idx} className={`h-full bg-slate-900`} style={{ width: `${width * 2}px` }} />
              ))}
            </div>
            <div className="text-[10px] font-mono text-slate-400">{shipment.barcode || shipment.trackingNumber}</div>
          </div>

          {/* Recipient Box (Large) */}
          <div className="border-2 border-slate-900 rounded-xl p-3 space-y-1.5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-700" /> Marrësi
              </span>
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {shipment.recipientPhone}
              </span>
            </div>
            <div className="text-base font-extrabold text-slate-900 leading-snug">{shipment.recipientName}</div>
            <div className="text-xs font-medium text-slate-700 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{shipment.destinationAddress}, {shipment.destinationCity}</span>
            </div>
          </div>

          {/* Sender & COD Summary */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="border border-slate-200 rounded-lg p-2 text-xs space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Dërguesi / Seller</span>
              <div className="font-bold text-slate-800 truncate">{shipment.senderName}</div>
              <div className="text-[10px] text-slate-500">{shipment.senderPhone}</div>
            </div>

            <div className="border-2 border-slate-900 bg-slate-900 text-white rounded-lg p-2 text-right space-y-0.5">
              <span className="text-[9px] font-bold uppercase text-slate-300 block">Vlera për t'u Arkëtuar (COD)</span>
              <div className="text-lg font-black tracking-tight leading-none text-emerald-400">
                {shipment.codAmount.toLocaleString()} ALL
              </div>
              <div className="text-[9px] text-slate-300">
                {shipment.deliveryMode === 'DOOR_DELIVERY' ? 'Dorëzim në adresë' : 'Tërheqje në Zyrë'}
              </div>
            </div>
          </div>

          {/* Footer date */}
          <div className="text-center text-[9px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Data: {new Date(shipment.createdAt).toLocaleDateString('sq-AL')}</span>
            <span>POSTA Logistics System</span>
          </div>
        </div>
      </div>
    </div>
  );
};
