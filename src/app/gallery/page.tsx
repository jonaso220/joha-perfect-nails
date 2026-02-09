"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getGalleryItems } from "@/lib/firestore";
import { GalleryItem } from "@/lib/types";
import { HiX } from "react-icons/hi";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    getGalleryItems()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gold mb-2">Galería</h1>
      <p className="text-gray-400 mb-8">Algunos de nuestros trabajos realizados</p>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="relative aspect-square rounded-xl overflow-hidden group"
            >
              <img
                src={item.imageUrl}
                alt={item.description}
                className="w-full h-full object-cover transition group-hover:scale-105"
              />
              {item.description && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                  <p className="text-white text-sm">{item.description}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="card-dark rounded-2xl p-12 text-center">
          <p className="text-gray-400">Próximamente fotos de nuestros trabajos.</p>
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
          >
            <HiX size={28} />
          </button>
          <div className="max-w-3xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.description}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {selectedImage.description && (
              <p className="text-white text-center mt-3">{selectedImage.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
