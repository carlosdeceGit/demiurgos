"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Retraso en segundos para escalonar elementos de una misma fila. */
  delay?: number;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  as?: "div" | "li" | "section";
};

/**
 * Envoltorio de aparición al hacer scroll. Suave, una sola vez, y respeta
 * la preferencia de movimiento reducido del sistema.
 */
export function Reveal({ children, className, delay = 0, y = 22, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.5, 0.25, 1] }}
    >
      {children}
    </MotionTag>
  );
}
