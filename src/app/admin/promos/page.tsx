"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getPromoCodes,
  addPromoCode,
  updatePromoCode,
  deletePromoCode,
} from "@/lib/firestore";
import { PromoCode } from "@/lib/types";
import { HiPlus, HiTrash, HiCheck, HiX } from "react-icons/hi";

export default function PromosPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountPercent: "",
    usageLimit: "",
    active: true,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) loadPromos();
  }, [isAdmin, authLoading, router]);

  async function loadPromos() {
    try {
      const data = await getPromoCodes();
      setPromos(data);
    } catch (error) {
      console.error("Error loading promos:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ code: "", discountPercent: "", usageLimit: "", active: true });
    setShowAdd(false);
  }

  async function handleSave() {
    const trimmedCode = form.code.trim().toUpperCase();
    if (!trimmedCode) return;

    const percent = parseInt(form.discountPercent) || 0;
    if (percent < 1 || percent > 100) return;

    const limit = parseInt(form.usageLimit) || 0;
    if (limit < 1) return;

    const promoData: Omit<PromoCode, "id"> = {
      code: trimmedCode,
      discountPercent: percent,
      active: form.active,
      usageLimit: limit,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await addPromoCode(promoData);
      resetForm();
      await loadPromos();
    } catch (error) {
      console.error("Error saving promo:", error);
    }
  }

  async function handleToggleActive(promo: PromoCode) {
    try {
      await updatePromoCode(promo.id!, { active: !promo.active });
      await loadPromos();
    } catch (error) {
      console.error("Error toggling promo:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás segura de eliminar este código promocional?")) return;
    try {
      await deletePromoCode(id);
      await loadPromos();
    } catch (error) {
      console.error("Error deleting promo:", error);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gold">Promociones</h1>
        {!showAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="btn-gold px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <HiPlus /> Nuevo código
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card-dark rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Nuevo código promocional</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Código
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="Ej: VERANO25"
                className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 w-full text-white placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Descuento (%)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.discountPercent}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  const num = parseInt(val);
                  if (val === "" || (num >= 0 && num <= 100)) {
                    setForm({ ...form, discountPercent: val });
                  }
                }}
                placeholder="Ej: 15"
                className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 w-full text-white placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Límite de usos
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usageLimit: e.target.value.replace(/[^0-9]/g, ""),
                  })
                }
                placeholder="Ej: 50"
                className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 w-full text-white placeholder-gray-600"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="text-sm font-medium text-gray-400">Activo</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  form.active ? "bg-gold" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    form.active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="btn-gold px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <HiCheck /> Guardar
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <HiX /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Promo codes list */}
      {promos.length > 0 ? (
        <div className="space-y-4">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`card-dark rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !promo.active ? "opacity-60" : ""
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg font-mono text-gold">
                    {promo.code}
                  </h3>
                  {promo.active ? (
                    <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">
                      Activo
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-1 text-sm text-gray-400">
                  <span>{promo.discountPercent}% de descuento</span>
                  <span>
                    Usos: {promo.usageCount} / {promo.usageLimit}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(promo)}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    promo.active
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                      : "bg-green-900/50 hover:bg-green-900/70 text-green-400"
                  }`}
                >
                  {promo.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(promo.id!)}
                  className="text-red-400 hover:text-red-600 p-2 transition"
                >
                  <HiTrash size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-dark rounded-2xl p-8 text-center">
          <p className="text-gray-400">
            No hay códigos promocionales. Creá uno para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}
