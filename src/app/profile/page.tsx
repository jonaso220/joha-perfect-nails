"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAppointmentsByClient, updateAppointment } from "@/lib/firestore";
import { Appointment } from "@/lib/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      loadAppointments();
      setPhone(profile?.phone || "");
    }
  }, [user, authLoading, router, profile]);

  async function loadAppointments() {
    if (!user) return;
    try {
      const data = await getAppointmentsByClient(user.uid);
      setAppointments(data);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelAppointment(id: string) {
    if (!confirm("¿Estás segura de cancelar este turno?")) return;
    try {
      await updateAppointment(id, { status: "cancelled" });
      await loadAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  }

  async function handleSavePhone() {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { phone });
      setEditingPhone(false);
    } catch (error) {
      console.error("Error saving phone:", error);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!user) return null;

  const upcoming = appointments.filter(
    (a) => a.status === "confirmed" && a.date >= new Date().toISOString().split("T")[0]
  );
  const past = appointments.filter(
    (a) => a.status !== "confirmed" || a.date < new Date().toISOString().split("T")[0]
  );

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile section */}
      <div className="bg-white rounded-2xl p-6 shadow-md mb-8">
        <div className="flex items-center gap-4 mb-4">
          {profile?.photoURL && (
            <img
              src={profile.photoURL}
              alt=""
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h2 className="text-xl font-bold">{profile?.displayName}</h2>
            <p className="text-gray-500 text-sm">{profile?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Teléfono:</label>
          {editingPhone ? (
            <>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border rounded-lg px-3 py-1 text-sm flex-1"
                placeholder="Ej: +54 9 11 1234-5678"
              />
              <button
                onClick={handleSavePhone}
                className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded-lg text-sm transition"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingPhone(false)}
                className="text-gray-500 text-sm"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <span className="text-sm">{phone || "No configurado"}</span>
              <button
                onClick={() => setEditingPhone(true)}
                className="text-pink-600 text-sm underline"
              >
                Editar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upcoming appointments */}
      <h2 className="text-2xl font-bold text-pink-600 mb-4">
        Próximos turnos
      </h2>
      {upcoming.length > 0 ? (
        <div className="space-y-3 mb-8">
          {upcoming.map((apt) => (
            <div key={apt.id} className="bg-white rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{apt.serviceName}</h3>
                  <p className="text-sm text-gray-600">
                    {apt.date} - {apt.startTime} a {apt.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      statusColors[apt.status]
                    }`}
                  >
                    {statusLabels[apt.status]}
                  </span>
                  <button
                    onClick={() => handleCancelAppointment(apt.id!)}
                    className="text-red-400 hover:text-red-600 text-sm underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-md text-center mb-8">
          <p className="text-gray-400">No tenés turnos próximos.</p>
        </div>
      )}

      {/* Past appointments */}
      {past.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Historial
          </h2>
          <div className="space-y-3">
            {past.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-xl p-4 shadow-sm opacity-70"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-sm">{apt.serviceName}</h3>
                    <p className="text-xs text-gray-500">
                      {apt.date} - {apt.startTime} a {apt.endTime}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      statusColors[apt.status]
                    }`}
                  >
                    {statusLabels[apt.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
