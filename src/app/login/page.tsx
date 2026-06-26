import { redirect } from "next/navigation";
import Image from "next/image";

import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-accent-strong))] px-4 py-4 text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              alt="Biglee"
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
              height={40}
              src="/biglee-logo.png"
              width={40}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                biglee.io
              </p>
              <h1 className="mt-1 text-sm font-black leading-tight sm:text-base md:text-lg">
                Registro de ingresos hospitalarios
              </h1>
            </div>
          </div>
          <p className="w-fit rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20 sm:text-sm">
            Ayuda Venezuela
          </p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-md flex-col px-4 py-8 sm:py-10">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl">
            Configuracion requerida
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
            Agrega las variables de Supabase para habilitar el sistema publico.
          </p>
        </div>

        <aside className="rounded-3xl bg-white p-5 shadow-lg shadow-[rgba(22,63,82,0.12)] ring-1 ring-[var(--brand-border)] sm:p-6 md:p-7">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-strong)] sm:text-sm">
              Supabase
            </p>
            <h3 className="mt-3 text-xl font-black text-[var(--foreground)] sm:text-2xl">
              Variables faltantes
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
              Define la URL y anon key del proyecto para continuar.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Configura `NEXT_PUBLIC_SUPABASE_URL` y
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` para habilitar el
            acceso.
          </div>
        </aside>
      </section>
    </main>
  );
}
