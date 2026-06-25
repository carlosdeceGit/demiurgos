"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

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

type Mode = "signin" | "signup" | "magic";
type Status = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function reset(nextMode: Mode) {
    setMode(nextMode);
    setStatus("idle");
    setError(null);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(translateError(error.message));
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(translateError(error.message));
        setStatus("error");
      } else {
        router.push("/dashboard");
      }
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      setError(translateError(error.message));
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  const isMagic = mode === "magic";
  const isSignup = mode === "signup";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      {/* Resplandor de marca */}
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
            <CardTitle className="font-serif text-2xl font-semibold tracking-tight">
              {isSignup ? (
                <>
                  Crea tu <span className="text-primary italic">cuenta</span>
                </>
              ) : (
                <>
                  Entra a tu <span className="text-primary italic">panel</span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isMagic
                ? "Te mandamos un enlace mágico al correo. Sin contraseñas."
                : isSignup
                ? "Elige una contraseña segura para tu cuenta."
                : "Usa tu correo y contraseña para acceder."}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {/* Estado: enviado */}
            {status === "sent" ? (
              <SentConfirmation
                email={email}
                isSignup={isSignup}
                isMagic={isMagic}
                onBack={() => setStatus("idle")}
              />
            ) : isMagic ? (
              /* Formulario magic link */
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                <EmailInput value={email} onChange={setEmail} />
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-10 gap-2"
                >
                  {status === "loading" ? (
                    "Enviando…"
                  ) : (
                    <>
                      Enviar enlace mágico
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                <ErrorMessage message={error} />
              </form>
            ) : (
              /* Formulario contraseña */
              <form
                onSubmit={handlePasswordSubmit}
                className="flex flex-col gap-3"
              >
                <EmailInput value={email} onChange={setEmail} />
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  label={isSignup ? "Contraseña nueva" : "Contraseña"}
                />
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-10 gap-2"
                >
                  {status === "loading" ? (
                    "Entrando…"
                  ) : isSignup ? (
                    <>
                      Crear cuenta
                      <ArrowRight className="size-4" />
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                <ErrorMessage message={error} />
              </form>
            )}

            {/* Separador y alternativas */}
            {status !== "sent" && (
              <div className="flex flex-col gap-2 pt-1">
                <div className="relative flex items-center gap-3">
                  <div className="border-border h-px flex-1 border-t" />
                  <span className="text-muted-foreground text-xs">o</span>
                  <div className="border-border h-px flex-1 border-t" />
                </div>

                <div className="flex flex-col gap-1.5 text-center">
                  {!isMagic && (
                    <button
                      type="button"
                      onClick={() => reset("magic")}
                      className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                    >
                      Prefiero un enlace mágico
                    </button>
                  )}
                  {isMagic && (
                    <button
                      type="button"
                      onClick={() => reset("signin")}
                      className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                    >
                      Usar contraseña
                    </button>
                  )}
                  {!isMagic && (
                    <button
                      type="button"
                      onClick={() => reset(isSignup ? "signin" : "signup")}
                      className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                    >
                      {isSignup
                        ? "Ya tengo cuenta — entrar"
                        : "¿No tienes cuenta? Regístrate"}
                    </button>
                  )}
                </div>
              </div>
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

/* ── Subcomponentes ─────────────────────────────────────────── */

function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <label htmlFor="email" className="sr-only">
        Correo electrónico
      </label>
      <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="tu@email.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
      />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggleShow,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  label: string;
}) {
  return (
    <div className="relative">
      <label htmlFor="password" className="sr-only">
        {label}
      </label>
      <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <input
        id="password"
        type={show ? "text" : "password"}
        required
        minLength={8}
        autoComplete="current-password"
        placeholder="••••••••"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border bg-transparent pr-9 pl-9 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
      >
        {show ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}

function SentConfirmation({
  email,
  isSignup,
  isMagic,
  onBack,
}: {
  email: string;
  isSignup: boolean;
  isMagic: boolean;
  onBack: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-2 text-center"
      aria-live="polite"
    >
      <span className="bg-primary/15 text-primary grid size-11 place-items-center rounded-full">
        <Check className="size-5" strokeWidth={2.4} />
      </span>
      <p className="text-sm">
        {isMagic ? (
          <>
            Revisa <span className="font-medium">{email}</span> y abre el
            enlace para entrar.
          </>
        ) : isSignup ? (
          <>
            Cuenta creada. Revisa <span className="font-medium">{email}</span>{" "}
            para confirmar tu correo.
          </>
        ) : null}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
      >
        Volver
      </button>
    </div>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-sm" aria-live="assertive">
      {message}
    </p>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (msg.includes("Email not confirmed"))
    return "Confirma tu correo antes de entrar.";
  if (msg.includes("User already registered"))
    return "Ya existe una cuenta con ese correo.";
  if (msg.includes("Password should be at least"))
    return "La contraseña debe tener al menos 8 caracteres.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Demasiados intentos. Espera unos minutos.";
  return msg;
}
