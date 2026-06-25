import { redirect } from "next/navigation";
import Image from "next/image";

import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-accent-strong))] px-4 py-4 text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              alt="Biglee"
              className="h-10 w-10 object-contain"
              height={40}
              src="/biglee-logo.png"
              width={40}
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                biglee.io
              </p>
              <h1 className="mt-1 text-base font-black md:text-lg">
                Registro de ingresos hospitalarios
              </h1>
            </div>
          </div>
          <p className="hidden rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 sm:block">
            Ayuda Venezuela
          </p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-md flex-col px-4 py-10">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
            Acceso al sistema
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
            Ingresa con una cuenta autorizada por el equipo.
          </p>
        </div>

        <aside className="rounded-[2rem] bg-white p-6 shadow-lg shadow-[rgba(22,63,82,0.12)] ring-1 ring-[var(--brand-border)] md:p-7">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-strong)]">
              Personal autorizado
            </p>
            <h3 className="mt-3 text-2xl font-black text-[var(--foreground)]">
              Iniciar sesion
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
              Usa las credenciales creadas para el equipo de apoyo.
            </p>
          </div>

          {isSupabaseConfigured() ? (
            <LoginForm />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Configura `NEXT_PUBLIC_SUPABASE_URL` y
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` para habilitar el
              acceso.
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
