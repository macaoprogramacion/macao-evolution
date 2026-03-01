"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  ShoppingCart,
  Bus,
  Clock,
  Search,
  ChevronDown,
  Navigation,
  PenLine,
  Hotel,
} from "lucide-react";
import { useCart } from "@/context/cart-context";

interface HotelInfo {
  name: string;
  times: [string, string, string];
  pickup: string;
}

const HOTELS: HotelInfo[] = [
  // Cap Cana area
  { name: "SANCTUARY CAP CANA", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "MARGARITA VILLE", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "ANCORA", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "FISHING LODGE", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "TRS CAP CANA", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "HYATT ZILARA & ZIVA", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "SECRET CAP CANA", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "FOUR POINTS BY SHERATON", times: ["6:50", "9:50", "12:50"], pickup: "BOMBA PETROLEUM" },
  { name: "DREAMS FLORA (NATURA PARK)", times: ["6:55", "9:55", "12:55"], pickup: "BARRERA" },
  { name: "TORTUGA BAY", times: ["7:00", "10:00", "13:00"], pickup: "LOBBY" },
  { name: "WESTIN PUNTA CANA", times: ["7:00", "10:00", "13:00"], pickup: "LOBBY" },
  { name: "CLUB MED", times: ["7:00", "10:00", "13:00"], pickup: "LOBBY" },
  { name: "JEWEL PALM BEACH (DREAMS P.B.)", times: ["7:00", "10:00", "13:00"], pickup: "BARRERA" },
  { name: "SUNSCAPE COCO", times: ["7:00", "10:00", "13:00"], pickup: "BARRERA" },
  { name: "RADISSON BLU", times: ["7:00", "10:00", "13:00"], pickup: "BARRERA" },
  { name: "SERENADE", times: ["7:00", "10:00", "13:00"], pickup: "BARRERA" },
  { name: "CATALONIA", times: ["7:00", "10:00", "13:00"], pickup: "BARRERA" },
  { name: "WHALA URBAN", times: ["7:00", "10:00", "13:00"], pickup: "LOBBY" },
  { name: "BOMBA SUNIX DE COCO BONGO", times: ["7:15", "10:15", "13:15"], pickup: "PARQUEO" },
  { name: "AC BY MARRIOT", times: ["7:20", "10:20", "13:20"], pickup: "LOBBY" },
  { name: "KARIBO PUNTA CANA", times: ["7:20", "10:20", "13:20"], pickup: "BARRERA" },
  { name: "VIK ARENA", times: ["7:20", "10:20", "13:20"], pickup: "BARRERA" },
  { name: "BARCELO BAVARO PALACE", times: ["7:25", "10:25", "13:25"], pickup: "LOBBY" },
  { name: "BARCELO BAVARO BEACH", times: ["7:25", "10:25", "13:25"], pickup: "LOBBY" },
  { name: "OCEAN BLUE & SANDS", times: ["7:25", "10:25", "13:25"], pickup: "BARRERA" },
  { name: "LOPESAN", times: ["7:30", "10:30", "13:30"], pickup: "BARRERA" },
  { name: "MELIA", times: ["7:35", "10:35", "13:35"], pickup: "BARRERA" },
  { name: "PARADISUS CANA Y PALMA REAL", times: ["7:35", "10:35", "13:35"], pickup: "BARRERA" },
  { name: "DREAMS & SECRETS ROYAL BEACH", times: ["7:35", "10:35", "13:35"], pickup: "BARRERA" },
  { name: "COMPLEJO IBEROSTAR", times: ["7:35", "10:35", "13:35"], pickup: "LOBBY" },
  { name: "PLAZA TURQUESA (BAM MARKET)", times: ["7:40", "10:40", "13:40"], pickup: "PARQUEO" },
  { name: "LOS CORALES", times: ["7:40", "10:40", "13:40"], pickup: "BARRERA" },
  { name: "DUCASSI", times: ["7:45", "10:45", "13:45"], pickup: "BARRERA" },
  { name: "TROPICANA", times: ["7:45", "10:45", "13:45"], pickup: "BARRERA" },
  { name: "WHALA BAVARO", times: ["7:45", "10:45", "13:45"], pickup: "LOBBY" },
  { name: "RIU PALACE PUNTA CANA", times: ["7:45", "10:45", "13:45"], pickup: "LOBBY" },
  { name: "IMPRESSIVE PUNTA CANA", times: ["7:50", "10:50", "13:50"], pickup: "BARRERA" },
  { name: "ART VILLA DOMINICANA", times: ["7:50", "10:50", "13:50"], pickup: "BAM MARKET" },
  { name: "GREEN COAST AVENUE", times: ["7:50", "10:50", "13:50"], pickup: "LOBBY" },
  { name: "GREEN COAST BEACH", times: ["7:50", "10:50", "13:50"], pickup: "LOBBY" },
  { name: "COMPLEJO RIU", times: ["7:50", "10:50", "13:50"], pickup: "LOBBY" },
  { name: "VISTA SOL", times: ["7:55", "10:55", "13:55"], pickup: "BARRERA" },
  { name: "HOTEL 365 (PRESIDENTIAL SUITES)", times: ["7:55", "10:55", "13:55"], pickup: "BARRERA" },
  { name: "COMPLEJO PALLADIUM", times: ["8:00", "11:00", "14:00"], pickup: "CASINO" },
  { name: "PALLADIUM BAVARO", times: ["8:00", "11:00", "14:00"], pickup: "MEETING POINT" },
  { name: "COMPLEJO BAHIA", times: ["8:00", "11:00", "14:00"], pickup: "BARRERA" },
  { name: "OCCIDENTAL PUNTA CANA", times: ["8:05", "11:05", "14:05"], pickup: "BARRERA" },
  { name: "ROYALTON PUNTA CANA", times: ["8:05", "11:05", "14:05"], pickup: "BARRERA" },
  { name: "OCCIDENTAL CARIBE", times: ["8:05", "11:05", "14:05"], pickup: "BARRERA" },
  { name: "COMPLEJO MAJESTIC", times: ["8:05", "11:05", "14:05"], pickup: "BARRERA" },
  { name: "ROYALTON BAVARO", times: ["8:05", "11:05", "14:05"], pickup: "BARRERA" },
  { name: "BAVARO PRINCESS", times: ["8:10", "11:10", "14:10"], pickup: "BARRERA" },
  { name: "FLAMBOYAN", times: ["8:10", "11:10", "14:10"], pickup: "LOBBY" },
  { name: "G-44", times: ["8:10", "11:10", "14:10"], pickup: "ENTRADA" },
  { name: "RIU REPUBLICA", times: ["8:10", "11:10", "14:10"], pickup: "LOBBY" },
  { name: "CARIBE DELUXE PRINCESS", times: ["8:15", "11:15", "14:15"], pickup: "BARRERA" },
  { name: "TROPICAL DELUXE PRINCESS", times: ["8:15", "11:15", "14:15"], pickup: "BARRERA" },
  { name: "PARADISUS PUNTA CANA", times: ["8:15", "11:15", "14:15"], pickup: "BARRERA" },
  { name: "PUNTA CANA PRINCESS", times: ["8:15", "11:15", "14:15"], pickup: "BARRERA" },
  { name: "ZIVORY", times: ["8:20", "11:20", "14:20"], pickup: "LOBBY" },
  { name: "ZOETRY", times: ["8:20", "11:20", "14:20"], pickup: "LOBBY" },
  { name: "CANA ROCK/CONDO/ROCKS STAR", times: ["8:25", "11:10", "14:10"], pickup: "BARRERA/ADENTRO" },
  { name: "HARD ROCK", times: ["8:25", "11:25", "14:25"], pickup: "LOBBY GRUPOS" },
  { name: "DREAMS MACAO", times: ["8:30", "11:30", "14:30"], pickup: "BARRERA" },
  { name: "EXCELLENCE PUNTA CANA", times: ["8:30", "11:30", "14:30"], pickup: "LOBBY" },
  { name: "SIRENIS", times: ["8:30", "11:30", "14:30"], pickup: "MEETING POINT" },
  { name: "PLAYA PALMERA", times: ["8:30", "11:30", "14:30"], pickup: "BARRERA" },
  { name: "FINEST PUNTA CANA", times: ["8:30", "11:30", "14:30"], pickup: "LOBBY" },
  { name: "EXCELLENCE EL CARMEN", times: ["8:30", "11:30", "14:30"], pickup: "LOBBY" },
  { name: "BREATHLESS", times: ["8:30", "11:30", "14:30"], pickup: "LOBBY" },
  { name: "DREAMS ONYX", times: ["8:30", "11:30", "14:30"], pickup: "LOBBY" },
  { name: "LIVE AQUA", times: ["8:30", "11:30", "14:30"], pickup: "LOBBY" },
  { name: "JEWEL PUNTA CANA", times: ["8:30", "11:30", "14:30"], pickup: "BARRERA" },
  { name: "NICKELODEON", times: ["8:30", "11:30", "14:30"], pickup: "LOBBY" },
  { name: "ROYALTON CHIC PUNTA CANA", times: ["8:30", "11:30", "14:30"], pickup: "BARRERA" },
  { name: "OCEAN EL FARO", times: ["8:30", "11:30", "14:30"], pickup: "BARRERA" },
];

const TIME_LABELS = ["Morning", "Mid-Morning", "Afternoon"];
const CUSTOM_TIMES = ["8:00", "11:00", "2:00"];
const CUSTOM_TIME_LABELS = ["Morning", "Mid-Morning", "Afternoon"];

export function TransportSection() {
  const { addItem, items } = useCart();
  const [selectedHotel, setSelectedHotel] = useState<HotelInfo | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState("");
  const [customTime, setCustomTime] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInCart = items.some((item) => item.id === "private-transport");

  const filteredHotels = useMemo(() => {
    if (!searchQuery.trim()) return HOTELS;
    const q = searchQuery.toLowerCase();
    return HOTELS.filter((h) => h.name.toLowerCase().includes(q));
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectHotel = (hotel: HotelInfo) => {
    setSelectedHotel(hotel);
    setSelectedTime(null);
    setSearchQuery(hotel.name);
    setIsDropdownOpen(false);
  };

  const handleToggleMode = () => {
    setUseCustomLocation(!useCustomLocation);
    setSelectedHotel(null);
    setSelectedTime(null);
    setSearchQuery("");
    setCustomLocation("");
    setCustomTime(null);
  };

  const canBook = useCustomLocation
    ? customLocation.trim().length > 0 && customTime !== null
    : selectedHotel !== null && selectedTime !== null;

  const handleAddTransport = () => {
    if (isInCart || !canBook) return;
    const name = useCustomLocation
      ? `Private Transport — ${customLocation.trim()} (${CUSTOM_TIMES[customTime!]})`
      : `Private Transport — ${selectedHotel!.name} (${selectedHotel!.times[selectedTime!]})`;
    addItem({
      id: "private-transport",
      name,
      price: 75,
      image: "/images/service-section/private-transportation.png",
      type: "service",
    });
  };

  return (
    <section id="transport" className="relative bg-neutral-950 py-20 md:py-28 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/60 mb-6">
            <Bus className="h-3.5 w-3.5" />
            <span>Door-to-Door Service</span>
          </div>
          <h2 className="font-title text-4xl md:text-5xl lg:text-6xl text-white mb-10">
            Private Transport
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto mt-4">
            Round-trip private transportation from any location in Punta Cana directly to the adventure
          </p>
        </div>

        {/* Main card */}
        <div className="relative mx-auto max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            {/* Route visualization */}
            <div className="px-8 pt-10 pb-6 md:px-12 md:pt-12">
              <div className="flex items-center justify-between gap-4">
                {/* From */}
                <div className="flex-1 text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 mb-3">
                    <MapPin className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-white text-sm font-medium uppercase tracking-wider">Your Location</p>
                  <p className="text-white/40 text-xs mt-1 max-w-[120px] truncate mx-auto">
                    {selectedHotel ? selectedHotel.name : useCustomLocation && customLocation ? customLocation : "Select below"}
                  </p>
                </div>

                {/* Arrows */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 px-2">
                  <ArrowRight className="h-5 w-5 text-red-500/60" />
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                  <ArrowLeft className="h-5 w-5 text-red-500/60" />
                </div>

                {/* To */}
                <div className="flex-1 text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 mb-3">
                    <MapPin className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-white text-sm font-medium uppercase tracking-wider">Macao</p>
                  <p className="text-white/40 text-xs mt-1">Offroad Experience</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-8 md:mx-12 h-px bg-white/10" />

            {/* Hotel selector + time slots */}
            <div className="px-8 py-8 md:px-12 md:py-10 space-y-6">
              {/* Mode toggle */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { if (useCustomLocation) handleToggleMode(); }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                    !useCustomLocation
                      ? "bg-red-600/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60"
                  }`}
                >
                  <Hotel className="h-3.5 w-3.5" />
                  From hotel list
                </button>
                <button
                  onClick={() => { if (!useCustomLocation) handleToggleMode(); }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                    useCustomLocation
                      ? "bg-red-600/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60"
                  }`}
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Custom location
                </button>
              </div>

              {/* Option A: Hotel search/select */}
              {!useCustomLocation && (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">1</span>
                      Select your hotel
                    </label>
                    <div ref={dropdownRef} className="relative">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                          type="text"
                          placeholder="Search your hotel..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsDropdownOpen(true);
                            if (!e.target.value) {
                              setSelectedHotel(null);
                              setSelectedTime(null);
                            }
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                        />
                        <ChevronDown
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </div>

                      {/* Dropdown list */}
                      {isDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-neutral-900 shadow-2xl shadow-black/50">
                          {filteredHotels.length === 0 ? (
                            <div className="px-4 py-3 text-white/30 text-sm">No hotels found</div>
                          ) : (
                            filteredHotels.map((hotel) => (
                              <button
                                key={hotel.name}
                                onClick={() => handleSelectHotel(hotel)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                                  selectedHotel?.name === hotel.name
                                    ? "bg-red-600/20 text-red-400"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span className="truncate">{hotel.name}</span>
                                <span className="text-[10px] text-white/30 uppercase whitespace-nowrap flex-shrink-0">
                                  {hotel.pickup}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Pickup point info + Time selection */}
                  {selectedHotel && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Pickup point badge */}
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                        <Navigation className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Meeting Point</p>
                          <p className="text-white text-sm font-medium">{selectedHotel.pickup}</p>
                        </div>
                      </div>

                      <label className="text-white/40 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">2</span>
                        Choose your pickup time
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedHotel.times.map((time, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedTime(idx)}
                            className={`group relative rounded-xl border p-4 text-center transition-all duration-200 ${
                              selectedTime === idx
                                ? "border-red-500 bg-red-600/15 ring-1 ring-red-500/30"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                            }`}
                          >
                            <Clock
                              className={`mx-auto h-5 w-5 mb-2 ${
                                selectedTime === idx ? "text-red-500" : "text-white/30"
                              }`}
                            />
                            <p
                              className={`text-lg font-bold tabular-nums ${
                                selectedTime === idx ? "text-red-400" : "text-white"
                              }`}
                            >
                              {time}
                            </p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                              {TIME_LABELS[idx]}
                            </p>
                            {selectedTime === idx && (
                              <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Option B: Custom location */}
              {useCustomLocation && (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">1</span>
                      Enter your location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Airbnb in Bavaro, Villa in Los Corales..."
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                    <p className="text-white/30 text-xs mt-2">
                      Our team will contact you to confirm the exact pickup time and meeting point.
                    </p>
                  </div>

                  {/* Step 2: Reference time */}
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">2</span>
                      Choose a reference pickup time
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {CUSTOM_TIMES.map((time, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCustomTime(idx)}
                          className={`group relative rounded-xl border p-4 text-center transition-all duration-200 ${
                            customTime === idx
                              ? "border-red-500 bg-red-600/15 ring-1 ring-red-500/30"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                          }`}
                        >
                          <Clock
                            className={`mx-auto h-5 w-5 mb-2 ${
                              customTime === idx ? "text-red-500" : "text-white/30"
                            }`}
                          />
                          <p
                            className={`text-lg font-bold tabular-nums ${
                              customTime === idx ? "text-red-400" : "text-white"
                            }`}
                          >
                            {time}
                          </p>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                            {CUSTOM_TIME_LABELS[idx]}
                          </p>
                          {customTime === idx && (
                            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Price and CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-bold text-white">$75</span>
                    <span className="text-white/40 text-sm">USD</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1 uppercase tracking-wider">Round Trip • Private</p>
                </div>

                <button
                  onClick={handleAddTransport}
                  disabled={isInCart || !canBook}
                  className={`group relative flex items-center gap-3 rounded-full px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                    isInCart
                      ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                      : !canBook
                        ? "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-500 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 active:scale-95"
                  }`}
                >
                  {isInCart ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                      <span>Book Transport</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white/[0.02] border-t border-white/10 px-8 py-6 md:px-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                {[
                  { label: "Private Vehicle", desc: "Just for you" },
                  { label: "Any Location", desc: "Punta Cana area" },
                  { label: "Round Trip", desc: "Pickup & return" },
                ].map((feature) => (
                  <div key={feature.label}>
                    <p className="text-white/80 text-sm font-medium">{feature.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
