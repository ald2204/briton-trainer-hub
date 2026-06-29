import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getTrainer,
  updateTrainer,
  daysUntil,
  DAYS,
  SLOTS,
  type Trainer,
  type SlotStatus,
  type DayKey,
  type SlotKey,
} from "@/lib/trainers-store";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Languages,
  Star,
  FileText,
  Upload,
  Calendar,
  StickyNote,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/trainers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Trainer ${params.id} — SBI Trainer Manager` },
    ],
  }),
  component: ProfilePage,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <h1 className="text-xl font-semibold">Trainer not found</h1>
      <Link to="/trainers" className="text-primary text-sm mt-3 inline-block">Back to trainers</Link>
    </div>
  ),
});

const SLOT_TONE: Record<SlotStatus, string> = {
  Available: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30",
  Teaching: "bg-primary-soft text-primary border-primary/30",
  Leave: "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)] border-[color:var(--warning)]/40",
  Unavailable: "bg-muted text-muted-foreground border-border",
};
const STATUSES: SlotStatus[] = ["Available", "Teaching", "Leave", "Unavailable"];

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="bg-card border rounded-xl">
      <header className="flex items-center gap-2 px-5 py-3 border-b">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm mt-1 font-medium">{value || "—"}</div>
    </div>
  );
}

function ProfilePage() {
  const { id } = Route.useParams();
  const [trainer, setTrainer] = useState<Trainer | undefined>();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const t = getTrainer(id);
    if (!t) throw notFound();
    setTrainer(t);
    setNotes(t.notes);
  }, [id]);

  if (!trainer) return null;

  const remaining = trainer.leave.entitlement - trainer.leave.taken;
  const daysLeft = daysUntil(trainer.contract.endDate);
  const expiringSoon = daysLeft >= 0 && daysLeft <= 90;

  const cycleSlot = (day: DayKey, slot: SlotKey) => {
    const current = trainer.availability[day][slot];
    const next = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length];
    const updated: Trainer = {
      ...trainer,
      availability: {
        ...trainer.availability,
        [day]: { ...trainer.availability[day], [slot]: next },
      },
    };
    setTrainer(updated);
    updateTrainer(trainer.id, { availability: updated.availability });
  };

  const saveNotes = () => {
    updateTrainer(trainer.id, { notes });
    setTrainer({ ...trainer, notes });
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = { ...trainer, contract: { ...trainer.contract, fileName: file.name } };
    setTrainer(updated);
    updateTrainer(trainer.id, { contract: updated.contract });
  };

  return (
    <div className="space-y-6">
      <Link to="/trainers" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to trainers
      </Link>

      {(expiringSoon || trainer.status === "On Leave") && (
        <div className="rounded-lg border border-warning/40 bg-[color:var(--warning)]/10 p-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-[color:var(--warning-foreground)]" />
          <div className="space-y-1">
            {expiringSoon && <div>Contract ends in <strong>{daysLeft} days</strong> ({trainer.contract.endDate}).</div>}
            {trainer.status === "On Leave" && trainer.leave.currentLeave && (
              <div>Currently on leave from <strong>{trainer.leave.currentLeave.from}</strong> to <strong>{trainer.leave.currentLeave.to}</strong>.</div>
            )}
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <img src={trainer.photo} alt={trainer.fullName} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{trainer.fullName}</h1>
          <div className="text-sm text-muted-foreground">{trainer.position}</div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-primary-soft text-primary">
              {trainer.english.cefr} · {trainer.english.test}
            </span>
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              trainer.status === "Active" ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" :
              trainer.status === "On Leave" ? "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]" :
              "bg-muted text-muted-foreground"
            }`}>{trainer.status}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Personal Information" icon={Mail}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" value={trainer.fullName} />
            <Field label="Email" value={<a className="text-primary hover:underline" href={`mailto:${trainer.email}`}>{trainer.email}</a>} />
            <Field label="Phone" value={<a className="text-primary hover:underline" href={`tel:${trainer.phone}`}><Phone className="h-3 w-3 inline mr-1" />{trainer.phone}</a>} />
            <Field label="Address" value={<span><MapPin className="h-3 w-3 inline mr-1" />{trainer.address}</span>} />
          </div>
        </Section>

        <Section title="Academic Background" icon={GraduationCap}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Highest Qualification" value={trainer.academic.qualification} />
            <Field label="University" value={trainer.academic.university} />
            <Field label="Major" value={trainer.academic.major} />
          </div>
        </Section>

        <Section title="English Profile" icon={Languages}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latest Test" value={trainer.english.test} />
            <Field label="CEFR Level" value={trainer.english.cefr} />
            <Field label="Overall Score" value={trainer.english.score} />
            <Field label="Test Date" value={trainer.english.testDate} />
          </div>
        </Section>

        <Section title="Performance (latest)" icon={Star}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Appraisal Date" value={trainer.performance.date} />
            <Field label="Overall Score" value={`${trainer.performance.score.toFixed(1)} / 5`} />
          </div>
          <div className="mt-4">
            <Field label="Comments" value={<p className="text-sm font-normal text-foreground/80">{trainer.performance.comments}</p>} />
          </div>
        </Section>

        <Section title="Contract" icon={FileText}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Date" value={trainer.contract.startDate} />
            <Field label="End Date" value={
              <span>
                {trainer.contract.endDate}
                <span className={`ml-2 text-xs ${expiringSoon ? "text-destructive" : "text-muted-foreground"}`}>
                  ({daysLeft} days)
                </span>
              </span>
            } />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border bg-background hover:bg-accent cursor-pointer">
              <Upload className="h-4 w-4" />
              Upload Contract (PDF)
              <input type="file" accept="application/pdf" onChange={onUpload} className="hidden" />
            </label>
            {trainer.contract.fileName && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <FileText className="h-3 w-3" /> {trainer.contract.fileName}
              </span>
            )}
          </div>
        </Section>

        <Section title="Leave" icon={Calendar}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Annual Entitlement" value={`${trainer.leave.entitlement} days`} />
            <Field label="Taken" value={`${trainer.leave.taken} days`} />
            <Field label="Remaining" value={<span className="text-primary">{remaining} days</span>} />
          </div>
          {trainer.leave.currentLeave && (
            <div className="mt-4 rounded-md border bg-[color:var(--warning)]/10 p-3 text-sm">
              On leave: <strong>{trainer.leave.currentLeave.from}</strong> → <strong>{trainer.leave.currentLeave.to}</strong>
            </div>
          )}
        </Section>
      </div>

      <Section title="Weekly Availability" icon={Calendar}>
        <p className="text-xs text-muted-foreground mb-3">Click a cell to cycle: Available → Teaching → Leave → Unavailable</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-xs uppercase tracking-wide text-muted-foreground p-2"></th>
                {DAYS.map((d) => (
                  <th key={d} className="text-xs uppercase tracking-wide text-muted-foreground p-2">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot}>
                  <th className="text-left text-xs uppercase tracking-wide text-muted-foreground p-2 capitalize">{slot}</th>
                  {DAYS.map((day) => {
                    const status = trainer.availability[day][slot];
                    return (
                      <td key={day} className="p-0">
                        <button
                          onClick={() => cycleSlot(day, slot)}
                          className={`w-full px-2 py-2 rounded-md border text-xs font-medium transition-colors ${SLOT_TONE[status]}`}
                        >
                          {status}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Notes" icon={StickyNote}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={4}
          placeholder="Manager notes…"
          className="w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 text-xs text-muted-foreground">Notes save automatically when you click away.</div>
      </Section>
    </div>
  );
}
