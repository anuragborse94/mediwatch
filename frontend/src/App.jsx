import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import RegisterPatientView from './components/RegisterPatientView';
import EmergencyQueueView from './components/EmergencyQueueView';
import DoctorAssignmentView from './components/DoctorAssignmentView';
import PatientRecordsView from './components/PatientRecordsView';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Core Data States
  const [stats, setStats] = useState(null);
  const [queueData, setQueueData] = useState({ queue: [], next_patient: null });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Master fetch function
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashRes, queueRes, docRes, patRes] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getQueue().catch(() => ({ queue: [], next_patient: null })),
        api.getDoctors().catch(() => []),
        api.getPatients(searchQuery, statusFilter).catch(() => [])
      ]);

      if (dashRes) setStats(dashRes);
      if (queueRes) setQueueData(queueRes);
      if (docRes) setDoctors(docRes);
      if (patRes) setPatients(patRes);
    } catch (err) {
      console.error('Error loading data:', err);
      showNotification('Failed to connect to backend server. Make sure the hospital server is running on port 8000.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Action: Call Next Patient
  const handleCallNext = async () => {
    setIsLoading(true);
    try {
      const result = await api.callNextPatient();
      showNotification(
        `Called ${result.patient.name} (${result.patient.patient_id}) into consultation.`,
        'success'
      );
      await fetchAllData();
      setActiveTab('doctors');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Register Patient
  const handleRegister = async (patientData) => {
    setIsLoading(true);
    try {
      const result = await api.registerPatient(patientData);
      showNotification(
        `Patient ${result.patient.name} (${result.patient.patient_id}) registered successfully.`,
        'success'
      );
      await fetchAllData();
      return result;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Update Patient Urgency
  const handleUpdatePriority = async (patientId, urgency) => {
    setIsLoading(true);
    try {
      const res = await api.updatePriority(patientId, urgency);
      showNotification(`Updated ${res.patient.name} triage category to ${urgency}.`, 'success');
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Assign Doctor
  const handleAssignDoctor = async (doctorId, patientId) => {
    setIsLoading(true);
    try {
      const res = await api.assignDoctor(doctorId, patientId);
      showNotification(res.message, 'success');
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Create Doctor
  const handleCreateDoctor = async (doctorData) => {
    setIsLoading(true);
    try {
      const res = await api.createDoctor(doctorData);
      showNotification(`Added ${res.name} (${res.doctor_id}) to hospital medical staff.`, 'success');
      await fetchAllData();
      return res;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Update Doctor
  const handleUpdateDoctor = async (doctorId, doctorData) => {
    setIsLoading(true);
    try {
      const res = await api.updateDoctor(doctorId, doctorData);
      showNotification(`Updated profile for ${res.name} (${res.doctor_id}).`, 'success');
      await fetchAllData();
      return res;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Deactivate Doctor
  const handleDeactivateDoctor = async (doctorId) => {
    setIsLoading(true);
    try {
      const res = await api.deactivateDoctor(doctorId);
      showNotification(`Deactivated ${res.name} (${res.doctor_id}).`, 'success');
      await fetchAllData();
      return res;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Activate Doctor
  const handleActivateDoctor = async (doctorId) => {
    setIsLoading(true);
    try {
      const res = await api.activateDoctor(doctorId);
      showNotification(`Reactivated ${res.name} (${res.doctor_id}).`, 'success');
      await fetchAllData();
      return res;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Delete Doctor
  const handleDeleteDoctor = async (doctorId) => {
    setIsLoading(true);
    try {
      const res = await api.deleteDoctor(doctorId);
      showNotification(res.message || `Doctor ${doctorId} was permanently deleted.`, 'success');
      await fetchAllData();
      return res;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Get Next Doctor ID
  const handleGetNextDoctorId = async () => {
    return await api.getNextDoctorId();
  };

  // Action: Complete Consultation
  const handleCompleteConsultation = async (patientId) => {
    setIsLoading(true);
    try {
      const res = await api.completeConsultation(patientId);
      showNotification(res.message, 'success');
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Consulting & waiting patients for doctor assignment
  const eligibleForDoctorAssignment = patients.filter(
    (p) => (p.status === 'In Consultation' || p.status === 'Waiting') && !p.assigned_doctor_id
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased selection:bg-teal-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onRefresh={fetchAllData}
          isLoading={isLoading}
          notification={notification}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              onCallNext={handleCallNext}
              setActiveTab={setActiveTab}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'register' && (
            <RegisterPatientView
              onRegister={handleRegister}
              onRegisteredSuccess={() => setActiveTab('queue')}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'queue' && (
            <EmergencyQueueView
              queueData={queueData}
              onCallNext={handleCallNext}
              onUpdatePriority={handleUpdatePriority}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorAssignmentView
              doctors={doctors}
              consultingPatients={eligibleForDoctorAssignment}
              onAssignDoctor={handleAssignDoctor}
              onCompleteConsultation={handleCompleteConsultation}
              onCreateDoctor={handleCreateDoctor}
              onUpdateDoctor={handleUpdateDoctor}
              onDeactivateDoctor={handleDeactivateDoctor}
              onActivateDoctor={handleActivateDoctor}
              onDeleteDoctor={handleDeleteDoctor}
              onGetNextDoctorId={handleGetNextDoctorId}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'records' && (
            <PatientRecordsView
              patients={patients}
              onSearchChange={setSearchQuery}
              onStatusChange={setStatusFilter}
              currentSearch={searchQuery}
              currentStatus={statusFilter}
              onCompleteConsultation={handleCompleteConsultation}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
