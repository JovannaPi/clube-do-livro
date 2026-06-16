"use client";

import { useState, useEffect } from "react";
import { BookOpen, Target, Quote, Search, ChevronRight, Plus, Star, LayoutGrid, List, BarChart2, Clock, BookText } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, orderBy, query } from "firebase/firestore";

interface Livro {
  id: string;
  titulo: string;
  autor?: string;
  capaUrl?: string;
  genero?: string;
  serie?: string;
  volume?: number;
  status: "quero_ler" | "lendo" | "lido";
  nota?: number;
  dataInicio?: string;
  dataFim?: string;
  tipoProgresso?: "paginas" | "capitulos";
  paginas?: number; // Pode representar páginas ou capítulos dependendo de tipoProgresso
  paginasLidas?: number; 
  sinopse?: string;
  resenha?: string;
  favorito?: boolean;
}

interface Frase {
  id: string;
  texto: string;
  livro: string;
  autor?: string;
  criadoEm: string;
}

interface Meta {
  ano: number;
  meta: number;
}

const TABS = [
  { id: "estante", label: "Estante", icon: BookOpen },
  { id: "frases", label: "Frases", icon: Quote },
  { id: "meta", label: "Meta", icon: Target },
] as const;

type TabId = typeof TABS[number]["id"];

const COR = "#8b5cf6"; 
const COR_LIGHT = "#f3e8ff";
const COR_DARK = "#6d28d9";

const GENERO_CORES: Record<string, string> = {
  "Romance": "#f43f5e",
  "Fantasia": "#a855f7",
  "Otome Isekai": "#ec4899",
  "Ficção Científica": "#06b6d4",
  "Mistério": "#f59e0b",
  "Terror": "#ef4444",
  "Não-ficção": "#10b981",
  "Aventura": "#f97316",
  "Mangá/Manhwa": "#14b8a6"
};

function generoCor(genero?: string) {
  return genero && GENERO_CORES[genero] ? GENERO_CORES[genero] : COR;
}

export default function MinhaEstante() {
  const [tab, setTab] = useState<TabId>("estante");
  const [isDark, setIsDark] = useState(false);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [frases, setFrases] = useState<Frase[]>([]);
  const [meta, setMeta] = useState<Meta>({ ano: new Date().getFullYear(), meta: 12 });

  useEffect(() => {
    const q = query(collection(db, "estante_livros"), orderBy("titulo"));
    return onSnapshot(q, snap => setLivros(snap.docs.map(d => ({ id: d.id, ...d.data() } as Livro))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "estante_frases"), orderBy("criadoEm", "desc"));
    return onSnapshot(q, snap => setFrases(snap.docs.map(d => ({ id: d.id, ...d.data() } as Frase))));
  }, []);

  useEffect(() => {
    const metaRef = doc(db, "estante_config", "meta");
    return onSnapshot(metaRef, snap => { if (snap.exists()) setMeta(snap.data() as Meta); });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const lidos = livros.filter(l => l.status === "lido");
  const lendo = livros.filter(l => l.status === "lendo");
  const queroLer = livros.filter(l => l.status === "quero_ler");
  const favoritos = livros.filter(l => l.favorito);
  
  const progressoMeta = Math.min(Math.round((lidos.length / (meta.meta || 1)) * 100), 100);
  const mediaNotas = lidos.filter(l => l.nota).length
    ? (lidos.reduce((s, l) => s + (l.nota ?? 0), 0) / lidos.filter(l => l.nota).length).toFixed(1)
    : "—";

  const totalProgresso = lidos.reduce((acc, l) => acc + (Number(l.paginas) || 0), 0) + 
                         lendo.reduce((acc, l) => acc + (Number(l.paginasLidas) || 0), 0);

  const fraseDestaque = frases.length > 0 ? frases[Math.floor(Math.random() * frases.length)] : null;

  return (
    <div className="min-h-screen" style={{ background: isDark ? "#0b0914" : "#faf5ff", fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .book-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .book-card:hover { transform: translateY(-8px) scale(1.02); z-index: 10; box-shadow: 0 20px 25px -5px rgba(139, 92, 246, 0.15), 0 10px 10px -5px rgba(139, 92, 246, 0.1); }
        .book-overlay { opacity: 0; transition: all 0.3s ease; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%); }
        .book-card:hover .book-overlay { opacity: 1; }
        .glass-header { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .tab-btn { position: relative; transition: color 0.3s ease; }
        .tab-btn::after { content: ''; position: absolute; bottom: -2px; left: 50%; width: 0; height: 3px; background: ${COR}; transition: all 0.3s ease; transform: translateX(-50%); border-radius: 3px 3px 0 0; }
        .tab-btn.active::after { width: 100%; }
        .badge-pulse { animation: pulse-soft 2s infinite; }
        @keyframes pulse-soft { 0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); } }
        .masonry-grid { columns: 2 160px; column-gap: 20px; }
        .masonry-item { break-inside: avoid; margin-bottom: 20px; }
        /* Scrollbar customizada para os modais */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? '#2d2442' : '#e9d5ff'}; border-radius: 10px; }
      `}} />

      <header className="glass-header" style={{ background: isDark ? "rgba(11, 9, 20, 0.85)" : "rgba(255, 255, 255, 0.85)", borderBottom: `1px solid ${isDark ? "#1f1b2e" : "#f3e8ff"}`, position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "14px", background: `linear-gradient(135deg, ${COR}, ${COR_DARK})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, boxShadow: `0 8px 16px ${COR}40`, transform: "rotate(-5deg)" }}>
                J
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: isDark ? "white" : "#1e1b2e", letterSpacing: "-0.5px" }}>Minha Estante <span style={{ color: COR }}>✨</span></div>
                <div style={{ fontSize: 12, color: "#8b83a3", fontWeight: 500 }}>{livros.length} aventuras · {lidos.length} vidas vividas</div>
              </div>
            </div>
            <button onClick={() => setIsDark(!isDark)} style={{ width: 40, height: 40, borderRadius: "50%", background: isDark ? "#1f1b2e" : COR_LIGHT, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.3s" }}>
              {isDark ? "🌙" : "🌸"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`tab-btn ${tab === id ? 'active' : ''}`}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 14, fontWeight: 600, border: "none", color: tab === id ? COR : "#8b83a3", background: "transparent", cursor: "pointer" }}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>
        {fraseDestaque && tab === "estante" && (
          <div style={{ background: `linear-gradient(120deg, ${isDark ? '#1a1528' : '#ffffff'}, ${isDark ? '#1f1635' : '#faf5ff'})`, borderRadius: 20, padding: "20px 24px", marginBottom: 24, border: `1px solid ${isDark ? '#2d2442' : '#e9d5ff'}`, position: "relative", overflow: "hidden", boxShadow: `0 4px 20px ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(139, 92, 246, 0.05)'}` }}>
            <Quote size={40} color={COR} style={{ position: "absolute", top: -10, left: -10, opacity: 0.1 }} />
            <div style={{ fontStyle: "italic", fontSize: 14, color: isDark ? "#e2e8f0" : "#4c1d95", lineHeight: 1.6, position: "relative", zIndex: 1 }}>
              "{fraseDestaque.texto}"
            </div>
            <div style={{ fontSize: 12, color: "#8b83a3", marginTop: 8, fontWeight: 600, textAlign: "right" }}>
              — {fraseDestaque.livro}
            </div>
          </div>
        )}

        {tab === "estante" && <Estante livros={livros} lidos={lidos} lendo={lendo} queroLer={queroLer} favoritos={favoritos} mediaNotas={mediaNotas} totalProgresso={totalProgresso} isDark={isDark} progressoMeta={progressoMeta} meta={meta.meta} />}
        {tab === "frases" && <Frases frases={frases} isDark={isDark} />}
        {tab === "meta" && <MetaLeitura meta={meta} lidos={lidos} progressoMeta={progressoMeta} isDark={isDark} onSalvar={async (m: Meta) => { await setDoc(doc(db, "estante_config", "meta"), m); setMeta(m); }} />}
      </main>
    </div>
  );
}

function Estante({ livros, lidos, lendo, queroLer, favoritos, mediaNotas, totalProgresso, isDark, progressoMeta, meta }: any) {
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "lido" | "lendo" | "quero_ler" | "favoritos">("todos");
  const [busca, setBusca] = useState("");
  const [livroAberto, setLivroAberto] = useState<Livro | null>(null);
  const [form, setForm] = useState<Partial<Livro>>({ status: "quero_ler", tipoProgresso: "paginas" });
  const [view, setView] = useState<"grade" | "lista">("grade");

  const livrosFiltrados = livros
    .filter((l: Livro) => {
      if (filtro === "favoritos") return l.favorito;
      return filtro === "todos" || l.status === filtro;
    })
    .filter((l: Livro) => !busca || l.titulo.toLowerCase().includes(busca.toLowerCase()) || (l.autor ?? "").toLowerCase().includes(busca.toLowerCase()) || (l.serie ?? "").toLowerCase().includes(busca.toLowerCase()));

  // Lógica de Analytics: Agrupamento por Gênero
  const generosContagem = lidos.reduce((acc: any, l: Livro) => {
    if (l.genero) acc[l.genero] = (acc[l.genero] || 0) + 1;
    return acc;
  }, {});
  const topGeneros = Object.entries(generosContagem).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);

  function calcularDiasLidos(inicio?: string, fim?: string) {
    if (!inicio || !fim) return null;
    const diffTime = Math.abs(new Date(fim).getTime() - new Date(inicio).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  }

  async function salvar() {
    if (!form.titulo) return;
    await addDoc(collection(db, "estante_livros"), { ...form, criadoEm: new Date().toISOString() });
    setShowForm(false);
    setForm({ status: "quero_ler", tipoProgresso: "paginas" });
  }

  async function excluir(id: string) {
    if (!confirm("Tem certeza que deseja remover este título da estante?")) return;
    await deleteDoc(doc(db, "estante_livros", id));
    setLivroAberto(null);
  }

  async function toggleFavorito(livro: Livro) {
    await updateDoc(doc(db, "estante_livros", livro.id), { favorito: !livro.favorito });
    if (livroAberto) setLivroAberto({ ...livroAberto, favorito: !livroAberto.favorito });
  }

  async function mudarStatus(livro: Livro, status: Livro["status"]) {
    const updates: any = { status };
    if (status === "lendo" && !livro.dataInicio) updates.dataInicio = new Date().toISOString().split("T")[0];
    if (status === "lido") {
      if (!livro.dataFim) updates.dataFim = new Date().toISOString().split("T")[0];
      if (livro.paginas) updates.paginasLidas = livro.paginas; // Completa o progresso automaticamente
    }
    await updateDoc(doc(db, "estante_livros", livro.id), updates);
  }

  const cardBg = isDark ? "#151120" : "white";
  const textPrimary = isDark ? "white" : "#1e1b2e";
  const textSecondary = isDark ? "#a19db1" : "#8b83a3";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* Dashboard Rico com Analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div style={{ background: `linear-gradient(135deg, ${COR}, ${COR_DARK})`, borderRadius: 24, padding: 20, color: "white", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 100, opacity: 0.1 }}></div>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>Meta do Ano</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{lidos.length} <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.8 }}>/ {meta}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: 6, width: `${progressoMeta}%`, background: "white", borderRadius: 99, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{progressoMeta}%</span>
          </div>
        </div>

        <div style={{ background: cardBg, borderRadius: 24, border: `1px solid ${isDark ? '#2d2442' : '#f3e8ff'}`, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: `0 4px 15px ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(139, 92, 246, 0.05)'}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Top Gêneros Lidos</div>
            <BarChart2 size={18} color={COR} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topGeneros.length > 0 ? topGeneros.map(([gen, qtd]: any) => (
              <div key={gen} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 60, fontSize: 11, color: textPrimary, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{gen}</div>
                <div style={{ flex: 1, height: 8, background: isDark ? "#2d2442" : "#f3e8ff", borderRadius: 99 }}>
                  <div style={{ height: "100%", width: `${(qtd / lidos.length) * 100}%`, background: generoCor(gen), borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: textSecondary, width: 20, textAlign: "right" }}>{qtd}</div>
              </div>
            )) : <div style={{ fontSize: 12, color: textSecondary }}>Leia mais para gerar dados!</div>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 16 }}>
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${isDark ? '#2d2442' : '#f3e8ff'}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COR}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
             <div>
               <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>{totalProgresso}</div>
               <div style={{ fontSize: 11, fontWeight: 600, color: textSecondary }}>Págs/Capítulos Consumidos</div>
             </div>
          </div>
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${isDark ? '#2d2442' : '#fef3c7'}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div>
             <div>
               <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>{mediaNotas}</div>
               <div style={{ fontSize: 11, fontWeight: 600, color: textSecondary }}>Nota Média de Avaliação</div>
             </div>
          </div>
        </div>
      </div>

      {/* Lendo Agora */}
      {lendo.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="badge-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: COR, display: "inline-block" }}></span>
            Continuar Aventura
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {lendo.map((l: Livro) => {
              const progressoLendo = l.paginas && l.paginasLidas ? Math.min(Math.round((l.paginasLidas / l.paginas) * 100), 100) : 0;
              const metrica = l.tipoProgresso === "capitulos" ? "cap." : "págs";
              return (
                <div key={l.id} onClick={() => setLivroAberto(l)} className="book-card" style={{ background: cardBg, borderRadius: 20, padding: 16, border: `1px solid ${isDark ? '#2d2442' : '#f3e8ff'}`, display: "flex", gap: 16, cursor: "pointer" }}>
                  {l.capaUrl
                    ? <img src={l.capaUrl} alt="" style={{ width: 72, height: 104, objectFit: "cover", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    : <div style={{ width: 72, height: 104, background: COR_LIGHT, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📖</div>                  }
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, lineHeight: 1.2, marginBottom: 4 }}>{l.titulo}</div>
                    {l.serie && <div style={{ fontSize: 11, color: COR, fontWeight: 700, marginBottom: 4 }}>{l.serie} {l.volume ? `(Vol. ${l.volume})` : ''}</div>}
                    <div style={{ fontSize: 12, color: textSecondary, marginBottom: 12 }}>{l.autor}</div>
                    
                    {l.paginas ? (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: textSecondary, marginBottom: 4, fontWeight: 600 }}>
                          <span>{progressoLendo}%</span>
                          <span>{l.paginasLidas || 0} / {l.paginas} {metrica}</span>
                        </div>
                        <div style={{ height: 6, background: isDark ? "#2d2442" : "#f3e8ff", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${progressoLendo}%`, background: COR, borderRadius: 99 }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: `${COR}15`, color: COR, display: "inline-block", fontWeight: 700, alignSelf: "flex-start" }}>Em andamento...</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controles */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", background: cardBg, padding: 12, borderRadius: 20, border: `1px solid ${isDark ? '#2d2442' : '#f3e8ff'}` }}>
        <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 10, background: isDark ? "#0b0914" : "#faf5ff", borderRadius: 16, padding: "10px 16px" }}>
          <Search size={18} color={COR} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Procurar título, autor ou série..." style={{ border: "none", outline: "none", fontSize: 14, background: "transparent", color: textPrimary, flex: 1, fontWeight: 500 }} />
        </div>
        
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {(["todos", "favoritos", "lido", "quero_ler"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 16, border: "none", background: filtro === f ? COR : (isDark ? "#1f1b2e" : "#f3e8ff"), color: filtro === f ? "white" : textSecondary, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {f === "todos" ? "Tudo" : f === "favoritos" ? "Favoritos" : f === "lido" ? " Lidos" : " Quero Ler"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, borderLeft: `1px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, paddingLeft: 12 }}>
          <button onClick={() => setView("grade")} style={{ width: 36, height: 36, borderRadius: 12, background: view === "grade" ? `${COR}15` : "transparent", color: view === "grade" ? COR : textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><LayoutGrid size={18}/></button>
          <button onClick={() => setView("lista")} style={{ width: 36, height: 36, borderRadius: 12, background: view === "lista" ? `${COR}15` : "transparent", color: view === "lista" ? COR : textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><List size={18}/></button>
        </div>
      </div>

      {/* Grid */}
      {view === "grade" ? (
        <div className="masonry-grid">
          {livrosFiltrados.map((l: Livro) => (
            <div key={l.id} onClick={() => setLivroAberto(l)} className="masonry-item book-card" style={{ cursor: "pointer", position: "relative" }}>
              {l.capaUrl
                ? <img src={l.capaUrl} alt={l.titulo} style={{ width: "100%", borderRadius: 16, boxShadow: "0 10px 20px rgba(0,0,0,0.1)", display: "block" }} />
                : <div style={{ width: "100%", aspectRatio: "2/3", background: `linear-gradient(135deg, ${COR_LIGHT}, #ddd6fe)`, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center" }}>
                    <span style={{ fontSize: 32, marginBottom: 8 }}>📚</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COR_DARK, lineHeight: 1.2 }}>{l.titulo}</span>
                  </div>
              }
              
              <div className="book-overlay" style={{ position: "absolute", inset: 0, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16 }}>
                <div style={{ transform: "translateY(10px)", transition: "transform 0.3s ease" }} className="overlay-content">
                  {l.favorito && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 20 }}>💜</div>}
                  {l.nota && (
                    <div style={{ display: "inline-flex", gap: 2, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 99, backdropFilter: "blur(4px)", marginBottom: 8 }}>
                      {[1,2,3,4,5].map(n => <Star key={n} size={10} fill={n * 2 <= (l.nota ?? 0) ? "#f59e0b" : "transparent"} color={n * 2 <= (l.nota ?? 0) ? "#f59e0b" : "rgba(255,255,255,0.3)"} />)}
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.2, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>{l.titulo}</div>
                  {l.serie && <div style={{ fontSize: 11, color: COR_LIGHT, marginTop: 4, fontWeight: 600 }}>{l.serie}</div>}
                </div>
              </div>
            </div>
          ))}

          <div onClick={() => setShowForm(true)} className="masonry-item book-card" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", aspectRatio: "2/3", background: isDark ? "#1f1b2e" : "white", border: `2px dashed ${COR}`, borderRadius: 16, color: COR, gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: COR_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={24} /></div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Novo Título</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {livrosFiltrados.map((l: Livro) => (
            <div key={l.id} onClick={() => setLivroAberto(l)} className="book-card" style={{ background: cardBg, borderRadius: 16, border: `1px solid ${isDark ? '#2d2442' : '#f3e8ff'}`, padding: 16, display: "flex", gap: 16, cursor: "pointer", alignItems: "center" }}>
              {l.capaUrl
                ? <img src={l.capaUrl} alt="" style={{ width: 56, height: 80, objectFit: "cover", borderRadius: 10, flexShrink: 0, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }} />
                : <div style={{ width: 56, height: 80, background: COR_LIGHT, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>              }
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>{l.titulo}</div>
                    {l.serie && <div style={{ fontSize: 12, color: COR, fontWeight: 600 }}>{l.serie} {l.volume ? `(Vol. ${l.volume})` : ''}</div>}
                  </div>
                  <div style={{ fontSize: 18 }}>{l.favorito ? "💜" : ""}</div>
                </div>
                <div style={{ fontSize: 13, color: textSecondary, marginBottom: 8 }}>{l.autor}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: isDark ? "#1f1b2e" : COR_LIGHT, color: COR, fontWeight: 700 }}>
                    {l.status === "lido" ? "✅ Lido" : l.status === "lendo" ? "📖 Lendo" : "🔖 Quero ler"}
                  </span>
                  {l.genero && <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: `${generoCor(l.genero)}15`, color: generoCor(l.genero), fontWeight: 700 }}>{l.genero}</span>}
                  {l.nota && <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: isDark ? "#3b2a00" : "#fef3c7", color: "#f59e0b", fontWeight: 700 }}>⭐ {l.nota}/10</span>}
                </div>
              </div>
              <ChevronRight size={20} color={textSecondary} style={{ flexShrink: 0 }} />
            </div>
          ))}
          <button onClick={() => setShowForm(true)} style={{ background: "transparent", borderRadius: 16, border: `2px dashed ${COR}`, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: COR, fontSize: 15, cursor: "pointer", fontWeight: 700, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1f1b2e' : COR_LIGHT} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Plus size={20} /> Adicionar novo título
          </button>
        </div>
      )}

      {/* Modal Detalhes do Livro Elegante */}
      {livroAberto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setLivroAberto(null)}>
          <div style={{ background: cardBg, borderRadius: 32, padding: 32, maxWidth: 540, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
              {livroAberto.capaUrl
                ? <img src={livroAberto.capaUrl} alt="" style={{ width: 120, height: 175, objectFit: "cover", borderRadius: 16, flexShrink: 0, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }} />
                : <div style={{ width: 120, height: 175, background: COR_LIGHT, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📚</div>              }
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: textPrimary, lineHeight: 1.2, marginBottom: 8 }}>{livroAberto.titulo}</div>
                {livroAberto.serie && <div style={{ fontSize: 14, color: COR, fontWeight: 700, marginBottom: 4 }}>{livroAberto.serie} {livroAberto.volume ? `(Vol. ${livroAberto.volume})` : ''}</div>}
                <div style={{ fontSize: 14, color: textSecondary, fontWeight: 500 }}>{livroAberto.autor}</div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {livroAberto.genero && <div style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99, background: `${generoCor(livroAberto.genero)}15`, color: generoCor(livroAberto.genero), fontWeight: 700 }}>{livroAberto.genero}</div>}
                  {livroAberto.paginas && <div style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99, background: isDark ? "#1f1b2e" : "#f1f5f9", color: textSecondary, fontWeight: 700 }}>{livroAberto.paginas} {livroAberto.tipoProgresso === 'capitulos' ? 'cap.' : 'págs'}</div>}
                </div>

                <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                  <button onClick={() => toggleFavorito(livroAberto)} style={{ flex: 1, background: livroAberto.favorito ? `${COR}15` : (isDark ? "#1f1b2e" : "#f3f4f6"), border: "none", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: livroAberto.favorito ? COR : textSecondary, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
                    {livroAberto.favorito ? "💜 Favorito" : "🤍 Favoritar"}
                  </button>
                </div>
              </div>
            </div>

            {/* Tempo de Leitura */}
            {livroAberto.status === "lido" && livroAberto.dataInicio && livroAberto.dataFim && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: isDark ? "#1a1625" : "#f8fafc", padding: "12px 16px", borderRadius: 16, marginBottom: 20 }}>
                <Clock size={18} color={COR} />
                <span style={{ fontSize: 13, color: textPrimary, fontWeight: 600 }}>Lido em {calcularDiasLidos(livroAberto.dataInicio, livroAberto.dataFim)} dias</span>
                <span style={{ fontSize: 12, color: textSecondary, marginLeft: "auto" }}>{livroAberto.dataInicio.split('-').reverse().join('/')} - {livroAberto.dataFim.split('-').reverse().join('/')}</span>
              </div>
            )}

            {livroAberto.sinopse && (
              <div style={{ background: isDark ? "#1a1625" : "#faf5ff", borderRadius: 16, padding: 16, marginBottom: 20, fontSize: 14, color: isDark ? "#e2e8f0" : "#4c1d95", lineHeight: 1.7, border: `1px solid ${isDark ? '#2d2442' : '#e9d5ff'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, opacity: 0.7 }}>Sinopse</div>
                {livroAberto.sinopse}
              </div>
            )}

            {/* Diário de Leitura / Resenha */}
            {livroAberto.resenha && (
              <div style={{ background: isDark ? "#2d2442" : "#fdf4ff", borderRadius: 16, padding: 16, marginBottom: 24, fontSize: 14, color: isDark ? "#e2e8f0" : "#701a75", lineHeight: 1.7, borderLeft: `4px solid ${COR}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <BookText size={14} /> Minha Resenha & Teorias
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{livroAberto.resenha}</div>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Status</div>
              <div style={{ display: "flex", gap: 10 }}>
                {(["quero_ler", "lendo", "lido"] as const).map(s => (
                  <button key={s} onClick={() => { mudarStatus(livroAberto, s); setLivroAberto({ ...livroAberto, status: s }); }}
                    style={{ flex: 1, padding: "12px 8px", borderRadius: 14, border: "2px solid", borderColor: livroAberto.status === s ? COR : "transparent", background: livroAberto.status === s ? COR : (isDark ? "#1f1b2e" : "#f3f4f6"), color: livroAberto.status === s ? "white" : textSecondary, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                    {s === "quero_ler" ? "🔖 Quero ler" : s === "lendo" ? "📖 Lendo" : "✅ Lido"}
                  </button>
                ))}
              </div>
            </div>

            {/* Controle de Progresso Lendo */}
            {livroAberto.status === "lendo" && livroAberto.paginas && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                  <span>Progresso da Leitura</span>
                  <span style={{ color: COR }}>{livroAberto.paginasLidas || 0} / {livroAberto.paginas} {livroAberto.tipoProgresso === "capitulos" ? "cap." : "págs"}</span>
                </div>
                <input type="range" min="0" max={livroAberto.paginas} value={livroAberto.paginasLidas || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLivroAberto({...livroAberto, paginasLidas: val});
                    updateDoc(doc(db, "estante_livros", livroAberto.id), { paginasLidas: val });
                  }}
                  style={{ width: "100%", accentColor: COR, cursor: "pointer" }} />
              </div>
            )}

            {livroAberto.status === "lido" && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Sua Avaliação</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => { async function rate() { await updateDoc(doc(db, "estante_livros", livroAberto.id), { nota: n }); setLivroAberto({ ...livroAberto, nota: n }); }; rate(); }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: n <= (livroAberto.nota ?? 0) ? "#f59e0b" : (isDark ? "#1f1b2e" : "#f3f4f6"), color: n <= (livroAberto.nota ?? 0) ? "white" : textSecondary, fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all 0.1s" }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={() => excluir(livroAberto.id)} style={{ flex: 1, padding: "14px", borderRadius: 16, border: `1px solid ${isDark ? '#450a0a' : '#fecaca'}`, background: isDark ? "#2a0a0a" : "#fff5f5", color: "#ef4444", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Remover
              </button>
              <button onClick={() => setLivroAberto(null)} style={{ flex: 2, padding: "14px", borderRadius: 16, border: "none", background: COR, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 16px ${COR}40` }}>
                Fechar Diário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Livro/Série */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: cardBg, borderRadius: 32, padding: 32, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 24, fontWeight: 800, color: textPrimary, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ padding: 10, background: COR_LIGHT, borderRadius: 12, color: COR }}>✨</span>
              Novo Título
            </div>
            
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { label: "Título *", key: "titulo", placeholder: "Ex: A Vilã Reencarnada..." },
                { label: "Autor", key: "autor", placeholder: "Ex: Leticia Sousa" },
                { label: "URL da Capa", key: "capaUrl", placeholder: "Cole o link da imagem aqui..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}>{label}</div>
                  <input value={(form as any)[key] ?? ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", background: isDark ? "#1a1625" : "#f9fafb", border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", color: textPrimary, fontWeight: 500, transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = COR} onBlur={e => e.target.style.borderColor = isDark ? '#2d2442' : '#e5e7eb'} />
                </div>
              ))}
              
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}>Série / Coleção</div>
                  <input value={form.serie ?? ""} onChange={e => setForm(f => ({ ...f, serie: e.target.value }))} placeholder="Ex: O Segredo da Duquesa" style={{ width: "100%", background: isDark ? "#1a1625" : "#f9fafb", border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", color: textPrimary }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}>Volume</div>
                  <input type="number" value={form.volume ?? ""} onChange={e => setForm(f => ({ ...f, volume: Number(e.target.value) }))} placeholder="Ex: 3" style={{ width: "100%", background: isDark ? "#1a1625" : "#f9fafb", border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", color: textPrimary }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}>Gênero</div>
                  <input value={form.genero ?? ""} onChange={e => setForm(f => ({ ...f, genero: e.target.value }))} placeholder="Otome Isekai, Mangá..." style={{ width: "100%", background: isDark ? "#1a1625" : "#f9fafb", border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", color: textPrimary }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                    Tamanho
                    <div style={{ display: "flex", gap: 6 }}>
                       <span onClick={() => setForm({...form, tipoProgresso: "paginas"})} style={{ cursor: "pointer", color: form.tipoProgresso === "paginas" ? COR : textSecondary }}>Págs</span>
                       <span onClick={() => setForm({...form, tipoProgresso: "capitulos"})} style={{ cursor: "pointer", color: form.tipoProgresso === "capitulos" ? COR : textSecondary }}>Cap.</span>
                    </div>
                  </div>
                  <input type="number" value={form.paginas ?? ""} onChange={e => setForm(f => ({ ...f, paginas: Number(e.target.value) }))} placeholder={form.tipoProgresso === "capitulos" ? "Ex: 150 Capítulos" : "Ex: 320 Páginas"} style={{ width: "100%", background: isDark ? "#1a1625" : "#f9fafb", border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", color: textPrimary }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}>Sinopse Oficial</div>
                <textarea value={form.sinopse ?? ""} onChange={e => setForm(f => ({ ...f, sinopse: e.target.value }))} placeholder="Um resumo oficial..." rows={2} style={{ width: "100%", background: isDark ? "#1a1625" : "#f9fafb", border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", color: textPrimary }} />
              </div>
              
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 6 }}><BookText size={12} style={{ display: 'inline', marginRight: 4 }}/> Minha Resenha / Teorias</div>
                <textarea value={form.resenha ?? ""} onChange={e => setForm(f => ({ ...f, resenha: e.target.value }))} placeholder="Surtos, teorias sobre o plot, etc..." rows={3} style={{ width: "100%", background: isDark ? "#1a1625" : "#f9fafb", border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", color: textPrimary }} />
              </div>
            </div>

            <div style={{ margin: "24px 0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: textSecondary, marginBottom: 10 }}>Status da Leitura</div>
              <div style={{ display: "flex", gap: 10 }}>
                {(["quero_ler", "lendo", "lido"] as const).map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                    style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: "2px solid", borderColor: form.status === s ? COR : "transparent", background: form.status === s ? `${COR}15` : (isDark ? "#1a1625" : "#f3f4f6"), color: form.status === s ? COR : textSecondary, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                    {s === "quero_ler" ? "Quero ler" : s === "lendo" ? "Lendo" : "Lido"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "14px", borderRadius: 16, border: `2px solid ${isDark ? '#2d2442' : '#e5e7eb'}`, background: "transparent", color: textSecondary, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvar} style={{ flex: 2, padding: "14px", borderRadius: 16, border: "none", background: `linear-gradient(135deg, ${COR}, ${COR_DARK})`, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 16px ${COR}40` }}>Salvar na Estante</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Funções Frases e MetaLeitura permanecem as mesmas que te mandei antes, basta conectá-las!
function Frases({ frases, isDark }: { frases: Frase[]; isDark: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Frase>>({});
  const cardBg = isDark ? "#151120" : "white";
  const textPrimary = isDark ? "white" : "#1e1b2e";
  
  async function salvar() {
    if (!form.texto || !form.livro) return;
    await addDoc(collection(db, "estante_frases"), { ...form, criadoEm: new Date().toISOString() });
    setShowForm(false); setForm({});
  }
  async function excluir(id: string) {
    if (!confirm("Remover esta frase marcante?")) return;
    await deleteDoc(doc(db, "estante_frases", id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>Coleção de Frases</div>
        <button onClick={() => setShowForm(true)} style={{ background: COR, color: "white", border: "none", borderRadius: 14, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 4px 12px ${COR}40` }}>
          <Plus size={16} /> Nova Marcação
        </button>
      </div>
      <div style={{ columns: "auto 300px", columnGap: 24 }}>
        {frases.map(frase => (
          <div key={frase.id} className="book-card" style={{ breakInside: "avoid", background: cardBg, borderRadius: 24, border: `1px solid ${isDark ? '#2d2442' : '#f3e8ff'}`, padding: 24, marginBottom: 24, position: "relative" }}>
            <Quote size={32} color={COR} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontSize: 15, color: textPrimary, lineHeight: 1.6, fontStyle: "italic", marginBottom: 16, fontWeight: 500 }}>{frase.texto}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "#8b83a3", fontWeight: 600 }}>— {frase.livro}{frase.autor ? `, ${frase.autor}` : ""}</div>
              <button onClick={() => excluir(frase.id)} style={{ background: "none", border: "none", color: isDark ? "#450a0a" : "#fee2e2", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = isDark ? "#450a0a" : "#fee2e2"}><Star size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaLeitura({ meta, lidos, progressoMeta, isDark, onSalvar }: any) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${COR}, ${COR_DARK})`, borderRadius: 32, padding: 40, color: "white", textAlign: "center", boxShadow: `0 20px 40px ${COR}40` }}>
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Minha Meta Anual de {meta.ano}</div>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, textShadow: "0 10px 20px rgba(0,0,0,0.2)" }}>{lidos.length}</div>
        <div style={{ fontSize: 20, opacity: 0.9, marginBottom: 32, fontWeight: 600 }}>de {meta.meta} livros concluídos</div>
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 99, height: 16, overflow: "hidden", maxWidth: 400, margin: "0 auto" }}>
          <div style={{ height: "100%", width: `${progressoMeta}%`, background: "white", borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.9, marginTop: 16 }}>
          {progressoMeta >= 100 ? "🎉 Você arrasou! Meta batida com sucesso!" : `Faltam apenas ${meta.meta - lidos.length} livros para o topo!`}
        </div>
    </div>
  );
}