"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

// Mismos formatos que la Biblioteca.
const ACCEPT = ".md,.markdown,.txt,.html,.htm,.jpg,.jpeg,.png,.webp,.pdf,.docx,.rtf,.odt";

// Botón "Subir contenido" del panel de contexto del chat: sube archivos a la
// Biblioteca (conversión a Markdown / OCR) y confirma. El contenido queda
// guardado y disponible para la IA.
export function UploadContentButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | File[]) {
    setBusy(true);
    setError(null);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/library/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());
        ok++;
      } catch (e) {
        setError(`«${file.name}»: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    setDone(ok);
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="justify-start gap-2"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Subir contenido
      </Button>
      {done > 0 && !busy && (
        <p className="text-brand-accent flex items-center gap-1 text-[11px]">
          <Check className="size-3" />
          {done} {done === 1 ? "archivo añadido" : "archivos añadidos"} a tu{" "}
          <Link href="/library" className="underline">
            Biblioteca
          </Link>
        </p>
      )}
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}
