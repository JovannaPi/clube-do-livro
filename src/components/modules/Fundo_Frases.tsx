"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";

interface Props {
  livroAtualId?: string;
}

export function FundoFrases({ livroAtualId }: Props) {
  const [frases, setFrases] = useState<string[]>([]);

  useEffect(() => {
    async function carregarFrases() {
      if (!livroAtualId) return;
      
      try {
        // Pega todos os documentos da subcoleção capitulos do livro atual
        const capsRef = collection(db, "livros", livroAtualId, "capitulos");
        const snapshot = await getDocs(capsRef);
        
        const listaFrases: string[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Coleta as frases da Jovanna e da Leticia, ignorando vazias
          if (data.frase_jovanna && typeof data.frase_jovanna === "string") {
            listaFrases.push(data.frase_jovanna);
          }
          if (data.frase_leticia && typeof data.frase_leticia === "string") {
            listaFrases.push(data.frase_leticia);
          }
        });
        
        setFrases(listaFrases);
      } catch (error) {
        console.error("Erro ao carregar frases de fundo:", error);
      }
    }
    
    carregarFrases();
  }, [livroAtualId]);

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