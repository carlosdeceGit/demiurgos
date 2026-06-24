import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata = { title: "Demiurgos · Bienvenido" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-background">
      <OnboardingWizard />
    </main>
  );
}
