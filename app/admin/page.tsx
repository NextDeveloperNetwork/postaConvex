'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { useToast } from '@/components/toast-notification';
import { UserRole, User } from '@/lib/types';
import { Shield, UserCheck, Search, Edit2, Trash2, AlertTriangle, Filter, Building2, Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { users, offices, updateUser, deleteUser, currentUser } = useAuthenticatedState();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('SELLER');
  const [editOfficeId, setEditOfficeId] = useState('');
  const [editIsDemoUser, setEditIsDemoUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Dialog State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.officeName && u.officeName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditOfficeId(user.officeId || offices[0]?.id || 'off-1');
    setEditIsDemoUser(Boolean(user.isDemoUser));
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    setEditError(null);
    try {
      await updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        officeId: editOfficeId,
        isDemoUser: editIsDemoUser,
      });
      showSuccess(`Të dhënat e përdoruesit "${editName}" u ruajtën me sukses!`);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error saving user edit:', err);
      setEditError('Ndodhi një gabim gjatë ruajtjes. Provoni sërish.');
      showError('Ndodhi një gabim gjatë ruajtjes së të dhënave.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      showSuccess(`Përdoruesi "${deletingUser.name}" u fshi me sukses.`);
    } catch (err) {
      console.error('Error deleting user:', err);
      showError('Ndodhi një gabim gjatë fshirjes. Provoni sërish.');
    } finally {
      setIsDeleting(false);
      setDeletingUser(null);
    }
  };

  return (
    <main className="w-full space-y-5">
      
      {/* Top Banner - 100% Full Width */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.admin}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">{t.adminView.title}</h1>
          <p className="text-xs font-bold text-slate-800">Menaxhimi i Përdoruesve në Ekran të Plotë</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Main Users Section - 100% Full Width */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4 w-full">
        
        {/* Controls Header: Search & Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              <span>Lista e Përdoruesve ({filteredUsers.length})</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Kërko emër, email ose zyrë..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
              />
            </div>

            {/* Filter Selector */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-xs text-slate-950 font-bold focus:outline-none"
              >
                <option value="ALL">Të gjitha Rolet</option>
                <option value="SELLER">Shitës (Seller)</option>
                <option value="COURIER">Kurier (Courier)</option>
                <option value="OFFICE_STAFF">Staf Zyre (Office)</option>
                <option value="FINANCE_ADMIN">Financë & Admin</option>
                <option value="PENDING">Në Pritje (Pending)</option>
              </select>
            </div>
          </div>
        </div>

        {/* MOBILE CARDS VIEW (<768px) */}
        <div className="md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-600 text-xs font-bold">
              Nuk u gjet asnjë përdorues me këtë kërkim.
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3 font-bold text-xs shadow-sm hover:border-amber-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-slate-950 text-sm">{user.name}</h4>
                    <p className="text-slate-600 font-semibold text-[11px]">{user.email}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                    user.role === 'FINANCE_ADMIN' ? 'bg-purple-100 text-purple-950 border-purple-300' :
                    user.role === 'SELLER' ? 'bg-emerald-100 text-emerald-950 border-emerald-300' :
                    user.role === 'COURIER' ? 'bg-blue-100 text-blue-950 border-blue-300' :
                    user.role === 'OFFICE_STAFF' ? 'bg-amber-100 text-amber-950 border-amber-300' :
                    'bg-slate-200 text-slate-950 border-slate-300'
                  }`}>
                    {user.role.replace('_STAFF', '').replace('_ADMIN', '')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-700">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user.officeName || 'Zyra Qendrore Tiranë'}</span>
                  </div>
                  <span className="text-slate-500">{user.createdAt}</span>
                </div>

                {/* Touch Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="flex-1 py-2 px-3 bg-white hover:bg-[#f6d55c] border border-slate-300 rounded-xl text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-800" />
                    <span>Ndrysho</span>
                  </button>

                  <button
                    onClick={() => setDeletingUser(user)}
                    disabled={currentUser.id === user.id}
                    className={`flex-1 py-2 px-3 border rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                      currentUser.id === user.id
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Fshi</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP DATA TABLE VIEW - 100% Full Width (≥768px) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 w-full">
          <table className="w-full text-left text-xs font-bold border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Përdoruesi</th>
                <th className="py-3.5 px-4">Roli Aktual</th>
                <th className="py-3.5 px-4">Zyra e Caktuar</th>
                <th className="py-3.5 px-4">Demo User (Login)</th>
                <th className="py-3.5 px-4">Statusi</th>
                <th className="py-3.5 px-4 text-right">Veprime (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-semibold">
                    Nuk u gjet asnjë përdorues me këtë kërkim.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-amber-50/50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-black text-slate-950">{user.name}</p>
                      <p className="text-[11px] text-slate-500 font-semibold">{user.email}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg inline-block border ${
                        user.role === 'FINANCE_ADMIN' ? 'bg-purple-100 text-purple-950 border-purple-300' :
                        user.role === 'SELLER' ? 'bg-emerald-100 text-emerald-950 border-emerald-300' :
                        user.role === 'COURIER' ? 'bg-blue-100 text-blue-950 border-blue-300' :
                        user.role === 'OFFICE_STAFF' ? 'bg-amber-100 text-amber-950 border-amber-300' :
                        'bg-slate-200 text-slate-950 border-slate-300'
                      }`}>
                        {user.role.replace('_STAFF', '').replace('_ADMIN', '')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-800">
                      {user.officeName || 'Zyra Qendrore Tiranë'}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => updateUser(user.id, { isDemoUser: !user.isDemoUser })}
                        className={`py-1.5 px-3 rounded-full text-[10px] font-black border flex items-center gap-1.5 transition active:scale-95 ${
                          user.isDemoUser
                            ? 'bg-[#f6d55c] text-slate-950 border-amber-400 shadow-xs hover:bg-amber-400'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                        title="Klikoni për ta caktuar apo hequr nga lista e Login Demo"
                      >
                        <span className={`w-2 h-2 rounded-full ${user.isDemoUser ? 'bg-amber-800 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{user.isDemoUser ? '✓ DEMO USER' : 'JO DEMO'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.role === 'PENDING' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          NË PRITJE
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          AKTIV
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-[#f6d55c] text-slate-950 font-bold border border-slate-300 transition"
                          title="Ndrysho të dhënat"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingUser(user)}
                          disabled={currentUser.id === user.id}
                          className={`p-2 rounded-xl border transition ${
                            currentUser.id === user.id
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                          }`}
                          title="Fshi përdoruesin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-black text-base text-slate-950 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>Ndrysho Përdoruesin</span>
              </h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-950 font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-slate-950 mb-1 font-black">Emri & Mbiemri / Biznesi</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Adresa Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Roli i Caktuar</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                >
                  <option value="SELLER">{t.roles.SELLER}</option>
                  <option value="COURIER">{t.roles.COURIER}</option>
                  <option value="OFFICE_STAFF">{t.roles.OFFICE_STAFF}</option>
                  <option value="FINANCE_ADMIN">{t.roles.FINANCE_ADMIN}</option>
                  <option value="ADMIN">{t.roles.ADMIN}</option>
                  <option value="PENDING">{t.roles.PENDING}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black">Zyra Postare përkatëse</label>
                <select
                  value={editOfficeId}
                  onChange={e => setEditOfficeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                >
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.city} - {o.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setEditIsDemoUser(!editIsDemoUser)}>
                <div>
                  <span className="font-black text-slate-950 text-xs block">Përdorues Demo (Demo User)</span>
                  <span className="text-[10px] text-slate-600 font-semibold">Shfaqet te lista e hyrjes së shpejtë në faqen Login</span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsDemoUser}
                  onChange={e => setEditIsDemoUser(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-300 rounded-xl px-3.5 py-2.5 text-xs text-red-700 font-bold">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isSubmitting}
                  className="w-1/2 sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs disabled:opacity-50"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 sm:w-auto py-3 px-4 rounded-xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs border border-amber-300 shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Duke ruajtur...</span></>
                  ) : (
                    <span>Ruaj Ndryshimet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-black text-base text-slate-950">A jeni i sigurt?</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Po fshini përdoruesin <span className="font-black text-slate-950">{deletingUser.name}</span> ({deletingUser.email}).
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                Anulo
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-1/2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Duke fshirë...</span></>
                ) : (
                  <span>Po, Fshije</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
