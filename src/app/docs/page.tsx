import Image from "next/image";

import { SiteFooter } from "@/components/site-footer";
import { SwaggerUiEmbed } from "@/components/swagger-ui-embed";

export const metadata = {
  title: "Help Caracas — API pública",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)]">
      <header className="bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-accent-strong))] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-5">
          <div className="flex min-w-0 max-w-full items-start gap-3 sm:items-center">
            <Image
              alt="Biglee"
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
              height={44}
              src="/biglee-logo.png"
              width={44}
            />
            <div className="min-w-0 flex-1">
              <p className="break-words text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/75 sm:text-xs sm:tracking-[0.22em]">
                biglee.io | Ayuda por terremoto en Venezuela
              </p>
              <h1 className="mt-1 max-w-full text-balance text-base font-black leading-tight sm:text-2xl">
                API pública de consulta
              </h1>
            </div>
          </div>
        </div>
      </header>

      <SwaggerUiEmbed />

      <SiteFooter />
    </main>
  );
}
