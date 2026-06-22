"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // El tema real lo aplica el script anti-parpadeo del layout; aquí solo
    // sincronizamos el estado del icono tras montar.
    /* eslint-disable react-hooks/set-state-in-effect */
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dmg-theme", next ? "dark" : "light");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      {mounted && (dark ? <Sun className="size-4" /> : <Moon className="size-4" />)}
    </Button>
  );
}
