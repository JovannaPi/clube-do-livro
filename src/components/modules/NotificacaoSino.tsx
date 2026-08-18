"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { listenAtividades } from "@/lib/db";
import type { Atividade, UserId } from "@/types";

interface Props { usuario: UserId; }

const LABELS: Record<Atividade["tipo"], string> = {
  diario: "escreveu no diário",
  secreto: "enviou uma teoria secreta",
  carta: "selou uma carta para o futuro",
  comentario: "comentou",
  troca: "começou a ler o livro que você passou pra ela",
  nota: "terminou um livro e deu a nota final",
};

export default function NotificacaoSino({ usuario }: Props) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [open, setOpen] = useState(false);
  const [ultimaVista, setUltimaVista] = useState<string>("");

  useEffect(() => {
    const unsub = listenAtividades(setAtividades);
    setUltimaVista(localStorage.getItem(`ultima-vista-${usuario}`) ?? "");
    return () => unsub();
  }, [usuario]);

  const daOutra = atividades.filter(a => a.usuario !== usuario);
  const naoLidas = daOutra.filter(a => a.criadoEm > ultimaVista).length;

  function abrir() {
    setOpen(o => !o);
    if (!open && daOutra.length > 0) {
      const maisRecente = daOutra[0].criadoEm;
      localStorage.setItem(`ultima-vista-${usuario}`, maisRecente);
      setUltimaVista(maisRecente);
    }
  }

  function nomeUsuario(u: UserId) {
    return u === "jovanna" ? "Jovanna" : "Leticia";
  }

  function formatarData(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " +
           d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="relative">
      <button
        onClick={abrir}
        className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200 shadow-sm"
        title="Atividades recentes"
      >
        <Bell size={18} />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#e07a5f] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 animate-fade-in">
          <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-[#2d2d2d] dark:text-zinc-100">Atividades recentes</p>
          </div>
          {daOutra.length === 0 ? (
            <p className="text-xs text-[#9a8f8f] p-4 text-center">Nada por aqui ainda.</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {daOutra.map(a => (
                <div key={a.id} className="p-3 text-xs">
                  <p className="text-[#2d2d2d] dark:text-zinc-200">
                    <span className="font-semibold">{nomeUsuario(a.usuario)}</span> {LABELS[a.tipo]}
                    {a.capitulo ? ` (Cap. ${a.capitulo})` : ""}
                  </p>
                  <p className="text-[#9a8f8f] mt-0.5">{a.livroTitulo} · {formatarData(a.criadoEm)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}