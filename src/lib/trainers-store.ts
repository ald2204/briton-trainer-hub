export type SlotStatus = "Available" | "Teaching" | "Leave" | "Unavailable";
export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SLOTS = ["morning", "afternoon", "evening"] as const;
export type SlotKey = typeof SLOTS[number];

export type Availability = Record<DayKey, Record<SlotKey, SlotStatus>>;

export interface Trainer {
  id: string;
  photo: string;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  status: "Active" | "On Leave" | "Inactive";
  academic: { qualification: string; university: string; major: string };
  english: { test: string; cefr: string; score: number; testDate: string };
  performance: { date: string; score: number; comments: string };
  contract: { startDate: string; endDate: string; fileName?: string };
  leave: { entitlement: number; taken: number; currentLeave?: { from: string; to: string } };
  availability: Availability;
  notes: string;
}

const emptyAvail = (pattern: Partial<Record<DayKey, Partial<Record<SlotKey, SlotStatus>>>> = {}): Availability => {
  const a = {} as Availability;
  for (const d of DAYS) {
    a[d] = { morning: "Unavailable", afternoon: "Unavailable", evening: "Unavailable" };
    if (pattern[d]) Object.assign(a[d], pattern[d]);
  }
  return a;
};

const today = new Date();
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const weekdayTeach: Availability = emptyAvail({
  Mon: { morning: "Available", afternoon: "Teaching", evening: "Available" },
  Tue: { morning: "Available", afternoon: "Teaching", evening: "Teaching" },
  Wed: { morning: "Teaching", afternoon: "Available", evening: "Available" },
  Thu: { morning: "Available", afternoon: "Teaching", evening: "Teaching" },
  Fri: { morning: "Available", afternoon: "Available", evening: "Teaching" },
  Sat: { morning: "Available", afternoon: "Available", evening: "Unavailable" },
});

const SEED: Trainer[] = [
  {
    id: "t-001",
    photo: "https://i.pravatar.cc/150?img=12",
    fullName: "Sarah Mitchell",
    position: "Senior Trainer",
    email: "sarah.mitchell@briton.edu",
    phone: "+44 7700 900123",
    address: "12 King St, Manchester, UK",
    status: "Active",
    academic: { qualification: "MA TESOL", university: "University of Manchester", major: "Applied Linguistics" },
    english: { test: "IELTS", cefr: "C2", score: 8.5, testDate: addDays(-180) },
    performance: { date: addDays(-30), score: 4.7, comments: "Excellent classroom presence; mentors new trainers effectively." },
    contract: { startDate: addDays(-540), endDate: addDays(45), fileName: "sarah-contract.pdf" },
    leave: { entitlement: 20, taken: 6 },
    availability: weekdayTeach,
    notes: "Strong fit for IELTS prep classes.",
  },
  {
    id: "t-002",
    photo: "https://i.pravatar.cc/150?img=32",
    fullName: "David Chen",
    position: "Trainer",
    email: "david.chen@briton.edu",
    phone: "+44 7700 900456",
    address: "5 Queen Rd, London, UK",
    status: "Active",
    academic: { qualification: "BA English", university: "King's College London", major: "English Literature" },
    english: { test: "TOEFL", cefr: "C1", score: 110, testDate: addDays(-90) },
    performance: { date: addDays(-60), score: 4.2, comments: "Reliable; engaging with intermediate learners." },
    contract: { startDate: addDays(-300), endDate: addDays(200) },
    leave: { entitlement: 18, taken: 4 },
    availability: emptyAvail({
      Mon: { morning: "Teaching", afternoon: "Available", evening: "Teaching" },
      Tue: { morning: "Available", afternoon: "Teaching", evening: "Available" },
      Wed: { morning: "Teaching", afternoon: "Teaching", evening: "Available" },
      Thu: { morning: "Available", afternoon: "Available", evening: "Teaching" },
      Fri: { morning: "Teaching", afternoon: "Available", evening: "Available" },
    }),
    notes: "",
  },
  {
    id: "t-003",
    photo: "https://i.pravatar.cc/150?img=48",
    fullName: "Aisha Rahman",
    position: "Lead Trainer",
    email: "aisha.rahman@briton.edu",
    phone: "+44 7700 900789",
    address: "22 Park Ln, Birmingham, UK",
    status: "On Leave",
    academic: { qualification: "MA Education", university: "University of Birmingham", major: "TESOL" },
    english: { test: "CELTA", cefr: "C2", score: 9, testDate: addDays(-365) },
    performance: { date: addDays(-15), score: 4.9, comments: "Outstanding leadership; runs trainer workshops." },
    contract: { startDate: addDays(-900), endDate: addDays(80) },
    leave: { entitlement: 22, taken: 12, currentLeave: { from: addDays(-3), to: addDays(7) } },
    availability: emptyAvail({
      Mon: { morning: "Leave", afternoon: "Leave", evening: "Leave" },
      Tue: { morning: "Leave", afternoon: "Leave", evening: "Leave" },
      Wed: { morning: "Leave", afternoon: "Leave", evening: "Leave" },
      Thu: { morning: "Leave", afternoon: "Leave", evening: "Leave" },
      Fri: { morning: "Leave", afternoon: "Leave", evening: "Leave" },
    }),
    notes: "Returning next week; ease back with morning slots.",
  },
  {
    id: "t-004",
    photo: "https://i.pravatar.cc/150?img=15",
    fullName: "James O'Connor",
    position: "Trainer",
    email: "james.oconnor@briton.edu",
    phone: "+44 7700 901001",
    address: "8 Hill Rd, Dublin, IE",
    status: "Active",
    academic: { qualification: "BA Linguistics", university: "Trinity College Dublin", major: "Linguistics" },
    english: { test: "IELTS", cefr: "C1", score: 7.5, testDate: addDays(-200) },
    performance: { date: addDays(-90), score: 3.9, comments: "Solid; could vary pacing more." },
    contract: { startDate: addDays(-200), endDate: addDays(60) },
    leave: { entitlement: 18, taken: 2 },
    availability: emptyAvail({
      Mon: { morning: "Available", afternoon: "Available", evening: "Available" },
      Tue: { morning: "Available", afternoon: "Available", evening: "Available" },
      Wed: { morning: "Available", afternoon: "Available", evening: "Unavailable" },
      Thu: { morning: "Available", afternoon: "Available", evening: "Available" },
      Fri: { morning: "Available", afternoon: "Available", evening: "Available" },
      Sat: { morning: "Available", afternoon: "Unavailable", evening: "Unavailable" },
    }),
    notes: "Open to extra hours.",
  },
  {
    id: "t-005",
    photo: "https://i.pravatar.cc/150?img=20",
    fullName: "Maria Lopez",
    position: "Trainer",
    email: "maria.lopez@briton.edu",
    phone: "+44 7700 902002",
    address: "30 River St, Liverpool, UK",
    status: "Active",
    academic: { qualification: "MA Applied Linguistics", university: "University of Leeds", major: "Applied Linguistics" },
    english: { test: "CPE", cefr: "C2", score: 220, testDate: addDays(-400) },
    performance: { date: addDays(-45), score: 4.5, comments: "Excellent rapport with young learners." },
    contract: { startDate: addDays(-700), endDate: addDays(300) },
    leave: { entitlement: 20, taken: 10 },
    availability: weekdayTeach,
    notes: "",
  },
  {
    id: "t-006",
    photo: "https://i.pravatar.cc/150?img=5",
    fullName: "Tom Williams",
    position: "Junior Trainer",
    email: "tom.williams@briton.edu",
    phone: "+44 7700 903003",
    address: "1 Bridge Ave, Leeds, UK",
    status: "Active",
    academic: { qualification: "BA English", university: "University of Leeds", major: "English" },
    english: { test: "IELTS", cefr: "B2", score: 6.5, testDate: addDays(-120) },
    performance: { date: addDays(-20), score: 3.6, comments: "New starter, progressing well." },
    contract: { startDate: addDays(-60), endDate: addDays(700) },
    leave: { entitlement: 16, taken: 1 },
    availability: emptyAvail({
      Mon: { morning: "Available", afternoon: "Available", evening: "Teaching" },
      Tue: { morning: "Unavailable", afternoon: "Available", evening: "Teaching" },
      Wed: { morning: "Available", afternoon: "Available", evening: "Teaching" },
      Thu: { morning: "Unavailable", afternoon: "Available", evening: "Teaching" },
      Fri: { morning: "Available", afternoon: "Available", evening: "Available" },
    }),
    notes: "Studying part-time on Tue/Thu mornings.",
  },
];

const KEY = "sbi-trainers-v1";

const isBrowser = () => typeof window !== "undefined";

export function loadTrainers(): Trainer[] {
  if (!isBrowser()) return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Trainer[];
  } catch {
    return SEED;
  }
}

export function saveTrainers(list: Trainer[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function updateTrainer(id: string, patch: Partial<Trainer>): Trainer[] {
  const list = loadTrainers().map((t) => (t.id === id ? { ...t, ...patch } : t));
  saveTrainers(list);
  return list;
}

export function getTrainer(id: string): Trainer | undefined {
  return loadTrainers().find((t) => t.id === id);
}

export function daysUntil(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export function isAvailableForAssignment(t: Trainer): boolean {
  if (t.status !== "Active") return false;
  return DAYS.some((d) => SLOTS.some((s) => t.availability[d][s] === "Available"));
}
