import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  useTrainer,
  updateTrainer,
  deleteTrainer,
  loadHistory,
  restoreVersion,
  fileToPhotoDataUrl,
  daysUntil,
  DAYS,
  SLOTS,
  type Trainer,
  type SlotStatus,
  type DayKey,
  type SlotKey,
  type TrainerVersion,
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
  Calendar,
  StickyNote,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Trash2,
  Camera,
  History,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/trainers/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Trainer ${params.id} — SBI Trainer Manager` }],
  }),
  component: ProfilePage,
});

const SLOT_TONE: Record<SlotStatus, string> = {
  Available: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30",
  Teaching: "bg-primary-soft text-primary border-primary/30",
  Leave: "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)] border-[color:var(--warning)]/40",
  Unavailable: "bg-muted text-muted-foreground border-border",
};
const STATUSES: SlotStatus[] = ["Available", "Teaching", "Leave", "Unavailable"];

type SectionKey = "personal" | "academic" | "english" | "performance" | "contract" | "leave";

function Section({
  title,
  icon: Icon,
  editing,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  editing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border rounded-xl">
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
        {onEdit && (
          editing ? (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
              <Button size="sm" onClick={onSave}><Check className="h-4 w-4" /> Save</Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          )
        )}
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

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { trainer, ready } = useTrainer(id);
  const [draft, setDraft] = useState<Trainer | undefined>();
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (trainer && !notesDirty) setNotes(trainer.notes);
  }, [trainer, notesDirty]);

  if (!ready) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!trainer) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-semibold">Trainer not found</h1>
        <Link to="/trainers" className="text-primary text-sm mt-3 inline-block">Back to trainers</Link>
      </div>
    );
  }

  const remaining = trainer.leave.entitlement - trainer.leave.taken;
  const daysLeft = daysUntil(trainer.contract.endDate);
  const expiringSoon = daysLeft >= 0 && daysLeft <= 90;

  const startEdit = (section: SectionKey) => {
    setDraft(JSON.parse(JSON.stringify(trainer)));
    setEditing(section);
  };
  const cancelEdit = () => {
    setDraft(undefined);
    setEditing(null);
  };
  const saveEdit = (patch: Partial<Trainer>) => {
    updateTrainer(trainer.id, patch);
    setEditing(null);
    setDraft(undefined);
  };

  const cycleSlot = (day: DayKey, slot: SlotKey) => {
    const current = trainer.availability[day][slot];
    const next = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length];
    const availability = {
      ...trainer.availability,
      [day]: { ...trainer.availability[day], [slot]: next },
    };
    updateTrainer(trainer.id, { availability });
  };

  const saveNotes = () => {
    if (!notesDirty) return;
    updateTrainer(trainer.id, { notes });
    setNotesDirty(false);
  };

  const onPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToPhotoDataUrl(file);
      await updateTrainer(trainer.id, { photo: dataUrl });
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  const onDelete = async () => {
    await deleteTrainer(trainer.id);
    navigate({ to: "/trainers" });
  };

  const d = draft ?? trainer;
  const setDraftField = (updater: (t: Trainer) => Trainer) => setDraft(updater(d));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/trainers" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to trainers
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4" /> Version history
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /> Delete Trainer</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {trainer.fullName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the trainer record. Prior version snapshots will also be deleted. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

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
        <div className="relative group">
          <img src={trainer.photo} alt={trainer.fullName} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Change photo"
          >
            <Camera className="h-5 w-5" />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoPick}
          />
        </div>
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
          <Button variant="ghost" size="sm" className="mt-2 -ml-2 h-7 text-xs" onClick={() => photoInputRef.current?.click()}>
            <Camera className="h-3.5 w-3.5" /> Change photo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Personal Information"
          icon={Mail}
          editing={editing === "personal"}
          onEdit={() => startEdit("personal")}
          onCancel={cancelEdit}
          onSave={() => saveEdit({
            fullName: d.fullName, email: d.email, phone: d.phone, address: d.address, position: d.position, status: d.status,
          })}
        >
          {editing === "personal" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <EditField label="Full Name"><Input value={d.fullName} onChange={(e) => setDraftField((t) => ({ ...t, fullName: e.target.value }))} /></EditField>
              <EditField label="Position"><Input value={d.position} onChange={(e) => setDraftField((t) => ({ ...t, position: e.target.value }))} /></EditField>
              <EditField label="Email"><Input type="email" value={d.email} onChange={(e) => setDraftField((t) => ({ ...t, email: e.target.value }))} /></EditField>
              <EditField label="Phone"><Input value={d.phone} onChange={(e) => setDraftField((t) => ({ ...t, phone: e.target.value }))} /></EditField>
              <EditField label="Address"><Input value={d.address} onChange={(e) => setDraftField((t) => ({ ...t, address: e.target.value }))} /></EditField>
              <EditField label="Status">
                <select
                  value={d.status}
                  onChange={(e) => setDraftField((t) => ({ ...t, status: e.target.value as Trainer["status"] }))}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                >
                  <option>Active</option><option>On Leave</option><option>Inactive</option>
                </select>
              </EditField>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={trainer.fullName} />
              <Field label="Email" value={<a className="text-primary hover:underline" href={`mailto:${trainer.email}`}>{trainer.email}</a>} />
              <Field label="Phone" value={<a className="text-primary hover:underline" href={`tel:${trainer.phone}`}><Phone className="h-3 w-3 inline mr-1" />{trainer.phone}</a>} />
              <Field label="Address" value={<span><MapPin className="h-3 w-3 inline mr-1" />{trainer.address}</span>} />
            </div>
          )}
        </Section>

        <Section
          title="Academic Background"
          icon={GraduationCap}
          editing={editing === "academic"}
          onEdit={() => startEdit("academic")}
          onCancel={cancelEdit}
          onSave={() => saveEdit({ academic: d.academic })}
        >
          {editing === "academic" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <EditField label="Highest Qualification"><Input value={d.academic.qualification} onChange={(e) => setDraftField((t) => ({ ...t, academic: { ...t.academic, qualification: e.target.value } }))} /></EditField>
              <EditField label="University"><Input value={d.academic.university} onChange={(e) => setDraftField((t) => ({ ...t, academic: { ...t.academic, university: e.target.value } }))} /></EditField>
              <EditField label="Major"><Input value={d.academic.major} onChange={(e) => setDraftField((t) => ({ ...t, academic: { ...t.academic, major: e.target.value } }))} /></EditField>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Highest Qualification" value={trainer.academic.qualification} />
              <Field label="University" value={trainer.academic.university} />
              <Field label="Major" value={trainer.academic.major} />
            </div>
          )}
        </Section>

        <Section
          title="English Profile"
          icon={Languages}
          editing={editing === "english"}
          onEdit={() => startEdit("english")}
          onCancel={cancelEdit}
          onSave={() => saveEdit({ english: d.english })}
        >
          {editing === "english" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <EditField label="Latest Test"><Input value={d.english.test} onChange={(e) => setDraftField((t) => ({ ...t, english: { ...t.english, test: e.target.value } }))} /></EditField>
              <EditField label="CEFR Level">
                <select value={d.english.cefr} onChange={(e) => setDraftField((t) => ({ ...t, english: { ...t.english, cefr: e.target.value } }))} className="w-full h-9 px-3 rounded-md border bg-background text-sm">
                  {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l}>{l}</option>)}
                </select>
              </EditField>
              <EditField label="Overall Score"><Input type="number" step="0.1" value={d.english.score} onChange={(e) => setDraftField((t) => ({ ...t, english: { ...t.english, score: Number(e.target.value) } }))} /></EditField>
              <EditField label="Test Date"><Input type="date" value={d.english.testDate} onChange={(e) => setDraftField((t) => ({ ...t, english: { ...t.english, testDate: e.target.value } }))} /></EditField>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latest Test" value={trainer.english.test} />
              <Field label="CEFR Level" value={trainer.english.cefr} />
              <Field label="Overall Score" value={trainer.english.score} />
              <Field label="Test Date" value={trainer.english.testDate} />
            </div>
          )}
        </Section>

        <Section
          title="Performance (latest)"
          icon={Star}
          editing={editing === "performance"}
          onEdit={() => startEdit("performance")}
          onCancel={cancelEdit}
          onSave={() => saveEdit({ performance: d.performance })}
        >
          {editing === "performance" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <EditField label="Appraisal Date"><Input type="date" value={d.performance.date} onChange={(e) => setDraftField((t) => ({ ...t, performance: { ...t.performance, date: e.target.value } }))} /></EditField>
                <EditField label="Overall Score (0–5)"><Input type="number" step="0.1" min="0" max="5" value={d.performance.score} onChange={(e) => setDraftField((t) => ({ ...t, performance: { ...t.performance, score: Number(e.target.value) } }))} /></EditField>
              </div>
              <EditField label="Comments">
                <textarea
                  value={d.performance.comments}
                  onChange={(e) => setDraftField((t) => ({ ...t, performance: { ...t.performance, comments: e.target.value } }))}
                  rows={3}
                  className="w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </EditField>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Appraisal Date" value={trainer.performance.date} />
                <Field label="Overall Score" value={`${trainer.performance.score.toFixed(1)} / 5`} />
              </div>
              <div className="mt-4">
                <Field label="Comments" value={<p className="text-sm font-normal text-foreground/80">{trainer.performance.comments}</p>} />
              </div>
            </>
          )}
        </Section>

        <Section
          title="Contract"
          icon={FileText}
          editing={editing === "contract"}
          onEdit={() => startEdit("contract")}
          onCancel={cancelEdit}
          onSave={() => saveEdit({ contract: { ...d.contract } })}
        >
          {editing === "contract" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <EditField label="Start Date"><Input type="date" value={d.contract.startDate} onChange={(e) => setDraftField((t) => ({ ...t, contract: { ...t.contract, startDate: e.target.value } }))} /></EditField>
              <EditField label="End Date"><Input type="date" value={d.contract.endDate} onChange={(e) => setDraftField((t) => ({ ...t, contract: { ...t.contract, endDate: e.target.value } }))} /></EditField>
            </div>
          ) : (
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
          )}
        </Section>

        <Section
          title="Leave"
          icon={Calendar}
          editing={editing === "leave"}
          onEdit={() => startEdit("leave")}
          onCancel={cancelEdit}
          onSave={() => saveEdit({ leave: d.leave })}
        >
          {editing === "leave" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <EditField label="Annual Entitlement (days)"><Input type="number" value={d.leave.entitlement} onChange={(e) => setDraftField((t) => ({ ...t, leave: { ...t.leave, entitlement: Number(e.target.value) } }))} /></EditField>
                <EditField label="Taken (days)"><Input type="number" value={d.leave.taken} onChange={(e) => setDraftField((t) => ({ ...t, leave: { ...t.leave, taken: Number(e.target.value) } }))} /></EditField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <EditField label="Current Leave From"><Input type="date" value={d.leave.currentLeave?.from ?? ""} onChange={(e) => setDraftField((t) => ({ ...t, leave: { ...t.leave, currentLeave: e.target.value ? { from: e.target.value, to: t.leave.currentLeave?.to ?? e.target.value } : undefined } }))} /></EditField>
                <EditField label="Current Leave To"><Input type="date" value={d.leave.currentLeave?.to ?? ""} onChange={(e) => setDraftField((t) => ({ ...t, leave: { ...t.leave, currentLeave: t.leave.currentLeave ? { ...t.leave.currentLeave, to: e.target.value } : (e.target.value ? { from: e.target.value, to: e.target.value } : undefined) } }))} /></EditField>
              </div>
            </div>
          ) : (
            <>
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
            </>
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
                {DAYS.map((day) => (
                  <th key={day} className="text-xs uppercase tracking-wide text-muted-foreground p-2">{day}</th>
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
          onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
          onBlur={saveNotes}
          rows={4}
          placeholder="Manager notes…"
          className="w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 text-xs text-muted-foreground">Notes save automatically when you click away.</div>
      </Section>

      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        trainerId={trainer.id}
        trainerName={trainer.fullName}
      />
    </div>
  );
}

function HistoryDialog({
  open,
  onOpenChange,
  trainerId,
  trainerName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trainerId: string;
  trainerName: string;
}) {
  const [versions, setVersions] = useState<TrainerVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const list = await loadHistory(trainerId);
    setVersions(list);
    setLoading(false);
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trainerId]);

  const doRestore = async (v: TrainerVersion) => {
    setRestoring(v.id);
    await restoreVersion(trainerId, v);
    setRestoring(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Version history — {trainerName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          One snapshot per day showing that day's final state. Restore to roll back accidental changes.
        </p>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading history…</div>
        ) : versions.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No history yet.</div>
        ) : (
          <ul className="divide-y border rounded-md">
            {versions.map((v, i) => {
              const isCurrent = i === 0;
              return (
                <li key={v.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {v.snapshot_date}
                      {isCurrent && <span className="ml-2 text-xs text-primary">(today · current)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {v.data.fullName} · {v.data.position} · {v.data.status}
                    </div>
                  </div>
                  {!isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={restoring === v.id}>
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore version from {v.snapshot_date}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This replaces the current record with the snapshot from {v.snapshot_date}. Today's current state will still be recoverable from history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => doRestore(v)}>Restore</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
