"use client";

import { useEffect, useRef, useState } from "react";

export function SearchButton() {
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;

    const handler = () => setPending(true);
    form.addEventListener("submit", handler);
    return () => form.removeEventListener("submit", handler);
  }, []);

  return (
    <button
      className="min-h-12 rounded-2xl bg-[var(--brand-primary)] px-5 py-3 font-bold text-white transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      ref={ref}
      type="submit"
    >
      {pending ? "Buscando..." : "Buscar"}
    </button>
  );
}
