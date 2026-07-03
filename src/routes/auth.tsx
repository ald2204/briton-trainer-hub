import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { signIn, signUp, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SBI Trainer Manager" },
      { name: "description", content: "Sign in to manage trainer records." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/trainers" });
  }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password);
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-sm mx-auto py-16">
      <div className="bg-card border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Anyone can view trainer records. Editing is limited to admins — request admin access from your manager.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Password</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="text-xs text-center text-muted-foreground">
          {mode === "signin" ? (
            <>New here?{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button>
            </>
          ) : (
            <>Already registered?{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button>
            </>
          )}
        </div>
        <div className="text-xs text-center">
          <Link to="/trainers" className="text-muted-foreground hover:text-primary">← Continue as viewer</Link>
        </div>
      </div>
    </div>
  );
}
