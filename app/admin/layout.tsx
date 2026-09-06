'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';
import { AdminSidebar } from '@/components/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col md:flex-row">
        {/* Admin Navigation: Sticky Topbar on Mobile (<768px), Left Sidebar on Desktop (≥768px) */}
        <AdminSidebar />

        {/* Main Content Container */}
        <div className="flex-1 md:ml-64 min-w-0 w-full px-4 md:px-8 py-4 md:py-6">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
