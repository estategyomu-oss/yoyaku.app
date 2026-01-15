
export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
  email: string;
  company: string;
  role: Role;
  password?: string; // Stored in mock DB
}

export interface Slot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  isReserved?: boolean;
  reservationId?: string;
  reservedByCompany?: string;
}

export interface Reservation {
  id: string;
  slotId: string;
  userId: string;
  company: string;
  date: string;
}
