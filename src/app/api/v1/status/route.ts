import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { status: "error", db: "error", reason: "Supabase no configurado.", timestamp },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("hospitales").select("count").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", db: "error", timestamp },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ok", db: "ok", timestamp });
  } catch {
    return NextResponse.json(
      { status: "error", db: "error", timestamp },
      { status: 503 },
    );
  }
}
