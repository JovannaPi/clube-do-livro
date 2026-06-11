"use client";

import { useState, useEffect } from "react";
import { BookOpen, BookMarked, PenLine, Lock, MessageCircle, BarChart2, Trophy, Heart, Settings, Sun, Moon } from "lucide-react";
import { listenConfig, listenLivros } from "@/lib/db";
import { useUsuario } from "@/hooks/useUsuario";
import NotificacaoSino from "@/components/modules/NotificacaoSino";
import type { ConfigApp, Livro } from "@/types";

// Fundo
import { FundoFrases } from "@/components/modules/Fundo_Frases";

// Módulos
import ModuloBiblioteca  from "@/components/modules/ModuloBiblioteca";
import ModuloDiario      from "@/components/modules/ModuloDiario";
import ModuloSecreto     from "@/components/modules/ModuloSecreto";
import ModuloDiscussao   from "@/components/modules/ModuloDiscussao";
import ModuloEstatisticas from "@/components/modules/ModuloEstatisticas";
import ModuloPremiacao   from "@/components/modules/ModuloPremiacao";
import ModuloMemorias    from "@/components/modules/ModuloMemorias";
import ModuloConfig      from "@/components/modules/ModuloConfig";

const TABS = [
  { id: "biblioteca",   label: "Biblioteca",   icon: BookMarked },
  { id: "diario",       label: "Diário",        icon: PenLine },
  { id: "secreto",      label: "Secreto",       icon: Lock },
  { id: "discussao",    label: "Discussão",     icon: MessageCircle },
  { id: "stats",        label: "Estatísticas",  icon: BarChart2 },
  { id: "premiacao",    label: "Premiações",    icon: Trophy },
  { id: "memorias",     label: "Memórias",      icon: Heart },
  { id: "config",       label: "Config",        icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("biblioteca");
  const [config, setConfig] = useState<ConfigApp | null>(null);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [showMensagem, setShowMensagem] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { usuario, setUsuario } = useUsuario();

  useEffect(() => {
    const unsub1 = listenConfig(setConfig);
    const unsub2 = listenLivros(setLivros);
    return () => { unsub1(); unsub2(); };
  }, []);

  // Tema escuro
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("tema-clube-livro", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("tema-clube-livro", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("tema-clube-livro");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  const livroAtual = livros.find(l => l.id === config?.livroAtualId);

  return (
    <div className="min-h-screen flex flex-col">
      <FundoFrases livroAtualId={config?.livroAtualId} />

      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#e07a5f]" />
            <h1 className="font-serif text-lg font-semibold text-[#2d2d2d] dark:text-zinc-100 flex items-center gap-1">
              {config?.nomeclube ?? "Clube do Livro"}
              <button
                onClick={() => setShowMensagem(true)}
                className="hover:scale-125 transition-transform duration-200 cursor-pointer"
              >
                ♥
              </button>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de usuário */}
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl text-sm">
              {(["jovanna", "leticia"] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUsuario(u)}
                  className={`px-3 py-1 rounded-lg transition-all font-medium capitalize ${
                    usuario === u
                      ? "bg-[#e07a5f] text-white shadow-sm"
                      : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {u === "jovanna" ? "Jovanna" : "Leticia"}
                </button>
              ))}
            </div>

            
            {/* Sino de notificações */}
            <NotificacaoSino usuario={usuario} />

            {/* Botão de tema */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200 shadow-sm"
              title="Alternar tema"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Citação do dia */}
        {config?.citacaoFavorita && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <p className="text-xs text-center text-[#9a8f8f] dark:text-zinc-400 italic">&ldquo;{config.citacaoFavorita}&rdquo;</p>
          </div>
        )}
      </header>

      {/* Modal mensagem carinhosa */}
      {showMensagem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border-2 border-[#e07a5f]/30 relative">
            <p className="text-4xl">💌</p>
            <p className="font-serif text-lg text-[#2d2d2d] dark:text-zinc-100 leading-relaxed">
              Feliz Dia das Namoradas, meu bem. <br/><br/>
              Fiz esse cantinho só nosso, para guardarmos cada livro, cada teoria maluca e cada conversa que tivermos juntas. <br/><br/>
              Te amo pra krl. ♥
            </p>
            <button
              onClick={() => setShowMensagem(false)}
              className="bg-[#e07a5f] hover:bg-[#c45f44] text-white py-3 px-6 rounded-xl font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 overflow-x-auto sticky top-[61px] z-20 transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-2 flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                tab === id
                  ? "border-[#e07a5f] text-[#e07a5f]"
                  : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {tab === "biblioteca"  && <ModuloBiblioteca livros={livros} config={config} usuario={usuario} />}
        {tab === "diario"      && <ModuloDiario     livroAtual={livroAtual} usuario={usuario} />}
        {tab === "secreto"     && <ModuloSecreto    livroAtual={livroAtual} usuario={usuario} />}
        {tab === "discussao"   && <ModuloDiscussao  livroAtual={livroAtual} usuario={usuario} />}
        {tab === "stats"       && <ModuloEstatisticas livros={livros} />}
        {tab === "premiacao"   && <ModuloPremiacao  livroAtual={livroAtual} usuario={usuario} />}
        {tab === "memorias"    && <ModuloMemorias   livros={livros} />}
        {tab === "config"      && <ModuloConfig     config={config} livros={livros} />}
      </main>
    </div>
  );
}