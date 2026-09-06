'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { Settings, Save, CheckCircle2, Store, CreditCard, MapPin, Bell } from 'lucide-react';

export default function SellerSettingsPage() {
  const { t } = useI18n();
  const { currentUser, updateUser } = useAuthenticatedState();

  const [businessName, setBusinessName] = useState(currentUser.name || 'TechStore Albania');
  const [email, setEmail] = useState(currentUser.email || 'seller@techstore.al');
  const [phone, setPhone] = useState('+355 69 123 4567');
  const [pickupAddress, setPickupAddress] = useState('Rruga Myslym Shyri, Nr. 45');
  const [pickupCity, setPickupCity] = useState('Tiranë');
  
  // Financial Payout settings
  const [payoutMethod, setPayoutMethod] = useState<'BANK' | 'CASH'>('BANK');
  const [bankName, setBankName] = useState('Banka Kombëtare Tregtare (BKT)');
  const [iban, setIban] = useState('AL892011000000000123456789');
  
  const [autoPrintBarcode, setAutoPrintBarcode] = useState(true);
  const [smsNotification, setSmsNotification] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, {
      name: businessName,
      email: email,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.seller}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Cilësimet e Biznesit</h1>
          <p className="text-xs font-bold text-slate-800">Profili i Dyqanit, IBAN Bankar për Likuidime dhe Adresa e Marrjes</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Toast Confirmation */}
      {savedSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 text-emerald-950 text-xs font-black flex items-center gap-2 animate-bounce shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>Të dhënat e biznesit dhe cilësimet e IBAN-it u ruajtën me sukses!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Section 1: Business Profile */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4.5 h-4.5 text-amber-600" />
            <span>1. Profili i Dyqanit & Kontakti</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
            <div>
              <label className="block text-slate-950 mb-1 font-black">Emri i Biznesit / Dyqanit</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              />
            </div>

            <div>
              <label className="block text-slate-950 mb-1 font-black">Adresa Email Zyrtare</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              />
            </div>

            <div>
              <label className="block text-slate-950 mb-1 font-black">Numri i Telefonit të Kontaktit</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              />
            </div>

            <div>
              <label className="block text-slate-950 mb-1 font-black">Qyteti i Marrjes të Pakove</label>
              <input
                type="text"
                required
                value={pickupCity}
                onChange={e => setPickupCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-950 mb-1 font-black">Adresa Fikse ku Kurieri merr Pakon (Pickup Address)</label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={e => setPickupAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bank Account & Payout Details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4.5 h-4.5 text-amber-600" />
            <span>2. Të Dhënat e IBAN-it Bankar për Likuidimet Netto (ALL)</span>
          </h2>

          <div className="space-y-4 text-xs font-bold">
            <div>
              <label className="block text-slate-950 mb-1 font-black">Mënyra e Preferuar e Marrjes së Netto COD</label>
              <select
                value={payoutMethod}
                onChange={e => setPayoutMethod(e.target.value as 'BANK' | 'CASH')}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              >
                <option value="BANK">Transfertë Bankare Direkte (në IBAN)</option>
                <option value="CASH">Cash në Zyrën Postare</option>
              </select>
            </div>

            {payoutMethod === 'BANK' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-950 mb-1 font-black">Emri i Bankës</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
                  />
                </div>

                <div>
                  <label className="block text-slate-950 mb-1 font-black">Numri i Llogarisë Bankare (IBAN)</label>
                  <input
                    type="text"
                    required
                    value={iban}
                    onChange={e => setIban(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black uppercase focus:outline-none focus:border-[#f6d55c]"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Paratë e likuiduara nga Posta do të kalojnë direkt këtu.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Label & Notifications */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4.5 h-4.5 text-amber-600" />
            <span>3. Preferencat e Barkodit dhe Njoftimeve</span>
          </h2>

          <div className="space-y-3 text-xs font-bold">
            <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <div>
                <p className="font-black text-slate-950">Shfaq Etiketën e Barkodit pas Krijimit</p>
                <p className="text-[10px] text-slate-600 font-semibold">Hap automatikisht dritaren me etiketën e printable pas krijimit të dërgesës.</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintBarcode}
                onChange={e => setAutoPrintBarcode(e.target.checked)}
                className="w-5 h-5 accent-[#f6d55c] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="font-black text-slate-950">Njoftime me SMS kur Klienti merr Pakon</p>
                <p className="text-[10px] text-slate-600 font-semibold">Prano njoftim automatik kur paratë COD mblidhen nga kurieri.</p>
              </div>
              <input
                type="checkbox"
                checked={smsNotification}
                onChange={e => setSmsNotification(e.target.checked)}
                className="w-5 h-5 accent-[#f6d55c] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-300/40 border border-amber-300 transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Ruaj Cilësimet e Biznesit</span>
        </button>

      </form>

    </main>
  );
}
