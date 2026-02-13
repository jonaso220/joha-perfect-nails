"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getGalleryItems, addGalleryItem, deleteGalleryItem } from "@/lib/firestore";
import { GalleryItem } from "@/lib/types";
import { HiPlus, HiTrash, HiUpload, HiPhotograph } from "react-icons/hi";

const MAX_IMAGE_SIZE = 1200;
const JPEG_QUALITY = 0.8;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_SIZE) / width);
            width = MAX_IMAGE_SIZE;
          } else {
            width = Math.round((width * MAX_IMAGE_SIZE) / height);
            height = MAX_IMAGE_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("No canvas context")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Error al cargar la imagen"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export default function AdminGalleryPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) loadItems();
  }, [isAdmin, authLoading, router]);

  async function loadItems() {
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setImageUrl(dataUrl);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Error al procesar la imagen. Intentá con otra imagen o pegá una URL.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!imageUrl.trim()) return;

    try {
      await addGalleryItem({
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
      });
      setImageUrl("");
      setDescription("");
      setShowAdd(false);
      await loadItems();
    } catch (error) {
      console.error("Error saving gallery item:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta foto de la galería?")) return;
    try {
      await deleteGalleryItem(id);
      await loadItems();
    } catch (error) {
      console.error("Error deleting gallery item:", error);
    }
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gold">Galería</h1>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-gold px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <HiPlus /> Agregar foto
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card-dark rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Nueva foto</h2>

          {/* Toggle upload mode */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setUploadMode("file"); setImageUrl(""); }}
              className={`px-3 py-1 rounded-lg text-sm transition flex items-center gap-1.5 ${
                uploadMode === "file" ? "bg-gold text-black" : "bg-gray-800 text-gray-400"
              }`}
            >
              <HiUpload size={14} /> Subir foto
            </button>
            <button
              onClick={() => { setUploadMode("url"); setImageUrl(""); }}
              className={`px-3 py-1 rounded-lg text-sm transition flex items-center gap-1.5 ${
                uploadMode === "url" ? "bg-gold text-black" : "bg-gray-800 text-gray-400"
              }`}
            >
              <HiPhotograph size={14} /> Pegar URL
            </button>
          </div>

          {uploadMode === "file" ? (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
              {!imageUrl ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="border-2 border-dashed border-gray-600 rounded-xl p-8 w-full text-center hover:border-gold transition flex flex-col items-center gap-2"
                >
                  <HiUpload className="text-3xl text-gray-400" />
                  <span className="text-gray-400 text-sm">
                    {uploading ? "Comprimiendo imagen..." : "Tocá para elegir una foto"}
                  </span>
                  <span className="text-gray-600 text-xs">
                    Se comprime automáticamente
                  </span>
                </button>
              ) : (
                <div className="relative">
                  <img src={imageUrl} alt="Preview" className="rounded-lg max-h-60 mx-auto" />
                  <button
                    onClick={() => { setImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-lg hover:bg-red-600 transition"
                  >
                    <HiTrash size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">URL de la imagen</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 w-full text-white placeholder-gray-600"
              />
              <p className="text-gray-600 text-xs mt-1">
                Usá URLs directas de imágenes. Las URLs de Google Photos pueden dejar de funcionar.
              </p>
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="mt-3 rounded-lg max-h-48 mx-auto" />
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Uñas esculpidas con diseño floral"
              className="border border-gray-700 bg-black/30 rounded-lg px-3 py-2 w-full text-white placeholder-gray-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!imageUrl.trim() || uploading}
              className="btn-gold px-4 py-2 rounded-xl transition disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => { setShowAdd(false); setImageUrl(""); setDescription(""); }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Gallery grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square">
              <img
                src={item.imageUrl}
                alt={item.description}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                {item.description && (
                  <p className="text-white text-sm text-center px-2">{item.description}</p>
                )}
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
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
            No hay fotos en la galería. Agregá una para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}
