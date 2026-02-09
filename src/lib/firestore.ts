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
} from "firebase/firestore";
import { db } from "./firebase";
import {
  WeeklySchedule,
  BlockedDate,
  NailService,
  Appointment,
  GalleryItem,
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
    where("date", "==", date)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Appointment))
    .filter((a) => a.status !== "cancelled");
}

export async function getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, "appointments"),
    where("clientId", "==", clientId)
  );
  const snap = await getDocs(q);
  const appointments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
  return appointments.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const snap = await getDocs(collection(db, "appointments"));
  const appointments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
  return appointments.sort((a, b) => b.date.localeCompare(a.date));
}

export async function createAppointment(appointment: Omit<Appointment, "id">) {
  return addDoc(collection(db, "appointments"), appointment);
}

export async function updateAppointment(id: string, data: Partial<Appointment>) {
  return updateDoc(doc(db, "appointments", id), data);
}

// --- Gallery ---
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const snap = await getDocs(collection(db, "gallery"));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addGalleryItem(item: Omit<GalleryItem, "id">) {
  return addDoc(collection(db, "gallery"), item);
}

export async function deleteGalleryItem(id: string) {
  return deleteDoc(doc(db, "gallery", id));
}

// --- Settings ---
export async function getAdminWhatsApp(): Promise<string> {
  const docRef = doc(db, "settings", "contact");
  const snap = await getDoc(docRef);
  if (snap.exists()) return (snap.data() as { whatsapp: string }).whatsapp || "";
  return "";
}

export async function saveAdminWhatsApp(whatsapp: string) {
  const docRef = doc(db, "settings", "contact");
  await setDoc(docRef, { whatsapp });
}
