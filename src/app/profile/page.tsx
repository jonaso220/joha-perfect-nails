"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getAppointmentsByClient,
  updateAppointment,
  getCancellationHours,
  addReview,
  getReviewsByClient,
} from "@/lib/firestore";
import { Appointment } from "@/lib/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HiStar } from "react-icons/hi";

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [cancellationHours, setCancellationHours] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      loadAppointments();
      setPhone(profile?.phone || "");
      getCancellationHours().then(setCancellationHours);
    }
  }, [user, authLoading, router, profile]);

  async function loadAppointments() {
    if (!user) return;
    try {
      const [data, reviews] = await Promise.all([
        getAppointmentsByClient(user.uid),
        getReviewsByClient(user.uid),
      ]);
      setAppointments(data);
      const reviewed = new Set<string>(reviews.map((r) => r.appointmentId));
      setReviewedIds(reviewed);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  }

  function canCancel(apt: Appointment): boolean {
    if (cancellationHours <= 0) return true;
    const aptDate = new Date(`${apt.date}T${apt.startTime}:00`);
    const now = new Date();
    const hoursUntil = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= cancellationHours;
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

  async function handleSubmitReview(aptId: string) {
    if (!user || !profile) return;
    setSubmittingReview(true);
    try {
      await addReview({
        appointmentId: aptId,
        clientId: user.uid,
        clientName: profile.displayName,
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString(),
      });
      setReviewedIds((prev) => new Set(prev).add(aptId));
      setReviewingId(null);
      setReviewRating(5);
      setReviewComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter(
    (a) => a.status === "confirmed" && a.date >= today
  );
  const past = appointments.filter(
    (a) => a.status !== "confirmed" || a.date < today
  );

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile section */}
      <div className="card-dark rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          {profile?.photoURL && (
            <img src={profile.photoURL} alt="" className="w-16 h-16 rounded-full" />
          )}
          <div>
            <h2 className="text-xl font-bold">{profile?.displayName}</h2>
            <p className="text-gray-500 text-sm">{profile?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Teléfono:</label>
          {editingPhone ? (
            <>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="border border-gray-700 bg-black/30 rounded-lg px-3 py-1 text-sm flex-1 text-white placeholder-gray-600" placeholder="Ej: +54 9 11 1234-5678" />
              <button onClick={handleSavePhone} className="btn-gold px-3 py-1 rounded-lg text-sm">Guardar</button>
              <button onClick={() => setEditingPhone(false)} className="text-gray-500 text-sm">Cancelar</button>
            </>
          ) : (
            <>
              <span className="text-sm">{phone || "No configurado"}</span>
              <button onClick={() => setEditingPhone(true)} className="text-gold text-sm underline">Editar</button>
            </>
          )}
        </div>
      </div>

      {/* Upcoming appointments */}
      <h2 className="text-2xl font-bold text-gold mb-4">Próximos turnos</h2>
      {upcoming.length > 0 ? (
        <div className="space-y-3 mb-8">
          {upcoming.map((apt) => {
            const cancelAllowed = canCancel(apt);
            return (
              <div key={apt.id} className="card-dark rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{apt.serviceName}</h3>
                    <p className="text-sm text-gray-400">{apt.date} - {apt.startTime} a {apt.endTime}</p>
                    {apt.notes && <p className="text-xs text-gray-500 mt-1 italic">Nota: {apt.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[apt.status]}`}>
                      {statusLabels[apt.status]}
                    </span>
                    {cancelAllowed ? (
                      <button onClick={() => handleCancelAppointment(apt.id!)}
                        className="text-red-400 hover:text-red-600 text-sm underline">
                        Cancelar
                      </button>
                    ) : (
                      <span className="text-gray-600 text-xs" title={`No se puede cancelar con menos de ${cancellationHours}h de anticipación`}>
                        No cancelable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-dark rounded-2xl p-6 text-center mb-8">
          <p className="text-gray-400">No tenés turnos próximos.</p>
        </div>
      )}

      {/* Past appointments */}
      {past.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Historial</h2>
          <div className="space-y-3">
            {past.map((apt) => (
              <div key={apt.id} className="card-dark rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-sm">{apt.serviceName}</h3>
                    <p className="text-xs text-gray-500">{apt.date} - {apt.startTime} a {apt.endTime}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[apt.status]}`}>
                      {statusLabels[apt.status]}
                    </span>
                    {apt.status === "completed" && apt.id && !reviewedIds.has(apt.id) && (
                      <button onClick={() => { setReviewingId(apt.id!); setReviewRating(5); setReviewComment(""); }}
                        className="text-gold text-xs underline">
                        Dejar reseña
                      </button>
                    )}
                    {apt.status === "completed" && apt.id && reviewedIds.has(apt.id) && (
                      <span className="text-green-400 text-xs flex items-center gap-0.5">
                        <HiStar size={12} /> Reseña enviada
                      </span>
                    )}
                  </div>
                </div>

                {/* Review form */}
                {reviewingId === apt.id && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-sm text-gray-400 mr-2">Calificación:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)}>
                          <HiStar size={20} className={star <= reviewRating ? "text-gold" : "text-gray-600"} />
                        </button>
                      ))}
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Contanos tu experiencia (opcional)"
                      rows={2} className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 w-full text-white placeholder-gray-600 text-sm mb-2" />
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitReview(apt.id!)} disabled={submittingReview}
                        className="btn-gold px-3 py-1 rounded-lg text-sm disabled:opacity-50">
                        {submittingReview ? "Enviando..." : "Enviar reseña"}
                      </button>
                      <button onClick={() => setReviewingId(null)}
                        className="text-gray-500 text-sm">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
