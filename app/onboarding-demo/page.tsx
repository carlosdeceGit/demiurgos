import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata = {
  title: "Onboarding (demo) · Demiurgos",
  robots: { index: false },
};

export default function OnboardingDemoPage() {
  return (
    <main className="min-h-dvh bg-background">
      <OnboardingWizard demoMode />
    </main>
  );
}
