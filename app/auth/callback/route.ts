import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APP_URL = "https://maestro-ai-flame.vercel.app";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?auth=missing_code", APP_URL));

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/?auth=not_configured", APP_URL));

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("Maestro auth callback exchange failed:", exchangeError.message);
    return NextResponse.redirect(new URL("/?auth=verification_failed", APP_URL));
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.redirect(new URL("/?auth=session_missing", APP_URL));

  const metadata = user.user_metadata ?? {};
  const displayName = String(metadata.display_name || user.email || "Maestro learner");
  const learnerName = typeof metadata.learner_name === "string" && metadata.learner_name.trim()
    ? metadata.learner_name.trim()
    : displayName;
  const allowedAgeBands = ["4-8", "9-16", "adult"];
  const ageBand = allowedAgeBands.includes(metadata.age_band) ? metadata.age_band : "adult";

  const { error: guardianError } = await supabase.from("guardian_accounts").upsert({
    user_id: user.id,
    display_name: displayName
  }, { onConflict: "user_id" });
  if (guardianError) {
    console.error("Maestro guardian profile save failed:", guardianError.message);
    return NextResponse.redirect(new URL("/?auth=profile_save_failed", APP_URL));
  }

  const { data: existing, error: lookupError } = await supabase.from("learner_profiles")
    .select("id")
    .eq("guardian_user_id", user.id)
    .eq("display_name", learnerName)
    .maybeSingle();
  if (lookupError) {
    console.error("Maestro learner profile lookup failed:", lookupError.message);
    return NextResponse.redirect(new URL("/?auth=profile_save_failed", APP_URL));
  }
  if (!existing) {
    const { error: insertError } = await supabase.from("learner_profiles").insert({
      guardian_user_id: user.id,
      display_name: learnerName,
      age_band: ageBand
    });
    if (insertError) {
      console.error("Maestro learner profile creation failed:", insertError.message);
      return NextResponse.redirect(new URL("/?auth=profile_save_failed", APP_URL));
    }
  }

  return NextResponse.redirect(new URL("/?auth=verified", APP_URL));
}
