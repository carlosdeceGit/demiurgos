import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Demiurgos</h1>
        <p className="text-muted-foreground text-lg">
          Tu director creativo personal. Aprende quién eres, tu voz y tu
          criterio, mira lo que funciona en tu nicho, y decide qué publicar,
          cuándo y por qué.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/chat">Abrir el chat</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Del griego: el artesano que da forma al mundo a partir del caos.
      </p>
    </main>
  );
}
