"use client";

import { useActionState } from "react";

import { signIn, type LoginState } from "@/app/login/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: LoginState = {
  message: "",
};

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="block text-sm font-bold text-[var(--foreground)]">
          Correo
        </span>
        <input
          autoComplete="email"
          className="h-14 w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
          name="email"
          placeholder="personal@organizacion.org"
          required
          type="email"
        />
      </label>

      <label className="block space-y-2">
        <span className="block text-sm font-bold text-[var(--foreground)]">
          Contrasena
        </span>
        <input
          autoComplete="current-password"
          className="h-14 w-full rounded-2xl border border-[var(--brand-border)] bg-white px-4 text-[var(--foreground)] outline-none transition placeholder:text-[color:rgba(18,52,59,0.42)] focus:border-[var(--brand-accent-strong)] focus:ring-4 focus:ring-[color:rgba(102,200,198,0.18)]"
          name="password"
          placeholder="Tu contrasena"
          required
          type="password"
        />
      </label>

      <SubmitButton
        className="h-14 w-full rounded-2xl bg-[var(--brand-primary)] px-5 text-base font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--brand-border)]"
        pendingText="Verificando..."
      >
        Entrar
      </SubmitButton>
    </form>
  );
}
