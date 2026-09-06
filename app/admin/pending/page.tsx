'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthenticatedState } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Clock, UserCheck, CheckCircle2, Shield, Building2, UserPlus } from 'lucide-react';

export default function AdminPendingUsersPage() {
  const { users, offices, approveUserRole } = useAuthenticatedState();
  const { t } = useI18n();

  const [selectedRole, setSelectedRole] = useState<Record<string, UserRole>>({});
  const [selectedOffice, setSelectedOffice] = useState<Record<string, string>>({});
  const [approvedUsers, setApprovedUsers] = useState<string[]>([]);

  const pendingUsers = users.filter(u => u.role === 'PENDING');

  const handleApprove = (userId: string) => {
    const roleToAssign = selectedRole[userId] || 'SELLER';
    const officeToAssign = selectedOffice[userId] || offices[0].id;
    approveUserRole(userId, roleToAssign, officeToAssign);
    setApprovedUsers(prev => [...prev, userId]);
  };

  return (
    <main className="w-full space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#f6d55c] to-amber-200 border border-amber-300 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.nav.admin}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1.5">Kërkesat e Reja në Pritje</h1>
          <p className="text-xs font-bold text-slate-800">Shqyrtimi i Regjistrimeve të Reja dhe Caktimi i Roleve & Zyrave</p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#f6d55c] shadow-md flex-shrink-0">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Main Pending Approvals List */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-950 text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <span>Regjistrimet në Pritje të Aprovimit ({pendingUsers.length})</span>
          </h2>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-md">
            <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-black text-base text-slate-950">Gjithçka e Aprovuar!</h3>
            <p className="text-xs text-slate-600 font-bold max-w-sm mx-auto">
              Nuk ka asnjë kërkesë të re regjistrimi në pritje. Të gjithë përdoruesit janë aktivizuar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map(user => (
              <div
                key={user.id}
                className="bg-white border border-amber-300 rounded-3xl p-5 shadow-md space-y-4 font-bold text-xs hover:border-amber-400 transition"
              >
                {/* User Info Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-950 text-sm flex items-center gap-1.5">
                      <span>{user.name}</span>
                      <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        Regjistrim i Ri
                      </span>
                    </h3>
                    <p className="text-slate-600 font-semibold text-[11px] mt-0.5">{user.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{user.createdAt}</span>
                </div>

                {/* Role & Branch Selection Controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-950 font-black mb-1">1. Cakto Rolin e Përdoruesit</label>
                    <select
                      value={selectedRole[user.id] || 'SELLER'}
                      onChange={e => setSelectedRole({ ...selectedRole, [user.id]: e.target.value as UserRole })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                    >
                      <option value="SELLER">{t.roles.SELLER}</option>
                      <option value="COURIER">{t.roles.COURIER}</option>
                      <option value="OFFICE_STAFF">{t.roles.OFFICE_STAFF}</option>
                      <option value="FINANCE_ADMIN">{t.roles.FINANCE_ADMIN}</option>
                      <option value="ADMIN">{t.roles.ADMIN}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-950 font-black mb-1">2. Cakto Zyrën Postare</label>
                    <select
                      value={selectedOffice[user.id] || offices[0].id}
                      onChange={e => setSelectedOffice({ ...selectedOffice, [user.id]: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c]"
                    >
                      {offices.map(o => (
                        <option key={o.id} value={o.id}>{o.city} ({o.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Approve Button */}
                <button
                  onClick={() => handleApprove(user.id)}
                  className="w-full py-3.5 px-4 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md border border-amber-300 transition active:scale-95 mt-2"
                >
                  <UserCheck className="w-4 h-4 text-slate-950" />
                  <span>Aprovo & Aktivizo Përdoruesin</span>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

    </main>
  );
}
