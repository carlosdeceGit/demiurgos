import type { Metadata } from "next";

import { DemoExperience } from "@/components/demo/demo-experience";

export const metadata: Metadata = {
  title: "Demiurgos · Demo",
  description: "Demo de Demiurgos con perfiles de ejemplo de varios sectores.",
};

// Demo pública: no requiere sesión. Todo el contenido sale de fixtures
// (datos falsos); solo el chat llama al modelo real vía /api/demo-chat.
export default function DemoPage() {
  return <DemoExperience />;
}
