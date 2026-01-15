
export enum Role {
  admin = 'admin',
  user = 'user'
}

export interface User {
  id: string;
  email: string;
  company: string;
  role: Role;
  password?: string;
}

export interface Slot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  reservedCount: number;
  maxCapacity: number;
  isFull: boolean;
  reservations: Reservation[]; // Changed from reservedByCompanies: string[]
}

export interface Reservation {
  id: string;
  slotId: string;
  userId: string;
  company: string;
  date: string;
}
