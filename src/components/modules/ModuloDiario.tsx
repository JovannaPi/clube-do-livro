"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save, BookOpen } from "lucide-react";
import { listenCapitulo, salvarCapitulo, registrarAtividade } from "@/lib/db";
import type { Livro, Capitulo, UserId } from "@/types";

const EMOCOES = ["❤️","😭","😲","😡","🤔","😂","😰","🥰","😤","🤯"];

interface Props { livroAtual?: Livro; usuario: UserId; }

export default function ModuloDiario({ livroAtual, usuario }: Props) {
  const [capNum, setCapNum] = useState(1);
  const [dados, setDados] = useState<Capitulo>({ numero: 1 });
  const [impressao, setImpressao] = useState("");
  const [emocoes, setEmocoes] = useState<string[]>([]);
  const [frase, setFrase] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!livroAtual) return;
    const unsub = listenCapitulo(livroAtual.id, capNum, (cap) => {
      setDados(cap);
      setImpressao(cap[`impressao_${usuario}` as keyof Capitulo] as string ?? "");
      setEmocoes((cap[`emocoes_${usuario}` as keyof Capitulo] as string[]) ?? []);
      setFrase(cap[`frase_${usuario}` as keyof Capitulo] as string ?? "");
    });
    return () => unsub();
  }, [livroAtual, capNum, usuario]);

  async function salvar() {
  if (!livroAtual) return;
  setSalvando(true);
  await salvarCapitulo(livroAtual.id, capNum, {
    [`impressao_${usuario}`]: impressao,
    [`emocoes_${usuario}`]: emocoes,
    [`frase_${usuario}`]: frase,
  } as Partial<Capitulo>);
  await registrarAtividade({
    tipo: "diario",
    usuario,
    livroId: livroAtual.id,
    livroTitulo: livroAtual.titulo,
    capitulo: capNum,
  });
  setSalvando(false);
  setSalvo(true);
  setTimeout(() => setSalvo(false), 2000);
}

  function toggleEmocao(e: string) {
    setEmocoes(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }

  const maxCap = livroAtual?.totalCapitulos ?? 99;

  if (!livroAtual) {
    return <EmptyState msg="Nenhum livro em leitura. Defina o livro atual na Biblioteca." />;
  }

  return (
    <div className="space-y-5">
      {/* Nav capítulo */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-gray-100">
        <button onClick={() => setCapNum(n => Math.max(1, n-1))} disabled={capNum === 1}
          className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-serif font-semibold text-[#2d2d2d] dark:text-zinc-100">Capítulo {capNum}</p>
          <p className="text-xs text-[#9a8f8f]">{livroAtual.titulo}</p>
        </div>
        <button onClick={() => setCapNum(n => Math.min(maxCap, n+1))} disabled={capNum === maxCap}
          className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Impressão geral */}
      <div className="card p-5 space-y-2">
        <label className="text-sm font-medium text-[#2d2d2d] dark:text-zinc-100">Impressão geral</label>
        <textarea className="textarea" rows={4}
          placeholder="O que você achou deste capítulo?"
          value={impressao} onChange={e => setImpressao(e.target.value)}
        />
      </div>

      {/* Emoções */}
      <div className="card p-5">
        <label className="text-sm font-medium text-[#2d2d2d] dark:text-zinc-100 mb-3 block">Como você se sentiu?</label>
        <div className="flex flex-wrap gap-2">
          {EMOCOES.map(e => (
            <button key={e} onClick={() => toggleEmocao(e)}
              className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                emocoes.includes(e) ? "border-[#e07a5f] bg-[#fdf0ec] scale-110" : "border-transparent hover:border-gray-200"
              }`}>
              {e}
            </button>
          ))}
        </div>
        {emocoes.length > 0 && (
          <p className="text-xs text-[#9a8f8f] mt-2">Selecionado: {emocoes.join(" ")}</p>
        )}
      </div>

      {/* Frase favorita */}
      <div className="card p-5 space-y-2">
        <label className="text-sm font-medium text-[#2d2d2d] dark:text-zinc-100">Frase favorita</label>
        <textarea className="textarea" rows={2}
          placeholder='"A frase que mais te marcou neste capítulo..."'
          value={frase} onChange={e => setFrase(e.target.value)}
        />
      </div>

      <button onClick={salvar} disabled={salvando}
        className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={16} />
        {salvando ? "Salvando..." : salvo ? "✓ Salvo!" : "Salvar diário"}
      </button>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="text-center py-16 text-[#9a8f8f]">
      <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm">{msg}</p>
    </div>
  );
}
