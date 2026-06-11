"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function Cabecalho() {
  const [isDark, setIsDark] = useState(false);
  const [showMensagem, setShowMensagem] = useState(false);

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

  return (
    <header className="flex justify-between items-center p-6 bg-[#fdf8f5] dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 transition-colors duration-200">
      <h1 className="font-serif font-bold text-xl text-[#2d2d2d] dark:text-zinc-100">
        Clube do Livro{" "}
        <button
          onClick={() => setShowMensagem(true)}
          className="inline-block hover:scale-125 transition-transform duration-200 cursor-pointer"
          title="♥"
        >
          ♥
        </button>
      </h1>

      <button 
        onClick={() => setIsDark(!isDark)}
        className="p-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200 shadow-sm"
        title="Alternar tema"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {showMensagem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border-2 border-[#e07a5f]/30 relative">
            <p className="text-4xl">💌</p>
            <p className="font-serif text-lg text-[#2d2d2d] dark:text-zinc-100 leading-relaxed">
              {}
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
    </header>
  );
}