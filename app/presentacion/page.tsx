import type { Metadata } from "next";
import { PresentacionDeck } from "./deck";

export const metadata: Metadata = {
  title: "Demiurgos · Bootcamp IA",
  description:
    "Presentación de Demiurgos para el bootcamp de IA — qué es, cómo funciona y cómo se construyó.",
  robots: { index: false, follow: false },
};

export default function PresentacionPage() {
  return <PresentacionDeck />;
}
