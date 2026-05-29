"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface PickupMapProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  selectedAddress: string;
}

// Punta Cana center coordinates
const DEFAULT_CENTER: [number, number] = [18.5601, -68.3725];
const DEFAULT_ZOOM = 13;

export default function PickupMap({ onLocationSelect, selectedAddress }: PickupMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Inject Leaflet CSS via link tag
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (cancelled || !mapContainerRef.current) return;

      // Fix default marker icons for webpack/next.js
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }

        // Reverse geocode using Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "es" } }
          );
          const data = await res.json();
          const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onLocationSelect(lat, lng, address);
        } catch {
          onLocationSelect(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      });

      mapRef.current = map;
      setIsLoaded(true);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const L = (await import("leaflet")).default;
        const map = mapRef.current!;
        map.setView([latitude, longitude], 16);

        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else {
          markerRef.current = L.marker([latitude, longitude]).addTo(map);
        }

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "es" } }
          );
          const data = await res.json();
          const address = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          onLocationSelect(latitude, longitude, address);
        } catch {
          onLocationSelect(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div
        ref={mapContainerRef}
        className="w-full h-[220px] rounded-xl border border-border overflow-hidden bg-secondary/50 relative"
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleLocateMe}
        disabled={isLocating || !isLoaded}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        {isLocating ? (
          <>
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            Obteniendo ubicación...
          </>
        ) : (
          <>
            <MapPin size={14} />
            Usar mi ubicación actual
          </>
        )}
      </button>

      {selectedAddress && (
        <div className="flex items-start gap-2 rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-2">
          <MapPin size={14} className="text-green-500 mt-0.5 shrink-0" />
          <span className="text-xs text-foreground leading-relaxed">{selectedAddress}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Toca el mapa para seleccionar tu ubicación o usa el botón de ubicación actual
      </p>

      <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
        No ofrecemos transporte gratis a ubicaciones fuera de la zona de Punta Cana/Bavaro.
      </p>
    </div>
  );
}
