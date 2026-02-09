"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { HiCalendar, HiClock, HiClipboardList, HiPhotograph, HiCheck } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { getAdminWhatsApp, saveAdminWhatsApp } from "@/lib/firestore";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      getAdminWhatsApp().then(setWhatsapp);
    }
  }, [isAdmin, loading, router]);

  async function handleSaveWhatsApp() {
    await saveAdminWhatsApp(whatsapp);
    setWhatsappSaved(true);
    setTimeout(() => setWhatsappSaved(false), 2000);
  }

  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-8">
        Panel de Administración
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          href="/admin/gallery"
          className="card-dark rounded-2xl p-6 hover:shadow-lg transition text-center group"
        >
          <HiPhotograph className="text-gold text-4xl mx-auto mb-4 group-hover:scale-110 transition" />
          <h3 className="font-semibold text-lg mb-2">Galería</h3>
          <p className="text-gray-500 text-sm">
            Subir fotos de trabajos realizados.
          </p>
        </Link>
      </div>

      {/* WhatsApp config */}
      <div className="card-dark rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaWhatsapp className="text-green-500 text-xl" />
          <h2 className="font-semibold text-lg">WhatsApp de contacto</h2>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          Los clientes podrán enviarte un mensaje de WhatsApp al confirmar un turno.
        </p>
        <div className="flex gap-3 items-center">
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Ej: 59899123456 (con código de país)"
            className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 flex-1 text-white placeholder-gray-600"
          />
          <button
            onClick={handleSaveWhatsApp}
            className="btn-gold px-4 py-2 rounded-lg text-sm flex items-center gap-1"
          >
            {whatsappSaved ? <><HiCheck /> Guardado</> : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
