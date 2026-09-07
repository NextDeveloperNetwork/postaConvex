'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { Settings, Save, CheckCircle2, DollarSign, Globe, Shield, Building2, ArrowRight, MapPin } from 'lucide-react';

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const { offices, syncFromDB } = useAuthenticatedState();

  // Configurable Fee Parameters
  const [shippingFee, setShippingFee] = useState<number>(300);
  const [deliveryOfficeFee, setDeliveryOfficeFee] = useState<number>(100);
  
  const [defaultCurrency, setDefaultCurrency] = useState('ALL');
  const [defaultLanguage, setDefaultLanguage] = useState('sq');
  const [defaultOfficeId, setDefaultOfficeId] = useState(offices[0]?.id || 'off-1');
  const [requireApproval, setRequireApproval] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetData = async () => {
    if (!window.confirm('KUJDES! Kjo do të fshijë të gjitha dërgesat, thasët, ledgerët dhe arkat nga Baza e Të Dhënave. Përdoruesit dhe zyrat do të mbeten. Vazhdo?')) return;
    try {
      const res = await fetch('/api/dev/clear');
      const data = await res.json();
      if (data.success) {
        await syncFromDB();
        setResetDone(true);
        setTimeout(() => setResetDone(false), 3000);
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };



  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.admin}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Cilesimet e Sistemit & Tarifat</h1>
          <p className="text-xs font-bold text-slate-800">Konfigurimi i Tarifes Postare, Qyteteve dhe Rregullave te Sistemit</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[#f6d55c]" />
        </div>
      </div>

      {/* Toast Confirmation */}
      {savedSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 text-emerald-950 text-xs font-black flex items-center gap-2 animate-bounce shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>Cilesimet e sistemit dhe tarifat u ruajten me sukses!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Section 1: Post Office Fees Configuration */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>1. Tarifat Standarte te Dërgësave (ne ALL)</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                Perqindja e pranimit (%) menaxhohet individualisht per secilen zyre te faqja Zyrat Postare.
              </p>
            </div>

            <Link
              href="/admin/offices"
              className="py-2 px-3.5 bg-amber-100 hover:bg-[#f6d55c] border border-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition flex-shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>Ndrysho Perqindjet sipas Zyrave</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
            
            {/* Base Shipping Fee */}
            <div>
              <label className="block text-slate-950 mb-1 font-black">Tarifa e Transportit Postar (ALL)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={shippingFee}
                  onChange={e => setShippingFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-black">ALL</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Kostoja baze e postes (Standard: 300 ALL).</p>
            </div>

            {/* Delivery Office Fee */}
            <div>
              <label className="block text-slate-950 mb-1 font-black">Tarifa e Zyres se Dorzimit (ALL)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={deliveryOfficeFee}
                  onChange={e => setDeliveryOfficeFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-black">ALL</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Fitimi i Zyres se Destinacionit (Standard: 100 ALL).</p>
            </div>

          </div>
        </div>

        {/* Section 2: Currency & Language */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-amber-600" />
            <span>2. Monedha & Gjuhet e Sistemit</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
            <div>
              <label className="block text-slate-950 mb-1 font-black">Monedha Baze (Base Currency)</label>
              <select
                value={defaultCurrency}
                onChange={e => setDefaultCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              >
                <option value="ALL">ALL - Leku Shqiptar (Lek)</option>
                <option value="EUR">EUR - Euro (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-950 mb-1 font-black">Gjuha Paresore (Default i18n)</label>
              <select
                value={defaultLanguage}
                onChange={e => setDefaultLanguage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              >
                <option value="sq">🇦🇱 Shqip (SQ)</option>
                <option value="en">🇬🇧 English (EN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: User Approval & Default Branch */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>3. Rregullat e Regjistrimeve te Reja</span>
          </h2>

          <div className="space-y-4 text-xs font-bold">
            <div>
              <label className="block text-slate-950 mb-1 font-black">Zyra Qendrore Paresore</label>
              <select
                value={defaultOfficeId}
                onChange={e => setDefaultOfficeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-950 font-black focus:outline-none focus:border-[#f6d55c]"
              >
                {offices.map(o => (
                  <option key={o.id} value={o.id}>{o.city} - {o.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <div>
                <p className="font-black text-slate-950">Aprovimi Manual nga Admini (Strict RBAC)</p>
                <p className="text-[10px] text-slate-600 font-semibold">Perdoruesit e rinj mbesin PENDING derisa t'u melet roli.</p>
              </div>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={e => setRequireApproval(e.target.checked)}
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
          <span>Ruaj Cilesimet e Sistemit & Tarifat</span>
        </button>

      </form>

      {/* Cities shortcut card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 sm:p-6 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-indigo-950">Qytetet e Destinacionit</h2>
            <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
              Menaxho listen e qyteteve qe shfaqen ne formularet e dergesave
            </p>
          </div>
        </div>
        <Link
          href="/admin/cities"
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl border border-indigo-700 shadow-md transition active:scale-95 flex items-center gap-2 flex-shrink-0"
        >
          <span>Hap Faqen</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Danger Zone: Reset App Data */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-3">
        <h2 className="text-sm font-black text-red-950 flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-600" />
          <span>Zona e Rrezikshme - Reset i te Dhenave</span>
        </h2>
        <p className="text-xs font-semibold text-red-700">
          Fshi te gjitha dergesat, thaset, arket dhe ledgerat nga memoria lokale. Perdoruesit dhe zyrat nuk preken.
        </p>
        {resetDone && (
          <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-3 text-emerald-950 text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Te dhenat u fshin me sukses! Duke rifilluar aplikacionin...
          </div>
        )}
        <button
          type="button"
          onClick={handleResetData}
          className="py-3 px-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs flex items-center gap-2 border border-red-700 shadow-md transition active:scale-95"
        >
          <span>Fshi te Gjitha Dergesat, Thaset & Arkat (Reset)</span>
        </button>
      </div>

    </main>
  );
}
