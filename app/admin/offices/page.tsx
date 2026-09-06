'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { Office } from '@/lib/types';
import { Building2, PlusCircle, MapPin, Edit2, Trash2, Power, AlertTriangle, Percent, DollarSign } from 'lucide-react';

export default function AdminOfficesPage() {
  const { t, formatALL } = useI18n();
  const { offices, addOffice, updateOffice, toggleOfficeStatus, deleteOffice } = useAuthenticatedState();

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newCity, setNewCity] = useState('Elbasan');
  const [newInitialCash, setNewInitialCash] = useState(10000);
  const [newIntakePercentage, setNewIntakePercentage] = useState(20);

  // Edit Modal State
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCash, setEditCash] = useState<number>(0);
  const [editIntakePercentage, setEditIntakePercentage] = useState<number>(20);

  // Delete Dialog State
  const [deletingOffice, setDeletingOffice] = useState<Office | null>(null);

  // Handlers
  const handleAddOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficeName) return;

    addOffice({
      name: newOfficeName,
      city: newCity,
      cashBalance: Number(newInitialCash),
      intakePercentage: Number(newIntakePercentage),
    });

    setShowCreateModal(false);
    setNewOfficeName('');
    setNewIntakePercentage(20);
  };

  const handleOpenEdit = (off: Office) => {
    setEditingOffice(off);
    setEditName(off.name);
    setEditCity(off.city);
    setEditCash(off.cashBalance);
    setEditIntakePercentage(off.intakePercentage ?? 20);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice) return;

    updateOffice(editingOffice.id, {
      name: editName,
      city: editCity,
      cashBalance: editCash,
      intakePercentage: editIntakePercentage,
    });

    setEditingOffice(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingOffice) return;
    deleteOffice(deletingOffice.id);
    setDeletingOffice(null);
  };

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.admin}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Zyrat Postare & Përqindjet e Pranimit</h1>
          <p className="text-xs font-bold text-slate-800">Diferencimi i Përqindjes së Pranimit (%) sipas Zyrave, Menaxhimi & Arkat</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-[#f6d55c] font-black text-xs flex items-center gap-2 shadow-md transition active:scale-95 flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-[#f6d55c]" />
          <span className="hidden sm:inline">Shto Zyrë të Re</span>
          <span className="sm:hidden">Shto</span>
        </button>
      </div>

      {/* Offices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offices.map(off => {
          const isSuspended = off.status === 'SUSPENDED';
          const pct = off.intakePercentage ?? 20;
          const calculatedIntakeVal = Math.round((300 * pct) / 100);

          return (
            <div
              key={off.id}
              className={`bg-white border rounded-3xl p-5 shadow-md space-y-4 font-bold transition ${
                isSuspended ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              {/* Office Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black ${
                    isSuspended ? 'bg-red-100 border-red-300 text-red-950' : 'bg-amber-100 border-amber-300 text-slate-950'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-950">{off.name}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>{off.city}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {isSuspended ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-800 uppercase border border-red-300">
                    PEZULLUAR
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 uppercase border border-emerald-300">
                    AKTIV
                  </span>
                )}
              </div>

              {/* Custom Intake Percentage Badge */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-amber-900 font-black uppercase tracking-wider flex items-center gap-1">
                    <Percent className="w-3 h-3 text-amber-600" />
                    <span>Përqindja e Pranimit:</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    ({calculatedIntakeVal} ALL nga tarifa 300 ALL)
                  </p>
                </div>
                <span className="text-sm font-black px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
                  {pct}%
                </span>
              </div>

              {/* Cash Register Balance */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 font-bold">Gjendja e Arkës Cash:</span>
                <span className="text-base font-black text-emerald-700">{formatALL(off.cashBalance)}</span>
              </div>

              {/* Action Buttons: Edit, Suspend/Reactivate, Delete */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                
                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEdit(off)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-[#f6d55c] border border-slate-300 rounded-xl text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-xs transition active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ndrysho</span>
                </button>

                {/* Suspend / Reactivate Button */}
                <button
                  onClick={() => toggleOfficeStatus(off.id)}
                  className={`flex-1 py-2 px-3 border rounded-xl font-black text-xs flex items-center justify-center gap-1 transition active:scale-95 ${
                    isSuspended
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                  }`}
                  title={isSuspended ? 'Aktivizo zyrën' : 'Pezullo zyrën'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isSuspended ? 'Aktivizo' : 'Pezullo'}</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => setDeletingOffice(off)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-black text-xs transition active:scale-95"
                  title="Fshi Zyrën"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW OFFICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-black text-base text-slate-950 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Shto Zyrë të Re Postare</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-950 font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleAddOffice} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-950 mb-1 font-black">Emri i Zyrës</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zyrja Rajonale Elbasan"
                  value={newOfficeName}
                  onChange={e => setNewOfficeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Qyteti</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elbasan"
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black flex items-center justify-between">
                  <span>Përqindja e Pranimit nga Zyra (%)</span>
                  <span className="text-amber-700 text-[11px] font-black">
                    {Math.round((300 * newIntakePercentage) / 100)} ALL / 300 ALL
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="1"
                    value={newIntakePercentage}
                    onChange={e => setNewIntakePercentage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-amber-950 font-black text-sm focus:outline-none focus:border-[#f6d55c]"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Gjendja Fillestare e Arkës (ALL)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={newInitialCash}
                  onChange={e => setNewInitialCash(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-emerald-700 font-black text-sm focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md border border-amber-300 transition active:scale-95 mt-2"
              >
                Regjistro Zyrën
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OFFICE MODAL */}
      {editingOffice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-black text-base text-slate-950 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>Ndrysho Të Dhënat e Zyrës</span>
              </h2>
              <button onClick={() => setEditingOffice(null)} className="text-slate-500 hover:text-slate-950 font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-slate-950 mb-1 font-black">Emri i Zyrës</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Qyteti</label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black flex items-center justify-between">
                  <span>Përqindja e Pranimit nga Zyra (%)</span>
                  <span className="text-amber-700 text-[11px] font-black">
                    {Math.round((300 * editIntakePercentage) / 100)} ALL / 300 ALL
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="1"
                    value={editIntakePercentage}
                    onChange={e => setEditIntakePercentage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-amber-950 font-black text-sm focus:outline-none focus:border-[#f6d55c]"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Gjendja e Arkës Cash (ALL)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={editCash}
                  onChange={e => setEditCash(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-emerald-700 font-black text-sm focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOffice(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs border border-amber-300 shadow-md transition active:scale-95"
                >
                  Ruaj Ndryshimet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE OFFICE CONFIRMATION DIALOG */}
      {deletingOffice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-black text-base text-slate-950">A jeni i sigurt?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po fshini zyrën <span className="font-black text-slate-950">{deletingOffice.name}</span> ({deletingOffice.city}).
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingOffice(null)}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs"
              >
                Anulo
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

    </main>
  );
}
