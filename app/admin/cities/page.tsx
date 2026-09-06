'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Building2,
  Link2,
  RefreshCw,
  Edit2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useAuthenticatedState } from '@/lib/store';
import { City } from '@/lib/types';

export default function AdminCitiesPage() {
  const { cities, offices, addCity, updateCity, deleteCity, syncFromDB } = useAuthenticatedState();

  const [newCityName, setNewCityName] = useState('');
  const [newCityOfficeId, setNewCityOfficeId] = useState('');
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState<string>('ALL');
  const [sortAsc, setSortAsc] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('Ndryshimet u ruajtën me sukses në Bazën e Të Dhënave!');

  // Edit Modal State
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editName, setEditName] = useState('');
  const [editOfficeId, setEditOfficeId] = useState('');

  // Delete Dialog State
  const [deletingCity, setDeletingCity] = useState<City | null>(null);

  // Helper to auto-match office by city name
  const autoMatchOffice = (cityName: string): string => {
    if (!offices || offices.length === 0) return '';
    const cleanCity = cityName.trim().toLowerCase();

    // 1. Direct match with office city
    const exactCityOffice = offices.find(o => o.city.toLowerCase() === cleanCity);
    if (exactCityOffice) return exactCityOffice.id;

    // 2. Contains match in office name
    const containsOffice = offices.find(o => o.name.toLowerCase().includes(cleanCity));
    if (containsOffice) return containsOffice.id;

    // 3. Reverse match
    const reverseOffice = offices.find(o => cleanCity.includes(o.city.toLowerCase()));
    if (reverseOffice) return reverseOffice.id;

    return '';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handlers
  const handleAddCity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCityName.trim();
    if (!trimmed) return;

    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (cities.some(c => c.name.toLowerCase() === formatted.toLowerCase())) {
      alert(`Qyteti "${formatted}" ekziston tashmë në databazë.`);
      return;
    }

    const assignedOfficeId = newCityOfficeId || autoMatchOffice(formatted) || null;

    const res = await addCity({
      name: formatted,
      officeId: assignedOfficeId
    });

    setNewCityName('');
    setNewCityOfficeId('');

    if (res) {
      showToast(`Qyteti "${formatted}" u ruajt me sukses në Bazën e Të Dhënave!`);
    } else {
      showToast('Ndryshimet u sinkronizuan me databazën.');
    }
  };

  const handleOfficeChange = async (cityId: string, newOfficeId: string) => {
    await updateCity(cityId, { officeId: newOfficeId || null });
    showToast('Zyrja e lidhur u përditësua në databazë!');
  };

  const handleAutoLinkAll = async () => {
    let count = 0;
    for (const city of cities) {
      if (!city.officeId) {
        const matchedOfficeId = autoMatchOffice(city.name);
        if (matchedOfficeId) {
          await updateCity(city.id, { officeId: matchedOfficeId });
          count++;
        }
      }
    }

    if (count > 0) {
      showToast(`U lidhën automatikisht ${count} qytete në databazë!`);
    } else {
      showToast('Të gjitha qytetet me përputhje janë të lidhura tashmë.');
    }
  };

  const confirmDeleteCity = async () => {
    if (!deletingCity) return;
    await deleteCity(deletingCity.id);
    showToast(`Qyteti "${deletingCity.name}" u fshi nga databaza!`);
    setDeletingCity(null);
  };

  const handleOpenEdit = (city: City) => {
    setEditingCity(city);
    setEditName(city.name);
    setEditOfficeId(city.officeId || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity || !editName.trim()) return;

    const formatted = editName.trim().charAt(0).toUpperCase() + editName.trim().slice(1);

    await updateCity(editingCity.id, {
      name: formatted,
      officeId: editOfficeId || null
    });

    setEditingCity(null);
    showToast('Të dhënat e qytetit u ruajtën me sukses në databazë!');
  };

  const handleSyncRefresh = async () => {
    await syncFromDB();
    showToast('Të dhënat u rifreskuan nga PostgreSQL DB!');
  };

  const toggleSort = () => {
    setSortAsc(prev => !prev);
  };

  // Filtered and Sorted Cities
  const filteredCities = cities
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());

      if (officeFilter === 'UNLINKED') {
        return matchesSearch && !c.officeId;
      }
      if (officeFilter !== 'ALL') {
        return matchesSearch && c.officeId === officeFilter;
      }

      return matchesSearch;
    })
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  const linkedCount = cities.filter(c => Boolean(c.officeId)).length;
  const unlinkedCount = cities.length - linkedCount;

  return (
    <main className="w-full space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 text-white tracking-wider flex items-center gap-1.5 w-fit">
            <span>ADMIN</span>
            <span>•</span>
            <span>POSTGRESQL DB persist</span>
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <span>Qytetet & Zyrat e Destinacionit</span>
          </h1>
          <p className="text-xs font-bold text-indigo-100 mt-1">
            Menaxho të dhënat e qyteteve dhe lidhjen me zyrat postare — ruhen me Prisma ne Neon DB
          </p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-black text-indigo-600">{cities.length}</p>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Qytete në Databazë</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-black text-emerald-600">{linkedCount}</p>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Të Lidhura me Zyrë</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
          <p className={`text-2xl font-black ${unlinkedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {unlinkedCount}
          </p>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Pa Zyrë të Caktuar</p>
        </div>
      </div>

      {/* Toast Notification */}
      {savedSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 text-emerald-950 text-xs font-black flex items-center gap-2 shadow-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add New City Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <h2 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>Shto Qytet të Ri në Databazë</span>
        </h2>

        <form onSubmit={handleAddCity} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
              Emri i Qytetit
            </label>
            <input
              type="text"
              value={newCityName}
              onChange={e => setNewCityName(e.target.value)}
              placeholder="p.sh. Patos, Fushe-Kruje, Mamurras..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
              Zyra Postare e Lidhur
            </label>
            <select
              value={newCityOfficeId}
              onChange={e => setNewCityOfficeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-400 transition"
            >
              <option value="">-- Auto Match / Zgjidh Zyrë --</option>
              {offices.map(off => (
                <option key={off.id} value={off.id}>
                  🏢 {off.name} ({off.city})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={!newCityName.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black text-xs rounded-2xl border border-indigo-700 shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Shto në DB</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">

        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-950">Tabela e Qyteteve në Databazë</h2>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {filteredCities.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Kërko qytet..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3 py-2 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 transition"
              />
            </div>

            {/* Office Filter Dropdown */}
            <select
              value={officeFilter}
              onChange={e => setOfficeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-300 transition"
            >
              <option value="ALL">Të gjitha Zyrat</option>
              <option value="UNLINKED">⚠️ Pa Zyrë të Lidhur</option>
              {offices.map(o => (
                <option key={o.id} value={o.id}>
                  🏢 {o.name}
                </option>
              ))}
            </select>

            {/* Auto link button */}
            <button
              type="button"
              onClick={handleAutoLinkAll}
              title="Auto-lidh qytetet sipas emrit me zyrat në DB"
              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-black text-xs rounded-2xl border border-indigo-200 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Lidh Auto DB</span>
            </button>

            {/* Sort Button */}
            <button
              type="button"
              onClick={toggleSort}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl border border-slate-200 transition flex items-center gap-1.5"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortAsc ? 'A→Z' : 'Z→A'}</span>
            </button>

            {/* Sync DB Refresh */}
            <button
              type="button"
              onClick={handleSyncRefresh}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-2xl border border-slate-200 transition flex items-center gap-1.5"
              title="Rifresko të dhënat nga Neon DB"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Rifresko</span>
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Qyteti</th>
                <th className="py-3 px-4">Zyra Postare e Lidhur (DB)</th>
                <th className="py-3 px-4">Vendndodhja / Statusi i Zyrës</th>
                <th className="py-3 px-4 text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-950">
              {filteredCities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-xs">
                      {search || officeFilter !== 'ALL'
                        ? 'Nuk u gjet asnjë qytet me këtë filtër.'
                        : 'Lista e qyteteve është bosh në databazë.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCities.map((city, idx) => {
                  const linkedOffice = offices.find(o => o.id === city.officeId) || city.office;
                  const isSuspended = linkedOffice?.status === 'SUSPENDED';

                  return (
                    <tr
                      key={city.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* City Name */}
                      <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span>{city.name}</span>
                      </td>

                      {/* Linked Office Select Dropdown */}
                      <td className="py-3.5 px-4">
                        <div className="relative max-w-xs">
                          <select
                            value={city.officeId || ''}
                            onChange={e => handleOfficeChange(city.id, e.target.value)}
                            className={`w-full appearance-none rounded-xl px-3 py-2 text-xs font-black border transition cursor-pointer pr-8 focus:outline-none ${
                              linkedOffice
                                ? 'bg-amber-50/60 text-slate-950 border-amber-300 hover:border-amber-400'
                                : 'bg-slate-50 text-slate-500 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <option value="">❌ Pa zyrë të lidhur</option>
                            {offices.map(off => (
                              <option key={off.id} value={off.id}>
                                🏢 {off.name} ({off.city})
                              </option>
                            ))}
                          </select>
                          <Building2 className="w-3.5 h-3.5 text-amber-600 absolute right-2.5 top-3 pointer-events-none opacity-75" />
                        </div>
                      </td>

                      {/* Office Info & Status Badge */}
                      <td className="py-3.5 px-4">
                        {linkedOffice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                              📍 {linkedOffice.city}
                            </span>
                            {isSuspended ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-200 uppercase">
                                Pezulluar
                              </span>
                            ) : (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                                Aktiv
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 italic">
                            Nuk është lidhur me asnjë zyrë
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(city)}
                            className="p-2 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-slate-950 rounded-xl border border-slate-200 transition"
                            title="Ndrysho qytetin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCity(city)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl border border-red-200 transition"
                            title={`Fshi ${city.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs font-semibold text-indigo-900 flex items-start gap-2.5">
        <Link2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-black">Persistenca në Databazë (PostgreSQL):</span> Të gjitha qytetet dhe lidhjet e tyre me zyrat ruhen drejtpërdrejt në tabelën <strong>City</strong> me Prisma në Neon DB. Cilatdo ndryshime sinkronizohen automatikisht te të gjithë përdoruesit e sistemit.
        </div>
      </div>

      {/* EDIT CITY MODAL */}
      {editingCity && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-black text-base text-slate-950 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Ndrysho Qytetin në Databazë</span>
              </h2>
              <button onClick={() => setEditingCity(null)} className="text-slate-500 hover:text-slate-950 font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-950 mb-1 font-black">Emri i Qytetit</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Zyra Postare e Lidhur</label>
                <select
                  value={editOfficeId}
                  onChange={e => setEditOfficeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-indigo-400"
                >
                  <option value="">❌ Pa zyrë të lidhur</option>
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>
                      🏢 {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCity(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs border border-indigo-700 shadow-md transition active:scale-95 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ruaj në DB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingCity && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-base text-slate-950">Fshi Qytetin nga Databaza?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                A jeni i sigurt që dëshironi të fshini qytetin <span className="font-black text-slate-950">{deletingCity.name}</span> nga Neon DB?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingCity(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs"
              >
                Anulo
              </button>
              <button
                onClick={confirmDeleteCity}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition active:scale-95"
              >
                Po, Fshije me DB
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
