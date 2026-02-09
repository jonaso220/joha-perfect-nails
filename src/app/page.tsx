"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { HiCalendar, HiClock, HiSparkles } from "react-icons/hi";

export default function Home() {
  const { user, signInWithGoogle, loading } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="mb-6">
          <Image
            src="/logo.png"
            alt="Joha Perfect Nails"
            width={180}
            height={180}
            className="mx-auto rounded-full shadow-lg shadow-gold/20"
            priority
          />
        </div>
        <h1 className="text-5xl font-bold text-gold mb-4">
          Joha Perfect Nails
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
