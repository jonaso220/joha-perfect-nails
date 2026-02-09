"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  HiCalendar,
  HiClock,
  HiClipboardList,
  HiPhotograph,
  HiCheck,
  HiTrendingUp,
  HiTag,
  HiViewGrid,
} from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import {
  getAdminWhatsApp,
  saveAdminWhatsApp,
  getCancellationHours,
  saveCancellationHours,
} from "@/lib/firestore";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [cancelHours, setCancelHours] = useState("");
  const [cancelSaved, setCancelSaved] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      getAdminWhatsApp().then(setWhatsapp);
      getCancellationHours().then((h) => setCancelHours(h > 0 ? String(h) : ""));
    }
  }, [isAdmin, loading, router]);

  async function handleSaveWhatsApp() {
    await saveAdminWhatsApp(whatsapp);
    setWhatsappSaved(true);
    setTimeout(() => setWhatsappSaved(false), 2000);
  }

  async function handleSaveCancelHours() {
    const hours = parseInt(cancelHours) || 0;
    await saveCancellationHours(hours);
    setCancelSaved(true);
    setTimeout(() => setCancelSaved(false), 2000);
  }

  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-8">
        Panel de Administración
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Link
          href="/admin/schedule"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiClock className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Horarios</h3>
          <p className="text-gray-500 text-sm">
            Configurar horarios semanales y días de licencia.
          </p>
        </Link>

        <Link
          href="/admin/services"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiClipboardList className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Servicios</h3>
          <p className="text-gray-500 text-sm">
            Administrar servicios, precios y duración.
          </p>
        </Link>

        <Link
          href="/admin/appointments"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiCalendar className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Turnos</h3>
          <p className="text-gray-500 text-sm">
            Ver y gestionar todos los turnos agendados.
          </p>
        </Link>

        <Link
          href="/admin/calendar"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiViewGrid className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Calendario</h3>
          <p className="text-gray-500 text-sm">
            Vista de calendario mensual de turnos.
          </p>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href="/admin/gallery"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiPhotograph className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Galería</h3>
          <p className="text-gray-500 text-sm">
            Subir fotos de trabajos realizados.
          </p>
        </Link>

        <Link
          href="/admin/stats"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiTrendingUp className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Estadísticas</h3>
          <p className="text-gray-500 text-sm">
            Ver turnos, ingresos y servicios populares.
          </p>
        </Link>

        <Link
          href="/admin/promos"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiTag className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Promociones</h3>
          <p className="text-gray-500 text-sm">
            Crear y gestionar códigos de descuento.
          </p>
        </Link>
      </div>

      {/* Settings section */}
      <h2 className="text-xl font-semibold text-white mb-4">Configuración</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* WhatsApp config */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaWhatsapp className="text-green-500 text-xl" />
            <h3 className="font-semibold text-lg">WhatsApp de contacto</h3>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Los clientes podrán enviarte un mensaje al confirmar un turno.
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ej: 59899123456 (con código de país)"
              className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 flex-1 text-white placeholder-gray-600 text-sm"
            />
            <button
              onClick={handleSaveWhatsApp}
              className="btn-gold px-4 py-2 rounded-lg text-sm flex items-center gap-1"
            >
              {whatsappSaved ? <><HiCheck /> Guardado</> : "Guardar"}
            </button>
          </div>
        </div>

        {/* Cancellation hours config */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiClock className="text-gold text-xl" />
            <h3 className="font-semibold text-lg">Política de cancelación</h3>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Horas mínimas de anticipación para cancelar un turno. Dejá en 0 para permitir siempre.
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              inputMode="numeric"
              value={cancelHours}
              onChange={(e) => setCancelHours(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Ej: 24"
              className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 w-24 text-white placeholder-gray-600 text-sm"
            />
            <span className="text-gray-400 text-sm">horas</span>
            <button
              onClick={handleSaveCancelHours}
              className="btn-gold px-4 py-2 rounded-lg text-sm flex items-center gap-1"
            >
              {cancelSaved ? <><HiCheck /> Guardado</> : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
