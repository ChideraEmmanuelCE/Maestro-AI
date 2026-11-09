import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?auth=missing_code", requestUrl.origin));

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/?auth=not_configured", requestUrl.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/?auth=verification_failed", requestUrl.origin));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const metadata = user.user_metadata ?? {};
    await supabase.from("guardian_accounts").upsert({
      user_id: user.id,
      display_name: String(metadata.display_name || user.email || "Maestro learner")
    }, { onConflict: "user_id" });

    const learnerName = typeof metadata.learner_name === "string" ? metadata.learner_name.trim() : "";
    const ageBand = ["4-8","9-16","adult"].includes(metadata.age_band) ? metadata.age_band : "adult";
    if (learnerName) {
      const { data: existing } = await supabase.from("learner_profiles")
        .select("id").eq("guardian_user_id", user.id).eq("display_name", learnerName).maybeSingle();
      if (!existing) await supabase.from("learner_profiles").insert({
        guardian_user_id: user.id, display_name: learnerName, age_band: ageBand
      });
    }
  }
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
