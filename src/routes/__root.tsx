import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import sbiLogo from "../assets/logo-sbi.png.asset.json";
import britonLogo from "../assets/logo-briton.png.asset.json";
import { useAuth, signOut } from "@/lib/auth";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing the page.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SBI Trainer Manager — Briton English Education" },
      { name: "description", content: "Manage SBI trainer profiles, contracts, availability, and performance in one place." },
      { property: "og:title", content: "SBI Trainer Manager — Briton English Education" },
      { name: "twitter:title", content: "SBI Trainer Manager — Briton English Education" },
      { property: "og:description", content: "Manage SBI trainer profiles, contracts, availability, and performance in one place." },
      { name: "twitter:description", content: "Manage SBI trainer profiles, contracts, availability, and performance in one place." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/39ba92d6-e6a8-4efd-a987-09a80f562894/id-preview-48f8a482--9748a087-295a-47f7-8bd6-011cab013102.lovable.app-1782747049805.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/39ba92d6-e6a8-4efd-a987-09a80f562894/id-preview-48f8a482--9748a087-295a-47f7-8bd6-011cab013102.lovable.app-1782747049805.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      activeProps={{ className: "px-3 py-2 rounded-md text-sm font-medium bg-primary-soft text-primary" }}
      activeOptions={{ exact: to === "/" }}
    >
      {children}
    </Link>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card sticky top-0 z-30">
          <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-2 sm:gap-4">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
              <img src={sbiLogo.url} alt="SBI — Sekolah Berbahasa Inggris" className="h-7 sm:h-10 w-auto shrink-0" />
              <span className="h-6 w-px bg-border" />
              <img src={britonLogo.url} alt="Briton English Education" className="h-6 sm:h-8 w-auto shrink-0" />
            </Link>
            <nav className="flex items-center gap-1 shrink-0">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/trainers">Trainers</NavLink>
              <AuthNav />
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Briton English Education · SBI Trainer Manager
        </footer>
      </div>
    </QueryClientProvider>
  );
}

function AuthNav() {
  const { user, isAdmin, ready } = useAuth();
  if (!ready) return null;
  if (!user) {
    return (
      <Link
        to="/auth"
        className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
      >
        <LogIn className="h-4 w-4" /> Sign in
      </Link>
    );
  }
  return (
    <div className="ml-2 flex items-center gap-2">
      {isAdmin && (
        <>
          <Link
            to="/admin"
            className="hidden sm:inline-flex px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            activeProps={{ className: "px-3 py-2 rounded-md text-sm font-medium bg-primary-soft text-primary" }}
          >
            Admin
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-soft text-primary">
            <ShieldCheck className="h-3 w-3" /> Admin
          </span>
        </>
      )}
      <span className="hidden md:inline text-xs text-muted-foreground max-w-[10rem] truncate">{user.email}</span>
      <button
        onClick={() => signOut()}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border hover:bg-accent"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
