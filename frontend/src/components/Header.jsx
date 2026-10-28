import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Header({ 
  activeTab, 
  onRefresh, 
  isLoading,
  notification 
}) {
  const titles = {
    dashboard: { 
      title: 'Emergency Department Overview', 
      subtitle: 'Monitor patient intake, consultations, and physician availability.' 
    },
    register: { 
      title: 'Patient Intake', 
      subtitle: 'Record patient details and triage urgency categorization.' 
    },
    queue: { 
      title: 'Waiting Patients', 
      subtitle: 'Prioritized emergency waiting queue and intake sequencing.' 
    },
    doctors: { 
      title: 'Physicians & Consultations', 
      subtitle: 'Manage on-duty physician assignments and active patient evaluations.' 
    },
    records: { 
      title: 'Patient Records', 
      subtitle: 'Comprehensive audit trail of emergency department attendances.' 
    }
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{current.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{current.subtitle}</p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
          notification.type === 'error'
            ? 'bg-rose-50 border border-rose-200 text-rose-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </header>
  );
}
