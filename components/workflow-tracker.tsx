'use client';

import React from 'react';
import { ShipmentStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { Package, Building2, Archive, MapPin, Truck, CheckCircle2 } from 'lucide-react';

interface WorkflowTrackerProps {
  currentStatus?: ShipmentStatus;
}

export const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({ currentStatus }) => {
  const { t } = useI18n();

  const steps = [
    { key: 'CREATED', label: t.workflow.step1, icon: Package },
    { key: 'PICKED_UP', label: t.workflow.step2, icon: Building2 },
    { key: 'IN_TRANSIT', label: t.workflow.step3, icon: Archive },
    { key: 'AT_DESTINATION', label: t.workflow.step4, icon: MapPin },
    { key: 'OUT_FOR_DELIVERY', label: t.workflow.step5, icon: Truck },
    { key: 'CLOSED', label: t.workflow.step6, icon: CheckCircle2 },
  ];

  const getStepIndex = (status?: ShipmentStatus) => {
    switch (status) {
      case 'CREATED': return 0;
      case 'PICKED_UP': return 1;
      case 'IN_TRANSIT': return 2;
      case 'AT_DESTINATION': return 3;
      case 'OUT_FOR_DELIVERY': return 4;
      case 'DELIVERED_PENDING_SETTLEMENT': return 4;
      case 'CLOSED': return 5;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isClosed = currentStatus === 'CLOSED';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 text-slate-900 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${isClosed ? 'bg-emerald-500 border border-emerald-600 animate-pulse' : 'bg-[#f6d55c] border border-amber-400'}`} />
          <span>Rrjedha e Dërgesës (Delivery Pipeline)</span>
        </h3>
        {isClosed && (
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ E Likuiduar Përfundimisht
          </span>
        )}
      </div>
      
      {/* Horizontal scrollable stepper */}
      <div className="flex items-center overflow-x-auto pb-2 gap-2 scrollbar-none">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isStepCompleted = isClosed ? true : idx < currentIndex;
          const isStepCurrent = !isClosed && idx === currentIndex;
          const isFinalClosedStep = isClosed && idx === 5;

          let styleClasses = 'bg-slate-50 text-slate-500 border-slate-200';
          if (isFinalClosedStep) {
            styleClasses = 'bg-emerald-600 text-white border-emerald-700 shadow-md font-extrabold';
          } else if (isStepCurrent) {
            styleClasses = 'bg-[#f6d55c] text-slate-950 border-amber-300 shadow-md shadow-amber-300/40 font-black';
          } else if (isStepCompleted || (isClosed && idx < 5)) {
            styleClasses = 'bg-emerald-50 text-emerald-950 border-emerald-300 font-black';
          }

          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs transition ${styleClasses}`}>
                <Icon className={`w-4 h-4 ${isFinalClosedStep ? 'text-white font-bold' : isStepCurrent ? 'animate-pulse text-slate-950' : 'text-emerald-700'}`} />
                <span className="whitespace-nowrap font-black">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 rounded ${idx <= currentIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
