"use client";

import { useState, useEffect } from "react";
import { Save, Camera, Download } from "lucide-react";
import { updateConfig } from "@/lib/db";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import type { ConfigApp, Livro } from "@/types";

interface Props { config: ConfigApp | null; livros: Livro[]; }

export default function ModuloConfig({ config, livros }: Props) {
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
        const capitulos = capsSnap.docs.map(c => c.data());
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

      {/* Backup */}
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-[#2d2d2d] dark:text-zinc-100 flex items-center gap-2"><Download size={16} className="text-[#e07a5f]" /> Backup</h2>
        <p className="text-xs text-[#9a8f8f]">
          Baixa um arquivo com todos os livros, diários, teorias e premiações — uma cópia de segurança pra guardar por fora do Firebase.
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
