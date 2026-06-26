"use client";

import { useState } from "react";

type ExportCsvButtonProps = {
  href: string;
};

export function ExportCsvButton({ href }: ExportCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  return (
    <a
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
      href={href}
      onClick={() => setIsExporting(true)}
    >
      {isExporting ? "Exportando..." : "Exportar CSV"}
    </a>
  );
}
