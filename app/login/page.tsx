"use client";

import { useState } from "react";

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
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

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
    <main className="flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar en Demiurgos</CardTitle>
          <CardDescription>
            Te enviamos un enlace mágico a tu email. Sin contraseñas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <p className="text-sm">
              Revisa tu correo (<span className="font-medium">{email}</span>) y
              abre el enlace para entrar.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Enviando…" : "Enviar enlace mágico"}
              </Button>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
