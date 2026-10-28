import React, { useState } from 'react';
import { 
  FolderClock, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function PatientRecordsView({ 
  patients, 
  onSearchChange, 
  onStatusChange, 
  currentSearch, 
  currentStatus,
  onCompleteConsultation,
  isLoading 
}) {
  const statusTabs = ['All', 'Waiting', 'In Consultation', 'Completed'];

  const urgencyBadges = {
    Critical: 'bg-rose-100 text-rose-800 border-rose-300',
    Moderate: 'bg-amber-100 text-amber-800 border-amber-300',
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };

  const statusBadges = {
    Waiting: 'bg-amber-50 text-amber-700 border-amber-200',
    'In Consultation': 'bg-blue-50 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient ID, Name, or Symptoms..."
            value={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onStatusChange(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                currentStatus === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <FolderClock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Patient Records Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No patient matches the search query or status filter. Try clearing filters or register a patient.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Patient Name & Age</th>
                  <th className="py-3 px-4">Triage Urgency</th>
                  <th className="py-3 px-4">Symptoms / Diagnosis</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Audit Timestamps</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Patient ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {p.patient_id}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.age} yrs • Seq #{p.arrival_seq}</div>
                    </td>

                    {/* Urgency */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                        urgencyBadges[p.urgency] || 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {p.urgency}
                      </span>
                    </td>

                    {/* Symptoms */}
                    <td className="py-3.5 px-4 max-w-xs text-slate-700 truncate" title={p.symptoms}>
                      {p.symptoms}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                        statusBadges[p.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    {/* Attending Doctor */}
                    <td className="py-3.5 px-4">
                      {p.assigned_doctor_name ? (
                        <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>{p.assigned_doctor_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Timestamps */}
                    <td className="py-3.5 px-4 text-[10px] text-slate-500 font-mono space-y-0.5">
                      <div>In: {p.created_at || '—'}</div>
                      {p.called_at && <div className="text-blue-600">Call: {p.called_at}</div>}
                      {p.completed_at && <div className="text-emerald-600 font-bold">Done: {p.completed_at}</div>}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'In Consultation' && (
                        <button
                          onClick={() => onCompleteConsultation(p.patient_id)}
                          disabled={isLoading}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                        >
                          Discharge
                        </button>
                      )}
                      {p.status === 'Completed' && (
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Discharged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

