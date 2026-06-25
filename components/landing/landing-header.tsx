"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/landing/logo";

const NAV = [
  { href: "#problema", label: "El problema" },
  { href: "#solucion", label: "La solución" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#diferencia", label: "Diferencia" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-colors duration-300"
      style={
        scrolled
          ? {
              background: "color-mix(in oklab, var(--paper) 72%, transparent)",
              backdropFilter: "blur(16px) saturate(1.2)",
              borderBottom: "1px solid var(--line)",
            }
          : { borderBottom: "1px solid transparent" }
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Demiurgos, inicio">
          <Logo size={32} className="[filter:drop-shadow(0_4px_12px_rgba(34,214,122,0.35))]" />
          <span className="text-[1.05rem] font-semibold tracking-tight">Demiurgos</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Secciones">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-[var(--green)]"
              style={{ color: "var(--ink-soft)" }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link href="/login" className="dmg-cta h-9 px-4 py-0 text-sm">
          Empezar gratis
        </Link>
      </div>
    </header>
  );
}
