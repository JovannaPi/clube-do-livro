"use client";
import { useState, useEffect } from "react";
import type { UserId } from "@/types";

export function useUsuario() {
  const [usuario, setUsuarioState] = useState<UserId>("jovanna");

  useEffect(() => {
    const saved = localStorage.getItem("cdl_usuario") as UserId | null;
    if (saved === "jovanna" || saved === "leticia") setUsuarioState(saved);
  }, []);

  function setUsuario(u: UserId) {
    localStorage.setItem("cdl_usuario", u);
    setUsuarioState(u);
  }

  return { usuario, setUsuario };
}
