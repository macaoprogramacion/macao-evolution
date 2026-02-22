export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  capacity: string;
  image: string;
  price: number;
  originalPrice?: number;
  gallery: string[];
  duration: string;
  highlights: string[];
  itinerary: {
    title: string;
    duration: string;
    description: string;
    details?: string[];
  }[];
  generalInfo: {
    minAge: string;
    notAllowed: string;
    freeCancellation: string;
    bookNowPayLater: string;
    duration: string;
    guide: string;
    pickupService: string;
  };
}

export const products: Product[] = [
  {
    id: "product-elite-couple-experience",
    slug: "elite-couple-experience",
    title: "Elite Couple Experience",
    description: "Couple",
    capacity: "2 people",
    image: "/images/productos/producto%20(3).png",
    price: 160,
    gallery: [
      "/images/productos/producto%20(3).png",
      "/images/Buggies/buggie%20(1).png",
      "/images/Buggies/buggie%20(3).png",
      "/images/paradas/columna%20(1).png",
      "/images/paradas/columna%20(2).png",
    ],
    duration: "4 hours",
    highlights: [
      "Premium buggy for couples",
      "Private guide experience",
      "All stops included",
      "Photo opportunities at every location",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck. Enjoy panoramic views of Punta Cana's vibrant streets and lush landscapes as you head to the ranch base—no stops, just great sights.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Get geared up with safety instructions and helmet fitting before your buggy adventure. Our team ensures you're confident and ready to ride.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming and savor authentic local products. Enjoy a unique experience as local artisans handcraft coffee, chocolate, cigars, and much more right before your eyes.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride your buggy to the stunning Macao Beach, known for its white sands, turquoise waters, and peaceful vibe—perfect for relaxing or snapping photos.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters and mystical cave formations.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Buggy Adventure",
        duration: "65 mins driving",
        description:
          "Drive through muddy trails, jungle paths, and open roads for an exciting 65-minute buggy experience. Every splash and turn adds to the thrill!",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro. Pickup time is typically 1-1.5 hours before the tour start time. You will be emailed the pickup location and time within 24 hours of booking. Please contact us the day before your tour if the information provided is unclear. Please wait outside the hotel 5 minutes before the pickup time, as the bus cannot park and wait.",
    },
  },
  {
    id: "product-elite-family-experience",
    slug: "elite-family-experience",
    title: "Elite Family Experience",
    description: "FROM 3 TO 4 PEOPLE",
    capacity: "3-4 people",
    image: "/images/productos/producto%20(4).png",
    price: 200,
    gallery: [
      "/images/productos/producto%20(4).png",
      "/images/Buggies/buggie%20(2).png",
      "/images/Buggies/buggie%20(4).png",
      "/images/paradas/columna%20(3).png",
      "/images/paradas/columna%20(4).png",
    ],
    duration: "4 hours",
    highlights: [
      "Spacious buggy for families",
      "Kid-friendly adventure",
      "All stops included",
      "Memorable family experience",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck. Enjoy panoramic views of Punta Cana's vibrant streets and lush landscapes as you head to the ranch base—no stops, just great sights.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Get geared up with safety instructions and helmet fitting before your buggy adventure. Our team ensures you're confident and ready to ride.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming and savor authentic local products.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride your buggy to the stunning Macao Beach, known for its white sands, turquoise waters, and peaceful vibe—perfect for relaxing or snapping photos.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters and mystical cave formations.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Buggy Adventure",
        duration: "65 mins driving",
        description:
          "Drive through muddy trails, jungle paths, and open roads for an exciting 65-minute buggy experience. Every splash and turn adds to the thrill!",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro. Pickup time is typically 1-1.5 hours before the tour start time. You will be emailed the pickup location and time within 24 hours of booking. Please contact us the day before your tour if the information provided is unclear. Please wait outside the hotel 5 minutes before the pickup time, as the bus cannot park and wait.",
    },
  },
  {
    id: "product-apex-predactor",
    slug: "apex-predactor",
    title: "APEX PREDACTOR",
    description: "COUPLE",
    capacity: "2 people",
    image: "/images/productos/producto%20(1).png",
    price: 130,
    gallery: [
      "/images/productos/producto%20(1).png",
      "/images/Buggies/buggie%20(5).png",
      "/images/Buggies/buggie%20(6).png",
      "/images/paradas/columna%20(1).png",
      "/images/paradas/columna%20(3).png",
    ],
    duration: "4 hours",
    highlights: [
      "High-performance buggy",
      "Adrenaline-packed trails",
      "All stops included",
      "Perfect for adventurous couples",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck. Enjoy panoramic views of Punta Cana's vibrant streets and lush landscapes as you head to the ranch base.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Get geared up with safety instructions and helmet fitting before your buggy adventure.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming and savor authentic local products.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride your buggy to the stunning Macao Beach for relaxing or snapping photos.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters and mystical cave formations.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Buggy Adventure",
        duration: "65 mins driving",
        description:
          "Drive through muddy trails, jungle paths, and open roads for an exciting 65-minute buggy experience.",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro. Pickup time is typically 1-1.5 hours before the tour start time.",
    },
  },
  {
    id: "product-predatory-family-experience",
    slug: "predatory-family-experience",
    title: "PREDATORY FAMILY EXPERIENCE",
    description: "FROM 3 TO 4 PEOPLE",
    capacity: "3-4 people",
    image: "/images/productos/producto%20(2).png",
    price: 145,
    gallery: [
      "/images/productos/producto%20(2).png",
      "/images/Buggies/buggie%20(7).png",
      "/images/Buggies/buggie%20(8).png",
      "/images/paradas/columna%20(2).png",
      "/images/paradas/columna%20(4).png",
    ],
    duration: "4 hours",
    highlights: [
      "Family-sized high-performance buggy",
      "Thrilling trails for the whole family",
      "All stops included",
      "Unforgettable family bonding",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Get geared up with safety instructions and helmet fitting before your buggy adventure.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming and savor authentic local products.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride your buggy to the stunning Macao Beach.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Buggy Adventure",
        duration: "65 mins driving",
        description:
          "Drive through muddy trails, jungle paths, and open roads for an exciting buggy experience.",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro.",
    },
  },
  {
    id: "product-flintstone-era",
    slug: "flintstone-era",
    title: "FLINTSTONE ERA",
    description: "COUPLE",
    capacity: "2 people",
    image: "/images/productos/producto%20(5).png",
    price: 85,
    originalPrice: 100,
    gallery: [
      "/images/productos/producto%20(5).png",
      "/images/Buggies/buggie%20(9).png",
      "/images/Buggies/buggie%20(10).png",
      "/images/paradas/columna%20(1).png",
      "/images/paradas/columna%20(3).png",
    ],
    duration: "4 hours",
    highlights: [
      "Classic buggy experience",
      "Great value for couples",
      "All stops included",
      "Fun and accessible adventure",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Safety instructions and helmet fitting before your buggy adventure.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride your buggy to the stunning Macao Beach.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Buggy Adventure",
        duration: "65 mins driving",
        description:
          "Drive through muddy trails, jungle paths, and open roads.",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro.",
    },
  },
  {
    id: "product-the-flintstones-family",
    slug: "the-flintstones-family",
    title: "THE FLINTSTONES FAMILY",
    description: "From 3 to 4 people",
    capacity: "3-4 people",
    image: "/images/productos/producto%20(6).png",
    price: 100,
    originalPrice: 125,
    gallery: [
      "/images/productos/producto%20(6).png",
      "/images/Buggies/buggie%20(1).png",
      "/images/Buggies/buggie%20(5).png",
      "/images/paradas/columna%20(2).png",
      "/images/paradas/columna%20(4).png",
    ],
    duration: "4 hours",
    highlights: [
      "Family-sized classic buggy",
      "Great value for families",
      "All stops included",
      "Kid-friendly fun",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Safety instructions and helmet fitting before your buggy adventure.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride your buggy to the stunning Macao Beach.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Buggy Adventure",
        duration: "65 mins driving",
        description:
          "Drive through muddy trails, jungle paths, and open roads.",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro.",
    },
  },
  {
    id: "product-atv-quad-experience",
    slug: "atv-quad-experience",
    title: "ATV QUAD EXPERIENCE",
    description: "SINGLE",
    capacity: "1 person",
    image: "/images/productos/producto%20(7).png",
    price: 90,
    originalPrice: 110,
    gallery: [
      "/images/productos/producto%20(7).png",
      "/images/Buggies/buggie%20(3).png",
      "/images/Buggies/buggie%20(6).png",
      "/images/paradas/columna%20(1).png",
      "/images/paradas/columna%20(2).png",
    ],
    duration: "4 hours",
    highlights: [
      "Solo ATV quad adventure",
      "Full control of your ride",
      "All stops included",
      "Ultimate solo experience",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Safety instructions and helmet fitting before your adventure.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride to the stunning Macao Beach.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "ATV Quad Adventure",
        duration: "65 mins driving",
        description:
          "Ride through muddy trails, jungle paths, and open roads on your ATV quad.",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro.",
    },
  },
  {
    id: "product-the-combined",
    slug: "the-combined",
    title: "THE COMBINED",
    description: "SINGLE",
    capacity: "1 person",
    image: "/images/productos/producto%20(8).png",
    price: 110,
    originalPrice: 130,
    gallery: [
      "/images/productos/producto%20(8).png",
      "/images/Buggies/buggie%20(4).png",
      "/images/Buggies/buggie%20(7).png",
      "/images/paradas/columna%20(3).png",
      "/images/paradas/columna%20(4).png",
    ],
    duration: "4 hours",
    highlights: [
      "Buggy + ATV combo experience",
      "Best of both worlds",
      "All stops included",
      "Maximum adrenaline",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Safety instructions and helmet fitting before your adventure.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride to the stunning Macao Beach.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Combined Buggy & ATV Adventure",
        duration: "65 mins driving",
        description:
          "Experience both buggy and ATV through muddy trails, jungle paths, and open roads.",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro.",
    },
  },
  {
    id: "product-full-ride-experience",
    slug: "full-ride-experience",
    title: "FULL RIDE EXPERIENCE",
    description: "SINGLE",
    capacity: "1 person",
    image: "/images/productos/producto%20(9).png",
    price: 60,
    originalPrice: 75,
    gallery: [
      "/images/productos/producto%20(9).png",
      "/images/Buggies/buggie%20(8).png",
      "/images/Buggies/buggie%20(2).png",
      "/images/paradas/columna%20(1).png",
      "/images/paradas/columna%20(4).png",
    ],
    duration: "4 hours",
    highlights: [
      "Complete horseback riding experience",
      "Scenic trails through nature",
      "All stops included",
      "Accessible for beginners",
    ],
    itinerary: [
      {
        title: "Pick-Up & City Tour",
        duration: "1.5 hrs",
        description:
          "Begin your adventure with a scenic city tour in an open-air Safari truck.",
      },
      {
        title: "Ranch Base Briefing",
        duration: "30 mins",
        description:
          "Safety instructions and equipment fitting before your ride.",
      },
      {
        title: "Typical Dominican House Visit",
        duration: "20 mins",
        description:
          "Experience authentic local culture in a peaceful rural setting.",
        details: [
          "Coffee, Cocoa & Tobacco — Explore the roots of traditional farming.",
        ],
      },
      {
        title: "Macao Beach Stop",
        duration: "20 mins",
        description:
          "Ride to the stunning Macao Beach.",
      },
      {
        title: "Cueva Taína — Cenote Cave",
        duration: "20 mins",
        description:
          "Explore a jungle cenote with crystal-clear waters.",
        details: ["Swim in the refreshing natural pool."],
      },
      {
        title: "Full Ride Adventure",
        duration: "65 mins",
        description:
          "Enjoy the complete riding experience through scenic trails and countryside paths.",
      },
    ],
    generalInfo: {
      minAge: "Children must be 4 years old or above to participate, and drivers must be 18 years old or older.",
      notAllowed:
        "Pregnant women, individuals with heart conditions, mobility impairments, or under the influence of alcohol or drugs are not permitted to participate in the tour.",
      freeCancellation:
        "Cancel up to 24 hours in advance and receive a full refund.",
      bookNowPayLater:
        "Reserve your spot immediately with just $20 USD and pay the rest amount when you get to our base.",
      duration: "4 hours",
      guide: "English, French, Portuguese, Spanish, Italian, German, Russian",
      pickupService:
        "Pickup is available from hotels in Punta Cana, Bávaro, Uvero Alto, and Cabeza de Toro.",
    },
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
