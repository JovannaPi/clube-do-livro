"use client";

import { useState, useEffect } from "react";
import { Save, Lock, Unlock, Camera, Mail, Download } from "lucide-react";
import { updateConfig, atualizarLivro, registrarAtividade} from "@/lib/db";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import type { ConfigApp, Livro, UserId } from "@/types";

interface Props { config: ConfigApp | null; livros: Livro[]; livroAtual?: Livro; usuario: UserId; }

export default function ModuloConfig({ config, livros, livroAtual, usuario }: Props) {
  const [nomeclube, setNome] = useState("");
  const [citacao, setCitacao] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [metaAnual, setMetaAnual] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [baixando, setBaixando] = useState(false);

  async function baixarBackup() {
    setBaixando(true);
    try {
      const livrosCompletos = await Promise.all(livros.map(async l => {
        const capsSnap = await getDocs(collection(db, "livros", l.id, "capitulos"));
        const capitulos = await Promise.all(capsSnap.docs.map(async c => {
          const comentariosSnap = await getDocs(collection(db, "livros", l.id, "capitulos", c.id, "comentarios"));
          return { ...c.data(), comentarios: comentariosSnap.docs.map(cm => cm.data()) };
        }));
        const premSnap = await getDoc(doc(db, "premiacoes", l.id));
        return { ...l, capitulos, premiacao: premSnap.exists() ? premSnap.data() : null };
      }));
      const backup = { exportadoEm: new Date().toISOString(), config, livros: livrosCompletos };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clube-do-livro-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBaixando(false);
    }
  }

  useEffect(() => {
    if (config) {
      setNome(config.nomeclube ?? "Clube do Livro ♥");
      setCitacao(config.citacaoFavorita ?? "");
      setFotoUrl(config.fotoUrl ?? "");
      setMetaAnual(config.metaAnual ?? 0);
    }
  }, [config]);

  async function salvarConfig() {
    setSalvando(true);
    await updateConfig({ nomeclube, citacaoFavorita: citacao, fotoUrl, metaAnual });
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  const concluidos = livros.filter(l => l.status === "concluido").length;

  return (
    <div className="space-y-6">
      {/* Personalização */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-[#2d2d2d] dark:text-zinc-100">Personalização</h2>
        <div className="space-y-2">
          <label className="text-xs text-[#9a8f8f] font-medium">Nome do clube</label>
          <input className="input" value={nomeclube} onChange={e => setNome(e.target.value)} placeholder="Clube do Livro ♥" />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9a8f8f] font-medium">Citação favorita (aparece no header)</label>
          <textarea className="textarea" rows={2} value={citacao} onChange={e => setCitacao(e.target.value)}
            placeholder="Uma citação que defina o clube..." />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9a8f8f] font-medium flex items-center gap-1"><Camera size={12}/> Foto do casal (URL, aparece no header)</label>
          <input className="input" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9a8f8f] font-medium">Meta de livros no ano ({new Date().getFullYear()})</label>
          <input className="input" type="number" min={0} value={metaAnual || ""} onChange={e => setMetaAnual(Number(e.target.value))} placeholder="Ex: 12" />
          {metaAnual > 0 && <p className="text-xs text-[#9a8f8f]">{concluidos} de {metaAnual} lidos até agora.</p>}
        </div>
        <button onClick={salvarConfig} disabled={salvando} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save size={15} />
          {salvando ? "Salvando..." : salvo ? "✓ Salvo!" : "Salvar configurações"}
        </button>
      </section>

      {/* Cartas do futuro */}
      {livroAtual && (
        <CartasFuturo livro={livroAtual} />
      )}

      {/* Notas finais */}
      {livroAtual && (
        <NotasFinais livro={livroAtual} usuario={usuario} />
      )}

      {/* Backup */}
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-[#2d2d2d] dark:text-zinc-100 flex items-center gap-2"><Download size={16} className="text-[#e07a5f]" /> Backup</h2>
        <p className="text-xs text-[#9a8f8f]">
          Baixa um arquivo com todos os livros, diários, teorias, comentários e premiações — uma cópia de segurança pra guardar por fora do Firebase.
        </p>
        <button onClick={baixarBackup} disabled={baixando} className="btn-ghost w-full flex items-center justify-center gap-2">
          <Download size={15} />
          {baixando ? "Gerando backup..." : "Baixar backup (.json)"}
        </button>
      </section>

      {/* Info */}
      <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 text-xs text-[#9a8f8f] space-y-1">
        <p className="font-medium text-gray-500 dark:text-zinc-400">Estrutura do Firestore</p>
        <p>• <code className="bg-gray-100 dark:bg-zinc-800 px-1 rounded">config/app</code> — configurações globais</p>
        <p>• <code className="bg-gray-100 dark:bg-zinc-800 px-1 rounded">livros/{"{id}"}</code> — dados dos livros</p>
        <p>• <code className="bg-gray-100 dark:bg-zinc-800 px-1 rounded">livros/{"{id}"}/capitulos/{"{n}"}</code> — diário + segredos</p>
        <p>• <code className="bg-gray-100 dark:bg-zinc-800 px-1 rounded">premiacoes/{"{livroId}"}</code> — premiações</p>
      </div>
    </div>
  );
}

function CartasFuturo({ livro }: { livro: Livro }) {
  const [cartaJ, setCartaJ] = useState(livro.cartaJovanna ?? "");
  const [cartaL, setCartaL] = useState(livro.cartaLeticia ?? "");
  const [salvando, setSalvando] = useState(false);

  const ambasEnviaram = livro.cartaJovannaEnviada && livro.cartaLeticiaEnviada;
  const reveladas = livro.status === "concluido" && ambasEnviaram;

  async function salvar(usuario: "jovanna" | "leticia") {
  setSalvando(true);
  if (usuario === "jovanna") {
    await atualizarLivro(livro.id, { cartaJovanna: cartaJ, cartaJovannaEnviada: true });
  } else {
    await atualizarLivro(livro.id, { cartaLeticia: cartaL, cartaLeticiaEnviada: true });
  }
  await registrarAtividade({
    tipo: "carta",
    usuario,
    livroId: livro.id,
    livroTitulo: livro.titulo,
  });
  setSalvando(false);
}

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Mail size={18} className="text-[#e07a5f]" />
        <h2 className="font-semibold text-[#2d2d2d] dark:text-zinc-100">Cartas para o futuro</h2>
      </div>
      <p className="text-xs text-[#9a8f8f]">
        Escrevam o que esperam do livro antes de começar. As cartas ficam bloqueadas e são reveladas quando concluírem.
      </p>

      {reveladas ? (
        <div className="space-y-3">
          <div className="bg-[#fdf0ec] rounded-xl p-4">
            <p className="text-xs font-medium text-[#e07a5f] mb-1">Jovanna escreveu:</p>
            <p className="text-sm italic text-gray-700 dark:text-zinc-300">"{livro.cartaJovanna}"</p>
          </div>
          <div className="bg-[#eef5f1] rounded-xl p-4">
            <p className="text-xs font-medium text-[#5f8f7a] mb-1">Leticia escreveu:</p>
            <p className="text-sm italic text-gray-700 dark:text-zinc-300">"{livro.cartaLeticia}"</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Jovanna */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#e07a5f]">Carta da Jovanna</label>
            {livro.cartaJovannaEnviada
              ? <p className="text-xs text-[#9a8f8f] flex items-center gap-1"><Lock size={12}/> Carta enviada e bloqueada</p>
              : <>
                  <textarea className="textarea" rows={3} placeholder="O que você espera deste livro?"
                    value={cartaJ} onChange={e => setCartaJ(e.target.value)} />
                  <button onClick={() => salvar("jovanna")} disabled={salvando} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                    <Lock size={13}/> Selar carta
                  </button>
                </>
            }
          </div>

          {/* Leticia */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#81b29a]">Carta da Leticia</label>
            {livro.cartaLeticiaEnviada
              ? <p className="text-xs text-[#9a8f8f] flex items-center gap-1"><Lock size={12}/> Carta enviada e bloqueada</p>
              : <>
                  <textarea className="textarea" rows={3} placeholder="O que você espera deste livro?"
                    value={cartaL} onChange={e => setCartaL(e.target.value)} />
                  <button onClick={() => salvar("leticia")} disabled={salvando} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5">
                    <Lock size={13}/> Selar carta
                  </button>
                </>
            }
          </div>
        </div>
      )}
    </section>
  );
}

function NotasFinais({ livro, usuario }: { livro: Livro; usuario: UserId }) {
  const minhaNota = usuario === "jovanna" ? livro.notaJovanna : livro.notaLeticia;
  const [nota, setNota] = useState<number>(minhaNota ?? 5);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => { setNota(minhaNota ?? 5); }, [livro.id]);

  const outra: UserId = usuario === "jovanna" ? "leticia" : "jovanna";
  const notaOutra = outra === "jovanna" ? livro.notaJovanna : livro.notaLeticia;
  const cor = usuario === "jovanna" ? "#e07a5f" : "#81b29a";

  if (minhaNota != null) {
    return (
      <section className="card p-5 space-y-2">
        <h2 className="font-semibold text-[#2d2d2d] dark:text-zinc-100">Notas finais — {livro.titulo}</h2>
        <p className="text-sm text-[#9a8f8f]">
          Você já deu sua nota: <strong style={{ color: cor }}>{minhaNota}/10</strong>.
          {notaOutra == null && ` Assim que ${outra === "jovanna" ? "Jovanna" : "Leticia"} terminar de ler, o livro fica concluído.`}
        </p>
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
    <section className="card p-5 space-y-4">
      <h2 className="font-semibold text-[#2d2d2d] dark:text-zinc-100">Terminei de ler — {livro.titulo}</h2>
      <p className="text-xs text-[#9a8f8f]">Dê sua nota final. O livro vai pra fila de troca até {outra === "jovanna" ? "Jovanna" : "Leticia"} também terminar.</p>
      <NotaSlider label={usuario === "jovanna" ? "Jovanna" : "Leticia"} value={nota} onChange={setNota} cor={cor} />
      <button onClick={salvar} disabled={salvando} className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={15}/>
        {salvando ? "Salvando..." : salvo ? "✓ Salvo!" : "Terminei — salvar nota"}
      </button>
    </section>
  );
}

function NotaSlider({ label, value, onChange, cor }: { label: string; value: number; onChange: (n: number) => void; cor: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium" style={{ color: cor }}>{label}</label>
        <span className="text-2xl font-bold" style={{ color: cor }}>{value}<span className="text-sm font-normal text-gray-300">/10</span></span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#e07a5f]" style={{ accentColor: cor }} />
      <div className="flex justify-between text-xs text-gray-300">
        {[0,1,2,3,4,5,6,7,8,9,10].map(n=><span key={n}>{n}</span>)}
      </div>
    </div>
  );
}
