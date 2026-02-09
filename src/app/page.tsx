"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { HiCalendar, HiClock, HiSparkles } from "react-icons/hi";

export default function Home() {
  const { user, signInWithGoogle, loading } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-pink-600 mb-4">
          Joha Perfect Nails
        </h1>
        <p className="text-xl text-gray-600 mb-8">
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
                className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition shadow-lg"
              >
                Reservar turno
              </Link>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition shadow-lg"
              >
                Iniciar sesión para reservar
              </button>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-md text-center">
          <HiCalendar className="text-pink-500 text-4xl mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Reserva online</h3>
          <p className="text-gray-500 text-sm">
            Elegí el día y horario que más te convenga sin necesidad de llamar.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md text-center">
          <HiClock className="text-pink-500 text-4xl mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Horarios flexibles</h3>
          <p className="text-gray-500 text-sm">
            Turnos disponibles según la agenda actualizada en tiempo real.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md text-center">
          <HiSparkles className="text-pink-500 text-4xl mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Variedad de servicios</h3>
          <p className="text-gray-500 text-sm">
            Esculpidas, capping, soft gel y más. Elegí el que necesitás.
          </p>
        </div>
      </div>
    </div>
  );
}
