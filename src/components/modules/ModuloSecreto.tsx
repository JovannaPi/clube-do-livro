"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, ChevronLeft, ChevronRight } from "lucide-react";
import { listenCapitulo, salvarCapitulo,  registrarAtividade} from "@/lib/db";
import { useCapituloLembrado } from "@/hooks/useCapituloLembrado";
import type { Livro, Capitulo, UserId } from "@/types";

interface Props { livroAtual?: Livro; usuario: UserId; }

export default function ModuloSecreto({ livroAtual, usuario }: Props) {
  const [capNum, setCapNum] = useCapituloLembrado(livroAtual?.id, usuario);
  const [dados, setDados] = useState<Capitulo>({ numero: 1 });
  const [teoria, setTeoria] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!livroAtual) return;
    const unsub = listenCapitulo(livroAtual.id, capNum, setDados);
    return () => unsub();
  }, [livroAtual, capNum]);

  async function enviar() {
    if (!livroAtual || !teoria.trim()) return;
    setEnviando(true);
    await salvarCapitulo(livroAtual.id, capNum, {
      [`teoria_${usuario}`]: teoria,
      [`${usuario}_enviou`]: true,
    } as Partial<Capitulo>);
    await registrarAtividade({
      tipo: "secreto",
      usuario,
      livroId: livroAtual.id,
      livroTitulo: livroAtual.titulo,
      capitulo: capNum,
    });
    setEnviando(false);
  }

  if (!livroAtual) {
    return <EmptyState />;
  }

  const outra: UserId = usuario === "jovanna" ? "leticia" : "jovanna";
  const euEnviei = dados[`${usuario}_enviou` as keyof Capitulo] as boolean;
  const outraEnviou = dados[`${outra}_enviou` as keyof Capitulo] as boolean;
  const ambasEnviaram = euEnviei && outraEnviou;
  const maxCap = livroAtual.totalCapitulos ?? 99;

  const nomeAtual = usuario === "jovanna" ? "Jovanna" : "Leticia";
  const nomeOutra = outra === "jovanna" ? "Jovanna" : "Leticia";
  const corAtual = usuario === "jovanna" ? "#e07a5f" : "#81b29a";
  const corOutra = outra === "jovanna" ? "#e07a5f" : "#81b29a";

  return (
    <div className="space-y-5">
      {/* Nav capítulo */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-gray-100">
        <button onClick={() => setCapNum(n => Math.max(1, n-1))} disabled={capNum === 1}
          className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-serif font-semibold">Capítulo {capNum}</p>
          <p className="text-xs text-[#9a8f8f]">{livroAtual.titulo}</p>
        </div>
        <button onClick={() => setCapNum(n => Math.min(maxCap, n+1))} disabled={capNum === maxCap}
          className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Status */}
      <div className="flex gap-3">
        <StatusPill nome="Jovanna" enviou={dados.jovanna_enviou} color="#e07a5f" />
        <StatusPill nome="Leticia"  enviou={dados.leticia_enviou}  color="#81b29a" />
      </div>

      {ambasEnviaram ? (
        /* Revelação */
        <div className="space-y-4">
          <div className="text-center py-4">
            <Unlock size={32} className="mx-auto text-yellow-500 mb-2" />
            <p className="font-serif text-xl font-semibold text-[#2d2d2d] dark:text-zinc-100">Revelado!</p>
            <p className="text-sm text-[#9a8f8f]">Ambas enviaram — hora de comparar!</p>
          </div>
          <RespostaCard
            nome={nomeAtual} cor={corAtual}
            teoria={dados[`teoria_${usuario}` as keyof Capitulo] as string}
            emocoes={dados[`emocoes_${usuario}` as keyof Capitulo] as string[]}
          />
          <RespostaCard
            nome={nomeOutra} cor={corOutra}
            teoria={dados[`teoria_${outra}` as keyof Capitulo] as string}
            emocoes={dados[`emocoes_${outra}` as keyof Capitulo] as string[]}
          />
        </div>
      ) : euEnviei ? (
        /* Aguardando */
        <div className="card p-8 text-center space-y-3">
          <Lock size={32} className="mx-auto text-[#e07a5f]" />
          <p className="font-medium text-[#2d2d2d] dark:text-zinc-100">Resposta travada</p>
          <p className="text-sm text-[#9a8f8f]">Aguardando {nomeOutra} enviar a dela...</p>
          <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2">
            <div className="bg-[#e07a5f] h-1.5 rounded-full w-1/2" />
          </div>
          <p className="text-xs text-[#9a8f8f]">1 de 2 respostas</p>
        </div>
      ) : (
        /* Formulário */
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#2d2d2d] dark:text-zinc-100">
            <Lock size={16} className="text-[#e07a5f]" />
            Sua teoria secreta
          </div>
          <textarea className="textarea" rows={5}
            placeholder="O que você acha que vai acontecer? Quem é o culpado? Qual a reviravolta?"
            value={teoria} onChange={e => setTeoria(e.target.value)}
          />
          <p className="text-xs text-[#9a8f8f]">
            Sua resposta fica bloqueada até {nomeOutra} também enviar a dela.
          </p>
          <button onClick={enviar} disabled={enviando || !teoria.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <Lock size={15} />
            {enviando ? "Travando..." : "Travar resposta"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ nome, enviou, color }: { nome: string; enviou?: boolean; color: string }) {
  return (
    <div className={`flex-1 flex items-center gap-2 p-3 rounded-xl border ${enviou ? "border-green-200 bg-green-50" : "border-gray-100 bg-white dark:bg-zinc-900"}`}>
      <div className={`w-2 h-2 rounded-full ${enviou ? "bg-green-400" : "bg-gray-200"}`} />
      <span className="text-sm font-medium" style={{ color: enviou ? "#16a34a" : "#9a8f8f" }}>{nome}</span>
      {enviou && <span className="text-xs text-green-600 ml-auto">✓ enviou</span>}
    </div>
  );
}

function RespostaCard({ nome, cor, teoria, emocoes }: { nome: string; cor: string; teoria?: string; emocoes?: string[] }) {
  return (
    <div className="card p-5" style={{ borderLeft: `3px solid ${cor}` }}>
      <p className="text-sm font-medium mb-2" style={{ color: cor }}>{nome}</p>
      {emocoes?.length ? <p className="text-lg mb-2">{emocoes.join(" ")}</p> : null}
      <p className="text-sm text-[#2d2d2d] dark:text-zinc-100">{teoria || <span className="italic text-[#9a8f8f]">(não preenchido)</span>}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-[#9a8f8f]">
      <Lock size={36} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm">Nenhum livro em leitura.</p>
    </div>
  );
}
