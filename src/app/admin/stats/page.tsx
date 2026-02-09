"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllAppointments, getServices } from "@/lib/firestore";
import { Appointment, NailService } from "@/lib/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { HiTrendingUp, HiCurrencyDollar, HiChartBar, HiCalendar } from "react-icons/hi";

interface ServiceCount {
  name: string;
  count: number;
}

export default function AdminStatsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<NailService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) loadData();
  }, [isAdmin, authLoading, router]);

  async function loadData() {
    try {
      const [appts, svcs] = await Promise.all([
        getAllAppointments(),
        getServices(),
      ]);
      setAppointments(appts);
      setServices(svcs);
    } catch (error) {
      console.error("Error loading stats data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  // --- Date calculations ---
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Last 7 days (this week)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // Current month boundaries
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // --- Filter appointments ---
  const appointmentsThisWeek = appointments.filter((a) => {
    const d = new Date(a.date + "T00:00:00");
    return d >= sevenDaysAgo && d <= today;
  });

  const appointmentsThisMonth = appointments.filter((a) => {
    const d = new Date(a.date + "T00:00:00");
    return d >= monthStart && d <= monthEnd;
  });

  // --- Revenue: sum of prices from completed appointments this month ---
  const completedThisMonth = appointmentsThisMonth.filter(
    (a) => a.status === "completed"
  );
  const revenueThisMonth = completedThisMonth.reduce((sum, a) => {
    return sum + (a.price ?? 0);
  }, 0);

  // --- Top 3 most requested services (from all appointments) ---
  const serviceCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    const name = a.serviceName || "Sin servicio";
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });

  const topServices: ServiceCount[] = Object.entries(serviceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const maxServiceCount = topServices.length > 0 ? topServices[0].count : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-8">Estadísticas</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Appointments this week */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gold/20 p-3 rounded-xl">
              <HiCalendar className="text-gold text-2xl" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Turnos esta semana</p>
              <p className="text-3xl font-bold text-white">
                {appointmentsThisWeek.length}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-xs">
            Últimos 7 días
          </p>
        </div>

        {/* Appointments this month */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gold/20 p-3 rounded-xl">
              <HiTrendingUp className="text-gold text-2xl" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Turnos este mes</p>
              <p className="text-3xl font-bold text-white">
                {appointmentsThisMonth.length}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-xs">
            {now.toLocaleString("es-ES", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Revenue this month */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gold/20 p-3 rounded-xl">
              <HiCurrencyDollar className="text-gold text-2xl" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ingresos del mes</p>
              <p className="text-3xl font-bold text-white">
                ${revenueThisMonth.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-xs">
            {completedThisMonth.length} turno{completedThisMonth.length !== 1 ? "s" : ""} completado{completedThisMonth.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Top 3 services bar chart */}
      <div className="card-dark rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <HiChartBar className="text-gold text-2xl" />
          <h2 className="text-xl font-semibold text-white">
            Servicios más solicitados
          </h2>
        </div>

        {topServices.length > 0 ? (
          <div className="space-y-4">
            {topServices.map((service, index) => {
              const percentage = (service.count / maxServiceCount) * 100;
              return (
                <div key={service.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-sm font-medium">
                      {index + 1}. {service.name}
                    </span>
                    <span className="text-gold text-sm font-semibold">
                      {service.count} turno{service.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gold h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">
            No hay datos de servicios disponibles.
          </p>
        )}
      </div>

      {/* Additional details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        <div className="card-dark rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Resumen del mes
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Confirmados</span>
              <span className="text-green-400 font-medium">
                {appointmentsThisMonth.filter((a) => a.status === "confirmed").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Completados</span>
              <span className="text-blue-400 font-medium">
                {completedThisMonth.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cancelados</span>
              <span className="text-red-400 font-medium">
                {appointmentsThisMonth.filter((a) => a.status === "cancelled").length}
              </span>
            </div>
          </div>
        </div>

        <div className="card-dark rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Servicios activos
          </h3>
          <p className="text-3xl font-bold text-gold">
            {services.filter((s) => s.active).length}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            de {services.length} servicio{services.length !== 1 ? "s" : ""} en total
          </p>
        </div>
      </div>
    </div>
  );
}
