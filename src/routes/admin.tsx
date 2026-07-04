import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, UserPlus } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { addAdminByEmail } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Settings — SBI Trainer Manager" },
      { name: "description", content: "Manage admin access for the SBI Trainer Manager." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminPage() {
  const { user, isAdmin, ready } = useAuth();
  const router = useRouter();
  const addAdmin = useServerFn(addAdminByEmail);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!ready) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-xl font-semibold">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please sign in to access admin settings.</p>
        <Link
          to="/auth"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-xl font-semibold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    setSubmitting(true);
    try {
      const res = await addAdmin({ data: { email: value } });
      if (res.alreadyAdmin) {
        toast.info(`${res.email} is already an admin`);
      } else {
        toast.success(`${res.email} is now an admin`);
      }
      setEmail("");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add admin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Admin Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promote existing users to admin. The person must first sign up with their email so an account exists.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-lg border bg-card p-5 space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="admin-email">New admin email</Label>
          <Input
            id="admin-email"
            type="email"
            required
            maxLength={255}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">
            They must already have an account. Ask them to sign up first at the Sign in page.
          </p>
        </div>
        <Button type="submit" disabled={submitting || !email.trim()}>
          <UserPlus className="h-4 w-4" />
          {submitting ? "Adding…" : "Add admin"}
        </Button>
      </form>
    </div>
  );
}
