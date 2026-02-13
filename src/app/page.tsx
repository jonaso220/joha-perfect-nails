"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HiCalendar, HiClock, HiSparkles } from "react-icons/hi";
import { getAppointmentsByClient } from "@/lib/firestore";
import { Appointment } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      getAppointmentsByClient(user.uid).then((appointments) => {
        const upcoming = appointments
          .filter((a) => a.status === "confirmed" && a.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
        setNextAppointment(upcoming[0] || null);
      });
    }
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Upcoming appointment reminder */}
      {nextAppointment && (
        <Link href="/profile" className="block mb-8 animate-slide-up">
          <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="bg-gold/20 rounded-xl p-3 flex-shrink-0">
                <HiCalendar className="text-gold text-2xl" />
              </div>
              <div className="flex-1">
                <p className="text-gold font-semibold text-sm">Tu próximo turno</p>
                <p className="text-white font-medium">
                  {nextAppointment.serviceName} -{" "}
                  {format(new Date(nextAppointment.date + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-gray-400 text-sm">
                  {nextAppointment.startTime} a {nextAppointment.endTime} hs
                </p>
              </div>
              <span className="text-gold text-sm hidden sm:block">Ver detalles &rarr;</span>
            </div>
          </div>
        </Link>
      )}

      {/* Hero */}
      <div className="text-center mb-16">
        <div className="mb-6">
          <Image
            src="/logo.png"
            alt="Glow by Joha"
            width={220}
            height={220}
            className="mx-auto rounded-2xl shadow-lg shadow-gold/20"
            priority
          />
        </div>
        <h1 className="text-5xl font-bold text-gold mb-4">
          Glow by Joha
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Uñas esculpidas, capping y soft gel
        </p>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">
          Reserva tu turno de manera fácil y rápida. Elegí el servicio que
          necesitás, el día y horario que más te convenga.
        </p>

        {!loading && (
          <>
            {user ? (
              <Link
                href="/booking"
                className="btn-gold inline-block px-8 py-3 rounded-xl text-lg shadow-lg"
              >
                Reservar turno
              </Link>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="btn-gold px-8 py-3 rounded-xl text-lg shadow-lg"
              >
                Iniciar sesión para reservar
              </button>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="card-dark rounded-2xl p-6 text-center transition">
          <HiCalendar className="text-gold text-4xl mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-white">Reserva online</h3>
          <p className="text-gray-500 text-sm">
            Elegí el día y horario que más te convenga sin necesidad de llamar.
          </p>
        </div>
        <div className="card-dark rounded-2xl p-6 text-center transition">
          <HiClock className="text-gold text-4xl mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-white">Horarios flexibles</h3>
          <p className="text-gray-500 text-sm">
            Turnos disponibles según la agenda actualizada en tiempo real.
          </p>
        </div>
        <div className="card-dark rounded-2xl p-6 text-center transition">
          <HiSparkles className="text-gold text-4xl mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-white">Variedad de servicios</h3>
          <p className="text-gray-500 text-sm">
            Esculpidas, capping, soft gel y más. Elegí el que necesitás.
          </p>
        </div>
      </div>
    </div>
  );
}
