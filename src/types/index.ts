// src/types/index.ts

export type UserId = "jovanna" | "leticia";

export interface Atividade {
  id: string;
  tipo: "diario" | "secreto" | "carta" | "comentario" | "troca" | "nota";
  usuario: "jovanna" | "leticia";
  livroId: string;
  livroTitulo: string;
  capitulo?: number;
  criadoEm: string;
}

export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  capaUrl: string;
  sinopse: string;
  genero: string;
  totalCapitulos: number;
  // "planejado": na fila. "lendo": alguém está lendo agora (ver leitorAtual).
  // "trocar": uma já leu e terminou, esperando a outra pegar o livro.
  // "concluido": as duas já leram e avaliaram. "abandonado": alguém desistiu no meio.
  status: "planejado" | "lendo" | "trocar" | "concluido" | "abandonado";
  leitorAtual?: UserId;
  sugeridoPor?: UserId;
  motivoEscolha?: string;
  dataInicioJovanna?: string;
  dataFimJovanna?: string;
  dataInicioLeticia?: string;
  dataFimLeticia?: string;
  notaJovanna?: number;
  notaLeticia?: number;
  cartaJovanna?: string;
  cartaLeticia?: string;
  cartaJovannaEnviada?: boolean;
  cartaLeticiaEnviada?: boolean;
}

export interface Capitulo {
  numero: number;
  // Impressão geral
  impressao_jovanna?: string;
  impressao_leticia?: string;
  // Emoções (array de emojis)
  emocoes_jovanna?: string[];
  emocoes_leticia?: string[];
  // Frase favorita
  frase_jovanna?: string;
  frase_leticia?: string;
  // Teoria (resposta secreta)
  teoria_jovanna?: string;
  teoria_leticia?: string;
  // Status de envio
  jovanna_enviou?: boolean;
  leticia_enviou?: boolean;
}

export interface Premiacao {
  livroId: string;
  melhorPersonagem?: { jovanna?: string; leticia?: string };
  cenaFavorita?:     { jovanna?: string; leticia?: string };
  teoriaMaisLoucas?: { jovanna?: string; leticia?: string };
  maiorSurpresa?:    { jovanna?: string; leticia?: string };
}

export interface ConfigApp {
  livroAtualIdJovanna?: string;
  livroAtualIdLeticia?: string;
  nomeclube: string;
  citacaoFavorita: string;
  fotoUrl?: string;
  tema: "light" | "dark";
  metaAnual?: number;
}
