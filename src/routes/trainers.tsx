import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadTrainers, daysUntil, isAvailableForAssignment, type Trainer } from "@/lib/trainers-store";
import { Search } from "lucide-react";

export const Route = createFileRoute("/trainers")({
  head: () => ({
    meta: [
      { title: "Trainers — SBI Trainer Manager" },
      { name: "description", content: "Search and browse all SBI trainers." },
    ],
  }),
  component: TrainersPage,
});

const CEFR_LEVELS = ["All", "B2", "C1", "C2"];
const AVAIL = ["All", "Available", "Not available"];
const EXPIRY = [
  { v: "all", label: "All contracts" },
  { v: "90", label: "Expiring ≤ 90 days" },
  { v: "30", label: "Expiring ≤ 30 days" },
];

function StatusBadge({ status }: { status: Trainer["status"] }) {
  const cls =
    status === "Active"
      ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
      : status === "On Leave"
      ? "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]"
      : "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [q, setQ] = useState("");
  const [cefr, setCefr] = useState("All");
  const [avail, setAvail] = useState("All");
  const [exp, setExp] = useState("all");

  useEffect(() => {
    setTrainers(loadTrainers());
  }, []);

  const filtered = useMemo(() => {
    return trainers.filter((t) => {
      if (q && !t.fullName.toLowerCase().includes(q.toLowerCase()) && !t.position.toLowerCase().includes(q.toLowerCase())) return false;
      if (cefr !== "All" && t.english.cefr !== cefr) return false;
      if (avail === "Available" && !isAvailableForAssignment(t)) return false;
      if (avail === "Not available" && isAvailableForAssignment(t)) return false;
      if (exp !== "all") {
        const d = daysUntil(t.contract.endDate);
        const limit = parseInt(exp, 10);
        if (!(d >= 0 && d <= limit)) return false;
      }
      return true;
    });
  }, [trainers, q, cefr, avail, exp]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trainers</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {trainers.length} shown</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or position"
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={cefr} onChange={(e) => setCefr(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
          {CEFR_LEVELS.map((c) => <option key={c} value={c}>English level: {c}</option>)}
        </select>
        <select value={avail} onChange={(e) => setAvail(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
          {AVAIL.map((c) => <option key={c} value={c}>Availability: {c}</option>)}
        </select>
        <select value={exp} onChange={(e) => setExp(e.target.value)} className="px-3 py-2 rounded-md border bg-background text-sm">
          {EXPIRY.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Trainer</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">English</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Contract End</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => {
                const d = daysUntil(t.contract.endDate);
                const expiringSoon = d >= 0 && d <= 90;
                return (
                  <tr key={t.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link to="/trainers/$id" params={{ id: t.id }} className="flex items-center gap-3 group">
                        <img src={t.photo} alt={t.fullName} className="h-9 w-9 rounded-full object-cover" />
                        <span className="font-medium group-hover:text-primary">{t.fullName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.position}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                        {t.english.cefr}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.performance.score.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <div>{t.contract.endDate}</div>
                      <div className={`text-xs ${expiringSoon ? "text-destructive" : "text-muted-foreground"}`}>
                        {d >= 0 ? `${d} days left` : `expired ${Math.abs(d)}d ago`}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No trainers match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
