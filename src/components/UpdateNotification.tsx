"use client";

import { useEffect, useState } from "react";
import { HiRefresh, HiX } from "react-icons/hi";

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setRegistration(reg);

        // Check for updates every 60 seconds
        const interval = setInterval(() => {
          reg.update();
        }, 60 * 1000);

        // Listen for new service worker waiting to activate
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available
              setUpdateAvailable(true);
            }
          });
        });

        return () => clearInterval(interval);
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });

    // Detect when a new SW takes control (after skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  function handleUpdate() {
    if (registration?.waiting) {
      // Tell the waiting SW to take over
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    // Fallback: just reload
    window.location.reload();
  }

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
      <div className="bg-[#1a1a1a] border border-gold/30 rounded-2xl p-4 shadow-lg shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="bg-gold/10 rounded-xl p-2 flex-shrink-0">
            <HiRefresh className="text-gold text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">Nueva versión disponible</h3>
            <p className="text-gray-400 text-xs mt-1">
              Hay una actualización de la app. Actualizá para obtener las últimas mejoras.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="btn-gold px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                Actualizar ahora
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="text-gray-500 hover:text-gray-300 px-3 py-1.5 text-xs transition"
              >
                Después
              </button>
            </div>
          </div>
          <button onClick={() => setUpdateAvailable(false)} className="text-gray-600 hover:text-gray-400">
            <HiX size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
