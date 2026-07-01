import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useTrainers,
  daysUntil,
  isAvailableForAssignment,
} from "@/lib/trainers-store";
import {
  Users,
  UserCheck,
  PlaneTakeoff,
  CalendarClock,
  CalendarCheck2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SBI Trainer Manager" },
      { name: "description", content: "Overview of trainers, contracts, leave, and availability." },
    ],
  }),
  component: Dashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    success: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
    warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning-foreground)]",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="bg-card border rounded-xl p-5 flex items-start gap-4">
      <div className={`h-11 w-11 rounded-lg grid place-items-center ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
        <div className="text-3xl font-semibold mt-1">{value}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { trainers } = useTrainers();

  const total = trainers.length;
  const active = trainers.filter((t) => t.status === "Active").length;
  const onLeave = trainers.filter((t) => t.status === "On Leave").length;
  const expiringSoon = trainers.filter((t) => {
    const d = daysUntil(t.contract.endDate);
    return d >= 0 && d <= 90;
  });
  const available = trainers.filter(isAvailableForAssignment).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">A quick view of your trainer team.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={Users} label="Total Trainers" value={total} />
        <Stat icon={UserCheck} label="Active" value={active} tone="success" />
        <Stat icon={PlaneTakeoff} label="On Leave" value={onLeave} tone="warning" />
        <Stat icon={CalendarClock} label="Contract <90d" value={expiringSoon.length} tone="destructive" />
        <Stat icon={CalendarCheck2} label="Available" value={available} tone="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-card border rounded-xl">
          <header className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="font-semibold">Contracts expiring (next 90 days)</h2>
            </div>
            <Link to="/trainers" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y">
            {expiringSoon.length === 0 && (
              <li className="p-5 text-sm text-muted-foreground">No contracts expiring soon.</li>
            )}
            {expiringSoon.map((t) => (
              <li key={t.id} className="p-4 flex items-center gap-3">
                <img src={t.photo} alt={t.fullName} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to="/trainers/$id" params={{ id: t.id }} className="font-medium hover:text-primary truncate block">
                    {t.fullName}
                  </Link>
                  <div className="text-xs text-muted-foreground">{t.position}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-medium">{t.contract.endDate}</div>
                  <div className="text-destructive">{daysUntil(t.contract.endDate)} days</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-card border rounded-xl">
          <header className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-2">
              <PlaneTakeoff className="h-4 w-4 text-[color:var(--warning-foreground)]" />
              <h2 className="font-semibold">Currently on leave</h2>
            </div>
          </header>
          <ul className="divide-y">
            {trainers.filter((t) => t.status === "On Leave").length === 0 && (
              <li className="p-5 text-sm text-muted-foreground">Nobody is on leave right now.</li>
            )}
            {trainers
              .filter((t) => t.status === "On Leave")
              .map((t) => (
                <li key={t.id} className="p-4 flex items-center gap-3">
                  <img src={t.photo} alt={t.fullName} className="h-10 w-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <Link to="/trainers/$id" params={{ id: t.id }} className="font-medium hover:text-primary truncate block">
                      {t.fullName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{t.position}</div>
                  </div>
                  {t.leave.currentLeave && (
                    <div className="text-right text-xs">
                      <div className="font-medium">{t.leave.currentLeave.from}</div>
                      <div className="text-muted-foreground">→ {t.leave.currentLeave.to}</div>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
