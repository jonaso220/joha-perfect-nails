"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getWeeklySchedule,
  saveWeeklySchedule,
  getBlockedDates,
  addBlockedDate,
  removeBlockedDate,
  getDefaultSchedule,
} from "@/lib/firestore";
import { WeeklySchedule, BlockedDate, TimeSlot } from "@/lib/types";
import { HiPlus, HiTrash, HiSave } from "react-icons/hi";

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export default function SchedulePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [schedule, setSchedule] = useState<WeeklySchedule>(getDefaultSchedule());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, authLoading, router]);

  async function loadData() {
    try {
      const [sched, blocked] = await Promise.all([
        getWeeklySchedule(),
        getBlockedDates(),
      ]);
      setSchedule(sched);
      setBlockedDates(blocked);
    } catch (error) {
      console.error("Error loading schedule data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSchedule() {
    setSaving(true);
    setMessage("");
    try {
      await saveWeeklySchedule(schedule);
      setMessage("Horarios guardados correctamente");
    } catch (error) {
      setMessage("Error al guardar los horarios");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  }

  function updateSlot(day: string, slotIndex: number, field: keyof TimeSlot, value: string) {
    setSchedule((prev) => {
      const newSlots = [...prev[day].slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
      return {
        ...prev,
        [day]: { ...prev[day], slots: newSlots },
      };
    });
  }

  function addSlot(day: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: "09:00", end: "17:00" }],
      },
    }));
  }

  function removeSlot(day: string, slotIndex: number) {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== slotIndex),
      },
    }));
  }

  async function handleAddBlockedDate() {
    if (!newBlockedDate) return;
    try {
      await addBlockedDate({
        date: newBlockedDate,
        reason: newBlockedReason || undefined,
      });
      setNewBlockedDate("");
      setNewBlockedReason("");
      await loadData();
    } catch (error) {
      console.error("Error adding blocked date:", error);
    }
  }

  async function handleRemoveBlockedDate(id: string) {
    try {
      await removeBlockedDate(id);
      setBlockedDates((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Error removing blocked date:", error);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-pink-600 mb-8">
        Configuración de Horarios
      </h1>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-2xl p-6 shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Horario semanal</h2>
        <p className="text-sm text-gray-500 mb-6">
          Configurá los horarios de atención para cada día. Podés agregar
          múltiples franjas horarias por día (ej: mañana y tarde).
        </p>

        <div className="space-y-4">
          {DAY_NAMES.map((day) => (
            <div key={day} className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={schedule[day]?.enabled || false}
                    onChange={() => toggleDay(day)}
                    className="w-5 h-5 text-pink-600 rounded accent-pink-600"
                  />
                  <span className="font-medium capitalize text-lg">{day}</span>
                </label>
                {schedule[day]?.enabled && (
                  <button
                    onClick={() => addSlot(day)}
                    className="text-pink-600 hover:text-pink-700 text-sm flex items-center gap-1"
                  >
                    <HiPlus /> Agregar franja
                  </button>
                )}
              </div>

              {schedule[day]?.enabled && (
                <div className="space-y-2 ml-8">
                  {schedule[day].slots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateSlot(day, i, "start", e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateSlot(day, i, "end", e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm"
                      />
                      {schedule[day].slots.length > 1 && (
                        <button
                          onClick={() => removeSlot(day, i)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <HiTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition"
          >
            <HiSave /> {saving ? "Guardando..." : "Guardar horarios"}
          </button>
          {message && (
            <span
              className={`text-sm ${
                message.includes("Error") ? "text-red-500" : "text-green-600"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Días de licencia</h2>
        <p className="text-sm text-gray-500 mb-6">
          Bloqueá días específicos para que las clientas no puedan agendar
          turnos.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Motivo (opcional)"
            value={newBlockedReason}
            onChange={(e) => setNewBlockedReason(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
          <button
            onClick={handleAddBlockedDate}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1 transition"
          >
            <HiPlus /> Agregar
          </button>
        </div>

        {blockedDates.length > 0 ? (
          <div className="space-y-2">
            {blockedDates
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((bd) => (
                <div
                  key={bd.id}
                  className="flex items-center justify-between border rounded-lg px-4 py-2"
                >
                  <div>
                    <span className="font-medium">{bd.date}</span>
                    {bd.reason && (
                      <span className="text-gray-500 ml-2">- {bd.reason}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveBlockedDate(bd.id!)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <HiTrash />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No hay días bloqueados.</p>
        )}
      </div>
    </div>
  );
}
