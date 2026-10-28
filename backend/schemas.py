from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80, description="Full patient name")
    age: int = Field(..., ge=0, le=125, description="Patient age")
    symptoms: str = Field(..., min_length=2, max_length=300, description="Reason for visit or clinical presentation")
    urgency: str = Field("Moderate", description="Demonstration urgency category: Critical, Moderate, Low")
    custom_id: Optional[str] = Field(None, description="Optional custom ID or blank for auto-generation")

class PriorityUpdate(BaseModel):
    urgency: str = Field(..., description="New demonstration urgency: Critical, Moderate, Low")

class AssignDoctorRequest(BaseModel):
    patient_id: str = Field(..., description="ID of patient to assign to doctor")

class PatientResponse(BaseModel):
    patient_id: str
    name: str
    age: int
    symptoms: str
    urgency: str
    priority: int
    arrival_seq: int
    status: str
    created_at: str
    called_at: Optional[str] = None
    completed_at: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    assigned_doctor_name: Optional[str] = None

class DoctorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Physician's full name")
    specialization: str = Field(..., min_length=2, max_length=100, description="Specialty area")
    contact: Optional[str] = Field("", max_length=120, description="Optional phone/extension/pager")
    custom_id: Optional[str] = Field(None, description="Optional custom ID, otherwise auto-generated")

class DoctorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    specialization: Optional[str] = Field(None, min_length=2, max_length=100)
    contact: Optional[str] = Field(None, max_length=120)
    status: Optional[str] = Field(None, description="'Available' or 'Unavailable'")

class DoctorResponse(BaseModel):
    doctor_id: str
    name: str
    specialization: str
    contact: Optional[str] = ""
    status: str
    is_available: bool
    is_active: bool
    current_patient_id: Optional[str] = None
    current_patient_name: Optional[str] = None

class DashboardStats(BaseModel):
    waiting_count: int
    in_consultation_count: int
    completed_count: int
    total_patients: int
    critical_waiting: int
    moderate_waiting: int
    low_waiting: int
    available_doctors: int
    total_doctors: int
    next_patient: Optional[Dict[str, Any]] = None
