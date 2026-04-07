/**
 * Directorio de hoteles con links de Google Maps (CID).
 * Agrupados por sección/zona de recogida.
 *
 * mapUrl  → link directo al lugar en Google Maps
 * Cuando se necesite embed, usamos el nombre del hotel como query.
 */

export interface HotelLocation {
  name: string
  section: number
  zone: string
  mapUrl: string
}

export const hotelDirectory: Record<string, HotelLocation> = {
  // ── SECCIÓN 1 — Punta Cana ──
  "TORTUGA BAY": {
    name: "Tortuga Bay",
    section: 1,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "WESTIN PUNTA CANA": {
    name: "Westin Punta Cana",
    section: 1,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "CLUB MED": {
    name: "Club Med Punta Cana",
    section: 1,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },

  // ── SECCIÓN 2 — Cap Cana ──
  "SANCTUARY CAP CANA": {
    name: "Sanctuary Cap Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "MARGARITAVILLE": {
    name: "Margaritaville Cap Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "ANCORA": {
    name: "Ancora Cap Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "FISHING LODGE": {
    name: "Fishing Lodge Cap Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "TRS CAP CANA": {
    name: "TRS Cap Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "HYATT ZILARA ZIVA": {
    name: "Hyatt Zilara & Ziva Cap Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "SECRETS CAP CANA": {
    name: "Secrets Cap Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },
  "FOUR POINTS SHERATON": {
    name: "Four Points by Sheraton Punta Cana",
    section: 2,
    zone: "Cap Cana",
    mapUrl: "https://maps.google.com/?cid=15514517584287180665",
  },

  // ── SECCIÓN 3 ──
  "DREAMS FLORA": {
    name: "Dreams Flora Resort",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=4651762402289828792",
  },
  "NATURA PARK": {
    name: "Dreams Flora Resort",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=4651762402289828792",
  },
  "JEWEL PALM BEACH": {
    name: "Jewel Palm Beach",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14250982011818498739",
  },
  "DREAMS PALM BEACH": {
    name: "Jewel Palm Beach",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14250982011818498739",
  },
  "SUNSCAPE COCO": {
    name: "Sunscape Coco Punta Cana",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=1302199869846089317",
  },
  "RADISSON BLU": {
    name: "Radisson Blu Punta Cana",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=2049475627224558295",
  },
  "SERENADE": {
    name: "Serenade Punta Cana",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=11025467887090307087",
  },
  "CATALONIA": {
    name: "Catalonia Bávaro",
    section: 3,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=16935772023207570356",
  },

  // ── SECCIÓN 4 ──
  "BOMBA SUNIX COCO BONGO": {
    name: "Bomba Sunix de Coco Bongo",
    section: 4,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=7326013566736241623",
  },
  "AC MARRIOTT": {
    name: "AC by Marriott Punta Cana",
    section: 4,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=1408910258481570206",
  },

  // ── SECCIÓN 5 (Primera parte) ──
  "BARCELO BAVARO PALACE": {
    name: "Barceló Bávaro Palace",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14332217912577279337",
  },
  "BARCELO BAVARO BEACH": {
    name: "Barceló Bávaro Beach",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=13954686213375938731",
  },
  "LOPESAN": {
    name: "Lopesan Costa Bávaro",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=17773293275857102107",
  },
  "MELIA": {
    name: "Meliá Punta Cana Beach",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=11842675170560920137",
  },
  "PARADISUS PALMA REAL": {
    name: "Paradisus Palma Real",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=4521067883141671878",
  },
  "DREAMS ROYAL BEACH": {
    name: "Dreams Royal Beach Punta Cana",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14338942867345206038",
  },
  "SECRETS ROYAL BEACH": {
    name: "Secrets Royal Beach Punta Cana",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14338942867345206038",
  },
  "PLAZA TURQUESA": {
    name: "Plaza Turquesa",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=15591496176324005969",
  },
  "LOS CORALES": {
    name: "Los Corales Bávaro",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=6462538857552917452",
  },

  // ── SECCIÓN 5 (Continuación) ──
  "DUCASSI": {
    name: "Ducassi Suites",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=11338465589745733060",
  },
  "TROPICANA": {
    name: "Tropicana Suites Bávaro",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=17623063256317199551",
  },
  "WHALA BAVARO": {
    name: "Whala Bávaro",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=7149058567281878202",
  },
  "IMPRESSIVE PUNTA CANA": {
    name: "Impressive Punta Cana",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=12392768679094402631",
  },
  "ART VILLA DOMINICANA": {
    name: "Art Villa Dominicana",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=16945691841226117381",
  },
  "GREEN COAST AVENUE": {
    name: "Green Coast Avenue",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14995391120530840412",
  },
  "GREEN COAST BEACH": {
    name: "Green Coast Beach",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14995391120530840412",
  },
  "VISTA SOL": {
    name: "Vista Sol Punta Cana",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=1287951327625327436",
  },
  "HOTEL 365": {
    name: "Hotel 365 Presidential Suites",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14075362868812838401",
  },
  "PRESIDENTIAL SUITES": {
    name: "Hotel 365 Presidential Suites",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14075362868812838401",
  },
  "COMPLEJO PALLADIUM": {
    name: "Complejo Palladium",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=13344610401975870760",
  },
  "PALLADIUM BAVARO": {
    name: "Palladium Bávaro",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=9048252444135684552",
  },
  "OCCIDENTAL PUNTA CANA": {
    name: "Occidental Punta Cana",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=1789683107466099784",
  },
  "BAVARO PRINCESS": {
    name: "Bávaro Princess",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=8701989302338633019",
  },
  "FLAMBOYAN": {
    name: "Flamboyán Bávaro",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=12556261664655795575",
  },
  "G-44": {
    name: "G-44",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=9545435727790387933",
  },
  "CARIBE DELUXE PRINCESS": {
    name: "Caribe Deluxe Princess",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=9300992413508887314",
  },
  "TROPICAL DELUXE PRINCESS": {
    name: "Tropical Deluxe Princess",
    section: 5,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=4147341576994051146",
  },

  // ── SECCIÓN 6 ──
  "WHALA URBAN": {
    name: "Whala Urban Punta Cana",
    section: 6,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=472133880790523805",
  },

  // ── SECCIÓN 7 ──
  "PARADISUS PUNTA CANA": {
    name: "Paradisus Punta Cana",
    section: 7,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=4301053263250089145",
  },
  "KARIBO PUNTA CANA": {
    name: "Karibo Punta Cana",
    section: 7,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=3237918886827372571",
  },
  "PUNTA CANA PRINCESS": {
    name: "Punta Cana Princess",
    section: 7,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=3655102703610997697",
  },
  "VIK ARENA": {
    name: "Vik Arena Blanca",
    section: 7,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=5940301698383170439",
  },
  "OCEAN BLUE SANDS": {
    name: "Ocean Blue & Sand",
    section: 7,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=8498050744980474243",
  },

  // ── SECCIÓN 8 ──
  "COMPLEJO IBEROSTAR": {
    name: "Iberostar Punta Cana",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=13797520085426851815",
  },
  "RIU PALACE PUNTA CANA": {
    name: "Riu Palace Punta Cana",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=16316935411577698885",
  },
  "COMPLEJO RIU": {
    name: "Complejo Riu Bávaro",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=988174041190118407",
  },
  "COMPLEJO BAHIA": {
    name: "Complejo Bahía Príncipe",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14925218778870596200",
  },
  "ROYALTON PUNTA CANA": {
    name: "Royalton Punta Cana",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=11494550581854568560",
  },
  "OCCIDENTAL CARIBE": {
    name: "Occidental Caribe",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=235676628556694277",
  },
  "RIU REPUBLICA": {
    name: "Riu Republica",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=10382270913050019679",
  },
  "COMPLEJO MAJESTIC": {
    name: "Majestic Elegance Punta Cana",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=2401361257022026210",
  },
  "MAJESTIC ELEGANCE": {
    name: "Majestic Elegance Punta Cana",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=2401361257022026210",
  },
  "ROYALTON BAVARO": {
    name: "Royalton Bávaro",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=961357558086239027",
  },
  "CANA ROCK": {
    name: "Cana Rock Star",
    section: 8,
    zone: "Bávaro",
    mapUrl: "https://maps.google.com/?cid=14222484609728359489",
  },
  "HARD ROCK": {
    name: "Hard Rock Hotel & Casino Punta Cana",
    section: 8,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=12113056368167273893",
  },

  // ── SECCIÓN 9 ──
  "DREAMS MACAO": {
    name: "Dreams Macao Beach",
    section: 9,
    zone: "Macao",
    mapUrl: "https://maps.google.com/?cid=15747183276739379966",
  },

  // ── SECCIÓN 10 ──
  "ZIVORY": {
    name: "Zivory Residences",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=13698082402319136443",
  },
  "ZOETRY": {
    name: "Zoetry Agua Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=8552595153177583682",
  },
  "EXCELLENCE PUNTA CANA": {
    name: "Excellence Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=14780359899691664996",
  },
  "SIRENIS": {
    name: "Sirenis Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=877293075062297634",
  },
  "PLAYA PALMERA": {
    name: "Playa Palmera Beach Resort",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=16371752248288111133",
  },
  "FINEST PUNTA CANA": {
    name: "Finest Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=1370877673844938338",
  },
  "EXCELLENCE EL CARMEN": {
    name: "Excellence El Carmen",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=1539498798417954818",
  },
  "BREATHLESS": {
    name: "Breathless Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=3175173419162667501",
  },
  "DREAMS ONYX": {
    name: "Dreams Onyx Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=4222869849278560074",
  },
  "LIVE AQUA": {
    name: "Live Aqua Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=17417080974957262409",
  },
  "JEWEL PUNTA CANA": {
    name: "Jewel Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=17885755024717935875",
  },
  "NICKELODEON": {
    name: "Nickelodeon Hotels & Resorts Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=5519803465580105527",
  },
  "ROYALTON CHIC PUNTA CANA": {
    name: "Royalton Chic Punta Cana",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=16215563891078794956",
  },
  "OCEAN EL FARO": {
    name: "Ocean El Faro",
    section: 10,
    zone: "Punta Cana",
    mapUrl: "https://maps.google.com/?cid=640087367025363133",
  },
}

/**
 * Busca un hotel en el directorio por nombre (búsqueda flexible).
 * Intenta coincidencia exacta por key, luego busca parcial.
 */
export function findHotel(hotelName: string): HotelLocation | null {
  const upper = hotelName.toUpperCase().trim()

  // Coincidencia exacta por key
  if (hotelDirectory[upper]) return hotelDirectory[upper]

  // Buscar por key que contenga el nombre
  for (const [key, val] of Object.entries(hotelDirectory)) {
    if (upper.includes(key) || key.includes(upper)) return val
  }

  // Buscar por nombre parcial
  for (const val of Object.values(hotelDirectory)) {
    if (val.name.toUpperCase().includes(upper) || upper.includes(val.name.toUpperCase())) return val
  }

  return null
}
