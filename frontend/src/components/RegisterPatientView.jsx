import React, { useState } from 'react';
import { 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';

export default function RegisterPatientView({ onRegister, onRegisteredSuccess, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    symptoms: '',
    urgency: 'Moderate',
    custom_id: ''
  });
  const [validationError, setValidationError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const urgencyOptions = [
    {
      value: 'Critical',
      label: 'Critical',
      desc: 'Severe, life-threatening symptoms requiring immediate resuscitation',
      color: 'border-rose-300 bg-rose-50/60 text-rose-900',
      activeColor: 'ring-2 ring-rose-500 bg-rose-100/70 border-rose-500 text-rose-950 font-semibold'
    },
    {
      value: 'Moderate',
      label: 'Moderate',
      desc: 'Urgent medical attention needed for acute conditions',
      color: 'border-amber-300 bg-amber-50/60 text-amber-900',
      activeColor: 'ring-2 ring-amber-500 bg-amber-100/70 border-amber-500 text-amber-950 font-semibold'
    },
    {
      value: 'Low',
      label: 'Low',
      desc: 'Non-emergency presentation for standard clinical intake',
      color: 'border-emerald-300 bg-emerald-50/60 text-emerald-900',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-100/70 border-emerald-500 text-emerald-950 font-semibold'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessInfo(null);

    // Form Validations
    if (!formData.name.trim()) {
      setValidationError('Patient name is required.');
      return;
    }
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 125) {
      setValidationError('Please enter a valid age between 0 and 125.');
      return;
    }
    if (!formData.symptoms.trim()) {
      setValidationError('Symptoms or reason for visit must be specified.');
      return;
    }

    try {
      const result = await onRegister({
        name: formData.name.trim(),
        age: ageNum,
        symptoms: formData.symptoms.trim(),
        urgency: formData.urgency,
        custom_id: formData.custom_id.trim() || undefined
      });

      setSuccessInfo(result.patient);
      setFormData({
        name: '',
        age: '',
        symptoms: '',
        urgency: 'Moderate',
        custom_id: ''
      });
    } catch (err) {
      setValidationError(err.message || 'Failed to register patient');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Clinical Notice (Section 4 requirements) */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 leading-relaxed">
          Record patient details and assign an initial urgency category according to your hospital's approved triage protocol. Final clinical decisions must be made by qualified healthcare professionals.
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            Patient Intake & Triage Registration
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Enter patient identification, clinical presentation, and initial triage categorization.
          </p>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 mt-6 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Success Confirmation Card */}
        {successInfo && (
          <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Patient Admitted to Emergency Waiting Queue
              </span>
              <button
                onClick={() => onRegisteredSuccess && onRegisteredSuccess()}
                className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-800 underline"
              >
                View Waiting Patients <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 text-emerald-900">
              <div><strong>Patient ID:</strong> {successInfo.patient_id}</div>
              <div><strong>Name:</strong> {successInfo.name}</div>
              <div><strong>Urgency:</strong> {successInfo.urgency}</div>
              <div><strong>Arrival Seq:</strong> #{successInfo.arrival_seq}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Eleanor Vance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max="125"
                placeholder="e.g. 52"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Visit / Clinical Presentation <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Sudden severe chest tightness radiating to jaw, diaphoresis"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
          </div>

          {/* Urgency Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Triage Urgency Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {urgencyOptions.map((opt) => {
                const isSelected = formData.urgency === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, urgency: opt.value })}
                    className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                      isSelected ? opt.activeColor : `${opt.color} hover:bg-opacity-80`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{opt.label}</span>
                    </div>
                    <p className="text-[11px] leading-tight opacity-90">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient ID (Optional) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Medical Record / Patient ID <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Leave blank for auto-generated ID (e.g. P-1005) or enter assigned hospital ID"
              value={formData.custom_id}
              onChange={(e) => setFormData({ ...formData, custom_id: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If left blank, the system automatically assigns a unique sequential patient identifier.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormData({ name: '', age: '', symptoms: '', urgency: 'Moderate', custom_id: '' })}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
