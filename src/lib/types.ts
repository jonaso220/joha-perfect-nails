export interface TimeSlot {
  start: string; // "HH:mm" format
  end: string;   // "HH:mm" format
}

export interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklySchedule {
  [day: string]: DaySchedule; // 0=domingo, 1=lunes, ..., 6=sábado
}

export interface BlockedDate {
  id?: string;
  date: string;       // "YYYY-MM-DD"
  reason?: string;
}

export interface NailService {
  id?: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface Appointment {
  id?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceId: string;
  serviceName: string;
  date: string;         // "YYYY-MM-DD"
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: "admin" | "client";
  createdAt: string;
}
