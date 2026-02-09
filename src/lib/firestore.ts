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
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  WeeklySchedule,
  BlockedDate,
  NailService,
  Appointment,
  GalleryItem,
  Review,
  PromoCode,
  WaitlistEntry,
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

// --- Reviews ---
export async function getReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, "reviews"));
  const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReviewByAppointment(appointmentId: string): Promise<Review | null> {
  const q = query(collection(db, "reviews"), where("appointmentId", "==", appointmentId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Review;
}

export async function getReviewsByClient(clientId: string): Promise<Review[]> {
  const q = query(collection(db, "reviews"), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

export async function addReview(review: Omit<Review, "id">) {
  return addDoc(collection(db, "reviews"), review);
}

// --- Promo Codes ---
export async function getPromoCodes(): Promise<PromoCode[]> {
  const snap = await getDocs(collection(db, "promoCodes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PromoCode));
}

export async function addPromoCode(promo: Omit<PromoCode, "id">) {
  return addDoc(collection(db, "promoCodes"), promo);
}

export async function updatePromoCode(id: string, data: Partial<PromoCode>) {
  return updateDoc(doc(db, "promoCodes", id), data);
}

export async function incrementPromoUsage(id: string) {
  return updateDoc(doc(db, "promoCodes", id), { usageCount: increment(1) });
}

export async function deletePromoCode(id: string) {
  return deleteDoc(doc(db, "promoCodes", id));
}

export async function validatePromoCode(code: string): Promise<PromoCode | null> {
  const promos = await getPromoCodes();
  const promo = promos.find(
    (p) => p.code.toLowerCase() === code.toLowerCase() && p.active && p.usageCount < p.usageLimit
  );
  return promo || null;
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

export async function getCancellationHours(): Promise<number> {
  const docRef = doc(db, "settings", "policies");
  const snap = await getDoc(docRef);
  if (snap.exists()) return (snap.data() as { cancellationHours: number }).cancellationHours || 0;
  return 0;
}

export async function saveCancellationHours(hours: number) {
  const docRef = doc(db, "settings", "policies");
  await setDoc(docRef, { cancellationHours: hours });
}

// --- Waitlist ---
export async function addWaitlistEntry(entry: Omit<WaitlistEntry, "id">) {
  return addDoc(collection(db, "waitlist"), entry);
}

export async function getWaitlistByDate(date: string): Promise<WaitlistEntry[]> {
  const q = query(collection(db, "waitlist"), where("date", "==", date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WaitlistEntry));
}

export async function getWaitlistByClient(clientId: string): Promise<WaitlistEntry[]> {
  const q = query(collection(db, "waitlist"), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WaitlistEntry));
}

export async function removeWaitlistEntry(id: string) {
  return deleteDoc(doc(db, "waitlist", id));
}
