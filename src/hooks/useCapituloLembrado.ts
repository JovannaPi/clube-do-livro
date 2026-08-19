"use client";
import { useState, useEffect } from "react";
import type { UserId } from "@/types";

// Lembra em qual capítulo cada usuária parou, por livro, salvando no localStorage.
export function useCapituloLembrado(livroId: string | undefined, usuario: UserId) {
  const [capNum, setCapNumState] = useState(1);

  useEffect(() => {
    if (!livroId) return;
    const salvo = localStorage.getItem(`cdl_capitulo_${livroId}_${usuario}`);
    setCapNumState(salvo ? Number(salvo) : 1);
  }, [livroId, usuario]);

  function setCapNum(updater: number | ((n: number) => number)) {
    setCapNumState(prev => {
      const next = typeof updater === "function" ? (updater as (n: number) => number)(prev) : updater;
      if (livroId) localStorage.setItem(`cdl_capitulo_${livroId}_${usuario}`, String(next));
      return next;
    });
  }

  return [capNum, setCapNum] as const;
}
