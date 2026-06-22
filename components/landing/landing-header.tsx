"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

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
              background: "color-mix(in oklab, var(--paper) 78%, transparent)",
              backdropFilter: "blur(14px)",
              borderBottom: "1px solid var(--line)",
            }
          : { borderBottom: "1px solid transparent" }
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Demiurgos, inicio">
          <Logo />
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

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login" className="dmg-cta hidden h-9 px-4 py-0 text-sm sm:inline-flex">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span
      className="grid size-7 place-items-center rounded-[8px]"
      style={{
        background: "linear-gradient(150deg, var(--green) 0%, var(--violet) 130%)",
        boxShadow: "0 4px 14px -6px color-mix(in oklab, var(--green) 70%, transparent)",
      }}
      aria-hidden
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 4v10l-7 4-7-4V7z" />
        <path d="M12 8v8M8.5 9.5l7 5M15.5 9.5l-7 5" opacity="0.85" />
      </svg>
    </span>
  );
}
