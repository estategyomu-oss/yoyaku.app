
import { Role, User, Slot, Reservation } from '../types';

const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@internal', company: 'INTERNAL', role: Role.admin, password: 'password123' },
  { id: '2', email: 'a@company', company: 'A', role: Role.user, password: 'password123' },
  { id: '3', email: 'b@company', company: 'B', role: Role.user, password: 'password123' },
];

const MAX_CAPACITY_PER_SLOT = 2;

class MockDB {
  private users: User[] = [];
  private slots: { id: string; date: string; startTime: string }[] = [];
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

  // Helper to ensure data is fresh before any modification
  private sync() {
    this.load();
  }

  async login(email: string, password?: string): Promise<User | null> {
    this.sync();
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    if (password && user.password !== password) return null;
    return user;
  }

  async signup(email: string, password: string, company: string): Promise<User> {
    this.sync();
    const existing = this.users.find(u => u.email === email);
    if (existing) throw new Error('このメールアドレスは既に登録されています');

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password,
      company,
      role: Role.user,
    };

    this.users.push(newUser);
    this.persist();
    return newUser;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    this.sync();
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    
    this.users[index] = { ...this.users[index], ...data };
    this.persist();
    return this.users[index];
  }

  async generateSlots(date: string): Promise<number> {
    this.sync();
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
    this.sync();
    return this.slots
      .filter(s => s.date === date)
      .map(slot => {
        const slotReservations = this.reservations.filter(r => r.slotId === slot.id);
        return {
          ...slot,
          reservedCount: slotReservations.length,
          maxCapacity: MAX_CAPACITY_PER_SLOT,
          isFull: slotReservations.length >= MAX_CAPACITY_PER_SLOT,
          reservations: slotReservations
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async createReservation(userId: string, slotId: string): Promise<Reservation> {
    this.sync();
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) throw new Error('Slot not found');

    const slotReservations = this.reservations.filter(r => r.slotId === slotId);
    if (slotReservations.length >= MAX_CAPACITY_PER_SLOT) {
      throw new Error('この時間枠は既に満員です（最大2台まで）');
    }

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

  async moveReservation(userId: string, reservationId: string, newSlotId: string): Promise<Reservation> {
    this.sync();
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const resIndex = this.reservations.findIndex(r => r.id === reservationId);
    if (resIndex === -1) throw new Error('Reservation not found');
    
    const res = this.reservations[resIndex];
    if (res.company !== user.company && user.role !== Role.admin) {
      throw new Error('Unauthorized');
    }

    const newSlot = this.slots.find(s => s.id === newSlotId);
    if (!newSlot) throw new Error('Target slot not found');

    const newSlotReservations = this.reservations.filter(r => r.slotId === newSlotId);
    if (newSlotReservations.length >= MAX_CAPACITY_PER_SLOT) {
      throw new Error('変更先の時間枠は既に満員です');
    }

    // Update the reservation
    const updatedRes = {
      ...res,
      slotId: newSlotId,
      date: newSlot.date
    };

    this.reservations[resIndex] = updatedRes;
    this.persist();
    return updatedRes;
  }

  async cancelReservation(userId: string, reservationId: string): Promise<void> {
    this.sync();
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const resIndex = this.reservations.findIndex(r => r.id === reservationId);
    if (resIndex === -1) throw new Error('Reservation not found');

    const res = this.reservations[resIndex];
    if (res.company !== user.company && user.role !== Role.admin) {
      throw new Error('Unauthorized');
    }

    // Use filter for immutable update instead of splice to ensure predictability
    this.reservations = this.reservations.filter(r => r.id !== reservationId);
    this.persist();
  }

  async getMyReservations(company: string): Promise<(Reservation & { slot: { id: string; date: string; startTime: string } })[]> {
    this.sync();
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
