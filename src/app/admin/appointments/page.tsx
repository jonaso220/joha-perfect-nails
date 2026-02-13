"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAllAppointments, updateAppointment } from "@/lib/firestore";
import { Appointment } from "@/lib/types";
import { FaWhatsapp } from "react-icons/fa";

export default function AdminAppointmentsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "completed" | "cancelled">("all");

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

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  const statusColors = {
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-8">
        Gestión de Turnos
      </h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "confirmed", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              filter === f
                ? "bg-gold text-black"
                : "card-dark text-gray-400 hover:bg-gold/10"
            }`}
          >
            {f === "all" ? "Todos" : statusLabels[f]} ({f === "all" ? appointments.length : appointments.filter((a) => a.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="card-dark rounded-2xl p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{apt.clientName}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        statusColors[apt.status]
                      }`}
                    >
                      {statusLabels[apt.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400">{apt.clientEmail}</p>
                    {apt.clientPhone && (
                      <button
                        onClick={() => window.open(`https://api.whatsapp.com/send?phone=${apt.clientPhone!.replace(/[^0-9]/g, "").replace(/^0+/, "")}`, "_blank", "noopener,noreferrer")}
                        className="text-green-500 hover:text-green-400 transition"
                        title="Contactar por WhatsApp"
                      >
                        <FaWhatsapp size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    <strong>{apt.serviceName}</strong> - {apt.date} de{" "}
                    {apt.startTime} a {apt.endTime}
                  </p>
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
        <div className="card-dark rounded-2xl p-8 text-center">
          <p className="text-gray-400">No hay turnos para mostrar.</p>
        </div>
      )}
    </div>
  );
}
