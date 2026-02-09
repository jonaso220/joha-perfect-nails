import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  WeeklySchedule,
  BlockedDate,
  NailService,
  Appointment,
} from "./types";

// --- Schedule ---
export async function getWeeklySchedule(): Promise<WeeklySchedule> {
  const docRef = doc(db, "settings", "weeklySchedule");
  const snap = await getDoc(docRef);
  if (snap.exists()) return snap.data() as WeeklySchedule;
  return getDefaultSchedule();
}

export async function saveWeeklySchedule(schedule: WeeklySchedule) {
  const docRef = doc(db, "settings", "weeklySchedule");
  await setDoc(docRef, schedule);
}

export function getDefaultSchedule(): WeeklySchedule {
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const schedule: WeeklySchedule = {};
  days.forEach((day, i) => {
    schedule[day] = {
      enabled: i >= 1 && i <= 5,
      slots: i >= 1 && i <= 5
        ? [{ start: "08:00", end: "12:00" }, { start: "13:30", end: "16:00" }]
        : [],
    };
  });
  return schedule;
}

// --- Blocked Dates (Licencias) ---
export async function getBlockedDates(): Promise<BlockedDate[]> {
  const snap = await getDocs(collection(db, "blockedDates"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlockedDate));
}

export async function addBlockedDate(blocked: Omit<BlockedDate, "id">) {
  return addDoc(collection(db, "blockedDates"), blocked);
}

export async function removeBlockedDate(id: string) {
  return deleteDoc(doc(db, "blockedDates", id));
}

// --- Services ---
export async function getServices(): Promise<NailService[]> {
  const snap = await getDocs(collection(db, "services"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NailService));
}

export async function addService(service: Omit<NailService, "id">) {
  return addDoc(collection(db, "services"), service);
}

export async function updateService(id: string, data: Partial<NailService>) {
  return updateDoc(doc(db, "services", id), data);
}

export async function deleteService(id: string) {
  return deleteDoc(doc(db, "services", id));
}

// --- Appointments ---
export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const q = query(
    collection(db, "appointments"),
    where("date", "==", date),
    where("status", "!=", "cancelled")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
}

export async function getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, "appointments"),
    where("clientId", "==", clientId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const q = query(collection(db, "appointments"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
}

export async function createAppointment(appointment: Omit<Appointment, "id">) {
  return addDoc(collection(db, "appointments"), appointment);
}

export async function updateAppointment(id: string, data: Partial<Appointment>) {
  return updateDoc(doc(db, "appointments", id), data);
}
