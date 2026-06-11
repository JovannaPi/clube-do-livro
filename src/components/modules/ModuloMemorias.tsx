"use client";

import { useState, useEffect } from "react";
import { BookOpen, Heart, Star } from "lucide-react";
import { listenPremiacao } from "@/lib/db";
import type { Livro, Premiacao } from "@/types";

interface Props { livros: Livro[]; }

export default function ModuloMemorias({ livros }: Props) {
  const concluidos = livros.filter(l => l.status === "concluido");

  if (concluidos.length === 0) {
    return (
      <div className="text-center py-16 text-[#9a8f8f]">
        <p className="text-4xl mb-3">💌</p>
        <p className="text-sm">Concluam o primeiro livro para criar memórias!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#9a8f8f] text-center">Cada livro que vivemos juntas ♥</p>
      {concluidos.map(l => (
        <MemoriaCard key={l.id} livro={l} />
      ))}
    </div>
  );
}

function MemoriaCard({ livro }: { livro: Livro }) {
  const [premiacao, setPremiacao] = useState<Premiacao | null>(null);

  useEffect(() => {
    const unsub = listenPremiacao(livro.id, setPremiacao);
    return () => unsub();
  }, [livro.id]);

  const mediaNotas = [livro.notaJovanna, livro.notaLeticia].filter(Boolean);
  const media = mediaNotas.length ? (mediaNotas.reduce((s, n) => s! + n!, 0)! / mediaNotas.length).toFixed(1) : null;

  const melhorPersonagemJ = (premiacao?.melhorPersonagem as Record<string,string>)?.jovanna;
  const melhorPersonagemL = (premiacao?.melhorPersonagem as Record<string,string>)?.leticia;
  const teoriasL = (premiacao?.teoriaMaisLoucas as Record<string,string>)?.leticia;
  const teoriasJ = (premiacao?.teoriaMaisLoucas as Record<string,string>)?.jovanna;

  return (
    <div className="card overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#fdf0ec] to-[#eef5f1] p-5 flex gap-4">
        {livro.capaUrl
          ? <img src={livro.capaUrl} alt="" className="w-16 h-22 object-cover rounded-lg shadow-sm flex-shrink-0" style={{ height: "88px" }} />
          : <div className="w-16 flex-shrink-0 flex items-center justify-center"><BookOpen size={24} className="text-gray-300"/></div>
        }
        <div>
          <p className="font-serif text-xl font-semibold text-[#2d2d2d]">📖 {livro.titulo}</p>
          <p className="text-sm text-[#9a8f8f] italic">{livro.autor}</p>
          {livro.dataInicio && livro.dataFim && (
            <p className="text-xs text-[#9a8f8f] mt-1">
              {livro.dataInicio} → {livro.dataFim}
            </p>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="p-5 space-y-4">
        <div className="flex gap-4 flex-wrap">
          {livro.notaJovanna != null && (
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-[#e07a5f]" />
              <span className="text-sm"><span className="text-[#e07a5f] font-medium">Jovanna:</span> {livro.notaJovanna}/10</span>
            </div>
          )}
          {livro.notaLeticia != null && (
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-[#81b29a]" />
              <span className="text-sm"><span className="text-[#81b29a] font-medium">Leticia:</span> {livro.notaLeticia}/10</span>
            </div>
          )}
          {media && (
            <div className="ml-auto flex items-center gap-1">
              <Heart size={12} className="text-pink-400" />
              <span className="text-xs text-[#9a8f8f]">Média: {media}</span>
            </div>
          )}
        </div>

        {/* Premiações */}
        {(melhorPersonagemJ || melhorPersonagemL) && (
          <MemoriaLinha label="🏆 Melhor personagem"
            jovanna={melhorPersonagemJ} leticia={melhorPersonagemL} />
        )}
        {(teoriasJ || teoriasL) && (
          <MemoriaLinha label="🤯 Teoria mais maluca"
            jovanna={teoriasJ} leticia={teoriasL} />
        )}

        {/* Cartas do futuro - se existirem */}
        {livro.cartaJovannaEnviada && livro.cartaLeticiaEnviada && (
          <div className="bg-[#fdf0ec] rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-[#e07a5f]">💌 Cartas do futuro reveladas</p>
            {livro.cartaJovanna && <p className="text-xs text-gray-600 italic">Jovanna: "{livro.cartaJovanna}"</p>}
            {livro.cartaLeticia && <p className="text-xs text-gray-600 italic">Leticia: "{livro.cartaLeticia}"</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function MemoriaLinha({ label, jovanna, leticia }: { label: string; jovanna?: string; leticia?: string }) {
  return (
    <div className="border-l-2 border-gray-100 pl-3 space-y-1">
      <p className="text-xs font-medium text-[#9a8f8f]">{label}</p>
      {jovanna && <p className="text-xs"><span className="text-[#e07a5f]">Jovanna:</span> {jovanna}</p>}
      {leticia  && <p className="text-xs"><span className="text-[#81b29a]">Leticia:</span> {leticia}</p>}
    </div>
  );
}
