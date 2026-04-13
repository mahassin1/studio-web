export type Service = {
  description: any;
  id: string;
  name: string;
  duration: number;
  price: number;
};

export type AvailabilitySlot = {
  date: string;
  times: string[];
};

export type Provider = {
  id: string;
  name: string;
  handle: string;
  category: "Makeup Artist" | "Nail Tech" | "Hair Stylist";
  city: string;
  state: string;
  bio: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  image: string;
  services: Service[];
  availability: AvailabilitySlot[];
};

export const providers: Provider[] = [
  {
    id: "1",
    name: "Glam by Amira",
    handle: "glam-by-amira",
    category: "Makeup Artist",
    city: "San Diego",
    state: "CA",
    bio: "Soft glam, bridal glam, and event makeup for clients who want a polished and elevated look.",
    rating: 4.9,
    reviewCount: 128,
    startingPrice: 95,
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
    services: [
      {
        id: "s1", name: "Soft Glam", duration: 60, price: 95,
        description: undefined
      },
      {
        id: "s2", name: "Full Glam", duration: 90, price: 130,
        description: undefined
      },
      {
        id: "s3", name: "Bridal Makeup", duration: 120, price: 180,
        description: undefined
      },
    ],
    availability: [
      { date: "2026-03-27", times: ["9:00 AM", "11:00 AM", "2:00 PM"] },
      { date: "2026-03-28", times: ["10:00 AM", "1:00 PM", "4:00 PM"] },
      { date: "2026-03-29", times: ["12:00 PM", "3:00 PM"] },
    ],
  },
  {
    id: "2",
    name: "Polished Studio",
    handle: "polished-studio",
    category: "Nail Tech",
    city: "San Diego",
    state: "CA",
    bio: "Clean, modern nail sets including gel manicures, acrylics, and custom nail art.",
    rating: 4.8,
    reviewCount: 94,
    startingPrice: 55,
    image:
      "https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1200&auto=format&fit=crop",
    services: [
      {
        id: "s4", name: "Gel Manicure", duration: 60, price: 55,
        description: undefined
      },
      {
        id: "s5", name: "Acrylic Full Set", duration: 90, price: 80,
        description: undefined
      },
      {
        id: "s6", name: "Nail Art Add-On", duration: 30, price: 20,
        description: undefined
      },
    ],
    availability: [
      { date: "2026-03-27", times: ["10:00 AM", "1:30 PM", "5:00 PM"] },
      { date: "2026-03-28", times: ["9:30 AM", "12:00 PM", "3:30 PM"] },
    ],
  },
  {
    id: "3",
    name: "Silk Press by Naomi",
    handle: "silk-press-by-naomi",
    category: "Hair Stylist",
    city: "San Diego",
    state: "CA",
    bio: "Healthy hair styling focused on silk presses, blowouts, trims, and special occasion styling.",
    rating: 4.9,
    reviewCount: 76,
    startingPrice: 85,
    image:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=1200&auto=format&fit=crop",
    services: [
      {
        id: "s7", name: "Silk Press", duration: 120, price: 95,
        description: undefined
      },
      {
        id: "s8", name: "Wash + Blowout", duration: 75, price: 70,
        description: undefined
      },
      {
        id: "s9", name: "Trim Add-On", duration: 20, price: 20,
        description: undefined
      },
    ],
    availability: [
      { date: "2026-03-27", times: ["8:00 AM", "12:30 PM"] },
      { date: "2026-03-29", times: ["9:00 AM", "11:30 AM", "2:30 PM"] },
    ],
  },
];

export function getProviderByHandle(handle: string) {
  return providers.find((provider) => provider.handle === handle);
}