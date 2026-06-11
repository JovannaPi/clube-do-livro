// src/lib/db.ts
import type { Atividade } from "@/types";
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc,
  addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import type { Livro, Capitulo, Comentario, ConfigApp, Premiacao } from "@/types";

// ── Config ──────────────────────────────────────────────
export const configRef = () => doc(db, "config", "app");

export function listenConfig(cb: (c: ConfigApp) => void) {
  return onSnapshot(configRef(), snap => {
    if (snap.exists()) cb(snap.data() as ConfigApp);
  });
}

export async function updateConfig(data: Partial<ConfigApp>) {
  await setDoc(configRef(), data, { merge: true });
}

export const atividadesCol = () => collection(db, "atividades");

export function listenAtividades(cb: (a: Atividade[]) => void) {
  const q = query(atividadesCol(), orderBy("criadoEm", "desc"));
  return onSnapshot(q, snap => {
    cb(snap.docs.slice(0, 20).map(d => ({ id: d.id, ...d.data() } as Atividade)));
  });
}

export async function registrarAtividade(data: Omit<Atividade, "id" | "criadoEm">) {
  await addDoc(atividadesCol(), { ...data, criadoEm: new Date().toISOString() });
}

// ── Livros ───────────────────────────────────────────────
export const livrosCol = () => collection(db, "livros");
export const livroRef  = (id: string) => doc(db, "livros", id);

export function listenLivros(cb: (livros: Livro[]) => void) {
  return onSnapshot(livrosCol(), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Livro)));
  });
}

export async function salvarLivro(livro: Omit<Livro, "id"> & { id?: string }) {
  if (livro.id) {
    await setDoc(livroRef(livro.id), livro, { merge: true });
    return livro.id;
  }
  const ref = await addDoc(livrosCol(), livro);
  return ref.id;
}

export async function atualizarLivro(id: string, data: Partial<Livro>) {
  await updateDoc(livroRef(id), data as Record<string, unknown>);
}

export async function excluirLivro(id: string) {
  await deleteDoc(livroRef(id));
}

// ── Capítulos ────────────────────────────────────────────
export const capituloRef = (livroId: string, num: number) =>
  doc(db, "livros", livroId, "capitulos", String(num));

export function listenCapitulo(livroId: string, num: number, cb: (c: Capitulo) => void) {
  return onSnapshot(capituloRef(livroId, num), snap => {
    cb(snap.exists() ? (snap.data() as Capitulo) : { numero: num });
  });
}

export async function salvarCapitulo(livroId: string, num: number, data: Partial<Capitulo>) {
  await setDoc(capituloRef(livroId, num), { numero: num, ...data }, { merge: true });
}

// ── Comentários ──────────────────────────────────────────
export const comentariosCol = (livroId: string, capNum: number) =>
  collection(db, "livros", livroId, "capitulos", String(capNum), "comentarios");

export function listenComentarios(livroId: string, capNum: number, cb: (c: Comentario[]) => void) {
  const q = query(comentariosCol(livroId, capNum), orderBy("criadoEm", "asc"));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comentario)));
  });
}

export async function adicionarComentario(
  livroId: string, capNum: number,
  autor: "jovanna" | "leticia", texto: string
) {
  await addDoc(comentariosCol(livroId, capNum), {
    autor, texto,
    criadoEm: new Date().toISOString(),
    capituloNumero: capNum,
  });
}

// ── Premiações ───────────────────────────────────────────
export const premiacaoRef = (livroId: string) => doc(db, "premiacoes", livroId);

export function listenPremiacao(livroId: string, cb: (p: Premiacao) => void) {
  return onSnapshot(premiacaoRef(livroId), snap => {
    if (snap.exists()) cb(snap.data() as Premiacao);
  });
}

export async function salvarPremiacao(livroId: string, data: Partial<Premiacao>) {
  await setDoc(premiacaoRef(livroId), { livroId, ...data }, { merge: true });
}

