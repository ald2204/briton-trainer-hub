import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addTrainer, useTrainers, daysUntil, isAvailableForAssignment, type Trainer } from "@/lib/trainers-store";
import { useAuth } from "@/lib/auth";
import { Plus, Search, Download } from "lucide-react";
import { exportTrainersToExcel } from "@/lib/export-trainers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/trainers/")({
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
  const { trainers } = useTrainers();
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [cefr, setCefr] = useState("All");
  const [avail, setAvail] = useState("All");
  const [exp, setExp] = useState("all");

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
        {isAdmin && <AddTrainerDialog />}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function AddTrainerDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    position: "Trainer",
    email: "",
    phone: "",
    address: "",
    qualification: "",
    university: "",
    major: "",
    englishTest: "IELTS",
    cefr: "C1",
    englishScore: "",
    testDate: "",
    contractStart: new Date().toISOString().slice(0, 10),
    contractEnd: "",
    leaveEntitlement: "20",
    status: "Active" as Trainer["status"],
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.contractEnd) return;
    setSubmitting(true);
    const t = await addTrainer({
      fullName: form.fullName.trim(),
      position: form.position.trim(),
      email: form.email.trim(),
      phone: form.phone,
      address: form.address,
      qualification: form.qualification,
      university: form.university,
      major: form.major,
      englishTest: form.englishTest,
      cefr: form.cefr,
      englishScore: form.englishScore ? Number(form.englishScore) : 0,
      testDate: form.testDate || undefined,
      contractStart: form.contractStart,
      contractEnd: form.contractEnd,
      leaveEntitlement: form.leaveEntitlement ? Number(form.leaveEntitlement) : 20,
      status: form.status,
    });
    setSubmitting(false);
    setOpen(false);
    navigate({ to: "/trainers/$id", params: { id: t.id } });
  };

  const inputCls = "w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Add Trainer</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Trainer</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <section className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name *"><Input required value={form.fullName} onChange={set("fullName")} /></Field>
            <Field label="Position"><Input value={form.position} onChange={set("position")} /></Field>
            <Field label="Email *"><Input type="email" required value={form.email} onChange={set("email")} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set("phone")} /></Field>
            <Field label="Address"><Input value={form.address} onChange={set("address")} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option>Active</option><option>On Leave</option><option>Inactive</option>
              </select>
            </Field>
          </section>

          <section className="grid sm:grid-cols-3 gap-4">
            <Field label="Qualification"><Input value={form.qualification} onChange={set("qualification")} /></Field>
            <Field label="University"><Input value={form.university} onChange={set("university")} /></Field>
            <Field label="Major"><Input value={form.major} onChange={set("major")} /></Field>
          </section>

          <section className="grid sm:grid-cols-4 gap-4">
            <Field label="English Test"><Input value={form.englishTest} onChange={set("englishTest")} /></Field>
            <Field label="CEFR">
              <select value={form.cefr} onChange={set("cefr")} className={inputCls}>
                {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Score"><Input type="number" step="0.1" value={form.englishScore} onChange={set("englishScore")} /></Field>
            <Field label="Test Date"><Input type="date" value={form.testDate} onChange={set("testDate")} /></Field>
          </section>

          <section className="grid sm:grid-cols-3 gap-4">
            <Field label="Contract Start *"><Input type="date" required value={form.contractStart} onChange={set("contractStart")} /></Field>
            <Field label="Contract End *"><Input type="date" required value={form.contractEnd} onChange={set("contractEnd")} /></Field>
            <Field label="Annual Leave (days)"><Input type="number" value={form.leaveEntitlement} onChange={set("leaveEntitlement")} /></Field>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Trainer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
