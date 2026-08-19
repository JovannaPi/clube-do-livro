"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save, BookOpen, Mail, Lock, CheckCircle2 } from "lucide-react";
import { listenCapitulo, salvarCapitulo, registrarAtividade, atualizarLivro } from "@/lib/db";
import { useCapituloLembrado } from "@/hooks/useCapituloLembrado";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { Livro, Capitulo, UserId } from "@/types";

const EMOCOES = ["❤️","😭","😲","😡","🤔","😂","😰","🥰","😤","🤯"];

interface Props { livroAtual?: Livro; usuario: UserId; }

export default function ModuloDiario({ livroAtual, usuario }: Props) {
  const [capNum, setCapNum] = useCapituloLembrado(livroAtual?.id, usuario);
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
      {/* Carta pro futuro, só enquanto ainda não foi selada — depois de selar isso vai lá pro final */}
      {!(usuario === "jovanna" ? livroAtual.cartaJovannaEnviada : livroAtual.cartaLeticiaEnviada) && (
        <CartaFormulario livro={livroAtual} usuario={usuario} />
      )}

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

      {/* Depois de selada, a carta some do topo e vira só um lembrete aqui embaixo */}
      {(usuario === "jovanna" ? livroAtual.cartaJovannaEnviada : livroAtual.cartaLeticiaEnviada) && (
        <CartaStatus livro={livroAtual} usuario={usuario} />
      )}

      {/* Terminar de ler, sempre por último — é o fim natural da leitura */}
      <NotasFinais livro={livroAtual} usuario={usuario} />
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

function CartaFormulario({ livro, usuario }: { livro: Livro; usuario: UserId }) {
  const [carta, setCarta] = useState(usuario === "jovanna" ? livro.cartaJovanna ?? "" : livro.cartaLeticia ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    const campo = usuario === "jovanna" ? "cartaJovanna" : "cartaLeticia";
    const campoEnviada = usuario === "jovanna" ? "cartaJovannaEnviada" : "cartaLeticiaEnviada";
    await atualizarLivro(livro.id, { [campo]: carta, [campoEnviada]: true } as Partial<Livro>);
    await registrarAtividade({ tipo: "carta", usuario, livroId: livro.id, livroTitulo: livro.titulo });
    setSalvando(false);
  }

  return (
    <section className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-[#e07a5f]" />
        <h2 className="font-semibold text-sm text-[#2d2d2d] dark:text-zinc-100">Carta para o futuro</h2>
      </div>
      <p className="text-xs text-[#9a8f8f]">O que você espera deste livro? Fica selado até vocês duas terminarem.</p>
      <textarea className="textarea" rows={2} placeholder="O que você espera deste livro?"
        value={carta} onChange={e => setCarta(e.target.value)} />
      <button onClick={salvar} disabled={salvando || !carta.trim()} className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5 w-full justify-center">
        <Lock size={13}/> Selar carta
      </button>
    </section>
  );
}

function CartaStatus({ livro, usuario }: { livro: Livro; usuario: UserId }) {
  const outra: UserId = usuario === "jovanna" ? "leticia" : "jovanna";
  const nomeOutra = outra === "jovanna" ? "Jovanna" : "Leticia";
  const outraEnviou = outra === "jovanna" ? livro.cartaJovannaEnviada : livro.cartaLeticiaEnviada;
  const ambasEnviaram = livro.cartaJovannaEnviada && livro.cartaLeticiaEnviada;
  const reveladas = livro.status === "concluido" && ambasEnviaram;

  if (reveladas) {
    return (
      <section className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-[#e07a5f]" />
          <h2 className="font-semibold text-sm text-[#2d2d2d] dark:text-zinc-100">Cartas escritas antes de começar</h2>
        </div>
        <div className="bg-[#fdf0ec] dark:bg-zinc-800 rounded-xl p-3">
          <p className="text-xs font-medium text-[#e07a5f] mb-1">Jovanna:</p>
          <p className="text-sm italic text-gray-700 dark:text-zinc-300">&ldquo;{livro.cartaJovanna}&rdquo;</p>
        </div>
        <div className="bg-[#eef5f1] dark:bg-zinc-800 rounded-xl p-3">
          <p className="text-xs font-medium text-[#5f8f7a] mb-1">Leticia:</p>
          <p className="text-sm italic text-gray-700 dark:text-zinc-300">&ldquo;{livro.cartaLeticia}&rdquo;</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card p-4 flex items-center gap-2 text-xs text-[#9a8f8f]">
      <Lock size={13} />
      Sua carta está selada. {outraEnviou ? "Vai revelar quando o livro for concluído." : `Esperando ${nomeOutra} escrever a dela.`}
    </section>
  );
}

function NotasFinais({ livro, usuario }: { livro: Livro; usuario: UserId }) {
  const minhaNota = usuario === "jovanna" ? livro.notaJovanna : livro.notaLeticia;
  const [nota, setNota] = useState<number>(minhaNota ?? 5);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [capsRespondidos, setCapsRespondidos] = useState(0);

  useEffect(() => { setNota(minhaNota ?? 5); }, [livro.id, minhaNota]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "livros", livro.id, "capitulos"), snap => {
      const respondidos = snap.docs.filter(d => d.data()[`${usuario}_enviou`]).length;
      setCapsRespondidos(respondidos);
    });
    return () => unsub();
  }, [livro.id, usuario]);

  const outra: UserId = usuario === "jovanna" ? "leticia" : "jovanna";
  const notaOutra = outra === "jovanna" ? livro.notaJovanna : livro.notaLeticia;
  const cor = usuario === "jovanna" ? "#e07a5f" : "#81b29a";
  const totalCapitulos = livro.totalCapitulos ?? 0;
  const todosRespondidos = totalCapitulos > 0 && capsRespondidos >= totalCapitulos;

  if (minhaNota != null) {
    return (
      <section className="card p-4 text-xs text-[#9a8f8f]">
        Você já deu sua nota final: <strong style={{ color: cor }}>{minhaNota}/10</strong>.
        {notaOutra == null && ` Assim que ${outra === "jovanna" ? "Jovanna" : "Leticia"} terminar de ler, o livro fica concluído.`}
      </section>
    );
  }

  if (!todosRespondidos) {
    return (
      <section className="card p-4 space-y-2 text-xs text-[#9a8f8f]">
        <p className="flex items-center gap-1.5"><Lock size={12} /> Termine a teoria secreta de todos os capítulos pra poder concluir o livro.</p>
        {totalCapitulos > 0 && (
          <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.round((capsRespondidos / totalCapitulos) * 100)}%`, backgroundColor: cor }} />
          </div>
        )}
        <p>{capsRespondidos} de {totalCapitulos || "?"} capítulos com teoria enviada no Secreto.</p>
      </section>
    );
  }

  async function salvar() {
    setSalvando(true);
    const hoje = new Date().toISOString().split("T")[0];
    const campoNota = usuario === "jovanna" ? "notaJovanna" : "notaLeticia";
    const campoData = usuario === "jovanna" ? "dataFimJovanna" : "dataFimLeticia";
    const outraJaLeu = notaOutra != null;
    await atualizarLivro(livro.id, {
      [campoNota]: nota,
      [campoData]: hoje,
      status: outraJaLeu ? "concluido" : "trocar",
      leitorAtual: undefined,
    } as Partial<Livro>);
    await registrarAtividade({ tipo: "nota", usuario, livroId: livro.id, livroTitulo: livro.titulo });
    if (outraJaLeu) {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ["#e07a5f", "#81b29a", "#fdf0ec"] });
    }
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <section className="card p-5 space-y-4" style={{ borderTop: `3px solid ${cor}` }}>
      <h2 className="font-semibold text-[#2d2d2d] dark:text-zinc-100 flex items-center gap-1.5">
        <CheckCircle2 size={16} style={{ color: cor }} /> Terminei de ler {livro.titulo}
      </h2>
      <p className="text-xs text-[#9a8f8f]">Dê sua nota final. O livro vai pra fila de troca até {outra === "jovanna" ? "Jovanna" : "Leticia"} também terminar.</p>
      <NotaSlider value={nota} onChange={setNota} cor={cor} />
      <button onClick={salvar} disabled={salvando} className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={15}/>
        {salvando ? "Salvando..." : salvo ? "✓ Salvo!" : "Terminei — salvar nota"}
      </button>
    </section>
  );
}

function NotaSlider({ value, onChange, cor }: { value: number; onChange: (n: number) => void; cor: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-center items-center">
        <span className="text-3xl font-bold" style={{ color: cor }}>{value}<span className="text-sm font-normal text-gray-300">/10</span></span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full" style={{ accentColor: cor }} />
      <div className="flex justify-between text-xs text-gray-300">
        {[0,1,2,3,4,5,6,7,8,9,10].map(n=><span key={n}>{n}</span>)}
      </div>
    </div>
  );
}
