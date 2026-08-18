"use client";

import { useState, useEffect } from "react";
import { Plus, Star, User, BookOpen, CheckCircle, Clock, Eye, Sparkles, Trash2, Repeat, XCircle, RotateCcw, Search } from "lucide-react";
import { salvarLivro, atualizarLivro, updateConfig, excluirLivro, registrarAtividade } from "@/lib/db";
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

const NOME = { jovanna: "Jovanna", leticia: "Leticia" } as const;
const STATUS_LABELS = { planejado: "Planejado", lendo: "Lendo", trocar: "Prontos pra trocar", concluido: "Concluído", abandonado: "Abandonado" };

export default function ModuloBiblioteca({ livros, config, usuario }: Props) {
  const cor = COR[usuario];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Livro>>({ status: "planejado", sugeridoPor: usuario });
  const [livroDetalhes, setLivroDetalhes] = useState<Livro | null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [livroSorteado, setLivroSorteado] = useState<Livro | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Livro>>({});
  const [busca, setBusca] = useState("");

  const buscaNorm = busca.trim().toLowerCase();
  const filtrar = (lista: Livro[]) => buscaNorm
    ? lista.filter(l => l.titulo.toLowerCase().includes(buscaNorm) || l.autor?.toLowerCase().includes(buscaNorm))
    : lista;

  const planejados  = filtrar(livros.filter(l => l.status === "planejado"));
  const lendo       = filtrar(livros.filter(l => l.status === "lendo"));
  const trocar      = filtrar(livros.filter(l => l.status === "trocar"));
  const concluidos  = filtrar(livros.filter(l => l.status === "concluido"));
  const abandonados = filtrar(livros.filter(l => l.status === "abandonado"));

  function jaLeu(livro: Livro, u: UserId) {
    return u === "jovanna" ? livro.notaJovanna != null : livro.notaLeticia != null;
  }

  async function salvar() {
    if (!form.titulo) return;
    await salvarLivro({ ...form, status: form.status ?? "planejado" } as Omit<Livro,"id">);
    setShowForm(false);
    setForm({ status: "planejado", sugeridoPor: usuario });
  }

  async function definirComoAtual(id: string) {
    const hoje = new Date().toISOString().split("T")[0];
    const campoConfig = usuario === "jovanna" ? "livroAtualIdJovanna" : "livroAtualIdLeticia";
    const campoData   = usuario === "jovanna" ? "dataInicioJovanna"  : "dataInicioLeticia";
    await updateConfig({ [campoConfig]: id } as Partial<ConfigApp>);
    await atualizarLivro(id, { status: "lendo", leitorAtual: usuario, [campoData]: hoje } as Partial<Livro>);
    if (trocar.some(l => l.id === id)) {
      await registrarAtividade({ tipo: "troca", usuario, livroId: id, livroTitulo: trocar.find(l=>l.id===id)?.titulo ?? "" });
    }
    setLivroSorteado(null);
  }

  async function desistir(livro: Livro) {
    if (!confirm(`Tem certeza que quer desistir de "${livro.titulo}"?`)) return;
    const leitor = livro.leitorAtual ?? usuario;
    const campoConfig = leitor === "jovanna" ? "livroAtualIdJovanna" : "livroAtualIdLeticia";
    await atualizarLivro(livro.id, { status: "abandonado", leitorAtual: undefined });
    await updateConfig({ [campoConfig]: "" } as Partial<ConfigApp>);
    setLivroDetalhes(null);
  }

  async function recomecar(livro: Livro) {
    await atualizarLivro(livro.id, { status: "planejado" });
    setLivroDetalhes(null);
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

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          className="input pl-10"
          placeholder="Buscar por título ou autor..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* Roleta */}
      {!buscaNorm && (
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
      )}

      {/* Lendo agora — uma card por pessoa que está lendo */}
      {lendo.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[#9a8f8f] uppercase tracking-wider mb-3">Lendo agora</h2>
          <div className="space-y-4">
            {lendo.map(livro => {
              const leitor = livro.leitorAtual ?? usuario;
              const corLeitor = COR[leitor];
              const dataInicio = leitor === "jovanna" ? livro.dataInicioJovanna : livro.dataInicioLeticia;
              return (
                <div key={livro.id} className="card p-5 space-y-4" style={{ borderTop: `4px solid ${corLeitor.primary}` }}>
                  <div className="flex gap-4">
                    {livro.capaUrl && (
                      <img src={livro.capaUrl} alt="capa" className="w-20 h-28 object-cover rounded-lg shadow-sm flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="badge-gray mb-1 inline-block" style={{ color: corLeitor.primary, backgroundColor: corLeitor.bg }}>
                        {NOME[leitor]} está lendo
                      </span>
                      <h3 className="font-serif text-xl font-semibold text-[#2d2d2d]">{livro.titulo}</h3>
                      <p className="text-sm text-[#9a8f8f] mb-2">{livro.autor}</p>
                      {livro.sinopse && <p className="text-sm text-gray-600 line-clamp-3">{livro.sinopse}</p>}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {livro.genero && <span className="badge-rose">{livro.genero}</span>}
                        {dataInicio && <span className="badge-gray">Iniciado em {dataInicio}</span>}
                        {livro.totalCapitulos && <span className="badge-gray">{livro.totalCapitulos} capítulos</span>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setLivroDetalhes(livro)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                          <Eye size={12} /> Ver detalhes completos
                        </button>
                        <button onClick={() => desistir(livro)} className="text-xs py-1.5 px-3 rounded-xl font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                          <XCircle size={12} /> Desistir
                        </button>
                      </div>
                    </div>
                  </div>
                  {livro.totalCapitulos && (
                    <ProgressoCapitulos livroId={livro.id} totalCapitulos={livro.totalCapitulos} cor={corLeitor.primary} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Prontos pra trocar — uma já leu, esperando a outra pegar */}
      {trocar.length > 0 && (
        <Section title="Prontos pra trocar" icon={<Repeat size={15}/>} count={trocar.length}>
          {trocar.map(l => {
            const quemJaLeu: UserId = l.notaJovanna != null ? "jovanna" : "leticia";
            const euJaLi = jaLeu(l, usuario);
            return (
              <LivroCard key={l.id} livro={l} renderStars={renderStars}
                extra={
                  <p className="text-xs mt-1" style={{ color: COR[quemJaLeu].primary }}>
                    {NOME[quemJaLeu]} já leu e deu nota {quemJaLeu === "jovanna" ? l.notaJovanna : l.notaLeticia}/10 — agora é a vez de {NOME[quemJaLeu === "jovanna" ? "leticia" : "jovanna"]}!
                  </p>
                }
                actions={
                  euJaLi ? (
                    <p className="text-xs text-[#9a8f8f] mt-2 italic">Você já leu este — esperando {NOME[quemJaLeu === "jovanna" ? "leticia" : "jovanna"]}.</p>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => definirComoAtual(l.id)}
                        className="text-white text-xs py-1.5 px-3 rounded-xl font-medium transition-all active:scale-95 flex items-center gap-1"
                        style={{ backgroundColor: cor.primary }}
                      ><Repeat size={12}/> Agora é sua vez de ler</button>
                      <button onClick={() => setLivroDetalhes(l)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                        <Eye size={12}/> Detalhes
                      </button>
                    </div>
                  )
                }
              />
            );
          })}
        </Section>
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

      {abandonados.length > 0 && (
        <Section title="Abandonados" icon={<XCircle size={15}/>} count={abandonados.length}>
          {abandonados.map(l => (
            <LivroCard key={l.id} livro={l} renderStars={renderStars}
              actions={
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => recomecar(l)}
                    className="text-white text-xs py-1.5 px-3 rounded-xl font-medium transition-all active:scale-95 flex items-center gap-1"
                    style={{ backgroundColor: cor.primary }}
                  ><RotateCcw size={12}/> Recomeçar depois</button>
                  <button onClick={() => setLivroDetalhes(l)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                    <Eye size={12}/> Detalhes
                  </button>
                </div>
              }
            />
          ))}
        </Section>
      )}

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
            <BuscaLivroOnline onSelecionar={dados => setForm(f => ({ ...f, ...dados }))} />
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-[#9a8f8f] mb-2">Ou preencha manualmente:</p>
            </div>
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
                <BuscaLivroOnline onSelecionar={dados => setEditForm(f => ({ ...f, ...dados }))} />
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
                {(livroDetalhes.status === "concluido" || livroDetalhes.status === "trocar") && (
                  <div className="border-t pt-3 space-y-2">
                    {livroDetalhes.notaJovanna != null && (
                      <div className="flex gap-2 text-xs text-[#9a8f8f]">
                        <span>Jovanna leu {livroDetalhes.dataInicioJovanna && `de ${livroDetalhes.dataInicioJovanna} `}
                          {livroDetalhes.dataFimJovanna && `até ${livroDetalhes.dataFimJovanna}`}</span>
                      </div>
                    )}
                    {livroDetalhes.notaLeticia != null && (
                      <div className="flex gap-2 text-xs text-[#9a8f8f]">
                        <span>Leticia leu {livroDetalhes.dataInicioLeticia && `de ${livroDetalhes.dataInicioLeticia} `}
                          {livroDetalhes.dataFimLeticia && `até ${livroDetalhes.dataFimLeticia}`}</span>
                      </div>
                    )}
                    <div className="flex gap-4 text-sm p-3 rounded-xl" style={{ backgroundColor: cor.bg, border: `1px solid ${cor.border}` }}>
                      {livroDetalhes.notaJovanna != null && <span>Nota Jovanna: <strong className="text-[#e07a5f]">{livroDetalhes.notaJovanna}/10</strong></span>}
                      {livroDetalhes.notaLeticia != null && <span>Nota Leticia: <strong className="text-[#81b29a]">{livroDetalhes.notaLeticia}/10</strong></span>}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2 flex-col">
                  <button onClick={() => abrirEdicao(livroDetalhes)} className="w-full text-white py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: cor.primary }}>Editar informações</button>
                  {livroDetalhes.status === "lendo" && (
                    <button
                      onClick={() => desistir(livroDetalhes)}
                      className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Desistir deste livro
                    </button>
                  )}
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

interface ResultadoBusca {
  id: string;
  titulo: string;
  autor: string;
  capaUrl: string;
  sinopse: string;
  genero: string;
}

async function buscarGoogleBooks(busca: string): Promise<ResultadoBusca[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(busca)}&country=BR&maxResults=6`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`google books ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((item: { id: string; volumeInfo?: { title?: string; authors?: string[]; description?: string; categories?: string[]; imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }) => {
    const info = item.volumeInfo ?? {};
    return {
      id: item.id,
      titulo: info.title ?? "",
      autor: (info.authors ?? []).join(", "),
      capaUrl: (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "").replace("http://", "https://"),
      sinopse: info.description ?? "",
      genero: info.categories?.[0] ?? "",
    };
  });
}

async function buscarOpenLibrary(busca: string): Promise<ResultadoBusca[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(busca)}&language=por&limit=6`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`open library ${res.status}`);
  const data = await res.json();
  const docs = (data.docs ?? []) as { key: string; title?: string; author_name?: string[]; cover_i?: number; subject?: string[] }[];
  return docs.map(d => ({
    id: d.key,
    titulo: d.title ?? "",
    autor: (d.author_name ?? []).join(", "),
    capaUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "",
    sinopse: "",
    genero: d.subject?.[0] ?? "",
  }));
}

function BuscaLivroOnline({ onSelecionar }: { onSelecionar: (dados: Partial<Livro>) => void }) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(false);

  async function pesquisar() {
    if (!busca.trim()) return;
    setBuscando(true);
    setErro(false);
    setResultados([]);
    try {
      const res = await buscarGoogleBooks(busca);
      setResultados(res);
    } catch {
      try {
        const res = await buscarOpenLibrary(busca);
        setResultados(res);
      } catch {
        setErro(true);
      }
    } finally {
      setBuscando(false);
    }
  }

  function selecionar(item: ResultadoBusca) {
    onSelecionar({
      titulo: item.titulo,
      autor: item.autor,
      capaUrl: item.capaUrl,
      sinopse: item.sinopse,
      genero: item.genero,
    });
    setResultados([]);
    setBusca("");
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-[#9a8f8f] font-medium flex items-center gap-1"><Search size={12}/> Buscar livro online (preenche automático)</label>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Título ou autor..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pesquisar(); } }}
        />
        <button type="button" onClick={pesquisar} disabled={buscando || !busca.trim()}
          className="btn-ghost px-4 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40">
          {buscando ? "Buscando..." : <><Search size={14}/> Buscar</>}
        </button>
      </div>
      {erro && <p className="text-xs text-red-500">Não consegui buscar agora. Preencha manualmente abaixo.</p>}
      {!erro && !buscando && busca && resultados.length === 0 && (
        <p className="text-xs text-[#9a8f8f]">Nenhum resultado ainda — aperte Buscar ou Enter.</p>
      )}
      {resultados.length > 0 && (
        <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-100 rounded-xl p-1.5">
          {resultados.map(item => (
            <button key={item.id} type="button" onClick={() => selecionar(item)}
              className="w-full flex gap-3 items-center p-1.5 rounded-lg hover:bg-gray-50 text-left transition-colors">
              {item.capaUrl
                ? <img src={item.capaUrl} alt="" className="w-8 h-11 object-cover rounded flex-shrink-0" />
                : <div className="w-8 h-11 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center"><BookOpen size={12} className="text-gray-300"/></div>}
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#2d2d2d] truncate">{item.titulo || "Sem título"}</p>
                <p className="text-xs text-[#9a8f8f] truncate">{item.autor || "Autor desconhecido"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}