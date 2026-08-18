"use client";

import { useState, useEffect } from "react";
import { BookOpen, Star, Heart, Flame, Target, BarChart2, Award } from "lucide-react";
import { listenAtividades } from "@/lib/db";
import type { Livro, ConfigApp, Atividade, UserId } from "@/types";

interface Props { livros: Livro[]; config: ConfigApp | null; }

function calcularSequencia(atividades: Atividade[], usuario: UserId): number {
  const dias = new Set(
    atividades
      .filter(a => a.usuario === usuario && (a.tipo === "diario" || a.tipo === "secreto"))
      .map(a => a.criadoEm.split("T")[0])
  );
  if (dias.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  // Se ainda não escreveu hoje, a sequência conta a partir de ontem.
  if (!dias.has(cursor.toISOString().split("T")[0])) cursor.setDate(cursor.getDate() - 1);
  while (dias.has(cursor.toISOString().split("T")[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function ModuloEstatisticas({ livros, config }: Props) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  useEffect(() => {
    const unsub = listenAtividades(setAtividades);
    return () => unsub();
  }, []);

  const concluidos = livros.filter(l => l.status === "concluido");
  const anoAtual = new Date().getFullYear();
  const concluidosNoAno = concluidos.filter(l => {
    const fim = [l.dataFimJovanna, l.dataFimLeticia].filter(Boolean).sort().pop();
    return fim && new Date(fim).getFullYear() === anoAtual;
  }).length;
  const metaAnual = config?.metaAnual ?? 0;
  const pctMeta = metaAnual > 0 ? Math.min(100, Math.round((concluidosNoAno / metaAnual) * 100)) : 0;

  const sequenciaJovanna = calcularSequencia(atividades, "jovanna");
  const sequenciaLeticia = calcularSequencia(atividades, "leticia");

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

  const halDaFama = concluidos
    .map(l => {
      const notas = [l.notaJovanna, l.notaLeticia].filter(n => n != null) as number[];
      const media = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null;
      return { livro: l, media };
    })
    .filter(x => x.media != null)
    .sort((a, b) => (b.media ?? 0) - (a.media ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Meta anual */}
      {metaAnual > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Meta de {anoAtual}</h2>
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[#2d2d2d]">
                <Target size={16} className="text-[#e07a5f]" /> {concluidosNoAno} de {metaAnual} livros
              </div>
              <span className="text-sm font-bold text-[#e07a5f]">{pctMeta}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="h-3 rounded-full bg-[#e07a5f] transition-all duration-500" style={{ width: `${pctMeta}%` }} />
            </div>
          </div>
        </section>
      )}

      {/* Hall da fama */}
      {halDaFama.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Hall da fama</h2>
          <div className="space-y-2">
            {halDaFama.map(({ livro, media }, i) => (
              <div key={livro.id} className="card p-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: i === 0 ? "#fde68a" : i === 1 ? "#e5e7eb" : "#fdba74", color: "#7c5a00" }}>
                  {i + 1}º
                </div>
                {livro.capaUrl
                  ? <img src={livro.capaUrl} alt="" className="w-10 h-14 object-cover rounded flex-shrink-0" />
                  : <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center flex-shrink-0"><BookOpen size={14} className="text-gray-300"/></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{livro.titulo}</p>
                  <p className="text-xs text-[#9a8f8f] truncate">{livro.autor}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-[#e07a5f] flex-shrink-0">
                  <Award size={14} /> {media?.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sequência de leitura */}
      <section>
        <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Sequência de leitura</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Flame size={20} className="text-[#e07a5f]" />} label="Sequência de Jovanna" value={`${sequenciaJovanna} dia${sequenciaJovanna === 1 ? "" : "s"}`} small />
          <StatCard icon={<Flame size={20} className="text-[#81b29a]" />} label="Sequência de Leticia" value={`${sequenciaLeticia} dia${sequenciaLeticia === 1 ? "" : "s"}`} small />
        </div>
      </section>

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

      {/* Gêneros lidos */}
      {Object.keys(generosMap).length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Gêneros lidos</h2>
          <div className="card p-5 space-y-3">
            {Object.entries(generosMap).sort((a, b) => b[1] - a[1]).map(([genero, qtd]) => (
              <SugestaoBar key={genero} nome={genero} qtd={qtd} total={concluidos.length} cor="#e07a5f" />
            ))}
          </div>
        </section>
      )}

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
                {(l.dataFimJovanna || l.dataFimLeticia) && (
                  <span className="text-xs text-[#9a8f8f]">{[l.dataFimJovanna, l.dataFimLeticia].filter(Boolean).sort().pop()}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {concluidos.length === 0 && (
        <div className="text-center py-16 text-[#9a8f8f]">
          <BarChart2 size={36} className="mx-auto mb-3 text-gray-300" />
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
