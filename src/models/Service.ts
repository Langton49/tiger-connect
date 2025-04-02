
export interface Service {
  id: string;
  title: string;
  description: string;
  rate: number;
  rateType: "hourly" | "fixed";
  category: string;
  providerId: string;
  rating: number;
  reviewCount: number;
  availability: string[];
}

export const serviceCategories = [
  "Tutoring",
  "Photography",
  "Graphic Design",
  "Web Development",
  "Cleaning",
  "Moving Help",
  "Beauty",
  "Fitness",
  "Other"
];

export const mockServices: Service[] = [
  {
    id: "1",
    title: "Math & Science Tutoring",
    description: "Expert tutoring in Calculus, Physics, and Chemistry. Can help with homework, test prep, and understanding difficult concepts.",
    rate: 20,
    rateType: "hourly",
    category: "Tutoring",
    providerId: "1",
    rating: 4.9,
    reviewCount: 24,
    availability: ["Mon 3-7PM", "Wed 4-8PM", "Sat 10AM-4PM"]
  },
  {
    id: "2",
    title: "Graduation Photography",
    description: "Professional graduation photos on campus with Grambling landmarks. Digital and print options available.",
    rate: 150,
    rateType: "fixed",
    category: "Photography",
    providerId: "2",
    rating: 4.8,
    reviewCount: 16,
    availability: ["Weekends", "By appointment"]
  },
  {
    id: "3",
    title: "Dorm/Apartment Cleaning",
    description: "Complete cleaning service for your living space. Includes dusting, vacuuming, bathroom cleaning, and kitchen cleaning.",
    rate: 25,
    rateType: "hourly",
    category: "Cleaning",
    providerId: "3",
    rating: 4.7,
    reviewCount: 12,
    availability: ["Fri 2-6PM", "Sat-Sun All Day"]
  }
];
