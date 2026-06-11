"use client";

import { useState, useEffect } from "react";
import { Trophy, Save } from "lucide-react";
import { listenPremiacao, salvarPremiacao } from "@/lib/db";
import type { Livro, Premiacao, UserId } from "@/types";

interface Props { livroAtual?: Livro; usuario: UserId; }

const CATEGORIAS = [
  { key: "melhorPersonagem", label: "🏆 Melhor personagem", placeholder: "Nome do personagem..." },
  { key: "cenaFavorita",     label: "🎬 Cena favorita",     placeholder: "Descreva a cena..." },
  { key: "teoriaMaisLoucas", label: "🤯 Teoria mais maluca", placeholder: "Sua teoria mais absurda..." },
  { key: "maiorSurpresa",    label: "😲 Maior surpresa",    placeholder: "O que te surpreendeu mais?" },
] as const;

type CatKey = typeof CATEGORIAS[number]["key"];

export default function ModuloPremiacao({ livroAtual, usuario }: Props) {
  const [premiacao, setPremiacao] = useState<Premiacao | null>(null);
  const [form, setForm] = useState<Partial<Record<CatKey, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!livroAtual) return;
    const unsub = listenPremiacao(livroAtual.id, (p) => {
      setPremiacao(p);
      const vals: Partial<Record<CatKey, string>> = {};
      CATEGORIAS.forEach(({ key }) => {
        vals[key] = (p[key] as Record<string, string>)?.[usuario] ?? "";
      });
      setForm(vals);
    });
    return () => unsub();
  }, [livroAtual, usuario]);

  async function salvar() {
    if (!livroAtual) return;
    setSalvando(true);
    const data: Partial<Premiacao> = {};
    CATEGORIAS.forEach(({ key }) => {
      data[key] = { ...(premiacao?.[key] as Record<string,string> ?? {}), [usuario]: form[key] ?? "" };
    });
    await salvarPremiacao(livroAtual.id, data);
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  if (!livroAtual) {
    return (
      <div className="text-center py-16 text-[#9a8f8f]">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-sm">Nenhum livro em leitura.</p>
      </div>
    );
  }

  const outra: UserId = usuario === "jovanna" ? "leticia" : "jovanna";
  const nomeOutra = outra === "jovanna" ? "Jovanna" : "Leticia";
  const corOutra = outra === "jovanna" ? "#e07a5f" : "#81b29a";

  return (
    <div className="space-y-5">
      <div className="card p-4 flex items-center gap-3 border-t-4 border-yellow-400">
        <Trophy size={24} className="text-yellow-500" />
        <div>
          <p className="font-semibold">{livroAtual.titulo}</p>
          <p className="text-xs text-[#9a8f8f]">Premiações do livro</p>
        </div>
      </div>

      {CATEGORIAS.map(({ key, label, placeholder }) => {
        const respostaOutra = (premiacao?.[key] as Record<string,string>)?.[outra];
        return (
          <div key={key} className="card p-5 space-y-3">
            <label className="text-sm font-medium text-[#2d2d2d]">{label}</label>
            <textarea className="textarea" rows={2} placeholder={placeholder}
              value={form[key] ?? ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            {respostaOutra && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium mb-1" style={{ color: corOutra }}>{nomeOutra} escolheu:</p>
                <p className="text-sm text-[#2d2d2d]">{respostaOutra}</p>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={salvar} disabled={salvando}
        className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={16} />
        {salvando ? "Salvando..." : salvo ? "✓ Salvo!" : "Salvar premiações"}
      </button>
    </div>
  );
}
