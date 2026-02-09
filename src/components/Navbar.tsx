"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function Navbar() {
  const { user, profile, loading, signInWithGoogle, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-pink-600 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold tracking-wide">
            ✨ Joha Perfect Nails
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/booking" className="hover:text-pink-200 transition">
                      Reservar turno
                    </Link>
                    <Link href="/profile" className="hover:text-pink-200 transition">
                      Mis turnos
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="hover:text-pink-200 transition font-semibold">
                        Admin
                      </Link>
                    )}
                    <div className="flex items-center gap-2 ml-2">
                      {profile?.photoURL && (
                        <img
                          src={profile.photoURL}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="text-sm">{profile?.displayName}</span>
                    </div>
                    <button
                      onClick={logout}
                      className="bg-pink-700 hover:bg-pink-800 px-3 py-1 rounded text-sm transition"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    className="bg-white text-pink-600 px-4 py-2 rounded-lg font-semibold hover:bg-pink-50 transition"
                  >
                    Iniciar sesión con Google
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/booking"
                      className="block py-2 hover:text-pink-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Reservar turno
                    </Link>
                    <Link
                      href="/profile"
                      className="block py-2 hover:text-pink-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Mis turnos
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block py-2 hover:text-pink-200 font-semibold"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <div className="flex items-center gap-2 py-2">
                      {profile?.photoURL && (
                        <img
                          src={profile.photoURL}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="text-sm">{profile?.displayName}</span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="bg-pink-700 hover:bg-pink-800 px-3 py-1 rounded text-sm transition"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      signInWithGoogle();
                      setMenuOpen(false);
                    }}
                    className="bg-white text-pink-600 px-4 py-2 rounded-lg font-semibold w-full"
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
