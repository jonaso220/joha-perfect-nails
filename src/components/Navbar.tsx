"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function Navbar() {
  const { user, profile, loading, signInWithGoogle, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-black border-b border-gold/20 shadow-lg shadow-gold/5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wide text-gold">
            <Image src="/logo.png" alt="Joha Perfect Nails" width={40} height={40} className="rounded-full" />
            Joha Perfect Nails
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/booking" className="text-gray-300 hover:text-gold transition">
                      Reservar turno
                    </Link>
                    <Link href="/gallery" className="text-gray-300 hover:text-gold transition">
                      Galería
                    </Link>
                    <Link href="/profile" className="text-gray-300 hover:text-gold transition">
                      Mis turnos
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="text-gold-light hover:text-gold transition font-semibold">
                        Admin
                      </Link>
                    )}
                    <div className="flex items-center gap-2 ml-2">
                      {profile?.photoURL && (
                        <img
                          src={profile.photoURL}
                          alt=""
                          className="w-8 h-8 rounded-full border border-gold/30"
                        />
                      )}
                      <span className="text-sm text-gray-300">{profile?.displayName}</span>
                    </div>
                    <button
                      onClick={logout}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm transition border border-gray-700"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    className="btn-gold px-4 py-2 rounded-lg text-sm"
                  >
                    Iniciar sesión con Google
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gold"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-gold/10 pt-3">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/booking" className="block py-2 text-gray-300 hover:text-gold" onClick={() => setMenuOpen(false)}>
                      Reservar turno
                    </Link>
                    <Link href="/gallery" className="block py-2 text-gray-300 hover:text-gold" onClick={() => setMenuOpen(false)}>
                      Galería
                    </Link>
                    <Link href="/profile" className="block py-2 text-gray-300 hover:text-gold" onClick={() => setMenuOpen(false)}>
                      Mis turnos
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block py-2 text-gold-light hover:text-gold font-semibold" onClick={() => setMenuOpen(false)}>
                        Admin
                      </Link>
                    )}
                    <div className="flex items-center gap-2 py-2">
                      {profile?.photoURL && (
                        <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full border border-gold/30" />
                      )}
                      <span className="text-sm text-gray-300">{profile?.displayName}</span>
                    </div>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm transition border border-gray-700"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { signInWithGoogle(); setMenuOpen(false); }}
                    className="btn-gold px-4 py-2 rounded-lg w-full text-sm"
                  >
                    Iniciar sesión con Google
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
