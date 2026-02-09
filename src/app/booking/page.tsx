"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getServices,
  getWeeklySchedule,
  getBlockedDates,
  getAppointmentsByDate,
  createAppointment,
  getAdminWhatsApp,
} from "@/lib/firestore";
import { NailService, WeeklySchedule, BlockedDate, Appointment, TimeSlot } from "@/lib/types";
import { format, addDays, parse, addMinutes, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { HiCheck, HiArrowLeft } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export default function BookingPage() {
  const { user, profile, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: service, 2: date, 3: time, 4: confirm
  const [services, setServices] = useState<NailService[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [adminWhatsApp, setAdminWhatsApp] = useState("");

  const [selectedService, setSelectedService] = useState<NailService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [svc, sched, blocked, whatsapp] = await Promise.all([
        getServices(),
        getWeeklySchedule(),
        getBlockedDates(),
        getAdminWhatsApp(),
      ]);
      setServices(svc.filter((s) => s.active));
      setSchedule(sched);
      setBlockedDates(blocked);
      setAdminWhatsApp(whatsapp);
    } catch (error) {
      console.error("Error loading booking data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointmentsForDate(date: string) {
    try {
      const appointments = await getAppointmentsByDate(date);
      setExistingAppointments(appointments);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setExistingAppointments([]);
    }
  }

  // Generate next 30 available dates
  const availableDates = useMemo(() => {
    if (!schedule) return [];
    const dates: string[] = [];
    const blockedSet = new Set(blockedDates.map((b) => b.date));
    const today = new Date();

    for (let i = 1; i <= 60 && dates.length < 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayName = DAY_NAMES[date.getDay()];

      if (schedule[dayName]?.enabled && !blockedSet.has(dateStr)) {
        dates.push(dateStr);
      }
    }
    return dates;
  }, [schedule, blockedDates]);

  // Generate available time slots for selected date
  const availableSlots = useMemo(() => {
    if (!schedule || !selectedDate || !selectedService) return [];

    const dayName = DAY_NAMES[new Date(selectedDate + "T12:00:00").getDay()];
    const daySchedule = schedule[dayName];
    if (!daySchedule?.enabled) return [];

    const duration = selectedService.durationMinutes;
    const slots: string[] = [];

    daySchedule.slots.forEach((timeSlot: TimeSlot) => {
      const slotStart = parse(timeSlot.start, "HH:mm", new Date());
      const slotEnd = parse(timeSlot.end, "HH:mm", new Date());

      let current = slotStart;
      while (isBefore(addMinutes(current, duration), slotEnd) || format(addMinutes(current, duration), "HH:mm") === format(slotEnd, "HH:mm")) {
        const timeStr = format(current, "HH:mm");
        const endStr = format(addMinutes(current, duration), "HH:mm");

        // Check for overlaps with existing appointments
        const hasConflict = existingAppointments.some((apt) => {
          return timeStr < apt.endTime && endStr > apt.startTime;
        });

        if (!hasConflict) {
          slots.push(timeStr);
        }

        current = addMinutes(current, 30); // 30-min increments
      }
    });

    return slots;
  }, [schedule, selectedDate, selectedService, existingAppointments]);

  async function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedTime("");
    await loadAppointmentsForDate(date);
    setStep(3);
  }

  async function handleBooking() {
    if (!user || !profile || !selectedService || !selectedDate || !selectedTime) return;

    setBooking(true);
    try {
      const endTime = format(
        addMinutes(parse(selectedTime, "HH:mm", new Date()), selectedService.durationMinutes),
        "HH:mm"
      );

      await createAppointment({
        clientId: user.uid,
        clientName: profile.displayName,
        clientEmail: profile.email,
        clientPhone: profile.phone || "",
        serviceId: selectedService.id!,
        serviceName: selectedService.name,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTime,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      });

      setBooked(true);
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error al crear el turno. Por favor intentá de nuevo.");
    } finally {
      setBooking(false);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gold mb-4">Reservar turno</h2>
        <p className="text-gray-500 mb-6">
          Necesitás iniciar sesión para poder reservar un turno.
        </p>
        <button
          onClick={signInWithGoogle}
          className="btn-gold font-semibold px-6 py-3 rounded-xl transition"
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  if (booked) {
    const dateFormatted = selectedDate
      ? format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })
      : selectedDate;
    const whatsappMessage = `Hola! Reservé un turno para *${selectedService?.name}* el ${dateFormatted} a las ${selectedTime}hs. Mi nombre es ${profile?.displayName}. Gracias!`;
    const whatsappUrl = adminWhatsApp
      ? `https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
      : "";

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <HiCheck className="text-green-600 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          Turno reservado
        </h2>
        <p className="text-gray-400 mb-2">
          <strong>{selectedService?.name}</strong>
        </p>
        <p className="text-gray-400 mb-6">
          {dateFormatted} a las {selectedTime}hs
        </p>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition mb-4"
          >
            <FaWhatsapp size={20} />
            Confirmar por WhatsApp
          </a>
        )}

        <div className="flex gap-3 justify-center mt-2">
          <button
            onClick={() => {
              setBooked(false);
              setStep(1);
              setSelectedService(null);
              setSelectedDate("");
              setSelectedTime("");
            }}
            className="btn-gold px-6 py-2 rounded-xl transition"
          >
            Reservar otro turno
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-6 py-2 rounded-xl transition"
          >
            Ver mis turnos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-2">Reservar turno</h1>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {["Servicio", "Fecha", "Horario", "Confirmar"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step > i + 1
                  ? "bg-gold text-black"
                  : step === i + 1
                  ? "bg-gold text-black"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > i + 1 ? <HiCheck /> : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                step === i + 1 ? "text-gold font-medium" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {i < 3 && <div className="w-8 h-0.5 bg-gray-200"></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Elegí un servicio</h2>
          {services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`w-full text-left card-dark rounded-xl p-5 transition border-2 ${
                    selectedService?.id === service.id
                      ? "border-gold"
                      : "border-transparent"
                  }`}
                >
                  <h3 className="font-semibold text-lg text-white">{service.name}</h3>
                  <p className="text-gray-500 text-sm">{service.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-400">
                    <span>{service.durationMinutes} min</span>
                    <span>${service.price.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="card-dark rounded-2xl p-8 text-center">
              <p className="text-gray-400">
                No hay servicios disponibles en este momento.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Date */}
      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="text-gold hover:text-gold-dark flex items-center gap-1 mb-4 text-sm"
          >
            <HiArrowLeft /> Volver
          </button>
          <h2 className="text-xl font-semibold text-white mb-4">Elegí una fecha</h2>
          <p className="text-sm text-gray-500 mb-4">
            Servicio: <strong>{selectedService?.name}</strong>
          </p>
          {availableDates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableDates.map((date) => {
                const d = new Date(date + "T12:00:00");
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className="card-dark rounded-xl p-4 transition text-center border-2 border-transparent hover:border-gold"
                  >
                    <div className="text-sm text-gray-500 capitalize">
                      {format(d, "EEEE", { locale: es })}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(d, "d MMM", { locale: es })}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No hay fechas disponibles en los próximos días.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Select Time */}
      {step === 3 && (
        <div>
          <button
            onClick={() => {
              setStep(2);
              setSelectedTime("");
            }}
            className="text-gold hover:text-gold-dark flex items-center gap-1 mb-4 text-sm"
          >
            <HiArrowLeft /> Volver
          </button>
          <h2 className="text-xl font-semibold text-white mb-4">Elegí un horario</h2>
          <p className="text-sm text-gray-500 mb-4">
            {selectedService?.name} -{" "}
            {format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", {
              locale: es,
            })}
          </p>
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => {
                    setSelectedTime(time);
                    setStep(4);
                  }}
                  className={`card-dark rounded-xl p-3 transition text-center border-2 ${
                    selectedTime === time
                      ? "border-gold"
                      : "border-transparent hover:border-gold"
                  }`}
                >
                  <span className="font-medium">{time}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No hay horarios disponibles para esta fecha.
            </p>
          )}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && selectedService && (
        <div>
          <button
            onClick={() => setStep(3)}
            className="text-gold hover:text-gold-dark flex items-center gap-1 mb-4 text-sm"
          >
            <HiArrowLeft /> Volver
          </button>
          <h2 className="text-xl font-semibold text-white mb-6">Confirmar turno</h2>

          <div className="card-dark rounded-2xl p-6 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium capitalize">
                  {format(
                    new Date(selectedDate + "T12:00:00"),
                    "EEEE d 'de' MMMM yyyy",
                    { locale: es }
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Horario</span>
                <span className="font-medium">
                  {selectedTime} -{" "}
                  {format(
                    addMinutes(
                      parse(selectedTime, "HH:mm", new Date()),
                      selectedService.durationMinutes
                    ),
                    "HH:mm"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duración</span>
                <span className="font-medium">
                  {selectedService.durationMinutes} minutos
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precio</span>
                <span className="font-semibold text-gold">
                  ${selectedService.price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={booking}
            className="w-full btn-gold font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {booking ? "Reservando..." : "Confirmar reserva"}
          </button>
        </div>
      )}
    </div>
  );
}
