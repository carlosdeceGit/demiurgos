"use client";

import { useRouter } from "next/navigation";

import { DrivePanel } from "@/components/library/drive-panel";
import type { ContentSource, SyncLog } from "@/lib/library/types";

export function ProfileView({
  displayName,
  email,
  initialSources,
  initialLogs,
  driveConfigured,
}: {
  displayName: string;
  email: string;
  initialSources: ContentSource[];
  initialLogs: SyncLog[];
  driveConfigured: boolean;
}) {
  // No mantenemos copia local: tras conectar/sincronizar hacemos router.refresh()
  // y el servidor re-renderiza con los datos frescos.
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="flex items-center gap-4">
        <span className="bg-brand-accent/10 text-brand-accent grid size-12 shrink-0 place-items-center rounded-full text-lg font-semibold">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-serif text-2xl">{displayName}</h1>
          <p className="text-muted-foreground text-sm">{email}</p>
        </div>
      </header>

      <section>
        <h2 className="font-serif text-lg">Conexiones</h2>
        <p className="text-muted-foreground text-sm">
          Conecta tu cuenta de Google Drive y elige una carpeta. El contenido que
          importes aparece en tu Biblioteca, listo para la IA. Solo tú accedes a
          tu cuenta y a tu contenido.
        </p>
      </section>

      <DrivePanel
        sources={initialSources}
        logs={initialLogs}
        driveConfigured={driveConfigured}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}
