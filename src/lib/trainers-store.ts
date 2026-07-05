import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  contract: { startDate: string; endDate: string };
  leave: { entitlement: number; taken: number; currentLeave?: { from: string; to: string } };
  availability: Availability;
  dateAvailability?: Record<string, string>;
  notes: string;
}

export interface TrainerVersion {
  id: string;
  trainer_id: string;
  snapshot_date: string;
  data: Trainer;
  updated_at: string;
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
    contract: { startDate: addDays(-540), endDate: addDays(45) },
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

// ---------------- Shared reactive cache ----------------

type Listener = (list: Trainer[]) => void;
let cache: Trainer[] = [];
let loaded = false;
let seeding = false;
const listeners = new Set<Listener>();
let realtimeInitialized = false;

function notify() {
  for (const l of listeners) l(cache);
}

function sortTrainers(list: Trainer[]) {
  return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

async function fetchAll() {
  const { data, error } = await supabase
    .from("trainers")
    .select("id, data")
    .order("id");
  if (error) {
    console.error("Failed to load trainers", error);
    return;
  }
  cache = sortTrainers((data ?? []).map((r: any) => ({ ...(r.data as Trainer), id: r.id })));
  if (cache.length === 0 && !seeding) {
    seeding = true;
    await supabase.from("trainers").insert(
      SEED.map((t) => ({ id: t.id, data: t as any }))
    );
    seeding = false;
    const res = await supabase.from("trainers").select("id, data").order("id");
    cache = sortTrainers((res.data ?? []).map((r: any) => ({ ...(r.data as Trainer), id: r.id })));
  }
  loaded = true;
  notify();
}

function initRealtime() {
  if (realtimeInitialized) return;
  realtimeInitialized = true;
  supabase
    .channel("trainers-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "trainers" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as any)?.id;
        cache = cache.filter((t) => t.id !== id);
      } else {
        const row = payload.new as any;
        const t: Trainer = { ...(row.data as Trainer), id: row.id };
        const idx = cache.findIndex((x) => x.id === t.id);
        if (idx >= 0) cache[idx] = t;
        else cache = sortTrainers([...cache, t]);
      }
      notify();
    })
    .subscribe();
}

export function useTrainers() {
  const [list, setList] = useState<Trainer[]>(cache);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    const cb = (l: Trainer[]) => {
      setList([...l]);
      setReady(true);
    };
    listeners.add(cb);
    initRealtime();
    if (!loaded) fetchAll();
    else cb(cache);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return { trainers: list, ready };
}

export function useTrainer(id: string) {
  const { trainers, ready } = useTrainers();
  return { trainer: trainers.find((t) => t.id === id), ready };
}

// ---------------- Mutations ----------------

export async function updateTrainer(id: string, patch: Partial<Trainer>) {
  const current = cache.find((t) => t.id === id);
  if (!current) return;
  const updated: Trainer = { ...current, ...patch };
  // Optimistic update
  cache = cache.map((t) => (t.id === id ? updated : t));
  notify();
  const { error } = await supabase
    .from("trainers")
    .update({ data: updated as any })
    .eq("id", id);
  if (error) console.error("updateTrainer failed", error);
}

export async function replaceTrainer(id: string, next: Trainer) {
  cache = cache.map((t) => (t.id === id ? next : t));
  notify();
  const { error } = await supabase
    .from("trainers")
    .update({ data: next as any })
    .eq("id", id);
  if (error) console.error("replaceTrainer failed", error);
}

export async function deleteTrainer(id: string) {
  cache = cache.filter((t) => t.id !== id);
  notify();
  const { error } = await supabase.from("trainers").delete().eq("id", id);
  if (error) console.error("deleteTrainer failed", error);
}

export type NewTrainerInput = {
  fullName: string;
  position: string;
  email: string;
  phone?: string;
  address?: string;
  qualification?: string;
  university?: string;
  major?: string;
  englishTest?: string;
  cefr?: string;
  englishScore?: number;
  testDate?: string;
  contractStart: string;
  contractEnd: string;
  leaveEntitlement?: number;
  status?: Trainer["status"];
  photo?: string;
};

export async function addTrainer(input: NewTrainerInput): Promise<Trainer> {
  const id = `t-${Date.now().toString(36)}`;
  const trainer: Trainer = {
    id,
    photo: input.photo || `https://i.pravatar.cc/150?u=${encodeURIComponent(input.email || id)}`,
    fullName: input.fullName,
    position: input.position,
    email: input.email,
    phone: input.phone || "",
    address: input.address || "",
    status: input.status || "Active",
    academic: {
      qualification: input.qualification || "",
      university: input.university || "",
      major: input.major || "",
    },
    english: {
      test: input.englishTest || "",
      cefr: input.cefr || "B2",
      score: input.englishScore ?? 0,
      testDate: input.testDate || new Date().toISOString().slice(0, 10),
    },
    performance: { date: new Date().toISOString().slice(0, 10), score: 0, comments: "" },
    contract: { startDate: input.contractStart, endDate: input.contractEnd },
    leave: { entitlement: input.leaveEntitlement ?? 20, taken: 0 },
    availability: emptyAvail(),
    notes: "",
  };
  cache = sortTrainers([...cache, trainer]);
  notify();
  const { error } = await supabase.from("trainers").insert({ id: trainer.id, data: trainer as any });
  if (error) console.error("addTrainer failed", error);
  return trainer;
}

// ---------------- History ----------------

export async function loadHistory(trainerId: string): Promise<TrainerVersion[]> {
  const { data, error } = await supabase
    .from("trainer_versions")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("snapshot_date", { ascending: false });
  if (error) {
    console.error("loadHistory failed", error);
    return [];
  }
  return (data ?? []) as unknown as TrainerVersion[];
}

export async function restoreVersion(trainerId: string, version: TrainerVersion) {
  // The snapshot's data represents that day's final state.
  // Ensure the ID matches, then overwrite the trainer.
  const restored: Trainer = { ...(version.data as Trainer), id: trainerId };
  await replaceTrainer(trainerId, restored);
}

// ---------------- Helpers ----------------

export function daysUntil(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export function isAvailableForAssignment(t: Trainer): boolean {
  if (t.status !== "Active") return false;
  return DAYS.some((d) => SLOTS.some((s) => t.availability[d][s] === "Available"));
}

// Resize + compress an image File into a small JPEG data URL suitable for DB storage.
export async function fileToPhotoDataUrl(file: File, max = 400, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
