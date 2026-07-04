import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const addAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      throw new Error("Invalid email");
    }
    return { email };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Caller must be an admin
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find user by email via Auth Admin API (paginate)
    let targetId: string | null = null;
    let page = 1;
    const perPage = 200;
    while (page <= 50) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      const match = list.users.find((u) => (u.email ?? "").toLowerCase() === data.email);
      if (match) {
        targetId = match.id;
        break;
      }
      if (list.users.length < perPage) break;
      page += 1;
    }

    if (!targetId) {
      throw new Error("No user account with that email. Ask them to sign up first.");
    }

    const { error: insertErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: targetId, role: "admin" });

    if (insertErr) {
      // Unique violation → already admin
      if ((insertErr as { code?: string }).code === "23505") {
        return { ok: true, alreadyAdmin: true, email: data.email };
      }
      throw new Error(insertErr.message);
    }

    return { ok: true, alreadyAdmin: false, email: data.email };
  });
