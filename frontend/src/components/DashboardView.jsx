import React from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Stethoscope, 
  ArrowRight, 
  Volume2, 
  UserPlus,
  AlertCircle,
  Activity,
  HeartPulse
} from 'lucide-react';

export default function DashboardView({ stats, onCallNext, setActiveTab, isLoading }) {
  const nextPatient = stats?.next_patient;

  const urgencyStyles = {
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  return (
    <div className="space-y-6">
      {/* Real-time Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patients Waiting */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Patients Waiting
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.waiting_count ?? 0}
            </span>
            <span className="text-xs text-slate-500">awaiting evaluation</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">
              {stats?.critical_waiting ?? 0} Critical
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
              {stats?.moderate_waiting ?? 0} Moderate
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              {stats?.low_waiting ?? 0} Low
            </span>
          </div>
        </div>

        {/* Patients in Consultation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Patients in Consultation
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.in_consultation_count ?? 0}
            </span>
            <span className="text-xs text-slate-500">with physician</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Active clinical examinations
          </div>
        </div>

        {/* Completed Consultations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Consultations
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.completed_count ?? 0}
            </span>
            <span className="text-xs text-slate-500">discharged / transferred</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Archived in clinical records
          </div>
        </div>

        {/* Available Physicians */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Physicians
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.available_doctors ?? 0}
            </span>
            <span className="text-xs text-slate-500">
              of {stats?.total_doctors ?? 0} active
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${(stats?.available_doctors ?? 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {(stats?.available_doctors ?? 0) > 0 ? 'Ready for patient assignment' : 'All doctors currently engaged'}
          </div>
        </div>
      </div>

      {/* Central Section: Operational Waiting Queue Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-900 text-white inline-flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
                Next Patient for Consultation
              </span>
            </div>

            {nextPatient ? (
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {nextPatient.name}
                  </h3>
                  <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    {nextPatient.patient_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${urgencyStyles[nextPatient.urgency] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {nextPatient.urgency} Urgency
                  </span>
                  <span className="text-xs text-slate-500">
                    Arrival Seq: <strong className="text-slate-800">#{nextPatient.arrival_seq}</strong>
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  <strong className="text-slate-700">Symptoms:</strong> {nextPatient.symptoms || 'Clinical presentation recorded at intake.'}
                  <span className="mx-2 text-slate-300">•</span>
                  <strong className="text-slate-700">Age:</strong> {nextPatient.age} yrs
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-base font-semibold text-slate-700">
                  No patients are currently waiting.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  All registered patients have been called into consultation or discharged.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {nextPatient ? (
              <>
                <button
                  onClick={onCallNext}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  Call Next Patient
                </button>

                <button
                  onClick={() => setActiveTab('queue')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  View Waiting List
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab('register')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Register Patient
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Operational Protocol & Quick References */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            Emergency Triage Protocol
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Patients are scheduled according to clinical urgency and arrival sequence:
          </p>
          <div className="space-y-1.5 text-xs text-slate-700 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span><strong>Critical:</strong> Immediate medical evaluation and resuscitation.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span><strong>Moderate:</strong> Urgent evaluation for acute, non-life-threatening conditions.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span><strong>Low:</strong> Standard emergency department care in order of arrival.</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Physician Consultation Guidelines
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Physicians receive called patients on a 1-to-1 active consultation basis. Once examination and initial emergency treatment conclude, discharging the patient immediately restores physician availability for the next waiting patient.
          </p>
        </div>
      </div>
    </div>
  );
}
