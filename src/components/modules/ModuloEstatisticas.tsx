"use client";

import { BookOpen, Star, Heart, CheckCircle } from "lucide-react";
import type { Livro } from "@/types";

interface Props { livros: Livro[]; }

export default function ModuloEstatisticas({ livros }: Props) {
  const concluidos = livros.filter(l => l.status === "concluido");

  const mediaJovanna = concluidos.filter(l => l.notaJovanna != null).length
    ? (concluidos.reduce((s, l) => s + (l.notaJovanna ?? 0), 0) / concluidos.filter(l => l.notaJovanna != null).length).toFixed(1)
    : "—";

  const mediaLeticia = concluidos.filter(l => l.notaLeticia != null).length
    ? (concluidos.reduce((s, l) => s + (l.notaLeticia ?? 0), 0) / concluidos.filter(l => l.notaLeticia != null).length).toFixed(1)
    : "—";

  const generosMap: Record<string, number> = {};
  concluidos.forEach(l => { if (l.genero) generosMap[l.genero] = (generosMap[l.genero] ?? 0) + 1; });
  const generoFav = Object.entries(generosMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const sugestoes = { jovanna: livros.filter(l => l.sugeridoPor === "jovanna").length, leticia: livros.filter(l => l.sugeridoPor === "leticia").length };

  return (
    <div className="space-y-6">
      {/* Casal */}
      <section>
        <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Do casal</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<BookOpen size={20} className="text-[#e07a5f]" />} label="Livros lidos juntas" value={String(concluidos.length)} />
          <StatCard icon={<Heart size={20} className="text-pink-400" />} label="Gênero favorito" value={generoFav} small />
          <StatCard icon={<Star size={20} className="text-yellow-400" />} label="Nota média Jovanna" value={mediaJovanna} />
          <StatCard icon={<Star size={20} className="text-[#81b29a]" />} label="Nota média Leticia" value={mediaLeticia} />
        </div>
      </section>

      {/* Sugestões */}
      <section>
        <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Sugestões</h2>
        <div className="card p-5 space-y-3">
          <SugestaoBar nome="Jovanna" qtd={sugestoes.jovanna} total={livros.length} cor="#e07a5f" />
          <SugestaoBar nome="Leticia"  qtd={sugestoes.leticia}  total={livros.length} cor="#81b29a" />
        </div>
      </section>

      {/* Histórico de notas */}
      {concluidos.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Notas por livro</h2>
          <div className="space-y-2">
            {concluidos.map(l => (
              <div key={l.id} className="card p-4 flex items-center gap-3">
                {l.capaUrl
                  ? <img src={l.capaUrl} alt="" className="w-10 h-14 object-cover rounded" />
                  : <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center"><BookOpen size={14} className="text-gray-300"/></div>
                }
                <div className="flex-1">
                  <p className="font-medium text-sm">{l.titulo}</p>
                  <div className="flex gap-3 text-xs mt-1">
                    <span className="text-[#e07a5f]">Jovanna: {l.notaJovanna ?? "—"}</span>
                    <span className="text-[#81b29a]">Leticia: {l.notaLeticia ?? "—"}</span>
                  </div>
                </div>
                {l.dataFim && <span className="text-xs text-[#9a8f8f]">{l.dataFim}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {concluidos.length === 0 && (
        <div className="text-center py-16 text-[#9a8f8f]">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">Concluam o primeiro livro para ver as estatísticas!</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      {icon}
      <p className="text-xs text-[#9a8f8f]">{label}</p>
      <p className={`font-semibold text-[#2d2d2d] ${small ? "text-base" : "text-2xl"}`}>{value}</p>
    </div>
  );
}

function SugestaoBar({ nome, qtd, total, cor }: { nome: string; qtd: number; total: number; cor: string }) {
  const pct = total ? Math.round((qtd / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium" style={{ color: cor }}>{nome}</span>
        <span className="text-[#9a8f8f]">{qtd} sugestões ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: cor }} />
      </div>
    </div>
  );
}
