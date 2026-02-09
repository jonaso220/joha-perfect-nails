"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { HiCalendar, HiClock, HiClipboardList } from "react-icons/hi";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-8">
        Panel de Administración
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}
