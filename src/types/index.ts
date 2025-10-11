
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
