"use client";

import { useState, useEffect } from "react";
import { Plus, Star, User, BookOpen, CheckCircle, Clock, Eye, Sparkles, Trash2 } from "lucide-react";
import { salvarLivro, atualizarLivro, updateConfig, excluirLivro} from "@/lib/db";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { Livro, ConfigApp, UserId } from "@/types";

interface Props {
  livros: Livro[];
  config: ConfigApp | null;
  usuario: UserId;
}

const COR = {
  jovanna: { primary: "#e07a5f", hover: "#c45f44", bg: "#fdf0ec", border: "#e07a5f4d", light: "#fdf0ec" },
  leticia: { primary: "#81b29a", hover: "#5f8f7a", bg: "#eef5f1", border: "#81b29a4d", light: "#eef5f1" },
};

const STATUS_LABELS = { planejado: "Planejado", lendo: "Lendo", concluido: "Concluído" };

export default function ModuloBiblioteca({ livros, config, usuario }: Props) {
  const cor = COR[usuario];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Livro>>({ status: "planejado", sugeridoPor: usuario });
  const [livroDetalhes, setLivroDetalhes] = useState<Livro | null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [livroSorteado, setLivroSorteado] = useState<Livro | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Livro>>({});

  const planejados = livros.filter(l => l.status === "planejado");
  const lendo      = livros.filter(l => l.status === "lendo");
  const concluidos = livros.filter(l => l.status === "concluido");
  const atual      = livros.find(l => l.id === config?.livroAtualId);

  async function salvar() {
    if (!form.titulo) return;
    await salvarLivro({ ...form, status: form.status ?? "planejado" } as Omit<Livro,"id">);
    setShowForm(false);
    setForm({ status: "planejado", sugeridoPor: usuario });
  }

  async function definirComoAtual(id: string) {
    await updateConfig({ livroAtualId: id });
    await atualizarLivro(id, { status: "lendo", dataInicio: new Date().toISOString().split("T")[0] });
    setLivroSorteado(null);
  }

  function rodarRoleta() {
    if (planejados.length === 0) return alert("Adicione livros na lista de 'Planejados' para poder sortear!");
    setSorteando(true);
    setLivroSorteado(null);
    let giros = 0;
    const intervalo = setInterval(() => {
      setLivroSorteado(planejados[Math.floor(Math.random() * planejados.length)]);
      giros++;
      if (giros > 12) { clearInterval(intervalo); setSorteando(false); }
    }, 100);
  }

  async function salvarEdicao() {
    if (!editForm.id) return;
    await atualizarLivro(editForm.id, editForm);
    setLivroDetalhes(editForm as Livro);
    setIsEditing(false);
  }

  function abrirEdicao(livro: Livro) {
    setEditForm(livro);
    setIsEditing(true);
  }

  function renderStars(nota?: number) {
    if (!nota) return null;
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <Star key={n} size={10} className={n <= nota ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Roleta */}
      <section className="card p-6 space-y-4" style={{ background: `linear-gradient(135deg, ${cor.bg}, white)`, border: `2px solid ${cor.border}` }}>
        <div className="flex items-center gap-2 justify-center text-center">
          <Sparkles style={{ color: cor.primary }} className="animate-pulse" size={24} />
          <h2 className="font-serif text-xl font-semibold" style={{ color: cor.primary }}>Roleta: Qual o próximo livro?</h2>
        </div>
        <p className="text-xs text-gray-600 text-center max-w-sm mx-auto">Deixe o destino escolher qual será a próxima obra que vamos explorar juntas.</p>

        <button
          onClick={rodarRoleta}
          disabled={sorteando}
          className="w-full disabled:bg-gray-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: sorteando ? undefined : cor.primary }}
          onMouseEnter={e => { if (!sorteando) (e.target as HTMLElement).style.backgroundColor = cor.hover; }}
          onMouseLeave={e => { if (!sorteando) (e.target as HTMLElement).style.backgroundColor = cor.primary; }}
        >
          <Sparkles size={18} /> {sorteando ? "Sorteando..." : "Girar Roleta"}
        </button>

        {livroSorteado && !sorteando && (
          <div className="mt-6 p-4 bg-white rounded-2xl shadow-md animate-fade-in space-y-3 text-center max-w-sm mx-auto" style={{ border: `1px solid ${cor.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: cor.primary }}>Livro sorteado!</p>
            {livroSorteado.capaUrl && (
              <img src={livroSorteado.capaUrl} alt="Capa sorteada" className="w-24 h-32 object-cover rounded-xl shadow-sm mx-auto" />
            )}
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2d2d2d]">{livroSorteado.titulo}</h3>
              <p className="text-xs text-gray-500">{livroSorteado.autor}</p>
            </div>
            <div className="flex gap-2 pt-2 flex-col">
              <button
                onClick={() => definirComoAtual(livroSorteado.id)}
                className="w-full text-white py-3 rounded-xl text-xs font-bold transition-colors"
                style={{ backgroundColor: cor.primary }}
              >Começar a ler este livro</button>
              <button onClick={() => setLivroDetalhes(livroSorteado)} className="w-full bg-transparent hover:bg-gray-50 text-gray-600 border border-gray-200 py-3 rounded-xl text-xs font-bold transition-colors">Ver detalhes</button>
              <button onClick={() => setLivroSorteado(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-xs font-bold transition-colors">Fechar sorteio</button>
            </div>
          </div>
        )}
      </section>

      {/* Lendo agora */}
      {atual && (
        <section>
          <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Lendo agora</h2>
          <div className="card p-5 space-y-4" style={{ borderTop: `4px solid ${cor.primary}` }}>
            <div className="flex gap-4">
              {atual.capaUrl && (
                <img src={atual.capaUrl} alt="capa" className="w-20 h-28 object-cover rounded-lg shadow-sm flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-xl font-semibold text-[#2d2d2d]">{atual.titulo}</h3>
                <p className="text-sm text-[#9a8f8f] mb-2">{atual.autor}</p>
                {atual.sinopse && <p className="text-sm text-gray-600 line-clamp-3">{atual.sinopse}</p>}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {atual.genero && <span className="badge-rose">{atual.genero}</span>}
                  {atual.dataInicio && <span className="badge-gray">Iniciado em {atual.dataInicio}</span>}
                  {atual.totalCapitulos && <span className="badge-gray">{atual.totalCapitulos} capítulos</span>}
                </div>
                <button onClick={() => setLivroDetalhes(atual)} className="btn-ghost text-xs py-1.5 px-3 mt-3 flex items-center gap-1.5">
                  <Eye size={12} /> Ver detalhes completos
                </button>
              </div>
            </div>
            {atual.totalCapitulos && (
              <ProgressoCapitulos livroId={atual.id} totalCapitulos={atual.totalCapitulos} cor={cor.primary} />
            )}
          </div>
        </section>
      )}

      <Section title="Planejados" icon={<Clock size={15}/>} count={planejados.length}>
        {planejados.map(l => (
          <LivroCard key={l.id} livro={l} renderStars={renderStars}
            actions={
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => definirComoAtual(l.id)}
                  className="text-white text-xs py-1.5 px-3 rounded-xl font-medium transition-all active:scale-95"
                  style={{ backgroundColor: cor.primary }}
                >Começar a ler</button>
                <button onClick={() => setLivroDetalhes(l)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                  <Eye size={12}/> Detalhes
                </button>
              </div>
            }
          />
        ))}
      </Section>

      <Section title="Concluídos" icon={<CheckCircle size={15}/>} count={concluidos.length}>
        {concluidos.map(l => (
          <LivroCard key={l.id} livro={l} renderStars={renderStars}
            actions={
              <button onClick={() => setLivroDetalhes(l)} className="btn-ghost text-xs py-1.5 px-3 mt-2 flex items-center gap-1">
                <Eye size={12}/> Ver memórias / detalhes
              </button>
            }
            extra={
              <div className="flex gap-4 mt-2 text-xs text-[#9a8f8f]">
                {l.notaJovanna != null && <span>Jovanna: <strong className="text-[#e07a5f]">{l.notaJovanna}/10</strong></span>}
                {l.notaLeticia != null && <span>Leticia: <strong className="text-[#81b29a]">{l.notaLeticia}/10</strong></span>}
              </div>
            }
          />
        ))}
      </Section>

      <button
        onClick={() => setShowForm(true)}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-2 text-sm text-[#9a8f8f] transition-colors"
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cor.primary; (e.currentTarget as HTMLElement).style.color = cor.primary; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.color = "#9a8f8f"; }}
      >
        <Plus size={18} /> Adicionar livro
      </button>

      {/* Modal novo livro */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 space-y-3 bg-white max-h-[85vh] overflow-y-auto">
            <h3 className="font-semibold text-lg">Novo livro</h3>
            <input className="input" placeholder="Título *" value={form.titulo??""} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} />
            <input className="input" placeholder="Autor" value={form.autor??""} onChange={e=>setForm(f=>({...f,autor:e.target.value}))} />
            <input className="input" placeholder="URL da capa" value={form.capaUrl??""} onChange={e=>setForm(f=>({...f,capaUrl:e.target.value}))} />
            <input className="input" placeholder="Gênero" value={form.genero??""} onChange={e=>setForm(f=>({...f,genero:e.target.value}))} />
            <input className="input" type="number" placeholder="Nº de capítulos" value={form.totalCapitulos??""} onChange={e=>setForm(f=>({...f,totalCapitulos:Number(e.target.value)}))} />
            <textarea className="textarea" rows={2} placeholder="Sinopse" value={form.sinopse??""} onChange={e=>setForm(f=>({...f,sinopse:e.target.value}))} />
            <textarea className="textarea" rows={2} placeholder="Motivo da escolha" value={form.motivoEscolha??""} onChange={e=>setForm(f=>({...f,motivoEscolha:e.target.value}))} />
            <div>
              <label className="text-xs text-[#9a8f8f] mb-1 block">Sugerido por</label>
              <div className="flex gap-2">
                {(["jovanna","leticia"] as const).map(u=>(
                  <button key={u} onClick={()=>setForm(f=>({...f,sugeridoPor:u}))}
                    className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                    style={form.sugeridoPor===u ? { backgroundColor: COR[u].primary, color: "white", borderColor: COR[u].primary } : {}}>
                    {u==="jovanna"?"Jovanna":"Leticia"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={()=>setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={salvar} className="btn-primary flex-1">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhes */}
      {livroDetalhes && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-4 bg-white relative max-h-[85vh] overflow-y-auto shadow-2xl" style={{ borderTop: `4px solid ${cor.primary}` }}>
            {isEditing ? (
              <div className="space-y-3">
                <h3 className="font-serif text-xl font-semibold text-center border-b pb-2">Editar Informações</h3>
                <input className="input" placeholder="Título *" value={editForm.titulo||""} onChange={e=>setEditForm(f=>({...f,titulo:e.target.value}))} />
                <input className="input" placeholder="Autor" value={editForm.autor||""} onChange={e=>setEditForm(f=>({...f,autor:e.target.value}))} />
                <input className="input" placeholder="URL da capa" value={editForm.capaUrl||""} onChange={e=>setEditForm(f=>({...f,capaUrl:e.target.value}))} />
                <input className="input" placeholder="Gênero" value={editForm.genero||""} onChange={e=>setEditForm(f=>({...f,genero:e.target.value}))} />
                <input className="input" type="number" placeholder="Nº de capítulos" value={editForm.totalCapitulos||""} onChange={e=>setEditForm(f=>({...f,totalCapitulos:Number(e.target.value)}))} />
                <textarea className="textarea" rows={2} placeholder="Sinopse" value={editForm.sinopse||""} onChange={e=>setEditForm(f=>({...f,sinopse:e.target.value}))} />
                <textarea className="textarea" rows={2} placeholder="Motivo da escolha" value={editForm.motivoEscolha||""} onChange={e=>setEditForm(f=>({...f,motivoEscolha:e.target.value}))} />
                <div>
                  <label className="text-xs text-[#9a8f8f] mb-1 block">Sugerido por</label>
                  <div className="flex gap-2">
                    {(["jovanna","leticia"] as const).map(u=>(
                      <button key={u} onClick={()=>setEditForm(f=>({...f,sugeridoPor:u}))}
                        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                        style={editForm.sugeridoPor===u ? { backgroundColor: COR[u].primary, color: "white", borderColor: COR[u].primary } : {}}>
                        {u==="jovanna"?"Jovanna":"Leticia"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 flex-col">
                  <button onClick={salvarEdicao} className="w-full text-white py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: cor.primary }}>Salvar alterações</button>
                  <button onClick={() => setIsEditing(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-bold transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-2xl font-semibold text-[#2d2d2d] text-center border-b pb-3">{livroDetalhes.titulo}</h3>
                {livroDetalhes.capaUrl && (
                  <img src={livroDetalhes.capaUrl} alt="capa" className="w-36 h-52 object-cover rounded-xl shadow-md mx-auto" />
                )}
                <div>
                  <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider">Autor</p>
                  <p className="text-sm font-medium text-gray-800">{livroDetalhes.autor || "Não informado"}</p>
                </div>
                {livroDetalhes.sinopse && (
                  <div>
                    <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider">Sinopse</p>
                    <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-3 rounded-xl leading-relaxed">{livroDetalhes.sinopse}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {livroDetalhes.genero && (
                    <div>
                      <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider">Gênero</p>
                      <span className="badge-rose mt-1 inline-block text-xs">{livroDetalhes.genero}</span>
                    </div>
                  )}
                  {livroDetalhes.totalCapitulos && (
                    <div>
                      <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider">Total de capítulos</p>
                      <span className="badge-gray mt-1 inline-block text-xs">{livroDetalhes.totalCapitulos} caps</span>
                    </div>
                  )}
                </div>
                {livroDetalhes.motivoEscolha && (
                  <div>
                    <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider">Motivo da escolha</p>
                    <p className="text-xs text-gray-600 mt-1 italic bg-gray-50 p-3 rounded-xl">"{livroDetalhes.motivoEscolha}"</p>
                  </div>
                )}
                {livroDetalhes.sugeridoPor && (
                  <div>
                    <p className="text-xs font-bold text-[#9a8f8f] uppercase tracking-wider">Sugestão</p>
                    <p className="text-xs text-gray-700 mt-1 flex items-center gap-1 font-medium">
                      <User size={12}/> Sugerido por {livroDetalhes.sugeridoPor === "jovanna" ? "Jovanna" : "Leticia"}
                    </p>
                  </div>
                )}
                {livroDetalhes.status === "concluido" && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex gap-2 text-xs text-[#9a8f8f]">
                      {livroDetalhes.dataInicio && <span>Lido de {livroDetalhes.dataInicio}</span>}
                      {livroDetalhes.dataFim && <span>até {livroDetalhes.dataFim}</span>}
                    </div>
                    <div className="flex gap-4 text-sm p-3 rounded-xl" style={{ backgroundColor: cor.bg, border: `1px solid ${cor.border}` }}>
                      {livroDetalhes.notaJovanna != null && <span>Nota Jovanna: <strong className="text-[#e07a5f]">{livroDetalhes.notaJovanna}/10</strong></span>}
                      {livroDetalhes.notaLeticia != null && <span>Nota Leticia: <strong className="text-[#81b29a]">{livroDetalhes.notaLeticia}/10</strong></span>}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2 flex-col">
                  <button onClick={() => abrirEdicao(livroDetalhes)} className="w-full text-white py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: cor.primary }}>Editar informações</button>
                  <button
                    onClick={async () => {
                      if (confirm("Tem certeza que deseja excluir este livro?")) {
                        await excluirLivro(livroDetalhes.id);
                        setLivroDetalhes(null);
                      }
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Excluir livro
                  </button>
                  <button onClick={() => setLivroDetalhes(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-bold transition-colors">Fechar detalhes</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressoCapitulos({ livroId, totalCapitulos, cor }: { livroId: string; totalCapitulos: number; cor: string }) {
  const [capsConcluidos, setCapsConcluidos] = useState<number[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "livros", livroId, "capitulos"), (snapshot) => {
      const concluidos: number[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.jovanna_enviou && data.leticia_enviou) concluidos.push(Number(doc.id));
      });
      setCapsConcluidos(concluidos);
    });
    return () => unsubscribe();
  }, [livroId]);

  const arrayCapitulos = Array.from({ length: totalCapitulos }, (_, i) => i + 1);
  const qtdConcluidos = capsConcluidos.length;
  const porcentagem = totalCapitulos > 0 ? Math.round((qtdConcluidos / totalCapitulos) * 100) : 0;

  return (
    <div className="border-t pt-4 space-y-3 bg-gray-50 p-4 rounded-2xl animate-fade-in">
      <div className="flex justify-between text-xs font-bold text-[#9a8f8f] uppercase tracking-wider">
        <span>Progresso de leitura</span>
        <span style={{ color: cor }}>{porcentagem}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${porcentagem}%`, backgroundColor: cor }} />
      </div>
      <p className="text-xs font-bold text-[#2d2d2d]">
        Capítulos concluídos: {qtdConcluidos} de {totalCapitulos}
      </p>
      <div className="grid grid-cols-5 gap-2 pt-2">
        {arrayCapitulos.map((cap) => {
          const isConcluido = capsConcluidos.includes(cap);
          return (
            <div
              key={cap}
              className="py-2 rounded-xl text-center font-bold text-xs border transition-all flex items-center justify-center gap-1"
              style={isConcluido ? { backgroundColor: `${cor}20`, borderColor: cor, color: cor } : {}}
            >
              {isConcluido ? <CheckCircle size={12} /> : null}
              Cap {cap}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 mb-3 w-full text-left">
        <span className="text-[#9a8f8f]">{icon}</span>
        <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider">{title}</h2>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
        <span className="ml-auto text-gray-300 text-xs">{open?"▲":"▼"}</span>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </section>
  );
}

function LivroCard({ livro, renderStars, actions, extra }: {
  livro: Livro;
  renderStars: (n?: number) => React.ReactNode;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex gap-3">
        {livro.capaUrl
          ? <img src={livro.capaUrl} alt="capa" className="w-12 h-16 object-cover rounded-md shadow-sm flex-shrink-0" />
          : <div className="w-12 h-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center"><BookOpen size={20} className="text-gray-300"/></div>
        }
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#2d2d2d] truncate">{livro.titulo}</h3>
          <p className="text-xs text-[#9a8f8f]">{livro.autor}</p>
          {livro.motivoEscolha && <p className="text-xs text-gray-500 mt-1 italic">"{livro.motivoEscolha}"</p>}
          {livro.sugeridoPor && (
            <p className="text-xs text-[#9a8f8f] mt-1 flex items-center gap-1">
              <User size={11}/> sugestão de {livro.sugeridoPor === "jovanna" ? "Jovanna" : "Leticia"}
            </p>
          )}
          {extra}
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </div>
  );
}