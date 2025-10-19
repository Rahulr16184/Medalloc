
export type UserRole = 'hospital' | 'patient' | 'server';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  role: UserRole;
}

export interface Hospital {
  uid: string;
  name: string;
  adminName: string;
  adminEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  totalBeds: number;
  occupiedBeds: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  district?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  hospitalId: string;
}

export type BedStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';

export const bedTypes = [
    'General Ward', 'ICU', 'CCU', 'NICU', 'PICU', 
    'Maternity', 'Emergency', 'Operation Theatre', 
    'Recovery', 'Isolation', 'Private', 'Semi-Private', 
    'Dialysis', 'Burn Unit', 'Step-Down', 'Observation',
    'Palliative', 'Other'
];


export interface Bed {
  id: string;
  bedId: string; // User-defined ID like 'ICU-001'
  type: string; // e.g., 'ICU', 'General Ward'
  status: BedStatus;
  departmentId: string;
  hospitalId: string;
  patientId?: string | null;
  notes?: string;
}
