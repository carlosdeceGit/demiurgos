"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { createClient } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      {/* Resplandor esmeralda de marca */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute top-0 left-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 28%, transparent), transparent)",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5"
          aria-label="Demiurgos, inicio"
        >
          <Logo size={34} />
          <span className="text-lg font-semibold tracking-tight">Demiurgos</span>
        </Link>

        <Card className="shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl font-normal">
              Entra a tu <span className="text-primary italic">panel</span>
            </CardTitle>
            <CardDescription>
              Te mandamos un enlace mágico al correo. Sin contraseñas, sin fricción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "sent" ? (
              <div
                className="flex flex-col items-center gap-3 py-2 text-center"
                aria-live="polite"
              >
                <span className="bg-primary/15 text-primary grid size-11 place-items-center rounded-full">
                  <Check className="size-5" strokeWidth={2.4} />
                </span>
                <p className="text-sm">
                  Revisa tu correo (<span className="font-medium">{email}</span>) y
                  abre el enlace para entrar.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                >
                  Usar otro correo
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label htmlFor="email" className="sr-only">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                  />
                </div>
                <Button type="submit" disabled={status === "sending"} className="h-10 gap-2">
                  {status === "sending" ? (
                    "Enviando…"
                  ) : (
                    <>
                      Enviar enlace mágico
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                {error && (
                  <p className="text-destructive text-sm" aria-live="assertive">
                    {error}
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Acceso temprano · gratis · no necesitas tarjeta
        </p>
      </div>
    </main>
  );
}
