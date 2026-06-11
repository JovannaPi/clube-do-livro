"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ChevronLeft, ChevronRight } from "lucide-react";
import { listenComentarios, adicionarComentario, listenCapitulo } from "@/lib/db";
import type { Livro, Comentario, Capitulo, UserId } from "@/types";

interface Props { livroAtual?: Livro; usuario: UserId; }

export default function ModuloDiscussao({ livroAtual, usuario }: Props) {
  const [capNum, setCapNum] = useState(1);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [capitulo, setCapitulo] = useState<Capitulo>({ numero: 1 });
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!livroAtual) return;
    const unsub1 = listenComentarios(livroAtual.id, capNum, setComentarios);
    const unsub2 = listenCapitulo(livroAtual.id, capNum, setCapitulo);
    return () => { unsub1(); unsub2(); };
  }, [livroAtual, capNum]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comentarios]);

  async function enviar() {
    if (!livroAtual || !texto.trim()) return;
    setEnviando(true);
    await adicionarComentario(livroAtual.id, capNum, usuario, texto.trim());
    setTexto("");
    setEnviando(false);
  }

  if (!livroAtual) {
    return (
      <div className="text-center py-16 text-[#9a8f8f]">
        <p className="text-4xl mb-3">💬</p>
        <p className="text-sm">Nenhum livro em leitura.</p>
      </div>
    );
  }

  const ambasEnviaram = capitulo.jovanna_enviou && capitulo.leticia_enviou;
  const maxCap = livroAtual.totalCapitulos ?? 99;

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "70vh" }}>
      {/* Nav capítulo */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-gray-100">
        <button onClick={() => setCapNum(n => Math.max(1, n-1))} disabled={capNum === 1}
          className="p-2 rounded-xl hover:bg-gray-50 disabled:opacity-30">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-serif font-semibold">Capítulo {capNum}</p>
          <p className="text-xs text-[#9a8f8f]">Discussão</p>
        </div>
        <button onClick={() => setCapNum(n => Math.min(maxCap, n+1))} disabled={capNum === maxCap}
          className="p-2 rounded-xl hover:bg-gray-50 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {!ambasEnviaram && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700 text-center">
          💡 A discussão fica liberada após ambas enviarem as respostas secretas deste capítulo.
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 space-y-3 min-h-[300px]">
        {comentarios.length === 0 && (
          <div className="text-center py-10 text-[#9a8f8f] text-sm">
            Nenhum comentário ainda. Comecem a discussão!
          </div>
        )}
        {comentarios.map(c => (
          <MensagemBubble key={c.id} comentario={c} isOwn={c.autor === usuario} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#fdf8f5] pt-2 pb-1">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder={ambasEnviaram ? "Escreva um comentário..." : "Disponível após revelação"}
            disabled={!ambasEnviaram}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }}}
          />
          <button onClick={enviar} disabled={!ambasEnviaram || enviando || !texto.trim()}
            className="btn-primary px-4 disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MensagemBubble({ comentario, isOwn }: { comentario: Comentario; isOwn: boolean }) {
  const nome = comentario.autor === "jovanna" ? "Jovanna" : "Leticia";
  const cor = comentario.autor === "jovanna" ? "bg-[#e07a5f]" : "bg-[#81b29a]";
  const hora = new Date(comentario.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {!isOwn && <span className="text-xs text-[#9a8f8f] px-1">{nome}</span>}
        <div className={`px-4 py-2.5 rounded-2xl text-sm text-white ${cor} ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}>
          {comentario.texto}
        </div>
        <span className="text-xs text-[#9a8f8f] px-1">{hora}</span>
      </div>
    </div>
  );
}
