"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearSession, setSession } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

function normalizeAuthSession(supabaseSession: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null) {
  if (!supabaseSession) return;

  const user = supabaseSession.user;
  const meta = user.user_metadata ?? {};
  const role: UserRole =
    meta.role === "admin" ? "admin" :
    meta.role === "barber" ? "barber" :
    "customer";

  setSession({
    token: supabaseSession.access_token,
    user: {
      id: user.id,
      email: user.email ?? "",
      phone: meta.phone ?? null,
      role,
      full_name: meta.fullName ?? meta.full_name ?? "",
      favorite_barber_id: null,
      created_at: user.created_at,
      updated_at: new Date().toISOString(),
    },
  });
}

export function SupabaseAuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        clearSession();
        return;
      }

      normalizeAuthSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearSession();
        if (!pathname.startsWith("/admin") && !pathname.startsWith("/auth")) {
          router.push("/auth/login");
        }
        return;
      }

      normalizeAuthSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
