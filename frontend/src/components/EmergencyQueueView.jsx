import React, { useState } from 'react';
import { 
  Users, 
  Volume2, 
  Clock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function EmergencyQueueView({ 
  queueData, 
  onCallNext, 
  onUpdatePriority, 
  isLoading 
}) {
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [selectedUrgency, setSelectedUrgency] = useState('Critical');

  const patients = queueData?.queue || [];
  const nextPatient = queueData?.next_patient;

  const urgencyBadges = {
    Critical: 'bg-rose-100 text-rose-800 border-rose-300',
    Moderate: 'bg-amber-100 text-amber-800 border-amber-300',
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };

  const handlePrioritySubmit = async (patientId) => {
    try {
      await onUpdatePriority(patientId, selectedUrgency);
      setEditingPatientId(null);
    } catch (err) {
      alert(`Error updating urgency: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="text-base font-bold text-slate-800">
              Active Waiting Patients ({patients.length} Waiting)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Emergency department intake ordered by clinical urgency and arrival sequence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCallNext}
            disabled={patients.length === 0 || isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
              patients.length > 0
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Call Next: {nextPatient ? nextPatient.name : 'Queue Empty'}
          </button>
        </div>
      </div>

      {/* Table of Waiting Patients */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Patients Currently Waiting</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All arriving patients have been called into consultation or discharged from emergency triage.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Queue #</th>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Name & Age</th>
                  <th className="py-3 px-4">Symptoms / Presentation</th>
                  <th className="py-3 px-4">Triage Urgency</th>
                  <th className="py-3 px-4">Arrival Sequence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patients.map((p, index) => {
                  const isNext = index === 0;
                  const isEditing = editingPatientId === p.patient_id;

                  return (
                    <tr 
                      key={p.patient_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNext ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      {/* Queue Position */}
                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                            isNext 
                              ? 'bg-teal-600 text-white font-extrabold shadow-sm' 
                              : 'bg-slate-100 text-slate-700 font-semibold'
                          }`}>
                            {index + 1}
                          </span>
                          {isNext && (
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded">
                              NEXT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {p.patient_id}
                      </td>

                      {/* Name & Age */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.age} years old</div>
                      </td>

                      {/* Symptoms */}
                      <td className="py-3.5 px-4 max-w-xs text-slate-700 truncate" title={p.symptoms}>
                        {p.symptoms}
                      </td>

                      {/* Urgency Badge / Inline Editor */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={selectedUrgency}
                              onChange={(e) => setSelectedUrgency(e.target.value)}
                              className="px-2 py-1 text-xs rounded border border-slate-300 font-medium bg-white"
                            >
                              <option value="Critical">Critical</option>
                              <option value="Moderate">Moderate</option>
                              <option value="Low">Low</option>
                            </select>
                            <button
                              onClick={() => handlePrioritySubmit(p.patient_id)}
                              className="px-2 py-1 bg-teal-600 text-white rounded font-bold hover:bg-teal-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPatientId(null)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-700 font-medium"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                              urgencyBadges[p.urgency] || 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}>
                              {p.urgency}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Arrival Seq */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-600 font-medium">
                          Seq #{p.arrival_seq}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {p.created_at ? p.created_at.split(' ')[1] || p.created_at : ''}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingPatientId(p.patient_id);
                              setSelectedUrgency(p.urgency);
                            }}
                            className="px-2 py-1 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="Re-evaluate triage urgency category"
                          >
                            Re-triage
                          </button>
                        )}

                        {isNext && (
                          <button
                            onClick={onCallNext}
                            disabled={isLoading}
                            className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                          >
                            Call Now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
