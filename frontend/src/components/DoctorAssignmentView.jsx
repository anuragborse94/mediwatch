import React, { useState } from 'react';
import { 
  Stethoscope, 
  CheckCircle, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  UserX,
  UserPlus,
  Edit3,
  Power,
  Phone,
  X,
  AlertTriangle,
  RotateCw,
  Trash2
} from 'lucide-react';

export default function DoctorAssignmentView({ 
  doctors, 
  consultingPatients, 
  onAssignDoctor, 
  onCompleteConsultation, 
  onCreateDoctor,
  onUpdateDoctor,
  onDeactivateDoctor,
  onActivateDoctor,
  onDeleteDoctor,
  onGetNextDoctorId,
  isLoading 
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Delete Confirmation Modal State
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  // Add Doctor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDoctorData, setNewDoctorData] = useState({
    name: '',
    specialization: 'Emergency Medicine',
    contact: '',
    custom_id: ''
  });
  const [addDoctorError, setAddDoctorError] = useState('');

  // Edit Doctor Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    specialization: '',
    contact: '',
    status: 'Available'
  });
  const [editDoctorError, setEditDoctorError] = useState('');

  const specializationOptions = [
    'Trauma & Acute Care',
    'Emergency Medicine',
    'Critical Care',
    'Emergency Diagnostics',
    'Other'
  ];

  // Open Add Doctor Modal & pre-fetch recommended ID
  const handleOpenAddModal = async () => {
    setAddDoctorError('');
    try {
      let recId = '';
      if (onGetNextDoctorId) {
        const res = await onGetNextDoctorId();
        recId = res.next_id || '';
      }
      setNewDoctorData({
        name: '',
        specialization: 'Emergency Medicine',
        contact: '',
        custom_id: recId
      });
      setIsAddModalOpen(true);
    } catch (err) {
      setIsAddModalOpen(true);
    }
  };

  // Submit Add Doctor
  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    setAddDoctorError('');

    if (!newDoctorData.name.trim()) {
      setAddDoctorError('Doctor full name is required.');
      return;
    }
    if (!newDoctorData.specialization.trim()) {
      setAddDoctorError('Specialization is required.');
      return;
    }

    try {
      await onCreateDoctor({
        name: newDoctorData.name.trim(),
        specialization: newDoctorData.specialization.trim(),
        contact: newDoctorData.contact.trim(),
        custom_id: newDoctorData.custom_id.trim() || undefined
      });
      setIsAddModalOpen(false);
      setActionSuccess(`Doctor ${newDoctorData.name.trim()} added successfully.`);
    } catch (err) {
      setAddDoctorError(err.message || 'Failed to add doctor');
    }
  };

  // Open Edit Doctor Modal
  const handleOpenEditModal = (doc) => {
    setEditingDoctor(doc);
    setEditFormData({
      name: doc.name,
      specialization: doc.specialization,
      contact: doc.contact || '',
      status: doc.status || (doc.is_available ? 'Available' : 'Unavailable')
    });
    setEditDoctorError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit Doctor
  const handleEditDoctorSubmit = async (e) => {
    e.preventDefault();
    setEditDoctorError('');

    if (!editFormData.name.trim()) {
      setEditDoctorError('Doctor name cannot be blank.');
      return;
    }

    try {
      await onUpdateDoctor(editingDoctor.doctor_id, {
        name: editFormData.name.trim(),
        specialization: editFormData.specialization.trim(),
        contact: editFormData.contact.trim(),
        status: editingDoctor.status === 'In Consultation' ? undefined : editFormData.status
      });
      setIsEditModalOpen(false);
      setActionSuccess(`Physician profile updated successfully.`);
    } catch (err) {
      setEditDoctorError(err.message || 'Failed to update doctor');
    }
  };

  // Deactivate Doctor
  const handleDeactivate = async (doc) => {
    if (doc.status === 'In Consultation' || doc.current_patient_id) {
      setAssignError(`Cannot deactivate ${doc.name} while they are attending patient ${doc.current_patient_id}. Complete consultation first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to deactivate ${doc.name}? They will be marked unavailable and removed from assignment options.`)) {
      return;
    }

    try {
      await onDeactivateDoctor(doc.doctor_id);
      setActionSuccess(`Physician ${doc.name} has been deactivated.`);
    } catch (err) {
      setAssignError(err.message || 'Failed to deactivate doctor');
    }
  };

  // Reactivate Doctor
  const handleActivate = async (doc) => {
    try {
      await onActivateDoctor(doc.doctor_id);
      setActionSuccess(`Physician ${doc.name} has been reactivated and is now available for duty.`);
    } catch (err) {
      setAssignError(err.message || 'Failed to reactivate doctor');
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (doc) => {
    setDeleteModalError('');
    setDoctorToDelete(doc);
  };

  // Confirm and Execute Permanent Deletion
  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    setDeleteModalError('');
    try {
      await onDeleteDoctor(doctorToDelete.doctor_id);
      setActionSuccess(`Physician ${doctorToDelete.name} (${doctorToDelete.doctor_id}) was permanently deleted.`);
      setDoctorToDelete(null);
    } catch (err) {
      setDeleteModalError(err.message || 'Failed to delete doctor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignError('');
    setActionSuccess('');

    if (!selectedDoctorId) {
      setAssignError('Please select a doctor.');
      return;
    }
    if (!selectedPatientId) {
      setAssignError('Please select a patient to assign.');
      return;
    }

    try {
      await onAssignDoctor(selectedDoctorId, selectedPatientId);
      setActionSuccess('Patient successfully assigned to doctor.');
      setSelectedPatientId('');
      setSelectedDoctorId('');
    } catch (err) {
      setAssignError(err.message || 'Failed to assign doctor');
    }
  };

  const handleComplete = async (patientId) => {
    if (!window.confirm('Complete consultation for this patient and release physician?')) return;
    try {
      await onCompleteConsultation(patientId);
      setActionSuccess('Consultation completed. Doctor is now available.');
    } catch (err) {
      setAssignError(err.message || 'Failed to complete consultation');
    }
  };

  // Rule 3: Only active and available doctors appear in assignment dropdown
  const availableDoctors = doctors.filter((d) => d.is_available && d.is_active && !d.current_patient_id);

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {assignError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{assignError}</span>
          </div>
          <button onClick={() => setAssignError('')} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Assignment Control Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Stethoscope className="w-5 h-5 text-teal-600" />
          Assign Called Patient to Available Physician
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Select an available ER physician and assign an active triage patient. Only 1 active consultation is permitted per doctor.
        </p>

        <form onSubmit={handleAssignSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Select Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Available Physician
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Choose Available Doctor --</option>
              {availableDoctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.name} ({doc.specialization}) - [{doc.doctor_id}]
                </option>
              ))}
            </select>
            {availableDoctors.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                No physicians currently available. Complete an existing consultation or add a doctor.
              </p>
            )}
          </div>

          {/* Select Patient */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Called / Waiting Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Choose Patient --</option>
              {consultingPatients.map((pat) => (
                <option key={pat.patient_id} value={pat.patient_id}>
                  {pat.name} ({pat.patient_id}) - {pat.urgency} [{pat.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || availableDoctors.length === 0 || consultingPatients.length === 0}
              className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Assign Doctor
            </button>
          </div>
        </form>
      </div>

      {/* ER Doctors Roster Section with "+ Add Doctor" Button */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Emergency Department Physicians Roster ({doctors.length} Doctors Registered)
            </h4>
            <p className="text-[11px] text-slate-400">
              Manage physician availability, consult assignments, and clinical specialties dynamically.
            </p>
          </div>

          {/* "+ Add Doctor" Button (Strict requirement from Section 1) */}
          <button
            onClick={handleOpenAddModal}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Add Doctor
          </button>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {doctors.map((doc) => {
            const isConsulting = doc.status === 'In Consultation' || !!doc.current_patient_id;
            const isDeactivated = !doc.is_active;
            const isAvailable = doc.is_available && doc.is_active && !isConsulting;

            let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
            let badgeText = '● Available';
            let cardBorder = 'border-emerald-200 bg-gradient-to-b from-emerald-50/20 to-white';

            if (isDeactivated) {
              badgeClass = 'bg-slate-100 text-slate-500 border-slate-300';
              badgeText = '● Deactivated';
              cardBorder = 'border-slate-200 bg-slate-50/60 opacity-80';
            } else if (isConsulting) {
              badgeClass = 'bg-blue-50 text-blue-700 border-blue-300';
              badgeText = '● In Consultation';
              cardBorder = 'border-blue-200 bg-gradient-to-b from-blue-50/20 to-white';
            } else if (doc.status === 'Unavailable') {
              badgeClass = 'bg-amber-50 text-amber-700 border-amber-300';
              badgeText = '● Unavailable';
              cardBorder = 'border-amber-200 bg-white';
            }

            return (
              <div 
                key={doc.doctor_id}
                className={`rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between ${cardBorder}`}
              >
                <div>
                  {/* Top Bar with ID & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {doc.doctor_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <h5 className="font-bold text-sm text-slate-900">{doc.name}</h5>
                  <p className="text-[11px] font-medium text-teal-800 mb-1">{doc.specialization}</p>
                  
                  {doc.contact && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-2">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {doc.contact}
                    </p>
                  )}
                </div>

                {/* Consultation Details & Actions */}
                <div className="pt-3 border-t border-slate-100 text-xs mt-2 space-y-2.5">
                  {isConsulting ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50/90 p-2 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
                        <span className="text-[10px] uppercase font-bold text-blue-600 block">Attending Patient</span>
                        <strong>{doc.current_patient_name}</strong>
                        <span className="block font-mono text-[10px] text-blue-700">({doc.current_patient_id})</span>
                      </div>
                      <button
                        onClick={() => handleComplete(doc.current_patient_id)}
                        disabled={isLoading}
                        className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                      >
                        Complete Consultation
                      </button>
                    </div>
                  ) : isAvailable ? (
                    <div className="text-slate-400 flex items-center gap-1.5 text-[11px] py-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Ready for patient assignment
                    </div>
                  ) : isDeactivated ? (
                    <div className="text-slate-400 flex items-center gap-1.5 text-[11px] py-1">
                      <UserX className="w-3.5 h-3.5 text-slate-400" />
                      Deactivated (Not on duty)
                    </div>
                  ) : (
                    <div className="text-amber-600 text-[11px] py-1">
                      Temporarily unavailable
                    </div>
                  )}

                  {/* Action Buttons: Edit, Deactivate/Activate, and Delete */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditModal(doc)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                      title="Edit doctor name, specialization, or contact info"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      Edit
                    </button>

                    {isDeactivated ? (
                      <button
                        onClick={() => handleActivate(doc)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 py-1.5 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title="Reactivate physician for patient assignments"
                      >
                        <RotateCw className="w-3 h-3 text-emerald-600" />
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(doc)}
                        disabled={isLoading || isConsulting}
                        className={`inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 px-1.5 rounded-lg transition-colors ${
                          isConsulting 
                            ? 'text-slate-300 cursor-not-allowed bg-slate-50' 
                            : 'text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                        }`}
                        title={isConsulting ? "Cannot deactivate while attending patient" : "Deactivate physician"}
                      >
                        <Power className="w-3 h-3 text-amber-600" />
                        Deactivate
                      </button>
                    )}

                    {/* Red Delete Button with Trash Icon */}
                    <button
                      onClick={() => handleOpenDeleteModal(doc)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 py-1.5 px-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                      title="Permanently delete doctor record"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= ADD DOCTOR MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Add New Emergency Physician</h3>
                  <p className="text-[11px] text-slate-500">Register doctor to the SQLite active staff directory</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addDoctorError && (
              <div className="mx-5 mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{addDoctorError}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctorSubmit} className="p-5 space-y-4">
              {/* Doctor ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor ID <span className="text-slate-400 font-normal">(Auto-Generated)</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorData.custom_id}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, custom_id: e.target.value })}
                  placeholder="e.g. DOC-105"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Elena Rostova"
                  value={newDoctorData.name}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialization <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newDoctorData.specialization}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, specialization: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {specializationOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Info / Location <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ext. 4015 / Trauma Bay 3"
                  value={newDoctorData.contact}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, contact: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Footer buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-600/30 transition-all"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT DOCTOR MODAL ================= */}
      {isEditModalOpen && editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Edit Physician Profile</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{editingDoctor.doctor_id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editDoctorError && (
              <div className="mx-5 mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{editDoctorError}</span>
              </div>
            )}

            <form onSubmit={handleEditDoctorSubmit} className="p-5 space-y-4">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialization <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {specializationOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Info / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ext. 4015"
                  value={editFormData.contact}
                  onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Availability Status (only editable if not in active consultation) */}
              {editingDoctor.status !== 'In Consultation' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duty Availability Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Available">Available (Ready for triage assignments)</option>
                    <option value="Unavailable">Unavailable (Off duty / On break)</option>
                  </select>
                </div>
              )}

              {/* Footer buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-600/30 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Delete Physician Record</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{doctorToDelete.doctor_id}</p>
                </div>
              </div>
              <button
                onClick={() => { setDoctorToDelete(null); setDeleteModalError(''); }}
                disabled={isDeleting}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 text-sm">{doctorToDelete.name}</div>
                <div className="text-slate-500 mt-0.5">{doctorToDelete.specialization} • ID: <span className="font-mono">{doctorToDelete.doctor_id}</span></div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete this doctor? This action cannot be undone.
              </p>

              {deleteModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{deleteModalError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => { setDoctorToDelete(null); setDeleteModalError(''); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting...' : 'Delete Doctor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
