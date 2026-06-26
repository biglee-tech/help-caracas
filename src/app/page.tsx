import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  redirect("/dashboard");
}
