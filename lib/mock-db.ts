
import { Role, User, Slot, Reservation } from '../types';

const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@internal', company: 'INTERNAL', role: Role.ADMIN, password: 'password123' },
  { id: '2', email: 'a@company', company: 'A', role: Role.USER, password: 'password123' },
  { id: '3', email: 'b@company', company: 'B', role: Role.USER, password: 'password123' },
];

class MockDB {
  private users: User[] = [];
  private slots: Slot[] = [];
  private reservations: Reservation[] = [];

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem('booking_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.slots = parsed.slots || [];
        this.reservations = parsed.reservations || [];
        this.users = parsed.users || INITIAL_USERS;
      } catch (e) {
        console.error("Failed to parse stored DB", e);
        this.users = INITIAL_USERS;
      }
    } else {
      this.users = INITIAL_USERS;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem('booking_db', JSON.stringify({
      slots: this.slots,
      reservations: this.reservations,
      users: this.users
    }));
  }

  async login(email: string, password?: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    // If password provided, check it. If not, just find user (for session restore)
    if (password && user.password !== password) return null;
    return user;
  }

  async signup(email: string, password: string, company: string): Promise<User> {
    const existing = this.users.find(u => u.email === email);
    if (existing) throw new Error('このメールアドレスは既に登録されています');

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password,
      company,
      role: Role.USER,
    };

    this.users.push(newUser);
    this.persist();
    return newUser;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    
    this.users[index] = { ...this.users[index], ...data };
    this.persist();
    return this.users[index];
  }

  async generateSlots(date: string): Promise<number> {
    const startHour = 8;
    const endHour = 18;
    let createdCount = 0;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min of ['00', '30']) {
        const startTime = `${hour.toString().padStart(2, '0')}:${min}`;
        const existing = this.slots.find(s => s.date === date && s.startTime === startTime);
        if (!existing) {
          this.slots.push({
            id: Math.random().toString(36).substr(2, 9),
            date,
            startTime,
          });
          createdCount++;
        }
      }
    }
    this.persist();
    return createdCount;
  }

  async getSlots(date: string): Promise<Slot[]> {
    return this.slots
      .filter(s => s.date === date)
      .map(slot => {
        const res = this.reservations.find(r => r.slotId === slot.id);
        return {
          ...slot,
          isReserved: !!res,
          reservationId: res?.id,
          reservedByCompany: res?.company
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async createReservation(userId: string, slotId: string): Promise<Reservation> {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) throw new Error('Slot not found');

    const alreadyReserved = this.reservations.find(r => r.slotId === slotId);
    if (alreadyReserved) throw new Error('Slot already reserved');

    const newRes: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      slotId,
      userId,
      company: user.company,
      date: slot.date,
    };

    this.reservations.push(newRes);
    this.persist();
    return newRes;
  }

  async cancelReservation(userId: string, reservationId: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const resIndex = this.reservations.findIndex(r => r.id === reservationId);
    if (resIndex === -1) throw new Error('Reservation not found');

    const res = this.reservations[resIndex];
    if (res.company !== user.company && user.role !== Role.ADMIN) {
      throw new Error('Unauthorized');
    }

    this.reservations.splice(resIndex, 1);
    this.persist();
  }

  async getMyReservations(company: string): Promise<(Reservation & { slot: Slot })[]> {
    return this.reservations
      .filter(r => r.company === company)
      .map(r => ({
        ...r,
        slot: this.slots.find(s => s.id === r.slotId)!
      }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.slot.startTime.localeCompare(b.slot.startTime));
  }
}

export const db = new MockDB();
