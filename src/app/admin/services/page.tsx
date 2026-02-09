"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getServices,
  addService,
  updateService,
  deleteService,
} from "@/lib/firestore";
import { NailService } from "@/lib/types";
import { HiPlus, HiPencil, HiTrash, HiCheck, HiX } from "react-icons/hi";

export default function ServicesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState<NailService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: 60,
    price: 0,
    active: true,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) loadServices();
  }, [isAdmin, authLoading, router]);

  async function loadServices() {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", description: "", durationMinutes: 60, price: 0, active: true });
    setEditingId(null);
    setShowAdd(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;

    try {
      if (editingId) {
        await updateService(editingId, form);
      } else {
        await addService(form);
      }
      resetForm();
      await loadServices();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás segura de eliminar este servicio?")) return;
    try {
      await deleteService(id);
      await loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  }

  function startEdit(service: NailService) {
    setEditingId(service.id!);
    setForm({
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price,
      active: service.active,
    });
    setShowAdd(true);
  }

  async function toggleActive(service: NailService) {
    try {
      await updateService(service.id!, { active: !service.active });
      await loadServices();
    } catch (error) {
      console.error("Error toggling service:", error);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gold">Servicios</h1>
        {!showAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="btn-gold px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <HiPlus /> Nuevo servicio
          </button>
        )}
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <div className="card-dark rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Uñas esculpidas"
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción"
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (minutos)
              </label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })
                }
                min={15}
                step={15}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ($)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                }
                min={0}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="btn-gold px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <HiCheck /> {editingId ? "Actualizar" : "Guardar"}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <HiX /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Services list */}
      {services.length > 0 ? (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`card-dark rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !service.active ? "opacity-60" : ""
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  {!service.active && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{service.description}</p>
                <div className="flex gap-4 mt-1 text-sm text-gray-400">
                  <span>{service.durationMinutes} min</span>
                  <span>${service.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(service)}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    service.active
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      : "bg-green-100 hover:bg-green-200 text-green-700"
                  }`}
                >
                  {service.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => startEdit(service)}
                  className="text-gold hover:text-gold-light p-2"
                >
                  <HiPencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(service.id!)}
                  className="text-red-400 hover:text-red-600 p-2"
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
            No hay servicios configurados. Agregá uno para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}
