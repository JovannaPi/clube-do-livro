"use client";
import confetti from "canvas-confetti";
import { useState, useEffect } from "react";
import { Save, Lock, Unlock } from "lucide-react";
import { updateConfig, atualizarLivro, registrarAtividade} from "@/lib/db";
import type { ConfigApp, Livro } from "@/types";

interface Props { config: ConfigApp | null; livros: Livro[]; }

export default function ModuloConfig({ config, livros }: Props) {
  const [nomeclube, setNome] = useState("");
  const [citacao, setCitacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (config) {
      setNome(config.nomeclube ?? "Clube do Livro ♥");
      setCitacao(config.citacaoFavorita ?? "");
    }
  }, [config]);

  async function salvarConfig() {
    setSalvando(true);
    await updateConfig({ nomeclube, citacaoFavorita: citacao });
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  const livroAtual = livros.find(l => l.id === config?.livroAtualId);

  return (
    <div className="space-y-6">
      {/* Personalização */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-[#2d2d2d]">Personalização</h2>
        <div className="space-y-2">
          <label className="text-xs text-[#9a8f8f] font-medium">Nome do clube</label>
          <input className="input" value={nomeclube} onChange={e => setNome(e.target.value)} placeholder="Clube do Livro ♥" />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9a8f8f] font-medium">Citação favorita (aparece no header)</label>
          <textarea className="textarea" rows={2} value={citacao} onChange={e => setCitacao(e.target.value)}
            placeholder="Uma citação que defina o clube..." />
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
        <NotasFinais livro={livroAtual} />
      )}

      {/* Info */}
      <div className="bg-gray-50 rounded-2xl p-4 text-xs text-[#9a8f8f] space-y-1">
        <p className="font-medium text-gray-500">Estrutura do Firestore</p>
        <p>• <code className="bg-gray-100 px-1 rounded">config/app</code> — configurações globais</p>
        <p>• <code className="bg-gray-100 px-1 rounded">livros/{"{id}"}</code> — dados dos livros</p>
        <p>• <code className="bg-gray-100 px-1 rounded">livros/{"{id}"}/capitulos/{"{n}"}</code> — diário + segredos</p>
        <p>• <code className="bg-gray-100 px-1 rounded">premiacoes/{"{livroId}"}</code> — premiações</p>
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
        <span className="text-lg">💌</span>
        <h2 className="font-semibold text-[#2d2d2d]">Cartas para o futuro</h2>
      </div>
      <p className="text-xs text-[#9a8f8f]">
        Escrevam o que esperam do livro antes de começar. As cartas ficam bloqueadas e são reveladas quando concluírem.
      </p>

      {reveladas ? (
        <div className="space-y-3">
          <div className="bg-[#fdf0ec] rounded-xl p-4">
            <p className="text-xs font-medium text-[#e07a5f] mb-1">Jovanna escreveu:</p>
            <p className="text-sm italic text-gray-700">"{livro.cartaJovanna}"</p>
          </div>
          <div className="bg-[#eef5f1] rounded-xl p-4">
            <p className="text-xs font-medium text-[#5f8f7a] mb-1">Leticia escreveu:</p>
            <p className="text-sm italic text-gray-700">"{livro.cartaLeticia}"</p>
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

function NotasFinais({ livro }: { livro: Livro }) {
  const [notaJ, setNotaJ] = useState<number>(livro.notaJovanna ?? 0);
  const [notaL, setNotaL] = useState<number>(livro.notaLeticia ?? 0);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setSalvando(true);
    await atualizarLivro(livro.id, { notaJovanna: notaJ, notaLeticia: notaL, status: "concluido" });
    setSalvando(false);
    setSalvo(true);

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#e07a5f", "#81b29a", "#fdf0ec"],
    });

    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <section className="card p-5 space-y-4">
      <h2 className="font-semibold text-[#2d2d2d]">Notas finais — {livro.titulo}</h2>
      <NotaSlider label="Jovanna" value={notaJ} onChange={setNotaJ} cor="#e07a5f" />
      <NotaSlider label="Leticia"  value={notaL} onChange={setNotaL} cor="#81b29a" />
      <button onClick={salvar} disabled={salvando} className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={15}/>
        {salvando ? "Salvando..." : salvo ? "✓ Salvo!" : "Salvar notas"}
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
