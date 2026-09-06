'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';
import { DeliveryCourierSidebar } from '@/components/delivery-courier-sidebar';

export default function DeliveryCourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['COURIER_DELIVERY', 'COURIER', 'FINANCE_ADMIN']}>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-slate-50">
        <DeliveryCourierSidebar />
        <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
