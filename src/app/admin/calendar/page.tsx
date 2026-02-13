"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAllAppointments, updateAppointment } from "@/lib/firestore";
import { Appointment } from "@/lib/types";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function AdminCalendarPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) loadAppointments();
  }, [isAdmin, authLoading, router]);

  async function loadAppointments() {
    try {
      const data = await getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: Appointment["status"]) {
    try {
      await updateAppointment(id, { status });
      await loadAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  }

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      if (apt.status !== "cancelled") {
        if (!map[apt.date]) map[apt.date] = [];
        map[apt.date].push(apt);
      }
    });
    // Sort each day's appointments by startTime
    Object.values(map).forEach((dayApts) =>
      dayApts.sort((a, b) => a.startTime.localeCompare(b.startTime))
    );
    return map;
  }, [appointments]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth]);

  function getDateStr(day: number): string {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function prevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  const today = new Date().toISOString().split("T")[0];
  const selectedAppointments = selectedDate ? (appointmentsByDate[selectedDate] || []) : [];

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-8">Calendario de Turnos</h1>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="text-gold hover:text-gold-light p-2 transition">
          <HiChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold text-white">
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="text-gold hover:text-gold-light p-2 transition">
          <HiChevronRight size={24} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card-dark rounded-2xl p-4 mb-8">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            const dateStr = getDateStr(day);
            const dayApts = appointmentsByDate[dateStr] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const confirmedCount = dayApts.filter((a) => a.status === "confirmed").length;
            const completedCount = dayApts.filter((a) => a.status === "completed").length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center transition text-sm relative ${
                  isSelected
                    ? "bg-gold text-black font-bold"
                    : isToday
                    ? "bg-gold/20 text-gold font-semibold"
                    : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <span>{day}</span>
                {dayApts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {confirmedCount > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-green-500"}`} />
                    )}
                    {completedCount > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black/60" : "bg-blue-500"}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Confirmados
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Completados
        </div>
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Turnos del {selectedDate}
          </h3>
          {selectedAppointments.length > 0 ? (
            <div className="space-y-3">
              {selectedAppointments.map((apt) => (
                <div key={apt.id} className="card-dark rounded-xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{apt.startTime} - {apt.endTime}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[apt.status]}`}>
                          {statusLabels[apt.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{apt.serviceName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-400">{apt.clientName} - {apt.clientEmail}</p>
                        {apt.clientPhone && (
                          <button
                            onClick={() => window.open(`https://api.whatsapp.com/send?phone=${apt.clientPhone!.replace(/[^0-9]/g, "").replace(/^0+/, "")}`, "_blank", "noopener,noreferrer")}
                            className="text-green-500 hover:text-green-400 transition"
                          >
                            <FaWhatsapp size={14} />
                          </button>
                        )}
                      </div>
                      {apt.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">Nota: {apt.notes}</p>
                      )}
                      {apt.price !== undefined && (
                        <p className="text-xs text-gray-400 mt-1">
                          Precio: ${apt.price.toLocaleString()}
                          {apt.discountCode && (
                            <span className="text-green-400 ml-1">(código: {apt.discountCode}, -{apt.discountAmount}%)</span>
                          )}
                        </p>
                      )}
                    </div>
                    {apt.status === "confirmed" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(apt.id!, "completed")}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm transition"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => handleStatusChange(apt.id!, "cancelled")}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-dark rounded-xl p-6 text-center">
              <p className="text-gray-400">No hay turnos para esta fecha.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
