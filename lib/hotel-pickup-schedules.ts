export type TurnSlot = "8 AM" | "11 AM" | "3 PM"
export type SaonaProvider = "daniel" | "julio"

export type HotelPickupSchedule = {
  hotel: string
  aliases: string[]
  times: Record<TurnSlot, string>
  pickupLabel: string
  saona: { daniel: string | null; julio: string | null }
}

export const HOTEL_PICKUP_SCHEDULES: HotelPickupSchedule[] = [
  {
    "hotel": "TORTUGA BAY",
    "aliases": [
      "TORTUGA BAY"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "WESTIN PUNTA CANA",
    "aliases": [
      "WESTIN PUNTA CANA"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "CLUB MED",
    "aliases": [
      "CLUB MED"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "SANCTUARY CAP CANA",
    "aliases": [
      "SANCTUARY CAP CANA"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "MARGARITA VILLE",
    "aliases": [
      "MARGARITA VILLE"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "ANCORA",
    "aliases": [
      "ANCORA"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "FISHING LODGE",
    "aliases": [
      "FISHING LODGE"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "TRS CAP CANA",
    "aliases": [
      "TRS CAP CANA"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "HYATT ZILARA & ZIVA",
    "aliases": [
      "HYATT ZILARA & ZIVA"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "SECRET CAP CANA",
    "aliases": [
      "SECRET CAP CANA"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "FOUR POINTS BY SHERATON",
    "aliases": [
      "FOUR POINTS BY SHERATON"
    ],
    "times": {
      "8 AM": "6:50 AM",
      "11 AM": "9:50 AM",
      "3 PM": "12:50 PM"
    },
    "pickupLabel": "BOMBA PETROLEUM",
    "saona": {
      "daniel": "9:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "DREAMS FLORA (NATURA PARK)",
    "aliases": [
      "DREAMS FLORA (NATURA PARK)"
    ],
    "times": {
      "8 AM": "6:55 AM",
      "11 AM": "9:55 AM",
      "3 PM": "12:55 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:35 AM",
      "julio": null
    }
  },
  {
    "hotel": "JEWEL PALM BEACH (DREAMS P. B.)",
    "aliases": [
      "JEWEL PALM BEACH (DREAMS P. B.)"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "SUNSCAPE COCO",
    "aliases": [
      "SUNSCAPE COCO"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:20 AM",
      "julio": "7:30 AM"
    }
  },
  {
    "hotel": "RADISSON BLU",
    "aliases": [
      "RADISSON BLU"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "SERENADE",
    "aliases": [
      "SERENADE"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:20 AM",
      "julio": "7:35 AM"
    }
  },
  {
    "hotel": "CATALONIA",
    "aliases": [
      "CATALONIA"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:20 AM",
      "julio": "7:40 AM"
    }
  },
  {
    "hotel": "BOMBA SUNIX DE COCO BONGO",
    "aliases": [
      "BOMBA SUNIX DE COCO BONGO"
    ],
    "times": {
      "8 AM": "7:15 AM",
      "11 AM": "10:15 AM",
      "3 PM": "1:15 PM"
    },
    "pickupLabel": "PARQUEO",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "AC BY MARRIOT",
    "aliases": [
      "AC BY MARRIOT"
    ],
    "times": {
      "8 AM": "7:20 AM",
      "11 AM": "10:20 AM",
      "3 PM": "1:20 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "BARCELO BAVARO PALACE",
    "aliases": [
      "BARCELO BAVARO PALACE"
    ],
    "times": {
      "8 AM": "7:25 AM",
      "11 AM": "10:25 AM",
      "3 PM": "1:25 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:15 AM",
      "julio": "7:40 AM"
    }
  },
  {
    "hotel": "BARCELO BAVARO BEACH",
    "aliases": [
      "BARCELO BAVARO BEACH"
    ],
    "times": {
      "8 AM": "7:25 AM",
      "11 AM": "10:25 AM",
      "3 PM": "1:25 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "LOPESAN",
    "aliases": [
      "LOPESAN"
    ],
    "times": {
      "8 AM": "7:30 AM",
      "11 AM": "10:30 AM",
      "3 PM": "1:30 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:20 AM",
      "julio": "7:40 AM"
    }
  },
  {
    "hotel": "MELIA",
    "aliases": [
      "MELIA"
    ],
    "times": {
      "8 AM": "7:35 AM",
      "11 AM": "10:35 AM",
      "3 PM": "1:35 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:40 AM",
      "julio": "7:40 AM"
    }
  },
  {
    "hotel": "PARADISUS CANA Y PALMA REAL",
    "aliases": [
      "PARADISUS CANA Y PALMA REAL"
    ],
    "times": {
      "8 AM": "7:35 AM",
      "11 AM": "10:35 AM",
      "3 PM": "1:35 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "DREAMS & SECRETS ROYAL BEACH",
    "aliases": [
      "DREAMS & SECRETS ROYAL BEACH"
    ],
    "times": {
      "8 AM": "7:35 AM",
      "11 AM": "10:35 AM",
      "3 PM": "1:35 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "PLAZA TURQUESA (BAM MARKET)",
    "aliases": [
      "PLAZA TURQUESA (BAM MARKET)"
    ],
    "times": {
      "8 AM": "7:40 AM",
      "11 AM": "10:40 AM",
      "3 PM": "1:40 PM"
    },
    "pickupLabel": "PARQUEO",
    "saona": {
      "daniel": "7:45 AM",
      "julio": null
    }
  },
  {
    "hotel": "LOS CORALES",
    "aliases": [
      "LOS CORALES"
    ],
    "times": {
      "8 AM": "7:40 AM",
      "11 AM": "10:40 AM",
      "3 PM": "1:40 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "DUCASSI",
    "aliases": [
      "DUCASSI"
    ],
    "times": {
      "8 AM": "7:45 AM",
      "11 AM": "10:45 AM",
      "3 PM": "1:45 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "TROPICANA",
    "aliases": [
      "TROPICANA"
    ],
    "times": {
      "8 AM": "7:45 AM",
      "11 AM": "10:45 AM",
      "3 PM": "1:45 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "WHALA BAVARO",
    "aliases": [
      "WHALA BAVARO"
    ],
    "times": {
      "8 AM": "7:45 AM",
      "11 AM": "10:45 AM",
      "3 PM": "1:45 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:30 AM",
      "julio": "7:30 AM"
    }
  },
  {
    "hotel": "IMPRESSIVE PUNTA CANA",
    "aliases": [
      "IMPRESSIVE PUNTA CANA"
    ],
    "times": {
      "8 AM": "7:50 AM",
      "11 AM": "10:50 AM",
      "3 PM": "1:50 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "ART VILLA DOMINICANA",
    "aliases": [
      "ART VILLA DOMINICANA"
    ],
    "times": {
      "8 AM": "7:50 AM",
      "11 AM": "10:50 AM",
      "3 PM": "1:50 PM"
    },
    "pickupLabel": "BAM MARKET",
    "saona": {
      "daniel": "7:30 AM",
      "julio": null
    }
  },
  {
    "hotel": "GREEN COAST AVENUE",
    "aliases": [
      "GREEN COAST AVENUE"
    ],
    "times": {
      "8 AM": "7:50 AM",
      "11 AM": "10:50 AM",
      "3 PM": "1:50 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:30 AM",
      "julio": null
    }
  },
  {
    "hotel": "GREN COAST BEACH",
    "aliases": [
      "GREN COAST BEACH"
    ],
    "times": {
      "8 AM": "7:50 AM",
      "11 AM": "10:50 AM",
      "3 PM": "1:50 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:30 AM",
      "julio": null
    }
  },
  {
    "hotel": "VISTA SOL",
    "aliases": [
      "VISTA SOL"
    ],
    "times": {
      "8 AM": "7:55 AM",
      "11 AM": "10:55 AM",
      "3 PM": "1:55 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:50 AM",
      "julio": "7:10 AM"
    }
  },
  {
    "hotel": "HOTEL 365 (PRESIDENTIAL SUITES)",
    "aliases": [
      "HOTEL 365 (PRESIDENTIAL SUITES)"
    ],
    "times": {
      "8 AM": "7:55 AM",
      "11 AM": "10:55 AM",
      "3 PM": "1:55 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:30 AM",
      "julio": null
    }
  },
  {
    "hotel": "COMPLEJO PALLADIUM",
    "aliases": [
      "COMPLEJO PALLADIUM"
    ],
    "times": {
      "8 AM": "8:00 AM",
      "11 AM": "11:00 AM",
      "3 PM": "2:00 PM"
    },
    "pickupLabel": "CASINO",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "PALLADIUM BAVARO",
    "aliases": [
      "PALLADIUM BAVARO"
    ],
    "times": {
      "8 AM": "8:00 AM",
      "11 AM": "11:00 AM",
      "3 PM": "2:00 PM"
    },
    "pickupLabel": "MEETING POINT",
    "saona": {
      "daniel": "8:00 AM",
      "julio": "7:00 AM"
    }
  },
  {
    "hotel": "OCCIDENTAL PUNTA CANA",
    "aliases": [
      "OCCIDENTAL PUNTA CANA"
    ],
    "times": {
      "8 AM": "8:05 AM",
      "11 AM": "11:05 AM",
      "3 PM": "2:05 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:15 AM",
      "julio": "7:30 AM"
    }
  },
  {
    "hotel": "BAVARO PRINCESS",
    "aliases": [
      "BAVARO PRINCESS"
    ],
    "times": {
      "8 AM": "8:10 AM",
      "11 AM": "11:10 AM",
      "3 PM": "2:10 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:55 AM",
      "julio": "7:20 AM"
    }
  },
  {
    "hotel": "FLAMBOYAN",
    "aliases": [
      "FLAMBOYAN"
    ],
    "times": {
      "8 AM": "8:10 AM",
      "11 AM": "11:10 AM",
      "3 PM": "2:10 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "G-44",
    "aliases": [
      "G-44"
    ],
    "times": {
      "8 AM": "8:10 AM",
      "11 AM": "11:10 AM",
      "3 PM": "2:10 PM"
    },
    "pickupLabel": "ENTRADA",
    "saona": {
      "daniel": "8:10 AM",
      "julio": null
    }
  },
  {
    "hotel": "CARIBE DELUXE PRINCESS",
    "aliases": [
      "CARIBE DELUXE PRINCESS"
    ],
    "times": {
      "8 AM": "8:15 AM",
      "11 AM": "11:15 AM",
      "3 PM": "2:15 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:30 AM",
      "julio": "7:10 AM"
    }
  },
  {
    "hotel": "TROPICAL DELUXE PRINCESS",
    "aliases": [
      "TROPICAL DELUXE PRINCESS"
    ],
    "times": {
      "8 AM": "8:15 AM",
      "11 AM": "11:15 AM",
      "3 PM": "2:15 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:30 AM",
      "julio": null
    }
  },
  {
    "hotel": "WHALA URBAN",
    "aliases": [
      "WHALA URBAN"
    ],
    "times": {
      "8 AM": "7:00 AM",
      "11 AM": "10:00 AM",
      "3 PM": "1:00 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "PARADISUS PUNTA CANA",
    "aliases": [
      "PARADISUS PUNTA CANA"
    ],
    "times": {
      "8 AM": "8:15 AM",
      "11 AM": "11:15 AM",
      "3 PM": "2:15 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:40 AM",
      "julio": null
    }
  },
  {
    "hotel": "KARIBO PUNTA CANA",
    "aliases": [
      "KARIBO PUNTA CANA"
    ],
    "times": {
      "8 AM": "7:20 AM",
      "11 AM": "10:20 AM",
      "3 PM": "1:20 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "PUNTA CANA PRINCESS",
    "aliases": [
      "PUNTA CANA PRINCESS"
    ],
    "times": {
      "8 AM": "8:15 AM",
      "11 AM": "11:15 AM",
      "3 PM": "2:15 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "VIK ARENA",
    "aliases": [
      "VIK ARENA"
    ],
    "times": {
      "8 AM": "7:20 AM",
      "11 AM": "10:20 AM",
      "3 PM": "1:20 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:10 AM",
      "julio": null
    }
  },
  {
    "hotel": "OCEAN BLUE & SANDS",
    "aliases": [
      "OCEAN BLUE & SANDS"
    ],
    "times": {
      "8 AM": "7:25 AM",
      "11 AM": "10:25 AM",
      "3 PM": "1:25 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:05 AM",
      "julio": null
    }
  },
  {
    "hotel": "COMPLEJO IBEROSTAR",
    "aliases": [
      "COMPLEJO IBEROSTAR"
    ],
    "times": {
      "8 AM": "7:35 AM",
      "11 AM": "10:35 AM",
      "3 PM": "1:35 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "RIU PALACE PUNTA CANA",
    "aliases": [
      "RIU PALACE PUNTA CANA"
    ],
    "times": {
      "8 AM": "7:45 AM",
      "11 AM": "10:45 AM",
      "3 PM": "1:45 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "8:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "COMPLEJO RIU",
    "aliases": [
      "COMPLEJO RIU"
    ],
    "times": {
      "8 AM": "7:50 AM",
      "11 AM": "10:50 AM",
      "3 PM": "1:50 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "COMPLEJO BAHIA",
    "aliases": [
      "COMPLEJO BAHIA"
    ],
    "times": {
      "8 AM": "8:00 AM",
      "11 AM": "11:00 AM",
      "3 PM": "2:00 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "ROYALTON PUNTA CANA",
    "aliases": [
      "ROYALTON PUNTA CANA"
    ],
    "times": {
      "8 AM": "8:05 AM",
      "11 AM": "11:05 AM",
      "3 PM": "2:05 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "OCCIDENTAL CARIBE",
    "aliases": [
      "OCCIDENTAL CARIBE"
    ],
    "times": {
      "8 AM": "8:05 AM",
      "11 AM": "11:05 AM",
      "3 PM": "2:05 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:15 AM",
      "julio": "7:10 AM"
    }
  },
  {
    "hotel": "RIU REPUBLICA",
    "aliases": [
      "RIU REPUBLICA"
    ],
    "times": {
      "8 AM": "8:10 AM",
      "11 AM": "11:10 AM",
      "3 PM": "2:10 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "8:15 AM",
      "julio": "7:00 AM"
    }
  },
  {
    "hotel": "COMPLEJO MAJESTIC",
    "aliases": [
      "COMPLEJO MAJESTIC"
    ],
    "times": {
      "8 AM": "8:05 AM",
      "11 AM": "11:05 AM",
      "3 PM": "2:05 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:55 AM",
      "julio": null
    }
  },
  {
    "hotel": "ROYALTON BAVARO",
    "aliases": [
      "ROYALTON BAVARO"
    ],
    "times": {
      "8 AM": "8:05 AM",
      "11 AM": "11:05 AM",
      "3 PM": "2:05 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "CANA ROCK/CONDO/ROCKS STAR",
    "aliases": [
      "CANA ROCK/CONDO/ROCKS STAR"
    ],
    "times": {
      "8 AM": "8:25 AM",
      "11 AM": "11:10 AM",
      "3 PM": "2:10 PM"
    },
    "pickupLabel": "BARRERA/ADENTRO",
    "saona": {
      "daniel": "8:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "HARD ROCK",
    "aliases": [
      "HARD ROCK"
    ],
    "times": {
      "8 AM": "8:25 AM",
      "11 AM": "11:25 AM",
      "3 PM": "2:25 PM"
    },
    "pickupLabel": "LOBBY GRUPOS",
    "saona": {
      "daniel": "7:00 AM",
      "julio": "7:00 AM"
    }
  },
  {
    "hotel": "DREAMS MACAO",
    "aliases": [
      "DREAMS MACAO"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "ZIVORY",
    "aliases": [
      "ZIVORY"
    ],
    "times": {
      "8 AM": "8:20 AM",
      "11 AM": "11:20 AM",
      "3 PM": "2:20 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:00 AM",
      "julio": null
    }
  },
  {
    "hotel": "ZOETRY",
    "aliases": [
      "ZOETRY"
    ],
    "times": {
      "8 AM": "8:20 AM",
      "11 AM": "11:20 AM",
      "3 PM": "2:20 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:00 AM",
      "julio": null
    }
  },
  {
    "hotel": "EXCELLENCE PUNTA CANA",
    "aliases": [
      "EXCELLENCE PUNTA CANA"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "SIRENIS",
    "aliases": [
      "SIRENIS"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "MEETING POINT",
    "saona": {
      "daniel": "7:20 AM",
      "julio": "6:50 AM"
    }
  },
  {
    "hotel": "PLAYA PALMERA",
    "aliases": [
      "PLAYA PALMERA"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "8:30 AM",
      "julio": null
    }
  },
  {
    "hotel": "FINEST PUNTA CANA",
    "aliases": [
      "FINEST PUNTA CANA"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "EXCELLENCE EL CARMEN",
    "aliases": [
      "EXCELLENCE EL CARMEN"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "BREATHLESS",
    "aliases": [
      "BREATHLESS"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:15 AM",
      "julio": null
    }
  },
  {
    "hotel": "DREAMS ONYX",
    "aliases": [
      "DREAMS ONYX"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "LIVE AQUA",
    "aliases": [
      "LIVE AQUA"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:15 AM",
      "julio": "7:10 AM"
    }
  },
  {
    "hotel": "JEWEL PUNTA CANA",
    "aliases": [
      "JEWEL PUNTA CANA"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": null,
      "julio": null
    }
  },
  {
    "hotel": "NICKELODEON",
    "aliases": [
      "NICKELODEON"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "LOBBY",
    "saona": {
      "daniel": "7:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "ROYALTON CHIC PUNTA CANA",
    "aliases": [
      "ROYALTON CHIC PUNTA CANA"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:20 AM",
      "julio": null
    }
  },
  {
    "hotel": "OCEAN EL FARO",
    "aliases": [
      "OCEAN EL FARO"
    ],
    "times": {
      "8 AM": "8:30 AM",
      "11 AM": "11:30 AM",
      "3 PM": "2:30 PM"
    },
    "pickupLabel": "BARRERA",
    "saona": {
      "daniel": "7:15 AM",
      "julio": "7:10 AM"
    }
  }
]

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function tokenScore(a: string, b: string) {
  const ta = new Set(a.split(" ").filter(Boolean))
  const tb = new Set(b.split(" ").filter(Boolean))
  if (ta.size === 0 || tb.size === 0) return 0

  let common = 0
  for (const t of ta) {
    if (tb.has(t)) common += 1
  }

  return common / Math.max(ta.size, tb.size)
}

function computeAliasScore(queryNorm: string, aliasNorm: string) {
  if (!aliasNorm) return 0
  if (queryNorm === aliasNorm) return 1
  if (queryNorm.includes(aliasNorm) || aliasNorm.includes(queryNorm)) return 0.93
  return tokenScore(queryNorm, aliasNorm)
}

export function classifyPickupPoint(pickupLabel: string): "lobby" | "barrera" {
  const p = normalizeText(pickupLabel)
  if (p.includes("lobby")) return "lobby"
  return "barrera"
}

export function findHotelScheduleMatch(hotelOrLocation: string) {
  const queryNorm = normalizeText(hotelOrLocation)
  if (!queryNorm) return null

  let best: { schedule: HotelPickupSchedule; score: number; alias: string } | null = null

  for (const schedule of HOTEL_PICKUP_SCHEDULES) {
    const aliases = schedule.aliases.length > 0 ? schedule.aliases : [schedule.hotel]
    for (const alias of aliases) {
      const aliasNorm = normalizeText(alias)
      const score = computeAliasScore(queryNorm, aliasNorm)
      if (score < 0.45) continue

      if (!best || score > best.score) {
        best = { schedule, score, alias }
      }
    }
  }

  return best
}

export function getBuggyPickupSuggestion(hotelOrLocation: string, slot: TurnSlot) {
  const best = findHotelScheduleMatch(hotelOrLocation)
  if (!best) return null

  return {
    hotel: best.schedule.hotel,
    matchedAlias: best.alias,
    score: best.score,
    pickupTime: best.schedule.times[slot],
    pickupLabel: best.schedule.pickupLabel,
    pickupPoint: classifyPickupPoint(best.schedule.pickupLabel),
  }
}

export function getSaonaPickupSuggestion(hotelOrLocation: string, provider: SaonaProvider) {
  const best = findHotelScheduleMatch(hotelOrLocation)
  if (!best) return null

  const pickupTime = best.schedule.saona[provider]
  if (!pickupTime) return null

  return {
    hotel: best.schedule.hotel,
    matchedAlias: best.alias,
    score: best.score,
    pickupTime,
    pickupLabel: best.schedule.pickupLabel,
    pickupPoint: classifyPickupPoint(best.schedule.pickupLabel),
  }
}

export function getSaonaPickupSuggestionAuto(hotelOrLocation: string) {
  const best = findHotelScheduleMatch(hotelOrLocation)
  if (!best) return null

  const pickupTime = best.schedule.saona.daniel || best.schedule.saona.julio
  if (!pickupTime) return null

  return {
    hotel: best.schedule.hotel,
    matchedAlias: best.alias,
    score: best.score,
    pickupTime,
    pickupLabel: best.schedule.pickupLabel,
    pickupPoint: classifyPickupPoint(best.schedule.pickupLabel),
  }
}
