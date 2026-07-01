import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--brand-border)] py-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-3 sm:flex-row sm:justify-between sm:px-4">
        <p className="text-xs text-[var(--brand-muted)]">
          © 2026 Biglee · Herramienta de emergencia de acceso libre
        </p>
        <nav className="flex items-center gap-4 text-xs text-[var(--brand-muted)]">
          <Link className="underline-offset-2 hover:text-[var(--foreground)] hover:underline" href="/dashboard">
            Inicio
          </Link>
          <Link className="underline-offset-2 hover:text-[var(--foreground)] hover:underline" href="/docs">
            API pública
          </Link>
        </nav>
      </div>
    </footer>
  );
}
