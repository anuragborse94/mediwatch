const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getQueue() {
    const res = await fetch(`${API_BASE}/queue`);
    if (!res.ok) throw new Error('Failed to fetch emergency queue');
    return res.json();
  },

  async callNextPatient() {
    const res = await fetch(`${API_BASE}/queue/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to call next patient');
    }
    return res.json();
  },

  async registerPatient(patientData) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to register patient');
    }
    return res.json();
  },

  async getPatients(search = '', status = 'All') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    const res = await fetch(`${API_BASE}/patients?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch patients list');
    return res.json();
  },

  async updatePriority(patientId, urgency) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urgency }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update urgency');
    }
    return res.json();
  },

  // --- Dynamic Doctor Management APIs ---

  async getDoctors(activeOnly = false) {
    const url = activeOnly ? `${API_BASE}/doctors?active_only=true` : `${API_BASE}/doctors`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch doctors list');
    return res.json();
  },

  async getNextDoctorId() {
    const res = await fetch(`${API_BASE}/doctors/next-id`);
    if (!res.ok) throw new Error('Failed to get recommended doctor ID');
    return res.json();
  },

  async createDoctor(doctorData) {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create doctor');
    }
    return res.json();
  },

  async updateDoctor(doctorId, doctorData) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update doctor');
    }
    return res.json();
  },

  async deactivateDoctor(doctorId) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/deactivate`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to deactivate doctor');
    }
    return res.json();
  },

  async activateDoctor(doctorId) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/activate`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to activate doctor');
    }
    return res.json();
  },

  async deleteDoctor(doctorId) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete doctor');
    }
    return res.json();
  },

  async assignDoctor(doctorId, patientId) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to assign doctor');
    }
    return res.json();
  },

  async completeConsultation(patientId) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/complete`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to complete consultation');
    }
    return res.json();
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    return res.json();
  }
};
