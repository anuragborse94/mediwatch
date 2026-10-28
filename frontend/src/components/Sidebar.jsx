import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Stethoscope, 
  FolderClock, 
  Activity,
  Shield
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Emergency Overview', icon: LayoutDashboard },
    { id: 'register', label: 'Patient Intake', icon: UserPlus },
    { id: 'queue', label: 'Waiting Patients', icon: Users },
    { id: 'doctors', label: 'Physicians & Consultations', icon: Stethoscope },
    { id: 'records', label: 'Patient Records', icon: FolderClock },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-teal-500/20 overflow-hidden shrink-0">
          <img src="/medical_logo.png" alt="MediWatch" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">
            MediWatch
          </h1>
          <p className="text-xs text-slate-400 font-medium">Emergency Operations</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Department Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* System Footer */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-[11px] font-medium text-slate-300">System Connected</span>
        </div>
        <Shield className="w-3.5 h-3.5 text-slate-500" />
      </div>
    </aside>
  );
}
