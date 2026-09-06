'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';
import { CourierSidebar } from '@/components/courier-sidebar';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['COURIER', 'COURIER_TRANSPORT', 'COURIER_DELIVERY', 'FINANCE_ADMIN']}>
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col md:flex-row">
        <CourierSidebar />
        <div className="flex-1 md:ml-64 min-w-0 w-full px-4 md:px-8 py-4 md:py-6">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
