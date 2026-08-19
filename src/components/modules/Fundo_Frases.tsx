"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collectionGroup, getDocs } from "firebase/firestore";
import type { UserId } from "@/types";

interface Props {
  usuario: UserId;
}

// Junta as frases favoritas que a própria usuária já escreveu, em qualquer
// livro (não só o atual) — nunca as da outra, pra não vazar spoiler de um
// trecho que ela ainda não leu (ex: quando o livro é passado de uma pra outra).
export function FundoFrases({ usuario }: Props) {
  const [frases, setFrases] = useState<string[]>([]);

  useEffect(() => {
    async function carregarFrases() {
      try {
        const campo = `frase_${usuario}`;
        const snapshot = await getDocs(collectionGroup(db, "capitulos"));

        const listaFrases: string[] = [];
        snapshot.docs.forEach(doc => {
          const valor = doc.data()[campo];
          if (valor && typeof valor === "string") listaFrases.push(valor);
        });

        // Embaralha pra variar quais frases aparecem a cada visita
        for (let i = listaFrases.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [listaFrases[i], listaFrases[j]] = [listaFrases[j], listaFrases[i]];
        }
        setFrases(listaFrases);
      } catch (error) {
        console.error("Erro ao carregar frases de fundo:", error);
      }
    }

    carregarFrases();
  }, [usuario]);

  if (frases.length === 0) return null;

  // Lista de estilos de rotação, cores e posições aleatórias ou alternadas com Tailwind
  const posicoes = [
    "top-10 left-10 rotate-[-6deg]",
    "bottom-20 right-12 rotate-[4deg]",
    "top-40 right-16 rotate-[8deg]",
    "bottom-40 left-16 rotate-[-3deg]",
    "top-24 left-1/3 rotate-[2deg]",
    "bottom-24 right-1/3 rotate-[-5deg]",
  ];

  return (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-15 dark:opacity-5 select-none">
    {frases.slice(0, 6).map((frase, index) => (
      <div 
        key={index} 
        className={`absolute max-w-[200px] font-serif text-sm italic text-ink dark:text-zinc-300 blur-[0.5px] ${posicoes[index % posicoes.length]}`}
      >
        &quot;{frase}&quot;
      </div>
    ))}
  </div>
);
}