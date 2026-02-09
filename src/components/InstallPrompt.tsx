"use client";

import { useEffect, useState } from "react";
import { HiX, HiDownload } from "react-icons/hi";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if user dismissed recently (24h)
    const dismissed = localStorage.getItem("install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isiOS);

    if (isiOS) {
      // Show iOS tip after 3 seconds
      const timer = setTimeout(() => setShowIOSTip(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    setShowIOSTip(false);
    localStorage.setItem("install-dismissed", String(Date.now()));
  }

  // Android/Desktop install banner
  if (showBanner && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
        <div className="bg-[#1a1a1a] border border-gold/30 rounded-2xl p-4 shadow-lg shadow-black/50">
          <div className="flex items-start gap-3">
            <div className="bg-gold/10 rounded-xl p-2 flex-shrink-0">
              <HiDownload className="text-gold text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">Instalar Joha Perfect Nails</h3>
              <p className="text-gray-400 text-xs mt-1">
                Agregá la app a tu pantalla de inicio para acceder más rápido.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="btn-gold px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  Instalar
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-gray-500 hover:text-gray-300 px-3 py-1.5 text-xs transition"
                >
                  Ahora no
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-600 hover:text-gray-400">
              <HiX size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari tip
  if (showIOSTip) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
        <div className="bg-[#1a1a1a] border border-gold/30 rounded-2xl p-4 shadow-lg shadow-black/50">
          <div className="flex items-start gap-3">
            <div className="bg-gold/10 rounded-xl p-2 flex-shrink-0">
              <HiDownload className="text-gold text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">Instalar Joha Perfect Nails</h3>
              <p className="text-gray-400 text-xs mt-1">
                Tocá el botón <span className="inline-block mx-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline text-gold">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span> de compartir y luego <strong className="text-gold">&quot;Agregar a pantalla de inicio&quot;</strong>.
              </p>
            </div>
            <button onClick={handleDismiss} className="text-gray-600 hover:text-gray-400">
              <HiX size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
