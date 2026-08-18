"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Heart, Star, Lock, Unlock, Camera, X, ImagePlus, Quote, Calendar, Trophy, Film, Brain, Zap, Mail } from "lucide-react";
import { listenPremiacao } from "@/lib/db";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, collectionGroup, getDocs } from "firebase/firestore";
import type { Livro, Premiacao, UserId } from "@/types";

interface Props { livros: Livro[]; }

const NOME_COR: Record<UserId, { nome: string; cor: string }> = {
  jovanna: { nome: "Jovanna", cor: "#e07a5f" },
  leticia: { nome: "Leticia", cor: "#81b29a" },
};

export default function ModuloMemorias({ livros }: Props) {
  const concluidos = livros.filter(l => l.status === "concluido");

  return (
    <div className="space-y-8">
      <MuralFrases livros={livros} />

      {concluidos.length === 0 ? (
        <div className="text-center py-16 text-[#9a8f8f]">
          <Heart size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Concluam o primeiro livro para criar memórias!</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center space-y-1">
            <p className="text-lg font-serif font-semibold text-[#2d2d2d] dark:text-zinc-100">Cápsulas do Tempo</p>
            <p className="text-sm text-[#9a8f8f]">Cada livro que vivemos juntas, guardado pra sempre ♥</p>
          </div>
          {concluidos.map(l => (
            <CapsulaDeTempo key={l.id} livro={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function MuralFrases({ livros }: { livros: Livro[] }) {
  const [frases, setFrases] = useState<{ texto: string; usuario: UserId; livroTitulo: string }[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDocs(collectionGroup(db, "capitulos"));
        const lista: { texto: string; usuario: UserId; livroTitulo: string }[] = [];
        snap.docs.forEach(d => {
          const livroId = d.ref.parent.parent?.id;
          const livroTitulo = livros.find(l => l.id === livroId)?.titulo ?? "";
          const data = d.data();
          if (data.frase_jovanna) lista.push({ texto: data.frase_jovanna, usuario: "jovanna", livroTitulo });
          if (data.frase_leticia) lista.push({ texto: data.frase_leticia, usuario: "leticia", livroTitulo });
        });
        setFrases(lista);
      } catch (error) {
        console.error("Erro ao carregar mural de frases:", error);
      }
    }
    if (livros.length > 0) carregar();
  }, [livros]);

  if (frases.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Quote size={18} className="text-[#e07a5f]" />
        <h2 className="font-serif text-lg font-semibold text-[#2d2d2d] dark:text-zinc-100">Mural de frases favoritas</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {frases.map((f, i) => (
          <div key={i} className="card p-4" style={{ borderLeft: `3px solid ${NOME_COR[f.usuario].cor}` }}>
            <p className="text-sm italic text-gray-700 dark:text-zinc-300">&ldquo;{f.texto}&rdquo;</p>
            <p className="text-xs mt-2 font-medium" style={{ color: NOME_COR[f.usuario].cor }}>
              {NOME_COR[f.usuario].nome} · {f.livroTitulo}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CapsulaDeTempo({ livro }: { livro: Livro }) {
  const [premiacao, setPremiacao] = useState<Premiacao | null>(null);
  const [aberta, setAberta] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = listenPremiacao(livro.id, setPremiacao);
    return () => unsub();
  }, [livro.id]);

  useEffect(() => {
    const fotoRef = doc(db, "memorias_fotos", livro.id);
    const unsub = onSnapshot(fotoRef, snap => {
      if (snap.exists()) setFotos(snap.data().urls ?? []);
    });
    return () => unsub();
  }, [livro.id]);

  async function uploadFoto(file: File) {
    setEnviando(true);
    try {
      const nome = `memorias/${livro.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, nome);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const fotoRef = doc(db, "memorias_fotos", livro.id);
      await setDoc(fotoRef, { urls: arrayUnion(url) }, { merge: true });
    } finally {
      setEnviando(false);
    }
  }

  async function removerFoto(url: string) {
    if (!confirm("Remover esta foto?")) return;
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch {}
    const fotoRef = doc(db, "memorias_fotos", livro.id);
    await updateDoc(fotoRef, { urls: arrayRemove(url) });
  }

  const mediaNotas = [livro.notaJovanna, livro.notaLeticia].filter(n => n != null) as number[];
  const media = mediaNotas.length ? (mediaNotas.reduce((s, n) => s + n, 0) / mediaNotas.length).toFixed(1) : null;

  const melhorPersonagemJ = (premiacao?.melhorPersonagem as Record<string, string>)?.jovanna;
  const melhorPersonagemL = (premiacao?.melhorPersonagem as Record<string, string>)?.leticia;
  const cenaFavoritaJ     = (premiacao?.cenaFavorita as Record<string, string>)?.jovanna;
  const cenaFavoritaL     = (premiacao?.cenaFavorita as Record<string, string>)?.leticia;
  const teoriasJ          = (premiacao?.teoriaMaisLoucas as Record<string, string>)?.jovanna;
  const teoriasL          = (premiacao?.teoriaMaisLoucas as Record<string, string>)?.leticia;
  const surpresaJ         = (premiacao?.maiorSurpresa as Record<string, string>)?.jovanna;
  const surpresaL         = (premiacao?.maiorSurpresa as Record<string, string>)?.leticia;

  const temCartas = livro.cartaJovannaEnviada && livro.cartaLeticiaEnviada;

  return (
    <div className="rounded-3xl overflow-hidden border border-[#e07a5f]/20 shadow-sm">

      {/* Cabeçalho */}
      <div className="bg-gradient-to-br from-[#fdf0ec] to-[#eef5f1] dark:from-zinc-800 dark:to-zinc-900 p-6">
        <div className="flex gap-4 items-start">
          {livro.capaUrl
            ? <img src={livro.capaUrl} alt="" className="w-16 rounded-xl shadow-md flex-shrink-0" style={{ height: "88px", objectFit: "cover" }} />
            : <div className="w-16 h-[88px] bg-white/50 rounded-xl flex-shrink-0 flex items-center justify-center"><BookOpen size={24} className="text-gray-300"/></div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-serif text-xl font-bold text-[#2d2d2d] dark:text-zinc-100 leading-tight flex items-center gap-1.5">
              <BookOpen size={18} className="flex-shrink-0 text-[#9a8f8f]" /> {livro.titulo}
            </p>
            <p className="text-sm text-[#9a8f8f] italic mt-0.5">{livro.autor}</p>
            {livro.dataFimJovanna && (
              <p className="text-xs text-[#9a8f8f] mt-2 flex items-center gap-1"><Calendar size={12} /> Jovanna: {livro.dataInicioJovanna} → {livro.dataFimJovanna}</p>
            )}
            {livro.dataFimLeticia && (
              <p className="text-xs text-[#9a8f8f] flex items-center gap-1"><Calendar size={12} /> Leticia: {livro.dataInicioLeticia} → {livro.dataFimLeticia}</p>
            )}
            {media && (
              <div className="flex items-center gap-1 mt-2">
                <Heart size={12} className="text-pink-400" />
                <span className="text-xs text-[#9a8f8f]">Média do casal: <strong className="text-[#2d2d2d] dark:text-zinc-100">{media}/10</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          {livro.notaJovanna != null && (
            <div className="flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 rounded-xl px-3 py-2">
              <Star size={13} className="text-[#e07a5f]" />
              <span className="text-sm"><span className="text-[#e07a5f] font-medium">Jovanna</span> · {livro.notaJovanna}/10</span>
            </div>
          )}
          {livro.notaLeticia != null && (
            <div className="flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 rounded-xl px-3 py-2">
              <Star size={13} className="text-[#81b29a]" />
              <span className="text-sm"><span className="text-[#81b29a] font-medium">Leticia</span> · {livro.notaLeticia}/10</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão abrir/fechar */}
      <button
        onClick={() => setAberta(o => !o)}
        className="w-full flex items-center justify-between px-6 py-3 bg-white dark:bg-zinc-900 border-t border-[#e07a5f]/10 text-sm font-medium text-[#e07a5f] hover:bg-[#fdf0ec] dark:hover:bg-zinc-800 transition-colors"
      >
        <span>{aberta ? "Fechar cápsula" : "Abrir cápsula do tempo"}</span>
        {aberta ? <Unlock size={16} /> : <Lock size={16} />}
      </button>

      {/* Conteúdo */}
      {aberta && (
        <div className="bg-white dark:bg-zinc-900 p-5 space-y-5 border-t border-[#e07a5f]/10">

          {/* Fotos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider flex items-center gap-1.5"><Camera size={13} /> Fotos desta leitura</p>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={enviando}
                className="flex items-center gap-1.5 text-xs text-[#e07a5f] font-medium hover:underline disabled:opacity-50"
              >
                <ImagePlus size={13} />
                {enviando ? "Enviando..." : "Adicionar foto"}
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadFoto(file);
                e.target.value = "";
              }}
            />
            {fotos.length === 0 ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center gap-2 text-[#9a8f8f] hover:border-[#e07a5f]/40 hover:bg-[#fdf0ec]/30 transition-colors"
              >
                <Camera size={24} />
                <span className="text-xs">Adicione fotos dessa leitura</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded-xl cursor-pointer"
                      onClick={() => setFotoAmpliada(url)}
                    />
                    <button
                      onClick={() => removerFoto(url)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl flex items-center justify-center text-[#9a8f8f] hover:border-[#e07a5f]/40 transition-colors"
                >
                  <ImagePlus size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Premiações */}
          {(melhorPersonagemJ || melhorPersonagemL) && (
            <CapsulaSecao label="Melhor personagem" icon={Trophy} jovanna={melhorPersonagemJ} leticia={melhorPersonagemL} />
          )}
          {(cenaFavoritaJ || cenaFavoritaL) && (
            <CapsulaSecao label="Cena favorita" icon={Film} jovanna={cenaFavoritaJ} leticia={cenaFavoritaL} />
          )}
          {(teoriasJ || teoriasL) && (
            <CapsulaSecao label="Teoria mais maluca" icon={Brain} jovanna={teoriasJ} leticia={teoriasL} />
          )}
          {(surpresaJ || surpresaL) && (
            <CapsulaSecao label="Maior surpresa" icon={Zap} jovanna={surpresaJ} leticia={surpresaL} />
          )}

          {/* Cartas do futuro */}
          {temCartas ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider flex items-center gap-1.5"><Mail size={13} /> Cartas escritas antes de começar</p>
              {livro.cartaJovanna && (
                <div className="bg-[#fdf0ec] dark:bg-zinc-800 rounded-2xl p-4 border-l-4 border-[#e07a5f]">
                  <p className="text-xs font-semibold text-[#e07a5f] mb-1">Jovanna escreveu:</p>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 italic">"{livro.cartaJovanna}"</p>
                </div>
              )}
              {livro.cartaLeticia && (
                <div className="bg-[#eef5f1] dark:bg-zinc-800 rounded-2xl p-4 border-l-4 border-[#81b29a]">
                  <p className="text-xs font-semibold text-[#81b29a] mb-1">Leticia escreveu:</p>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 italic">"{livro.cartaLeticia}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#9a8f8f] bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
              <Lock size={12} />
              <span>As cartas do futuro não foram escritas para este livro.</span>
            </div>
          )}

          {/* Rodapé */}
          <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 text-center">
            <p className="text-xs text-[#9a8f8f] italic">Esta página nunca mais muda. É a memória permanente deste livro. ♥</p>
          </div>
        </div>
      )}

      {/* Foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <img src={fotoAmpliada} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 bg-white/20 text-white rounded-full p-2">
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

function CapsulaSecao({ label, icon: Icon, jovanna, leticia }: { label: string; icon: React.ElementType; jovanna?: string; leticia?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider flex items-center gap-1.5"><Icon size={13} /> {label}</p>
      <div className="grid grid-cols-1 gap-2">
        {jovanna && (
          <div className="flex gap-2 items-start">
            <span className="text-xs font-semibold text-[#e07a5f] mt-0.5 flex-shrink-0">Jovanna</span>
            <span className="text-xs text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800 rounded-lg px-2 py-1 flex-1">{jovanna}</span>
          </div>
        )}
        {leticia && (
          <div className="flex gap-2 items-start">
            <span className="text-xs font-semibold text-[#81b29a] mt-0.5 flex-shrink-0">Leticia</span>
            <span className="text-xs text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800 rounded-lg px-2 py-1 flex-1">{leticia}</span>
          </div>
        )}
      </div>
    </div>
  );
}